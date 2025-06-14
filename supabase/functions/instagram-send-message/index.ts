
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
    const { recipient_id, message_text, reply_to_message_id, access_token } = await req.json()

    if (!recipient_id || !message_text) {
      return new Response(
        JSON.stringify({ error: 'recipient_id y message_text son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== ENVIANDO MENSAJE A INSTAGRAM GRAPH API v23.0 ===')
    console.log('Recipient ID:', recipient_id)
    console.log('Message:', message_text)
    console.log('Reply to:', reply_to_message_id)

    // NUEVA LÓGICA: Priorizar token del request, luego variable de entorno
    let ACCESS_TOKEN = access_token || Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!ACCESS_TOKEN) {
      console.error('❌ NO HAY TOKEN DE INSTAGRAM DISPONIBLE')
      console.log('💡 Nota: Se requiere un token de acceso válido')
      console.log('💡 Puede enviarse en el body del request o configurarse como variable de entorno')
      return new Response(
        JSON.stringify({ 
          error: 'access_token_missing', 
          error_description: 'Token de acceso de Instagram requerido. Envíalo en el body del request o configúralo como variable de entorno.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Token encontrado, longitud:', ACCESS_TOKEN.length)
    console.log('📝 Token preview:', ACCESS_TOKEN.substring(0, 20) + '...')
    console.log('🔹 Fuente del token:', access_token ? 'request body' : 'environment variable')

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

    // Usar Instagram Graph API v23.0
    const response = await fetch(`https://graph.instagram.com/v23.0/me/messages?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    console.log('Instagram Graph API v23.0 response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    })

    if (!response.ok) {
      console.error('Error enviando mensaje a Instagram Graph API v23.0:', responseData)
      
      let errorDescription = responseData.error?.message || 'Error enviando mensaje'
      
      if (responseData.error?.code === 190) {
        errorDescription = 'Token de acceso inválido o expirado. Reconecta tu cuenta de Instagram y actualiza el token.'
      } else if (responseData.error?.code === 200) {
        errorDescription = 'Permisos insuficientes. Verifica la configuración de la app en Facebook Developers.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: responseData.error?.type || 'send_message_failed',
          error_description: errorDescription,
          debug_info: {
            response_status: response.status,
            instagram_error: responseData.error,
            token_source: access_token ? 'request_body' : 'environment'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Mensaje enviado exitosamente via Instagram Graph API v23.0')

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
