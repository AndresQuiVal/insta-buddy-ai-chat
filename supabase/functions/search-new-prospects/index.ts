import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPerplexitySearch(query: string, location: string, followers_from: string, followers_to: string) {
  try {
    const payload = {
      howerUsername: 'andresquival',
      howerToken: 'testhower',
      query: query,
      location: location,
      followers_from: followers_from.replaceAll(",", ""),
      followers_to: followers_to.replaceAll(",", "")
    };

    console.log(`🔍 Realizando búsqueda con query: "${query}"`);

    const response = await fetch('https://www.howersoftware.io/clients/perplexity_instagram_search_2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload))
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Búsqueda completada para query: "${query}", resultados: ${data.accounts?.length || 0}`);
    
    return data;

  } catch (error) {
    console.error('Error en getPerplexitySearch:', error);
    throw error;
  }
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

    if (icpError || !icpData || !icpData.search_keywords || icpData.search_keywords.length === 0) {
      console.log(`⚠️ Usuario ${instagramUserId} no tiene palabras clave definidas`);
      return { success: false, error: 'No tienes palabras clave definidas en tu ICP' };
    }

    const searchKeywords = icpData.search_keywords || [];
    if (searchKeywords.length === 0) {
      console.log(`⚠️ Usuario ${instagramUserId} no tiene palabras clave definidas`);
      return { success: false, error: 'No tienes palabras clave definidas' };
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
        if (searchResults?.accounts) {
          allAccounts = allAccounts.concat(searchResults.accounts.map((account: any) => ({
            ...account,
            search_keyword: keyword
          })));
        }
      } catch (error) {
        console.error(`Error buscando con keyword "${keyword}":`, error);
      }
    }

    if (allAccounts.length === 0) {
      console.log(`⚠️ No se encontraron resultados para usuario ${instagramUserId}`);
      return { success: false, error: 'No se encontraron nuevos prospectos en esta búsqueda' };
    }

    // Separar posts/reels de cuentas
    const posts = allAccounts.filter(account => 
      account.profile.includes('/reel/') || account.profile.includes('/p/')
    );
    const accounts = allAccounts.filter(account => 
      !account.profile.includes('/reel/') && !account.profile.includes('/p/')
    );

    // Seleccionar y priorizar posts (máximo 5)
    const selectedPosts = posts
      .sort((a, b) => {
        // Priorizar por fecha y comentarios
        const aCommentsMatch = a.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
        const bCommentsMatch = b.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
        
        const aComments = aCommentsMatch ? parseInt(aCommentsMatch[1].replace(/,/g, '')) : 0;
        const bComments = bCommentsMatch ? parseInt(bCommentsMatch[1].replace(/,/g, '')) : 0;
        
        return bComments - aComments; // Más comentarios primero
      })
      .slice(0, 5);

    // Seleccionar cuentas aleatoriamente (máximo 15)
    const selectedAccounts = accounts
      .sort(() => 0.5 - Math.random())
      .slice(0, 15);

    // Guardar resultados en la base de datos
    const resultsToSave = [];

    // Procesar posts
    selectedPosts.forEach(post => {
      const commentsMatch = post.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
      const commentsCount = commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, '')) : 0;
      
      const dateMatch = post.description?.match(/([A-Za-z]+ \d{1,2}, \d{4}):/);
      let isRecent = false;
      let publishDate = '';
      
      if (dateMatch) {
        publishDate = dateMatch[1];
        const publishDateObj = new Date(publishDate);
        const currentDate = new Date();
        const monthsDiff = (currentDate.getFullYear() - publishDateObj.getFullYear()) * 12 + 
                         (currentDate.getMonth() - publishDateObj.getMonth());
        isRecent = monthsDiff <= 3;
      }

      resultsToSave.push({
        instagram_user_id: instagramUserId,
        result_type: 'post',
        instagram_url: post.profile,
        title: post.profile.includes('/reel/') ? 'Reel de Instagram' : 'Post de Instagram',
        description: post.description || '',
        comments_count: commentsCount,
        is_recent: isRecent,
        has_keywords: true,
        publish_date: publishDate,
        search_keywords: selectedKeywords
      });
    });

    // Procesar cuentas
    selectedAccounts.forEach(account => {
      const username = account.profile.split('/').pop();
      
      resultsToSave.push({
        instagram_user_id: instagramUserId,
        result_type: 'account',
        instagram_url: account.profile,
        title: username.includes('?locale') ? '' : '@' + username,
        description: account.description || '',
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
        return { success: false, error: 'Error guardando los resultados' };
      } else {
        console.log(`✅ Guardados ${resultsToSave.length} nuevos prospectos para usuario ${instagramUserId}`);
        return { 
          success: true, 
          message: `¡Se encontraron ${resultsToSave.length} nuevos prospectos!`,
          data: {
            totalResults: resultsToSave.length,
            posts: selectedPosts.length,
            accounts: selectedAccounts.length,
            keywords: selectedKeywords
          }
        };
      }
    }

    return { success: false, error: 'No se pudieron procesar los resultados' };

  } catch (error) {
    console.error('Error en searchAndSaveProspects:', error);
    return { success: false, error: 'Error interno del servidor' };
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
        JSON.stringify({ success: false, error: 'ID de usuario de Instagram requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🚀 Iniciando búsqueda manual de prospectos para usuario: ${instagram_user_id}`);

    const result = await searchAndSaveProspects(instagram_user_id);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en search-new-prospects function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});