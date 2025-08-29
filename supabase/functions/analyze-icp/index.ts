import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== INICIANDO ANÁLISIS DE ICP ===');
    
    const requestBody = await req.json();
    console.log('Payload recibido:', JSON.stringify(requestBody, null, 2));
    
    const { prompt } = requestBody;
    
    if (!prompt) {
      console.error('❌ No se proporcionó prompt');
      return new Response(
        JSON.stringify({ 
          error: 'Missing prompt',
          response: 'Error: No se proporcionó un prompt para analizar.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY no está configurado');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          response: JSON.stringify({
            score: 0,
            completedBlocks: [],
            missingBlocks: ["WHO", "WHERE", "BAIT", "RESULT"],
            suggestions: [
              "Configura tu API key de OpenAI en la configuración del proyecto",
              "Una vez configurada, podrás usar el análisis completo de ICP",
              "Mientras tanto, define manualmente tu cliente ideal"
            ],
            searchKeywords: []
          })
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ OpenAI API Key configurada, analizando ICP...');

    // Llamar a OpenAI API para análisis de ICP
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en marketing y definición de ICP (Ideal Customer Profile). Tu tarea es analizar descripciones de cliente ideal y evaluar qué tan completas están.

IMPORTANTE: Debes responder ÚNICAMENTE con JSON válido, sin texto adicional, sin explicaciones, sin markdown.

El JSON debe tener exactamente esta estructura:
{
  "score": [número del 0-4],
  "completedBlocks": ["array de bloques completos"],
  "missingBlocks": ["array de bloques faltantes"], 
  "suggestions": ["array de sugerencias"],
  "searchKeywords": ["array de keywords para búsqueda"],
  "commentKeywords": ["array de keywords para posts"],
  "accountKeywords": ["array de keywords para cuentas"]
}

Los 4 bloques son: WHO, WHERE, BAIT, RESULT

Si el score es 3 o 4, debes generar keywords específicas:
- searchKeywords: hashtags y palabras generales para búsqueda (#skincare, belleza, etc.)
- commentKeywords: hashtags específicos para encontrar posts con comentarios (#rutinafacial, #glowskin, etc.)
- accountKeywords: tipos de cuentas y nombres específicos (@skincare, esteticista, beauty, etc.)

Genera entre 15-25 keywords por categoría, mezclando español e inglés, enfocándote en el nicho específico del ICP.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      }),
    });

    console.log('OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('❌ Error de OpenAI API:', errorData);
      
      // Devolver un análisis básico por defecto en caso de error
      return new Response(
        JSON.stringify({ 
          response: JSON.stringify({
            score: 0,
            completedBlocks: [],
            missingBlocks: ["WHO", "WHERE", "BAIT", "RESULT"],
            suggestions: [
              "Error conectando con OpenAI. Revisa tu API key",
              "Intenta el análisis nuevamente en unos momentos",
              "Mientras tanto, define tu ICP manualmente"
            ],
            searchKeywords: []
          })
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const responseData = await openaiResponse.json();
    console.log('OpenAI Response Data:', responseData);
    
    const generatedResponse = responseData.choices?.[0]?.message?.content;

    if (!generatedResponse) {
      console.error('❌ No se pudo generar respuesta de OpenAI');
      return new Response(
        JSON.stringify({ 
          response: JSON.stringify({
            score: 0,
            completedBlocks: [],
            missingBlocks: ["WHO", "WHERE", "BAIT", "RESULT"],
            suggestions: [
              "No se pudo generar análisis automático",
              "Intenta describir tu ICP de forma más detallada",
              "Incluye información sobre edad, intereses y objetivos"
            ],
            searchKeywords: []
          })
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Análisis ICP generado exitosamente');
    console.log('Respuesta:', generatedResponse);

    // Intentar parsear la respuesta como JSON para validarla
    try {
      const parsedResponse = JSON.parse(generatedResponse);
      console.log('✅ JSON válido recibido:', parsedResponse);
      
      return new Response(
        JSON.stringify({ 
          response: generatedResponse,
          success: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (parseError) {
      console.error('❌ Error parseando JSON de OpenAI:', parseError);
      console.log('Respuesta que falló:', generatedResponse);
      
      // Devolver análisis básico si el JSON no es válido
      return new Response(
        JSON.stringify({ 
          response: JSON.stringify({
            score: 0,
            completedBlocks: [],
            missingBlocks: ["WHO", "WHERE", "BAIT", "RESULT"],
            suggestions: [
              "Error procesando análisis automático",
              "Intenta ser más específico en tu descripción",
              "Incluye detalles sobre tu cliente ideal"
            ],
            searchKeywords: []
          })
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('💥 Error en analyze-icp:', error);
    return new Response(
      JSON.stringify({ 
        response: JSON.stringify({
          score: 0,
          completedBlocks: [],
          missingBlocks: ["WHO", "WHERE", "BAIT", "RESULT"],
          suggestions: [
            "Error interno del sistema",
            "Intenta el análisis nuevamente",
            "Si el problema persiste, contacta soporte"
          ],
          searchKeywords: []
        })
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});