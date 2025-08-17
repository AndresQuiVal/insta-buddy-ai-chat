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
    const verifyToken = url.searchParams.get('hub.verify_token')
    
    if (challenge) {
      console.log('🔐 Verificación de Facebook - challenge:', challenge)
      console.log('🔑 Token recibido:', verifyToken)
      
      // Verificar el token (opcional, pero recomendado)
      if (verifyToken === 'hower-instagram-webhook-token') {
        console.log('✅ Token de verificación correcto')
        return new Response(challenge, { status: 200 })
      } else {
        console.log('❌ Token de verificación incorrecto')
        return new Response('Forbidden', { status: 403 })
      }
    }
    
    const body = await req.json()
    
    console.log('📨 ===== WEBHOOK RECIBIDO EN PRODUCCIÓN =====')
    console.log('📋 Webhook completo:', JSON.stringify(body, null, 2))
    console.log('🔍 User-Agent:', req.headers.get('User-Agent'))
    console.log('🔍 Content-Type:', req.headers.get('Content-Type'))

    if (body.object !== 'instagram') {
      console.log('❌ No es webhook de Instagram, objeto:', body.object)
      return new Response(
        JSON.stringify({ message: 'Not an Instagram webhook' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!body.entry || !Array.isArray(body.entry)) {
      console.log('❌ No hay entries en el webhook')
      return new Response(
        JSON.stringify({ message: 'No entries found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ FUNCIÓN: Procesar mensajes enviados manualmente por el usuario
    async function processSentMessage(messagingEvent: any, supabase: any, source: string, instagramAccountId: string) {
      console.log('📤 ===== PROCESANDO MENSAJE ENVIADO MANUALMENTE =====')
      console.log(`📝 Mensaje desde ${source}:`, JSON.stringify(messagingEvent, null, 2))
      
      const senderId = messagingEvent.sender?.id
      const recipientId = messagingEvent.recipient?.id
      const messageText = messagingEvent.message?.text
      
      // Procesar timestamp
      let timestamp: string
      if (messagingEvent.timestamp) {
        timestamp = new Date(messagingEvent.timestamp).toISOString()
      } else {
        timestamp = new Date().toISOString()
      }
      
      console.log(`📤 MENSAJE ENVIADO MANUALMENTE POR USUARIO:`)
      console.log(`👤 De: ${senderId} → Para: ${recipientId}`)
      console.log(`💬 Texto: "${messageText}"`)
      console.log(`🕐 Timestamp: ${timestamp}`)
      
      // Buscar el registro del usuario de Instagram
      const { data: instagramUser, error: userError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', senderId)
        .eq('is_active', true)
        .single()

      if (userError || !instagramUser) {
        console.log('❌ No se encontró usuario activo para sender_id:', senderId)
        return
      }

      console.log('✅ Usuario encontrado:', instagramUser.username)

      // Guardar mensaje enviado manualmente en la base de datos
      const messageData = {
        instagram_user_id: instagramUser.id,
        instagram_message_id: messagingEvent.message?.mid || `sent_${Date.now()}_${recipientId}`,
        sender_id: senderId,
        recipient_id: recipientId,
        message_text: messageText || '',
        message_type: 'sent', // 🔥 IMPORTANTE: Es un mensaje ENVIADO
        timestamp: timestamp,
        raw_data: {
          ...messagingEvent,
          webhook_source: 'manual_sent',
          processed_at: new Date().toISOString()
        }
      }

      console.log('💾 Guardando mensaje enviado manualmente:', messageData)

      const { error: insertError } = await supabase
        .from('instagram_messages')
        .insert(messageData)

      if (insertError) {
        console.error('❌ Error guardando mensaje enviado:', insertError)
      } else {
        console.log('✅ Mensaje enviado guardado correctamente en BD')
        
        // Actualizar actividad del prospecto
        try {
          const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
            p_prospect_id: recipientId // El prospecto es quien RECIBE el mensaje
          })
          
          if (activityError) {
            console.error('❌ Error actualizando actividad del prospecto:', activityError)
          } else {
            console.log('✅ Actividad del prospecto actualizada')
          }
        } catch (error) {
          console.error('❌ Error en RPC update_prospect_activity:', error)
        }
      }
    }

    // Procesar cada entry
    for (const entry of body.entry) {
      console.log('🔄 ===== PROCESANDO ENTRY =====')
      console.log('📋 Entry completo:', JSON.stringify(entry, null, 2))
      console.log('📋 Entry ID:', entry.id)
      console.log('📋 Entry keys:', Object.keys(entry))

      // Procesar mensajes
      if (entry.messaging && Array.isArray(entry.messaging)) {
        console.log('📝 PROCESANDO MENSAJES DIRECTOS (FORMATO PRODUCCIÓN)')
        console.log('  - ¿Tiene messaging?', !!entry.messaging)

        for (const messagingEvent of entry.messaging) {
          console.log('🚨 LLAMANDO A processMessage...')
          console.log('📋 Mensaje completo:', JSON.stringify(messagingEvent, null, 2))
          console.log('👤 SENDER ID:', messagingEvent.sender?.id)
          console.log('🎯 RECIPIENT ID:', messagingEvent.recipient?.id)

          // Verificar si es un evento de "read" y saltar si es así
          if (messagingEvent.read) {
            console.log('📖 Es un evento de lectura - saltando procesamiento')
            continue
          }

          console.log('🔍 DEBUGGING - Analizando tipo de evento:')
          console.log('🔘 ¿Tiene postback directo?', !!messagingEvent.postback)
          console.log('🔘 ¿Tiene postback en message?', !!messagingEvent.message?.postback)
          console.log('🔘 ¿Tiene texto?', !!messagingEvent.message?.text)
          console.log('📝 Texto del mensaje:', messagingEvent.message?.text)
          console.log('🔍 ¿Contiene _postback?', messagingEvent.message?.text?.includes('_postback'))
          
          console.log('🔍 ANÁLISIS CRÍTICO ANTES DE PROCESAR:')
          console.log('  - ¿Tiene changes?', !!entry.changes)

          // Procesar timestamp
          let timestamp: string
          if (messagingEvent.timestamp) {
            const timestampNumber = parseInt(messagingEvent.timestamp)
            const date = new Date(timestampNumber)
            const year = date.getFullYear()
            if (year >= 1970 && year <= 2100) {
              timestamp = date.toISOString()
            } else {
              timestamp = new Date().toISOString()
            }
          } else {
            timestamp = new Date().toISOString()
          }

          console.log('🕐 TIMESTAMP ORIGINAL:', messagingEvent.timestamp)
          console.log('🕐 TIMESTAMP PROCESADO:', timestamp)
          console.log('⏰ TIMESTAMP FINAL:', timestamp)
          console.log('🆔 MESSAGE ID:', messagingEvent.message?.mid)
          console.log('💬 MENSAJE:', messagingEvent.message?.text)
          console.log('🔔 ES ECHO:', !!messagingEvent.message?.is_echo)

          // 🔥 LÓGICA CRÍTICA: Detectar si es un mensaje ENVIADO por el usuario (echo)
          if (messagingEvent.message?.is_echo) {
            console.log('📤 ES UN MENSAJE ECHO (enviado por el usuario) - PROCESANDO...')
            console.log(`👤 ENVIADO POR: ${messagingEvent.sender?.id} HACIA: ${messagingEvent.recipient?.id}`)
            console.log(`💬 MENSAJE: ${messagingEvent.message?.text}`)
            
            // Procesar como mensaje enviado manualmente
            await processSentMessage(messagingEvent, supabase, 'webhook_echo', entry.id)
            continue // Saltar el procesamiento normal
          }

          console.log('🚀 === PROCESANDO MENSAJE ===')
          
          // Procesar mensaje recibido (no echo)
          const senderId = messagingEvent.sender?.id
          const recipientId = messagingEvent.recipient?.id
          
          if (!senderId || !recipientId) {
            console.log('❌ Missing sender or recipient ID')
            continue
          }

          // Extraer texto del mensaje (con soporte para attachments)
          let messageText = messagingEvent.message?.text || ''
          
          // 🔥 MANEJO DE ATTACHMENTS: Si no hay texto pero hay attachments
          if (!messageText && messagingEvent.message?.attachments?.length > 0) {
            const attachments = messagingEvent.message.attachments
            console.log(`🔗 Mensaje con attachments (${attachments.length}):`, attachments)
            
            const attachmentTypes = attachments.map((att: any) => att.type).join(', ')
            messageText = `[${attachmentTypes}]` // Placeholder para attachments
            
            // Log específico para cada tipo de attachment
            for (const attachment of attachments) {
              if (attachment.type === 'ig_reel') {
                console.log(`🎬 Instagram Reel recibido:`, attachment.payload)
              } else if (attachment.type === 'image') {
                console.log(`🖼️ Imagen recibida:`, attachment.payload)
              } else {
                console.log(`📎 Attachment tipo '${attachment.type}':`, attachment.payload)
              }
            }
          }
          
          console.log(`💬 TEXTO FINAL DEL MENSAJE: "${messageText}"`)
          
          // Buscar usuario de Instagram en nuestra base de datos
          const { data: instagramUser, error: userError } = await supabase
            .from('instagram_users')
            .select('*')
            .eq('instagram_user_id', recipientId)
            .eq('is_active', true)
            .single()

          if (userError || !instagramUser) {
            console.log(`❌ Usuario no encontrado para recipient_id: ${recipientId}`)
            continue
          }

          console.log(`✅ Usuario encontrado: ${instagramUser.username}`)

          // Guardar mensaje en la base de datos
          const messageData = {
            instagram_user_id: instagramUser.id,
            instagram_message_id: messagingEvent.message?.mid || `received_${Date.now()}_${senderId}`,
            sender_id: senderId,
            recipient_id: recipientId,
            message_text: messageText,
            message_type: 'received',
            timestamp: timestamp,
            raw_data: {
              ...messagingEvent,
              webhook_source: 'messaging',
              processed_at: new Date().toISOString()
            }
          }

          console.log('💾 Guardando mensaje recibido:', messageData)

          const { error: insertError } = await supabase
            .from('instagram_messages')
            .insert(messageData)

          if (insertError) {
            console.error('❌ Error guardando mensaje:', insertError)
          } else {
            console.log('✅ Mensaje guardado correctamente en BD')
            
            // Actualizar actividad del prospecto
            try {
              const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
                p_prospect_id: senderId // El prospecto es quien ENVÍA el mensaje
              })
              
              if (activityError) {
                console.error('❌ Error actualizando actividad del prospecto:', activityError)
              } else {
                console.log('✅ Actividad del prospecto actualizada')
              }
            } catch (error) {
              console.error('❌ Error en RPC update_prospect_activity:', error)
            }
          }
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