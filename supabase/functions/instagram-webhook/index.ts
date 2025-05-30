

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para detectar enlaces de invitación
function detectInvitationLinks(messageText: string): boolean {
  const invitationPatterns = [
    // Zoom
    /zoom\.us\/j\/\d+/i,
    /zoom\.us\/meeting\/\d+/i,
    /us\d+\.zoom\.us/i,
    
    // Google Meet
    /meet\.google\.com\/[a-z0-9-]+/i,
    /g\.co\/meet\/[a-z0-9-]+/i,
    
    // Microsoft Teams
    /teams\.microsoft\.com\/l\/meetup-join/i,
    /teams\.live\.com\/meet/i,
    
    // Skype
    /join\.skype\.com\/[a-zA-Z0-9]+/i,
    
    // GoToMeeting
    /gotomeeting\.com\/join\/\d+/i,
    /gotomeet\.me\/\d+/i,
    
    // Webex
    /webex\.com\/meet\/[a-zA-Z0-9.]+/i,
    /cisco\.webex\.com/i,
    
    // Jitsi
    /meet\.jit\.si\/[a-zA-Z0-9-]+/i,
    
    // Discord
    /discord\.gg\/[a-zA-Z0-9]+/i,
    /discord\.com\/invite\/[a-zA-Z0-9]+/i,
    
    // Palabras clave que indican invitación
    /\b(únete|join|meeting|reunión|llamada|videollamada|conferencia)\b.*\b(link|enlace|url|http)\b/i,
    /\b(te invito|invitación|cita|appointment)\b/i
  ];

  return invitationPatterns.some(pattern => pattern.test(messageText));
}

// Función para verificar si una respuesta es única
async function isUniqueResponse(senderId: string, timestamp: string): Promise<boolean> {
  try {
    // Obtener todos los mensajes recibidos de este prospecto, ordenados por timestamp
    const { data: existingMessages, error } = await supabase
      .from('instagram_messages')
      .select('timestamp')
      .eq('sender_id', senderId)
      .eq('message_type', 'received')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error checking unique response:', error);
      return true; // En caso de error, asumimos que es única
    }

    // Si no hay mensajes previos, es la primera respuesta (única)
    if (!existingMessages || existingMessages.length === 0) {
      console.log(`✅ Primera respuesta del prospecto ${senderId} - ÚNICA`);
      return true;
    }

    // Verificar si hay un gap de 5+ horas desde el último mensaje
    const messageTime = new Date(timestamp).getTime();
    const lastMessageTime = new Date(existingMessages[existingMessages.length - 1].timestamp).getTime();
    const hoursDiff = (messageTime - lastMessageTime) / (1000 * 60 * 60);

    if (hoursDiff >= 5) {
      console.log(`✅ Respuesta después de ${hoursDiff.toFixed(1)} horas de silencio - ÚNICA`);
      return true;
    }

    console.log(`❌ Respuesta después de solo ${hoursDiff.toFixed(1)} horas - NO ÚNICA`);
    return false;

  } catch (error) {
    console.error('Error in isUniqueResponse:', error);
    return true; // En caso de error, asumimos que es única
  }
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
async function processTextMessage(messagingEvent: any, pageId: string) {
  try {
    console.log(`🔄 Procesando mensaje de texto`)

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message.text || 'Mensaje sin texto'
    const timestamp = new Date(messagingEvent.timestamp || Date.now()).toISOString()
    
    // Detectar si el mensaje contiene enlaces de invitación
    const isInvitation = detectInvitationLinks(messageText)
    console.log(`🔍 Detección de invitación: ${isInvitation ? 'SÍ' : 'NO'} para mensaje: "${messageText}"`)
    
    // Verificar si es una respuesta única
    const isUnique = await isUniqueResponse(senderId, timestamp)
    console.log(`🔍 Respuesta única: ${isUnique ? 'SÍ' : 'NO'}`)
    
    // Determinar el nombre del usuario más legible
    const userName = `Usuario ${senderId.slice(-4)}`

    const messageData = {
      instagram_message_id: message.mid || `msg_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: timestamp,
      message_type: 'received',
      is_invitation: isInvitation,
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'messaging',
        invitation_detected: isInvitation,
        is_unique_response: isUnique
      }
    }

    console.log(`💾 Guardando mensaje: "${messageText}" de ${userName} ${isInvitation ? '(INVITACIÓN DETECTADA)' : ''} ${isUnique ? '(RESPUESTA ÚNICA)' : '(RESPUESTA NO ÚNICA)'}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje guardado exitosamente ${isInvitation ? 'con marcador de invitación' : ''} ${isUnique ? '(respuesta única)' : '(respuesta no única)'}`)

    // Ya no generamos respuesta automática aquí - se maneja desde el frontend
    console.log(`📱 Mensaje procesado, respuesta automática se manejará desde el frontend`)

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
    
    // Convertir timestamp de segundos a millisegundos si es necesario
    let timestamp = changeValue.timestamp
    if (timestamp && timestamp.toString().length === 10) {
      timestamp = parseInt(timestamp) * 1000
    }
    const timestampISO = new Date(timestamp || Date.now()).toISOString()
    
    // Detectar si el mensaje contiene enlaces de invitación
    const isInvitation = detectInvitationLinks(messageText)
    console.log(`🔍 Detección de invitación: ${isInvitation ? 'SÍ' : 'NO'} para mensaje: "${messageText}"`)
    
    // Verificar si es una respuesta única
    const isUnique = await isUniqueResponse(senderId, timestampISO)
    console.log(`🔍 Respuesta única: ${isUnique ? 'SÍ' : 'NO'}`)
    
    // Determinar el nombre del usuario más legible
    const userName = `Usuario ${senderId.slice(-4)}`

    const messageData = {
      instagram_message_id: message?.mid || `change_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: timestampISO,
      message_type: 'received',
      is_invitation: isInvitation,
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'changes',
        invitation_detected: isInvitation,
        is_unique_response: isUnique
      }
    }

    console.log(`💾 Guardando mensaje de change: "${messageText}" de ${userName} ${isInvitation ? '(INVITACIÓN DETECTADA)' : ''} ${isUnique ? '(RESPUESTA ÚNICA)' : '(RESPUESTA NO ÚNICA)'}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje de change:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje de change guardado exitosamente ${isInvitation ? 'con marcador de invitación' : ''} ${isUnique ? '(respuesta única)' : '(respuesta no única)'}`)

    // Ya no generamos respuesta automática aquí - se maneja desde el frontend
    console.log(`📱 Mensaje procesado, respuesta automática se manejará desde el frontend`)

    return { success: true, id: data[0]?.id }

  } catch (error) {
    console.error(`💥 Error en processChangeMessage:`, error)
    return { success: false, error: error.message }
  }
}

