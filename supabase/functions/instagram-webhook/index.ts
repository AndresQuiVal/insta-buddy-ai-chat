
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
        return new Response(challenge, { 
          status: 200,
          headers: corsHeaders 
        })
      } else {
        console.log('✗ Webhook verification failed')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    // Procesar mensajes entrantes (POST request)
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || ''
      console.log('Content-Type:', contentType)
      
      let body: any
      try {
        if (contentType.includes('application/json')) {
          body = await req.json()
        } else {
          const text = await req.text()
          console.log('Raw body:', text)
          body = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Error parsing body:', parseError)
        return new Response('Invalid JSON', { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      console.log('📨 Webhook payload recibido:', JSON.stringify(body, null, 2))

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0

      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        console.log(`\n--- PROCESANDO ENTRY ---`)
        console.log(`Entry ID: ${entry.id}`)
        
        // Método 1: Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} mensajes en messaging`)
          
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && messagingEvent.message.text) {
              console.log('💬 Procesando mensaje de texto')
              const result = await processTextMessage(messagingEvent, entry.id)
              if (result.success) messagesProcessed++
            }
          }
        }

        // Método 2: Procesar cambios (changes)
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje')
              
              // Si el change.value tiene estructura de mensaje directo
              if (change.value.message && change.value.message.text) {
                const result = await processChangeMessage(change.value, entry.id)
                if (result.success) messagesProcessed++
              }
            }
          }
        }
      }

      console.log(`\n🎯 RESUMEN: ${messagesProcessed} mensajes procesados`)

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
    
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    })
  }
})

// Función para procesar mensajes de la estructura messaging
async function processTextMessage(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Procesando mensaje de texto`)

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message.text || 'Mensaje sin texto'
    
    // Determinar el nombre del usuario más legible
    const userName = `Usuario ${senderId.slice(-4)}`

    const messageData = {
      instagram_message_id: message.mid || `msg_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'messaging'
      }
    }

    console.log(`💾 Guardando mensaje: "${messageText}" de ${userName}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje guardado exitosamente`)

    // *** RESPUESTAS AUTOMÁTICAS DESACTIVADAS ***
    // NO generar respuesta automática para evitar spam
    console.log('⚠️ Respuestas automáticas DESACTIVADAS')

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error en processTextMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar mensajes de changes
async function processChangeMessage(changeValue: any, pageId: string) {
  try {
    console.log(`🔄 Procesando mensaje de change`)

    const message = changeValue.message
    const senderId = changeValue.sender?.id || 'unknown_sender'
    const recipientId = changeValue.recipient?.id || pageId
    const messageText = message?.text || 'Mensaje sin texto'
    
    // Determinar el nombre del usuario más legible
    const userName = `Usuario ${senderId.slice(-4)}`

    // Convertir timestamp de segundos a millisegundos si es necesario
    let timestamp = changeValue.timestamp
    if (timestamp && timestamp.toString().length === 10) {
      timestamp = parseInt(timestamp) * 1000
    }

    const messageData = {
      instagram_message_id: message?.mid || `change_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'changes'
      }
    }

    console.log(`💾 Guardando mensaje de change: "${messageText}" de ${userName}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje de change:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje de change guardado exitosamente`)

    // *** RESPUESTAS AUTOMÁTICAS DESACTIVADAS ***
    // NO generar respuesta automática para evitar spam
    console.log('⚠️ Respuestas automáticas DESACTIVADAS')

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error en processChangeMessage:`, error)
    return { success: false, error: error.message }
  }
}
