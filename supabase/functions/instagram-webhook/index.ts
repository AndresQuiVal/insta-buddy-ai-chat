
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
      console.log('📨 WEBHOOK PAYLOAD COMPLETO REAL:', JSON.stringify(body, null, 2))

      // SIEMPRE guardar el payload completo para debug
      const debugResult = await saveCompletePayload(body)
      console.log('Debug payload guardado:', debugResult.success ? '✓' : '✗', debugResult.id || debugResult.error)

      // Verificar si el payload tiene la estructura esperada
      if (!body.entry || !Array.isArray(body.entry)) {
        console.log('⚠️ No se encontró array "entry" en el payload')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      let messagesProcessed = 0
      let totalEntries = body.entry.length

      console.log(`🔍 Procesando ${totalEntries} entries del webhook`)

      // Procesar cada entrada del webhook
      for (const [index, entry] of body.entry.entries()) {
        console.log(`\n--- PROCESANDO ENTRY ${index + 1}/${totalEntries} ---`)
        console.log(`Entry ID: ${entry.id}`)
        console.log(`Entry completo:`, JSON.stringify(entry, null, 2))
        
        // Verificar todas las posibles estructuras de mensajes
        const structures = {
          messaging: entry.messaging,
          changes: entry.changes,
          messages: entry.messages,
          direct_messages: entry.direct_messages
        }

        console.log('Estructuras encontradas en entry:', Object.entries(structures).filter(([key, value]) => value).map(([key]) => key))

        // Método 1: Procesar mensajes directos (messaging)
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`📱 Encontrados ${entry.messaging.length} mensajes en messaging`)
          
          for (const [msgIndex, messagingEvent] of entry.messaging.entries()) {
            console.log(`\nProcesando mensaje ${msgIndex + 1} de messaging:`)
            console.log(JSON.stringify(messagingEvent, null, 2))
            
            if (messagingEvent.message) {
              console.log('💬 Mensaje encontrado en messaging event')
              const result = await processMessage(messagingEvent, entry.id, 'messaging')
              console.log('Resultado procesamiento messaging:', result.success ? '✓' : '✗', result.error || result.id)
              if (result.success) messagesProcessed++
            } else {
              console.log('⚠️ No hay campo "message" en messaging event')
            }
          }
        }

        // Método 2: Procesar cambios (changes)
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`🔄 Encontrados ${entry.changes.length} cambios`)
          
          for (const [changeIndex, change] of entry.changes.entries()) {
            console.log(`\nProcesando cambio ${changeIndex + 1}:`)
            console.log(JSON.stringify(change, null, 2))
            
            if (change.field === 'messages' && change.value) {
              console.log('📝 Procesando cambio de mensaje tipo "messages"')
              
              if (change.value.messages && Array.isArray(change.value.messages)) {
                for (const [valueIndex, message] of change.value.messages.entries()) {
                  console.log(`\nProcesando mensaje ${valueIndex + 1} de changes.value.messages:`)
                  console.log(JSON.stringify(message, null, 2))
                  
                  const result = await processRawMessage(message, entry.id, 'changes_messages')
                  console.log('Resultado procesamiento changes:', result.success ? '✓' : '✗', result.error || result.id)
                  if (result.success) messagesProcessed++
                }
              } else {
                console.log('⚠️ No hay array "messages" en change.value')
                // Intentar procesar el valor directamente
                const result = await processRawMessage(change.value, entry.id, 'changes_direct')
                console.log('Resultado procesamiento changes directo:', result.success ? '✓' : '✗', result.error || result.id)
                if (result.success) messagesProcessed++
              }
            } else {
              console.log(`⚠️ Cambio ignorado. Field: ${change.field}, tiene value: ${!!change.value}`)
            }
          }
        }

        // Método 3: Procesar mensajes directos en entry
        if (entry.messages && Array.isArray(entry.messages)) {
          console.log(`📬 Encontrados ${entry.messages.length} mensajes directos en entry`)
          
          for (const [msgIndex, message] of entry.messages.entries()) {
            console.log(`\nProcesando mensaje directo ${msgIndex + 1}:`)
            console.log(JSON.stringify(message, null, 2))
            
            const result = await processRawMessage(message, entry.id, 'entry_messages')
            console.log('Resultado procesamiento entry messages:', result.success ? '✓' : '✗', result.error || result.id)
            if (result.success) messagesProcessed++
          }
        }

        console.log(`--- FIN ENTRY ${index + 1} ---\n`)
      }

      console.log(`\n🎯 RESUMEN FINAL:`)
      console.log(`- Total entries procesados: ${totalEntries}`)
      console.log(`- Total mensajes guardados: ${messagesProcessed}`)
      console.log(`- Payload debug guardado: ✓`)

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
    console.error('💥 Stack trace:', error.stack)
    
    // Guardar el error también
    try {
      await saveErrorLog(error, req.url)
    } catch (saveError) {
      console.error('💥 Error guardando error log:', saveError)
    }
    
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
async function processMessage(messagingEvent: any, pageId: string, source: string) {
  try {
    console.log(`🔄 processMessage [${source}] iniciado:`)
    console.log(JSON.stringify(messagingEvent, null, 2))

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message?.text || message?.quick_reply?.payload || 'Mensaje sin texto'

    const messageData = {
      instagram_message_id: message?.mid || `msg_${source}_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: new Date(messagingEvent.timestamp || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { ...messagingEvent, processing_source: source, processed_at: new Date().toISOString() }
    }

    console.log(`💾 [${source}] Guardando mensaje:`, JSON.stringify(messageData, null, 2))

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ [${source}] Error guardando:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ [${source}] Mensaje guardado:`, data[0]?.id)

    // Generar respuesta automática si es un mensaje real
    if (messageText && senderId !== 'unknown_sender' && !messageText.includes('prueba')) {
      await generateAutoResponse(messageText, senderId, messageData.instagram_message_id, source)
    }

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 [${source}] Error en processMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar mensajes raw
async function processRawMessage(message: any, pageId: string, source: string) {
  try {
    console.log(`🔄 processRawMessage [${source}] iniciado:`)
    console.log(JSON.stringify(message, null, 2))

    const messageData = {
      instagram_message_id: message?.mid || message?.id || `raw_${source}_${Date.now()}_${Math.random()}`,
      sender_id: message?.from?.id || message?.sender_id || message?.sender || 'unknown_sender',
      recipient_id: message?.to?.id || message?.recipient_id || pageId || 'unknown_recipient',
      message_text: message?.text || message?.message || message?.body || 'Mensaje raw sin texto',
      timestamp: new Date(message?.timestamp || message?.created_time || Date.now()).toISOString(),
      message_type: 'received',
      raw_data: { ...message, processing_source: source, processed_at: new Date().toISOString() }
    }

    console.log(`💾 [${source}] Guardando mensaje raw:`, JSON.stringify(messageData, null, 2))

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ [${source}] Error guardando raw:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ [${source}] Mensaje raw guardado:`, data[0]?.id)
    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 [${source}] Error en processRawMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para guardar payload completo - SIEMPRE se ejecuta
async function saveCompletePayload(payload: any) {
  try {
    const debugData = {
      instagram_message_id: `debug_complete_${Date.now()}_${Math.random()}`,
      sender_id: 'webhook_payload',
      recipient_id: 'debug_system',
      message_text: `🔍 PAYLOAD COMPLETO: ${JSON.stringify(payload).substring(0, 500)}...`,
      timestamp: new Date().toISOString(),
      message_type: 'received',
      raw_data: { 
        complete_payload: payload, 
        captured_at: new Date().toISOString(),
        headers_info: 'Complete webhook payload captured'
      }
    }

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(debugData)
      .select()

    if (error) {
      console.error('❌ Error guardando payload completo:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Payload completo guardado con ID:', data[0]?.id)
    return { success: true, id: data[0]?.id }
  } catch (error) {
    console.error('💥 Error en saveCompletePayload:', error)
    return { success: false, error: error.message }
  }
}

// Función para guardar errores
async function saveErrorLog(error: any, url: string) {
  try {
    const errorData = {
      instagram_message_id: `error_${Date.now()}_${Math.random()}`,
      sender_id: 'webhook_error',
      recipient_id: 'error_system',
      message_text: `💥 ERROR: ${error.message}`,
      timestamp: new Date().toISOString(),
      message_type: 'received',
      raw_data: { 
        error_message: error.message,
        error_stack: error.stack,
        url: url,
        error_captured_at: new Date().toISOString()
      }
    }

    await supabase
      .from('instagram_messages')
      .insert(errorData)
      
  } catch (saveError) {
    console.error('Error guardando error log:', saveError)
  }
}

// Función para generar respuesta automática
async function generateAutoResponse(messageText: string, senderId: string, originalMessageId: string, source: string) {
  try {
    console.log(`🤖 [${source}] Generando respuesta automática para:`, messageText)

    const responseText = `¡Hola! Recibí tu mensaje: "${messageText}". Te responderemos pronto. 🚀`

    const responseData = {
      instagram_message_id: `response_${source}_${Date.now()}_${Math.random()}`,
      sender_id: 'hower_bot',
      recipient_id: senderId,
      message_text: responseText,
      timestamp: new Date().toISOString(),
      message_type: 'sent',
      raw_data: { 
        original_message_id: originalMessageId,
        auto_response: true,
        generated_from: source,
        generated_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(responseData)
      .select()

    if (error) {
      console.error(`❌ [${source}] Error guardando respuesta:`, error)
    } else {
      console.log(`✅ [${source}] Respuesta automática guardada:`, data[0]?.id)
    }

  } catch (error) {
    console.error(`💥 [${source}] Error en generateAutoResponse:`, error)
  }
}
