import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🧪 Test de conexión con Hower API iniciado');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { howerUsername, howerToken, query } = await req.json();

    if (!howerUsername || !howerToken) {
      console.error('❌ Faltan credenciales:', { howerUsername, howerToken });
      return new Response(JSON.stringify({ 
        error: 'Credenciales de Hower requeridas',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Probando API de Hower con usuario: ${howerUsername}`);
    console.log(`🎯 Query de prueba: ${query}`);

    // Usar ID fijo para test (el del usuario @pruebahower)
    const instagramUserId = '17841476656827421';
    console.log(`📋 Usando instagram_user_id de prueba: ${instagramUserId}`);

    // Preparar payload para la API de Hower
    const payload = {
      howerUsername,
      howerToken,
      query: query || "emprendedores jóvenes",
      location: "",
      followers_from: "1000",
      followers_to: "100000"
    };

    console.log('📤 Enviando request a Hower API...');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    // Llamar a la API de Hower
    const response = await fetch('https://www.howersoftware.io/clients/perplexity_instagram_search_2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload)) // Doble JSON.stringify
    });

    console.log(`📡 Respuesta de Hower: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de la API de Hower:', errorText);
      return new Response(JSON.stringify({ 
        error: `Error ${response.status}: ${response.statusText}`,
        details: errorText,
        success: false
      }), {
        status: 200, // Devolver 200 para que no sea error de edge function
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('📊 Datos recibidos de Hower:', JSON.stringify(data, null, 2));

    const accounts = data.accounts || [];
    console.log(`✅ Resultados obtenidos: ${accounts.length} cuentas`);

    // Procesar y guardar algunos resultados para testing
    const resultsToInsert = [];

    // Tomar hasta 5 resultados para insertar
    const limitedResults = accounts.slice(0, 5);
    
    for (const account of limitedResults) {
      const isPost = account.profile.includes('/reel/') || account.profile.includes('/p/');
      
      resultsToInsert.push({
        instagram_user_id: instagramUserId,
        result_type: isPost ? 'post' : 'account',
        instagram_url: account.profile,
        title: isPost ? 'Post de Instagram' : `@${account.profile.split('/').pop()?.replace('?locale=es_LA', '') || 'account'}`,
        description: account.description?.substring(0, 75) + '...' || 'Sin descripción',
        comments_count: isPost ? Math.floor(Math.random() * 100) : 0,
        publish_date: isPost ? 'Agosto 27, 2025' : '',
        is_recent: isPost,
        has_keywords: true,
        search_keywords: [query || "emprendedores jóvenes"]
      });
    }

    console.log(`📝 Preparados ${resultsToInsert.length} resultados para insertar`);

    // Limpiar resultados anteriores
    const { error: deleteError } = await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagramUserId);

    if (deleteError) {
      console.error('❌ Error limpiando resultados anteriores:', deleteError);
    } else {
      console.log('🧹 Resultados anteriores limpiados');
    }

    // Insertar nuevos resultados
    if (resultsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('prospect_search_results')
        .insert(resultsToInsert);

      if (insertError) {
        console.error('❌ Error insertando resultados:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Error guardando resultados en BD',
          details: insertError.message,
          success: false
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log(`✅ ${resultsToInsert.length} resultados guardados en la base de datos`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Test completado: ${accounts.length} resultados encontrados, ${resultsToInsert.length} guardados`,
      results: accounts,
      savedResults: resultsToInsert.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en test-search:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message,
      success: false
    }), {
      status: 200, // Devolver 200 para que no sea error de edge function
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});