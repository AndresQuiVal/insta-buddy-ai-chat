
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

    console.log('🤖 Generando sugerencia estratégica para:', prospect_name)
    console.log('📝 Conversación:', conversation)
    console.log('🎯 Características recibidas:', ideal_traits)

    // Crear prompt específico para sugerencias de ACCIONES estratégicas
    let systemPrompt = `Eres un experto en ventas consultivas y estrategia de conversación. Tu objetivo es analizar conversaciones de Instagram y sugerir la ACCIÓN ESTRATÉGICA más efectiva que debe tomar la persona de la app.

OBJETIVOS PRINCIPALES:
1. Obtener el número de WhatsApp de manera orgánica
2. Agendar una reunión/llamada naturalmente  
3. Mantener el interés y construir confianza del prospecto

INSTRUCCIONES PARA SUGERENCIAS DE ACCIÓN:
- Analiza el nivel de interés y engagement del prospecto
- Sugiere QUÉ HACER NEXT (no qué decir exactamente)
- Las acciones deben ser graduales y orgánicas, NO agresivas
- Considera el timing y contexto de la conversación
- Enfócate en ESTRATEGIA más que en palabras específicas`;

    // Si hay características configuradas, añadirlas al prompt
    if (ideal_traits && ideal_traits.length > 0) {
      const enabledTraits = ideal_traits.filter((trait: any) => trait.enabled);
      
      if (enabledTraits.length > 0) {
        systemPrompt += `

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${enabledTraits.map((trait: any, index: number) => `${index + 1}. ${trait.trait}`).join('\n')}

ESTRATEGIA CON CARACTERÍSTICAS:
- Evalúa qué características ya cumple el prospecto basándose en la conversación
- Si cumple las características clave, sugiere acciones más directas hacia contacto/reunión
- Si no las cumple claramente, sugiere acciones para descubrir más información
- Usa las características como filtro para determinar el nivel de agresividad de la acción`;
      }
    } else {
      systemPrompt += `

ESTRATEGIA SIN CARACTERÍSTICAS ESPECÍFICAS:
- Enfócate en construir rapport y confianza primero
- Sugiere acciones que ayuden a entender mejor al prospecto
- Gradualmente mueve hacia obtener contacto según el nivel de interés mostrado`;
    }

    systemPrompt += `

🎯 TIPOS DE ACCIONES ESTRATÉGICAS A SUGERIR:

📱 ACCIONES DE INFORMACIÓN:
- "Pregunta sobre [tema específico] para entender mejor su situación"
- "Comparte una experiencia similar para generar conexión"
- "Solicita más detalles sobre [aspecto mencionado]"

📞 ACCIONES DE CONEXIÓN:
- "Sugiere continuar la conversación por WhatsApp por comodidad"
- "Propón una llamada rápida para explicar mejor las opciones"
- "Ofrece enviar información más detallada por WhatsApp"

⏰ ACCIONES DE TIMING:
- "Espera a que responda antes de hacer más preguntas"
- "Dale tiempo para procesar la información compartida"
- "Retoma la conversación mañana con un seguimiento suave"

💡 ACCIONES DE VALOR:
- "Comparte un caso de éxito similar a su situación"
- "Ofrece una consulta gratuita para evaluar su caso"
- "Proporciona un tip útil relacionado con su necesidad"

Responde con UNA acción estratégica específica y práctica, explicando brevemente el PORQUÉ de esa acción.

FORMATO DE RESPUESTA:
🎯 ACCIÓN RECOMENDADA: [Descripción clara de qué hacer]
💡 RAZÓN: [Por qué esta acción es efectiva ahora]
⏱️ TIMING: [Cuándo ejecutar esta acción]`;

    const userPrompt = `Analiza esta conversación con ${prospect_name} y sugiere la mejor ACCIÓN ESTRATÉGICA:

${conversation}

Sugerencia de acción:`;

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
        temperature: 0.8,
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

    console.log('✅ Sugerencia estratégica generada:', suggestion)

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
