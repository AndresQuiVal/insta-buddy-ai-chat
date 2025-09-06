import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inicializar Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function getPerplexitySearch(query: string, dateRange: string, followers_min: string, followers_max: string) {
  const username = Deno.env.get('HOWER_USERNAME');
  const token = Deno.env.get('HOWER_TOKEN');
  
  if (!username || !token) {
    console.error('Missing HOWER credentials');
    throw new Error('Missing HOWER credentials');
  }

  const requestBody = {
    query,
    dateRange,
    followers_min,
    followers_max
  };

  console.log('📞 Calling Hower API with:', { 
    username, 
    hasToken: !!token,
    requestBody 
  });

  const response = await fetch('https://app.hower.dev/api/v2/search/perplexity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Username': username
    },
    body: JSON.stringify(requestBody)
  });

  console.log('🌐 Hower API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Hower API error:', response.status, errorText);
    throw new Error(`Hower API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Hower API success response:', { 
    success: data.success, 
    hasData: !!data.data,
    dataLength: data.data?.results?.length || 0
  });
    
  return data;
}

async function searchAndSaveProspects(instagramUserId: string) {
  try {
    console.log(`🔍 Iniciando búsqueda de prospectos para usuario: ${instagramUserId}`);
    
    // Obtener ICP del usuario
    const { data: icpData, error: icpError } = await supabase
      .from('user_icp')
      .select('search_keywords, is_complete')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (icpError || !icpData?.is_complete) {
      console.log(`❌ ICP no configurado o incompleto para usuario ${instagramUserId}`);
      throw new Error('ICP no configurado correctamente');
    }

    const searchKeywords = icpData.search_keywords || [];
    console.log(`🎯 Keywords del ICP: ${searchKeywords.join(', ')}`);

    if (searchKeywords.length === 0) {
      console.log(`❌ No hay palabras clave configuradas para usuario ${instagramUserId}`);
      throw new Error('No hay palabras clave configuradas en el ICP');
    }

    // Seleccionar 3 palabras aleatorias
    const selectedKeywords = searchKeywords
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, searchKeywords.length));

    console.log(`🎯 Palabras clave seleccionadas para ${instagramUserId}:`, selectedKeywords);

    // Limpiar resultados anteriores del usuario
    await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagramUserId);

    let allAccounts: any[] = [];
    
    // Realizar búsquedas con cada palabra clave
    for (const keyword of selectedKeywords) {
      try {
        const searchResults = await getPerplexitySearch(keyword, '', '1000', '50000');
        
        if (searchResults.success && searchResults.data?.results) {
          console.log(`✅ Resultados para "${keyword}": ${searchResults.data.results.length} encontrados`);
          allAccounts = allAccounts.concat(searchResults.data.results);
        }
      } catch (error) {
        console.error(`❌ Error buscando keyword "${keyword}":`, error);
        // Continuar con la siguiente palabra clave
      }
    }

    console.log(`📊 Total de resultados encontrados: ${allAccounts.length}`);

    if (allAccounts.length === 0) {
      console.log(`⚠️ No se encontraron resultados para usuario ${instagramUserId}`);
      return { success: false, message: 'No se encontraron resultados' };
    }

    // Separar posts y cuentas
    const posts = allAccounts.filter(account => account.posts && account.posts.length > 0);
    const accounts = allAccounts.filter(account => !account.posts || account.posts.length === 0);

    console.log(`📊 Resultados separados: ${posts.length} posts, ${accounts.length} cuentas`);

    // Seleccionar hasta 5 posts aleatorios
    const selectedPosts = posts
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    // Seleccionar hasta 5 cuentas aleatorias
    const selectedAccounts = accounts
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    console.log(`📊 Seleccionados: ${selectedPosts.length} posts, ${selectedAccounts.length} cuentas`);

    // Preparar datos para insertar
    const resultsToSave: any[] = [];

    // Agregar posts seleccionados
    selectedPosts.forEach(account => {
      account.posts.forEach((post: any) => {
        resultsToSave.push({
          instagram_user_id: instagramUserId,
          result_type: 'post',
          instagram_url: post.url,
          title: `Post de @${account.username}`,
          description: `Post: "${post.caption || 'Sin descripción'}"`,
          comments_count: post.comments_count || 0,
          is_recent: true,
          has_keywords: true,
          publish_date: post.timestamp || '',
          search_keywords: selectedKeywords
        });
      });
    });

    // Agregar cuentas seleccionadas
    selectedAccounts.forEach(account => {
      resultsToSave.push({
        instagram_user_id: instagramUserId,
        result_type: 'account',
        instagram_url: `https://instagram.com/${account.username}`,
        title: `@${account.username}`,
        description: `Cuenta: "${account.bio || 'Sin biografía'}"`,
        comments_count: 0,
        is_recent: false,
        has_keywords: true,
        publish_date: '',
        search_keywords: selectedKeywords
      });
    });

    // Insertar todos los resultados
    if (resultsToSave.length > 0) {
      const { error: insertError } = await supabase
        .from('prospect_search_results')
        .insert(resultsToSave);

      if (insertError) {
        console.error('Error guardando resultados:', insertError);
        throw new Error('Error guardando resultados en la base de datos');
      } else {
        console.log(`✅ Guardados ${resultsToSave.length} resultados para usuario ${instagramUserId} (${selectedPosts.length} posts, ${selectedAccounts.length} cuentas)`);
        return { 
          success: true, 
          message: `Se encontraron ${resultsToSave.length} nuevos prospectos`,
          results: {
            total: resultsToSave.length,
            posts: selectedPosts.length,
            accounts: selectedAccounts.length
          }
        };
      }
    } else {
      return { success: false, message: 'No se procesaron resultados' };
    }

  } catch (error) {
    console.error(`Error en searchAndSaveProspects para usuario ${instagramUserId}:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instagram_user_id } = await req.json();

    if (!instagram_user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'instagram_user_id es requerido' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🚀 Iniciando búsqueda manual para usuario: ${instagram_user_id}`);

    const result = await searchAndSaveProspects(instagram_user_id);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error en search-prospects:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});