
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
    console.log('🔄 === ACTUALIZANDO TOKEN DE INSTAGRAM ===')
    
    const { access_token } = await req.json()
    
    if (!access_token) {
      console.error('❌ No se proporcionó access_token')
      return new Response(
        JSON.stringify({ error: 'access_token es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📝 Token recibido, longitud:', access_token.length)
    console.log('📝 Token preview:', access_token.substring(0, 20) + '...')

    // Validar el token con Instagram Graph API v23.0
    console.log('🔍 Validando token con Instagram Graph API v23.0...')
    
    const validateResponse = await fetch(`https://graph.instagram.com/v23.0/me?access_token=${access_token}`)
    const validateData = await validateResponse.json()
    
    console.log('📊 Respuesta de validación:', {
      status: validateResponse.status,
      ok: validateResponse.ok,
      data: validateData
    })

    if (!validateResponse.ok) {
      console.error('❌ Token inválido:', validateData)
      return new Response(
        JSON.stringify({ 
          error: 'Token inválido',
          details: validateData
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Token válido para usuario:', validateData.name || validateData.username)

    // TODO: Aquí deberías guardar el token en tu base de datos o sistema de secretos
    // Por ahora, el token se mantiene en localStorage del cliente
    // y se pasa directamente a las edge functions cuando se necesita

    console.log('✅ Token actualizado correctamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token actualizado correctamente',
        user: validateData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error actualizando token:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
