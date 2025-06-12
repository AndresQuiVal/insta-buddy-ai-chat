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
      console.log('📨 Instagram webhook received:', JSON.stringify(body, null, 2))

      // Inicializar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      if (body.object === 'instagram') {
        for (const entry of body.entry as WebhookEntry[]) {
          console.log(`🔄 Processing entry ${entry.id}`)

          // Procesar mensajes directos
          if (entry.messaging) {
            for (const event of entry.messaging) {
              console.log('📝 Processing messaging event:', JSON.stringify(event, null, 2))
              await processMessagingEvent(supabase, event)
            }
          }

          // Procesar cambios (incluyendo comentarios)
          if (entry.changes) {
            for (const change of entry.changes) {
              console.log('🔄 Processing change:', JSON.stringify(change, null, 2))
              
              // Procesar comentarios según la documentación oficial
              if (change.field === 'comments') {
                console.log('💬 Processing comment event:', JSON.stringify(change, null, 2))
                await processCommentEvent(supabase, change)
              }
              
              // Procesar mensajes en changes
              if (change.field === 'messages' && change.value.messaging) {
                for (const event of change.value.messaging) {
                  console.log('📝 Processing change messaging event:', JSON.stringify(event, null, 2))
                  await processMessagingEvent(supabase, event)
                }
              }
            }
          }
        }
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
    console.log('🚀 === PROCESANDO COMENTARIO PARA AUTORESPONDER ===')
    
    const commentData = change.value
    console.log('💬 Datos del comentario:', JSON.stringify(commentData, null, 2))
    
    // Extraer información del comentario según la documentación oficial
    const mediaId = commentData.media?.id || commentData.parent_id
    const commentText = commentData.text
    const commenterId = commentData.from?.id
    const commentId = commentData.comment_id
    const verb = commentData.verb // 'add', 'edit', 'remove', etc.
    
    // Solo procesar comentarios nuevos
    if (verb !== 'add') {
      console.log('⏭️ Comentario no es nuevo (verb:', verb, ') - saltando')
      return
    }
    
    if (!mediaId || !commentText || !commenterId) {
      console.log('⏭️ Información incompleta del comentario - saltando')
      console.log('Media ID:', mediaId, 'Comment text:', commentText, 'Commenter ID:', commenterId)
      return
    }
    
    console.log('📋 Media ID:', mediaId)
    console.log('📋 Comentario:', commentText)
    console.log('📋 Usuario que comentó:', commenterId)
    console.log('📋 Comment ID:', commentId)
    
    // PASO 1: Buscar autoresponders configurados para este post
    console.log('🔍 Buscando autoresponders para post:', mediaId)
    
    const { data: commentAutoresponders, error: queryError } = await supabase
      .from('comment_autoresponders')
      .select('*')
      .eq('post_id', mediaId)
      .eq('is_active', true)
    
    if (queryError) {
      console.error('❌ Error consultando autoresponders:', queryError)
      return
    }
    
    if (!commentAutoresponders || commentAutoresponders.length === 0) {
      console.log('⏭️ No hay autoresponders configurados para este post')
      return
    }
    
    console.log('✅ Autoresponders encontrados:', commentAutoresponders.length)
    
    // PASO 2: Verificar si el comentario contiene palabras clave
    const commentTextLower = commentText.toLowerCase()
    
    for (const autoresponder of commentAutoresponders) {
      console.log(`🔍 Verificando autoresponder: ${autoresponder.name}`)
      console.log(`🔑 Palabras clave:`, autoresponder.keywords)
      
      // Verificar si alguna palabra clave está en el comentario
      const hasKeywordMatch = autoresponder.keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase()
        const matches = commentTextLower.includes(keywordLower)
        console.log(`🔍 Verificando "${keyword}" -> ${matches ? 'COINCIDE' : 'NO COINCIDE'}`)
        return matches
      })
      
      if (hasKeywordMatch) {
        console.log(`✅ ¡COINCIDENCIA! Enviando DM con autoresponder: ${autoresponder.name}`)
        
        // PASO 3: Enviar DM usando la edge function existente
        const dmSent = await sendInstagramDM(commenterId, autoresponder.dm_message)
        
        if (dmSent) {
          // PASO 4: Registrar en log
          const { error: logError } = await supabase
            .from('comment_autoresponder_log')
            .insert({
              comment_autoresponder_id: autoresponder.id,
              commenter_instagram_id: commenterId,
              comment_text: commentText,
              dm_message_sent: autoresponder.dm_message,
              webhook_data: change
            })
          
          if (logError) {
            console.error('⚠️ Error guardando log:', logError)
          } else {
            console.log('✅ DM enviado y registrado en log')
          }
        }
        
        // Solo usar el primer autoresponder que coincida
        break
      } else {
        console.log(`❌ No hay coincidencias para: ${autoresponder.name}`)
      }
    }
    
    console.log('✅ === COMENTARIO PROCESADO COMPLETAMENTE ===')
    
  } catch (error) {
    console.error('❌ Error en processCommentEvent:', error)
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
    console.log('📤 Enviando DM usando edge function...')
    console.log('Recipient:', recipientId)
    console.log('Message:', messageText)
    
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

    console.log('✅ DM enviado exitosamente')
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
