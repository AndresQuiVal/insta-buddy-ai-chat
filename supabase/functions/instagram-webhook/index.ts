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

    // 🔥 ANÁLISIS ESTRATÉGICO COMPLETO
    const analysisResult = await performStrategicAnalysis(supabase, event.sender.id, event.message.text)
    
    // 🔥 RESPUESTA AUTOMÁTICA ESTRATÉGICA
    await sendStrategicAutoResponse(supabase, event.sender.id, event.message.text, analysisResult)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function performStrategicAnalysis(supabase: any, senderId: string, userMessage: string) {
  try {
    console.log('🔍 Iniciando análisis estratégico para:', senderId)

    // Obtener características ideales configuradas
    const { data: idealTraits } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (!idealTraits || idealTraits.length === 0) {
      console.log('⚠️ No hay características ideales configuradas')
      return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
    }

    console.log(`🎯 Analizando contra ${idealTraits.length} características ideales`)

    // Obtener historial completo de mensajes del usuario
    const { data: allMessages } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .eq('message_type', 'received')
      .order('created_at', { ascending: true })

    if (!allMessages || allMessages.length === 0) {
      console.log('⚠️ No se encontraron mensajes para analizar')
      return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
    }

    // Crear texto completo de la conversación
    const conversationText = allMessages
      .map(msg => msg.message_text)
      .join(' ')
      .toLowerCase()

    console.log('📝 Analizando conversación:', conversationText.substring(0, 200) + '...')

    // Análisis con palabras clave mejorado
    const analysis = await analyzeWithAdvancedKeywords(conversationText, idealTraits)

    console.log('📊 Resultado del análisis:', analysis)

    // Guardar análisis en la base de datos
    if (analysis.matchPoints > 0) {
      await saveStrategicAnalysis(supabase, senderId, analysis, allMessages.length)
    }

    return analysis

  } catch (error) {
    console.error('❌ Error en análisis estratégico:', error)
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
  }
}

function analyzeWithAdvancedKeywords(conversationText: string, traits: any[]): any {
  // Mapa de palabras clave extendido y más preciso
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "interesa", "interesan", "producto", "servicio", "necesito", "busco", "quiero", 
      "comprar", "información", "precio", "cotización", "cruceros", "viajes", "tours",
      "me gusta", "me interesa", "quisiera", "podría", "opciones", "paquetes",
      "disponible", "ofrecen", "tienen", "propuesta", "conocer más"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pago", "precio", "costo", "puedo pagar", "tengo dinero",
      "cuanto cuesta", "inversión", "financiar", "vale la pena", "económico", "costoso",
      "dispongo", "recursos", "efectivo", "tarjeta", "financiamiento"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "listo", "comprar", "reservar", "confirmar", "ahora", "ya", "pronto",
      "cuando", "programar", "de acuerdo", "perfecto", "adelante", "hagamos", "vamos",
      "inmediato", "urgente", "necesito ya", "apartartodos"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "estoy", "ubicado", "ciudad", "zona", "mexico", "guadalajara", "monterrey",
      "envio", "entrega", "cerca", "dirección", "domicilio", "local", "región", "país"
    ]
  }

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
      console.log(`✅ Característica detectada: ${trait.trait}`)
    }
  })

  return {
    matchPoints: metTraits.length,
    metTraits,
    metTraitIndices
  }
}

async function saveStrategicAnalysis(supabase: any, senderId: string, analysis: any, messageCount: number) {
  try {
    console.log('💾 Guardando análisis estratégico:', { senderId, analysis, messageCount })

    const analysisData = {
      sender_id: senderId,
      match_points: analysis.matchPoints,
      met_traits: analysis.metTraits,
      met_trait_indices: analysis.metTraitIndices,
      last_analyzed_at: new Date().toISOString(),
      message_count: messageCount,
      analysis_data: {
        timestamp: new Date().toISOString(),
        strategic_analysis: true,
        source: 'webhook_strategic'
      }
    }

    const { data, error } = await supabase
      .from('prospect_analysis')
      .upsert(analysisData, { 
        onConflict: 'sender_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('❌ Error guardando análisis:', error)
      throw error
    }

    console.log('✅ Análisis estratégico guardado:', data)
  } catch (error) {
    console.error('❌ Error en saveStrategicAnalysis:', error)
  }
}

async function sendStrategicAutoResponse(supabase: any, senderId: string, userMessage: string, analysisResult: any) {
  try {
    console.log('🤖 Iniciando respuesta estratégica para:', senderId)

    // Verificar configuración de IA
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_enabled, ai_delay, ia_persona')
      .limit(1)

    console.log('🔍 Configuración obtenida:', { settings, settingsError })

    let aiConfig = {
      ai_enabled: true,
      ai_delay: 3,
      ia_persona: 'Eres un vendedor experto que ayuda a calificar prospectos mediante conversación natural.'
    }

    if (settings && settings.length > 0) {
      aiConfig = {
        ai_enabled: settings[0].ai_enabled !== false,
        ai_delay: settings[0].ai_delay || 3,
        ia_persona: settings[0].ia_persona || aiConfig.ia_persona
      }
    }

    console.log('⚙️ Configuración de IA:', aiConfig)

    if (!aiConfig.ai_enabled) {
      console.log('⚠️ IA no está habilitada, saltando respuesta automática')
      return
    }

    // Obtener características ideales para la estrategia
    const { data: idealTraits } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (!idealTraits || idealTraits.length === 0) {
      console.log('⚠️ No hay características ideales, usando respuesta genérica')
      await sendGenericResponse(supabase, senderId, aiConfig)
      return
    }

    const aiDelay = (aiConfig.ai_delay || 3) * 1000
    console.log(`⏰ Esperando ${aiDelay}ms antes de responder...`)
    
    await new Promise(resolve => setTimeout(resolve, aiDelay))

    // Obtener historial de conversación
    const { data: conversationHistory } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Generar respuesta estratégica usando OpenAI
    const aiResponse = await generateStrategicAIResponse(
      userMessage, 
      conversationHistory, 
      analysisResult,
      idealTraits,
      aiConfig.ia_persona
    )

    if (aiResponse) {
      console.log('📤 Enviando respuesta estratégica:', aiResponse)
      
      const success = await sendInstagramMessage(senderId, aiResponse)
      
      if (success) {
        await supabase
          .from('instagram_messages')
          .insert({
            instagram_message_id: `strategic_${Date.now()}_${Math.random()}`,
            sender_id: 'ai_strategic_assistant',
            recipient_id: senderId,
            message_text: aiResponse,
            message_type: 'sent',
            timestamp: new Date().toISOString(),
            raw_data: {
              ai_generated: true,
              strategic_response: true,
              analysis_result: analysisResult,
              source: 'webhook_strategic_response'
            }
          })

        console.log('✅ Respuesta estratégica enviada y guardada')
      } else {
        console.error('❌ Error enviando mensaje estratégico a Instagram')
      }
    } else {
      console.log('⚠️ No se pudo generar respuesta estratégica')
    }

  } catch (error) {
    console.error('❌ Error en respuesta estratégica:', error)
  }
}

async function generateStrategicAIResponse(
  userMessage: string, 
  conversationHistory: any[], 
  analysisResult: any,
  idealTraits: any[],
  persona: string
): Promise<string> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI configurada')
      return getStrategicFallbackResponse(analysisResult, idealTraits)
    }

    // Crear prompt estratégico basado en el progreso
    const strategicPrompt = createStrategicPrompt(analysisResult, idealTraits, persona)

    // Crear contexto de conversación
    const messages = [
      {
        role: 'system',
        content: strategicPrompt
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

    console.log('🧠 Generando respuesta estratégica con OpenAI...')

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
        temperature: 0.8
      })
    })

    if (!response.ok) {
      console.error('❌ Error en OpenAI API:', await response.text())
      return getStrategicFallbackResponse(analysisResult, idealTraits)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('✅ Respuesta estratégica generada:', aiResponse)
    return aiResponse

  } catch (error) {
    console.error('❌ Error generando respuesta estratégica:', error)
    return getStrategicFallbackResponse(analysisResult, idealTraits)
  }
}

function createStrategicPrompt(analysisResult: any, idealTraits: any[], persona: string): string {
  const { matchPoints, metTraits } = analysisResult
  const totalTraits = idealTraits.length
  const pendingTraits = idealTraits.filter(trait => !metTraits.includes(trait.trait))
  const nextTrait = pendingTraits[0]

  return `
${persona}

🎯 TU MISIÓN ESTRATÉGICA:
Mantener una conversación NATURAL mientras descubres sistemáticamente si este prospecto cumple las características del cliente ideal.

📊 PROGRESO ACTUAL:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${matchPoints}/${totalTraits}
- ✅ YA CUMPLE: ${metTraits.join(' | ') || 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait ? nextTrait.trait : 'TODAS CONFIRMADAS - BUSCAR CONTACTO'}

🗣️ ESTRATEGIA DE CONVERSACIÓN:
${matchPoints === 0 ? `
🌟 INICIO - Conexión + Primer filtrado
- Saluda de forma auténtica y crea rapport
- Haz 1-2 preguntas de conexión personal
- Incluye UNA pregunta estratégica para descubrir: "${nextTrait?.trait}"
- La pregunta debe ser NATURAL, no obvia
` : matchPoints < totalTraits ? `
💬 FILTRADO ACTIVO - Conversación con propósito
- Progreso: ${matchPoints}/${totalTraits} características confirmadas
- ENFÓCATE en descubrir: "${nextTrait?.trait}"
- Haz preguntas de seguimiento naturales
- Conecta con sus respuestas anteriores
- Sé empático pero mantén el objetivo claro
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir contacto
- ¡EXCELENTE! Este prospecto cumple las ${totalTraits} características
- AHORA busca conseguir una llamada o WhatsApp
- Sé más directo: "Me parece que podemos trabajar juntos, ¿te gustaría que platicáramos por teléfono?"
- Ofrece valor específico y crea urgencia suave
`}

🎭 REGLAS:
1. Responde de forma NATURAL y conversacional
2. NUNCA menciones que estás evaluando características
3. Haz máximo 1-2 preguntas por mensaje
4. Mantén el tono amigable y profesional
5. Respuesta máxima: 200 caracteres para Instagram

RESPONDE SOLO con tu siguiente mensaje natural y estratégico.
  `.trim()
}

function getStrategicFallbackResponse(analysisResult: any, idealTraits: any[]): string {
  const { matchPoints } = analysisResult
  const totalTraits = idealTraits.length

  if (matchPoints === 0) {
    const responses = [
      "¡Hola! Me da mucho gusto conectar contigo. ¿Qué tipo de cosas te interesan?",
      "¡Perfecto! Gracias por escribir. ¿En qué puedo ayudarte hoy?",
      "¡Excelente! ¿Qué te motiva a contactarme?",
      "¡Hola! ¿Hay algo específico en lo que pueda asistirte?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else if (matchPoints < totalTraits) {
    const responses = [
      "Interesante lo que me comentas. ¿Has considerado hacer algo así antes?",
      "Me parece genial. ¿Qué te motiva exactamente sobre esto?",
      "Perfecto. ¿Es algo que has estado pensando por mucho tiempo?",
      "Excelente. ¿Cómo te imaginas que esto podría funcionar para ti?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else {
    const responses = [
      "Me parece que tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?",
      "Perfecto! Creo que podemos trabajar juntos. ¿Cuándo podríamos hablar?",
      "Excelente! Tengo algunas ideas que creo te van a encantar. ¿Coordinamos una llamada?",
      "¡Genial! ¿Te parece si agendamos una llamada esta semana?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }
}

async function sendGenericResponse(supabase: any, senderId: string, aiConfig: any) {
  const responses = [
    "¡Hola! Gracias por escribir. ¿En qué puedo ayudarte?",
    "Me alegra que te hayas comunicado. ¿Qué necesitas saber?",
    "¡Perfecto! Estoy aquí para ayudarte.",
    "Gracias por tu mensaje. ¿Cómo puedo asistirte?"
  ]
  
  const response = responses[Math.floor(Math.random() * responses.length)]
  
  const aiDelay = (aiConfig.ai_delay || 3) * 1000
  await new Promise(resolve => setTimeout(resolve, aiDelay))
  
  const success = await sendInstagramMessage(senderId, response)
  
  if (success) {
    await supabase
      .from('instagram_messages')
      .insert({
        instagram_message_id: `generic_${Date.now()}_${Math.random()}`,
        sender_id: 'ai_assistant',
        recipient_id: senderId,
        message_text: response,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          ai_generated: true,
          generic_response: true,
          source: 'webhook_generic_response'
        }
      })
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
