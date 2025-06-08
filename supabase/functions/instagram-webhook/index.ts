
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

    // RESPUESTA AUTOMÁTICA SIMPLE
    await handleSimpleResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function handleSimpleResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('🤖 Generando respuesta simple para:', messageText)
    
    const lowerMessage = messageText.toLowerCase().trim()
    let response = ""
    
    // Respuestas específicas y simples
    if (lowerMessage.includes('como te llamas') || lowerMessage.includes('cómo te llamas') || lowerMessage.includes('cual es tu nombre') || lowerMessage.includes('cuál es tu nombre')) {
      response = "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
    }
    else if (lowerMessage.includes('leíste mi conversación') || lowerMessage.includes('leiste mi conversacion') || lowerMessage.includes('conversación anterior')) {
      response = "Claro, he visto nuestra conversación. ¿Qué más te gustaría saber?"
    }
    else if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      response = "¡Hola! Soy María. ¿Qué tipo de aventuras te emocionan más?"
    }
    else if (lowerMessage === 'how' || lowerMessage.includes('hello')) {
      response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
    }
    else {
      // Respuesta por defecto
      const defaultResponses = [
        "¿Qué tipo de experiencias te hacen sentir más emocionado?",
        "¿Cuáles son tus actividades favoritas para relajarte?",
        "¿Hay algo que hayas estado queriendo hacer hace tiempo?"
      ]
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    }

    console.log('🤖 RESPUESTA GENERADA:', response)
    await sendResponseWithDelay(supabase, senderId, response)

  } catch (error) {
    console.error('❌ Error en handleSimpleResponse:', error)
  }
}

async function sendResponseWithDelay(supabase: any, senderId: string, messageText: string) {
  try {
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
      // Guardar mensaje enviado
      await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `simple_${Date.now()}_${Math.random()}`,
          sender_id: 'ai_assistant',
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

      console.log('✅ Respuesta simple enviada y guardada exitosamente')
    }

  } catch (error) {
    console.error('❌ Error en sendResponseWithDelay:', error)
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

    console.log('📤 Enviando mensaje a Instagram:', messagePayload)

    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error enviando mensaje a Instagram:', responseData)
      return false
    }

    console.log('✅ Mensaje enviado exitosamente a Instagram')
    return true

  } catch (error) {
    console.error('❌ Error en sendInstagramMessage:', error)
    return false
  }
}
