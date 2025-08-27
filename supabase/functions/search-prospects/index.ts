import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOWER_API_ENDPOINT = "https://www.howersoftware.io/";

interface SearchResult {
  type: string;
  profile: string;
  description: string;
  full_description?: string;
}

interface SearchPayload {
  howerUsername: string;
  howerToken: string;
  query: string;
  location: string;
  followers_from: string;
  followers_to: string;
}

async function getPerplexitySearch(query: string, howerUsername: string, howerToken: string): Promise<SearchResult[]> {
  try {
    const payload: SearchPayload = {
      howerUsername,
      howerToken,
      query,
      location: "", // Dejar vacío como especificado
      followers_from: "1000",
      followers_to: "100000"
    };

    console.log(`🔍 Buscando prospectos para query: "${query}"`);

    const response = await fetch(`${HOWER_API_ENDPOINT}/clients/perplexity_instagram_search_2/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload)) // Doble JSON.stringify como especificado
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Resultados obtenidos para "${query}":`, data.accounts?.length || 0);
    
    return data.accounts || [];
  } catch (error) {
    console.error(`❌ Error en getPerplexitySearch para "${query}":`, error);
    return [];
  }
}

function extractAndTruncateDescription(description: string): string {
  if (!description) return '';
  
  const colonQuoteIndex = description.indexOf(': "');
  if (colonQuoteIndex === -1) {
    return description.length > 75 ? description.substring(0, 75) + '...' : description;
  }
  
  const textAfterColonQuote = description.substring(colonQuoteIndex + 3);
  
  if (textAfterColonQuote.length > 75) {
    return textAfterColonQuote.substring(0, 75) + '...';
  }
  
  return textAfterColonQuote;
}

function translateMonthToSpanish(englishDate: string): string {
  const monthTranslations = {
    'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
    'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
    'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
    'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
  };
  
  for (const [english, spanish] of Object.entries(monthTranslations)) {
    englishDate = englishDate.replace(english, spanish);
  }
  
  return englishDate;
}

function containsKeywords(text: string, keywords: string[]): boolean {
  if (!text || !keywords || keywords.length === 0) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function processSearchResults(allResults: SearchResult[], keywords: string[]) {
  // Separar posts/reels de cuentas
  const postsReels = allResults.filter(account => 
    account.profile.includes('/reel/') || account.profile.includes('/p/')
  );
  const userAccounts = allResults.filter(account => 
    !account.profile.includes('/reel/') && !account.profile.includes('/p/')
  );

  // Ordenar posts/reels con lógica de prioridad
  const sortedPostsReels = postsReels.sort((a, b) => {
    const aHasKeywords = containsKeywords(a.full_description || a.description, keywords);
    const bHasKeywords = containsKeywords(b.full_description || b.description, keywords);
    
    // Prioridad 1: Que incluya palabras clave
    if (aHasKeywords && !bHasKeywords) return -1;
    if (!aHasKeywords && bHasKeywords) return 1;
    
    // Prioridad 2: Si ambos tienen o no tienen keywords, ordenar por comentarios y fecha
    if (aHasKeywords === bHasKeywords) {
      const aDateMatch = a.description.match(/([A-Za-z]+ \d{1,2}, \d{4}):/);
      const bDateMatch = b.description.match(/([A-Za-z]+ \d{1,2}, \d{4}):/);
      
      if (aDateMatch && bDateMatch) {
        const aDate = new Date(aDateMatch[1]);
        const bDate = new Date(bDateMatch[1]);
        
        const monthsDiff = Math.abs((aDate.getFullYear() - bDate.getFullYear()) * 12 + 
                                  (aDate.getMonth() - bDate.getMonth()));
        
        if (monthsDiff <= 2) {
          const aCommentsMatch = a.description.match(/([\d,]+)\s*[Cc]omentarios?/);
          const bCommentsMatch = b.description.match(/([\d,]+)\s*[Cc]omentarios?/);
          
          const aComments = aCommentsMatch ? parseInt(aCommentsMatch[1].replace(/,/g, '')) : 0;
          const bComments = bCommentsMatch ? parseInt(bCommentsMatch[1].replace(/,/g, '')) : 0;
          
          if (Math.abs(aComments - bComments) > 50) {
            return bComments - aComments;
          }
        }
        
        return bDate.getTime() - aDate.getTime();
      }
    }
    
    return 0;
  });

  // Ordenar cuentas con lógica de prioridad  
  const sortedUserAccounts = userAccounts.sort((a, b) => {
    const aHasKeywords = containsKeywords(a.full_description || a.description, keywords);
    const bHasKeywords = containsKeywords(b.full_description || b.description, keywords);
    
    if (aHasKeywords && !bHasKeywords) return -1;
    if (!aHasKeywords && bHasKeywords) return 1;
    
    return 0;
  });

  // Tomar exactamente 5 posts y 15 cuentas
  const finalPosts = sortedPostsReels.slice(0, 5);
  const finalAccounts = sortedUserAccounts.slice(0, 15);

  return {
    posts: finalPosts,
    accounts: finalAccounts
  };
}

serve(async (req) => {
  console.log('🚀 Search prospects function iniciada');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instagramUserId } = await req.json();
    
    if (!instagramUserId) {
      console.log('❌ No se proporcionó instagramUserId');
      return new Response(JSON.stringify({ error: 'instagramUserId es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Buscando prospectos para usuario: ${instagramUserId}`);

    // 1. Obtener el ICP del usuario
    const { data: icpData, error: icpError } = await supabase
      .from('user_icp')
      .select('search_keywords, is_complete, bullseye_score')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (icpError || !icpData) {
      console.log(`❌ Usuario ${instagramUserId} no tiene ICP configurado`);
      return new Response(JSON.stringify({ 
        error: 'Usuario no tiene ICP configurado',
        hasICP: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar si el ICP está completo
    if (!icpData.is_complete && icpData.bullseye_score === 0) {
      console.log(`❌ Usuario ${instagramUserId} no tiene ICP completo`);
      return new Response(JSON.stringify({ 
        error: 'ICP no está completo',
        hasICP: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Obtener credenciales de Hower del usuario activo
    // Buscar en localStorage del usuario o usar credenciales por defecto
    let howerUsername = '';
    let howerToken = '';
    
    // Intentar obtener las credenciales de la tabla instagram_users si las tiene
    const { data: userCredentials } = await supabase
      .from('instagram_users')
      .select('id')
      .eq('instagram_user_id', instagramUserId)
      .eq('is_active', true)
      .single();

    if (!userCredentials) {
      console.log(`❌ Usuario ${instagramUserId} no encontrado o inactivo`);
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Por ahora usar credenciales hardcodeadas para testing
    // TODO: Implementar sistema seguro de credenciales por usuario
    howerUsername = 'martinpruebabot@gmail.com';
    howerToken = 'ce8e06de-7c8b-4651-ba8c-e72b77ecfdd4';

    if (!howerUsername || !howerToken) {
      console.log('❌ Credenciales de Hower no encontradas');
      return new Response(JSON.stringify({ error: 'Credenciales de Hower no configuradas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Seleccionar 3 palabras clave aleatorias
    const keywords = icpData.search_keywords || [];
    if (keywords.length === 0) {
      console.log(`❌ Usuario ${instagramUserId} no tiene palabras clave en su ICP`);
      return new Response(JSON.stringify({ 
        error: 'No hay palabras clave en el ICP',
        hasICP: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Seleccionar máximo 3 palabras aleatorias
    const shuffledKeywords = keywords.sort(() => 0.5 - Math.random());
    const selectedKeywords = shuffledKeywords.slice(0, Math.min(3, keywords.length));
    
    console.log(`🎯 Palabras clave seleccionadas para ${instagramUserId}:`, selectedKeywords);

    // 4. Realizar búsquedas con cada palabra clave
    const allResults: SearchResult[] = [];
    
    for (const keyword of selectedKeywords) {
      const results = await getPerplexitySearch(keyword, howerUsername, howerToken);
      allResults.push(...results);
    }

    console.log(`📊 Total de resultados obtenidos: ${allResults.length}`);

    // 5. Procesar y filtrar resultados para obtener exactamente 20 (5 posts + 15 cuentas)
    const { posts, accounts } = processSearchResults(allResults, selectedKeywords);

    console.log(`📝 Resultados procesados: ${posts.length} posts, ${accounts.length} cuentas`);

    // 6. Limpiar resultados anteriores del usuario
    const { error: deleteError } = await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagramUserId);

    if (deleteError) {
      console.error('❌ Error limpiando resultados anteriores:', deleteError);
    }

    // 7. Guardar nuevos resultados en la base de datos
    const resultsToInsert = [];

    // Procesar posts
    for (const post of posts) {
      const commentsMatch = post.description.match(/([\d,]+)\s*[Cc]omentarios?/);
      const commentsCount = commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, '')) : 0;
      
      const dateMatch = post.description.match(/([A-Za-z]+ \d{1,2}, \d{4}):/);
      let publishDate = '';
      let isRecent = false;
      
      if (dateMatch) {
        publishDate = translateMonthToSpanish(dateMatch[1]);
        const publishDateObj = new Date(dateMatch[1]);
        const currentDate = new Date();
        const monthsDiff = (currentDate.getFullYear() - publishDateObj.getFullYear()) * 12 + 
                         (currentDate.getMonth() - publishDateObj.getMonth());
        isRecent = monthsDiff <= 3;
      }

      const postType = post.profile.includes('/reel/') ? 'Reel de Instagram' : 'Post de Instagram';
      
      resultsToInsert.push({
        instagram_user_id: instagramUserId,
        result_type: 'post',
        instagram_url: post.profile,
        title: postType,
        description: extractAndTruncateDescription(post.description),
        comments_count: commentsCount,
        publish_date: publishDate,
        is_recent: isRecent,
        has_keywords: containsKeywords(post.full_description || post.description, selectedKeywords),
        search_keywords: selectedKeywords
      });
    }

    // Procesar cuentas
    for (const account of accounts) {
      const username = account.profile.split('/').pop()?.replace('?locale=es_LA', '') || '';
      
      resultsToInsert.push({
        instagram_user_id: instagramUserId,
        result_type: 'account',
        instagram_url: account.profile,
        title: `@${username}`,
        description: extractAndTruncateDescription(account.description),
        comments_count: 0,
        publish_date: '',
        is_recent: false,
        has_keywords: containsKeywords(account.full_description || account.description, selectedKeywords),
        search_keywords: selectedKeywords
      });
    }

    // Insertar en la base de datos
    if (resultsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('prospect_search_results')
        .insert(resultsToInsert);

      if (insertError) {
        console.error('❌ Error insertando resultados:', insertError);
        return new Response(JSON.stringify({ error: 'Error guardando resultados' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`✅ Búsqueda completada para usuario ${instagramUserId}: ${resultsToInsert.length} resultados guardados`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Búsqueda completada: ${posts.length} posts y ${accounts.length} cuentas encontradas`,
      keywords: selectedKeywords,
      results: {
        posts: posts.length,
        accounts: accounts.length,
        total: resultsToInsert.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en search-prospects:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});