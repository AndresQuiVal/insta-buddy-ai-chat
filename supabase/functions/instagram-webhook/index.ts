
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

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN')

      if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          console.log('WEBHOOK_VERIFIED')
          return new Response(challenge, { status: 200 })
        } else {
          return new Response('Forbidden', { status: 403 })
        }
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 WEBHOOK RECIBIDO:', JSON.stringify(body, null, 2))

      if (body.object === 'instagram') {
        for (const entry of body.entry) {
          // Manejar mensajes directos
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              // Manejar postback de botones
              if (messagingEvent.postback) {
                await handlePostback(messagingEvent, supabase)
              }
              // Manejar mensajes entrantes
              else if (messagingEvent.message) {
                await handleIncomingMessage(messagingEvent, supabase)
              }
            }
          }

          // Manejar comentarios
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'comments' && change.value.verb === 'add') {
                await handleComment(change.value, supabase)
              }
            }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('❌ Error en webhook:', error)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})

async function handlePostback(messagingEvent: any, supabase: any) {
  console.log('🔘 POSTBACK RECIBIDO:', JSON.stringify(messagingEvent, null, 2))
  
  const senderId = messagingEvent.sender.id
  const payload = messagingEvent.postback.payload
  
  try {
    // Buscar la acción configurada para este payload
    const { data: action, error } = await supabase
      .from('button_postback_actions')
      .select('*')
      .eq('payload_key', payload)
      .single()
    
    if (error || !action) {
      console.log('❌ No se encontró acción para payload:', payload)
      return
    }
    
    console.log('✅ Acción encontrada:', action)
    
    if (action.action_type === 'message' && action.action_data?.message) {
      // Enviar mensaje automático
      await sendInstagramMessage(senderId, action.action_data.message, action.user_id)
    } else if (action.action_type === 'url_redirect' && action.action_data?.url) {
      // Para redirección de URL, enviamos un mensaje con la URL
      const message = `👋 Te redirijo a: ${action.action_data.url}`
      await sendInstagramMessage(senderId, message, action.user_id)
    }
    
  } catch (error) {
    console.error('❌ Error manejando postback:', error)
  }
}

async function handleIncomingMessage(messagingEvent: any, supabase: any) {
  const senderId = messagingEvent.sender.id
  const recipientId = messagingEvent.recipient.id
  const messageText = messagingEvent.message.text?.toLowerCase() || ''
  
  console.log('📬 MENSAJE RECIBIDO de:', senderId, 'texto:', messageText)

  try {
    // Buscar autoresponders activos para este usuario de Instagram
    const { data: autoresponders, error } = await supabase
      .from('autoresponder_messages')
      .select('*')
      .eq('instagram_user_id_ref', recipientId)
      .eq('is_active', true)

    if (error) {
      console.error('❌ Error buscando autoresponders:', error)
      return
    }

    for (const autoresponder of autoresponders || []) {
      let shouldRespond = true

      // Verificar palabras clave si están configuradas
      if (autoresponder.use_keywords && autoresponder.keywords) {
        shouldRespond = autoresponder.keywords.some((keyword: string) => 
          messageText.includes(keyword.toLowerCase())
        )
      }

      // Verificar si solo debe enviar el primer mensaje
      if (shouldRespond && autoresponder.send_only_first_message) {
        const { data: sentLog } = await supabase
          .from('autoresponder_sent_log')
          .select('id')
          .eq('autoresponder_message_id', autoresponder.id)
          .eq('sender_id', senderId)
          .limit(1)

        if (sentLog && sentLog.length > 0) {
          shouldRespond = false
        }
      }

      if (shouldRespond) {
        console.log('✅ Enviando autorespuesta:', autoresponder.name)
        
        // Enviar mensaje (con o sin botones)
        if (autoresponder.use_buttons && autoresponder.buttons) {
          await sendInstagramMessageWithButtons(
            senderId, 
            autoresponder.message_text, 
            autoresponder.buttons,
            recipientId
          )
        } else {
          await sendInstagramMessage(senderId, autoresponder.message_text, recipientId)
        }

        // Registrar envío
        await supabase
          .from('autoresponder_sent_log')
          .insert({
            autoresponder_message_id: autoresponder.id,
            sender_id: senderId
          })
        
        break // Solo responder con el primer autoresponder que coincida
      }
    }
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error)
  }
}

async function handleComment(commentData: any, supabase: any) {
  console.log('💬 COMENTARIO RECIBIDO:', JSON.stringify(commentData, null, 2))
  
  const commentText = commentData.text?.toLowerCase() || ''
  const commenterId = commentData.from.id
  const postId = commentData.media?.id || commentData.post_id

  try {
    // Primero buscar autoresponders específicos del post
    let { data: autoresponders, error } = await supabase
      .from('comment_autoresponders')
      .select('*')
      .eq('post_id', postId)
      .eq('is_active', true)

    // Si no hay autoresponders específicos, buscar generales asignados a este post
    if (!autoresponders || autoresponders.length === 0) {
      const { data: assignments } = await supabase
        .from('post_autoresponder_assignments')
        .select(`
          general_autoresponder_id,
          general_comment_autoresponders!inner(*)
        `)
        .eq('post_id', postId)
        .eq('is_active', true)
        .eq('general_comment_autoresponders.is_active', true)

      if (assignments && assignments.length > 0) {
        autoresponders = assignments.map(a => a.general_comment_autoresponders)
      }
    }

    if (error) {
      console.error('❌ Error buscando autoresponders de comentarios:', error)
      return
    }

    for (const autoresponder of autoresponders || []) {
      // Verificar si el comentario contiene alguna palabra clave
      const hasKeyword = autoresponder.keywords.some((keyword: string) =>
        commentText.includes(keyword.toLowerCase())
      )

      if (hasKeyword) {
        console.log('✅ Keyword encontrada, enviando DM:', autoresponder.name)
        
        // Enviar DM (con o sin botones)
        if (autoresponder.use_buttons && autoresponder.buttons) {
          await sendInstagramMessageWithButtons(
            commenterId,
            autoresponder.dm_message,
            autoresponder.buttons,
            autoresponder.user_id
          )
        } else {
          await sendInstagramMessage(commenterId, autoresponder.dm_message, autoresponder.user_id)
        }

        // Respuesta pública opcional
        if (autoresponder.public_reply_messages && autoresponder.public_reply_messages.length > 0) {
          const randomReply = autoresponder.public_reply_messages[
            Math.floor(Math.random() * autoresponder.public_reply_messages.length)
          ]
          await replyToComment(commentData.id, randomReply, autoresponder.user_id)
        }

        // Registrar el log
        await supabase
          .from('comment_autoresponder_log')
          .insert({
            comment_autoresponder_id: autoresponder.id,
            commenter_instagram_id: commenterId,
            comment_text: commentData.text,
            dm_message_sent: autoresponder.dm_message,
            webhook_data: commentData
          })

        break
      }
    }
  } catch (error) {
    console.error('❌ Error procesando comentario:', error)
  }
}

async function sendInstagramMessage(recipientId: string, message: string, userId: string) {
  try {
    const { data, error } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    ).functions.invoke('instagram-send-message', {
      body: {
        recipientId,
        message,
        userId
      }
    })

    if (error) throw error
    console.log('✅ Mensaje enviado correctamente')
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error)
  }
}

async function sendInstagramMessageWithButtons(recipientId: string, message: string, buttons: any[], userId: string) {
  try {
    const { data, error } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    ).functions.invoke('instagram-send-message', {
      body: {
        recipientId,
        message,
        buttons,
        userId
      }
    })

    if (error) throw error
    console.log('✅ Mensaje con botones enviado correctamente')
  } catch (error) {
    console.error('❌ Error enviando mensaje con botones:', error)
  }
}

async function replyToComment(commentId: string, message: string, userId: string) {
  console.log('💬 Respondiendo a comentario:', commentId, 'con mensaje:', message)
  // La implementación de respuesta a comentarios se puede agregar aquí si es necesaria
}
