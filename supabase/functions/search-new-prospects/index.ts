import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { instagram_user_id } = await req.json()

    if (!instagram_user_id) {
      return new Response(
        JSON.stringify({ error: 'instagram_user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Iniciando búsqueda de nuevos prospectos para usuario: ${instagram_user_id}`)

    // 1. Verificar límite de búsquedas diarias (máximo 5)
    const { data: searchCountData, error: searchCountError } = await supabase
      .rpc('get_daily_search_count', { p_instagram_user_id: instagram_user_id })

    if (searchCountError) {
      console.error('Error verificando contador de búsquedas:', searchCountError)
      throw searchCountError
    }

    const currentSearchCount = searchCountData || 0
    console.log(`📊 Búsquedas realizadas hoy: ${currentSearchCount}/5`)

    if (currentSearchCount >= 5) {
      return new Response(
        JSON.stringify({ 
          error: 'Límite diario alcanzado',
          message: 'Has alcanzado el límite de 5 búsquedas por día. Inténtalo mañana.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Obtener las keywords del ICP del usuario
    const { data: icpData, error: icpError } = await supabase
      .from('user_icp')
      .select('search_keywords')
      .eq('instagram_user_id', instagram_user_id)
      .single()

    if (icpError || !icpData?.search_keywords || icpData.search_keywords.length === 0) {
      console.error('Error obteniendo ICP o keywords vacías:', icpError)
      return new Response(
        JSON.stringify({ 
          error: 'Keywords no configuradas',
          message: 'Necesitas configurar tu ICP primero para poder buscar prospectos.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const keywords = icpData.search_keywords
    console.log(`🎯 Keywords del ICP: ${keywords.join(', ')}`)

    // 3. Limpiar resultados anteriores
    console.log('🧹 Limpiando resultados anteriores...')
    const { error: deleteError } = await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagram_user_id)

    if (deleteError) {
      console.error('Error limpiando resultados anteriores:', deleteError)
      throw deleteError
    }

    // 4. Realizar búsquedas con cada keyword usando el mismo endpoint de Perplexity
    let allAccounts: any[] = []
    let totalAccountsFound = 0

    for (const keyword of keywords.slice(0, 3)) { // Límite de 3 keywords para evitar timeouts
      try {
        console.log(`🔍 Buscando con keyword: "${keyword}"`)
        
        const searchResults = await getPerplexitySearch(keyword, '', '1000', '50000')
        
        if (searchResults?.accounts) {
          const keywordAccounts = searchResults.accounts.map((account: any) => ({
            ...account,
            search_keyword: keyword
          }))
          
          allAccounts = allAccounts.concat(keywordAccounts)
          totalAccountsFound += searchResults.accounts.length
          
          console.log(`✅ Encontradas ${searchResults.accounts.length} cuentas para "${keyword}"`)
        }
      } catch (error) {
        console.error(`❌ Error buscando con keyword "${keyword}":`, error)
      }
    }

    console.log(`📊 Total de cuentas encontradas: ${totalAccountsFound}`)

    // 5. Guardar resultados en la base de datos
    if (allAccounts.length > 0) {
      const resultsToInsert = allAccounts.map((account: any) => ({
        instagram_user_id: instagram_user_id,
        result_type: 'account',
        instagram_url: account.instagram_url || account.url,
        title: account.title || account.name,
        description: account.description || account.bio || '',
        comments_count: 0,
        is_recent: false,
        has_keywords: true,
        publish_date: null,
        search_keywords: [account.search_keyword]
      }))

      const { error: insertError } = await supabase
        .from('prospect_search_results')
        .insert(resultsToInsert)

      if (insertError) {
        console.error('Error guardando resultados:', insertError)
        throw insertError
      }

      console.log(`💾 Guardados ${resultsToInsert.length} resultados en la base de datos`)
    }

    // 6. Incrementar contador de búsquedas diarias
    const { data: newCount, error: incrementError } = await supabase
      .rpc('increment_daily_search_count', { p_instagram_user_id: instagram_user_id })

    if (incrementError) {
      console.error('Error incrementando contador:', incrementError)
    } else {
      console.log(`📊 Nuevo contador de búsquedas: ${newCount}/5`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Búsqueda completada. Se encontraron ${allAccounts.length} nuevos prospectos.`,
        results_count: allAccounts.length,
        searches_used: newCount,
        searches_remaining: 5 - (newCount || 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error en search-new-prospects:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getPerplexitySearch(query: string, location: string, followers_from: string, followers_to: string) {
  try {
    const payload = {
      howerUsername: 'andresquival',
      howerToken: 'testhower',
      query: query,
      location: location,
      followers_from: followers_from.replaceAll(",", ""),
      followers_to: followers_to.replaceAll(",", "")
    }

    console.log(`🔍 Realizando búsqueda con query: "${query}"`)

    const response = await fetch('https://www.howersoftware.io/clients/perplexity_instagram_search_2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload))
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Búsqueda completada para query: "${query}", resultados: ${data.accounts?.length || 0}`)
    
    return data

  } catch (error) {
    console.error('Error en getPerplexitySearch:', error)
    throw error
  }
}