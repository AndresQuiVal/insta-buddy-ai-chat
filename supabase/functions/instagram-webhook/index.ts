
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
    console.log('🚀 ===============================================')
    console.log('🚀 INICIANDO PROCESAMIENTO DE EVENTO DE MENSAJE')
    console.log('🚀 ===============================================')

    // Verificar si es un echo (mensaje enviado por nosotros)
    if (event.message?.is_echo) {
      console.log('🔄 DETECTADO ECHO - mensaje enviado por nosotros, guardando pero no respondiendo')
      
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
        console.log('💾 Mensaje echo guardado exitosamente')
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

    // PASO 1: GUARDAR EL MENSAJE RECIBIDO
    console.log('📝 PASO 1: GUARDANDO MENSAJE RECIBIDO...')
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
    await supabase.from('instagram_messages').insert(messageData)
    console.log('✅ PASO 1 COMPLETADO: Mensaje guardado exitosamente')

    // PASO 2: ANALIZAR CONVERSACIÓN COMPLETA
    console.log('🔍 ===============================================')
    console.log('🔍 PASO 2: ANALIZANDO CONVERSACIÓN COMPLETA')
    console.log('🔍 ===============================================')
    
    await analyzeFullConversationAndRespond(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ ERROR EN processMessagingEvent:', error)
    throw error
  }
}

async function analyzeFullConversationAndRespond(supabase: any, senderId: string, currentMessage: string) {
  console.log('📚 OBTENIENDO HISTORIAL COMPLETO DE CONVERSACIÓN...')
  
  try {
    // Obtener TODA la conversación con esta persona
    const { data: conversationHistory, error: historyError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
      .order('timestamp', { ascending: true })

    if (historyError) {
      console.error('❌ ERROR OBTENIENDO HISTORIAL:', historyError)
      await sendSimpleResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
      return
    }

    const messages = conversationHistory || []
    console.log(`📊 TOTAL MENSAJES EN CONVERSACIÓN: ${messages.length}`)

    // IMPRIMIR HISTORIAL COMPLETO
    console.log('📖 ========== HISTORIAL COMPLETO ==========')
    messages.forEach((msg, index) => {
      const isFromUser = msg.sender_id === senderId
      const sender = isFromUser ? '👤 Usuario' : '🤖 María'
      const time = new Date(msg.timestamp).toLocaleString()
      console.log(`${index + 1}. [${time}] ${sender}: "${msg.message_text}"`)
    })
    console.log('📖 =======================================')

    // Obtener características configuradas
    console.log('🎯 OBTENIENDO CARACTERÍSTICAS CONFIGURADAS...')
    const { data: traitsData, error: traitsError } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (traitsError) {
      console.error('❌ ERROR OBTENIENDO CARACTERÍSTICAS:', traitsError)
      await sendSimpleResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
      return
    }

    const traits = traitsData || []
    console.log('🎯 CARACTERÍSTICAS CONFIGURADAS:')
    traits.forEach((trait, index) => {
      console.log(`${index + 1}. ${trait.trait}`)
    })

    // PASO 3: GENERAR RESPUESTA CON IA
    console.log('🤖 ===============================================')
    console.log('🤖 PASO 3: GENERANDO RESPUESTA CON IA')
    console.log('🤖 ===============================================')

    const aiResponse = await generateAIResponse(messages, traits, senderId, currentMessage)
    
    // PASO 4: ENVIAR RESPUESTA
    console.log('📤 ===============================================')
    console.log('📤 PASO 4: ENVIANDO RESPUESTA GENERADA')
    console.log('📤 ===============================================')
    console.log('💬 RESPUESTA A ENVIAR:', aiResponse)

    await sendResponse(supabase, senderId, aiResponse)

    console.log('✅ ===============================================')
    console.log('✅ PROCESO COMPLETO FINALIZADO EXITOSAMENTE')
    console.log('✅ ===============================================')

  } catch (error) {
    console.error('❌ ERROR EN analyzeFullConversationAndRespond:', error)
    await sendSimpleResponse(supabase, senderId, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
  }
}

async function generateAIResponse(messages: any[], traits: any[], senderId: string, currentMessage: string): Promise<string> {
  console.log('🧠 INICIANDO GENERACIÓN DE RESPUESTA CON IA...')
  
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ NO HAY API KEY DE OPENAI - usando respuesta básica')
      return "¡Hola! Soy María, asesora de viajes. ¿En qué te puedo ayudar?"
    }

    // Crear contexto de conversación para la IA
    const conversationContext = messages
      .filter(msg => msg.message_text && msg.message_text.trim() !== '')
      .map(msg => {
        const isFromUser = msg.sender_id === senderId
        return `${isFromUser ? 'Usuario' : 'María'}: ${msg.message_text}`
      })
      .join('\n')

    console.log('📝 CONTEXTO DE CONVERSACIÓN PARA IA:')
    console.log(conversationContext)

    // Crear lista de características para el prompt
    const traitsList = traits.map((trait, index) => `${index + 1}. ${trait.trait}`).join('\n')
    
    console.log('🎯 CARACTERÍSTICAS PARA IA:')
    console.log(traitsList)

    const prompt = `Eres María, una asesora de viajes experta. Tu trabajo es continuar la conversación de manera natural y hacer preguntas estratégicas para identificar si el prospecto cumple con las características del cliente ideal.

HISTORIAL DE CONVERSACIÓN:
${conversationContext}

CARACTERÍSTICAS DEL CLIENTE IDEAL A DESCUBRIR:
${traitsList}

MENSAJE ACTUAL DEL USUARIO: "${currentMessage}"

INSTRUCCIONES:
1. Responde de manera natural y amigable como María
2. Continúa la conversación basándote en el historial completo
3. Incluye preguntas estratégicas para descubrir si cumple con las características del cliente ideal
4. Mantén un tono conversacional y profesional
5. No seas demasiado directa con las preguntas comerciales

Responde SOLO con el mensaje que María debe enviar (máximo 2-3 oraciones):`

    console.log('📤 ENVIANDO PROMPT A OPENAI...')
    console.log('PROMPT COMPLETO:', prompt)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres María, asesora de viajes profesional y amigable. Respondes de manera natural y haces preguntas estratégicas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    console.log('📨 RESPUESTA HTTP DE OPENAI:', response.status, response.statusText)

    if (!response.ok) {
      console.error('❌ ERROR HTTP DE OPENAI:', response.status)
      throw new Error(`Error OpenAI: ${response.status}`)
    }

    const data = await response.json()
    console.log('📋 DATOS COMPLETOS DE OPENAI:', JSON.stringify(data, null, 2))
    
    const aiMessage = data.choices?.[0]?.message?.content || "¡Hola! Soy María. ¿En qué te puedo ayudar?"
    
    console.log('🤖 RESPUESTA GENERADA POR IA:', aiMessage)
    return aiMessage.trim()

  } catch (error) {
    console.error('❌ ERROR EN generateAIResponse:', error)
    return "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
  }
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('📨 PREPARANDO ENVÍO DE RESPUESTA')
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
          source: 'webhook_ai_response'
        }
      }

      await supabase.from('instagram_messages').insert(sentMessageData)
      console.log('✅ RESPUESTA GUARDADA EN BD EXITOSAMENTE')
    } else {
      console.error('❌ ERROR ENVIANDO MENSAJE A INSTAGRAM')
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
