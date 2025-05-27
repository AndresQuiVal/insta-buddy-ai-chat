
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
    const { recipient_id, message_text, reply_to_message_id } = await req.json()

    if (!recipient_id || !message_text) {
      return new Response(
        JSON.stringify({ error: 'recipient_id y message_text son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== ENVIANDO MENSAJE A INSTAGRAM ===')
    console.log('Recipient ID:', recipient_id)
    console.log('Message:', message_text)
    console.log('Reply to:', reply_to_message_id)

    // Obtener el token de acceso desde las variables de entorno
    const ACCESS_TOKEN = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!ACCESS_TOKEN) {
      console.error('INSTAGRAM_ACCESS_TOKEN no está configurado')
      return new Response(
        JSON.stringify({ 
          error: 'access_token_missing', 
          error_description: 'Token de acceso de Instagram no configurado' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token length:', ACCESS_TOKEN.length)
    console.log('Token preview:', ACCESS_TOKEN.substring(0, 20) + '...')

    // Construir el payload del mensaje
    const messagePayload: any = {
      recipient: {
        id: recipient_id
      },
      message: {
        text: message_text
      }
    }

    // Si es una respuesta, incluir referencia al mensaje original
    if (reply_to_message_id) {
      messagePayload.message.quick_replies = [
        {
          content_type: "text",
          title: "Respuesta automática",
          payload: `reply_to_${reply_to_message_id}`
        }
      ]
    }

    console.log('Message payload:', JSON.stringify(messagePayload, null, 2))

    // Enviar mensaje usando Instagram Graph API
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    console.log('Instagram API response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    })

    if (!response.ok) {
      console.error('Error enviando mensaje a Instagram:', responseData)
      
      let errorDescription = responseData.error?.message || 'Error enviando mensaje'
      let errorCode = responseData.error?.code || 'unknown_error'
      
      // Mejorar los mensajes de error para hacerlos más útiles
      if (responseData.error?.code === 190) {
        errorDescription = 'Token de acceso inválido o expirado. Reconecta tu cuenta de Instagram.'
        errorCode = 'invalid_token'
      } else if (responseData.error?.code === 200) {
        errorDescription = 'Permisos insuficientes. Verifica la configuración de la app en Facebook Developers.'
        errorCode = 'permission_error'
      } else if (responseData.error?.code === 100 && responseData.error?.message?.includes('invalid parameter')) {
        // Error común cuando el ID de Instagram no es válido
        errorDescription = 'ID de receptor inválido. Verifica que estás enviando un PSID válido o que la cuenta de Instagram está correctamente conectada.'
        errorCode = 'invalid_recipient'
      } else if (responseData.error?.code === 10) {
        // Error común: API Rate limit
        errorDescription = 'Límite de API alcanzado. Espera un momento y vuelve a intentarlo.'
        errorCode = 'rate_limit'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorCode,
          error_description: errorDescription,
          debug_info: {
            response_status: response.status,
            instagram_error: responseData.error
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Mensaje enviado exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message_id: responseData.message_id,
        recipient_id: responseData.recipient_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en edge function instagram-send-message:', error)
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
