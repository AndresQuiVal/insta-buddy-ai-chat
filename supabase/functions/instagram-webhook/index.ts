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
  console.log('🚀 PROCESANDO MENSAJE DE INSTAGRAM')
  console.log('👤 SENDER ID:', event.sender.id)
  console.log('💬 MENSAJE:', event.message?.text)

  try {
    // PASO 1: Guardar el mensaje recibido
    if (!event.message?.text || event.message?.is_echo) {
      console.log('⏭️ Mensaje no válido o es un echo - saltando')
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

    // Verificar duplicados
    const { data: existingMessage } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', event.message.mid)
      .single()

    if (existingMessage) {
      console.log('⏭️ Mensaje duplicado - saltando')
      return
    }

    await supabase.from('instagram_messages').insert(messageData)
    
    // PASO 2: Obtener TODA la conversación anterior
    const { data: conversationHistory } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${event.sender.id},recipient_id.eq.${event.sender.id}`)
      .order('timestamp', { ascending: true })

    if (!conversationHistory || conversationHistory.length === 0) {
      console.log('⚠️ No hay historial de conversación')
      return await sendFirstResponse(supabase, event.sender.id)
    }

    // PASO 3: Procesar la conversación para OpenAI
    const processedConversation = conversationHistory.map(msg => {
      const role = msg.sender_id === event.sender.id ? 'user' : 'assistant'
      return {
        role,
        content: msg.message_text,
        timestamp: new Date(msg.timestamp).toLocaleString()
      }
    })

    console.log('📚 HISTORIAL PROCESADO:', processedConversation)

    // PASO 4: Generar respuesta con contexto completo
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI')
      return await sendSimpleResponse(supabase, event.sender.id)
    }

    const systemPrompt = `Eres María, una asesora de viajes experta. INSTRUCCIONES CRÍTICAS:

1. CONTEXTO ACTUAL:
- El usuario te está preguntando: "${event.message.text}"
- Tienes un historial de ${processedConversation.length} mensajes con este usuario
- DEBES usar este contexto para responder apropiadamente

2. REGLAS ESTRICTAS:
❌ NUNCA RESPONDER:
- "Interesante, cuéntame más"
- "Qué bueno/interesante"
- Cualquier variación genérica
- NO IGNORAR el contexto previo

✅ SIEMPRE:
- LEER y ENTENDER el mensaje actual
- REVISAR la conversación anterior
- RESPONDER específicamente a lo preguntado
- Si mencionan algo previo, DEMOSTRAR que lo recuerdas
- Si preguntan por una conversación anterior, BUSCAR en el historial
- Si no encuentras la conversación mencionada, ADMITIRLO honestamente

3. EJEMPLOS DE RESPUESTAS CORRECTAS:
Usuario: "¿recuerdas nuestra conversación?"
❌ MAL: "Interesante, cuéntame más"
✅ BIEN: "He revisado nuestras conversaciones anteriores. [Mencionar específicamente el tema del que hablaron]"

Usuario: "hola"
❌ MAL: "Hola, ¿cómo estás?"
✅ BIEN: "¡Hola! Veo que hemos hablado antes sobre [tema específico]. ¿Te gustaría continuar con ese tema o prefieres explorar otras opciones de viaje?"

4. FORMATO DE RESPUESTA:
1) Reconocer el mensaje actual
2) Referenciar contexto relevante si existe
3) Responder específicamente
4) Hacer preguntas concretas si es necesario

CONVERSACIÓN ANTERIOR (en orden cronológico):
${processedConversation.map(msg => 
  `[${msg.timestamp}] ${msg.role === 'user' ? 'Usuario' : 'María'}: ${msg.content}`
).join('\n')}

RESPONDE de manera específica y útil, demostrando que entiendes el contexto completo.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: event.message.text }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error de OpenAI: ${response.status}`)
    }

    const data = await response.json()
    let aiResponse = data.choices[0].message.content.trim()

    // PASO 5: Verificación final de respuesta genérica
    const genericResponses = [
      'interesante',
      'cuéntame más',
      'qué bueno',
      'me gustaría saber',
      'qué bien',
      'dime más'
    ]

    if (genericResponses.some(phrase => aiResponse.toLowerCase().includes(phrase))) {
      console.log('⚠️ Respuesta genérica detectada - usando respuesta de emergencia')
      aiResponse = `He revisado nuestra conversación anterior. ${
        processedConversation.length > 1 
          ? `Veo que hemos estado hablando sobre ${processedConversation[processedConversation.length - 2].content}. ¿Te gustaría que profundicemos en ese tema?` 
          : '¿Qué tipo de viaje te interesa explorar? Por ejemplo, ¿prefieres destinos de playa, ciudades culturales, o aventuras en la naturaleza?'
      }`
    }

    // PASO 6: Enviar y guardar respuesta
    await sendResponse(supabase, event.sender.id, aiResponse)
    console.log('✅ Respuesta enviada exitosamente')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
    await sendSimpleResponse(supabase, event.sender.id)
  }
}

async function sendFirstResponse(supabase: any, userId: string) {
  const response = "¡Hola! Soy María, tu asesora de viajes. ¿Qué tipo de experiencia de viaje estás buscando? Por ejemplo, ¿te interesan más las playas paradisíacas, las aventuras en la naturaleza, o explorar ciudades culturales?"
  await sendResponse(supabase, userId, response)
}

async function sendSimpleResponse(supabase: any, userId: string) {
  const response = "¡Hola! ¿Qué tipo de viaje te gustaría explorar?"
  await sendResponse(supabase, userId, response)
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('📨 PREPARANDO ENVÍO...')
    
    // Obtener delay
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_delay')
      .limit(1)

    const delay = (settings && settings.length > 0 ? settings[0].ai_delay : 3) * 1000
    console.log(`⏰ ESPERANDO ${delay}ms...`)
    
    await new Promise(resolve => setTimeout(resolve, delay))

    const success = await sendInstagramMessage(senderId, messageText)
    
    if (success) {
      console.log('✅ MENSAJE ENVIADO A INSTAGRAM')
      
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
          source: 'webhook_ai_response'
        }
      }

      await supabase.from('instagram_messages').insert(sentMessageData)
      console.log('✅ RESPUESTA GUARDADA EN BD')
    } else {
      console.error('❌ ERROR ENVIANDO A INSTAGRAM')
    }

  } catch (error) {
    console.error('❌ ERROR EN sendResponse:', error)
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

    console.log('✅ RESPUESTA EXITOSA DE INSTAGRAM:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR EN sendInstagramMessage:', error)
    return false
  }
}
