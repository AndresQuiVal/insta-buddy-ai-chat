
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
  try {
    console.log('🚀 INICIANDO PROCESAMIENTO DE EVENTO')
    console.log('📋 EVENTO COMPLETO:', JSON.stringify(event, null, 2))

    // Verificar si es un echo (mensaje enviado por nosotros)
    if (event.message?.is_echo) {
      console.log('🔄 DETECTADO ECHO - mensaje enviado por nosotros, guardando pero no respondiendo')
      
      if (event.message.text) {
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
            source: 'instagram_webhook',
            is_echo: true
          }
        }

        console.log('💾 Guardando mensaje echo:', messageData)
        await supabase.from('instagram_messages').insert(messageData)
      }
      return
    }

    // Verificar si tiene mensaje de texto real del usuario
    if (!event.message || !event.message.text) {
      console.log('⏭️ NO HAY MENSAJE DE TEXTO - saltando evento')
      return
    }

    console.log('✅ MENSAJE REAL DEL USUARIO DETECTADO')
    console.log('👤 SENDER ID:', event.sender.id)
    console.log('💬 TEXTO DEL MENSAJE:', event.message.text)

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

    console.log('💾 GUARDANDO MENSAJE DEL USUARIO:', messageData)

    // Verificar si el mensaje ya existe
    const { data: existingMessage } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', event.message.mid)
      .single()

    if (existingMessage) {
      console.log('⏭️ MENSAJE YA EXISTE EN BD - saltando')
      return
    }

    // Guardar el mensaje
    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)

    if (error) {
      console.error('❌ ERROR GUARDANDO MENSAJE:', error)
      throw error
    }

    console.log('✅ MENSAJE GUARDADO EXITOSAMENTE')

    // 🔥 AHORA GENERAR RESPUESTA INTELIGENTE
    await generateIntelligentResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ ERROR EN processMessagingEvent:', error)
    throw error
  }
}

async function generateIntelligentResponse(supabase: any, senderId: string, currentMessage: string) {
  console.log('🤖 ===============================================')
  console.log('🤖 INICIANDO GENERACIÓN DE RESPUESTA INTELIGENTE')
  console.log('🤖 ===============================================')
  console.log('👤 USUARIO ID:', senderId)
  console.log('💬 MENSAJE ACTUAL:', currentMessage)

  try {
    // 1. OBTENER HISTORIAL COMPLETO DE LA CONVERSACIÓN
    console.log('📚 OBTENIENDO HISTORIAL DE CONVERSACIÓN...')
    const { data: conversationHistory, error: historyError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
      .order('timestamp', { ascending: true })

    if (historyError) {
      console.error('❌ ERROR OBTENIENDO HISTORIAL:', historyError)
      await sendResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
      return
    }

    const messages = conversationHistory || []
    console.log(`📊 TOTAL MENSAJES EN CONVERSACIÓN: ${messages.length}`)

    // 2. IMPRIMIR HISTORIAL COMPLETO
    console.log('📖 ========== HISTORIAL COMPLETO ==========')
    messages.forEach((msg, index) => {
      const isFromUser = msg.sender_id === senderId
      const sender = isFromUser ? '👤 Usuario' : '🤖 María'
      const time = new Date(msg.timestamp).toLocaleString()
      console.log(`${index + 1}. [${time}] ${sender}: "${msg.message_text}"`)
    })
    console.log('📖 =======================================')

    // 3. ANALIZAR MENSAJE ACTUAL
    const lowerMessage = currentMessage.toLowerCase().trim()
    console.log('🔍 MENSAJE EN MINÚSCULAS:', lowerMessage)

    let response = ""
    let reasoning = ""

    // 4. LÓGICA DE RESPUESTA
    if (lowerMessage.includes('como te llamas') || 
        lowerMessage.includes('cómo te llamas') ||
        lowerMessage.includes('cuál es tu nombre') ||
        lowerMessage.includes('quien eres') ||
        lowerMessage.includes('quién eres')) {
      
      reasoning = "Usuario pregunta por mi nombre/identidad"
      response = "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más cuando piensas en viajar?"
    }
    else if (lowerMessage.includes('leíste mi conversación') || 
             lowerMessage.includes('leiste mi conversacion') ||
             lowerMessage.includes('de lo que hemos hablado') || 
             lowerMessage.includes('conversación anterior')) {
      
      reasoning = "Usuario pregunta si he leído la conversación anterior"
      response = "Sí, claro que he leído nuestra conversación. Veo que tienes intereses específicos. ¿Has estado ahorrando para algo especial?"
    }
    else if (lowerMessage.includes('hola') || 
             lowerMessage.includes('buenos') ||
             lowerMessage.includes('buenas')) {
      
      reasoning = "Usuario está saludando"
      const previousGreetings = messages.filter(msg => 
        msg.sender_id === senderId && 
        (msg.message_text.toLowerCase().includes('hola') || 
         msg.message_text.toLowerCase().includes('buenos'))
      )
      
      if (previousGreetings.length > 1) {
        response = "¡Qué gusto verte de nuevo! ¿En qué más te puedo ayudar?"
      } else {
        response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de aventuras te emocionan más?"
      }
    }
    else if (lowerMessage.trim() === 'how' || lowerMessage.includes('hello')) {
      reasoning = "Usuario escribió en inglés"
      response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
    }
    else {
      reasoning = "Mensaje general, usando respuesta estándar"
      const responses = [
        "¿Qué tipo de experiencias te hacen sentir más emocionado?",
        "¿Cuáles son tus actividades favoritas para relajarte?",
        "¿Hay algo que hayas estado queriendo hacer hace tiempo?"
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    }

    // 5. LOGS DE DECISIÓN
    console.log('🧠 RAZONAMIENTO:', reasoning)
    console.log('💭 RESPUESTA SELECCIONADA:', response)
    console.log('📊 TOTAL MENSAJES EN HISTORIAL:', messages.length)

    // 6. ENVIAR RESPUESTA
    console.log('📤 ENVIANDO RESPUESTA...')
    await sendResponse(supabase, senderId, response)

    console.log('✅ ===============================================')
    console.log('✅ RESPUESTA ENVIADA EXITOSAMENTE')
    console.log('✅ ===============================================')

  } catch (error) {
    console.error('❌ ERROR EN generateIntelligentResponse:', error)
    await sendResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
  }
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('📨 ===============================================')
    console.log('📨 PREPARANDO ENVÍO DE RESPUESTA')
    console.log('📨 ===============================================')
    console.log('👤 PARA USUARIO:', senderId)
    console.log('💬 MENSAJE A ENVIAR:', messageText)

    // Obtener configuración de delay
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_delay')
      .limit(1)

    const delay = (settings && settings.length > 0 ? settings[0].ai_delay : 3) * 1000
    console.log(`⏰ ESPERANDO ${delay}ms ANTES DE ENVIAR...`)
    
    await new Promise(resolve => setTimeout(resolve, delay))

    const success = await sendInstagramMessage(senderId, messageText)
    
    if (success) {
      console.log('✅ MENSAJE ENVIADO A INSTAGRAM EXITOSAMENTE')
      
      // Guardar mensaje enviado
      const sentMessageData = {
        instagram_message_id: `ai_response_${Date.now()}_${Math.random()}`,
        sender_id: 'ai_assistant_maria',
        recipient_id: senderId,
        message_text: messageText,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          ai_generated: true,
          source: 'webhook_intelligent_response'
        }
      }

      console.log('💾 GUARDANDO RESPUESTA EN BD:', sentMessageData)
      
      await supabase
        .from('instagram_messages')
        .insert(sentMessageData)

      console.log('✅ RESPUESTA GUARDADA EN BD EXITOSAMENTE')
    } else {
      console.error('❌ ERROR ENVIANDO MENSAJE A INSTAGRAM')
    }

    console.log('📨 ===============================================')

  } catch (error) {
    console.error('❌ ERROR EN sendResponse:', error)
  }
}

async function sendInstagramMessage(recipientId: string, messageText: string): Promise<boolean> {
  try {
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('❌ NO HAY TOKEN DE ACCESO DE INSTAGRAM')
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
      console.error('❌ ERROR EN RESPUESTA DE INSTAGRAM API:', JSON.stringify(responseData, null, 2))
      return false
    }

    console.log('✅ RESPUESTA EXITOSA DE INSTAGRAM API:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR EN sendInstagramMessage:', error)
    return false
  }
}
