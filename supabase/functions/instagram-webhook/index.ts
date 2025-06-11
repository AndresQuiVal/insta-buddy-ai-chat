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

          // Procesar cambios en la página
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value.messaging) {
                for (const event of change.value.messaging) {
                  console.log('📝 Processing change event:', JSON.stringify(event, null, 2))
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
  console.log('🚀 PROCESANDO MENSAJE - AUTORESPONDER ACTIVO')
  console.log('👤 SENDER ID:', event.sender.id)
  console.log('💬 MENSAJE:', event.message?.text)

  try {
    // PASO 0: Actualizar actividad del prospecto
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

    // PASO 2: Guardar el mensaje recibido
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

    // PASO 3: OBTENER CONFIGURACIÓN DE AUTORESPONDER ACTIVO - MODIFICADO
    console.log('🔍 Obteniendo configuración de autoresponder...')
    
    // Primero intentar con user_id si existe, luego sin user_id como fallback
    let { data: autoresponderMessage, error: queryError } = await supabase
      .from('autoresponder_messages')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (queryError) {
      console.error('❌ Error obteniendo autoresponder:', queryError)
      return
    }

    if (!autoresponderMessage) {
      console.log('⚠️ No hay respuestas automáticas activas')
      
      // Debug: Mostrar todos los autoresponders para diagnosticar
      const { data: allAutoresponders, error: debugError } = await supabase
        .from('autoresponder_messages')
        .select('*')
      
      if (!debugError && allAutoresponders) {
        console.log('🔍 DEBUG - Todos los autoresponders:', JSON.stringify(allAutoresponders, null, 2))
      }
      
      return
    }

    console.log('📋 Configuración encontrada:', {
      id: autoresponderMessage.id,
      name: autoresponderMessage.name,
      sendOnlyFirst: autoresponderMessage.send_only_first_message,
      userId: autoresponderMessage.user_id
    })

    // PASO 4: VERIFICAR SI DEBE ENVIAR SEGÚN CONFIGURACIÓN
    let shouldSendAutoresponder = true

    if (autoresponderMessage.send_only_first_message) {
      // Solo enviar si es la primera vez
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
        console.log('🆕 PRIMERA VEZ QUE ESCRIBE - ENVIANDO AUTORESPONDER')
      }
    } else {
      // Enviar siempre
      console.log('🔄 CONFIGURADO PARA RESPONDER SIEMPRE - ENVIANDO AUTORESPONDER')
    }

    // PASO 5: ENVIAR AUTORESPONDER SI CORRESPONDE
    if (shouldSendAutoresponder) {
      await handleAutoresponder(supabase, event.sender.id, autoresponderMessage)
    } else {
      console.log('⏭️ No enviando autoresponder según configuración')
    }
    
    console.log('✅ Mensaje procesado correctamente')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
  }
}

async function handleAutoresponder(supabase: any, senderId: string, autoresponderConfig: any) {
  try {
    console.log('🤖 INICIANDO AUTORESPONDER PARA:', senderId)

    const messageToSend = autoresponderConfig.message_text || '¡Hola! Gracias por escribirme. Te responderé pronto. 😊'
    const autoresponderMessageId = autoresponderConfig.id

    // Enviar la respuesta automática
    console.log('📤 ENVIANDO AUTORESPONDER:', messageToSend)
    const success = await sendInstagramMessage(senderId, messageToSend)

    if (success) {
      console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

      // Solo registrar en log si está configurado como "solo primer mensaje"
      if (autoresponderConfig.send_only_first_message) {
        const { error: logError } = await supabase.from('autoresponder_sent_log').insert({
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

async function sendInstagramMessage(recipientId: string, messageText: string): Promise<boolean> {
  try {
    console.log('🔑 VERIFICANDO TOKEN DE INSTAGRAM...')
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('❌ NO HAY TOKEN DE INSTAGRAM EN VARIABLES DE ENTORNO')
      console.error('📋 Variables disponibles:', Object.keys(Deno.env.toObject()).filter(key => key.includes('INSTAGRAM')))
      return false
    }

    console.log('✅ Token encontrado, longitud:', accessToken.length)
    console.log('🔍 Token preview:', accessToken.substring(0, 20) + '...')

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
    console.log('🎯 URL:', `https://graph.facebook.com/v19.0/me/messages`)

    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
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
      
      if (responseData.error) {
        console.error('🚨 Tipo de error:', responseData.error.type)
        console.error('🚨 Código de error:', responseData.error.code)
        console.error('🚨 Mensaje de error:', responseData.error.message)
        console.error('🚨 Subtipo de error:', responseData.error.error_subcode)
      }
      
      return false
    }

    console.log('✅ MENSAJE ENVIADO EXITOSAMENTE')
    console.log('📋 Respuesta exitosa:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN sendInstagramMessage:')
    console.error('📋 Error details:', error)
    console.error('📋 Error message:', error.message)
    console.error('📋 Error stack:', error.stack)
    return false
  }
}

// Funciones de análisis de conversación que mantienen pero no se usan activamente
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
