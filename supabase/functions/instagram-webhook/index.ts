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
            await processMessage(messagingEvent, supabase, 'messaging')
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
              
              await processMessage(messagingEvent, supabase, 'changes')
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

async function processMessage(messagingEvent: any, supabase: any, source: string) {
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

  console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM =====')

  const { data: instagramUser, error: userError } = await supabase
    .from('instagram_users')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (userError || !instagramUser) {
    console.error('❌ No se encontró ningún usuario de Instagram activo:', userError)
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

  console.log('🔍 === OBTENIENDO AUTORESPONDERS ===')
  
  const { data: autoresponderResponse, error: autoresponderError } = await supabase.functions.invoke('get-autoresponders', {})

  if (autoresponderError || !autoresponderResponse?.success) {
    console.error('❌ Error obteniendo autoresponders:', autoresponderError)
    return
  }

  const autoresponders = autoresponderResponse.autoresponders || []
  console.log('✅ Autoresponders obtenidos:', autoresponders.length)

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
    console.log('❌ No se encontró autoresponder que coincida')
    return
  }

  console.log('🎯 AUTORESPONDER SELECCIONADO:', selectedAutoresponder.name)

  const { data: alreadySent } = await supabase
    .from('autoresponder_sent_log')
    .select('*')
    .eq('sender_id', senderId)
    .eq('autoresponder_message_id', selectedAutoresponder.id)

  if (selectedAutoresponder.send_only_first_message && alreadySent && alreadySent.length > 0) {
    console.log('⏭️ Ya se envió este autoresponder - saltando')
    return
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

  await supabase
    .from('autoresponder_sent_log')
    .insert({
      autoresponder_message_id: selectedAutoresponder.id,
      sender_id: senderId,
      sent_at: new Date().toISOString()
    })

  try {
    await supabase.rpc('add_prospect_message', {
      p_prospect_id: prospectId,
      p_message_instagram_id: data?.message_id || `auto_${Date.now()}`,
      p_message_text: selectedAutoresponder.message_text,
      p_is_from_prospect: false,
      p_message_timestamp: new Date().toISOString(),
      p_message_type: 'autoresponder',
      p_raw_data: { autoresponder_id: selectedAutoresponder.id, sent_via: 'webhook' }
    })
    console.log('✅ Autoresponder guardado en prospect_messages')
  } catch (autoMsgError) {
    console.error('⚠️ Error guardando autoresponder en prospect_messages:', autoMsgError)
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

  // ===== BUSCAR USUARIO DE INSTAGRAM ACTIVO =====
  const { data: instagramUser, error: userError } = await supabase
    .from('instagram_users')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (userError || !instagramUser) {
    console.error('❌ No se encontró usuario de Instagram activo:', userError)
    return
  }

  console.log('✅ Usuario encontrado:', instagramUser.username)

  // ===== VERIFICAR SI YA SE ENVIÓ RESPUESTA A ESTE COMENTARIO =====
  const { data: alreadySent } = await supabase
    .from('comment_autoresponder_log')
    .select('*')
    .eq('commenter_instagram_id', commenterId)
    .eq('comment_autoresponder_id', selectedAutoresponder.id)

  if (alreadySent && alreadySent.length > 0) {
    console.log('⏭️ Ya se envió respuesta a este usuario para este autoresponder - saltando')
    return
  }

  const accessToken = instagramUser.access_token
  const publicReplyMessage = "¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊"
  
  // Variables para tracking
  let publicReplySuccess = false
  let publicReplyId = null
  let publicReplyError = null

  // ===== 🆕 INTENTAR ENVIAR REPLY PÚBLICO AL COMENTARIO =====
  console.log('📢 INTENTANDO REPLY PÚBLICO al comentario:', commentId)

  try {
    console.log('🎯 URL Reply Público:', `https://graph.instagram.com/${commentId}/replies`)
    console.log('💬 Mensaje Reply:', publicReplyMessage)

    const publicReplyResponse = await fetch(`https://graph.instagram.com/${commentId}/replies?message=${encodeURIComponent(publicReplyMessage)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const publicReplyData = await publicReplyResponse.json()
    console.log('📨 Respuesta Reply Público:', JSON.stringify(publicReplyData, null, 2))

    if (publicReplyData.error) {
      console.log('⚠️ No se pudo enviar reply público (permisos insuficientes):', publicReplyData.error.message)
      publicReplyError = publicReplyData.error
    } else {
      console.log('✅ REPLY PÚBLICO ENVIADO EXITOSAMENTE')
      console.log('🆔 Reply ID:', publicReplyData.id)
      publicReplySuccess = true
      publicReplyId = publicReplyData.id
    }

  } catch (publicException) {
    console.log('⚠️ Excepción en reply público (continuando con private reply):', publicException.message)
    publicReplyError = { message: publicException.message }
  }

  // ===== ENVIAR PRIVATE REPLY USANDO COMMENT_ID (SIEMPRE INTENTAR) =====
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
      
      // Registrar el error (incluyendo info del public reply)
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
            processed_at: new Date().toISOString()
          }
        })
      
      return
    }

    console.log('✅ PRIVATE REPLY ENVIADO EXITOSAMENTE')
    console.log('📨 Respuesta:', JSON.stringify(replyResponse, null, 2))

    // ===== REGISTRAR EN LOG (ÉXITO COMPLETO O PARCIAL) =====
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
          processed_at: new Date().toISOString()
        }
      })

    // Log de resumen
    if (publicReplySuccess) {
      console.log('🎉 PROCESAMIENTO COMPLETO: Reply público Y private reply enviados')
    } else {
      console.log('⚠️ PROCESAMIENTO PARCIAL: Solo private reply enviado (public reply falló por permisos)')
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
          processed_at: new Date().toISOString()
        }
      })
  }

  console.log('✅ === COMENTARIO PROCESADO COMPLETAMENTE ===')
}
