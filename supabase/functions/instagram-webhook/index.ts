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

    // PASO 2: OBTENER Y ANALIZAR CONVERSACIÓN COMPLETA
    console.log('📚 ========== PASO 2: ANALIZAR CONVERSACIÓN ==========')
    
    // Obtener TODA la conversación
    const { data: conversationHistory, error: historyError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${event.sender.id},recipient_id.eq.${event.sender.id}`)
      .order('timestamp', { ascending: true })

    if (historyError) {
      console.error('❌ ERROR OBTENIENDO HISTORIAL:', historyError)
      await sendSimpleResponse(supabase, event.sender.id, "¡Hola! Soy María. ¿En qué te puedo ayudar?")
      return
    }

    const messages = conversationHistory || []
    console.log(`📊 TOTAL MENSAJES EN CONVERSACIÓN: ${messages.length}`)

    // IMPRIMIR CONVERSACIÓN COMPLETA
    console.log('📖 =============== CONVERSACIÓN COMPLETA ===============')
    console.log(`👤 USUARIO: ${event.sender.id}`)
    console.log(`📝 HISTORIAL DETALLADO:`)
    
    if (messages.length === 0) {
      console.log('⚠️ NO HAY MENSAJES PREVIOS')
    } else {
      messages.forEach((msg, index) => {
        const isFromUser = msg.sender_id === event.sender.id
        const sender = isFromUser ? '👤 Usuario' : '🤖 María'
        const time = new Date(msg.timestamp).toLocaleString('es-ES')
        const messageType = msg.message_type === 'received' ? '[RECIBIDO]' : '[ENVIADO]'
        
        console.log(`${index + 1}. ${messageType} [${time}] ${sender}: "${msg.message_text}"`)
      })
    }
    console.log('📖 ===============================================')

    // PASO 3: GENERAR RESPUESTA CON IA
    console.log('🤖 ========== PASO 3: GENERAR RESPUESTA CON IA ==========')
    const aiResponse = await generateAIResponse(messages, event.sender.id, event.message.text)
    
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

async function generateAIResponse(messages: any[], senderId: string, currentMessage: string): Promise<string> {
  console.log('🧠 GENERANDO RESPUESTA CON IA...')
  console.log('🔥 MENSAJE ACTUAL DEL USUARIO:', currentMessage)
  
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ NO HAY API KEY DE OPENAI')
      return "¡Hola! Soy María, asesora de viajes. ¿En qué te puedo ayudar?"
    }

    // Crear contexto de conversación simple
    const lastMessages = messages
      .filter(msg => msg.message_text && msg.message_text.trim() !== '')
      .slice(-5) // Solo últimos 5 mensajes
      .map(msg => {
        const isFromUser = msg.sender_id === senderId
        return `${isFromUser ? 'Usuario' : 'María'}: ${msg.message_text}`
      })
      .join('\n')

    console.log('📝 CONTEXTO PARA IA:')
    console.log('=====================================')
    console.log(lastMessages)
    console.log('=====================================')

    // NUEVO PROMPT ULTRA ESPECÍFICO
    const prompt = `El usuario te escribió exactamente esto: "${currentMessage}"

${lastMessages ? `Contexto previo:\n${lastMessages}\n` : ''}

Eres María, una asesora de viajes normal. Responde DIRECTAMENTE a lo que el usuario te escribió. 

REGLAS CRÍTICAS:
- Si dice "Hola" → responde "¡Hola! ¿Cómo estás?"
- Si pregunta tu nombre → responde "Soy María"
- Si pregunta qué haces → responde "Soy asesora de viajes"  
- Si pregunta sobre viajes → responde sobre viajes
- Si dice "Gracias" → responde "¡De nada!"
- Si dice algo random → responde de forma natural a eso específico

NUNCA respondas con frases genéricas como "¿En qué te puedo ayudar?". 

Responde SOLO al mensaje "${currentMessage}" de forma natural:`

    console.log('📤 ENVIANDO PROMPT ESPECÍFICO A OPENAI...')
    console.log('🎯 PROMPT:', prompt)

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
            content: 'Eres María, una persona real. Respondes de forma natural y específica a cada mensaje. NUNCA uses frases genéricas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 80,
        temperature: 0.8,
      }),
    })

    console.log('📨 RESPUESTA DE OPENAI STATUS:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ERROR DETALLADO DE OPENAI:', errorText)
      throw new Error(`Error OpenAI: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || "¡Hola! ¿Cómo estás?"
    
    console.log('🤖 RESPUESTA FINAL GENERADA:', aiMessage)
    return aiMessage.trim()

  } catch (error) {
    console.error('❌ ERROR DETALLADO EN generateAIResponse:', error)
    return "¡Hola! ¿Cómo estás?"
  }
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
