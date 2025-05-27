
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== INSTAGRAM WEBHOOK REQUEST ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Verificación del webhook (GET request de Facebook)
    if (req.method === 'GET') {
      console.log('Handling GET request for webhook verification')
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification params:', { mode, token, challenge })

      const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN') || 'hower-instagram-webhook-token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✓ Webhook verified successfully')
        return new Response(challenge, { 
          status: 200,
          headers: corsHeaders 
        })
      } else {
        console.log('✗ Webhook verification failed - invalid token or mode')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    // Procesar mensajes entrantes (POST request)
    if (req.method === 'POST') {
      console.log('Handling POST request for incoming messages')
      const body = await req.json()
      console.log('📨 Webhook payload:', JSON.stringify(body, null, 2))

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No "entry" array found in payload')
        return new Response('OK', { 
          status: 200, 
          headers: corsHeaders 
        })
      }

      let messagesProcessed = 0

      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        console.log(`\n--- PROCESSING ENTRY ---`)
        console.log(`Entry ID: ${entry.id}`)
        
        // Método 1: Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Found ${entry.messaging.length} messages in messaging array`)
          
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && messagingEvent.message.text) {
              console.log('💬 Processing text message')
              const result = await processTextMessage(messagingEvent, entry.id)
              if (result.success) messagesProcessed++
            }
          }
        }

        // Método 2: Procesar cambios (changes)
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Found ${entry.changes.length} changes`)
          
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              console.log('📝 Processing message change')
              
              // Si el change.value tiene estructura de mensaje directo
              if (change.value.message && change.value.message.text) {
                const result = await processChangeMessage(change.value, entry.id)
                if (result.success) messagesProcessed++
              }
            }
          }
        }
      }

      console.log(`\n🎯 SUMMARY: ${messagesProcessed} messages processed`)

      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Handle any other methods
    console.log('Method not allowed:', req.method)
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('💥 ERROR in webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

// Función para procesar mensajes de la estructura messaging
async function processTextMessage(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Processing text message`)

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message.text || 'Mensaje sin texto'
    
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

    console.log(`💾 Saving message: "${messageText}" from user ${senderId.slice(-4)}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error saving message:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Message saved successfully`)

    // Generar respuesta automática solo para mensajes reales (no de prueba)
    if (messageText && !messageText.includes('PRUEBA') && !messageText.includes('test')) {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error in processTextMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar mensajes de changes
async function processChangeMessage(changeValue: any, pageId: string) {
  try {
    console.log(`🔄 Processing change message`)

    const message = changeValue.message
    const senderId = changeValue.sender?.id || 'unknown_sender'
    const recipientId = changeValue.recipient?.id || pageId
    const messageText = message?.text || 'Mensaje sin texto'
    
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

    console.log(`💾 Saving change message: "${messageText}" from user ${senderId.slice(-4)}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error saving change message:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Change message saved successfully`)

    // Generar respuesta automática solo para mensajes reales
    if (messageText && !messageText.includes('PRUEBA') && !messageText.includes('test')) {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error in processChangeMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para generar respuesta automática
async function generateAutoResponse(messageText: string, senderId: string, originalMessageId: string) {
  try {
    console.log(`🤖 Generating auto response for: "${messageText}"`)

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
      console.error(`❌ Error saving auto response:`, error)
    } else {
      console.log(`✅ Auto response saved`)
    }

  } catch (error) {
    console.error(`💥 Error in generateAutoResponse:`, error)
  }
}
