
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
              await processMessagingEvent(supabase, event)
            }
          }

          // Procesar cambios en la página
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value.messaging) {
                for (const event of change.value.messaging) {
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
    console.log('📝 Processing messaging event:', event)

    if (!event.message || !event.message.text) {
      console.log('⏭️ Skipping event without text message')
      return
    }

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

    console.log('💾 Saving message to database:', messageData)

    // Verificar si el mensaje ya existe
    const { data: existingMessage } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', event.message.mid)
      .single()

    if (existingMessage) {
      console.log('⏭️ Message already exists, skipping')
      return
    }

    // Guardar el mensaje
    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)

    if (error) {
      console.error('❌ Error saving message:', error)
      throw error
    }

    console.log('✅ Message saved successfully:', data)

    // 🔥 ANÁLISIS Y RESPUESTA CON LOGS DETALLADOS
    await handleIntelligentResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function handleIntelligentResponse(supabase: any, senderId: string, currentMessage: string) {
  try {
    console.log('🤖 ===============================================')
    console.log('🤖 INICIANDO ANÁLISIS DE RESPUESTA INTELIGENTE')
    console.log('🤖 ===============================================')
    console.log(`👤 Usuario ID: ${senderId}`)
    console.log(`💬 Mensaje recibido: "${currentMessage}"`)

    // 1. OBTENER HISTORIAL COMPLETO
    console.log('📚 Obteniendo historial completo de la conversación...')
    const { data: allMessages, error: messagesError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
      await sendSimpleResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
      return
    }

    const conversationHistory = allMessages || []
    console.log(`📝 TOTAL DE MENSAJES EN CONVERSACIÓN: ${conversationHistory.length}`)
    
    // 2. IMPRIMIR TODOS LOS MENSAJES DE LA CONVERSACIÓN
    console.log('📖 ========== HISTORIAL COMPLETO ==========')
    conversationHistory.forEach((msg, index) => {
      const sender = msg.message_type === 'received' ? '👤 Usuario' : '🤖 María'
      const time = new Date(msg.timestamp).toLocaleString()
      console.log(`${index + 1}. [${time}] ${sender}: "${msg.message_text}"`)
    })
    console.log('📖 ======================================')

    // 3. ANÁLISIS DEL MENSAJE ACTUAL
    const lowerMessage = currentMessage.toLowerCase().trim()
    console.log(`🔍 Analizando mensaje: "${lowerMessage}"`)
    
    let response = ""
    let reasoning = ""

    // 4. LÓGICA DE RESPUESTA CON EXPLICACIONES
    if (lowerMessage.includes('como te llamas') || 
        lowerMessage.includes('cómo te llamas') ||
        lowerMessage.includes('cuál es tu nombre') ||
        lowerMessage.includes('quien eres') ||
        lowerMessage.includes('quién eres')) {
      
      reasoning = "Usuario pregunta por mi nombre/identidad"
      if (conversationHistory.length <= 3) {
        response = "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más cuando piensas en viajar?"
      } else {
        response = "Soy María, encantada. ¿Has estado ahorrando para algo especial últimamente?"
      }
    }
    else if (lowerMessage.includes('leíste mi conversación') || 
             lowerMessage.includes('leiste mi conversacion') ||
             lowerMessage.includes('de lo que hemos hablado') || 
             lowerMessage.includes('conversación anterior')) {
      
      reasoning = "Usuario pregunta si he leído la conversación anterior"
      if (conversationHistory.length <= 3) {
        response = "Claro, he visto que nos estamos conociendo. Me contabas sobre ti. ¿Qué tipo de actividades te emocionan más?"
      } else {
        response = "Sí, claro que he leído nuestra conversación. Veo que tienes intereses específicos. ¿Has estado ahorrando para algo especial?"
      }
    }
    else if (lowerMessage.includes('hola') || 
             lowerMessage.includes('buenos') ||
             lowerMessage.includes('buenas')) {
      
      reasoning = "Usuario está saludando"
      const previousGreetings = conversationHistory.filter(msg => 
        msg.message_type === 'received' && 
        (msg.message_text.toLowerCase().includes('hola') || 
         msg.message_text.toLowerCase().includes('buenos'))
      )
      
      if (previousGreetings.length > 1) {
        response = "¡Qué gusto verte de nuevo! ¿En qué más te puedo ayudar?"
      } else if (conversationHistory.length === 1) {
        response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de aventuras te emocionan más?"
      } else {
        response = "¡Hola otra vez! ¿Qué más te gustaría saber?"
      }
    }
    else if (lowerMessage.trim() === 'how' || lowerMessage.includes('hello')) {
      reasoning = "Usuario escribió en inglés"
      response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
    }
    else {
      reasoning = "Mensaje general, usando respuesta estándar basada en número de mensajes"
      const totalMessages = conversationHistory.length
      
      if (totalMessages < 5) {
        const responses = [
          "¿Qué tipo de experiencias te hacen sentir más emocionado?",
          "¿Cuáles son tus actividades favoritas para relajarte?",
          "¿Hay algo que hayas estado queriendo hacer hace tiempo?"
        ]
        response = responses[Math.floor(Math.random() * responses.length)]
      } else if (totalMessages < 10) {
        response = "Me parece muy bien. ¿Has estado ahorrando para algo especial?"
      } else {
        response = "¡Perfecto! Creo que tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?"
      }
    }

    // 5. LOGS DE DECISIÓN
    console.log(`🧠 RAZONAMIENTO: ${reasoning}`)
    console.log(`💭 RESPUESTA SELECCIONADA: "${response}"`)
    console.log(`📊 CONTEXTO: ${conversationHistory.length} mensajes en historial`)

    // 6. ENVIAR RESPUESTA
    console.log('📤 Enviando respuesta...')
    await sendSimpleResponse(supabase, senderId, response)

    console.log('✅ ===============================================')
    console.log('✅ ANÁLISIS COMPLETADO EXITOSAMENTE')
    console.log('✅ ===============================================')

  } catch (error) {
    console.error('❌ Error en handleIntelligentResponse:', error)
    await sendSimpleResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
  }
}

async function sendSimpleResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log(`📨 PREPARANDO ENVÍO DE MENSAJE:`)
    console.log(`   👤 Para usuario: ${senderId}`)
    console.log(`   💬 Mensaje: "${messageText}"`)

    // Obtener configuración de delay
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_delay')
      .limit(1)

    const delay = (settings && settings.length > 0 ? settings[0].ai_delay : 3) * 1000
    console.log(`⏰ Esperando ${delay}ms antes de enviar respuesta...`)
    
    await new Promise(resolve => setTimeout(resolve, delay))

    const success = await sendInstagramMessage(senderId, messageText)
    
    if (success) {
      console.log('✅ Mensaje enviado exitosamente a Instagram')
      
      // Guardar mensaje enviado
      await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `ai_response_${Date.now()}_${Math.random()}`,
          sender_id: 'ai_assistant_maria',
          recipient_id: senderId,
          message_text: messageText,
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: {
            ai_generated: true,
            simple_response: true,
            source: 'webhook_simple_response'
          }
        })

      console.log('✅ Respuesta guardada en base de datos')
    } else {
      console.error('❌ Error enviando mensaje a Instagram')
    }

  } catch (error) {
    console.error('❌ Error en sendSimpleResponse:', error)
  }
}

async function sendInstagramMessage(recipientId: string, messageText: string): Promise<boolean> {
  try {
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('❌ No hay token de acceso de Instagram configurado')
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

    console.log('📤 Enviando mensaje a Instagram API:', messagePayload)

    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error respuesta Instagram API:', responseData)
      return false
    }

    console.log('✅ Respuesta exitosa de Instagram API:', responseData)
    return true

  } catch (error) {
    console.error('❌ Error en sendInstagramMessage:', error)
    return false
  }
}
