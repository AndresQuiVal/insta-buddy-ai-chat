
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
    const FACEBOOK_APP_ID = '2942884966099377' // Facebook App ID principal
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
    console.log('Facebook App ID:', FACEBOOK_APP_ID)
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    // Intercambiar código por token de acceso usando Graph API
    const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token'
    
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
      code: code
    })

    console.log('Enviando solicitud a Facebook Graph API...')
    
    const tokenResponse = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'GET'
    })

    const tokenData = await tokenResponse.json()
    
    console.log('Respuesta de Graph API:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error
    })
    
    if (!tokenResponse.ok) {
      console.error('Error detallado de Graph API:', tokenData)
      
      // Manejo específico de errores comunes
      let errorDescription = tokenData.error?.message || 'Error obteniendo token de Instagram'
      
      if (tokenData.error?.code === 100) {
        errorDescription = 'App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.'
      } else if (tokenData.error?.type === 'OAuthException') {
        errorDescription = `URL de redirección no válida: ${redirect_uri}. Configúrala en Facebook Developers.`
      } else if (tokenData.error?.code === 190) {
        errorDescription = 'Código de autorización inválido o expirado. Intenta autenticarte nuevamente.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: tokenData.error?.type || 'token_exchange_failed',
          error_description: errorDescription,
          debug_info: {
            client_id_used: FACEBOOK_APP_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status,
            facebook_error: tokenData.error
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token obtenido exitosamente')

    // Obtener información del usuario de Instagram usando Graph API
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`)
    
    let userData = null
    let instagramData = null

    if (userResponse.ok) {
      userData = await userResponse.json()
      console.log('Datos de usuario de Facebook obtenidos:', userData)

      // Intentar obtener cuentas de Instagram conectadas
      try {
        const instagramAccountsResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=instagram_business_account&access_token=${tokenData.access_token}`)
        
        if (instagramAccountsResponse.ok) {
          const accountsData = await instagramAccountsResponse.json()
          console.log('Cuentas de Instagram encontradas:', accountsData)
          
          // Buscar la primera cuenta con Instagram business
          const pageWithInstagram = accountsData.data?.find(page => page.instagram_business_account)
          
          if (pageWithInstagram) {
            const instagramAccountId = pageWithInstagram.instagram_business_account.id
            
            // Obtener información detallada de la cuenta de Instagram
            const instagramInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`)
            
            if (instagramInfoResponse.ok) {
              instagramData = await instagramInfoResponse.json()
              console.log('Datos de Instagram obtenidos:', instagramData)
            }
          }
        }
      } catch (instagramError) {
        console.error('Error obteniendo datos de Instagram:', instagramError)
        // No es crítico, continuamos con los datos de Facebook
      }
    } else {
      console.error('Error obteniendo datos de usuario:', await userResponse.text())
      // En modo Development, esto puede fallar pero no es crítico
      userData = {
        id: 'development_user',
        name: 'Usuario de Prueba'
      }
    }

    // Preparar respuesta con datos combinados
    const responseData = {
      access_token: tokenData.access_token,
      user: userData,
      instagram_account: instagramData,
      debug_info: {
        app_mode: 'production',
        client_id_used: FACEBOOK_APP_ID,
        api_version: 'Graph API v19.0'
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
