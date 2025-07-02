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

    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        console.log('🔄 ===== PROCESANDO ENTRY =====')
        console.log('📋 Entry ID:', entry.id)
        console.log('📋 Entry completo:', JSON.stringify(entry, null, 2))
        console.log('📋 Entry keys:', Object.keys(entry))

        // FORMATO DE PRODUCCIÓN: entry.messaging
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log('📝 PROCESANDO MENSAJES DIRECTOS (FORMATO PRODUCCIÓN)')
          
          for (const messagingEvent of entry.messaging) {
            await processMessage(messagingEvent, supabase, 'messaging', entry.id)
          }
        }
        // FORMATO DE PRODUCCIÓN ALTERNATIVO: entry.changes
        else if (entry.changes && Array.isArray(entry.changes)) {
          console.log('🔄 PROCESANDO CAMBIOS (FORMATO PRODUCCIÓN)')
          
          for (const change of entry.changes) {
            console.log('📋 Change:', JSON.stringify(change, null, 2))
            
            // PROCESAR MENSAJES DIRECTOS
            if (change.field === 'messages' && change.value) {
              const messagingEvent = {
                sender: change.value.sender,
                recipient: change.value.recipient,
                timestamp: change.value.timestamp,
                message: change.value.message
              }
              
              await processMessage(messagingEvent, supabase, 'changes', entry.id)
            }
            // 🆕 PROCESAR COMENTARIOS
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

async function processMessage(messagingEvent: any, supabase: any, source: string, instagramAccountId: string) {
  console.log(`📝 Procesando mensaje desde ${source}:`, JSON.stringify(messagingEvent, null, 2))
  
  const senderId = messagingEvent.sender?.id
  const recipientId = messagingEvent.recipient?.id
  const messageText = messagingEvent.message?.text
  const timestamp = messagingEvent.timestamp ? new Date(parseInt(messagingEvent.timestamp) * 1000).toISOString() : new Date().toISOString()
  const messageId = messagingEvent.message?.mid || `msg_${Date.now()}_${Math.random()}`
  const isEcho = messagingEvent.message?.is_echo === true

  console.log('🚀 === PROCESANDO MENSAJE ===')
  console.log('👤 SENDER ID:', senderId)
  console.log('🎯 RECIPIENT ID:', recipientId)
  console.log('💬 MENSAJE:', messageText)
  console.log('🔔 ES ECHO:', isEcho)
  console.log('⏰ TIMESTAMP:', timestamp)
  console.log('🆔 MESSAGE ID:', messageId)

  if (!senderId || !recipientId || !messageText) {
    console.log('❌ Datos insuficientes para procesar mensaje')
    return
  }

  if (isEcho) {
    console.log('⏭️ Es un echo - saltando')
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

  console.log('🔍 === OBTENIENDO AUTORESPONDERS DEL USUARIO ESPECÍFICO ===')
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
      instagram_user_id: recipientId
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

  console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===')
}

async function processComment(commentData: any, supabase: any, instagramAccountId: string) {
  console.log('💬 ===== PROCESANDO COMENTARIO =====')
  console.log('📋 Datos del comentario:', JSON.stringify(commentData, null, 2))

  const commenterId = commentData.from?.id
  const commenterUsername = commentData.from?.username
  const commentText = commentData.text
  const mediaId = commentData.media?.id
  const commentId = commentData.id

  console.log('👤 COMMENTER ID:', commenterId)
  console.log('👤 COMMENTER USERNAME:', commenterUsername)
  console.log('💬 COMMENT TEXT:', commentText)
  console.log('📱 MEDIA ID:', mediaId)
  console.log('🆔 COMMENT ID:', commentId)

  if (!commenterId || !commentText || !mediaId || !commentId) {
    console.log('❌ Datos insuficientes para procesar comentario')
    return
  }

  // ===== BUSCAR AUTORESPONDER DE COMENTARIOS QUE COINCIDA =====
  console.log('🔍 ===== BUSCANDO AUTORESPONDER DE COMENTARIOS =====')

  const { data: commentAutoresponders, error: autoresponderError } = await supabase
    .from('comment_autoresponders')
    .select('*')
    .eq('is_active', true)
    .eq('post_id', mediaId)

  if (autoresponderError) {
    console.error('❌ Error obteniendo comment autoresponders:', autoresponderError)
    return
  }

  if (!commentAutoresponders || commentAutoresponders.length === 0) {
    console.log('❌ No hay autoresponders de comentarios configurados para este post')
    return
  }

  console.log('✅ Autoresponders encontrados:', commentAutoresponders.length)

  // Buscar coincidencia con palabras clave
  let selectedAutoresponder = null

  for (const autoresponder of commentAutoresponders) {
    const keywords = autoresponder.keywords || []
    
    // Si no tiene keywords, se aplica a todos los comentarios del post
    if (keywords.length === 0) {
      selectedAutoresponder = autoresponder
      break
    }

    // Verificar coincidencia con keywords
    let hasMatch = false
    for (const keyword of keywords) {
      if (commentText.toLowerCase().includes(keyword.toLowerCase())) {
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

  console.log('🎯 AUTORESPONDER DE COMENTARIO SELECCIONADO:', selectedAutoresponder.name)

  // ===== BUSCAR USUARIO DE INSTAGRAM ACTIVO USANDO INSTAGRAM_USER_ID DEL ENTRY =====
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
    
    // Fallback: buscar cualquier usuario activo
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
    // Usar el usuario fallback
    instagramUser = fallbackUser
  }

  console.log('✅ Usuario encontrado:', instagramUser.username)
  console.log('🔑 Access Token (primeros 20 chars):', instagramUser.access_token ? instagramUser.access_token.substring(0, 20) + '...' : 'NO TOKEN')

  // ===== AUTORESPONDERS DE COMENTARIOS SIEMPRE SE ENVÍAN =====
  // NO verificamos conversaciones previas para autoresponders de comentarios
  console.log('🚀 ===== AUTORESPONDERS DE COMENTARIOS: SIEMPRE ENVIAR =====')
  console.log('💡 Los autoresponders de comentarios NO verifican conversaciones previas')
  console.log('💡 Se enviarán SIEMPRE que coincidan las palabras clave del post configurado')

  const accessToken = instagramUser.access_token
  
  // ===== SELECCIONAR MENSAJE PÚBLICO ALEATORIO =====
  const publicReplyMessages = selectedAutoresponder.public_reply_messages || [
    "¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊"
  ]
  
  // Seleccionar mensaje aleatorio
  const randomIndex = Math.floor(Math.random() * publicReplyMessages.length)
  const publicReplyMessage = publicReplyMessages[randomIndex]
  
  console.log('🎲 MENSAJE PÚBLICO SELECCIONADO (aleatorio):', publicReplyMessage)
  console.log('🎯 Índice seleccionado:', randomIndex, 'de', publicReplyMessages.length, 'mensajes disponibles')
  
  // Variables para tracking
  let publicReplySuccess = false
  let publicReplyId = null
  let publicReplyError = null

  // ===== VALIDACIONES PREVIAS =====
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

  // ===== ENVIAR REPLY PÚBLICO CON MENSAJE ALEATORIO =====
  console.log('📢 INTENTANDO REPLY PÚBLICO al comentario:', commentId)

  try {
    const formData = new FormData()
    formData.append('message', publicReplyMessage)
    formData.append('access_token', accessToken)

    console.log('🎯 URL Reply Público:', `https://graph.instagram.com/${commentId}/replies`)
    console.log('💬 Mensaje Reply (aleatorio):', publicReplyMessage)
    console.log('🔑 Access Token presente:', accessToken ? 'SÍ' : 'NO')

    // Debug: mostrar el contenido del FormData
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

  // ===== ENVIAR PRIVATE REPLY USANDO COMMENT_ID =====
  console.log('🚀 ENVIANDO PRIVATE REPLY usando comment_id:', commentId)

  try {
    const { data: replyResponse, error: replyError } = await supabase.functions.invoke('instagram-send-message', {
      body: {
        message_text: selectedAutoresponder.dm_message,
        instagram_user_id: instagramAccountId,
        comment_id: commentId
      }
    })

    if (replyError) {
      console.error('❌ Error enviando private reply:', replyError)
      
      // Registrar el error
      await supabase
        .from('comment_autoresponder_log')
        .insert({
          comment_autoresponder_id: selectedAutoresponder.id,
          commenter_instagram_id: commenterId,
          comment_text: commentText,
          dm_message_sent: `ERROR: ${replyError.message}`,
          webhook_data: {
            comment_id: commentId,
            media_id: mediaId,
            commenter_username: commenterUsername,
            error_type: 'private_reply_failed',
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
        })
      
      return
    }

    console.log('✅ PRIVATE REPLY ENVIADO EXITOSAMENTE')
    console.log('📨 Respuesta:', JSON.stringify(replyResponse, null, 2))

    // ===== REGISTRAR EN LOG =====
    await supabase
      .from('comment_autoresponder_log')
      .insert({
        comment_autoresponder_id: selectedAutoresponder.id,
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
      })

    // Log de resumen
    if (publicReplySuccess) {
      console.log('🎉 PROCESAMIENTO COMPLETO: Reply público Y private reply enviados')
      console.log('🎲 Mensaje público usado (índice', randomIndex + '):', publicReplyMessage)
      console.log('💡 IMPORTANTE: Los autoresponders de comentarios SIEMPRE se envían, sin verificar conversaciones previas')
    } else {
      console.log('⚠️ PROCESAMIENTO PARCIAL: Solo private reply enviado (public reply falló)')
      console.log('💡 IMPORTANTE: Los autoresponders de comentarios SIEMPRE se envían, sin verificar conversaciones previas')
    }

  } catch (replyException) {
    console.error('💥 Excepción enviando private reply:', replyException)
    
    // Registrar la excepción
    await supabase
      .from('comment_autoresponder_log')
      .insert({
        comment_autoresponder_id: selectedAutoresponder.id,
        commenter_instagram_id: commenterId,
        comment_text: commentText,
        dm_message_sent: `EXCEPTION: ${replyException.message}`,
        webhook_data: {
          comment_id: commentId,
          media_id: mediaId,
          commenter_username: commenterUsername,
          error_type: 'reply_exception',
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
      })
  }

  console.log('✅ === COMENTARIO PROCESADO COMPLETAMENTE ===')
  console.log('💡 === AUTORESPONDERS DE COMENTARIOS FUNCIONAN SIN RESTRICCIONES ===')
}
