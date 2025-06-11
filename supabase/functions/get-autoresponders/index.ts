
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 Solicitud de autoresponders:', body)
      
      // Obtener autoresponders desde localStorage (enviado en el body)
      const autoresponders = body.autoresponders || []
      
      console.log('📋 Autoresponders encontrados:', autoresponders.length)
      
      // Filtrar solo los activos
      const activeAutoresponders = autoresponders.filter((ar: any) => ar.is_active)
      
      console.log('✅ Autoresponders activos:', activeAutoresponders.length)
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: activeAutoresponders 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('❌ Error en get-autoresponders:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
