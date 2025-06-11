
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 Solicitud POST recibida:', JSON.stringify(body, null, 2))
      
      // Si viene con action store, almacenar autoresponders en la base de datos
      if (body.action === 'store' && body.autoresponders) {
        console.log('💾 Guardando autoresponders en base de datos:', body.autoresponders.length)
        
        // Primero eliminar todos los autoresponders existentes
        const { error: deleteError } = await supabase
          .from('autoresponder_messages')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos
        
        if (deleteError) {
          console.error('⚠️ Error eliminando autoresponders anteriores:', deleteError)
        }

        // Ahora insertar los nuevos autoresponders
        if (body.autoresponders.length > 0) {
          const autoresponderData = body.autoresponders.map((ar: any) => ({
            name: ar.name,
            message_text: ar.message_text,
            is_active: ar.is_active,
            send_only_first_message: ar.send_only_first_message || false,
            user_id: null // Sin usuario específico por ahora
          }))

          const { error: insertError } = await supabase
            .from('autoresponder_messages')
            .insert(autoresponderData)
          
          if (insertError) {
            console.error('❌ Error insertando autoresponders:', insertError)
            return new Response(JSON.stringify({ 
              success: false, 
              error: insertError.message 
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
          }
        }
        
        console.log('✅ Autoresponders guardados exitosamente en BD')
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Autoresponders almacenados correctamente en base de datos',
          count: body.autoresponders.length
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Si no tiene action store, es una consulta desde el webhook
      console.log('🔍 Consultando autoresponders desde base de datos')
      
      // Obtener autoresponders activos de la base de datos
      const { data: autoresponders, error } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        console.error('❌ Error consultando autoresponders:', error)
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      console.log('✅ Autoresponders activos encontrados:', autoresponders?.length || 0)
      console.log('📊 Detalle de activos:', autoresponders?.map(ar => ({
        id: ar.id,
        name: ar.name,
        is_active: ar.is_active,
        message_text: ar.message_text?.substring(0, 50) + '...'
      })))
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: autoresponders || [],
        total_active: autoresponders?.length || 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (req.method === 'GET') {
      // GET request para consultar autoresponders desde base de datos
      const { data: autoresponders, error } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        console.error('❌ Error en GET autoresponders:', error)
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      console.log('📋 GET - Autoresponders activos:', autoresponders?.length || 0)
      
      return new Response(JSON.stringify({ 
        success: true, 
        autoresponders: autoresponders || [],
        total_active: autoresponders?.length || 0
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
