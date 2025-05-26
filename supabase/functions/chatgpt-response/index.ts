
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversation_history, sender_id } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== GENERANDO RESPUESTA CON CHATGPT ===')
    console.log('Message:', message)
    console.log('Sender ID:', sender_id)
    console.log('History length:', conversation_history?.length || 0)

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY no está configurado')
      return new Response(
        JSON.stringify({ 
          error: 'openai_key_missing', 
          error_description: 'API key de OpenAI no configurado' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Construir el contexto de la conversación
    const messages = [
      {
        role: 'system',
        content: `Eres Hower, un asistente conversacional humano que se comunica a través de mensajes directos en Instagram. Tu objetivo es mantener conversaciones genuinas, cálidas y naturales, conectando emocionalmente con los prospectos y generando confianza.

Personalidad: Amigable y cercano, pero profesional cuando es necesario.

Instrucciones:
- Responde de manera natural y conversacional
- Haz preguntas abiertas para conocer mejor a la persona
- Mantén un tono cálido y empático
- Si la persona muestra interés en productos/servicios, identifica sutilmente si cumple con características de cliente ideal
- Responde en español siempre
- Mantén las respuestas concisas pero amigables
- No reveles que eres una IA a menos que te pregunten directamente`
      }
    ]

    // Agregar historial de conversación
    if (conversation_history && conversation_history.length > 0) {
      for (const historyItem of conversation_history.slice(-6)) { // Últimos 6 mensajes
        messages.push({
          role: historyItem.message_type === 'received' ? 'user' : 'assistant',
          content: historyItem.message_text
        })
      }
    }

    // Agregar mensaje actual
    messages.push({
      role: 'user',
      content: message
    })

    console.log('Enviando solicitud a OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    })

    const data = await response.json()
    
    console.log('OpenAI response:', {
      status: response.status,
      ok: response.ok,
      hasError: !!data.error
    })

    if (!response.ok) {
      console.error('Error de OpenAI:', data)
      
      let errorDescription = data.error?.message || 'Error generando respuesta'
      
      if (data.error?.code === 'insufficient_quota') {
        errorDescription = 'Cuota de OpenAI agotada. Verifica tu cuenta de OpenAI.'
      } else if (data.error?.code === 'invalid_api_key') {
        errorDescription = 'API key de OpenAI inválida. Verifica la configuración.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: data.error?.type || 'openai_error',
          error_description: errorDescription,
          debug_info: {
            response_status: response.status,
            openai_error: data.error
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const generatedResponse = data.choices[0].message.content
    console.log('Respuesta generada:', generatedResponse)

    return new Response(
      JSON.stringify({
        response: generatedResponse,
        tokens_used: data.usage?.total_tokens || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en edge function chatgpt-response:', error)
    return new Response(
      JSON.stringify({ 
        error: 'internal_server_error',
        error_description: 'Error interno del servidor',
        debug_info: {
          error_message: error.message
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
