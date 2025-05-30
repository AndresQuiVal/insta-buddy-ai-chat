
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
    console.log('=== GENERANDO RESPUESTA CON CHATGPT ===');
    
    const { message, systemPrompt } = await req.json();
    console.log('Message:', message);
    console.log('System prompt:', systemPrompt);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY no está configurado');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          response: 'Error: La API key de OpenAI no está configurada. Ve a la configuración del proyecto para añadirla.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('OpenAI API Key está configurada, generando respuesta...');

    // Llamar a OpenAI API
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
            content: systemPrompt || 'Eres un experto en ventas y marketing que ayuda a mejorar las conversaciones con prospectos. Proporciona sugerencias específicas, prácticas y orientadas a resultados.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('Error de OpenAI API:', errorData);
      
      let errorMessage = 'Error generando respuesta con IA';
      if (errorData.error?.code === 'invalid_api_key') {
        errorMessage = 'API key de OpenAI inválida. Verifica la configuración.';
      } else if (errorData.error?.code === 'insufficient_quota') {
        errorMessage = 'Cuota de OpenAI agotada. Revisa tu plan de OpenAI.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error',
          response: `Error: ${errorMessage}`
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const responseData = await openaiResponse.json();
    const generatedResponse = responseData.choices?.[0]?.message?.content;

    if (!generatedResponse) {
      console.error('No se pudo generar respuesta de OpenAI');
      return new Response(
        JSON.stringify({ 
          error: 'No response generated',
          response: 'Error: No se pudo generar una respuesta. Intenta nuevamente.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Respuesta generada exitosamente');
    console.log('Respuesta:', generatedResponse.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ 
        response: generatedResponse,
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Error en chatgpt-response:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        response: `Error interno: ${error.message}. Verifica que la API key de OpenAI esté configurada correctamente.`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
