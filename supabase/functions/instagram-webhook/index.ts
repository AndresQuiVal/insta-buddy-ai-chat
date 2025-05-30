
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

// Función para obtener el username real del prospecto
async function fetchInstagramUsername(senderId: string): Promise<string> {
  try {
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    if (!accessToken) {
      console.warn('No hay access token disponible para obtener username')
      return `@${senderId.slice(-8)}`
    }

    console.log(`🔍 Intentando obtener username real para sender_id: ${senderId}`)
    
    // Intentar obtener información del usuario usando la API de Instagram
    const userInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${senderId}?fields=username,name&access_token=${accessToken}`)
    
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      console.log(`✅ Username obtenido: ${userInfo.username || userInfo.name}`)
      return userInfo.username ? `@${userInfo.username}` : (userInfo.name || `@${senderId.slice(-8)}`)
    } else {
      console.warn(`❌ No se pudo obtener username para ${senderId}:`, await userInfoResponse.text())
      return `@${senderId.slice(-8)}`
    }
  } catch (error) {
    console.error('Error obteniendo username:', error)
    return `@${senderId.slice(-8)}`
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

      // Obtener PAGE_ID de los secretos para determinar mensajes enviados vs recibidos
      const PAGE_ID = Deno.env.get('PAGE_ID')
      console.log('🔑 PAGE_ID obtenido:', PAGE_ID || 'NO CONFIGURADO')

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
              const result = await processTextMessage(messagingEvent, entry.id, PAGE_ID)
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
                const result = await processChangeMessage(change.value, entry.id, PAGE_ID)
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
async function processTextMessage(messagingEvent: any, pageId: string, MY_PAGE_ID: string) {
  try {
    console.log(`🔄 Procesando mensaje de texto`)

    const message = messagingEvent.message
    const senderId = messagingEvent.sender?.id || 'unknown_sender'
    const recipientId = messagingEvent.recipient?.id || pageId
    const messageText = message.text || 'Mensaje sin texto'
    const timestamp = new Date(messagingEvent.timestamp || Date.now()).toISOString()
    
    // NUEVA LÓGICA: Determinar si es mensaje enviado o recibido usando PAGE_ID
    let messageType = 'received' // Por defecto asumir que es recibido
    
    if (MY_PAGE_ID) {
      if (senderId === MY_PAGE_ID) {
        messageType = 'sent'
        console.log(`📤 Mensaje ENVIADO por nosotros (sender_id: ${senderId} === PAGE_ID: ${MY_PAGE_ID})`)
      } else {
        messageType = 'received'
        console.log(`📥 Mensaje RECIBIDO de prospecto (sender_id: ${senderId} !== PAGE_ID: ${MY_PAGE_ID})`)
      }
    } else {
      console.warn('⚠️ PAGE_ID no configurado, usando lógica por defecto')
      // Lógica de fallback basada en el campo is_echo si está disponible
      if (message.is_echo === true) {
        messageType = 'sent'
        console.log(`📤 Mensaje ENVIADO (detectado por is_echo)`)
      } else {
        messageType = 'received'
        console.log(`📥 Mensaje RECIBIDO (no hay is_echo)`)
      }
    }
    
    // Detectar si el mensaje contiene enlaces de invitación
    const isInvitation = detectInvitationLinks(messageText)
    console.log(`🔍 Detección de invitación: ${isInvitation ? 'SÍ' : 'NO'} para mensaje: "${messageText}"`)
    
    // Verificar si es una respuesta única (solo para mensajes recibidos)
    const isUnique = messageType === 'received' ? await isUniqueResponse(senderId, timestamp) : false
    if (messageType === 'received') {
      console.log(`🔍 Respuesta única: ${isUnique ? 'SÍ' : 'NO'}`)
    }
    
    // Obtener username real para prospectos (mensajes recibidos)
    let userName = `Usuario ${senderId.slice(-4)}`
    if (messageType === 'received') {
      userName = await fetchInstagramUsername(senderId)
    }

    const messageData = {
      instagram_message_id: message.mid || `msg_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: timestamp,
      message_type: messageType,
      is_invitation: isInvitation,
      raw_data: { 
        original_event: messagingEvent,
        processed_at: new Date().toISOString(),
        source: 'messaging',
        invitation_detected: isInvitation,
        is_unique_response: isUnique,
        page_id_used: MY_PAGE_ID,
        detection_logic: MY_PAGE_ID ? 'page_id_comparison' : 'is_echo_fallback'
      }
    }

    const messageTypeText = messageType === 'sent' ? 'ENVIADO' : 'RECIBIDO'
    const uniqueText = isUnique ? '(RESPUESTA ÚNICA)' : (messageType === 'received' ? '(RESPUESTA NO ÚNICA)' : '')
    console.log(`💾 Guardando mensaje ${messageTypeText}: "${messageText}" de ${userName} ${isInvitation ? '(INVITACIÓN DETECTADA)' : ''} ${uniqueText}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje guardado exitosamente ${isInvitation ? 'con marcador de invitación' : ''} ${uniqueText}`)

    return { success: true, id: data[0]?.id, messageType, isUnique }

  } catch (error) {
    console.error(`💥 Error en processTextMessage:`, error)
    return { success: false, error: error.message }
  }
}

// Función para procesar mensajes de changes
async function processChangeMessage(changeValue: any, pageId: string, MY_PAGE_ID: string) {
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
    
    // NUEVA LÓGICA: Determinar si es mensaje enviado o recibido usando PAGE_ID
    let messageType = 'received' // Por defecto asumir que es recibido
    
    if (MY_PAGE_ID) {
      if (senderId === MY_PAGE_ID) {
        messageType = 'sent'
        console.log(`📤 Mensaje ENVIADO por nosotros (sender_id: ${senderId} === PAGE_ID: ${MY_PAGE_ID})`)
      } else {
        messageType = 'received'
        console.log(`📥 Mensaje RECIBIDO de prospecto (sender_id: ${senderId} !== PAGE_ID: ${MY_PAGE_ID})`)
      }
    } else {
      console.warn('⚠️ PAGE_ID no configurado, usando lógica por defecto (asumiendo recibido)')
      messageType = 'received'
    }
    
    // Detectar si el mensaje contiene enlaces de invitación
    const isInvitation = detectInvitationLinks(messageText)
    console.log(`🔍 Detección de invitación: ${isInvitation ? 'SÍ' : 'NO'} para mensaje: "${messageText}"`)
    
    // Verificar si es una respuesta única (solo para mensajes recibidos)
    const isUnique = messageType === 'received' ? await isUniqueResponse(senderId, timestampISO) : false
    if (messageType === 'received') {
      console.log(`🔍 Respuesta única: ${isUnique ? 'SÍ' : 'NO'}`)
    }
    
    // Obtener username real para prospectos (mensajes recibidos)
    let userName = `Usuario ${senderId.slice(-4)}`
    if (messageType === 'received') {
      userName = await fetchInstagramUsername(senderId)
    }

    const messageData = {
      instagram_message_id: message?.mid || `change_${Date.now()}_${Math.random()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      timestamp: timestampISO,
      message_type: messageType,
      is_invitation: isInvitation,
      raw_data: { 
        original_change: changeValue,
        processed_at: new Date().toISOString(),
        source: 'changes',
        invitation_detected: isInvitation,
        is_unique_response: isUnique,
        page_id_used: MY_PAGE_ID,
        detection_logic: MY_PAGE_ID ? 'page_id_comparison' : 'default_received'
      }
    }

    const messageTypeText = messageType === 'sent' ? 'ENVIADO' : 'RECIBIDO'
    const uniqueText = isUnique ? '(RESPUESTA ÚNICA)' : (messageType === 'received' ? '(RESPUESTA NO ÚNICA)' : '')
    console.log(`💾 Guardando mensaje de change ${messageTypeText}: "${messageText}" de ${userName} ${isInvitation ? '(INVITACIÓN DETECTADA)' : ''} ${uniqueText}`)

    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error(`❌ Error guardando mensaje de change:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Mensaje de change guardado exitosamente ${isInvitation ? 'con marcador de invitación' : ''} ${uniqueText}`)

    return { success: true, id: data[0]?.id, messageType, isUnique }

  } catch (error) {
    console.error(`💥 Error en processChangeMessage:`, error)
    return { success: false, error: error.message }
  }
}
