
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

// Cache para PAGE_ID (en memoria, se resetea con cada reinicio de función)
let cachedPageId: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en milliseconds

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

      // ⭐ NUEVO: Detectar específicamente comentarios
      let foundComments = false
      if (body.object === 'instagram' && body.entry) {
        for (const entry of body.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'comments') {
                foundComments = true
                console.log('🎯 ===== ¡COMENTARIO DETECTADO! =====')
                console.log('📝 Change completo:', JSON.stringify(change, null, 2))
                console.log('💬 Texto del comentario:', change.value?.text)
                console.log('👤 Usuario que comentó:', change.value?.from?.id)
                console.log('📱 Media ID:', change.value?.media?.id)
                console.log('🔢 Post ID:', change.value?.item)
                console.log('⚡ Verb:', change.value?.verb)
              }
            }
          }
        }
      }

      if (!foundComments) {
        console.log('❌ ===== NO SE ENCONTRARON COMENTARIOS EN ESTE WEBHOOK =====')
        console.log('🔍 Verificando qué campos llegaron...')
        if (body.entry) {
          body.entry.forEach((entry, index) => {
            console.log(`📋 Entry ${index + 1}:`)
            if (entry.messaging) console.log(`  ✉️ Tiene messaging: ${entry.messaging.length} eventos`)
            if (entry.changes) {
              console.log(`  🔄 Tiene changes: ${entry.changes.length} eventos`)
              entry.changes.forEach((change, changeIndex) => {
                console.log(`    📋 Change ${changeIndex + 1}: field="${change.field}"`)
              })
            }
          })
        }
      }

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

    // PASO 2: Guardar el mensaje recibido en BD
    const messageData = {
      instagram_message_id: event.message.mid,
      sender_id: event.sender.id,
      recipient_id: event.recipient.id,
      message_text: event.message.text,
      message_type: 'received',
      timestamp: new Date(event.timestamp).toISOString(),
      is_read: false,
      raw_data: {
        webhook_data: event,
        received_at: new Date().toISOString(),
        source: 'instagram_webhook'
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
      // Continuar con autoresponder aunque falle el guardado
    } else {
      console.log('✅ Mensaje guardado correctamente')
    }

    // PASO 3: OBTENER AUTORESPONDERS DESDE NUESTRO ENDPOINT
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

    // NUEVO: Filtrar autoresponders que coincidan con palabras clave
    const messageText = event.message?.text?.toLowerCase() || '';
    console.log('🔍 FILTRANDO POR PALABRAS CLAVE')
    console.log('📝 Mensaje recibido (lowercase):', messageText)
    
    let matchingAutoresponders = autoresponders.filter(ar => {
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

    // PASO 4: VERIFICAR SI DEBE ENVIAR SEGÚN CONFIGURACIÓN
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

    // PASO 5: ENVIAR AUTORESPONDER SI CORRESPONDE
    if (shouldSendAutoresponder) {
      console.log('🚀 ENVIANDO AUTORESPONDER...')
      await handleAutoresponder(supabase, event.sender.id, selectedAutoresponder)
    } else {
      console.log('⏭️ No enviando autoresponder según configuración')
    }
    
    console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
  }
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
    const success = await sendInstagramMessage(senderId, messageToSend)

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

async function getFacebookPageIdDynamically(accessToken: string): Promise<string | null> {
  try {
    console.log('🔍 Obteniendo Facebook Page ID dinámicamente usando Graph API...')
    
    // Usar endpoint /me/accounts con permisos pages_show_list según documentación
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    )
    
    if (!accountsResponse.ok) {
      console.error('❌ Error en respuesta de Facebook API:', accountsResponse.status, accountsResponse.statusText)
      return null
    }
    
    const accountsData = await accountsResponse.json()
    console.log('📊 Respuesta completa de Facebook API:', JSON.stringify(accountsData, null, 2))
    
    // Verificar errores en la respuesta
    if (accountsData.error) {
      console.error('❌ Error de Facebook Graph API:', accountsData.error)
      console.error('💡 Verifica que el token tenga permisos: pages_show_list o manage_pages')
      return null
    }
    
    // Buscar página con Instagram Business Account
    if (accountsData.data && Array.isArray(accountsData.data)) {
      console.log(`📄 Total de páginas encontradas: ${accountsData.data.length}`)
      
      for (const page of accountsData.data) {
        console.log(`📋 Página: ${page.name} (ID: ${page.id})`)
        console.log(`📱 Instagram Business Account:`, page.instagram_business_account)
        
        if (page.instagram_business_account) {
          console.log(`✅ ¡ENCONTRADO! Facebook Page ID: ${page.id} - ${page.name}`)
          console.log(`📱 Instagram Business Account ID: ${page.instagram_business_account.id}`)
          return page.id
        }
      }
      
      console.log('⚠️ No se encontró ninguna página con Instagram Business Account vinculado')
      console.log('💡 Asegúrate de que la página tenga Instagram Business conectado')
    } else {
      console.log('⚠️ No se encontraron páginas en la respuesta de Facebook API')
    }
    
    return null
  } catch (error) {
    console.error('❌ Error crítico obteniendo Facebook Page ID:', error)
    return null
  }
}

async function getPageId(accessToken: string): Promise<string | null> {
  const now = Date.now()
  
  // Verificar si tenemos cache válido
  if (cachedPageId && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('✅ Usando PAGE_ID desde cache:', cachedPageId)
    return cachedPageId
  }
  
  console.log('🔍 Cache expirado o vacío, obteniendo PAGE_ID...')
  
  // 1. Intentar obtener desde secretos de Supabase (más rápido)
  let pageId = Deno.env.get('PAGE_ID')
  
  if (pageId) {
    console.log('✅ PAGE_ID encontrado en secretos de Supabase:', pageId)
    // Actualizar cache
    cachedPageId = pageId
    cacheTimestamp = now
    return pageId
  }
  
  // 2. Si no está en secretos, obtener dinámicamente desde Facebook Graph API
  console.log('⚠️ PAGE_ID no encontrado en secretos, consultando Facebook Graph API...')
  pageId = await getFacebookPageIdDynamically(accessToken)
  
  if (pageId) {
    console.log('✅ PAGE_ID obtenido dinámicamente:', pageId)
    // Actualizar cache
    cachedPageId = pageId
    cacheTimestamp = now
    return pageId
  }
  
  console.error('❌ No se pudo obtener PAGE_ID de ninguna fuente')
  console.error('💡 Soluciones:')
  console.error('   1. Agregar PAGE_ID a los secretos de Supabase')
  console.error('   2. Verificar permisos del token: pages_show_list, manage_pages')
  console.error('   3. Verificar que la página tenga Instagram Business conectado')
  
  return null
}

async function sendInstagramMessage(recipientId: string, messageText: string): Promise<boolean> {
  try {
    console.log('🔑 VERIFICANDO TOKEN DE INSTAGRAM...')
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('❌ NO HAY TOKEN DE INSTAGRAM EN VARIABLES DE ENTORNO')
      return false
    }

    console.log('✅ Token encontrado, longitud:', accessToken.length)

    // Obtener PAGE_ID usando estrategia híbrida (secretos + dinámico + cache)
    console.log('🔍 Obteniendo Facebook Page ID...')
    const pageId = await getPageId(accessToken)
    
    if (!pageId) {
      console.error('❌ No se pudo obtener Facebook Page ID')
      return false
    }

    console.log('📱 Usando Facebook Page ID:', pageId)

    const messagePayload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    }

    console.log('📤 ENVIANDO A INSTAGRAM API:')
    console.log('📋 Payload:', JSON.stringify(messagePayload, null, 2))

    // Usar Facebook Page ID según documentación oficial
    const apiUrl = `https://graph.facebook.com/v20.0/${pageId}/messages?access_token=${accessToken}`
    console.log('🌐 URL de API:', apiUrl.replace(accessToken, '[TOKEN_HIDDEN]'))

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    console.log('📊 RESPUESTA DE INSTAGRAM:')
    console.log('🔢 Status:', response.status)
    console.log('✅ OK:', response.ok)

    const responseData = await response.json()
    console.log('📋 Data:', JSON.stringify(responseData, null, 2))
    
    if (!response.ok) {
      console.error('❌ ERROR EN INSTAGRAM API:')
      console.error('📋 Error completo:', JSON.stringify(responseData, null, 2))
      
      // Limpiar cache si hay error (puede ser PAGE_ID incorrecto)
      if (response.status === 400 || response.status === 403) {
        console.log('🧹 Limpiando cache por posible PAGE_ID incorrecto')
        cachedPageId = null
        cacheTimestamp = 0
      }
      
      return false
    }

    console.log('✅ MENSAJE ENVIADO EXITOSAMENTE')
    return true

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN sendInstagramMessage:', error)
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
