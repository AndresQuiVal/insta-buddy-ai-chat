
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Verificación inicial de Facebook (hub.challenge)
    const url = new URL(req.url)
    const challenge = url.searchParams.get('hub.challenge')
    if (challenge) {
      console.log('🔐 Verificación de Facebook - respondiendo challenge:', challenge)
      return new Response(challenge, { status: 200 })
    }
    
    const body = await req.json()
    
    console.log('📨 ===== WEBHOOK RECIBIDO =====')
    console.log('📋 Webhook completo:', JSON.stringify(body, null, 2))

    if (body.object !== 'instagram') {
      console.log('❌ No es webhook de Instagram, objeto:', body.object)
      return new Response(
        JSON.stringify({ message: 'Not an Instagram webhook' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        console.log('🔄 ===== PROCESANDO ENTRY =====')
        console.log('📋 Entry ID:', entry.id)
        console.log('📋 Entry completo:', JSON.stringify(entry, null, 2))

        if (entry.messaging) {
          console.log('📝 PROCESANDO MENSAJES DIRECTOS')
          
          for (const messagingEvent of entry.messaging) {
            console.log('📝 Evento de mensaje:', JSON.stringify(messagingEvent, null, 2))
            
            const senderId = messagingEvent.sender.id
            const recipientId = messagingEvent.recipient.id
            const messageText = messagingEvent.message?.text
            const timestamp = new Date(messagingEvent.timestamp).toISOString()
            const messageId = messagingEvent.message?.mid
            const isEcho = messagingEvent.message?.is_echo === true

            console.log('🚀 === PROCESANDO MENSAJE ===')
            console.log('👤 SENDER ID:', senderId)
            console.log('🎯 RECIPIENT ID:', recipientId)
            console.log('💬 MENSAJE:', messageText)
            console.log('🔔 ES ECHO:', isEcho)

            // Skip si es un echo (mensaje que yo envié)
            if (isEcho) {
              console.log('⏭️ Es un echo - saltando')
              continue
            }

            // Actualizar actividad del prospecto
            console.log('🔄 Actualizando actividad del prospecto...')
            try {
              const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
                p_prospect_id: senderId 
              })
              
              if (activityError) {
                console.error('❌ Error actualizando actividad:', activityError)
              } else {
                console.log('✅ Actividad del prospecto actualizada')
              }
            } catch (activityErr) {
              console.error('💥 Error en update_prospect_activity:', activityErr)
            }

            // ===== BUSCAR USUARIO DE INSTAGRAM (CUALQUIER USUARIO ACTIVO) =====
            console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM =====')

            // Tomar el primer usuario activo disponible (sin validaciones de ID)
            const { data: instagramUser, error: userError } = await supabase
              .from('instagram_users')
              .select('*')
              .eq('is_active', true)
              .limit(1)
              .single()

            if (userError || !instagramUser) {
              console.error('❌ No se encontró ningún usuario de Instagram activo:', userError)
              continue
            }

            console.log('✅ Usuario de Instagram encontrado:', JSON.stringify(instagramUser, null, 2))

            // ===== CREAR O ACTUALIZAR PROSPECTO =====
            console.log('🔍 ===== CREANDO/ACTUALIZANDO PROSPECTO =====')
            
            let prospectId;
            try {
              const { data: prospectResult, error: prospectError } = await supabase.rpc('create_or_update_prospect', {
                p_instagram_user_id: instagramUser.id,
                p_prospect_instagram_id: senderId,
                p_username: `prospect_${senderId.slice(-8)}`,
                p_profile_picture_url: null
              })

              if (prospectError) {
                console.error('❌ Error creando prospecto:', prospectError)
                continue
              }

              prospectId = prospectResult
              console.log('✅ Prospecto creado/actualizado con ID:', prospectId)
              
            } catch (prospectErr) {
              console.error('💥 Error en create_or_update_prospect:', prospectErr)
              continue
            }

            // ===== GUARDAR MENSAJE DEL PROSPECTO =====
            try {
              const { data: messageResult, error: messageError } = await supabase.rpc('add_prospect_message', {
                p_prospect_id: prospectId,
                p_message_instagram_id: messageId,
                p_message_text: messageText,
                p_is_from_prospect: true,
                p_message_timestamp: timestamp,
                p_message_type: 'text',
                p_raw_data: messagingEvent
              })

              if (messageError) {
                console.error('❌ Error guardando mensaje:', messageError)
              } else {
                console.log('✅ Mensaje del prospecto guardado en BD')
              }
            } catch (messageErr) {
              console.error('💥 Error en add_prospect_message:', messageErr)
            }

            // ===== ANÁLISIS DEL MENSAJE =====
            console.log('🔍 ===== ANÁLISIS DEL MENSAJE =====')
            console.log('📝 Texto:', messageText)

            const isInvitation = messageText?.toLowerCase().includes('invitacion') || messageText?.toLowerCase().includes('invitación')
            const isPresentation = messageText?.toLowerCase().includes('presentacion') || messageText?.toLowerCase().includes('presentación')
            const isInscription = messageText?.toLowerCase().includes('inscripcion') || messageText?.toLowerCase().includes('inscripción')

            // ===== GUARDAR MENSAJE EN INSTAGRAM_MESSAGES =====
            const { error: saveError } = await supabase
              .from('instagram_messages')
              .insert({
                instagram_user_id: instagramUser.id,
                instagram_message_id: messageId,
                sender_id: senderId,
                recipient_id: recipientId,
                message_text: messageText || '',
                message_type: 'received',
                timestamp: timestamp,
                is_invitation: isInvitation,
                is_presentation: isPresentation,
                is_inscription: isInscription,
                raw_data: messagingEvent
              })

            if (saveError) {
              console.error('❌ Error guardando mensaje en instagram_messages:', saveError)
            } else {
              console.log('✅ Mensaje guardado correctamente')
            }

            // ===== OBTENER AUTORESPONDERS =====
            console.log('🔍 === OBTENIENDO AUTORESPONDERS ===')
            
            const { data: autoresponderResponse, error: autoresponderError } = await supabase.functions.invoke('get-autoresponders', {})

            if (autoresponderError || !autoresponderResponse?.success) {
              console.error('❌ Error obteniendo autoresponders:', autoresponderError)
              continue
            }

            const autoresponders = autoresponderResponse.autoresponders || []
            console.log('✅ Autoresponders obtenidos:', autoresponders.length)

            let selectedAutoresponder = null

            for (const autoresponder of autoresponders) {
              if (!autoresponder.use_keywords) {
                selectedAutoresponder = autoresponder
                break
              }

              const keywords = autoresponder.keywords || []
              let hasMatch = false

              for (const keyword of keywords) {
                if (messageText?.toLowerCase().includes(keyword.toLowerCase())) {
                  hasMatch = true
                  break
                }
              }

              if (hasMatch) {
                selectedAutoresponder = autoresponder
                break
              }
            }

            if (!selectedAutoresponder) {
              console.log('❌ No se encontró autoresponder que coincida')
              continue
            }

            console.log('🎯 AUTORESPONDER SELECCIONADO:', selectedAutoresponder.name)

            // Verificar si ya se envió autoresponder
            const { data: alreadySent } = await supabase
              .from('autoresponder_sent_log')
              .select('*')
              .eq('sender_id', senderId)
              .eq('autoresponder_message_id', selectedAutoresponder.id)

            if (selectedAutoresponder.send_only_first_message && alreadySent && alreadySent.length > 0) {
              console.log('⏭️ Ya se envió este autoresponder - saltando')
              continue
            }

            // Enviar autoresponder
            console.log('🚀 ENVIANDO AUTORESPONDER...')

            const { data, error } = await supabase.functions.invoke('instagram-send-message', {
              body: {
                recipient_id: senderId,
                message_text: selectedAutoresponder.message_text,
                instagram_user_id: recipientId
              }
            })

            if (error) {
              console.error('❌ Error enviando mensaje:', error)
              continue
            }

            console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

            // Registrar envío en log
            await supabase
              .from('autoresponder_sent_log')
              .insert({
                autoresponder_message_id: selectedAutoresponder.id,
                sender_id: senderId,
                sent_at: new Date().toISOString()
              })

            // Guardar el autoresponder enviado también en prospect_messages
            try {
              await supabase.rpc('add_prospect_message', {
                p_prospect_id: prospectId,
                p_message_instagram_id: data?.message_id || `auto_${Date.now()}`,
                p_message_text: selectedAutoresponder.message_text,
                p_is_from_prospect: false,
                p_message_timestamp: new Date().toISOString(),
                p_message_type: 'autoresponder',
                p_raw_data: { autoresponder_id: selectedAutoresponder.id, sent_via: 'webhook' }
              })
              console.log('✅ Autoresponder guardado en prospect_messages')
            } catch (autoMsgError) {
              console.error('⚠️ Error guardando autoresponder en prospect_messages:', autoMsgError)
            }

            console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===')
          }
        } else {
          console.log('❌ No hay messaging en este entry')
          console.log('📋 Entry structure:', JSON.stringify(entry, null, 2))
        }
      }
    }

    console.log('✅ Webhook procesado exitosamente')
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error en webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
