
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
    const { recipient_id, message_text, reply_to_message_id, message_type = 'text' } = await req.json()

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
    console.log('Message Type:', message_type)
    console.log('Reply to:', reply_to_message_id)

    // Obtener el token de acceso de Instagram
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

    // Determinar si usar Instagram API o Facebook API según el tipo de token
    const isInstagramAPI = ACCESS_TOKEN.includes('IG') || message_type === 'instagram_direct'
    const baseURL = isInstagramAPI ? 'https://graph.instagram.com' : 'https://graph.facebook.com'
    const apiVersion = 'v19.0'
    
    console.log('Using API:', isInstagramAPI ? 'Instagram API' : 'Facebook API')
    console.log('Base URL:', baseURL)

    // Construir el payload del mensaje según la especificación de Facebook
    const messagePayload: any = {
      recipient: {
        id: recipient_id
      }
    }

    // Configurar el mensaje según el tipo
    if (message_type === 'text' || !message_type) {
      messagePayload.message = {
        text: message_text
      }
    } else if (message_type === 'image') {
      messagePayload.message = {
        attachment: {
          type: 'image',
          payload: {
            url: message_text
          }
        }
      }
    } else if (message_type === 'video') {
      messagePayload.message = {
        attachment: {
          type: 'video',
          payload: {
            url: message_text
          }
        }
      }
    } else if (message_type === 'audio') {
      messagePayload.message = {
        attachment: {
          type: 'audio',
          payload: {
            url: message_text
          }
        }
      }
    } else if (message_type === 'sticker') {
      messagePayload.message = {
        attachment: {
          type: 'like_heart'
        }
      }
    }

    // Si es una respuesta, incluir referencia al mensaje original
    if (reply_to_message_id) {
      messagePayload.message.metadata = `reply_to_${reply_to_message_id}`
    }

    console.log('Message payload:', JSON.stringify(messagePayload, null, 2))

    // Construir la URL del endpoint según la API
    let endpoint = `${baseURL}/${apiVersion}/me/messages`
    
    if (isInstagramAPI) {
      // Para Instagram API, usar el ID de la cuenta de Instagram
      const instagramAccountId = Deno.env.get('INSTAGRAM_ACCOUNT_ID') || 'me'
      endpoint = `${baseURL}/${apiVersion}/${instagramAccountId}/messages`
    }

    console.log('Sending to endpoint:', endpoint)

    // Enviar mensaje usando la API correspondiente
    const response = await fetch(`${endpoint}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    console.log('API response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    })

    if (!response.ok) {
      console.error('Error enviando mensaje:', responseData)
      
      let errorDescription = responseData.error?.message || 'Error enviando mensaje'
      
      // Manejo específico de errores comunes según la documentación
      if (responseData.error?.code === 190) {
        errorDescription = 'Token de acceso inválido o expirado. Necesitas reconectar tu cuenta de Instagram.'
      } else if (responseData.error?.code === 200) {
        errorDescription = 'Permisos insuficientes. Verifica que tengas los permisos: instagram_basic, instagram_manage_messages.'
      } else if (responseData.error?.code === 10) {
        errorDescription = 'No se puede enviar mensaje. El usuario debe enviarte un mensaje primero.'
      } else if (responseData.error?.code === 2018109) {
        errorDescription = 'La ventana de mensajería de 24 horas ha expirado. El usuario debe enviarte un nuevo mensaje.'
      } else if (responseData.error?.code === 551) {
        errorDescription = 'Este usuario no puede recibir mensajes de tu cuenta.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: responseData.error?.type || 'send_message_failed',
          error_description: errorDescription,
          debug_info: {
            response_status: response.status,
            api_error: responseData.error,
            endpoint_used: endpoint,
            api_type: isInstagramAPI ? 'Instagram' : 'Facebook'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Mensaje enviado exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message_id: responseData.message_id,
        recipient_id: responseData.recipient_id,
        api_used: isInstagramAPI ? 'Instagram' : 'Facebook'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error en edge function instagram-send-message:', error)
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
