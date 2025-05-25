
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
    const CLIENT_ID = '1059372749433300'
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

    console.log('Intercambiando código por token...')
    console.log('Client ID:', CLIENT_ID)
    console.log('Redirect URI:', redirect_uri)

    // Intercambiar código por token de acceso usando Basic Display API
    const tokenUrl = 'https://api.instagram.com/oauth/access_token'
    
    const formData = new FormData()
    formData.append('client_id', CLIENT_ID)
    formData.append('client_secret', CLIENT_SECRET)
    formData.append('grant_type', 'authorization_code')
    formData.append('redirect_uri', redirect_uri)
    formData.append('code', code)

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      body: formData
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Error de Instagram API:', tokenData)
      return new Response(
        JSON.stringify({ 
          error: tokenData.error || 'token_exchange_failed',
          error_description: tokenData.error_description || 'Error obteniendo token de Instagram'
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
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        user: userData
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
        error_description: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
