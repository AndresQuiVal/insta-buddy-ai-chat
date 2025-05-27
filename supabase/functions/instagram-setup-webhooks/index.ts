
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
    console.log('=== CONFIGURANDO WEBHOOKS DE INSTAGRAM ===')

    // Obtener el token de acceso
    const ACCESS_TOKEN = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!ACCESS_TOKEN) {
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

    // Determinar si usar Instagram API o Facebook API
    const isInstagramAPI = ACCESS_TOKEN.includes('IG')
    const baseURL = isInstagramAPI ? 'https://graph.instagram.com' : 'https://graph.facebook.com'
    const apiVersion = 'v19.0'
    
    console.log('Using API:', isInstagramAPI ? 'Instagram API' : 'Facebook API')

    // Campos de webhook que queremos suscribir según la documentación
    const webhookFields = [
      'messages',           // Para recibir mensajes
      'messaging_optins',   // Para opt-ins de mensajería
      'messaging_postbacks',// Para postbacks
      'messaging_reactions',// Para reacciones
      'messaging_seen',     // Para mensajes leídos
      'comments',           // Para comentarios
      'mentions'            // Para menciones
    ]

    console.log('Webhook fields to subscribe:', webhookFields)

    // Construir la URL del endpoint
    let endpoint = `${baseURL}/${apiVersion}/me/subscribed_apps`
    
    if (isInstagramAPI) {
      const instagramAccountId = Deno.env.get('INSTAGRAM_ACCOUNT_ID') || 'me'
      endpoint = `${baseURL}/${apiVersion}/${instagramAccountId}/subscribed_apps`
    }

    console.log('Subscription endpoint:', endpoint)

    // Hacer la llamada para suscribirse a los webhooks
    const response = await fetch(`${endpoint}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `subscribed_fields=${webhookFields.join(',')}`
    })

    const responseData = await response.json()
    
    console.log('Subscription response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    })

    if (!response.ok) {
      console.error('Error configurando webhooks:', responseData)
      
      let errorDescription = responseData.error?.message || 'Error configurando webhooks'
      
      if (responseData.error?.code === 190) {
        errorDescription = 'Token de acceso inválido o expirado.'
      } else if (responseData.error?.code === 200) {
        errorDescription = 'Permisos insuficientes. Necesitas: instagram_basic, instagram_manage_messages, etc.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: responseData.error?.type || 'webhook_setup_failed',
          error_description: errorDescription,
          debug_info: {
            response_status: response.status,
            api_error: responseData.error,
            endpoint_used: endpoint,
            fields_requested: webhookFields
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Webhooks configurados exitosamente')

    // Verificar el estado actual de las suscripciones
    const checkResponse = await fetch(`${endpoint}?access_token=${ACCESS_TOKEN}`, {
      method: 'GET'
    })

    const checkData = await checkResponse.json()
    console.log('Current subscriptions:', checkData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhooks configurados correctamente',
        subscribed_fields: webhookFields,
        current_subscriptions: checkData.data || checkData,
        api_used: isInstagramAPI ? 'Instagram' : 'Facebook'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error configurando webhooks:', error)
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
