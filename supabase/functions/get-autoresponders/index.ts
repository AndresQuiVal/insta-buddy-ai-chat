
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Almacenamiento temporal en memoria (en producción esto sería una base de datos)
let storedAutoresponders: any[] = []

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 Solicitud POST:', body)
      
      // Si viene con autoresponders, los almacenamos
      if (body.action === 'store' && body.autoresponders) {
        storedAutoresponders = body.autoresponders
        console.log('💾 Autoresponders almacenados:', storedAutoresponders.length)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Autoresponders almacenados correctamente',
          count: storedAutoresponders.length 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Si es una consulta desde el webhook, devolvemos los almacenados
      console.log('📋 Consultando autoresponders almacenados:', storedAutoresponders.length)
      
      // Filtrar solo los activos
      const activeAutoresponders = storedAutoresponders.filter((ar: any) => ar.is_active)
      
      console.log('✅ Autoresponders activos:', activeAutoresponders.length)
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: activeAutoresponders 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (req.method === 'GET') {
      // GET request para consultar autoresponders
      const activeAutoresponders = storedAutoresponders.filter((ar: any) => ar.is_active)
      
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
