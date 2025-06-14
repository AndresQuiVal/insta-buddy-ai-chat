
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

    // Configuración de Instagram Graph API (nueva API oficial)
    const INSTAGRAM_APP_ID = "1059372749433300"; // Instagram App ID principal
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

    console.log('=== CONFIGURACIÓN DE INSTAGRAM GRAPH API ===')
    console.log('Instagram App ID:', INSTAGRAM_APP_ID)
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    // Intercambiar código por token de acceso usando Instagram API directo
    const tokenUrl = "https://api.instagram.com/oauth/access_token";
    const formData = new FormData();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirect_uri);
    formData.append("code", code);

    console.log('Enviando solicitud a Instagram API...')
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      body: formData,
    });

    const tokenData = await tokenResponse.json()
    
    console.log('Respuesta de Instagram API:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error
    })
    
    if (!tokenResponse.ok) {
      console.error('Error detallado de Instagram API:', tokenData)
      
      // Manejo específico de errores comunes
      let errorDescription = tokenData.error?.message || 'Error obteniendo token de Instagram'
      
      if (tokenData.error?.code === 400) {
        errorDescription = 'App ID o Client Secret incorrectos. Verifica la configuración en Instagram Developers.'
      } else if (tokenData.error?.type === 'OAuthException') {
        errorDescription = `URL de redirección no válida: ${redirect_uri}. Configúrala en Instagram Developers.`
      } else if (tokenData.error?.code === 190) {
        errorDescription = 'Código de autorización inválido o expirado. Intenta autenticarte nuevamente.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: tokenData.error?.type || 'token_exchange_failed',
          error_description: errorDescription,
          debug_info: {
            client_id_used: INSTAGRAM_APP_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status,
            instagram_error: tokenData.error
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token obtenido exitosamente')

    // Obtener información del usuario de Instagram usando el token
    let instagramData = null;
    let debugInfo = {
      token_obtained: true,
      user_info_attempt: false,
      user_info_success: false,
      detailed_errors: []
    }

    try {
      console.log('=== OBTENIENDO INFORMACIÓN DEL USUARIO DE INSTAGRAM ===')
      
      const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${tokenData.access_token}`)
      debugInfo.user_info_attempt = true
      
      if (userResponse.ok) {
        instagramData = await userResponse.json()
        debugInfo.user_info_success = true
        console.log('✓ Información de Instagram obtenida:', instagramData)
      } else {
        const userError = await userResponse.text()
        console.log('✗ Error obteniendo info de Instagram:', userError)
        debugInfo.detailed_errors.push(`Error Instagram: ${userError}`)
        // Usar información básica como fallback
        instagramData = { id: 'unknown', username: 'usuario_instagram' }
      }
    } catch (error) {
      console.log('✗ Excepción obteniendo info de Instagram:', error.message)
      debugInfo.detailed_errors.push(`Excepción Instagram: ${error.message}`)
      // Usar información básica como fallback
      instagramData = { id: 'unknown', username: 'usuario_instagram' }
    }

    // Preparar respuesta con datos de Instagram
    const responseData = {
      access_token: tokenData.access_token,
      instagram_account: instagramData,
      debug_info: {
        app_mode: 'production',
        client_id_used: INSTAGRAM_APP_ID,
        api_version: 'Instagram Graph API',
        extended_debug: debugInfo
      }
    }

    return new Response(
      JSON.stringify(responseData),
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
