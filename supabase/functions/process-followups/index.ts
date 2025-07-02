
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 ===== INICIANDO PROCESAMIENTO DE FOLLOW-UPS =====')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener follow-ups pendientes usando la función de base de datos
    console.log('📋 Obteniendo follow-ups pendientes...')
    
    const { data: followupResults, error: followupError } = await supabase.rpc('process_pending_followups')
    
    if (followupError) {
      console.error('❌ Error obteniendo follow-ups:', followupError)
      throw followupError
    }

    console.log('📊 Resultados de follow-ups:', followupResults)
    
    if (!followupResults || followupResults.length === 0) {
      console.log('✅ No hay follow-ups pendientes para procesar')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending follow-ups',
        processed_count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = followupResults[0]
    const processedCount = result.processed_count || 0
    const details = result.details || []

    console.log('📈 Follow-ups procesados:', processedCount)
    console.log('📋 Detalles:', details)

    // Enviar los follow-ups que están listos
    let sentCount = 0
    let errors = []

    for (const detail of details) {
      if (detail.status === 'ready_to_send') {
        console.log('📤 Enviando follow-up a:', detail.sender_id)
        console.log('💬 Mensaje:', detail.message_text)
        
        try {
          // Buscar el usuario de Instagram para obtener su ID
          const { data: instagramUser, error: userError } = await supabase
            .from('instagram_users')
            .select('instagram_user_id')
            .eq('is_active', true)
            .limit(1)
            .single()

          if (userError || !instagramUser) {
            console.error('❌ No se encontró usuario de Instagram activo:', userError)
            errors.push({
              followup_id: detail.followup_id,
              error: 'No active Instagram user found'
            })
            continue
          }

          // Enviar el mensaje de follow-up
          const { data: sendResult, error: sendError } = await supabase.functions.invoke('instagram-send-message', {
            body: {
              recipient_id: detail.sender_id,
              message_text: detail.message_text,
              instagram_user_id: instagramUser.instagram_user_id
            }
          })

          if (sendError) {
            console.error('❌ Error enviando follow-up:', sendError)
            errors.push({
              followup_id: detail.followup_id,
              error: sendError.message
            })
          } else {
            console.log('✅ Follow-up enviado exitosamente')
            sentCount++
            
            // Marcar como completado
            const { error: updateError } = await supabase
              .from('autoresponder_followups')
              .update({ 
                is_completed: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', detail.followup_id)

            if (updateError) {
              console.error('⚠️ Error marcando follow-up como completado:', updateError)
            }
          }
        } catch (sendException) {
          console.error('💥 Excepción enviando follow-up:', sendException)
          errors.push({
            followup_id: detail.followup_id,
            error: sendException.message
          })
        }
      } else if (detail.status === 'skipped_prospect_responded') {
        console.log('⏭️ Follow-up saltado - prospecto ya respondió:', detail.sender_id)
      }
    }

    console.log('🎯 === RESUMEN DE PROCESAMIENTO ===')
    console.log('📈 Follow-ups identificados:', processedCount)
    console.log('📤 Follow-ups enviados:', sentCount)
    console.log('❌ Errores:', errors.length)

    return new Response(JSON.stringify({
      success: true,
      processed_count: processedCount,
      sent_count: sentCount,
      errors: errors,
      details: details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error crítico en procesamiento de follow-ups:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
