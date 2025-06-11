
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
      console.log('📨 Solicitud POST recibida:', JSON.stringify(body, null, 2))
      
      // Si viene con action store, almacenar autoresponders
      if (body.action === 'store' && body.autoresponders) {
        storedAutoresponders = body.autoresponders
        console.log('💾 Autoresponders almacenados exitosamente:', storedAutoresponders.length)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Autoresponders almacenados correctamente',
          count: storedAutoresponders.length,
          stored: storedAutoresponders
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Si no tiene action store, es una consulta desde el webhook
      console.log('🔍 Consultando autoresponders almacenados')
      console.log('📋 Total almacenados:', storedAutoresponders.length)
      
      // Filtrar solo los activos
      const activeAutoresponders = storedAutoresponders.filter((ar: any) => ar.is_active === true)
      
      console.log('✅ Autoresponders activos encontrados:', activeAutoresponders.length)
      console.log('📊 Detalle de activos:', activeAutoresponders.map(ar => ({
        id: ar.id,
        name: ar.name,
        is_active: ar.is_active,
        message_text: ar.message_text?.substring(0, 50) + '...'
      })))
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: activeAutoresponders,
        total_stored: storedAutoresponders.length,
        total_active: activeAutoresponders.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (req.method === 'GET') {
      // GET request para consultar autoresponders
      const activeAutoresponders = storedAutoresponders.filter((ar: any) => ar.is_active === true)
      
      console.log('📋 GET - Autoresponders activos:', activeAutoresponders.length)
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: activeAutoresponders,
        total_stored: storedAutoresponders.length,
        total_active: activeAutoresponders.length
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
      error: error.message,
      stored_count: storedAutoresponders.length
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
