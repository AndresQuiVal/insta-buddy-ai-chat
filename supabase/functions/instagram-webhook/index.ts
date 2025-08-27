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

    if (!body.entry || !Array.isArray(body.entry)) {
      console.log('❌ No hay entries en el webhook')
      return new Response(
        JSON.stringify({ message: 'No entries found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ FUNCIÓN: Procesar mensajes enviados manualmente por el usuario
    async function processSentMessage(messagingEvent: any, supabase: any, source: string, instagramAccountId: string) {
      console.log('📤 ===== PROCESANDO MENSAJE ENVIADO MANUALMENTE =====')
      console.log(`📝 Mensaje desde ${source}:`, JSON.stringify(messagingEvent, null, 2))
      
      const senderId = messagingEvent.sender?.id
      const recipientId = messagingEvent.recipient?.id
      const messageText = messagingEvent.message?.text
      
      // Procesar timestamp
      let timestamp: string
      if (messagingEvent.timestamp) {
        timestamp = new Date(messagingEvent.timestamp).toISOString()
      } else {
        timestamp = new Date().toISOString()
      }
      
      console.log(`📤 MENSAJE ENVIADO MANUALMENTE POR USUARIO:`)
      console.log(`👤 De: ${senderId} → Para: ${recipientId}`)
      console.log(`💬 Texto: "${messageText}"`)
      console.log(`🕐 Timestamp: ${timestamp}`)
      
      // Buscar el registro del usuario de Instagram
      const { data: instagramUser, error: userError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', senderId)
        .eq('is_active', true)
        .single()

      if (userError || !instagramUser) {
        console.log('❌ No se encontró usuario activo para sender_id:', senderId)
        return
      }

      console.log('✅ Usuario encontrado:', instagramUser.username)

      // Guardar mensaje enviado manualmente en la base de datos
      const messageData = {
        instagram_user_id: instagramUser.id,
        instagram_message_id: messagingEvent.message?.mid || `sent_${Date.now()}_${recipientId}`,
        sender_id: senderId,
        recipient_id: recipientId,
        message_text: messageText || '',
        message_type: 'sent', // 🔥 IMPORTANTE: Es un mensaje ENVIADO
        timestamp: timestamp,
        raw_data: {
          ...messagingEvent,
          webhook_source: 'manual_sent',
          processed_at: new Date().toISOString()
        }
      }

      console.log('💾 Guardando mensaje enviado manualmente:', messageData)

      const { error: insertError } = await supabase
        .from('instagram_messages')
        .insert(messageData)

      if (insertError) {
        console.error('❌ Error guardando mensaje enviado:', insertError)
      } else {
        console.log('✅ Mensaje enviado guardado correctamente en BD')
        
        // 🔥 CRÍTICO: Sincronizar estado de tarea del prospecto
        try {
          console.log('🔄 Ejecutando sync_prospect_task_status para marcar como completado...')
          const { error: syncError } = await supabase.rpc('sync_prospect_task_status', {
            p_instagram_user_id: senderId, // El que ENVÍA es el usuario
            p_prospect_sender_id: recipientId, // El que RECIBE es el prospecto
            p_last_message_type: 'sent'
          })
          
          if (syncError) {
            console.error('❌ Error en sync_prospect_task_status:', syncError)
          } else {
            console.log('✅ Prospecto marcado como COMPLETADO exitosamente')
          }
        } catch (error) {
          console.error('❌ Error ejecutando sync_prospect_task_status:', error)
        }
        
        // Actualizar actividad del prospecto
        try {
          const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
            p_prospect_id: recipientId // El prospecto es quien RECIBE el mensaje
          })
          
          if (activityError) {
            console.error('❌ Error actualizando actividad del prospecto:', activityError)
          } else {
            console.log('✅ Actividad del prospecto actualizada')
          }
        } catch (error) {
          console.error('❌ Error en RPC update_prospect_activity:', error)
        }

        // 🔥 NUEVO: Actualizar timestamp del último mensaje del dueño
        try {
          const { error: timestampError } = await supabase.rpc('update_prospect_owner_message_timestamp', {
            p_instagram_user_id: instagramUser.id,
            p_prospect_instagram_id: recipientId,
            p_is_from_owner: true
          })
          
          if (timestampError) {
            console.error('❌ Error actualizando timestamp del dueño:', timestampError)
          } else {
            console.log('✅ Timestamp del último mensaje del dueño actualizado')
          }
        } catch (error) {
          console.error('❌ Error en RPC update_prospect_owner_message_timestamp:', error)
        }
      }
    }

    // Procesar cada entry
    for (const entry of body.entry) {
      console.log('🔄 ===== PROCESANDO ENTRY =====')
      console.log('📋 Entry completo:', JSON.stringify(entry, null, 2))
      console.log('📋 Entry ID:', entry.id)
      console.log('📋 Entry keys:', Object.keys(entry))

      // 🔥 PROCESAR COMENTARIOS ANTES QUE MENSAJES
      if (entry.changes && Array.isArray(entry.changes)) {
        console.log('📝 PROCESANDO COMENTARIOS EN POSTS')
        console.log('  - Número de cambios:', entry.changes.length)

        for (const change of entry.changes) {
          console.log('📋 Change completo:', JSON.stringify(change, null, 2))
          
          if (change.field === 'comments' && change.value) {
            console.log('💬 === PROCESANDO COMENTARIO ===')
            const commentData = change.value
            
            const commenterId = commentData.from?.id
            const commenterUsername = commentData.from?.username
            const commentText = commentData.text
            const postId = commentData.media?.id
            
            console.log(`👤 Comentario de: ${commenterUsername} (${commenterId})`)
            console.log(`📝 Texto: "${commentText}"`)
            console.log(`📱 Post ID: ${postId}`)
            
            if (!commenterId || !commentText) {
              console.log('⚠️ Datos incompletos del comentario')
              continue
            }

            // Buscar autoresponders de comentarios
            let autoresponderEncontrado = null
            
            // 1. Buscar autoresponder específico para este post
            const { data: postAutoresponders } = await supabase
              .from('comment_autoresponders')
              .select('*')
              .eq('post_id', postId)
              .eq('is_active', true)
            
            if (postAutoresponders && postAutoresponders.length > 0) {
              console.log(`🎯 Encontrados ${postAutoresponders.length} autoresponders para este post`)
              
              for (const ar of postAutoresponders) {
                const textLower = commentText.toLowerCase()
                const hasMatch = ar.keywords.some((keyword: string) => {
                  const match = textLower.includes(keyword.toLowerCase().trim())
                  console.log(`   "${keyword}" -> ${match ? '✅' : '❌'}`)
                  return match
                })
                
                if (hasMatch) {
                  autoresponderEncontrado = ar
                  console.log(`🎯 ¡Autoresponder específico activado: "${ar.name}"!`)
                  break
                }
              }
            }
            
            // 2. Si no hay match específico, buscar autoresponders generales
            if (!autoresponderEncontrado) {
              const { data: generalAutoresponders } = await supabase
                .from('general_comment_autoresponders')
                .select('*')
                .eq('user_id', entry.id) // entry.id es el instagram_user_id
                .eq('is_active', true)
              
              if (generalAutoresponders && generalAutoresponders.length > 0) {
                console.log(`🌐 Encontrados ${generalAutoresponders.length} autoresponders generales`)
                
                for (const ar of generalAutoresponders) {
                  // Si auto_assign_to_all_posts es true, no necesita keywords
                  if (ar.auto_assign_to_all_posts) {
                    // Si tiene keywords, verificar coincidencia
                    if (ar.keywords && ar.keywords.length > 0) {
                      const textLower = commentText.toLowerCase()
                      const hasMatch = ar.keywords.some((keyword: string) => {
                        const match = textLower.includes(keyword.toLowerCase().trim())
                        console.log(`   "${keyword}" -> ${match ? '✅' : '❌'}`)
                        return match
                      })
                      
                      if (hasMatch) {
                        autoresponderEncontrado = ar
                        console.log(`🌐 ¡Autoresponder general activado: "${ar.name}"!`)
                        break
                      }
                    } else {
                      // Sin keywords = responde a todos los comentarios
                      autoresponderEncontrado = ar
                      console.log(`🌐 ¡Autoresponder general sin keywords activado: "${ar.name}"!`)
                      break
                    }
                  }
                }
              }
            }
            
            // 3. Verificar si ya se respondió a este comentario antes de enviar
            if (autoresponderEncontrado) {
              console.log(`🚀 Verificando si ya se respondió a este comentario...`)
              
              // ✅ VERIFICAR DUPLICACIÓN: Buscar si ya existe una respuesta a este comentario
              const { data: existingResponse, error: logCheckError } = await supabase
                .from('comment_autoresponder_log')
                .select('id')
                .eq('commenter_instagram_id', commenterId)
                .eq('comment_autoresponder_id', autoresponderEncontrado.ic || autoresponderEncontrado.id)
                .eq('comment_text', commentText)
                .limit(1)
              
              if (logCheckError) {
                console.error('❌ Error verificando duplicación:', logCheckError)
              }
              
              if (existingResponse && existingResponse.length > 0) {
                console.log('⚠️ YA SE RESPONDIÓ A ESTE COMENTARIO ANTERIORMENTE - Saltando para evitar duplicación')
                continue // Saltar este comentario para evitar respuesta duplicada
              }
              
              console.log(`✅ Es la primera respuesta a este comentario - Enviando DM automático`)
              
              try {
                // 🔥 ENVIAR RESPUESTA PÚBLICA AL COMENTARIO PRIMERO
                if (autoresponderEncontrado.public_reply_messages && autoresponderEncontrado.public_reply_messages.length > 0) {
                  console.log('💬 Enviando respuesta pública al comentario...')
                  
                  // Seleccionar respuesta aleatoria
                  const respuestaPublica = autoresponderEncontrado.public_reply_messages[
                    Math.floor(Math.random() * autoresponderEncontrado.public_reply_messages.length)
                  ]
                  
                  console.log(`📝 Respuesta pública seleccionada: "${respuestaPublica}"`)
                  
                  // Enviar respuesta pública (reply al comentario)
                  const publicReplyUrl = `https://graph.instagram.com/${commentData.id}/replies`
                  const publicReplyBody = new URLSearchParams({
                    message: respuestaPublica
                  })
                  
                  // Obtener token del usuario
                  const { data: userToken } = await supabase
                    .from('instagram_users')
                    .select('access_token')
                    .eq('instagram_user_id', entry.id)
                    .single()
                  
                  if (userToken?.access_token) {
                    const publicResponse = await fetch(publicReplyUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${userToken.access_token}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                      },
                      body: publicReplyBody
                    })
                    
                    if (publicResponse.ok) {
                      console.log('✅ Respuesta pública enviada exitosamente')
                    } else {
                      const errorData = await publicResponse.json()
                      console.error('❌ Error enviando respuesta pública:', errorData)
                    }
                  }
                }
                
                // 🔥 LUEGO ENVIAR DM PRIVADO
                const { data: sendResult, error: sendError } = await supabase.functions.invoke('instagram-send-message', {
                  body: {
                    instagram_user_id: entry.id,
                    recipient_id: commenterId,
                    message_text: autoresponderEncontrado.dm_message,
                    comment_id: commentData.id,
                    use_button: autoresponderEncontrado.use_buttons || false,
                    button_text: autoresponderEncontrado.button_text || null,
                    button_url: autoresponderEncontrado.button_url || null,
                    button_type: autoresponderEncontrado.button_type || 'web_url'
                  }
                })
                
                if (sendError) {
                  console.error('❌ Error enviando DM por comentario:', sendError)
                } else {
                  console.log('✅ DM por comentario enviado exitosamente')
                  
                  // ✅ REGISTRAR EN LOG PARA EVITAR DUPLICACIONES FUTURAS
                  const { error: logError } = await supabase
                    .from('comment_autoresponder_log')
                    .insert({
                      comment_autoresponder_id: autoresponderEncontrado.id,
                      commenter_instagram_id: commenterId,
                      comment_text: commentText,
                      dm_message_sent: autoresponderEncontrado.dm_message,
                      webhook_data: commentData
                    })
                  
                  if (logError) {
                    console.error('❌ Error registrando log de comentario:', logError)
                  }
                }
              } catch (sendError) {
                console.error('❌ Error enviando DM por comentario:', sendError)
              }
            } else {
              console.log('🔍 No se encontraron autoresponders que coincidan con el comentario')
            }
          }
        }
      }

      // Procesar mensajes
      if (entry.messaging && Array.isArray(entry.messaging)) {
        console.log('📝 PROCESANDO MENSAJES DIRECTOS (FORMATO PRODUCCIÓN)')
        console.log('  - ¿Tiene messaging?', !!entry.messaging)

        for (const messagingEvent of entry.messaging) {
          console.log('🚨 LLAMANDO A processMessage...')
          console.log('📋 Mensaje completo:', JSON.stringify(messagingEvent, null, 2))
          console.log('👤 SENDER ID:', messagingEvent.sender?.id)
          console.log('🎯 RECIPIENT ID:', messagingEvent.recipient?.id)

          // Verificar si es un evento de "read" y saltar si es así
          if (messagingEvent.read) {
            console.log('📖 Es un evento de lectura - saltando procesamiento')
            continue
          }

          console.log('🔍 DEBUGGING - Analizando tipo de evento:')
          console.log('🔘 ¿Tiene postback directo?', !!messagingEvent.postback)
          console.log('🔘 ¿Tiene postback en message?', !!messagingEvent.message?.postback)
          console.log('🔘 ¿Tiene texto?', !!messagingEvent.message?.text)
          console.log('📝 Texto del mensaje:', messagingEvent.message?.text)
          console.log('🔍 ¿Contiene _postback?', messagingEvent.message?.text?.includes('_postback'))
          
          console.log('🔍 ANÁLISIS CRÍTICO ANTES DE PROCESAR:')
          console.log('  - ¿Tiene changes?', !!entry.changes)

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

          console.log('🕐 TIMESTAMP ORIGINAL:', messagingEvent.timestamp)
          console.log('🕐 TIMESTAMP PROCESADO:', timestamp)
          console.log('⏰ TIMESTAMP FINAL:', timestamp)
          console.log('🆔 MESSAGE ID:', messagingEvent.message?.mid)
          console.log('💬 MENSAJE:', messagingEvent.message?.text)
          console.log('🔔 ES ECHO:', !!messagingEvent.message?.is_echo)

          // 🔥 LÓGICA CRÍTICA: Detectar si es un mensaje ENVIADO por el usuario (echo)
          if (messagingEvent.message?.is_echo) {
            console.log('📤 ES UN MENSAJE ECHO (enviado por el usuario) - PROCESANDO...')
            console.log(`👤 ENVIADO POR: ${messagingEvent.sender?.id} HACIA: ${messagingEvent.recipient?.id}`)
            console.log(`💬 MENSAJE: ${messagingEvent.message?.text}`)
            
            // Procesar como mensaje enviado manualmente
            await processSentMessage(messagingEvent, supabase, 'webhook_echo', entry.id)
            continue // Saltar el procesamiento normal
          }

          console.log('🚀 === PROCESANDO MENSAJE ===')
          
          // Procesar mensaje recibido (no echo)
          const senderId = messagingEvent.sender?.id
          const recipientId = messagingEvent.recipient?.id
          
          if (!senderId || !recipientId) {
            console.log('❌ Missing sender or recipient ID')
            continue
          }

          // Extraer texto del mensaje (con soporte para attachments)
          let messageText = messagingEvent.message?.text || ''
          
          // 🔥 MANEJO DE ATTACHMENTS: Si no hay texto pero hay attachments
          if (!messageText && messagingEvent.message?.attachments?.length > 0) {
            const attachments = messagingEvent.message.attachments
            console.log(`🔗 Mensaje con attachments (${attachments.length}):`, attachments)
            
            const attachmentTypes = attachments.map((att: any) => att.type).join(', ')
            messageText = `[${attachmentTypes}]` // Placeholder para attachments
            
            // Log específico para cada tipo de attachment
            for (const attachment of attachments) {
              if (attachment.type === 'ig_reel') {
                console.log(`🎬 Instagram Reel recibido:`, attachment.payload)
              } else if (attachment.type === 'image') {
                console.log(`🖼️ Imagen recibida:`, attachment.payload)
              } else {
                console.log(`📎 Attachment tipo '${attachment.type}':`, attachment.payload)
              }
            }
          }
          
          console.log(`💬 TEXTO FINAL DEL MENSAJE: "${messageText}"`)
          
          // Buscar usuario de Instagram en nuestra base de datos
          const { data: instagramUser, error: userError } = await supabase
            .from('instagram_users')
            .select('*')
            .eq('instagram_user_id', recipientId)
            .eq('is_active', true)
            .single()

          if (userError || !instagramUser) {
            console.log(`❌ Usuario no encontrado para recipient_id: ${recipientId}`)
            continue
          }

          console.log(`✅ Usuario encontrado: ${instagramUser.username}`)

          // 🏗️ PASO 1: CREAR/ACTUALIZAR PROSPECTO EN TABLA ESPECÍFICA
          let prospectId: string | null = null;
          let prospectUsername = `user_${senderId.slice(-8)}`; // Username por defecto
          
          try {
            // 🔍 PRIORIDAD 1: Buscar username en mensaje existente si ya existe el prospecto
            const { data: existingProspect } = await supabase
              .from('prospects')
              .select('username')
              .eq('instagram_user_id', instagramUser.id)
              .eq('prospect_instagram_id', senderId)
              .maybeSingle();
            
            if (existingProspect?.username && !existingProspect.username.startsWith('user_')) {
              prospectUsername = existingProspect.username;
              console.log(`✅ Username encontrado en BD existente: ${prospectUsername}`);
            } else {
              // 🔍 PRIORIDAD 2: Intentar obtener desde raw_data del webhook actual
              if (messagingEvent.sender?.username) {
                prospectUsername = messagingEvent.sender.username;
                console.log(`✅ Username obtenido del webhook sender: ${prospectUsername}`);
              } else {
                // 🔍 PRIORIDAD 3: Intentar obtener username del sender desde Instagram API
                try {
                  console.log(`🔗 Intentando API de Instagram para ${senderId}...`);
                  
                  // Verificar que el token no haya expirado
                  if (instagramUser.token_expires_at) {
                    const tokenExpiry = new Date(instagramUser.token_expires_at);
                    if (tokenExpiry < new Date()) {
                      console.log('⚠️ Token de Instagram expirado, saltando API call');
                      throw new Error('Token expirado');
                    }
                  }
                  
                  const instagramApiUrl = `https://graph.instagram.com/${senderId}?fields=username,name&access_token=${instagramUser.access_token}`;
                  const apiResponse = await fetch(instagramApiUrl, {
                    headers: {
                      'User-Agent': 'Hower-Instagram-Bot/1.0'
                    }
                  });
                  
                  console.log(`📊 API Instagram response status: ${apiResponse.status}`);
                  
                  if (apiResponse.ok) {
                    const userData = await apiResponse.json();
                    console.log(`📝 API Instagram response:`, userData);
                    
                    if (userData.username) {
                      prospectUsername = userData.username;
                      console.log(`✅ Username obtenido de Instagram API: ${prospectUsername}`);
                    } else {
                      console.log('⚠️ API response no contiene username');
                    }
                  } else {
                    const errorText = await apiResponse.text();
                    console.log(`❌ Error API Instagram (${apiResponse.status}): ${errorText}`);
                  }
                } catch (apiError) {
                  console.log('⚠️ No se pudo obtener username de Instagram API:', apiError);
                }
              }
            }

            // Crear/actualizar prospecto usando la función de BD
            const { data: createdProspectId, error: prospectError } = await supabase
              .rpc('create_or_update_prospect', {
                p_instagram_user_id: instagramUser.id,
                p_prospect_instagram_id: senderId,
                p_username: prospectUsername,
                p_profile_picture_url: null
              });

            if (prospectError) {
              console.error('❌ Error creando/actualizando prospecto:', prospectError);
            } else {
              prospectId = createdProspectId;
              console.log(`✅ Prospecto creado/actualizado con ID: ${prospectId}`);
            }

          } catch (prospectError) {
            console.error('❌ Error en proceso de prospecto:', prospectError);
          }

          // 💬 PASO 2: AGREGAR MENSAJE DEL PROSPECTO (si se pudo crear el prospecto)
          if (prospectId) {
            try {
              const { error: messageError } = await supabase
                .rpc('add_prospect_message', {
                  p_prospect_id: prospectId,
                  p_message_instagram_id: messagingEvent.message?.mid || `received_${Date.now()}_${senderId}`,
                  p_message_text: messageText,
                  p_is_from_prospect: true,
                  p_message_timestamp: timestamp,
                  p_message_type: 'text',
                  p_raw_data: {
                    ...messagingEvent,
                    webhook_source: 'messaging',
                    processed_at: new Date().toISOString()
                  }
                });

              if (messageError) {
                console.error('❌ Error agregando mensaje del prospecto:', messageError);
              } else {
                console.log('✅ Mensaje del prospecto agregado correctamente');
              }

            } catch (messageError) {
              console.error('❌ Error en add_prospect_message:', messageError);
            }
          }

          // 📊 PASO 3: MANTENER COMPATIBILIDAD - Guardar en instagram_messages
          const messageData = {
            instagram_user_id: instagramUser.id,
            instagram_message_id: messagingEvent.message?.mid || `received_${Date.now()}_${senderId}`,
            sender_id: senderId,
            recipient_id: recipientId,
            message_text: messageText,
            message_type: 'received',
            timestamp: timestamp,
            raw_data: {
              ...messagingEvent,
              webhook_source: 'messaging',
              processed_at: new Date().toISOString()
            }
          }

          console.log('💾 Guardando mensaje en instagram_messages (compatibilidad):', messageData)

          const { error: insertError } = await supabase
            .from('instagram_messages')
            .insert(messageData)

          if (insertError) {
            console.error('❌ Error guardando mensaje en instagram_messages:', insertError)
          } else {
            console.log('✅ Mensaje guardado correctamente en instagram_messages')
            
            // 📊 REGISTRAR RESPUESTA DIARIA ÚNICA DEL PROSPECTO
            try {
              const { error: responseError } = await supabase.rpc('register_daily_prospect_response', {
                p_instagram_user_id: recipientId, // Usuario que recibe (tu cuenta)
                p_prospect_sender_id: senderId    // El prospecto que envía la respuesta
              })
              
              if (responseError) {
                console.error('❌ Error registrando respuesta diaria del prospecto:', responseError)
              } else {
                console.log('✅ Respuesta diaria del prospecto registrada correctamente')
              }
            } catch (error) {
              console.error('❌ Error en RPC register_daily_prospect_response:', error)
            }
            
            // Actualizar actividad del prospecto
            try {
              const { error: activityError } = await supabase.rpc('update_prospect_activity', { 
                p_prospect_id: senderId // El prospecto es quien ENVÍA el mensaje
              })
              
              if (activityError) {
                console.error('❌ Error actualizando actividad del prospecto:', activityError)
              } else {
                console.log('✅ Actividad del prospecto actualizada')
              }
            } catch (error) {
              console.error('❌ Error en RPC update_prospect_activity:', error)
            }

            // 🔥 NUEVO: Limpiar timestamp del último mensaje del dueño (el prospecto respondió)
            try {
              const { error: timestampError } = await supabase.rpc('update_prospect_owner_message_timestamp', {
                p_instagram_user_id: instagramUser.id,
                p_prospect_instagram_id: senderId,
                p_is_from_owner: false // El prospecto respondió, limpiar timestamp del dueño
              })
              
              if (timestampError) {
                console.error('❌ Error limpiando timestamp del dueño:', timestampError)
              } else {
                console.log('✅ Timestamp del último mensaje del dueño limpiado (prospecto respondió)')
              }
            } catch (error) {
              console.error('❌ Error en RPC update_prospect_owner_message_timestamp (limpiar):', error)
            }

            // 🎯 SINCRONIZAR ESTADO DE TAREA - MENSAJE RECIBIDO = DESTACHADO
            try {
              const { error: syncError } = await supabase.rpc('sync_prospect_task_status', {
                p_instagram_user_id: recipientId, // El usuario que recibe (tu cuenta)
                p_prospect_sender_id: senderId,   // El prospecto que envía
                p_last_message_type: 'received'   // Mensaje recibido = destachado
              })
              
              if (syncError) {
                console.error('❌ Error sincronizando estado de tarea (recibido):', syncError)
              } else {
                console.log('✅ Estado de tarea sincronizado (recibido) - prospecto DESTACHADO')
              }
            } catch (error) {
              console.error('❌ Error en RPC sync_prospect_task_status (recibido):', error)
            }

            // 🤖 LÓGICA DE AUTORESPONDERS - VERIFICAR Y ENVIAR RESPUESTA AUTOMÁTICA
            console.log('🤖 === VERIFICANDO AUTORESPONDERS ===')
            try {
              // Consultar autoresponders activos del usuario
              const { data: autoresponders, error: arError } = await supabase
                .from('autoresponder_messages')
                .select('*')
                .eq('instagram_user_id_ref', recipientId)
                .eq('is_active', true)
              
              if (arError) {
                console.error('❌ Error consultando autoresponders:', arError)
              } else if (!autoresponders || autoresponders.length === 0) {
                console.log('⚠️ No hay autoresponders activos configurados para este usuario')
              } else {
                console.log(`🔍 Encontrados ${autoresponders.length} autoresponders activos`)
                
                // Buscar coincidencias con keywords
                let autoresponderActivado = null
                for (const autoresponder of autoresponders) {
                  console.log(`🔎 Verificando autoresponder: "${autoresponder.name}"`)
                  
                  // Si no tiene keywords configuradas, saltar
                  if (!autoresponder.keywords || autoresponder.keywords.length === 0) {
                    console.log(`⚠️ Autoresponder "${autoresponder.name}" no tiene keywords configuradas`)
                    continue
                  }
                  
                  // Verificar keywords
                  const messageTextLower = messageText.toLowerCase()
                  console.log(`📝 Texto del mensaje (lowercase): "${messageTextLower}"`)
                  console.log(`🏷️ Keywords: [${autoresponder.keywords.join(', ')}]`)
                  
                  const hasMatch = autoresponder.keywords.some((keyword: string) => {
                    const keywordLower = keyword.toLowerCase().trim()
                    const match = messageTextLower.includes(keywordLower)
                    console.log(`   "${keywordLower}" -> ${match ? '✅ MATCH' : '❌ NO MATCH'}`)
                    return match
                  })
                  
                  if (hasMatch) {
                    autoresponderActivado = autoresponder
                    console.log(`🎯 ¡AUTORESPONDER ACTIVADO: "${autoresponder.name}"!`)
                    break
                  }
                }
                
                // Si encontramos un autoresponder que coincide, enviar respuesta
                if (autoresponderActivado) {
                  console.log(`🚀 Enviando respuesta automática: "${autoresponderActivado.name}"`)
                  
                  // Verificar si ya se envió este autoresponder a este usuario (send_only_first_message)
                  let debeEnviar = true
                  if (autoresponderActivado.send_only_first_message) {
                    const { data: yaEnviado } = await supabase
                      .from('autoresponder_sent_log')
                      .select('id')
                      .eq('autoresponder_message_id', autoresponderActivado.id)
                      .eq('sender_id', senderId)
                      .limit(1)
                    
                    if (yaEnviado && yaEnviado.length > 0) {
                      debeEnviar = false
                      console.log('⚠️ Autoresponder ya fue enviado anteriormente a este usuario (send_only_first_message=true)')
                    }
                  }
                  
                  if (debeEnviar) {
                    // Enviar mensaje automático
                    try {
                      const { data: sendResult, error: sendError } = await supabase.functions.invoke('instagram-send-message', {
                        body: {
                          instagram_user_id: recipientId,
                          recipient_id: senderId,
                          message_text: autoresponderActivado.message_text,
                          autoresponder_id: autoresponderActivado.id,
                          use_button: autoresponderActivado.use_buttons || false,
                          button_text: autoresponderActivado.button_text || null,
                          button_url: autoresponderActivado.button_url || null,
                          button_type: autoresponderActivado.button_type || 'web_url'
                        }
                      })
                      
                      if (sendError) {
                        console.error('❌ Error enviando autoresponder:', sendError)
                      } else {
                        console.log('✅ Autoresponder enviado exitosamente')
                        
                        // Registrar el envío en el log
                        const { error: logError } = await supabase
                          .from('autoresponder_sent_log')
                          .insert({
                            autoresponder_message_id: autoresponderActivado.id,
                            sender_id: senderId,
                            sent_at: new Date().toISOString()
                          })
                        
                        if (logError) {
                          console.error('❌ Error registrando envío en log:', logError)
                        } else {
                          console.log('✅ Envío registrado en log')
                        }
                      }
                    } catch (sendError) {
                      console.error('❌ Error en función instagram-send-message:', sendError)
                    }
                  }
                } else {
                  console.log('🔍 No se encontraron coincidencias de keywords')
                }
              }
            } catch (autoresponderError) {
              console.error('❌ Error en lógica de autoresponders:', autoresponderError)
            }
          }
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