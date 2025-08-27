import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🧪 Test de búsqueda de prospectos iniciado');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const instagramUserId = '17841476656827421'; // @pruebahower

    console.log(`🔍 Testing búsqueda para usuario: ${instagramUserId}`);

    // 1. Verificar ICP
    const { data: icpData, error: icpError } = await supabase
      .from('user_icp')
      .select('search_keywords, is_complete, bullseye_score')
      .eq('instagram_user_id', instagramUserId)
      .single();

    console.log('📊 ICP Data:', icpData);

    if (icpError || !icpData) {
      console.log(`❌ Usuario no tiene ICP configurado:`, icpError);
      return new Response(JSON.stringify({ 
        error: 'Usuario no tiene ICP configurado',
        icpError 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar keywords
    const keywords = icpData.search_keywords || [];
    if (keywords.length === 0) {
      console.log(`❌ No hay keywords en el ICP`);
      return new Response(JSON.stringify({ 
        error: 'No hay palabras clave en el ICP' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Seleccionar 3 palabras aleatorias
    const shuffledKeywords = keywords.sort(() => 0.5 - Math.random());
    const selectedKeywords = shuffledKeywords.slice(0, Math.min(3, keywords.length));
    
    console.log(`🎯 Keywords seleccionadas:`, selectedKeywords);

    // 4. Simular resultados de búsqueda (para testing)
    const mockResults = [
      {
        instagram_user_id: instagramUserId,
        result_type: 'post',
        instagram_url: 'https://www.instagram.com/p/test123/',
        title: 'Post de Instagram',
        description: 'Post de prueba sobre emprendimiento y desarrollo personal',
        comments_count: 45,
        publish_date: 'Agosto 25, 2025',
        is_recent: true,
        has_keywords: true,
        search_keywords: selectedKeywords
      },
      {
        instagram_user_id: instagramUserId,
        result_type: 'account',
        instagram_url: 'https://www.instagram.com/testaccount/',
        title: '@testaccount',
        description: 'Cuenta enfocada en emprendimiento y desarrollo personal',
        comments_count: 0,
        publish_date: '',
        is_recent: false,
        has_keywords: true,
        search_keywords: selectedKeywords
      }
    ];

    // 5. Limpiar resultados anteriores
    const { error: deleteError } = await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagramUserId);

    if (deleteError) {
      console.error('❌ Error limpiando resultados anteriores:', deleteError);
    }

    // 6. Insertar resultados de prueba
    const { error: insertError } = await supabase
      .from('prospect_search_results')
      .insert(mockResults);

    if (insertError) {
      console.error('❌ Error insertando resultados:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Error guardando resultados',
        details: insertError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Test completado: ${mockResults.length} resultados insertados`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Test completado: ${mockResults.length} resultados insertados`,
      keywords: selectedKeywords,
      results: mockResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en test-search:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});