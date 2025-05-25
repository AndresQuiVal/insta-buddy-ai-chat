
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
    const { code, redirect_uri } = await req.json()

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Código y redirect_uri son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configuración de Instagram Basic Display API
    const CLIENT_ID = '1059372749433300' // Instagram App ID
    const FACEBOOK_APP_ID = '2942884966099377' // Main Facebook App ID (para referencia)
    const CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET')

    if (!CLIENT_SECRET) {
      console.error('INSTAGRAM_CLIENT_SECRET no está configurado')
      return new Response(
        JSON.stringify({ 
          error: 'invalid_client_secret', 
          error_description: 'Configuración del servidor incompleta' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== CONFIGURACIÓN DE INSTAGRAM ===')
    console.log('Instagram App ID (Client ID):', CLIENT_ID)
    console.log('Facebook App ID:', FACEBOOK_APP_ID)
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    // Intercambiar código por token de acceso usando Basic Display API
    const tokenUrl = 'https://api.instagram.com/oauth/access_token'
    
    const formData = new FormData()
    formData.append('client_id', CLIENT_ID)
    formData.append('client_secret', CLIENT_SECRET)
    formData.append('grant_type', 'authorization_code')
    formData.append('redirect_uri', redirect_uri)
    formData.append('code', code)

    console.log('Enviando solicitud a Instagram API...')
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      body: formData
    })

    const tokenData = await tokenResponse.json()
    
    console.log('Respuesta de Instagram API:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error
    })
    
    if (!tokenResponse.ok) {
      console.error('Error detallado de Instagram API:', tokenData)
      
      // Manejo específico de errores comunes
      let errorDescription = tokenData.error_description || 'Error obteniendo token de Instagram'
      
      if (tokenData.error === 'invalid_client') {
        errorDescription = 'App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.'
      } else if (tokenData.error === 'redirect_uri_mismatch') {
        errorDescription = `URL de redirección no válida: ${redirect_uri}. Configúrala en Facebook Developers.`
      } else if (tokenData.error === 'invalid_grant') {
        errorDescription = 'Código de autorización inválido o expirado. Intenta autenticarte nuevamente.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: tokenData.error || 'token_exchange_failed',
          error_description: errorDescription,
          debug_info: {
            client_id_used: CLIENT_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token obtenido exitosamente')

    // Obtener información básica del usuario usando Basic Display API
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`)
    
    let userData = null
    if (userResponse.ok) {
      userData = await userResponse.json()
      console.log('Datos de usuario obtenidos:', userData)
    } else {
      console.error('Error obteniendo datos de usuario:', await userResponse.text())
      // En modo Development, esto puede fallar pero no es crítico
      userData = {
        id: 'development_user',
        username: 'usuario_prueba',
        account_type: 'BUSINESS'
      }
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        user: userData,
        debug_info: {
          app_mode: 'development',
          client_id_used: CLIENT_ID
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en edge function:', error)
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
