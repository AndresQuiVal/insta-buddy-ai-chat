import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: MessagingEvent[];
  changes?: ChangeEvent[];
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
    attachments?: any[];
    is_echo?: boolean;
  };
}

interface ChangeEvent {
  field: string;
  value: {
    from: { id: string };
    item: string;
    created_time: number;
    verb: string;
    comment_id?: string;
    media?: {
      id: string;
      media_product_type: string;
    };
    text?: string;
    parent_id?: string;
    messaging?: MessagingEvent[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificación del webhook
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('🔍 Webhook verification:', { mode, token, challenge })

      const verifyToken = Deno.env.get('INSTAGRAM_VERIFY_TOKEN')
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verified successfully')
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        })
      } else {
        console.log('❌ Webhook verification failed')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        })
      }
    }

    // Procesar webhooks POST
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 ===== NUEVO WEBHOOK RECIBIDO =====')
      console.log('📋 Webhook completo:', JSON.stringify(body, null, 2))

      // Inicializar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      if (body.object === 'instagram') {
        for (const entry of body.entry as WebhookEntry[]) {
          console.log(`🔄 ===== PROCESANDO ENTRY =====`)
          console.log(`📋 Entry ID: ${entry.id}`)

          // Procesar mensajes directos
          if (entry.messaging) {
            console.log('📝 PROCESANDO MENSAJES DIRECTOS')
            for (const event of entry.messaging) {
              console.log('📝 Processing messaging event:', JSON.stringify(event, null, 2))
              await processMessagingEvent(supabase, event)
            }
          }

          // Procesar cambios (incluyendo comentarios)
          if (entry.changes) {
            console.log('🔄 PROCESANDO CAMBIOS (CHANGES)')
            console.log(`📊 Total de changes: ${entry.changes.length}`)
            
            for (const change of entry.changes) {
              console.log('🔄 ===== PROCESANDO CHANGE =====')
              console.log('📋 Change field:', change.field)
              console.log('📋 Change completo:', JSON.stringify(change, null, 2))
              
              // Procesar comentarios según la documentación oficial
              if (change.field === 'comments') {
                console.log('💬 ===== ES UN COMENTARIO! =====')
                console.log('💬 Comentario completo:', JSON.stringify(change, null, 2))
                await processCommentEvent(supabase, change)
              } else {
                console.log(`⏭️ Change field "${change.field}" no es comentario - saltando`)
              }
              
              // Procesar mensajes en changes
              if (change.field === 'messages' && change.value.messaging) {
                console.log('📝 PROCESANDO MENSAJES EN CHANGES')
                for (const event of change.value.messaging) {
                  console.log('📝 Processing change messaging event:', JSON.stringify(event, null, 2))
                  await processMessagingEvent(supabase, event)
                }
              }
            }
          } else {
            console.log('❌ No hay changes en este entry')
          }
        }
      } else {
        console.log(`⚠️ Object "${body.object}" no es instagram - saltando`)
      }

      return new Response(JSON.stringify({ status: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})

async function processMessagingEvent(supabase: any, event: MessagingEvent) {
  console.log('🚀 === PROCESANDO MENSAJE PARA AUTORESPONDER ===')
  console.log('👤 SENDER ID:', event.sender.id)
  console.log('💬 MENSAJE:', event.message?.text)

  try {
    // PASO 0: Actualizar actividad del prospecto en BD
    try {
      const { error: activityError } = await supabase.rpc('update_prospect_activity', {
        p_prospect_id: event.sender.id
      });
      
      if (activityError) {
        console.error('⚠️ Error actualizando actividad:', activityError);
      } else {
        console.log('✅ Actividad del prospecto actualizada');
      }
    } catch (error) {
      console.error('⚠️ Error en actualización de actividad:', error);
    }

    // PASO 1: Verificar que no sea un echo y que tenga texto
    if (!event.message?.text || event.message?.is_echo) {
      console.log('⏭️ Mensaje no válido o es un echo - saltando')
      return
    }

    // PASO 1.5: ENCONTRAR EL USUARIO DE INSTAGRAM CORRECTO
    console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM =====')
    console.log('📋 Recipient ID (Instagram Business Account):', event.recipient.id)
    
    // CAMBIO CRÍTICO: Buscar SOLO por instagram_user_id que debe coincidir con recipient.id
    const { data: instagramUser, error: userError } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('instagram_user_id', event.recipient.id)
      .single()

    if (userError || !instagramUser) {
      console.error('❌ No se encontró usuario de Instagram para recipient ID:', event.recipient.id)
      console.error('Error:', userError)
      
      // Buscar en todos los usuarios para debug
      const { data: allUsers } = await supabase
        .from('instagram_users')
        .select('*')
      
      console.log('📊 Todos los usuarios en BD:', allUsers)
      console.log('🔍 Buscando match para recipient:', event.recipient.id)
      
      return
    }

    console.log('✅ Usuario encontrado:', instagramUser)

    // ✅ NUEVO: Crear o actualizar prospecto en BD
    let prospectId = null;
    try {
      const { data: newProspectId, error: prospectError } = await supabase
        .rpc('create_or_update_prospect', {
          p_instagram_user_id: instagramUser.id,
          p_prospect_instagram_id: event.sender.id,
          p_username: `Usuario ${event.sender.id.slice(-4)}`, // Nombre temporal
          p_profile_picture_url: null
        });

      if (prospectError) {
        console.error('⚠️ Error creando/actualizando prospecto:', prospectError);
      } else {
        prospectId = newProspectId;
        console.log('✅ Prospecto creado/actualizado:', prospectId);
      }
    } catch (error) {
      console.error('⚠️ Error en manejo de prospecto:', error);
    }

    // ✅ NUEVO: Guardar mensaje del prospecto en BD
    if (prospectId) {
      try {
        const { error: messageError } = await supabase
          .rpc('add_prospect_message', {
            p_prospect_id: prospectId,
            p_message_instagram_id: event.message.mid,
            p_message_text: event.message.text,
            p_is_from_prospect: true,
            p_message_timestamp: new Date(event.timestamp).toISOString(),
            p_message_type: 'text',
            p_raw_data: event
          });

        if (messageError) {
          console.error('⚠️ Error guardando mensaje del prospecto:', messageError);
        } else {
          console.log('✅ Mensaje del prospecto guardado en BD');
        }
      } catch (error) {
        console.error('⚠️ Error en guardado de mensaje:', error);
      }
    }

    // PASO 2: DETECTAR TIPO DE MENSAJE
    const messageText = event.message.text.toLowerCase()
    const isInvitation = detectInvitation(messageText)
    const isPresentation = detectPresentation(messageText)
    const isInscription = detectInscription(messageText)
    
    console.log('🔍 ===== ANÁLISIS DEL MENSAJE =====')
    console.log('📝 Texto:', event.message.text)
    console.log('🔗 Es invitación:', isInvitation)
    console.log('📊 Es presentación:', isPresentation)
    console.log('📝 Es inscripción:', isInscription)

    // PASO 3: Guardar el mensaje recibido en BD
    const messageData = {
      instagram_message_id: event.message.mid,
      sender_id: event.sender.id,
      recipient_id: event.recipient.id,
      message_text: event.message.text,
      message_type: 'received',
      timestamp: new Date(event.timestamp).toISOString(),
      is_read: false,
      is_invitation: isInvitation,
      is_presentation: isPresentation,
      is_inscription: isInscription,
      instagram_user_id: instagramUser.id, // ✅ RELACIÓN CORRECTA
      raw_data: {
        webhook_data: event,
        received_at: new Date().toISOString(),
        source: 'instagram_webhook',
        detected_types: {
          invitation: isInvitation,
          presentation: isPresentation,
          inscription: isInscription
        }
      }
    }

    // Verificar duplicados por mensaje ID
    const { data: existingMessage } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', event.message.mid)
      .maybeSingle()

    if (existingMessage) {
      console.log('⏭️ Mensaje duplicado - saltando')
      return
    }

    const { error: insertError } = await supabase.from('instagram_messages').insert(messageData)
    if (insertError) {
      console.error('❌ Error guardando mensaje:', insertError)
      return
    } else {
      console.log('✅ Mensaje guardado correctamente con relación al usuario')
      console.log('📊 Tipos detectados guardados:', { isInvitation, isPresentation, isInscription })
    }

    // ✅ NUEVO: FORZAR ACTUALIZACIÓN DEL DASHBOARD
    console.log('🔄 ===== NOTIFICANDO CAMBIOS AL DASHBOARD =====')
    
    // Emitir evento personalizado para notificar cambios
    try {
      const { error: notifyError } = await supabase
        .channel('dashboard-updates')
        .send({
          type: 'broadcast',
          event: 'message_received',
          payload: {
            user_id: instagramUser.instagram_user_id,
            message_type: 'received',
            is_invitation: isInvitation,
            is_presentation: isPresentation,
            is_inscription: isInscription,
            timestamp: new Date().toISOString()
          }
        })
      
      if (notifyError) {
        console.error('⚠️ Error notificando cambios:', notifyError)
      } else {
        console.log('✅ Cambios notificados al dashboard')
      }
    } catch (error) {
      console.error('⚠️ Error en notificación:', error)
    }

    // PASO 4: OBTENER AUTORESPONDERS DESDE NUESTRO ENDPOINT
    console.log('🔍 === OBTENIENDO AUTORESPONDERS ===')
    
    let autoresponders = [];
    try {
      console.log('📡 Consultando autoresponders desde endpoint...')
      
      const { data: autoresponderData, error: autoresponderError } = await supabase.functions.invoke('get-autoresponders', {
        body: {}
      });
      
      if (autoresponderError) {
        console.error('❌ Error obteniendo autoresponders:', autoresponderError);
        return;
      }
      
      console.log('📊 Respuesta del endpoint:', JSON.stringify(autoresponderData, null, 2));
      
      if (autoresponderData?.success && autoresponderData?.autoresponders) {
        autoresponders = autoresponderData.autoresponders;
        console.log('✅ Autoresponders obtenidos:', autoresponders.length);
        console.log('📋 Lista de autoresponders:', autoresponders.map(ar => ({
          id: ar.id,
          name: ar.name,
          is_active: ar.is_active,
          message_preview: ar.message_text?.substring(0, 30) + '...',
          use_keywords: ar.use_keywords,
          keywords: ar.keywords
        })));
      } else {
        console.error('❌ Respuesta no exitosa del endpoint:', autoresponderData);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error crítico consultando autoresponders:', error);
      return;
    }

    if (!autoresponders || autoresponders.length === 0) {
      console.log('❌ NO HAY AUTORESPONDERS DISPONIBLES')
      console.log('💡 Asegúrate de haber configurado autoresponders en la aplicación')
      return
    }

    // FILTRAR autoresponders que coincidan con palabras clave
    const matchingAutoresponders = autoresponders.filter(ar => {
      // Si no usa palabras clave, siempre coincide
      if (!ar.use_keywords || !ar.keywords || ar.keywords.length === 0) {
        console.log(`✅ Autoresponder "${ar.name}" no usa palabras clave - COINCIDE`)
        return true;
      }
      
      // Verificar si alguna palabra clave está en el mensaje
      const hasKeywordMatch = ar.keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        const matches = messageText.includes(keywordLower);
        console.log(`🔍 Verificando palabra clave "${keyword}" -> ${matches ? 'COINCIDE' : 'NO COINCIDE'}`);
        return matches;
      });
      
      if (hasKeywordMatch) {
        console.log(`✅ Autoresponder "${ar.name}" tiene coincidencia de palabras clave - COINCIDE`)
      } else {
        console.log(`❌ Autoresponder "${ar.name}" NO tiene coincidencia de palabras clave - NO COINCIDE`)
      }
      
      return hasKeywordMatch;
    });

    if (matchingAutoresponders.length === 0) {
      console.log('❌ NO HAY AUTORESPONDERS QUE COINCIDAN CON LAS PALABRAS CLAVE')
      console.log('💡 El mensaje no contiene ninguna palabra clave configurada')
      return;
    }

    // Usar el primer autoresponder que coincida
    const selectedAutoresponder = matchingAutoresponders[0];
    
    console.log('🎯 AUTORESPONDER SELECCIONADO:')
    console.log('📋 ID:', selectedAutoresponder.id)
    console.log('📋 Nombre:', selectedAutoresponder.name)
    console.log('📋 Mensaje:', selectedAutoresponder.message_text)
    console.log('📋 Solo primer mensaje:', selectedAutoresponder.send_only_first_message)
    console.log('📋 Usa palabras clave:', selectedAutoresponder.use_keywords)
    console.log('📋 Palabras clave:', selectedAutoresponder.keywords)

    // VERIFICAR SI DEBE ENVIAR SEGÚN CONFIGURACIÓN
    let shouldSendAutoresponder = true

    if (selectedAutoresponder.send_only_first_message) {
      console.log('🔍 Verificando si ya se le envió autoresponder a:', event.sender.id)
      
      const { data: alreadySent, error: checkError } = await supabase
        .from('autoresponder_sent_log')
        .select('id')
        .eq('sender_id', event.sender.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error verificando autoresponder:', checkError)
      }

      if (alreadySent) {
        console.log('⏭️ Ya se envió autoresponder a este usuario - NO ENVIAR')
        shouldSendAutoresponder = false
      } else {
        console.log('🆕 PRIMERA VEZ QUE ESCRIBE - ENVIANDO')
      }
    } else {
      console.log('🔄 CONFIGURADO PARA RESPONDER SIEMPRE - ENVIANDO')
    }

    // ENVIAR AUTORESPONDER SI CORRESPONDE
    if (shouldSendAutoresponder) {
      console.log('🚀 ENVIANDO AUTORESPONDER...')
      
      const success = await sendInstagramMessageViaEdgeFunction(supabase, event.sender.id, selectedAutoresponder.message_text, instagramUser.instagram_user_id)
      
      if (success) {
        console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

        // ✅ NUEVO: Guardar mensaje enviado en BD del prospecto
        if (prospectId) {
          try {
            const { error: sentMessageError } = await supabase
              .rpc('add_prospect_message', {
                p_prospect_id: prospectId,
                p_message_instagram_id: `autoresponder_${Date.now()}_${Math.random().toString().substring(2, 8)}`,
                p_message_text: selectedAutoresponder.message_text,
                p_is_from_prospect: false, // Es nuestro mensaje
                p_message_timestamp: new Date().toISOString(),
                p_message_type: 'autoresponder',
                p_raw_data: {
                  autoresponder_id: selectedAutoresponder.id,
                  autoresponder_name: selectedAutoresponder.name
                }
              });

            if (sentMessageError) {
              console.error('⚠️ Error guardando autoresponder en BD:', sentMessageError);
            } else {
              console.log('✅ Autoresponder guardado en BD del prospecto');
            }
          } catch (error) {
            console.error('⚠️ Error en guardado de autoresponder:', error);
          }
        }
      } else {
        console.error('❌ ERROR ENVIANDO AUTORESPONDER')
        console.log('💡 SOLUCIÓN: Configura una variable de entorno INSTAGRAM_ACCESS_TOKEN válida en Supabase')
      }
    } else {
      console.log('⏭️ No enviando autoresponder según configuración')
    }
    
    console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
  }
}

// ✅ FUNCIONES PARA DETECTAR TIPOS DE MENSAJE
function detectInvitation(messageText: string): boolean {
  const invitationPatterns = [
    // Zoom links
    /zoom\.us\/j\/\d+/i,
    /zoom\.us\/meeting\/\d+/i,
    /us\d+web\.zoom\.us/i,
    
    // Google Meet links
    /meet\.google\.com\/[a-z-]+/i,
    /g\.co\/meet\/[a-z-]+/i,
    
    // Microsoft Teams
    /teams\.microsoft\.com/i,
    /teams\.live\.com/i,
    
    // Generic video call indicators
    /videollamada/i,
    /video.*call/i,
    /reunión.*virtual/i,
    /meeting.*link/i,
    /link.*reunión/i,
    /enlace.*reunión/i,
    
    // Calendar links
    /calendly\.com/i,
    /calendar\.google\.com/i,
    /outlook\.live\.com.*calendar/i,
    
    // Skype
    /skype\.com/i,
    /join\.skype\.com/i,
    
    // Other platforms
    /whereby\.com/i,
    /webex\.com/i,
    /gotomeeting\.com/i,
    /bluejeans\.com/i
  ];
  
  return invitationPatterns.some(pattern => pattern.test(messageText));
}

function detectPresentation(messageText: string): boolean {
  const presentationPatterns = [
    /presentación/i,
    /presentacion/i,
    /demo/i,
    /demostración/i,
    /demostracion/i,
    /mostrar.*producto/i,
    /enseñar.*servicio/i,
    /explicar.*como.*funciona/i,
    /ver.*funcionamiento/i,
    /tutorial/i,
    /capacitación/i,
    /entrenamiento/i,
    /formación/i,
    /webinar/i,
    /seminario/i
  ];
  
  return presentationPatterns.some(pattern => pattern.test(messageText));
}

function detectInscription(messageText: string): boolean {
  const inscriptionPatterns = [
    /inscripción/i,
    /inscripcion/i,
    /registro/i,
    /registrar/i,
    /apuntar/i,
    /anotar/i,
    /sign.*up/i,
    /unir/i,
    /participar/i,
    /quiero.*participar/i,
    /me.*apunto/i,
    /me.*inscribo/i,
    /formulario/i,
    /llenar.*datos/i,
    /completar.*información/i
  ];
  
  return inscriptionPatterns.some(pattern => pattern.test(messageText));
}

async function processCommentEvent(supabase: any, change: ChangeEvent) {
  try {
    console.log('🚀 ===== PROCESANDO COMENTARIO PARA AUTORESPONDER =====')
    
    const commentData = change.value
    console.log('💬 ===== DATOS DEL COMENTARIO COMPLETOS =====')
    console.log('📋 CommentData completo:', JSON.stringify(commentData, null, 2))
    
    // Extraer información del comentario según la documentación oficial
    const mediaId = commentData.media?.id || commentData.parent_id || commentData.item
    const commentText = commentData.text
    const commenterId = commentData.from?.id
    const commentId = commentData.comment_id || commentData.id
    const verb = commentData.verb // 'add', 'edit', 'remove', etc.
    
    console.log('🔍 ===== DIAGNÓSTICO DETALLADO =====')
    console.log('📋 Verb recibido:', verb)
    console.log('📋 Media ID extraído:', mediaId)
    console.log('📋 Parent ID:', commentData.parent_id)
    console.log('📋 Item:', commentData.item)
    console.log('📋 Comentario texto:', commentText)
    console.log('📋 Usuario que comentó:', commenterId)
    console.log('📋 Comment ID:', commentId)
    
    // CAMBIO CRÍTICO: No filtrar por verb si no está definido
    // Facebook puede enviar eventos sin verb definido
    if (verb === 'remove' || verb === 'edit') {
      console.log('⏭️ Comentario editado o eliminado (verb:', verb, ') - saltando')
      return
    }
    
    console.log('✅ ===== COMENTARIO VÁLIDO PARA PROCESAR =====')
    
    if (!commentText || !commenterId) {
      console.log('⏭️ Información incompleta del comentario - saltando')
      console.log('Comment text:', commentText, 'Commenter ID:', commenterId)
      return
    }
    
    // PASO 1: Buscar autoresponders configurados para TODOS los IDs posibles
    const possibleIds = [
      commentData.media?.id,
      commentData.parent_id,
      commentData.item,
      mediaId
    ].filter(Boolean);
    
    console.log('🔍 ===== BUSCANDO AUTORESPONDERS =====')
    console.log('📋 IDs a buscar:', possibleIds)
    
    // NUEVO: También mostrar todos los autoresponders en la BD para comparar
    console.log('🔍 ===== VERIFICANDO AUTORESPONDERS EN BD =====')
    const { data: allAutoresponders, error: allError } = await supabase
      .from('comment_autoresponders')
      .select('*')
      .eq('is_active', true)
    
    if (allError) {
      console.error('❌ Error consultando todos los autoresponders:', allError)
    } else {
      console.log('📊 ===== TODOS LOS AUTORESPONDERS ACTIVOS =====')
      console.log('📊 Total encontrados:', allAutoresponders?.length || 0)
      allAutoresponders?.forEach((ar, index) => {
        console.log(`📋 [${index + 1}] ID: ${ar.id}`)
        console.log(`📋 [${index + 1}] Nombre: ${ar.name}`)
        console.log(`📋 [${index + 1}] Post ID configurado: "${ar.post_id}"`)
        console.log(`📋 [${index + 1}] Keywords: ${JSON.stringify(ar.keywords)}`)
        console.log(`📋 [${index + 1}] DM Message: ${ar.dm_message}`)
        console.log('---')
      });
    }
    
    let commentAutoresponders = [];
    
    for (const searchId of possibleIds) {
      console.log(`🔍 ===== BUSCANDO AUTORESPONDERS PARA ID: "${searchId}" =====`)
      
      const { data: foundAutoresponders, error: queryError } = await supabase
        .from('comment_autoresponders')
        .select('*')
        .eq('post_id', searchId)
        .eq('is_active', true)
      
      if (queryError) {
        console.error(`❌ Error consultando autoresponders para ${searchId}:`, queryError)
        continue
      }
      
      if (foundAutoresponders && foundAutoresponders.length > 0) {
        console.log(`✅ ===== ENCONTRADOS ${foundAutoresponders.length} AUTORESPONDERS PARA ID: "${searchId}" =====`)
        foundAutoresponders.forEach((ar, index) => {
          console.log(`📋 [${index + 1}] Autoresponder encontrado:`)
          console.log(`📋 [${index + 1}] ID: ${ar.id}`)
          console.log(`📋 [${index + 1}] Nombre: ${ar.name}`)
          console.log(`📋 [${index + 1}] Keywords: ${JSON.stringify(ar.keywords)}`)
          console.log(`📋 [${index + 1}] DM Message: ${ar.dm_message}`)
        });
        commentAutoresponders = foundAutoresponders;
        break; // Usar el primer match encontrado
      } else {
        console.log(`❌ No se encontraron autoresponders para ID: "${searchId}"`)
      }
    }
    
    if (commentAutoresponders.length === 0) {
      console.log('❌ ===== NO SE ENCONTRARON AUTORESPONDERS COINCIDENTES =====')
      console.log('💡 Comparación de IDs:')
      console.log('📋 IDs del comentario:', possibleIds)
      console.log('📋 IDs en BD:', allAutoresponders?.map(ar => ar.post_id) || [])
      return
    }
    
    console.log('✅ ===== AUTORESPONDERS ENCONTRADOS =====')
    console.log('📊 Total:', commentAutoresponders.length)
    
    // PASO 2: Procesar cada autoresponder
    for (const autoresponder of commentAutoresponders) {
      console.log(`🎯 ===== PROCESANDO AUTORESPONDER: "${autoresponder.name}" =====`)
      await processAutoresponderMatch(supabase, autoresponder, commentText, commenterId, change)
    }
    
    console.log('✅ ===== COMENTARIO PROCESADO COMPLETAMENTE =====')
    
  } catch (error) {
    console.error('❌ Error en processCommentEvent:', error)
  }
}

async function processAutoresponderMatch(supabase: any, autoresponder: any, commentText: string, commenterId: string, change: ChangeEvent) {
  console.log(`🔍 ===== VERIFICANDO AUTORESPONDER: "${autoresponder.name}" =====`)
  console.log(`🔑 Palabras clave configuradas:`, autoresponder.keywords)
  console.log(`💬 Texto del comentario: "${commentText}"`)
  
  // Verificar si alguna palabra clave está en el comentario
  const commentTextLower = commentText.toLowerCase()
  console.log(`🔍 Texto en minúsculas: "${commentTextLower}"`)
  
  let matchedKeyword = null;
  const hasKeywordMatch = autoresponder.keywords.some(keyword => {
    const keywordLower = keyword.toLowerCase()
    const matches = commentTextLower.includes(keywordLower)
    console.log(`🔍 Verificando "${keyword}" (${keywordLower}) en "${commentTextLower}" -> ${matches ? 'COINCIDE ✅' : 'NO COINCIDE ❌'}`)
    if (matches) {
      matchedKeyword = keyword;
    }
    return matches
  })
  
  if (hasKeywordMatch) {
    console.log(`✅ ===== ¡COINCIDENCIA ENCONTRADA! =====`)
    console.log(`🎯 Palabra clave coincidente: "${matchedKeyword}"`)
    console.log(`📤 Enviando DM con autoresponder: "${autoresponder.name}"`)
    console.log(`💌 Mensaje a enviar: "${autoresponder.dm_message}"`)
    console.log(`👤 Usuario destino: ${commenterId}`)
    
    // PASO 3: Enviar DM usando la edge function existente
    console.log('🚀 ===== INICIANDO ENVÍO DE DM =====')
    const dmSent = await sendInstagramDM(commenterId, autoresponder.dm_message)
    
    if (dmSent) {
      console.log('✅ ===== DM ENVIADO EXITOSAMENTE =====')
      
      // PASO 4: Registrar en log
      const logData = {
        comment_autoresponder_id: autoresponder.id,
        commenter_instagram_id: commenterId,
        comment_text: commentText,
        dm_message_sent: autoresponder.dm_message,
        webhook_data: change
      };
      
      console.log('💾 Guardando en log:', logData)
      
      const { error: logError } = await supabase
        .from('comment_autoresponder_log')
        .insert(logData)
      
      if (logError) {
        console.error('⚠️ Error guardando log:', logError)
      } else {
        console.log('✅ DM enviado y registrado en log correctamente')
      }
    } else {
      console.error('❌ ===== ERROR ENVIANDO DM =====')
    }
    
    // Solo usar el primer autoresponder que coincida
    return
  } else {
    console.log(`❌ No hay coincidencias para autoresponder: "${autoresponder.name}"`)
    console.log(`💡 Palabras clave que no coincidieron: ${autoresponder.keywords.join(', ')}`)
  }
}

async function handleAutoresponder(supabase: any, senderId: string, autoresponderConfig: any) {
  try {
    console.log('🤖 INICIANDO ENVÍO DE AUTORESPONDER')
    console.log('👤 Para usuario:', senderId)

    const messageToSend = autoresponderConfig.message_text
    const autoresponderMessageId = autoresponderConfig.id

    console.log('📤 ENVIANDO MENSAJE:', messageToSend)
    
    // CAMBIO CLAVE: Usar la edge function de envío directamente
    const success = await sendInstagramMessageViaEdgeFunction(supabase, senderId, messageToSend)

    if (success) {
      console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

      // Solo registrar en log si está configurado como "solo primer mensaje"
      if (autoresponderConfig.send_only_first_message) {
        const { error: logError } = await supabase
          .from('autoresponder_sent_log')
          .insert({
            sender_id: senderId,
            autoresponder_message_id: autoresponderMessageId
          })

        if (logError) {
          console.error('⚠️ Error guardando log de autoresponder:', logError)
        } else {
          console.log('✅ Registrado en log para no enviar de nuevo')
        }
      }

      // Guardar el mensaje enviado en el historial
      const sentMessageData = {
        instagram_message_id: `autoresponder_${Date.now()}_${Math.random().toString().substring(2, 8)}`,
        sender_id: 'system',
        recipient_id: senderId,
        message_text: messageToSend,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          autoresponder: true,
          autoresponder_id: autoresponderMessageId,
          send_only_first_message: autoresponderConfig.send_only_first_message,
          source: 'autoresponder_system'
        }
      }

      const { error: saveError } = await supabase.from('instagram_messages').insert(sentMessageData)
      if (saveError) {
        console.error('⚠️ Error guardando mensaje enviado:', saveError)
      } else {
        console.log('✅ AUTORESPONDER GUARDADO EN HISTORIAL')
      }
    } else {
      console.error('❌ ERROR ENVIANDO AUTORESPONDER')
    }

  } catch (error) {
    console.error('❌ Error en handleAutoresponder:', error)
  }
}

async function sendInstagramMessageViaEdgeFunction(supabase: any, recipientId: string, messageText: string, instagramUserId: string): Promise<boolean> {
  try {
    console.log('📤 ===== ENVIANDO MENSAJE VIA EDGE FUNCTION =====')
    console.log('👤 Recipient:', recipientId)
    console.log('💌 Message:', messageText)
    console.log('🆔 Instagram User ID:', instagramUserId)
    
    const { data, error } = await supabase.functions.invoke('instagram-send-message', {
      body: {
        recipient_id: recipientId,
        message_text: messageText,
        instagram_user_id: instagramUserId // ✅ AGREGAR EL PARÁMETRO REQUERIDO
      }
    })

    console.log('📨 Respuesta de instagram-send-message:')
    console.log('📋 Data:', JSON.stringify(data, null, 2))
    console.log('📋 Error:', error)

    if (error) {
      console.error('❌ Error enviando mensaje via edge function:', error)
      return false
    }

    if (data?.error) {
      console.error('❌ Error en respuesta de edge function:', data)
      
      if (data.needs_token || data.token_invalid) {
        console.error('🔧 ACCIÓN REQUERIDA: Configura INSTAGRAM_ACCESS_TOKEN en variables de entorno de Supabase')
      }
      
      return false
    }

    if (!data?.success) {
      console.error('❌ Mensaje no exitoso via edge function:', data)
      return false
    }

    console.log('✅ ===== MENSAJE ENVIADO EXITOSAMENTE VIA EDGE FUNCTION =====')
    return true

  } catch (error) {
    console.error('❌ Error crítico enviando mensaje via edge function:', error)
    return false
  }
}

async function sendInstagramDM(recipientId: string, messageText: string): Promise<boolean> {
  try {
    console.log('📤 ===== ENVIANDO DM USANDO EDGE FUNCTION =====')
    console.log('👤 Recipient:', recipientId)
    console.log('💌 Message:', messageText)
    
    // Usar la edge function existente para enviar DMs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase.functions.invoke('instagram-send-message', {
      body: {
        recipient_id: recipientId,
        message_text: messageText
      }
    })

    console.log('📨 Respuesta de instagram-send-message:')
    console.log('📋 Data:', JSON.stringify(data, null, 2))
    console.log('📋 Error:', error)

    if (error) {
      console.error('❌ Error enviando DM:', error)
      return false
    }

    if (data?.error) {
      console.error('❌ Error en respuesta de DM:', data)
      return false
    }

    if (!data?.success) {
      console.error('❌ DM no exitoso:', data)
      return false
    }

    console.log('✅ ===== DM ENVIADO EXITOSAMENTE =====')
    return true

  } catch (error) {
    console.error('❌ Error crítico enviando DM:', error)
    return false
  }
}

// Funciones desactivadas que no se usan
async function loadIdealTraits(supabase: any): Promise<any[]> {
  return []
}

async function analyzeConversationProgress(supabase: any, senderId: string, conversationHistory: any[], idealTraits: any[]): Promise<any> {
  return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
}

async function analyzeWithAI(conversationText: string, idealTraits: any[]): Promise<any> {
  return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
}

async function generateStrategicAIResponse(supabase: any, userMessage: string, conversationHistory: any[], currentAnalysis: any, idealTraits: any[], openaiKey: string): Promise<string> {
  return "Respuesta IA desactivada temporalmente"
}

async function sendFirstStrategicResponse(supabase: any, userId: string, userMessage: string) {
  console.log('🤖 Respuesta estratégica inicial DESACTIVADA')
}

async function sendSimpleResponse(supabase: any, userId: string) {
  console.log('🤖 Respuesta simple DESACTIVADA')
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  console.log('🤖 Respuesta IA DESACTIVADA')
}
