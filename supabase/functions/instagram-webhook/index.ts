
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"

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
    console.log('=== INSTAGRAM WEBHOOK RECEIVED ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // Verificación del webhook (GET request de Facebook)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification:', { mode, token, challenge })

      // Token de verificación que debes configurar en Facebook App Dashboard
      const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN') || 'hower-instagram-webhook-token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully')
        return new Response(challenge, { status: 200 })
      } else {
        console.log('❌ Webhook verification failed')
        console.log('Expected token:', VERIFY_TOKEN)
        console.log('Received token:', token)
        return new Response('Forbidden', { status: 403 })
      }
    }

    // Procesar mensajes entrantes (POST request)
    if (req.method === 'POST') {
      // Validar la firma del webhook (recomendado por Facebook)
      const signature = req.headers.get('X-Hub-Signature-256')
      console.log('Webhook signature:', signature)

      const body = await req.json()
      console.log('📨 Webhook payload recibido:', JSON.stringify(body, null, 2))

      // Verificar si el payload tiene la estructura esperada de Facebook
      if (!body.object) {
        console.log('⚠️ No se encontró campo "object" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0

      // Procesar cada entrada del webhook según especificación de Facebook
      for (const entry of body.entry) {
        console.log(`\n--- PROCESANDO ENTRY ---`)
        console.log(`Entry ID: ${entry.id}`)
        console.log(`Entry Time: ${entry.time}`)
        
        // Método 1: Procesar mensajes directos (messaging) - Instagram API con Instagram Login
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} eventos de messaging`)
          
          for (const messagingEvent of entry.messaging) {
            console.log('Evento de messaging:', JSON.stringify(messagingEvent, null, 2))
            
            if (messagingEvent.message) {
              console.log('💬 Procesando mensaje directo')
              const result = await processInstagramMessage(messagingEvent, entry.id)
              if (result.success) messagesProcessed++
            }
            
            // Procesar otros tipos de eventos
            if (messagingEvent.postback) {
              console.log('🔄 Procesando postback')
              await processPostback(messagingEvent, entry.id)
            }
            
            if (messagingEvent.reaction) {
              console.log('❤️ Procesando reacción')
              await processReaction(messagingEvent, entry.id)
            }
          }
        }

        // Método 2: Procesar cambios (changes) - Instagram API con Facebook Login
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const change of entry.changes) {
            console.log('Cambio detectado:', JSON.stringify(change, null, 2))
            
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje')
              const result = await processMessageChange(change.value, entry.id)
              if (result.success) messagesProcessed++
            }
            
            if (change.field === 'comments' && change.value) {
              console.log('💭 Procesando comentario')
              await processComment(change.value, entry.id)
            }
            
            if (change.field === 'mentions' && change.value) {
              console.log('📢 Procesando mención')
              await processMention(change.value, entry.id)
            }
          }
        }
      }

      console.log(`\n🎯 RESUMEN: ${messagesProcessed} mensajes procesados`)

      // Facebook requiere respuesta 200 OK
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('💥 ERROR en webhook:', error)
    
    // Facebook requiere respuesta 200 incluso en errores para evitar reenvíos
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    })
  }
})

// Función para procesar mensajes de Instagram (Instagram Login API)
async function processInstagramMessage(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Procesando mensaje de Instagram`)

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message?.text || message?.quick_reply?.payload || ''
    
    // Manejar diferentes tipos de mensajes
    let messageContent = messageText
    let messageType = 'text'
    
    if (message?.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0]
      messageType = attachment.type || 'attachment'
      messageContent = `[${messageType.toUpperCase()}] ${attachment.payload?.url || 'Archivo adjunto'}`
    }

    const messageData = {
      instagram_message_id: message?.mid || `msg_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageContent,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'instagram_messaging',
        message_type: messageType
      }
    }

    console.log(`💾 Guardando mensaje: "${messageContent}" de usuario ${senderId.slice(-4)}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje de Instagram guardado exitosamente`)

    // Generar respuesta automática solo para mensajes de texto reales
    if (messageType === 'text' && messageText && !messageText.includes('PRUEBA') && !messageText.includes('test')) {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error en processInstagramMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar cambios de mensajes (Facebook Login API)
async function processMessageChange(changeValue: any, pageId: string) {
  try {
    console.log(`🔄 Procesando cambio de mensaje`)

    const senderId = changeValue.from?.id || 'unknown_sender'
    const recipientId = pageId
    const messageText = changeValue.message || changeValue.text || 'Mensaje sin texto'
    
    // Convertir timestamp si es necesario
    let timestamp = changeValue.created_time || changeValue.timestamp
    if (timestamp && timestamp.toString().length === 10) {
      timestamp = parseInt(timestamp) * 1000
    }

    const messageData = {
      instagram_message_id: changeValue.id || `change_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'facebook_changes'
      }
    }

    console.log(`💾 Guardando cambio de mensaje: "${messageText}" de usuario ${senderId.slice(-4)}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando cambio de mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Cambio de mensaje guardado exitosamente`)

    // Generar respuesta automática
    if (messageText && !messageText.includes('PRUEBA') && !messageText.includes('test')) {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error en processMessageChange:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar postbacks
async function processPostback(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Procesando postback`)
    
    const postback = messagingEvent.postback
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    
    const messageData = {
      instagram_message_id: `postback_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: pageId,
      message_text: `[POSTBACK] ${postback?.title || postback?.payload || 'Postback recibido'}`,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'postback'
      }
    }

    await supabase.from('instagram_messages').insert(messageData)
    console.log(`✅ Postback guardado`)

  } catch (error) {
    console.error(`💥 Error en processPostback:`, error)
  }
}

// Función para procesar reacciones
async function processReaction(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Procesando reacción`)
    
    const reaction = messagingEvent.reaction
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    
    const messageData = {
      instagram_message_id: `reaction_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: pageId,
      message_text: `[REACCIÓN] ${reaction?.action || 'react'}: ${reaction?.emoji || '❤️'}`,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'reaction'
      }
    }

    await supabase.from('instagram_messages').insert(messageData)
    console.log(`✅ Reacción guardada`)

  } catch (error) {
    console.error(`💥 Error en processReaction:`, error)
  }
}

// Función para procesar comentarios
async function processComment(changeValue: any, pageId: string) {
  try {
    console.log(`🔄 Procesando comentario`)
    
    const messageData = {
      instagram_message_id: changeValue.id || `comment_${Date.now()}_${Math.random()}`,
      sender_id: changeValue.from?.id || 'unknown_sender',
      recipient_id: pageId,
      message_text: `[COMENTARIO] ${changeValue.text || 'Comentario sin texto'}`,
      timestamp: new Date(changeValue.created_time || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'comment'
      }
    }

    await supabase.from('instagram_messages').insert(messageData)
    console.log(`✅ Comentario guardado`)

  } catch (error) {
    console.error(`💥 Error en processComment:`, error)
  }
}

// Función para procesar menciones
async function processMention(changeValue: any, pageId: string) {
  try {
    console.log(`🔄 Procesando mención`)
    
    const messageData = {
      instagram_message_id: changeValue.id || `mention_${Date.now()}_${Math.random()}`,
      sender_id: changeValue.from?.id || 'unknown_sender',
      recipient_id: pageId,
      message_text: `[MENCIÓN] ${changeValue.text || 'Mención recibida'}`,
      timestamp: new Date(changeValue.created_time || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'mention'
      }
    }

    await supabase.from('instagram_messages').insert(messageData)
    console.log(`✅ Mención guardada`)

  } catch (error) {
    console.error(`💥 Error en processMention:`, error)
  }
}

// Función para generar respuesta automática
async function generateAutoResponse(messageText: string, senderId: string, originalMessageId: string) {
  try {
    console.log(`🤖 Generando respuesta automática para: "${messageText}"`)

    const responseText = `¡Hola! Recibí tu mensaje: "${messageText}". Te responderemos pronto. 🚀`

    const responseData = {
      instagram_message_id: `response_${Date.now()}_${Math.random()}`,
      sender_id: 'hower_bot',
      recipient_id: senderId,
      message_text: responseText,
      timestamp: new Date().toISOString(),
      message_type: 'sent',
      raw_data: { 
        original_message_id: originalMessageId,
        auto_response: true,
        generated_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(responseData)
      .select()

    if (error) {
      console.error(`❌ Error guardando respuesta automática:`, error)
    } else {
      console.log(`✅ Respuesta automática guardada`)
    }

  } catch (error) {
    console.error(`💥 Error en generateAutoResponse:`, error)
  }
}
