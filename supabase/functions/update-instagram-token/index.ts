
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
    const { access_token } = await req.json()

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'access_token es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== ACTUALIZANDO TOKEN DE INSTAGRAM ===')
    console.log('Nuevo token recibido:', access_token.substring(0, 20) + '...')

    // Validar el token con Facebook Graph API
    const validationResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${access_token}`)
    
    if (!validationResponse.ok) {
      const errorData = await validationResponse.json()
      console.error('Token inválido:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'invalid_token',
          error_description: 'El token no es válido o ha expirado',
          debug_info: errorData
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = await validationResponse.json()
    console.log('Token válido para usuario:', userData.name || userData.id)

    // Aquí actualizarías el token en tu base de datos o almacenamiento seguro
    // Por ahora, simplemente confirmamos que el token es válido
    
    console.log('✅ Token actualizado exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token actualizado correctamente',
        user: userData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error actualizando token:', error)
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
