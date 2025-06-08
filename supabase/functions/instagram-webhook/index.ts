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

    // Analizar automáticamente el mensaje
    await analyzeMessage(supabase, event.sender.id, event.message.text)

    // 🔥 RESPUESTA AUTOMÁTICA DE IA
    await sendAutoResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function sendAutoResponse(supabase: any, senderId: string, userMessage: string) {
  try {
    console.log('🤖 Iniciando respuesta automática para:', senderId)

    // Verificar si la IA está habilitada
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_enabled, ai_delay, ia_persona')
      .single()

    if (!settings || !settings.ai_enabled) {
      console.log('⚠️ IA no está habilitada, saltando respuesta automática')
      return
    }

    // Obtener configuraciones de IA
    const aiDelay = (settings.ai_delay || 3) * 1000 // Convertir a milisegundos
    const persona = settings.ia_persona || 'Eres un asistente amigable y útil.'

    console.log(`⏰ Esperando ${aiDelay}ms antes de responder...`)
    
    // Esperar el delay configurado
    await new Promise(resolve => setTimeout(resolve, aiDelay))

    // Obtener historial de conversación
    const { data: conversationHistory } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Generar respuesta con IA
    const aiResponse = await generateAIResponse(userMessage, conversationHistory, persona)

    if (aiResponse) {
      // Enviar mensaje de respuesta
      const success = await sendInstagramMessage(senderId, aiResponse)
      
      if (success) {
        // Guardar el mensaje enviado en la base de datos
        await supabase
          .from('instagram_messages')
          .insert({
            instagram_message_id: `sent_${Date.now()}_${Math.random()}`,
            sender_id: 'ai_assistant',
            recipient_id: senderId,
            message_text: aiResponse,
            message_type: 'sent',
            timestamp: new Date().toISOString(),
            raw_data: {
              ai_generated: true,
              source: 'instagram_webhook_auto_response'
            }
          })

        console.log('✅ Respuesta automática enviada y guardada')
      }
    }

  } catch (error) {
    console.error('❌ Error en respuesta automática:', error)
  }
}

async function generateAIResponse(userMessage: string, conversationHistory: any[], persona: string): Promise<string> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI configurada')
      return getSimpleResponse(userMessage)
    }

    // Crear contexto de conversación
    const messages = [
      {
        role: 'system',
        content: `${persona}\n\nResponde de manera amigable y útil. Mantén las respuestas concisas (máximo 200 caracteres para Instagram). Eres un asistente que ayuda a calificar prospectos potenciales.`
      }
    ]

    // Agregar historial reciente
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-5).forEach(msg => {
        if (msg.message_type === 'received') {
          messages.push({ role: 'user', content: msg.message_text })
        } else if (msg.message_type === 'sent') {
          messages.push({ role: 'assistant', content: msg.message_text })
        }
      })
    }

    // Agregar mensaje actual
    messages.push({ role: 'user', content: userMessage })

    console.log('🧠 Generando respuesta con OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      console.error('❌ Error en OpenAI API:', await response.text())
      return getSimpleResponse(userMessage)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('✅ Respuesta generada con IA:', aiResponse)
    return aiResponse

  } catch (error) {
    console.error('❌ Error generando respuesta con IA:', error)
    return getSimpleResponse(userMessage)
  }
}

function getSimpleResponse(userMessage: string): string {
  const responses = [
    "¡Hola! Gracias por escribir. ¿En qué puedo ayudarte?",
    "Me alegra que te hayas comunicado. ¿Qué necesitas saber?",
    "¡Perfecto! Estoy aquí para ayudarte.",
    "Gracias por tu mensaje. ¿Cómo puedo asistirte?",
    "¡Excelente! ¿En qué puedo ser de utilidad?"
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
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

async function analyzeMessage(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('🔍 Starting automatic analysis for sender:', senderId)

    // Obtener características ideales habilitadas
    const { data: traits } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (!traits || traits.length === 0) {
      console.log('⚠️ No ideal traits configured, skipping analysis')
      return
    }

    console.log('🎯 Found', traits.length, 'ideal traits for analysis')

    // Obtener todo el historial de mensajes del usuario
    const { data: allMessages } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .eq('message_type', 'received')
      .order('created_at', { ascending: true })

    if (!allMessages || allMessages.length === 0) {
      console.log('⚠️ No messages found for sender:', senderId)
      return
    }

    // Crear texto completo de la conversación
    const conversationText = allMessages
      .map(msg => msg.message_text)
      .join(' ')
      .toLowerCase()

    console.log('📝 Analyzing conversation text:', conversationText.substring(0, 200) + '...')

    // Análisis básico por palabras clave
    const analysis = analyzeWithKeywords(conversationText, traits)

    console.log('📊 Analysis result:', analysis)

    // Guardar análisis si hay coincidencias
    if (analysis.matchPoints > 0) {
      await saveAnalysis(supabase, senderId, analysis, allMessages.length)
    }

  } catch (error) {
    console.error('❌ Error in automatic analysis:', error)
  }
}

function analyzeWithKeywords(conversationText: string, traits: any[]): any {
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "interesa", "interesan", "producto", "servicio", "necesito", "busco", "quiero", 
      "comprar", "información", "precio", "cotización", "cruceros", "viajes", "tours"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pago", "precio", "costo", "puedo pagar", "tengo dinero",
      "cuanto cuesta", "inversión", "financiar"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "listo", "comprar", "reservar", "confirmar", "ahora", "ya", "pronto",
      "cuando", "programar", "de acuerdo"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "estoy", "ubicado", "ciudad", "zona", "mexico", "guadalajara", "monterrey",
      "envio", "entrega", "cerca"
    ]
  };

  const metTraits: string[] = []
  const metTraitIndices: number[] = []

  traits.forEach((trait, index) => {
    const keywords = keywordMap[trait.trait] || []
    const hasMatch = keywords.some(keyword => 
      conversationText.includes(keyword.toLowerCase())
    )

    if (hasMatch) {
      metTraits.push(trait.trait)
      metTraitIndices.push(index)
      console.log('✅ Trait detected:', trait.trait)
    }
  })

  return {
    matchPoints: metTraits.length,
    metTraits,
    metTraitIndices
  }
}

async function saveAnalysis(supabase: any, senderId: string, analysis: any, messageCount: number) {
  try {
    console.log('💾 Saving analysis to database:', { senderId, analysis, messageCount })

    const analysisData = {
      sender_id: senderId,
      match_points: analysis.matchPoints,
      met_traits: analysis.metTraits,
      met_trait_indices: analysis.metTraitIndices,
      last_analyzed_at: new Date().toISOString(),
      message_count: messageCount,
      analysis_data: {
        timestamp: new Date().toISOString(),
        automatic_analysis: true,
        source: 'webhook'
      }
    }

    const { data, error } = await supabase
      .from('prospect_analysis')
      .upsert(analysisData, { 
        onConflict: 'sender_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('❌ Error saving analysis:', error)
      throw error
    }

    console.log('✅ Analysis saved successfully:', data)
  } catch (error) {
    console.error('❌ Error in saveAnalysis:', error)
    throw error
  }
}
