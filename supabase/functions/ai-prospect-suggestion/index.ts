
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
    const { conversation, prospect_name, openai_api_key, ideal_traits } = await req.json()

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

    console.log('🎯 Generando sugerencia de ACCIÓN para:', prospect_name)
    console.log('📝 Conversación:', conversation)
    console.log('🎯 Características recibidas:', ideal_traits)

    // Crear prompt específico para ACCIONES ESTRATÉGICAS
    let systemPrompt = `Eres un experto coach en ventas consultivas que ayuda a vendedores a decidir el siguiente paso estratégico con sus prospectos de Instagram.

TU TRABAJO: Analizar la conversación y sugerir QUÉ ACCIÓN debe tomar la persona para avanzar orgánicamente hacia una llamada o conseguir el WhatsApp.

CONTEXTO IMPORTANTE:
- NO generes mensajes exactos, sino ACCIONES/ESTRATEGIAS específicas
- La conversación debe fluir de manera orgánica, sin presionar
- El objetivo final es agendar una llamada o conseguir el número de WhatsApp
- Cada acción debe ser un paso lógico hacia ese objetivo

TIPOS DE ACCIONES QUE PUEDES SUGERIR:
📱 "Envía un mensaje preguntando sobre [tema específico] para conocer mejor sus necesidades"
🎯 "Comparte un caso de éxito similar a su situación para generar más interés"
📊 "Haz una pregunta específica sobre [X] para calificar si es tu cliente ideal"
⏰ "Es el momento perfecto para sugerir una llamada rápida de 15 minutos"
💬 "Propón cambiar la conversación a WhatsApp para mayor comodidad"
🔍 "Indaga más sobre [tema] antes de hacer cualquier propuesta"
✋ "Dale espacio, ha mostrado interés pero necesita tiempo para procesar"
🎁 "Ofrece valor adicional (recurso/tip) relacionado con lo que mencionó"`;

    // Si hay características configuradas, añadirlas al prompt
    if (ideal_traits && ideal_traits.length > 0) {
      const enabledTraits = ideal_traits.filter((trait: any) => trait.enabled);
      
      if (enabledTraits.length > 0) {
        systemPrompt += `

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${enabledTraits.map((trait: any, index: number) => `${index + 1}. ${trait.trait}`).join('\n')}

ESTRATEGIA CON CARACTERÍSTICAS:
- Si cumple muchas características → Sugiere acción directa (llamada/WhatsApp)
- Si cumple pocas → Sugiere acciones para descubrir más características
- Si no has confirmado características → Sugiere preguntas estratégicas para evaluarlas
- Prioriza acciones que te ayuden a calificar al prospecto según estas características`;
      }
    } else {
      systemPrompt += `

ESTRATEGIA SIN CARACTERÍSTICAS ESPECÍFICAS:
- Enfócate en construir interés y confianza gradualmente
- Si muestra mucho interés → Sugiere llamada o WhatsApp
- Si muestra interés medio → Sugiere compartir valor adicional
- Si muestra poco interés → Sugiere hacer preguntas para entender necesidades
- Siempre busca oportunidades para avanzar sin presionar`;
    }

    systemPrompt += `

INSTRUCCIONES PARA TU RESPUESTA:
1. Analiza el nivel de interés y engagement del prospecto
2. Considera en qué etapa de la conversación están
3. Sugiere UNA acción específica y práctica
4. Explica brevemente POR QUÉ esa acción es la más adecuada ahora
5. Tu respuesta debe ser directa y accionable

FORMATO DE RESPUESTA:
"ACCIÓN: [descripción específica de qué hacer]
RAZÓN: [breve explicación de por qué es el mejor momento para esta acción]"

Responde SOLO con la acción sugerida y su justificación, sin introducciones adicionales.`;

    const userPrompt = `Analiza esta conversación con ${prospect_name} y sugiere la mejor ACCIÓN ESTRATÉGICA a tomar:

${conversation}

¿Qué acción específica debe tomar el vendedor ahora?`;

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
        max_tokens: 200,
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

    console.log('✅ Sugerencia de ACCIÓN generada:', suggestion)

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
