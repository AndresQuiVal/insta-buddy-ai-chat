
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

    // Verificación del webhook (GET request de Facebook)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification:', { mode, token, challenge })

      const VERIFY_TOKEN = 'hower-instagram-webhook-token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✓ Webhook verified successfully')
        return new Response(challenge, { status: 200 })
      } else {
        console.log('✗ Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }

    // Procesar mensajes entrantes (POST request)
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 WEBHOOK PAYLOAD COMPLETO:', JSON.stringify(body, null, 2))

      // SIEMPRE guardar el payload para debug
      await saveDebugPayload(body)

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0

      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        console.log(`🔍 Procesando entry ID: ${entry.id}`)
        
        // Método 1: Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} mensajes en messaging`)
          
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && messagingEvent.message.text) {
              console.log('💬 Procesando mensaje directo:', messagingEvent.message.text)
              await processMessage(messagingEvent, entry.id)
              messagesProcessed++
            }
          }
        }

        // Método 2: Procesar cambios (changes)
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje:', change.value)
              
              if (change.value.messages && Array.isArray(change.value.messages)) {
                for (const message of change.value.messages) {
                  await processRawMessage(message, entry.id)
                  messagesProcessed++
                }
              }
            }
          }
        }
      }

      console.log(`✅ Total mensajes procesados: ${messagesProcessed}`)
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
    console.error('💥 Error in Instagram webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Función para procesar mensajes de la estructura messaging
async function processMessage(messagingEvent: any, pageId: string) {
  try {
    console.log('🔄 processMessage iniciado con:', JSON.stringify(messagingEvent, null, 2))

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message.text || message.quick_reply?.payload || 'Mensaje sin texto'

    const messageData = {
      instagram_message_id: message.mid || `msg_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: messagingEvent
    }

    console.log('💾 Intentando guardar mensaje:', JSON.stringify(messageData, null, 2))

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error('❌ Error guardando mensaje:', error)
      console.error('❌ Datos que causaron error:', messageData)
      throw error
    }

    console.log('✅ Mensaje guardado exitosamente:', data)

    // Generar respuesta automática
    if (messageText && senderId !== 'unknown_sender') {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id)
    }

  } catch (error) {
    console.error('💥 Error en processMessage:', error)
    console.error('💥 Stack trace:', error.stack)
  }
}

// Función para procesar mensajes raw
async function processRawMessage(message: any, pageId: string) {
  try {
    console.log('🔄 processRawMessage iniciado con:', JSON.stringify(message, null, 2))

    const messageData = {
      instagram_message_id: message.mid || message.id || `raw_${Date.now()}_${Math.random()}`,
      sender_id: message.from?.id || message.sender_id || 'unknown_sender',
      recipient_id: message.to?.id || pageId || 'unknown_recipient',
      message_text: message.text || message.message || 'Mensaje raw sin texto',
      timestamp: new Date(message.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: message
    }

    console.log('💾 Intentando guardar mensaje raw:', JSON.stringify(messageData, null, 2))

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error('❌ Error guardando mensaje raw:', error)
      console.error('❌ Datos que causaron error:', messageData)
      throw error
    }

    console.log('✅ Mensaje raw guardado exitosamente:', data)

  } catch (error) {
    console.error('💥 Error en processRawMessage:', error)
    console.error('💥 Stack trace:', error.stack)
  }
}

// Función para guardar payload de debug - SIEMPRE se ejecuta
async function saveDebugPayload(payload: any) {
  try {
    const debugData = {
      instagram_message_id: `debug_${Date.now()}_${Math.random()}`,
      sender_id: 'debug_webhook',
      recipient_id: 'debug_system',
      message_text: `🐛 WEBHOOK PAYLOAD: ${JSON.stringify(payload).substring(0, 200)}...`,
      timestamp: new Date().toISOString(),
      message_type: 'received',
      raw_data: payload
    }

    console.log('🐛 Guardando debug payload:', debugData.message_text)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(debugData)
      .select()

    if (error) {
      console.error('❌ Error guardando debug payload:', error)
    } else {
      console.log('✅ Debug payload guardado con ID:', data[0]?.id)
    }
  } catch (error) {
    console.error('💥 Error en saveDebugPayload:', error)
  }
}

// Función para generar respuesta automática
async function generateAutoResponse(messageText: string, senderId: string, originalMessageId: string) {
  try {
    console.log('🤖 Generando respuesta automática para:', messageText)

    const responseText = `¡Hola! Recibí tu mensaje: "${messageText}". Gracias por contactarnos. 🚀`

    const responseData = {
      instagram_message_id: `response_${Date.now()}_${Math.random()}`,
      sender_id: 'hower_bot',
      recipient_id: senderId,
      message_text: responseText,
      timestamp: new Date().toISOString(),
      message_type: 'sent',
      raw_data: { 
        original_message_id: originalMessageId,
        auto_response: true 
      }
    }

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(responseData)
      .select()

    if (error) {
      console.error('❌ Error guardando respuesta automática:', error)
    } else {
      console.log('✅ Respuesta automática guardada:', data[0]?.id)
    }

  } catch (error) {
    console.error('💥 Error en generateAutoResponse:', error)
  }
}
