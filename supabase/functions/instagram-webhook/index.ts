
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
    console.log('Timestamp:', new Date().toISOString())

    // Verificación del webhook (GET request de Facebook)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('🔍 WEBHOOK VERIFICATION REQUEST:')
      console.log('Mode:', mode)
      console.log('Token provided:', token)
      console.log('Challenge:', challenge)

      const VERIFY_TOKEN = 'hower-instagram-webhook-token'

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
      const contentType = req.headers.get('content-type')
      console.log('📨 POST REQUEST RECEIVED')
      console.log('Content-Type:', contentType)
      
      let body
      try {
        body = await req.json()
        console.log('📋 RAW PAYLOAD:', JSON.stringify(body, null, 2))
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError)
        const textBody = await req.text()
        console.log('📄 Raw text body:', textBody)
        
        // Guardar error en base de datos para debugging
        await supabase.from('instagram_messages').insert({
          instagram_message_id: `error_${Date.now()}`,
          sender_id: 'webhook_error',
          recipient_id: 'parse_error',
          message_text: `Error parsing JSON: ${parseError.message}. Raw body: ${textBody}`,
          message_type: 'received',
          timestamp: new Date().toISOString(),
          raw_data: { error: parseError.message, rawBody: textBody }
        })
        
        return new Response('Error parsing JSON', { status: 400, headers: corsHeaders })
      }

      // Guardar payload completo para debugging
      console.log('💾 Saving complete payload for debugging...')
      await supabase.from('instagram_messages').insert({
        instagram_message_id: `payload_${Date.now()}`,
        sender_id: 'webhook_debug',
        recipient_id: 'full_payload',
        message_text: `PAYLOAD COMPLETO: ${JSON.stringify(body)}`,
        message_type: 'received',
        timestamp: new Date().toISOString(),
        raw_data: body
      })

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        console.log('📊 Estructura del payload:', Object.keys(body))
        
        await supabase.from('instagram_messages').insert({
          instagram_message_id: `structure_error_${Date.now()}`,
          sender_id: 'webhook_structure',
          recipient_id: 'missing_entry',
          message_text: `No entry array found. Structure: ${Object.keys(body).join(', ')}`,
          message_type: 'received',
          timestamp: new Date().toISOString(),
          raw_data: body
        })
        
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0
      console.log(`🎯 Processing ${body.entry.length} entries...`)

      // Procesar cada entrada del webhook
      for (const entry of body.entry) {
        console.log(`\n--- PROCESANDO ENTRY ${entry.id} ---`)
        console.log('Entry keys:', Object.keys(entry))
        
        // Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} mensajes en messaging`)
          
          for (const messagingEvent of entry.messaging) {
            console.log('🔍 Messaging event:', JSON.stringify(messagingEvent, null, 2))
            if (messagingEvent.message && messagingEvent.message.text) {
              console.log('💬 Procesando mensaje de texto:', messagingEvent.message.text)
              const result = await processMessage(messagingEvent, entry.id, 'messaging')
              if (result.success) messagesProcessed++
            } else {
              console.log('⚠️ Messaging event sin texto válido:', JSON.stringify(messagingEvent))
            }
          }
        }

        // Procesar cambios (changes) - Nueva API de Instagram
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const change of entry.changes) {
            console.log('🔍 Change event:', JSON.stringify(change, null, 2))
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje')
              
              if (change.value.message && change.value.message.text) {
                const result = await processMessage(change.value, entry.id, 'changes')
                if (result.success) messagesProcessed++
              }
            }
          }
        }

        // Log si no hay messaging ni changes
        if (!entry.messaging && !entry.changes) {
          console.log('⚠️ Entry sin messaging ni changes:', JSON.stringify(entry, null, 2))
          
          await supabase.from('instagram_messages').insert({
            instagram_message_id: `unknown_entry_${Date.now()}`,
            sender_id: 'webhook_unknown',
            recipient_id: entry.id || 'unknown_entry',
            message_text: `Entry sin messaging/changes: ${JSON.stringify(entry)}`,
            message_type: 'received',
            timestamp: new Date().toISOString(),
            raw_data: entry
          })
        }
      }

      console.log(`\n🎯 RESUMEN FINAL:`)
      console.log(`- Entries procesadas: ${body.entry.length}`)
      console.log(`- Mensajes exitosos: ${messagesProcessed}`)
      console.log(`- Timestamp: ${new Date().toISOString()}`)

      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    console.log(`❌ Método no permitido: ${req.method}`)
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('💥 ERROR CRÍTICO en webhook:', error)
    
    // Guardar error crítico en base de datos
    try {
      await supabase.from('instagram_messages').insert({
        instagram_message_id: `critical_error_${Date.now()}`,
        sender_id: 'webhook_critical_error',
        recipient_id: 'system_error',
        message_text: `ERROR CRÍTICO: ${error.message}`,
        message_type: 'received',
        timestamp: new Date().toISOString(),
        raw_data: { error: error.message, stack: error.stack }
      })
    } catch (dbError) {
      console.error('💥 Error guardando error en DB:', dbError)
    }
    
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
