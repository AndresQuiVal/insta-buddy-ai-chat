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
      .single()

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

    // PASO 3: VERIFICAR SI YA SE LE ENVIÓ AUTORESPONDER ANTES
    console.log('🔍 Verificando si ya se le envió autoresponder a:', event.sender.id)
    
    const { data: alreadySent, error: checkError } = await supabase
      .from('autoresponder_sent_log')
      .select('id')
      .eq('sender_id', event.sender.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error verificando autoresponder:', checkError)
    }

    if (alreadySent) {
      console.log('⏭️ Ya se envió autoresponder a este usuario - NO ENVIAR')
      return
    }

    // PASO 4: ENVIAR AUTORESPONDER (primera vez que escribe)
    console.log('🆕 PRIMERA VEZ QUE ESCRIBE - ENVIANDO AUTORESPONDER')
    await handleAutoresponder(supabase, event.sender.id)
    
    console.log('✅ Mensaje procesado correctamente')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
  }
}

async function handleAutoresponder(supabase: any, senderId: string) {
  try {
    console.log('🤖 INICIANDO AUTORESPONDER PARA:', senderId)

    // Obtener mensaje automático activo
    const { data: autoresponderMessage, error: queryError } = await supabase
      .from('autoresponder_messages')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    let messageToSend = '¡Hola! Gracias por escribirme. Te responderé pronto. 😊'
    let autoresponderMessageId = null

    if (queryError || !autoresponderMessage) {
      console.log('⚠️ No hay respuestas automáticas activas - usando mensaje por defecto')
    } else {
      console.log('📤 Usando respuesta automática:', autoresponderMessage.name)
      messageToSend = autoresponderMessage.message_text
      autoresponderMessageId = autoresponderMessage.id
    }

    // Enviar la respuesta automática
    console.log('📤 ENVIANDO AUTORESPONDER:', messageToSend)
    const success = await sendInstagramMessage(senderId, messageToSend)

    if (success) {
      console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

      // Registrar que se envió para no enviarlo de nuevo
      const { error: logError } = await supabase.from('autoresponder_sent_log').insert({
        sender_id: senderId,
        autoresponder_message_id: autoresponderMessageId
      })

      if (logError) {
        console.error('⚠️ Error guardando log de autoresponder:', logError)
      }

      // Guardar el mensaje enviado en el historial
      const sentMessageData = {
        instagram_message_id: `autoresponder_${Date.now()}_${Math.random()}`,
        sender_id: 'system',
        recipient_id: senderId,
        message_text: messageToSend,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          autoresponder: true,
          autoresponder_id: autoresponderMessageId,
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
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('❌ NO HAY TOKEN DE INSTAGRAM')
      return false
    }

    const messagePayload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    }

    console.log('📤 ENVIANDO A INSTAGRAM API:', JSON.stringify(messagePayload, null, 2))

    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ ERROR EN INSTAGRAM API:', JSON.stringify(responseData, null, 2))
      return false
    }

    console.log('✅ MENSAJE ENVIADO EXITOSAMENTE:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR EN sendInstagramMessage:', error)
    return false
  }
}

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
