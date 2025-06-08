
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
  console.log('🚀 ==========================================')
  console.log('🚀 PROCESANDO MENSAJE DE INSTAGRAM')
  console.log('🚀 ==========================================')

  try {
    // Si es echo, solo guardar
    if (event.message?.is_echo) {
      console.log('🔄 ECHO detectado - solo guardando mensaje enviado')
      if (event.message.text) {
        const messageData = {
          instagram_message_id: event.message.mid,
          sender_id: event.sender.id,
          recipient_id: event.recipient.id,
          message_text: event.message.text,
          message_type: 'sent',
          timestamp: new Date(event.timestamp).toISOString(),
          is_read: false,
          raw_data: {
            webhook_data: event,
            received_at: new Date().toISOString(),
            source: 'instagram_webhook',
            is_echo: true
          }
        }
        await supabase.from('instagram_messages').insert(messageData)
        console.log('💾 Echo guardado exitosamente')
      }
      return
    }

    // Verificar que hay mensaje real del usuario
    if (!event.message || !event.message.text) {
      console.log('⏭️ NO HAY MENSAJE DE TEXTO - saltando')
      return
    }

    console.log('✅ MENSAJE REAL DEL USUARIO DETECTADO')
    console.log('👤 SENDER ID:', event.sender.id)
    console.log('💬 MENSAJE DEL USUARIO:', event.message.text)

    // PASO 1: GUARDAR MENSAJE
    console.log('📝 ========== PASO 1: GUARDAR MENSAJE ==========')
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

    // Verificar si ya existe
    const { data: existingMessage } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('instagram_message_id', event.message.mid)
      .single()

    if (existingMessage) {
      console.log('⏭️ MENSAJE YA EXISTE - saltando')
      return
    }

    await supabase.from('instagram_messages').insert(messageData)
    console.log('✅ PASO 1 COMPLETADO: Mensaje guardado')

    // PASO 2: OBTENER CONVERSACIÓN COMPLETA Y GENERAR RESPUESTA INTELIGENTE
    console.log('📚 ========== PASO 2: ANALIZAR CONVERSACIÓN ==========')
    
    // Obtener TODA la conversación
    const { data: conversationHistory, error: historyError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${event.sender.id},recipient_id.eq.${event.sender.id}`)
      .order('timestamp', { ascending: true })

    if (historyError) {
      console.error('❌ ERROR OBTENIENDO HISTORIAL:', historyError)
      await sendSimpleResponse(supabase, event.sender.id, "¡Hola! ¿Cómo estás?")
      return
    }

    const messages = conversationHistory || []
    console.log(`📊 TOTAL MENSAJES EN CONVERSACIÓN: ${messages.length}`)

    // Crear contexto para el AI con TODA la conversación
    const conversationContext = messages
      .map(msg => {
        const isFromUser = msg.sender_id === event.sender.id
        const sender = isFromUser ? 'Usuario' : 'María'
        return `${sender}: ${msg.message_text}`
      })
      .join('\n')

    console.log('📖 =============== CONTEXTO COMPLETO ===============')
    console.log(conversationContext)
    console.log('📖 ===============================================')

    // PASO 3: GENERAR RESPUESTA INTELIGENTE
    console.log('🤖 ========== PASO 3: GENERAR RESPUESTA INTELIGENTE ==========')
    const aiResponse = await generateIntelligentResponse(conversationContext, event.message.text)
    
    // ENVIAR RESPUESTA
    console.log('📤 ========== ENVIANDO RESPUESTA ==========')
    console.log('💬 RESPUESTA GENERADA:', aiResponse)
    await sendResponse(supabase, event.sender.id, aiResponse)

    console.log('✅ ========== PROCESO COMPLETADO ==========')

  } catch (error) {
    console.error('❌ ERROR EN processMessagingEvent:', error)
    throw error
  }
}

async function generateIntelligentResponse(conversationContext: string, currentMessage: string): Promise<string> {
  console.log('🧠 GENERANDO RESPUESTA INTELIGENTE...')
  console.log('🔥 MENSAJE ACTUAL:', currentMessage)
  console.log('📚 CONTEXTO COMPLETO:', conversationContext)
  
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ NO HAY API KEY DE OPENAI - respuesta simple')
      return getSimpleContextualResponse(conversationContext, currentMessage)
    }

    // PROMPT COMPLETAMENTE REDISEÑADO PARA LEER EL CONTEXTO
    const prompt = `Eres María, una persona real que trabaja como asesora de viajes.

CONVERSACIÓN COMPLETA HASTA AHORA:
${conversationContext}

ÚLTIMO MENSAJE DEL USUARIO:
"${currentMessage}"

INSTRUCCIONES CRÍTICAS:
1. LEE TODA LA CONVERSACIÓN ANTERIOR para entender el contexto
2. Responde ESPECÍFICAMENTE al último mensaje del usuario
3. Si ya te has presentado antes, NO te vuelvas a presentar
4. Si el usuario dice "Hola" y ya han hablado antes, di algo como "¡Hola de nuevo!" o "¿Qué tal?"
5. Si pregunta algo específico, responde esa pregunta exacta
6. Si dice "Bien que tal tu?", responde como una persona normal
7. Sé NATURAL y HUMANA, nunca robótica
8. NUNCA uses frases genéricas como "¿En qué te puedo ayudar?"

EJEMPLOS DE RESPUESTAS NATURALES:
- Si dice "Hola" por primera vez → "¡Hola! Soy María, asesora de viajes ¿Cómo estás?"
- Si dice "Hola" y ya hablaron → "¡Hola de nuevo! ¿Qué tal todo?"
- Si dice "Bien que tal tu?" → "¡Todo bien por aquí! ¿Cómo va tu día?"
- Si pregunta algo específico → Responde esa pregunta específica

Responde de forma natural y específica al último mensaje:`

    console.log('📤 ENVIANDO PROMPT MEJORADO A OPENAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Eres María, una persona real que responde de forma natural. Lees TODO el contexto de la conversación y respondes específicamente al último mensaje.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    })

    console.log('📨 RESPUESTA DE OPENAI STATUS:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ERROR DETALLADO DE OPENAI:', errorText)
      return getSimpleContextualResponse(conversationContext, currentMessage)
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || "¡Hola! ¿Cómo estás?"
    
    console.log('🤖 RESPUESTA FINAL GENERADA:', aiMessage)
    return aiMessage.trim()

  } catch (error) {
    console.error('❌ ERROR DETALLADO EN generateIntelligentResponse:', error)
    return getSimpleContextualResponse(conversationContext, currentMessage)
  }
}

function getSimpleContextualResponse(conversationContext: string, currentMessage: string): string {
  console.log('🤖 GENERANDO RESPUESTA SIMPLE CONTEXTUAL')
  
  const lowerMessage = currentMessage.toLowerCase()
  const hasContext = conversationContext.includes('Usuario:')
  
  // Si ya han hablado antes
  if (hasContext) {
    if (lowerMessage.includes('hola')) {
      return "¡Hola de nuevo! ¿Qué tal todo?"
    }
    if (lowerMessage.includes('bien') && lowerMessage.includes('tu')) {
      return "¡Todo bien por aquí! ¿En qué más te puedo ayudar?"
    }
    if (lowerMessage.includes('como estas')) {
      return "¡Muy bien, gracias! ¿Y tú cómo estás?"
    }
  } else {
    // Primera vez que hablan
    if (lowerMessage.includes('hola')) {
      return "¡Hola! Soy María, asesora de viajes. ¿Cómo estás?"
    }
  }
  
  // Respuesta por defecto contextual
  return hasContext ? "Interesante, cuéntame más sobre eso." : "¡Hola! Soy María. ¿Cómo estás?"
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

async function sendSimpleResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('📨 ENVIANDO RESPUESTA SIMPLE:', messageText)
    
    const success = await sendInstagramMessage(senderId, messageText)
    
    if (success) {
      const sentMessageData = {
        instagram_message_id: `simple_response_${Date.now()}_${Math.random()}`,
        sender_id: 'ai_assistant_maria',
        recipient_id: senderId,
        message_text: messageText,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          ai_generated: false,
          source: 'webhook_simple_response'
        }
      }

      await supabase.from('instagram_messages').insert(sentMessageData)
    }
  } catch (error) {
    console.error('❌ ERROR EN sendSimpleResponse:', error)
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
