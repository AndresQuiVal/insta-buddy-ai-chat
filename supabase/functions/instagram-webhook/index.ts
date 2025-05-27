
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
      console.log('📨 Webhook payload recibido:', JSON.stringify(body, null, 2))

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0

      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        console.log(`\n--- PROCESANDO ENTRY ${entry.id} ---`)
        
        // Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} mensajes en messaging`)
          
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && messagingEvent.message.text) {
              console.log('💬 Procesando mensaje de texto:', messagingEvent.message.text)
              const result = await processMessage(messagingEvent, entry.id, 'messaging')
              if (result.success) messagesProcessed++
            }
          }
        }

        // Procesar cambios (changes) - Nueva API de Instagram
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje')
              
              if (change.value.message && change.value.message.text) {
                const result = await processMessage(change.value, entry.id, 'changes')
                if (result.success) messagesProcessed++
              }
            }
          }
        }
      }

      console.log(`\n🎯 RESUMEN: ${messagesProcessed} mensajes procesados exitosamente`)

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
    console.error('💥 ERROR CRÍTICO en webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Función unificada para procesar mensajes
async function processMessage(messageEvent: any, pageId: string, source: string) {
  try {
    const message = messageEvent.message
    const senderId = messageEvent.sender?.id || 'unknown_sender'
    const recipientId = messageEvent.recipient?.id || pageId
    const messageText = message.text || 'Mensaje sin texto'
    const messageId = message.mid || `msg_${Date.now()}_${Math.random()}`
    
    console.log(`🔄 Procesando mensaje [${source}]:`)
    console.log(`   - De: ${senderId}`)
    console.log(`   - Para: ${recipientId}`)
    console.log(`   - Texto: "${messageText}"`)
    console.log(`   - ID: ${messageId}`)

    // Evitar procesar mensajes duplicados
    const { data: existing } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', messageId)
      .single()

    if (existing) {
      console.log(`⚠️ Mensaje ${messageId} ya existe en la base de datos`)
      return { success: false, reason: 'duplicate' }
    }

    // Convertir timestamp si es necesario
    let timestamp = messageEvent.timestamp
    if (timestamp && timestamp.toString().length === 10) {
      timestamp = parseInt(timestamp) * 1000
    }

    // Preparar datos del mensaje
    const messageData = {
      instagram_message_id: messageId,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { 
        original_event: messageEvent,
        processed_at: new Date().toISOString(),
        source: source,
        page_id: pageId
      }
    }

    console.log(`💾 Guardando mensaje en base de datos...`)

    // Guardar en base de datos
    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje guardado exitosamente con ID: ${data[0]?.id}`)

    // Generar respuesta automática solo para mensajes reales
    if (messageText && 
        !messageText.includes('PRUEBA') && 
        !messageText.includes('test') &&
        !messageText.includes('TEST') &&
        senderId !== 'hower_bot') {
      
      console.log(`🤖 Generando respuesta automática...`)
      await generateAutoResponse(messageText, senderId, messageId)
    } else {
      console.log(`⏭️ Saltando respuesta automática (mensaje de prueba o bot)`)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error procesando mensaje:`, error)
    return { success: false, error: error.message }
  }
}

// Función para generar respuesta automática
async function generateAutoResponse(messageText: string, senderId: string, originalMessageId: string) {
  try {
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

    const { error } = await supabase
      .from('instagram_messages')
      .insert(responseData)

    if (error) {
      console.error(`❌ Error guardando respuesta automática:`, error)
    } else {
      console.log(`✅ Respuesta automática guardada`)
    }

  } catch (error) {
    console.error(`💥 Error en generateAutoResponse:`, error)
  }
}
