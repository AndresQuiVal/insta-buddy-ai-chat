
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

    // Configuración de Instagram
    const CLIENT_ID = '1059372749433300'
    const CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET') // Se configurará en Supabase secrets

    if (!CLIENT_SECRET) {
      console.error('INSTAGRAM_CLIENT_SECRET no está configurado')
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Intercambiar código por token de acceso
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Error de Instagram API:', errorData)
      return new Response(
        JSON.stringify({ error: 'Error obteniendo token de Instagram' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await tokenResponse.json()

    // Obtener información básica del usuario
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`)
    
    let userData = null
    if (userResponse.ok) {
      userData = await userResponse.json()
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
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
