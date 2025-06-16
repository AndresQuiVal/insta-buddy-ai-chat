
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversation, prospect_name, openai_api_key } = await req.json()

    if (!openai_api_key) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🤖 Generando sugerencia para:', prospect_name)
    console.log('📝 Conversación:', conversation)

    // Prompt específico para generar sugerencias de mensaje
    const systemPrompt = `Eres un experto en ventas consultivas y generación de leads. Tu objetivo es analizar conversaciones de Instagram para sugerir el siguiente mensaje más efectivo.

OBJETIVOS PRINCIPALES:
1. Agendar una reunión de manera orgánica y conversacional
2. Obtener el número de teléfono de la persona
3. Mantener el interés y la confianza del prospecto

INSTRUCCIONES:
- Analiza la conversación completa para entender el contexto y el nivel de interés
- Sugiere UN mensaje específico y directo que sea natural y no forzado
- Adapta el tono al estilo de conversación que ya se estableció
- Si el prospecto muestra interés alto, sugiere agendar reunión
- Si el prospecto muestra interés medio, sugiere intercambiar contactos
- Si el prospecto muestra poco interés, sugiere valor adicional antes de pedir algo
- Evita mensajes genéricos o que suenen a spam
- El mensaje debe ser entre 1-3 líneas máximo
- Usa un lenguaje natural y conversacional en español

Responde SOLO con el mensaje sugerido, sin explicaciones adicionales.`;

    const userPrompt = `Analiza esta conversación con ${prospect_name} y sugiere el mejor próximo mensaje:

${conversation}

Sugerencia de mensaje:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Error calling OpenAI API',
          details: errorData.error?.message || 'Unknown error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    const suggestion = data.choices?.[0]?.message?.content?.trim()

    if (!suggestion) {
      return new Response(
        JSON.stringify({ error: 'No suggestion generated' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Sugerencia generada:', suggestion)

    return new Response(
      JSON.stringify({ 
        suggestion,
        prospect_name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in ai-prospect-suggestion:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
