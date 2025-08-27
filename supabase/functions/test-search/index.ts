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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('📊 Datos recibidos de Hower:', JSON.stringify(data, null, 2));

    const accounts = data.accounts || [];
    console.log(`✅ Resultados obtenidos: ${accounts.length} cuentas`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `API funciona correctamente: ${accounts.length} resultados`,
      results: accounts,
      rawResponse: data
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});