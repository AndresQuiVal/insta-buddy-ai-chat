
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

    console.log('🤖 Generando mensaje frío para:', prospect_name)
    console.log('📝 Conversación:', conversation)
    console.log('🎯 Características recibidas:', ideal_traits)

    // Crear prompt específico para generar mensajes fríos de Instagram
    let systemPrompt = `Quiero que generes mensajes fríos para Instagram con la siguiente estructura obligatoria:
	1.	Saludo casual + mención directa al nombre del prospecto.
	2.	Observación sobre algo que viste de la persona (su perfil, su publicación, su estilo, etc.).
	3.	Pregunta abierta única y curiosa, que invite a conversación natural (solo un «¿» y un «?» en todo el mensaje).
	4.	Personalización final breve, que refuerce que el mensaje es humano y no comercial.

Instrucciones estrictas:
	•	Cada mensaje debe ser 100 % humano, cálido y espontáneo, sin sonar a venta.
	•	Longitud total: entre 22 y 40 palabras.
	•	Prohibido usar: "oportunidad", "negocio", "ganancias", "cliente", "precio", "vender", "seguidores", "likes", "comentarios", "te interesa", "quieres", "puedo mostrarte", "agenda", "únete".
	•	No uses emojis, viñetas ni comillas.
	•	Una sola pregunta por mensaje.
	•	Cambia vocabulario y ritmo entre mensajes, evita repeticiones literales.
	•	Entrega exactamente 1 mensaje.
	•	Formato de salida obligatorio: solo el mensaje, sin numeración ni separadores.

🔹 Ejemplo de mensaje válido siguiendo la estructura:
Hola Laura, noté que compartes fotos de viajes con mucha naturalidad, me dio curiosidad, ¿qué destino sientes que más te ha cambiado? Me gusta conectar con personas que disfrutan explorar.`;

    // Si hay características configuradas, añadirlas al contexto del mensaje
    if (ideal_traits && ideal_traits.length > 0) {
      const enabledTraits = ideal_traits.filter((trait: any) => trait.enabled);
      
      if (enabledTraits.length > 0) {
        systemPrompt += `

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${enabledTraits.map((trait: any, index: number) => `${index + 1}. ${trait.trait}`).join('\n')}

Considera estas características para hacer observaciones más relevantes en tu mensaje, pero siempre mantén el tono natural y humano.`;
      }
    }


    const userPrompt = `Genera un mensaje frío para Instagram dirigido a ${prospect_name}. 

Información del prospecto y conversación previa (si existe):
${conversation}

Genera un mensaje siguiendo exactamente la estructura y reglas especificadas:`;

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
        max_tokens: 100,
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

    console.log('✅ Mensaje frío generado:', suggestion)

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
