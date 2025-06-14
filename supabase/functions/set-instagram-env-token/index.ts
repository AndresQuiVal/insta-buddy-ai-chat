
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
    console.log('🔧 === CONFIGURANDO TOKEN EN VARIABLES DE ENTORNO ===')
    
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

    console.log('📝 Configurando INSTAGRAM_ACCESS_TOKEN...')
    
    // NOTA: Esta función simula la configuración
    // En realidad, las variables de entorno de las edge functions 
    // se configuran manualmente en Supabase Dashboard > Settings > Functions
    
    console.log('⚠️ ACCIÓN MANUAL REQUERIDA:')
    console.log('1. Ve a Supabase Dashboard')
    console.log('2. Settings > Functions')
    console.log('3. Configura INSTAGRAM_ACCESS_TOKEN con el nuevo token')
    console.log('4. Token preview:', access_token.substring(0, 20) + '...')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token listo para configurar manualmente',
        instructions: {
          step1: 'Ve a Supabase Dashboard > Settings > Functions',
          step2: 'Configura INSTAGRAM_ACCESS_TOKEN',
          step3: 'Usa el token proporcionado',
          token_preview: access_token.substring(0, 20) + '...'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
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
