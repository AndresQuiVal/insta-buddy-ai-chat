
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

    // Crear prompt específico para generar mensajes de seguimiento de Instagram
    let systemPrompt = `Quiero que generes mensajes de seguimiento para Instagram dirigidos a personas que dejaron de responder o nunca respondieron.

Estructura obligatoria de cada mensaje
	1.	Saludo casual con nombre o forma breve, usando variedad:
	•	Formatos válidos:
	•	"¡Hola [NOMBRE]!"
	•	"[NOMBRE]?"
	•	"Hola [NOMBRE]?"
	•	"¿Estás por ahí?"
	•	Deben alternarse entre mensajes para dar naturalidad.
	2.	Observación ligera / excusa amable para justificar el nuevo mensaje (ejemplo: "por si se perdió mi mensaje", "solo quería romper el silencio").
	3.	Pregunta abierta breve que invite a reanudar sin presión (ejemplo: "¿seguimos en contacto?", "¿aún tiene sentido para ti?", "¿lo retomamos?").
	4.	Personalización opcional para sonar cercano y cero comercial.

Instrucciones estrictas
	•	Estilo 100 % humano, cálido, cero venta.
	•	Longitud total: entre 18 y 28 palabras.
	•	Una sola pregunta por mensaje.
	•	Prohibido: "negocio", "oportunidad", "ganancias", "precio", "cliente", "vender", "seguidores", "likes", "comentarios".
	•	Sin emojis, sin llamadas a la acción tipo agenda/reunión.
	•	Cambiar vocabulario, ritmo y excusas en cada mensaje para no sonar repetitivo.
	•	Saludos deben variar entre los cuatro formatos listados arriba.
	•	Formato de salida obligatorio: solo el mensaje, sin numeración ni separadores.

🔹 Ejemplos de mensajes válidos con este ajuste:
	•	Hola Laura? solo paso a dejarte este recordatorio amistoso ¿seguimos en contacto?
	•	Felipe? escribo de nuevo por si no viste lo anterior ¿lo retomamos?
	•	¿Estás por ahí? me parecía raro dejar la conversación en pausa ¿aún tiene sentido retomarla?`;

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
