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

    // Procesamiento de entries
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        console.log('🔄 ===== PROCESANDO ENTRY =====')
        console.log('📋 Entry ID:', entry.id)
        console.log('📋 Entry completo:', JSON.stringify(entry, null, 2))
        console.log('📋 Entry keys:', Object.keys(entry))
        
        // Debug detallado para identificar tipos de eventos
        console.log('🔍 DEBUGGING - Analizando tipo de evento:')
        console.log('  - ¿Tiene messaging?', !!entry.messaging)
        console.log('  - ¿Tiene changes?', !!entry.changes)
        if (entry.changes) {
          console.log('  - Changes fields:', entry.changes.map(c => c.field))
        }

        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log('📝 PROCESANDO MENSAJES DIRECTOS (FORMATO PRODUCCIÓN)')
          
          for (const messagingEvent of entry.messaging) {
            console.log('🔍 ANÁLISIS CRÍTICO ANTES DE PROCESAR:')
            console.log('📋 Mensaje completo:', JSON.stringify(messagingEvent, null, 2))
            console.log('🔘 ¿Tiene postback directo?', !!messagingEvent.postback)
            console.log('🔘 ¿Tiene postback en message?', !!(messagingEvent.message && messagingEvent.message.postback))
            console.log('🔘 ¿Tiene texto?', !!messagingEvent.message?.text)
            if (messagingEvent.message?.text) {
              console.log('📝 Texto del mensaje:', messagingEvent.message.text)
              console.log('🔍 ¿Contiene _postback?', messagingEvent.message.text.includes('_postback'))
            }
            console.log('🚨 LLAMANDO A processMessage...')
            
            await processMessage(messagingEvent, supabase, 'messaging', entry.id)
          }
        }
        else if (entry.changes && Array.isArray(entry.changes)) {
          console.log('🔄 PROCESANDO CAMBIOS (FORMATO PRODUCCIÓN)')
          
          for (const change of entry.changes) {
            console.log('📋 Change:', JSON.stringify(change, null, 2))
            
            if (change.field === 'messages' && change.value) {
              const messagingEvent = {
                sender: change.value.sender,
                recipient: change.value.recipient,
                timestamp: change.value.timestamp,
                message: change.value.message,
                postback: change.value.postback // ✅ INCLUIR POSTBACK PARA MANEJAR CORRECTAMENTE
              }
              
              await processMessage(messagingEvent, supabase, 'changes', entry.id)
            }
            else if (change.field === 'comments' && change.value) {
              console.log('💬 PROCESANDO COMENTARIO')
              await processComment(change.value, supabase, entry.id)
            }
          }
        }
        else {
          console.log('❌ No hay messaging ni changes en este entry')
          console.log('📋 Entry structure:', JSON.stringify(entry, null, 2))
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

// Función para manejar eventos de postback
async function handlePostbackEvent(message: any, supabase: any) {
  try {
    console.log('🔘 === PROCESANDO POSTBACK ===')
    console.log('🔘 Mensaje completo recibido:', JSON.stringify(message, null, 2))
    
    const senderId = message.sender?.id
    const recipientId = message.recipient?.id
    
    // El postback puede venir en dos lugares diferentes
    const postbackData = message.postback || message.message?.postback
    const payload = postbackData?.payload
    
    console.log('👤 SENDER ID:', senderId)
    console.log('🎯 RECIPIENT ID:', recipientId) 
    console.log('📦 PAYLOAD:', payload)
    console.log('🔍 Postback extraído de:', message.postback ? 'message.postback' : 'message.message.postback')
    
    if (!senderId || !recipientId || !payload) {
      console.log('❌ Datos insuficientes para procesar postback')
      return
    }
    
    // Extraer ID del autoresponder del payload
    const autoresponderMatch = payload.match(/^(.+)_postback$/)
    if (!autoresponderMatch) {
      console.log('❌ Formato de payload no válido:', payload)
      return
    }
    
    const autoresponderId = autoresponderMatch[1]
    console.log('🆔 AUTORESPONDER ID:', autoresponderId)
    
    // Buscar el autoresponder para obtener la respuesta
    const { data: specificAutoresponder } = await supabase
      .from('comment_autoresponders')
      .select('postback_response, user_id')
      .eq('id', autoresponderId)
      .single()
    
    const { data: generalAutoresponder } = await supabase
      .from('general_comment_autoresponders')
      .select('postback_response, user_id')
      .eq('id', autoresponderId)
      .single()
    
    const autoresponder = specificAutoresponder || generalAutoresponder
    
    if (!autoresponder || !autoresponder.postback_response) {
      console.log('❌ No se encontró autoresponder o respuesta de postback')
      return
    }
    
    console.log('💬 RESPUESTA POSTBACK:', autoresponder.postback_response)
    
    // Enviar la respuesta del postback
    const response = await supabase.functions.invoke('instagram-send-message', {
      body: {
        recipient_id: senderId,
        message_text: autoresponder.postback_response,
        instagram_user_id: recipientId,
        use_button: false
      }
    })
    
    console.log('📨 RESPUESTA ENVIADA:', response)
    console.log('✅ POSTBACK PROCESADO EXITOSAMENTE')
    
  } catch (error) {
    console.error('❌ Error procesando postback:', error)
  }
}


async function processMessage(messagingEvent: any, supabase: any, source: string, instagramAccountId: string) {
  console.log(`📝 Procesando mensaje desde ${source}:`, JSON.stringify(messagingEvent, null, 2))
  
  // Verificar si es un evento de "read" y saltar si es así
  if (messagingEvent.read) {
    console.log('📖 Es un evento de lectura - saltando procesamiento')
    return
  }
  
  // VERIFICACIÓN MEJORADA: Verificar si es un postback en cualquier parte del mensaje
  if (messagingEvent.postback || (messagingEvent.message && messagingEvent.message.postback)) {
    console.log('🔘 Es un evento de postback - procesando...')
    console.log('🔍 Postback detectado en:', messagingEvent.postback ? 'messagingEvent.postback' : 'messagingEvent.message.postback')
    await handlePostbackEvent(messagingEvent, supabase)
    return // ✅ CRITICAL: No procesar como mensaje normal después del postback
  }
  
  const senderId = messagingEvent.sender?.id
  const recipientId = messagingEvent.recipient?.id
  const messageText = messagingEvent.message?.text
  
  // Corregir el procesamiento del timestamp
  let timestamp: string
  if (messagingEvent.timestamp) {
    const timestampNumber = parseInt(messagingEvent.timestamp)
    // Los timestamps de Instagram vienen en milisegundos
    // Verificar si es un timestamp válido (entre 1970 y 2100)
    const date = new Date(timestampNumber)
    const year = date.getFullYear()
    if (year >= 1970 && year <= 2100) {
      timestamp = date.toISOString()
    } else {
      // Si el timestamp no es válido, usar fecha actual
      timestamp = new Date().toISOString()
    }
  } else {
    timestamp = new Date().toISOString()
  }
  
  console.log('🕐 TIMESTAMP ORIGINAL:', messagingEvent.timestamp)
  console.log('🕐 TIMESTAMP PROCESADO:', timestamp)
  const messageId = messagingEvent.message?.mid || `msg_${Date.now()}_${Math.random()}`
  const isEcho = messagingEvent.message?.is_echo === true

  console.log('🚀 === PROCESANDO MENSAJE ===')
  console.log('👤 SENDER ID:', senderId)
  console.log('🎯 RECIPIENT ID:', recipientId)
  console.log('💬 MENSAJE:', messageText)
  console.log('🔔 ES ECHO:', isEcho)
  console.log('⏰ TIMESTAMP FINAL:', timestamp)
  console.log('🆔 MESSAGE ID:', messageId)

  // 🚨 VERIFICACIÓN CRÍTICA NUEVA: No procesar mensajes que vienen después de un postback
  // Instagram envía 2 webhooks cuando se hace click en un botón: el postback Y el mensaje de texto
  // Solo debemos procesar el postback, NO el mensaje de texto que aparece después
  
  // Verificar si hay actividad reciente de envío de mensajes (últimos 10 segundos)
  const recentMessageCheck = await supabase
    .from('instagram_messages')
    .select('*')
    .eq('sender_id', recipientId) // El bot que envió mensaje recientemente
    .eq('message_type', 'sent')
    .gte('created_at', new Date(Date.now() - 10000).toISOString()) // Últimos 10 segundos
    .order('created_at', { ascending: false })
    .limit(1)

  if (recentMessageCheck.data && recentMessageCheck.data.length > 0) {
    console.log('🚫 SE DETECTÓ ENVÍO RECIENTE DEL BOT - SALTANDO PROCESAMIENTO PARA EVITAR DUPLICADOS')
    console.log('📝 Texto del mensaje recibido:', messageText)
    console.log('⏰ Último mensaje del bot:', recentMessageCheck.data[0].created_at)
    return
  }

  // 🚨 VERIFICACIÓN CRÍTICA: Si el mensaje contiene un payload de postback, NO procesarlo
  if (messageText && messageText.includes('_postback')) {
    console.log('🚫 MENSAJE CONTIENE PAYLOAD POSTBACK - SALTANDO PROCESAMIENTO')
    console.log('📝 Texto del mensaje:', messageText)
    return
  }

  // 🚨 VERIFICACIÓN CRÍTICA: Si el mensaje contiene texto de respuesta de autoresponder, NO procesarlo
  if (messageText && (
    messageText.includes('https://comunidad.vidaplennia.com') ||
    messageText.includes('Venga, esta es la guía') ||
    messageText.includes('guía:')
  )) {
    console.log('🚫 MENSAJE CONTIENE RESPUESTA DE AUTORESPONDER - SALTANDO PROCESAMIENTO')
    console.log('📝 Texto del mensaje:', messageText)
    return
  }

  if (!senderId || !recipientId || !messageText) {
    console.log('❌ Datos insuficientes para procesar mensaje')
    return
  }

  // ✅ NUEVO: PROCESAR MENSAJES ECHO (mensajes que tú envías manualmente)
  if (isEcho) {
    console.log('📤 ES UN MENSAJE ECHO (enviado por el usuario) - PROCESANDO...')
    console.log('👤 ENVIADO POR:', senderId, 'HACIA:', recipientId)
    console.log('💬 MENSAJE:', messageText)
    
    // Verificar si es un mensaje automático del sistema (saltarlo)
    if (messageText && (
      messageText.includes('https://comunidad.vidaplennia.com') ||
      messageText.includes('Venga, esta es la guía') ||
      messageText.includes('guía:') ||
      messageText.includes('_postback') ||
      messageText.includes('Bot:') ||
      messageText.includes('[AUTOMÁTICO]')
    )) {
      console.log('🚫 ES MENSAJE AUTOMÁTICO DEL SISTEMA - SALTANDO')
      return
    }
    
    // Procesar como mensaje enviado manualmente por el usuario
    await processSentMessage(messagingEvent, supabase, source, instagramAccountId)
    return
  }

  console.log('🔄 Actualizando actividad del prospecto...')
  try {
    const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
      p_prospect_id: senderId 
    })
    
    if (activityError) {
      console.error('❌ Error actualizando actividad:', activityError)
    } else {
      console.log('✅ Actividad del prospecto actualizada')
    }
  } catch (activityErr) {
    console.error('💥 Error en update_prospect_activity:', activityErr)
  }

  // NUEVA FUNCIONALIDAD: Cancelar follow-ups pendientes cuando el prospecto responde
  console.log('🔄 Cancelando follow-ups pendientes del prospecto que respondió...')
  try {
    const { data: cancelledFollowups, error: followupError } = await supabase
      .from('autoresponder_followups')
      .update({ 
        prospect_responded: true,
        is_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('sender_id', senderId)
      .eq('prospect_responded', false)
      .eq('is_completed', false)
      .select('id, followup_message_text')
    
    if (followupError) {
      console.error('❌ Error cancelando follow-ups:', followupError)
    } else if (cancelledFollowups && cancelledFollowups.length > 0) {
      console.log('✅ Follow-ups cancelados exitosamente:', cancelledFollowups.length)
      console.log('📋 Follow-ups cancelados:', cancelledFollowups.map(f => ({ id: f.id, message: f.followup_message_text.substring(0, 50) + '...' })))
    } else {
      console.log('ℹ️ No había follow-ups pendientes para cancelar')
    }
  } catch (followupErr) {
    console.error('💥 Error en cancelación de follow-ups:', followupErr)
  }

  console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM POR RECIPIENT ID =====')
  console.log('🎯 Buscando usuario con instagram_user_id:', recipientId)

  const { data: instagramUser, error: userError } = await supabase
    .from('instagram_users')
    .select('*')
    .eq('instagram_user_id', recipientId)
    .eq('is_active', true)
    .single()

  if (userError || !instagramUser) {
    console.error('❌ No se encontró usuario de Instagram con ID:', recipientId, userError)
    console.log('❌ No hay usuario configurado para recibir este mensaje - NO SE ENVIARÁ AUTORESPONDER')
    return
  }

  console.log('✅ Usuario de Instagram encontrado:', JSON.stringify(instagramUser, null, 2))

  console.log('🔍 ===== CREANDO/ACTUALIZANDO PROSPECTO =====')
  
  let prospectId;
  try {
    const { data: prospectResult, error: prospectError } = await supabase.rpc('create_or_update_prospect', {
      p_instagram_user_id: instagramUser.id,
      p_prospect_instagram_id: senderId,
      p_username: `prospect_${senderId.slice(-8)}`,
      p_profile_picture_url: null
    })

    if (prospectError) {
      console.error('❌ Error creando prospecto:', prospectError)
      return
    }

    prospectId = prospectResult
    console.log('✅ Prospecto creado/actualizado con ID:', prospectId)
    
  } catch (prospectErr) {
    console.error('💥 Error en create_or_update_prospect:', prospectErr)
    return
  }

  try {
    const { data: messageResult, error: messageError } = await supabase.rpc('add_prospect_message', {
      p_prospect_id: prospectId,
      p_message_instagram_id: messageId,
      p_message_text: messageText,
      p_is_from_prospect: true,
      p_message_timestamp: timestamp,
      p_message_type: 'text',
      p_raw_data: messagingEvent
    })

    if (messageError) {
      console.error('❌ Error guardando mensaje:', messageError)
    } else {
      console.log('✅ Mensaje del prospecto guardado en BD')
    }
  } catch (messageErr) {
    console.error('💥 Error en add_prospect_message:', messageErr)
  }

  console.log('🔍 ===== VERIFICANDO SI ES RESPUESTA A CONFIRMACIÓN DE SEGUIDOR =====')
  
  // Verificar si es una respuesta afirmativa a una confirmación pendiente
  const affirmativeWords = ['si', 'sí', 'yes', 'yep', 'ya', 'claro', 'por supuesto', 'obvio', 'afirmativo', 'correcto', 'exacto']
  const messageTextLower = messageText.toLowerCase().trim()
  
  const isAffirmativeResponse = affirmativeWords.some(word => 
    messageTextLower === word || messageTextLower.includes(word)
  )
  
  if (isAffirmativeResponse) {
    console.log('🎯 DETECTADA RESPUESTA AFIRMATIVA:', messageText)
    
    // Buscar confirmación pendiente para este usuario
    const { data: pendingConfirmations, error: pendingError } = await supabase
      .from('pending_follower_confirmations')
      .select('*')
      .eq('commenter_id', senderId)
      .eq('is_confirmed', false)
      .eq('original_message_sent', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (pendingError) {
      console.error('❌ Error buscando confirmaciones pendientes:', pendingError)
    } else if (pendingConfirmations && pendingConfirmations.length > 0) {
      const confirmation = pendingConfirmations[0]
      console.log('✅ CONFIRMACIÓN PENDIENTE ENCONTRADA:', confirmation.id)
      console.log('📤 Enviando mensaje real del autoresponder:', confirmation.original_dm_message)
      
      // Enviar el mensaje real del autoresponder
      try {
        // Buscar el autoresponder original para obtener los datos del botón
        let autoresponderData = null
        let buttonData = {}
        
        if (confirmation.autoresponder_type === 'general') {
          const { data: generalAutoresponder } = await supabase
            .from('general_comment_autoresponders')
            .select('*')
            .eq('id', confirmation.autoresponder_id)
            .single()
          autoresponderData = generalAutoresponder
        } else {
          const { data: commentAutoresponder } = await supabase
            .from('comment_autoresponders')
            .select('*')
            .eq('id', confirmation.autoresponder_id)
            .single()
          autoresponderData = commentAutoresponder
        }
        
        console.log('📋 Autoresponder original encontrado:', autoresponderData?.name)
        console.log('🔘 Use buttons:', autoresponderData?.use_buttons)
        console.log('🔘 Use button message:', autoresponderData?.use_button_message)
        console.log('🔘 Button text:', autoresponderData?.button_text)
        console.log('🔘 Button URL:', autoresponderData?.button_url)
        console.log('🔘 Button type:', autoresponderData?.button_type)
        console.log('🔘 Postback response:', autoresponderData?.postback_response)
        
        // Usar use_button_message O use_buttons para compatibilidad
        if (autoresponderData?.use_button_message || autoresponderData?.use_buttons) {
          buttonData = {
            use_button: true,
            button_text: autoresponderData.button_text || null,
            button_url: autoresponderData.button_url || null,
            button_type: autoresponderData.button_type || 'web_url',
            postback_payload: autoresponderData.postback_response ? `${autoresponderData.id}_postback` : null
          }
        } else {
          buttonData = {
            use_button: false,
            button_text: null,
            button_url: null,
            button_type: 'web_url',
            postback_payload: null
          }
        }
        
        console.log('📤 Enviando mensaje con datos de botón:', buttonData)
        
        const { data: finalMessageResponse, error: finalMessageError } = await supabase.functions.invoke('instagram-send-message', {
          body: {
            recipient_id: senderId,
            message_text: confirmation.original_dm_message,
            instagram_user_id: recipientId,
            ...buttonData
          }
        })
        
        if (finalMessageError) {
          console.error('❌ Error enviando mensaje final:', finalMessageError)
        } else {
          console.log('✅ MENSAJE FINAL ENVIADO EXITOSAMENTE')
          
          // Marcar confirmación como completada
          await supabase
            .from('pending_follower_confirmations')
            .update({
              is_confirmed: true,
              confirmed_at: new Date().toISOString(),
              original_message_sent: true,
              original_message_sent_at: new Date().toISOString()
            })
            .eq('id', confirmation.id)
          
          // Registrar en log de autoresponders enviados
          const { error: logError } = await supabase
            .from('autoresponder_sent_log')
            .insert({
              autoresponder_message_id: null, // Es un comment autoresponder
              sender_id: senderId,
              sent_at: new Date().toISOString()
            })
          
          console.log('🎉 FLUJO REQUIRE_FOLLOWER COMPLETADO EXITOSAMENTE')
          console.log('✅ Usuario confirmó que sigue → Mensaje real enviado')
          return // Terminar procesamiento aquí
        }
      } catch (finalMessageException) {
        console.error('💥 Excepción enviando mensaje final:', finalMessageException)
      }
    } else {
      console.log('ℹ️ No hay confirmaciones pendientes para este usuario')
    }
  }

  console.log('🔍 ===== ANÁLISIS DEL MENSAJE =====')
  console.log('📝 Texto:', messageText)

  const isInvitation = messageText?.toLowerCase().includes('invitacion') || messageText?.toLowerCase().includes('invitación')
  const isPresentation = messageText?.toLowerCase().includes('presentacion') || messageText?.toLowerCase().includes('presentación')
  const isInscription = messageText?.toLowerCase().includes('inscripcion') || messageText?.toLowerCase().includes('inscripción')

  const { error: saveError } = await supabase
    .from('instagram_messages')
    .insert({
      instagram_user_id: instagramUser.id,
      instagram_message_id: messageId,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText || '',
      message_type: 'received',
      timestamp: timestamp,
      is_invitation: isInvitation,
      is_presentation: isPresentation,
      is_inscription: isInscription,
      raw_data: {
        ...messagingEvent,
        webhook_source: source,
        processed_at: new Date().toISOString()
      }
    })

  if (saveError) {
    console.error('❌ Error guardando mensaje en instagram_messages:', saveError)
  } else {
    console.log('✅ Mensaje guardado correctamente')
  }

  console.log('🔍 ===== OBTENIENDO AUTORESPONDERS DEL USUARIO ESPECÍFICO =====')
  console.log('👤 Buscando autoresponders para usuario:', instagramUser.username, 'con instagram_user_id_ref:', recipientId)
  
  const { data: autoresponders, error: autoresponderError } = await supabase
    .from('autoresponder_messages')
    .select('*')
    .eq('instagram_user_id_ref', recipientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (autoresponderError) {
    console.error('❌ Error obteniendo autoresponders:', autoresponderError)
    return
  }

  if (!autoresponders || autoresponders.length === 0) {
    console.log('❌ No se encontraron autoresponders activos para este usuario - NO SE ENVIARÁ AUTORESPONDER')
    return
  }

  console.log('✅ Autoresponders encontrados para el usuario:', autoresponders.length)
  console.log('📊 Detalle de autoresponders:', autoresponders.map(ar => ({
    id: ar.id,
    name: ar.name,
    use_keywords: ar.use_keywords,
    keywords: ar.keywords,
    send_only_first_message: ar.send_only_first_message
  })))

  let selectedAutoresponder = null

  for (const autoresponder of autoresponders) {
    if (!autoresponder.use_keywords) {
      selectedAutoresponder = autoresponder
      break
    }

    const keywords = autoresponder.keywords || []
    let hasMatch = false

    for (const keyword of keywords) {
      if (messageText?.toLowerCase().includes(keyword.toLowerCase())) {
        hasMatch = true
        break
      }
    }

    if (hasMatch) {
      selectedAutoresponder = autoresponder
      break
    }
  }

  if (!selectedAutoresponder) {
    console.log('❌ No se encontró autoresponder que coincida con las palabras clave')
    return
  }

  console.log('🎯 AUTORESPONDER SELECCIONADO:', selectedAutoresponder.name)
  console.log('⚙️ SEND_ONLY_FIRST_MESSAGE:', selectedAutoresponder.send_only_first_message)

  // VERIFICACIÓN MEJORADA PARA "SOLO ENVIAR PRIMER MENSAJE"
  if (selectedAutoresponder.send_only_first_message) {
    console.log('🔍 ===== VERIFICANDO SI YA SE ENVIÓ PRIMER MENSAJE (DM AUTORESPONDER) =====')
    console.log('⚙️ send_only_first_message está ACTIVADO - verificando si ya se envió antes')

    // VERIFICACIÓN 1: autoresponder_sent_log (más específica para este autoresponder)
    const { data: alreadySentLog, error: sentLogError } = await supabase
      .from('autoresponder_sent_log')
      .select('*')
      .eq('sender_id', senderId)
      .eq('autoresponder_message_id', selectedAutoresponder.id)

    console.log('📊 Consultando autoresponder_sent_log para sender_id:', senderId, 'y autoresponder_id:', selectedAutoresponder.id)
    
    if (sentLogError) {
      console.error('❌ Error consultando autoresponder_sent_log:', sentLogError)
    } else {
      console.log('📊 Resultados autoresponder_sent_log:', alreadySentLog?.length || 0, 'registros encontrados')
      if (alreadySentLog && alreadySentLog.length > 0) {
        console.log('📋 Detalle registros encontrados:', alreadySentLog)
        console.log('⏭️ YA SE ENVIÓ ESTE AUTORESPONDER ESPECÍFICO ANTES - SALTANDO')
        return
      }
    }

    // VERIFICACIÓN 2: Buscar cualquier mensaje de autoresponder enviado previamente a este sender
    const { data: previousAutoMessages, error: prevAutoError } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', recipientId) // Mensajes enviados por nosotros
      .eq('recipient_id', senderId) // Al prospecto específico
      .eq('message_type', 'sent')
      .neq('message_text', messageText) // Excluir el mensaje actual si existe

    console.log('📊 Consultando mensajes previos enviados al sender_id:', senderId)
    
    if (prevAutoError) {
      console.error('❌ Error consultando mensajes previos:', prevAutoError)
    } else {
      console.log('📊 Mensajes enviados previamente:', previousAutoMessages?.length || 0, 'registros')
      if (previousAutoMessages && previousAutoMessages.length > 0) {
        console.log('📋 Detalle mensajes previos:', previousAutoMessages.map(msg => ({
          id: msg.id,
          message_text: msg.message_text?.substring(0, 50) + '...',
          timestamp: msg.timestamp
        })))
        console.log('⏭️ YA EXISTE CONVERSACIÓN PREVIA CON ESTE PROSPECTO - SALTANDO')
        return
      }
    }

    console.log('✅ VERIFICACIÓN COMPLETA: No se encontraron mensajes previos - PROCEDIENDO A ENVIAR')
  } else {
    console.log('⚙️ send_only_first_message está DESACTIVADO - enviando sin restricciones')
  }

  console.log('🚀 ENVIANDO AUTORESPONDER...')

  const { data, error } = await supabase.functions.invoke('instagram-send-message', {
    body: {
      recipient_id: senderId,
      message_text: selectedAutoresponder.message_text,
      instagram_user_id: recipientId,
      use_button: selectedAutoresponder.use_buttons || false,
      button_text: selectedAutoresponder.button_text || null,
      button_url: selectedAutoresponder.button_url || null
    }
  })

  if (error) {
    console.error('❌ Error enviando mensaje:', error)
    return
  }

  console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

  // REGISTRAR EN LOG DE AUTORESPONDERS ENVIADOS
  const { error: logError } = await supabase
    .from('autoresponder_sent_log')
    .insert({
      autoresponder_message_id: selectedAutoresponder.id,
      sender_id: senderId,
      sent_at: new Date().toISOString()
    })

  if (logError) {
    console.error('⚠️ Error guardando en autoresponder_sent_log:', logError)
  } else {
    console.log('✅ Registro guardado en autoresponder_sent_log')
  }

  console.log('📅 ===== CREANDO FOLLOW-UPS CONFIGURADOS =====')
  await createFollowUps(selectedAutoresponder.id, senderId)

  console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===')
}

// Función para crear follow-ups basados en la configuración
async function createFollowUps(autoresponderMessageId: string, senderId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  try {
    console.log('🔍 Buscando configuración de follow-ups para autoresponder:', autoresponderMessageId)
    
    const { data: followUpConfigs, error: configError } = await supabase
      .from('autoresponder_followup_configs')
      .select('*')
      .eq('autoresponder_message_id', autoresponderMessageId)
      .eq('is_active', true)
      .order('sequence_order')

    if (configError) {
      console.error('❌ Error buscando configuración de follow-ups:', configError)
      return
    }

    if (!followUpConfigs || followUpConfigs.length === 0) {
      console.log('ℹ️ No hay follow-ups configurados para este autoresponder')
      return
    }

    console.log('✅ Follow-ups configurados encontrados:', followUpConfigs.length)

    const currentTime = new Date()
    let accumulatedHours = 0

    const followupsToCreate = []

    for (const config of followUpConfigs) {
      accumulatedHours += config.delay_hours
      
      // Validar que no exceda 23 horas por follow-up individual
      if (config.delay_hours > 23) {
        console.log(`⚠️ Follow-up ${config.sequence_order} excede 23 horas (${config.delay_hours}h) - omitiendo`)
        continue
      }

      const followupTime = new Date(currentTime.getTime() + (accumulatedHours * 60 * 60 * 1000))
      
      followupsToCreate.push({
        sender_id: senderId,
        autoresponder_message_id: autoresponderMessageId,
        initial_message_sent_at: currentTime.toISOString(),
        followup_scheduled_at: followupTime.toISOString(),
        followup_message_text: config.message_text
      })

      console.log(`📅 Follow-up ${config.sequence_order} programado para: ${followupTime.toISOString()} (+${accumulatedHours}h total)`)
    }

    if (followupsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('autoresponder_followups')
        .insert(followupsToCreate)

      if (insertError) {
        console.error('❌ Error insertando follow-ups:', insertError)
      } else {
        console.log('✅ Follow-ups creados exitosamente:', followupsToCreate.length)
      }
    } else {
      console.log('ℹ️ No hay follow-ups válidos para crear')
    }

  } catch (error) {
    console.error('💥 Error creando follow-ups:', error)
  }
}

// Función para crear follow-ups de comment autoresponders
async function createCommentFollowUps(autoresponderID: string, commenterId: string, autoresponderType: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  try {
    console.log('🔍 Buscando configuración de follow-ups para autoresponder:', autoresponderID, 'tipo:', autoresponderType)
    
    let followUpQuery;
    
    if (autoresponderType === 'general') {
      followUpQuery = supabase
        .from('autoresponder_followup_configs')
        .select('*')
        .eq('general_autoresponder_id', autoresponderID)
        .eq('is_active', true)
        .order('sequence_order')
    } else {
      followUpQuery = supabase
        .from('autoresponder_followup_configs')
        .select('*')
        .eq('comment_autoresponder_id', autoresponderID)
        .eq('is_active', true)
        .order('sequence_order')
    }

    const { data: followUpConfigs, error: configError } = await followUpQuery

    if (configError) {
      console.error('❌ Error buscando configuración de follow-ups:', configError)
      return
    }

    if (!followUpConfigs || followUpConfigs.length === 0) {
      console.log('ℹ️ No hay follow-ups configurados para este autoresponder de comentarios')
      return
    }

    console.log('✅ Follow-ups configurados encontrados:', followUpConfigs.length)

    const currentTime = new Date()
    let accumulatedHours = 0

    const followupsToCreate = []

    for (const config of followUpConfigs) {
      accumulatedHours += config.delay_hours
      
      // Validar que no exceda 23 horas por follow-up individual
      if (config.delay_hours > 23) {
        console.log(`⚠️ Follow-up ${config.sequence_order} excede 23 horas (${config.delay_hours}h) - omitiendo`)
        continue
      }

      const followupTime = new Date(currentTime.getTime() + (accumulatedHours * 60 * 60 * 1000))
      
      followupsToCreate.push({
        sender_id: commenterId,
        autoresponder_message_id: null, // Solo para DM autoresponders
        comment_autoresponder_id: autoresponderType === 'specific' ? autoresponderID : null,
        general_autoresponder_id: autoresponderType === 'general' ? autoresponderID : null,
        initial_message_sent_at: currentTime.toISOString(),
        followup_scheduled_at: followupTime.toISOString(),
        followup_message_text: config.message_text
      })

      console.log(`📅 Follow-up ${config.sequence_order} programado para: ${followupTime.toISOString()} (+${accumulatedHours}h total)`)
}

// ✅ NUEVA FUNCIÓN: Procesar mensajes enviados manualmente por el usuario
async function processSentMessage(messagingEvent: any, supabase: any, source: string, instagramAccountId: string) {
  console.log('📤 ===== PROCESANDO MENSAJE ENVIADO MANUALMENTE =====')
  console.log(`📝 Mensaje desde ${source}:`, JSON.stringify(messagingEvent, null, 2))
  
  const senderId = messagingEvent.sender?.id
  const recipientId = messagingEvent.recipient?.id
  const messageText = messagingEvent.message?.text
  
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
  
  const messageId = messagingEvent.message?.mid || `sent_msg_${Date.now()}_${Math.random()}`
  
  console.log('📤 DATOS DEL MENSAJE ENVIADO:')
  console.log('👤 ENVIADO POR (tú):', senderId)
  console.log('🎯 ENVIADO HACIA (prospecto):', recipientId)  
  console.log('💬 MENSAJE:', messageText)
  console.log('⏰ TIMESTAMP:', timestamp)
  console.log('🆔 MESSAGE ID:', messageId)
  
  // Buscar usuario de Instagram (el que envió el mensaje)
  console.log('🔍 BUSCANDO USUARIO DE INSTAGRAM POR SENDER ID:', senderId)
  
  const { data: instagramUser, error: userError } = await supabase
    .from('instagram_users')
    .select('*')
    .eq('instagram_user_id', senderId)
    .eq('is_active', true)
    .single()

  if (userError || !instagramUser) {
    console.error('❌ No se encontró usuario de Instagram con ID:', senderId, userError)
    return
  }

  console.log('✅ Usuario de Instagram encontrado:', JSON.stringify(instagramUser, null, 2))

  // Guardar mensaje enviado en instagram_messages
  console.log('💾 GUARDANDO MENSAJE ENVIADO EN BD...')
  
  const { error: saveError } = await supabase
    .from('instagram_messages')
    .insert({
      instagram_user_id: instagramUser.id,
      instagram_message_id: messageId,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText || '',
      message_type: 'sent', // ✅ MENSAJE ENVIADO POR EL USUARIO
      timestamp: timestamp,
      is_invitation: false,
      is_presentation: false,
      is_inscription: false,
      raw_data: {
        ...messagingEvent,
        webhook_source: source,
        processed_at: new Date().toISOString(),
        manual_message: true, // ✅ MARCAR COMO MENSAJE MANUAL
        is_echo: true
      }
    })

  if (saveError) {
    console.error('❌ Error guardando mensaje enviado:', saveError)
  } else {
    console.log('✅ MENSAJE ENVIADO GUARDADO CORRECTAMENTE')
    console.log('🎯 El prospecto', recipientId, 'ahora debería aparecer en "En seguimiento"')
    console.log('📊 Estado actualizado: El último mensaje lo enviaste tú')
  }
  
  console.log('✅ === MENSAJE ENVIADO PROCESADO COMPLETAMENTE ===')
}

    if (followupsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('autoresponder_followups')
        .insert(followupsToCreate)

      if (insertError) {
        console.error('❌ Error insertando follow-ups:', insertError)
      } else {
        console.log('✅ Follow-ups de comentarios creados exitosamente:', followupsToCreate.length)
      }
    } else {
      console.log('ℹ️ No hay follow-ups válidos para crear')
    }

  } catch (error) {
    console.error('💥 Error creando follow-ups de comentarios:', error)
  }
}

async function processComment(commentData: any, supabase: any, instagramAccountId: string) {
  console.log('💬 ===== PROCESANDO COMENTARIO =====')
  console.log('📋 Datos del comentario:', JSON.stringify(commentData, null, 2))

  const commenterId = commentData.from?.id
  const commenterUsername = commentData.from?.username
  const commentText = commentData.text
  const mediaId = commentData.media?.id
  const originalMediaId = commentData.media?.original_media_id
  const commentId = commentData.id

  console.log('👤 COMMENTER ID:', commenterId)
  console.log('👤 COMMENTER USERNAME:', commenterUsername)
  console.log('💬 COMMENT TEXT:', commentText)
  console.log('📱 MEDIA ID:', mediaId)
  console.log('📱 ORIGINAL MEDIA ID:', originalMediaId)
  console.log('🆔 COMMENT ID:', commentId)

  if (!commenterId || !commentText || !mediaId || !commentId) {
    console.log('❌ Datos insuficientes para procesar comentario')
    return
  }

  // ✅ NUEVO: GUARDAR COMENTARIO EN instagram_messages PARA QUE APAREZCA EN TASKS
  console.log('💾 ===== GUARDANDO COMENTARIO EN instagram_messages =====')
  
  try {
    // Buscar usuario de Instagram
    const { data: instagramUser, error: userError } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('instagram_user_id', instagramAccountId)
      .eq('is_active', true)
      .single()

    if (!userError && instagramUser) {
      const { error: saveCommentError } = await supabase
        .from('instagram_messages')
        .insert({
          instagram_user_id: instagramUser.id,
          instagram_message_id: commentId,
          sender_id: commenterId,
          recipient_id: instagramAccountId,
          message_text: commentText || '',
          message_type: 'received',
          timestamp: new Date().toISOString(),
          raw_data: {
            ...commentData,
            webhook_source: 'comments',
            post_id: mediaId,
            comment_id: commentId,
            commenter_username: commenterUsername,
            processed_at: new Date().toISOString()
          }
        })

      if (saveCommentError) {
        console.error('❌ Error guardando comentario en instagram_messages:', saveCommentError)
      } else {
        console.log('✅ Comentario guardado en instagram_messages')
      }
    }
  } catch (commentSaveError) {
    console.error('💥 Error guardando comentario:', commentSaveError)
  }

  console.log('🔍 ===== BUSCANDO AUTORESPONDER DE COMENTARIOS =====')

  // PASO 1: Buscar autoresponders específicos del post
  let commentAutoresponders = []
  let searchError = null
  let autoresponderType = null

  // Primer intento: buscar por media_id actual
  const { data: autorespondersByMediaId, error: mediaIdError } = await supabase
    .from('comment_autoresponders')
    .select('*')
    .eq('is_active', true)
    .eq('post_id', mediaId)

  if (mediaIdError) {
    console.error('❌ Error buscando por media_id:', mediaIdError)
    searchError = mediaIdError
  } else {
    commentAutoresponders = autorespondersByMediaId || []
    if (commentAutoresponders.length > 0) {
      autoresponderType = 'specific'
      console.log('🔍 Autoresponders específicos encontrados por media_id:', commentAutoresponders.length)
    }
  }

  // PASO 1.5: Buscar autoresponders generales asignados a este post
  if (commentAutoresponders.length === 0) {
    console.log('🔍 Buscando autoresponders generales asignados a este post...')
    
    const { data: generalAssignments, error: assignmentError } = await supabase
      .from('post_autoresponder_assignments')
      .select(`
        id,
        is_active,
        general_comment_autoresponders!inner(
          id,
          name,
          keywords,
          dm_message,
          public_reply_messages,
          use_buttons,
          buttons,
          is_active,
          use_button_message,
          button_text,
          button_url,
          button_type,
          postback_response,
          require_follower
        )
      `)
      .eq('post_id', mediaId)
      .eq('is_active', true)
      .eq('general_comment_autoresponders.is_active', true)

    if (assignmentError) {
      console.error('❌ Error buscando asignaciones generales:', assignmentError)
    } else if (generalAssignments && generalAssignments.length > 0) {
      console.log('✅ Autoresponders generales encontrados:', generalAssignments.length)
      
      // Convertir el formato a comment_autoresponders
      commentAutoresponders = generalAssignments.map(assignment => ({
        id: assignment.general_comment_autoresponders.id,
        name: assignment.general_comment_autoresponders.name,
        keywords: assignment.general_comment_autoresponders.keywords,
        dm_message: assignment.general_comment_autoresponders.dm_message,
        public_reply_messages: assignment.general_comment_autoresponders.public_reply_messages,
        use_buttons: assignment.general_comment_autoresponders.use_buttons,
        buttons: assignment.general_comment_autoresponders.buttons,
        is_active: assignment.general_comment_autoresponders.is_active,
        use_button_message: assignment.general_comment_autoresponders.use_button_message,
        button_text: assignment.general_comment_autoresponders.button_text,
        button_url: assignment.general_comment_autoresponders.button_url,
        button_type: assignment.general_comment_autoresponders.button_type,
        postback_response: assignment.general_comment_autoresponders.postback_response,
        require_follower: assignment.general_comment_autoresponders.require_follower,
        post_id: mediaId,
        post_url: '',
        post_caption: '',
        user_id: instagramAccountId
      }))
      
      autoresponderType = 'general'
      console.log('🔄 Convertidos a formato estándar:', commentAutoresponders.length)
    }
  }

  // Si no encontró nada Y hay original_media_id, buscar por original_media_id
  if ((!commentAutoresponders || commentAutoresponders.length === 0) && originalMediaId) {
    console.log('🔄 No encontrado por media_id, buscando por original_media_id:', originalMediaId)
    
    const { data: autorespondersByOriginalId, error: originalIdError } = await supabase
      .from('comment_autoresponders')
      .select('*')
      .eq('is_active', true)
      .eq('post_id', originalMediaId)

    if (originalIdError) {
      console.error('❌ Error buscando por original_media_id:', originalIdError)
      searchError = originalIdError
    } else {
      commentAutoresponders = autorespondersByOriginalId || []
      if (commentAutoresponders.length > 0) {
        autoresponderType = 'specific'
        console.log('🔍 Autoresponders específicos encontrados por original_media_id:', commentAutoresponders.length)
      }
    }
  }

  // PASO 2: NUEVO - Si no encuentra específicos, buscar GENERALES asignados a este post
  if ((!commentAutoresponders || commentAutoresponders.length === 0)) {
    console.log('🔄 ===== BUSCANDO AUTORESPONDERS GENERALES ASIGNADOS =====')
    console.log('🔍 Buscando autoresponders generales para media_id:', mediaId)
    
    // Buscar asignaciones activas para este post
    const { data: assignments, error: assignmentError } = await supabase
      .from('post_autoresponder_assignments')
      .select(`
        *,
        general_comment_autoresponders!inner(
          id,
          name,
          keywords,
          dm_message,
          public_reply_messages,
          use_buttons,
          buttons,
          is_active,
          use_button_message,
          button_text,
          button_url,
          button_type,
          postback_response,
          require_follower
        )
      `)
      .eq('is_active', true)
      .eq('post_id', mediaId)
      .eq('general_comment_autoresponders.is_active', true)

    if (assignmentError) {
      console.error('❌ Error buscando autoresponders generales por media_id:', assignmentError)
    } else if (assignments && assignments.length > 0) {
      console.log('✅ Encontrados', assignments.length, 'autoresponders generales asignados')
      
        // Convertir las asignaciones a formato compatible
        commentAutoresponders = assignments.map(assignment => ({
          ...assignment.general_comment_autoresponders,
          assignment_id: assignment.id,
          post_id: assignment.post_id,
          post_url: assignment.post_url,
          use_button_message: assignment.general_comment_autoresponders.use_button_message,
          button_text: assignment.general_comment_autoresponders.button_text,
          button_url: assignment.general_comment_autoresponders.button_url,
          button_type: assignment.general_comment_autoresponders.button_type,
          postback_response: assignment.general_comment_autoresponders.postback_response,
          require_follower: assignment.general_comment_autoresponders.require_follower
        }))
      autoresponderType = 'general'
    }

    // Si no encuentra por media_id, buscar también por original_media_id
    if ((!commentAutoresponders || commentAutoresponders.length === 0) && originalMediaId) {
      console.log('🔄 Buscando autoresponders generales por original_media_id:', originalMediaId)
      
      const { data: assignmentsByOriginal, error: assignmentOriginalError } = await supabase
        .from('post_autoresponder_assignments')
        .select(`
          *,
          general_comment_autoresponders!inner(
            id,
            name,
            keywords,
            dm_message,
            public_reply_messages,
            use_buttons,
            buttons,
            is_active,
            use_button_message,
            button_text,
            button_url,
            button_type,
            postback_response,
            require_follower
          )
        `)
        .eq('is_active', true)
        .eq('post_id', originalMediaId)
        .eq('general_comment_autoresponders.is_active', true)

      if (assignmentOriginalError) {
        console.error('❌ Error buscando autoresponders generales por original_media_id:', assignmentOriginalError)
      } else if (assignmentsByOriginal && assignmentsByOriginal.length > 0) {
        console.log('✅ Encontrados', assignmentsByOriginal.length, 'autoresponders generales por original_media_id')
        
        commentAutoresponders = assignmentsByOriginal.map(assignment => ({
          ...assignment.general_comment_autoresponders,
          assignment_id: assignment.id,
          post_id: assignment.post_id,
          post_url: assignment.post_url,
          use_button_message: assignment.general_comment_autoresponders.use_button_message,
          button_text: assignment.general_comment_autoresponders.button_text,
          button_url: assignment.general_comment_autoresponders.button_url,
          button_type: assignment.general_comment_autoresponders.button_type,
          postback_response: assignment.general_comment_autoresponders.postback_response,
          require_follower: assignment.general_comment_autoresponders.require_follower
        }))
        autoresponderType = 'general'
      }
    }
  }

  if (searchError && (!commentAutoresponders || commentAutoresponders.length === 0)) {
    console.error('❌ Error obteniendo autoresponders:', searchError)
    return
  }

  if (!commentAutoresponders || commentAutoresponders.length === 0) {
    console.log('❌ No hay autoresponders configurados para este post')
    console.log('💡 IDs buscados:')
    console.log('   - Media ID:', mediaId)
    if (originalMediaId) {
      console.log('   - Original Media ID:', originalMediaId)
    }
    console.log('💡 Verifica que haya autoresponders específicos O generales asignados para alguno de estos IDs')
    return
  }

  console.log('✅ Autoresponders encontrados:', commentAutoresponders.length)
  console.log('🎯 Tipo de autoresponder:', autoresponderType)

  let selectedAutoresponder = null

  // LÓGICA DE SELECCIÓN: Verificar si el comentario CONTIENE la palabra clave (case-insensitive)
  for (const autoresponder of commentAutoresponders) {
    const keywords = autoresponder.keywords || []
    
    console.log('🔍 Verificando autoresponder:', autoresponder.name)
    console.log('📝 Palabras clave configuradas:', keywords)
    console.log('💬 Comentario recibido:', commentText)
    
    if (keywords.length === 0) {
      console.log('✅ Autoresponder sin palabras clave específicas - SELECCIONADO')
      selectedAutoresponder = autoresponder
      break
    }

    let hasMatch = false
    let matchedKeyword = ''
    
    // Convertir comentario a minúsculas para comparación case-insensitive
    const commentTextLower = commentText.toLowerCase()
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      
      // CAMBIO PRINCIPAL: usar includes() en lugar de coincidencia exacta
      if (commentTextLower.includes(keywordLower)) {
        hasMatch = true
        matchedKeyword = keyword
        console.log('🎯 COINCIDENCIA ENCONTRADA!')
        console.log('   Palabra clave:', keyword)
        console.log('   En comentario:', commentText)
        console.log('   Método: includes() case-insensitive')
        break
      }
    }

    if (hasMatch) {
      console.log('✅ AUTORESPONDER SELECCIONADO:', autoresponder.name)
      console.log('🎯 Por palabra clave:', matchedKeyword)
      console.log('🏷️ Tipo:', autoresponderType)
      selectedAutoresponder = autoresponder
      break
    } else {
      console.log('❌ Sin coincidencias para este autoresponder')
    }
  }

  if (!selectedAutoresponder) {
    console.log('❌ No se encontró autoresponder que coincida con las palabras clave')
    console.log('💡 Verifica que las palabras clave estén configuradas correctamente')
    return
  }

  console.log('🎯 AUTORESPONDER SELECCIONADO:', selectedAutoresponder.name)
  console.log('🏷️ TIPO:', autoresponderType)

  console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM POR ENTRY ID =====')
  console.log('🆔 Instagram Account ID del entry:', instagramAccountId)

  const { data: instagramUser, error: userError } = await supabase
    .from('instagram_users')
    .select('*')
    .eq('instagram_user_id', instagramAccountId)
    .eq('is_active', true)
    .single()

  if (userError || !instagramUser) {
    console.error('❌ No se encontró usuario de Instagram con ID:', instagramAccountId, userError)
    
    console.log('🔄 Intentando fallback: buscar cualquier usuario activo...')
    const { data: fallbackUser, error: fallbackError } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (fallbackError || !fallbackUser) {
      console.error('❌ No se encontró ningún usuario de Instagram activo:', fallbackError)
      return
    }
    
    console.log('✅ Usuario fallback encontrado:', fallbackUser.username)
  }

  console.log('✅ Usuario encontrado:', instagramUser.username)
  console.log('🔑 Access Token (primeros 20 chars):', instagramUser.access_token ? instagramUser.access_token.substring(0, 20) + '...' : 'NO TOKEN')

  // VERIFICAR SI YA SE RESPONDIÓ A ESTE COMENTARIO
  console.log('🔍 ===== VERIFICANDO SI YA SE RESPONDIÓ A ESTE COMENTARIO =====')
  console.log('🆔 Comment ID a verificar:', commentId)
  console.log('👤 Commenter ID a verificar:', commenterId)
  
  // VERIFICACIÓN CORRECTA: incluir media_id para verificar por post específico
  const { data: existingResponse, error: logCheckError } = await supabase
    .from('comment_autoresponder_log')
    .select('*')
    .eq('commenter_instagram_id', commenterId)
    .eq('comment_text', commentText)
    .eq('webhook_data->>media_id', mediaId) // ✅ INCLUIR MEDIA ID para verificar post específico
    .gte('dm_sent_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Últimas 1 hora
    .limit(1)

  if (logCheckError) {
    console.error('❌ Error verificando log de comentarios:', logCheckError)
  } else if (existingResponse && existingResponse.length > 0) {
    console.log('⏭️ YA SE RESPONDIÓ A ESTE COMENTARIO ANTES - SALTANDO')
    console.log('📋 Log existente:', existingResponse[0])
    console.log('⏰ Respondido anteriormente el:', existingResponse[0].dm_sent_at)
    console.log('💬 Comentario idéntico ya procesado')
    return
  }
  
  console.log('✅ Comentario nuevo - procediendo a responder')
  console.log('🚀 ===== ENVIANDO AUTORESPONDER DE COMENTARIO =====')
  console.log('💡 Verificación completada - no hay respuestas previas a este comentario')

  const accessToken = instagramUser.access_token
  
  const publicReplyMessages = selectedAutoresponder.public_reply_messages || [
    "¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊"
  ]
  
  const randomIndex = Math.floor(Math.random() * publicReplyMessages.length)
  const publicReplyMessage = publicReplyMessages[randomIndex]
  
  console.log('🎲 MENSAJE PÚBLICO SELECCIONADO (aleatorio):', publicReplyMessage)
  console.log('🎯 Índice seleccionado:', randomIndex, 'de', publicReplyMessages.length, 'mensajes disponibles')
  
  let publicReplySuccess = false
  let publicReplyId = null
  let publicReplyError = null

  console.log('🔍 ===== VALIDACIONES PREVIAS =====')
  console.log('🔑 Access Token length:', accessToken ? accessToken.length : 'NO TOKEN')
  console.log('🔑 Access Token starts with:', accessToken ? accessToken.substring(0, 10) : 'NO TOKEN')
  console.log('💬 Comment ID:', commentId)
  console.log('💬 Comment ID type:', typeof commentId)
  console.log('💬 Message length:', publicReplyMessage.length)
  
  if (!accessToken) {
    console.log('❌ NO HAY ACCESS TOKEN - ABORTANDO')
    return
  }
  
  if (!commentId) {
    console.log('❌ NO HAY COMMENT ID - ABORTANDO')
    return
  }

  console.log('📢 INTENTANDO REPLY PÚBLICO al comentario:', commentId)

  try {
    const formData = new FormData()
    formData.append('message', publicReplyMessage)
    formData.append('access_token', accessToken)

    console.log('🎯 URL Reply Público:', `https://graph.instagram.com/${commentId}/replies`)
    console.log('💬 Mensaje Reply (aleatorio):', publicReplyMessage)
    console.log('🔑 Access Token presente:', accessToken ? 'SÍ' : 'NO')

    console.log('📋 FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${key === 'access_token' ? value.substring(0, 20) + '...' : value}`)
    }

    const publicReplyResponse = await fetch(`https://graph.instagram.com/${commentId}/replies`, {
      method: 'POST',
      body: formData,
    })

    console.log('📨 Status Code:', publicReplyResponse.status)
    console.log('📨 Status Text:', publicReplyResponse.statusText)

    const publicReplyData = await publicReplyResponse.json()
    console.log('📨 Respuesta Reply Público:', JSON.stringify(publicReplyData, null, 2))

    if (publicReplyData.error) {
      console.log('⚠️ Error en reply público:', publicReplyData.error)
      publicReplyError = publicReplyData.error
    } else {
      console.log('✅ REPLY PÚBLICO ENVIADO EXITOSAMENTE')
      console.log('🆔 Reply ID:', publicReplyData.id)
      publicReplySuccess = true
      publicReplyId = publicReplyData.id
    }

  } catch (publicException) {
    console.log('⚠️ Excepción en reply público:', publicException.message)
    publicReplyError = { message: publicException.message }
  }

  // VERIFICAR SI REQUIRE_FOLLOWER ESTÁ ACTIVADO
  console.log('🔍 ===== VERIFICANDO CONFIGURACIÓN REQUIRE_FOLLOWER =====')
  
  if (selectedAutoresponder.require_follower) {
    console.log('⚠️ REQUIRE_FOLLOWER está ACTIVADO - enviando mensaje aleatorio de confirmación')
    
    // Mensajes aleatorios de confirmación cuando require_follower está activado
    const confirmationMessages = [
      "Hola! 👋 Me da mucho gusto que hayas comentado. Solo tengo una pregunta rápida: ¿me sigues en Instagram? Si es así, responde 'sí' y te paso la info que necesitas 😊",
      "¡Hola! 😊 Gracias por comentar. Para poder ayudarte mejor, ¿podrías confirmar si me sigues? Solo responde 'sí' si ya me sigues y te envío lo que necesitas 💪",
      "¡Qué bueno verte por aquí! 🎉 Para asegurarme de enviarte la información correcta, ¿me confirmas si ya me sigues? Responde 'sí' si me sigues y te mando todo al instante ⚡",
      "¡Hola! 👋 Me encanta que hayas comentado. Una pregunta rápida: ¿ya me sigues en Instagram? Si es así, solo escribe 'sí' y te paso la info que estás buscando 🚀"
    ]
    
    const randomConfirmationMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)]
    console.log('🎲 Mensaje de confirmación seleccionado:', randomConfirmationMessage)
    
    // Guardar en pending_follower_confirmations
    const { data: pendingConfirmation, error: pendingError } = await supabase
      .from('pending_follower_confirmations')
      .insert({
        commenter_id: commenterId,
        commenter_username: commenterUsername,
        autoresponder_id: selectedAutoresponder.id,
        autoresponder_type: autoresponderType,
        original_comment_text: commentText,
        original_dm_message: selectedAutoresponder.dm_message,
        confirmation_message_sent: randomConfirmationMessage,
        use_button_message: selectedAutoresponder.use_button_message || false,
        button_text: selectedAutoresponder.button_text || null,
        button_url: selectedAutoresponder.button_url || null,
        button_type: selectedAutoresponder.button_type || null,
        postback_response: selectedAutoresponder.postback_response || null
      })
      .select()
      .single()
    
    if (pendingError) {
      console.error('❌ Error guardando confirmación pendiente:', pendingError)
    } else {
      console.log('✅ Confirmación pendiente guardada:', pendingConfirmation.id)
    }
    
    // Enviar mensaje aleatorio de confirmación en lugar del mensaje configurado
    try {
      const { data: replyResponse, error: replyError } = await supabase.functions.invoke('instagram-send-message', {
        body: {
          message_text: randomConfirmationMessage,
          instagram_user_id: instagramAccountId,
          comment_id: commentId,
          use_button: false,
          button_text: null,
          button_url: null
        }
      })

      if (replyError) {
        console.error('❌ Error enviando mensaje de confirmación:', replyError)
        
        const logData = {
          comment_autoresponder_id: autoresponderType === 'general' ? null : selectedAutoresponder.id,
          commenter_instagram_id: commenterId,
          comment_text: commentText,
          dm_message_sent: `ERROR enviando confirmación: ${replyError.message}`,
          webhook_data: {
            comment_id: commentId,
            media_id: mediaId,
            commenter_username: commenterUsername,
            autoresponder_type: autoresponderType,
            autoresponder_name: selectedAutoresponder.name,
            general_autoresponder_id: autoresponderType === 'general' ? selectedAutoresponder.id : null,
            require_follower_enabled: true,
            confirmation_message: randomConfirmationMessage,
            public_reply_attempted: true,
            public_reply_success: publicReplySuccess,
            public_reply_error: publicReplyError,
            public_reply_id: publicReplyId,
            public_reply_message: publicReplyMessage,
            processed_at: new Date().toISOString(),
            note: 'ERROR: No se pudo enviar mensaje de confirmación'
          }
        }
        
        await supabase.from('comment_autoresponder_log').insert(logData)
        return
      }

      console.log('✅ MENSAJE DE CONFIRMACIÓN ENVIADO EXITOSAMENTE')
      console.log('📨 Respuesta:', replyResponse)
      
      // Guardar log exitoso
      const logData = {
        comment_autoresponder_id: autoresponderType === 'general' ? null : selectedAutoresponder.id,
        commenter_instagram_id: commenterId,
        comment_text: commentText,
        dm_message_sent: randomConfirmationMessage,
        webhook_data: {
          comment_id: commentId,
          media_id: mediaId,
          commenter_username: commenterUsername,
          autoresponder_type: autoresponderType,
          autoresponder_name: selectedAutoresponder.name,
          general_autoresponder_id: autoresponderType === 'general' ? selectedAutoresponder.id : null,
          require_follower_enabled: true,
          confirmation_message: randomConfirmationMessage,
          confirmation_pending_id: pendingConfirmation?.id,
          public_reply_attempted: true,
          public_reply_success: publicReplySuccess,
          public_reply_error: publicReplyError,
          public_reply_id: publicReplyId,
          public_reply_message: publicReplyMessage,
          processed_at: new Date().toISOString(),
          note: 'Mensaje de confirmación enviado - esperando respuesta del prospecto'
        }
      }
      
      await supabase.from('comment_autoresponder_log').insert(logData)
      
      console.log('💡 === FLUJO REQUIRE_FOLLOWER ACTIVADO ===')
      console.log('📤 Se envió mensaje aleatorio de confirmación')
      console.log('⏳ Esperando respuesta afirmativa del prospecto para enviar mensaje real')
      
      // NO crear follow-ups para mensajes de confirmación
      console.log('ℹ️ No se crean follow-ups para mensajes de confirmación')
      
      return
      
    } catch (confirmationError) {
      console.error('💥 Excepción enviando confirmación:', confirmationError)
      return
    }
    
  } else {
    console.log('ℹ️ REQUIRE_FOLLOWER está DESACTIVADO - enviando mensaje configurado directamente')
  }

  console.log('🚀 ENVIANDO PRIVATE REPLY usando comment_id:', commentId)

  try {
    // Preparar datos del botón si está habilitado
    const messagePayload: any = {
      message_text: selectedAutoresponder.dm_message,
      instagram_user_id: instagramAccountId,
      comment_id: commentId,
      use_button: selectedAutoresponder.use_button_message || false
    }

    console.log('🔘 === VERIFICANDO CONFIGURACIÓN DE BOTONES ===')
    console.log('🔍 use_button_message:', selectedAutoresponder.use_button_message)
    console.log('🔍 button_text:', selectedAutoresponder.button_text)
    console.log('🔍 button_type:', selectedAutoresponder.button_type)
    console.log('🔍 button_url:', selectedAutoresponder.button_url)
    console.log('🔍 postback_response:', selectedAutoresponder.postback_response)

    // Solo agregar datos del botón si está habilitado y tiene los datos necesarios
    if (selectedAutoresponder.use_button_message) {
      if (!selectedAutoresponder.button_text) {
        console.log('⚠️ Botón sin texto - deshabilitando botón')
        messagePayload.use_button = false
      } else if (selectedAutoresponder.button_type === 'web_url') {
        if (selectedAutoresponder.button_url) {
          messagePayload.button_text = selectedAutoresponder.button_text
          messagePayload.button_url = selectedAutoresponder.button_url
          messagePayload.button_type = 'web_url'
        } else {
          console.log('⚠️ Botón web_url sin URL - deshabilitando botón')
          messagePayload.use_button = false
        }
      } else if (selectedAutoresponder.button_type === 'postback') {
        if (selectedAutoresponder.postback_response) {
          messagePayload.button_text = selectedAutoresponder.button_text
          messagePayload.postback_payload = `${selectedAutoresponder.id}_postback`
          messagePayload.button_type = 'postback'
          console.log('📤 Configurando botón postback:', {
            button_text: selectedAutoresponder.button_text,
            postback_payload: `${selectedAutoresponder.id}_postback`,
            button_type: 'postback'
          })
        } else {
          console.log('⚠️ Botón postback sin payload - deshabilitando botón')
          messagePayload.use_button = false
        }
      } else {
        console.log('⚠️ Tipo de botón no válido - deshabilitando botón')
        messagePayload.use_button = false
      }
    }

    console.log('📤 Payload del mensaje:', JSON.stringify(messagePayload, null, 2))

    const { data: replyResponse, error: replyError } = await supabase.functions.invoke('instagram-send-message', {
      body: messagePayload
    })

    if (replyError) {
      console.error('❌ Error enviando private reply:', replyError)
      
      // Guardar log según el tipo de autoresponder
      const logTable = autoresponderType === 'general' ? 'comment_autoresponder_log' : 'comment_autoresponder_log'
      const logData = {
        comment_autoresponder_id: autoresponderType === 'general' ? null : selectedAutoresponder.id,
        commenter_instagram_id: commenterId,
        comment_text: commentText,
        dm_message_sent: `ERROR: ${replyError.message}`,
        webhook_data: {
          comment_id: commentId,
          media_id: mediaId,
          commenter_username: commenterUsername,
          error_type: 'private_reply_failed',
          autoresponder_type: autoresponderType,
          autoresponder_name: selectedAutoresponder.name,
          general_autoresponder_id: autoresponderType === 'general' ? selectedAutoresponder.id : null,
          assignment_id: autoresponderType === 'general' ? selectedAutoresponder.assignment_id : null,
          public_reply_attempted: true,
          public_reply_success: publicReplySuccess,
          public_reply_error: publicReplyError,
          public_reply_id: publicReplyId,
          public_reply_message: publicReplyMessage,
          public_reply_message_index: randomIndex,
          total_public_messages: publicReplyMessages.length,
          processed_at: new Date().toISOString(),
          note: 'AUTORESPONDERS DE COMENTARIOS: NO verifican conversaciones previas - SIEMPRE envían'
        }
      }
      
      await supabase.from(logTable).insert(logData)
      return
    }

    console.log('✅ PRIVATE REPLY ENVIADO EXITOSAMENTE')
    console.log('📨 Respuesta:', JSON.stringify(replyResponse, null, 2))

    // Guardar log según el tipo de autoresponder
    const logTable = 'comment_autoresponder_log'
    const logData = {
      comment_autoresponder_id: autoresponderType === 'general' ? null : selectedAutoresponder.id,
      commenter_instagram_id: commenterId,
      comment_text: commentText,
      dm_message_sent: selectedAutoresponder.dm_message,
      webhook_data: {
        comment_id: commentId,
        media_id: mediaId,
        commenter_username: commenterUsername,
        private_reply_success: true,
        message_id: replyResponse?.message_id,
        recipient_id: replyResponse?.recipient_id,
        autoresponder_type: autoresponderType,
        autoresponder_name: selectedAutoresponder.name,
        general_autoresponder_id: autoresponderType === 'general' ? selectedAutoresponder.id : null,
        assignment_id: autoresponderType === 'general' ? selectedAutoresponder.assignment_id : null,
        public_reply_attempted: true,
        public_reply_success: publicReplySuccess,
        public_reply_error: publicReplyError,
        public_reply_id: publicReplyId,
        public_reply_message: publicReplyMessage,
        public_reply_message_index: randomIndex,
        total_public_messages: publicReplyMessages.length,
        processed_at: new Date().toISOString(),
        note: 'AUTORESPONDERS DE COMENTARIOS: NO verifican conversaciones previas - SIEMPRE envían'
      }
    }

    await supabase.from(logTable).insert(logData)

    // CREAR FOLLOW-UPS PARA COMMENT AUTORESPONDERS
    console.log('📅 ===== CREANDO FOLLOW-UPS PARA COMMENT AUTORESPONDER =====')
    await createCommentFollowUps(selectedAutoresponder.id, commenterId, autoresponderType)

    if (publicReplySuccess) {
      console.log('🎉 PROCESAMIENTO COMPLETO: Reply público Y private reply enviados')
      console.log('🎲 Mensaje público usado (índice', randomIndex + '):', publicReplyMessage)
      console.log('🏷️ Tipo de autoresponder:', autoresponderType)
      console.log('💡 IMPORTANTE: Los autoresponders de comentarios SIEMPRE se envían, sin verificar conversaciones previas')
    } else {
      console.log('⚠️ PROCESAMIENTO PARCIAL: Solo private reply enviado (public reply falló)')
      console.log('🏷️ Tipo de autoresponder:', autoresponderType)
      console.log('💡 IMPORTANTE: Los autoresponders de comentarios SIEMPRE se envían, sin verificar conversaciones previas')
    }

  } catch (replyException) {
    console.error('💥 Excepción enviando private reply:', replyException)
    
    // Guardar log de excepción
    const logTable = 'comment_autoresponder_log'
    const logData = {
      comment_autoresponder_id: autoresponderType === 'general' ? null : selectedAutoresponder.id,
      commenter_instagram_id: commenterId,
      comment_text: commentText,
      dm_message_sent: `EXCEPTION: ${replyException.message}`,
      webhook_data: {
        comment_id: commentId,
        media_id: mediaId,
        commenter_username: commenterUsername,
        error_type: 'reply_exception',
        autoresponder_type: autoresponderType,
        autoresponder_name: selectedAutoresponder.name,
        general_autoresponder_id: autoresponderType === 'general' ? selectedAutoresponder.id : null,
        assignment_id: autoresponderType === 'general' ? selectedAutoresponder.assignment_id : null,
        public_reply_attempted: true,
        public_reply_success: publicReplySuccess,
        public_reply_error: publicReplyError,
        public_reply_id: publicReplyId,
        public_reply_message: publicReplyMessage,
        public_reply_message_index: randomIndex,
        total_public_messages: publicReplyMessages.length,
        processed_at: new Date().toISOString(),
        note: 'AUTORESPONDERS DE COMENTARIOS: NO verifican conversaciones previas - SIEMPRE envían'
      }
    }
    
    await supabase.from(logTable).insert(logData)
  }

  console.log('✅ === COMENTARIO PROCESADO COMPLETAMENTE ===')
  console.log('💡 === AUTORESPONDERS DE COMENTARIOS FUNCIONAN SIN RESTRICCIONES ===')
  console.log('🏷️ === TIPO PROCESADO:', autoresponderType, '===')
}
