import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚀 Función generate-prospect-messages iniciada')
  console.log('📝 Método:', req.method)

  try {
    console.log('📨 Procesando request...')
    const requestBody = await req.json()
    console.log('📋 Body recibido:', requestBody)
    
    const { 
      messageLimit,
      username,
      tema,
      typeOfProspection,
      followObservationText 
    } = requestBody

    console.log('🔑 Verificando OpenAI API key...')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key no configurada')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ OpenAI API key encontrada')

    // Crear prompt específico para generar mensajes de seguimiento de Instagram
    let prompt = `Quiero que generes mensajes de seguimiento para Instagram dirigidos a personas que dejaron de responder o nunca respondieron.

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
	•	Generar exactamente ${messageLimit} mensajes.
	•	Formato de salida obligatorio: cada mensaje separado por &&

🔹 Ejemplos de mensajes válidos con este ajuste:
	•	Hola Laura? solo paso a dejarte este recordatorio amistoso ¿seguimos en contacto?
	•	Felipe? escribo de nuevo por si no viste lo anterior ¿lo retomamos?
	•	¿Estás por ahí? me parecía raro dejar la conversación en pausa ¿aún tiene sentido retomarla?
	
Usuario objetivo: ${username}
Tema/contexto: ${tema}
Tipo de prospección: ${typeOfProspection}
Observación adicional: ${followObservationText || 'N/A'}`

    console.log('🤖 Generando mensajes de prospección con OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    })

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
    const generatedContent = data.choices?.[0]?.message?.content?.trim()

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Separar los mensajes usando &&
    const messages = generatedContent.split('&&').map(msg => msg.trim()).filter(msg => msg.length > 0)

    console.log('✅ Mensajes generados:', messages.length)

    return new Response(
      JSON.stringify({ 
        messages,
        rawContent: generatedContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in generate-prospect-messages:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})