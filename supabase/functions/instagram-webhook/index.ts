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

    // 🔥 ANÁLISIS Y RESPUESTA ESTRATÉGICA COMPLETA
    await handleStrategicAnalysisAndResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function handleStrategicAnalysisAndResponse(supabase: any, senderId: string, userMessage: string) {
  try {
    console.log('🎯 INICIANDO ANÁLISIS Y RESPUESTA ESTRATÉGICA COMPLETA')
    console.log(`👤 Sender ID: ${senderId}`)
    console.log(`💬 Mensaje: "${userMessage}"`)

    // 1. OBTENER CARACTERÍSTICAS IDEALES DESDE LA BASE DE DATOS
    console.log('🔍 Obteniendo características ideales desde la base de datos...')
    const { data: idealTraitsData, error: traitsError } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (traitsError) {
      console.error('❌ Error obteniendo características:', traitsError)
      await sendGenericResponse(supabase, senderId)
      return
    }

    if (!idealTraitsData || idealTraitsData.length === 0) {
      console.log('⚠️ No se encontraron características ideales en la base de datos')
      await sendGenericResponse(supabase, senderId)
      return
    }

    const idealTraits = idealTraitsData.map(t => t.trait)
    console.log('✅ Características ideales cargadas:', idealTraits)

    // 2. OBTENER HISTORIAL COMPLETO DE CONVERSACIÓN
    console.log('📚 Obteniendo historial completo de conversación...')
    const { data: allMessages, error: messagesError } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .eq('message_type', 'received')
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
      await sendGenericResponse(supabase, senderId)
      return
    }

    const conversationText = allMessages ? allMessages.map(msg => msg.message_text).join(' ') : userMessage
    console.log(`📝 Texto completo de conversación (${conversationText.length} chars):`, conversationText.substring(0, 300) + '...')

    // 3. ANÁLISIS ESTRATÉGICO CON PALABRAS CLAVE MEJORADAS
    console.log('🧠 Realizando análisis estratégico...')
    const analysis = analyzeWithAdvancedKeywords(conversationText, idealTraits)
    console.log('📊 Resultado del análisis:', analysis)

    // 4. GUARDAR ANÁLISIS EN LA BASE DE DATOS
    if (analysis.matchPoints > 0) {
      console.log('💾 Guardando análisis en la base de datos...')
      await saveAnalysisToDatabase(supabase, senderId, analysis, allMessages?.length || 1)
    }

    // 5. GENERAR RESPUESTA ESTRATÉGICA CON OPENAI
    console.log('🤖 Generando respuesta estratégica...')
    const strategicResponse = await generateStrategicResponse(
      supabase, 
      senderId, 
      userMessage, 
      conversationText,
      analysis, 
      idealTraits
    )

    console.log('📤 Respuesta estratégica generada:', strategicResponse)

    // 6. ENVIAR RESPUESTA AUTOMÁTICA
    await sendResponseWithDelay(supabase, senderId, strategicResponse)

  } catch (error) {
    console.error('❌ Error en análisis y respuesta estratégica:', error)
    await sendGenericResponse(supabase, senderId)
  }
}

function analyzeWithAdvancedKeywords(conversationText: string, idealTraits: string[]): any {
  console.log('🔍 ANÁLISIS CON PALABRAS CLAVE AVANZADAS')
  
  const text = conversationText.toLowerCase()
  
  // Mapa de palabras clave MUY específico por característica
  const keywordMap: Record<string, string[]> = {
    "le gustan los cruceros": [
      "crucero", "cruceros", "barco", "navegar", "travesia", "mar", "oceano",
      "caribe", "mediterraneo", "viaje en barco", "me gusta navegar", "amo el mar",
      "me encantan los cruceros", "he estado en cruceros", "quiero ir en crucero"
    ],
    "tiene 2 perros": [
      "perro", "perros", "mascota", "mascotas", "can", "canes", "cachorro", "cachorros",
      "tengo perros", "mis perros", "dos perros", "2 perros", "un par de perros",
      "me gustan los perros", "amo los perros", "pastor", "labrador", "golden"
    ],
    "es de españa": [
      "españa", "español", "española", "madrid", "barcelona", "valencia", "sevilla",
      "andalucia", "cataluña", "galicia", "pais vasco", "soy español", "soy española",
      "vivo en españa", "desde españa", "aqui en españa", "peninsula iberica"
    ],
    "le gustan las hamburguesas": [
      "hamburguesa", "hamburguesas", "burger", "burgers", "carne", "comida rapida",
      "me gustan las hamburguesas", "amo las hamburguesas", "como hamburguesas",
      "mcdonalds", "burger king", "fast food", "sandwich de carne"
    ]
  }
  
  const metTraits: string[] = []
  const metTraitIndices: number[] = []
  
  idealTraits.forEach((trait, index) => {
    const keywords = keywordMap[trait.toLowerCase()] || []
    console.log(`🎯 Analizando: "${trait}"`)
    console.log(`   Palabras clave: ${keywords.slice(0, 5).join(', ')}...`)
    
    let matchFound = false
    const foundKeywords: string[] = []
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchFound = true
        foundKeywords.push(keyword)
      }
    }
    
    console.log(`   Encontradas: ${foundKeywords.join(', ')}`)
    console.log(`   ¿Match?: ${matchFound ? '✅ SÍ' : '❌ NO'}`)
    
    if (matchFound) {
      metTraits.push(trait)
      metTraitIndices.push(index)
    }
  })
  
  return {
    matchPoints: metTraits.length,
    metTraits,
    metTraitIndices
  }
}

async function saveAnalysisToDatabase(supabase: any, senderId: string, analysis: any, messageCount: number) {
  try {
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
    } else {
      console.log('✅ Análisis guardado exitosamente')
    }
  } catch (error) {
    console.error('❌ Error en saveAnalysisToDatabase:', error)
  }
}

async function generateStrategicResponse(
  supabase: any,
  senderId: string, 
  userMessage: string,
  conversationText: string,
  analysis: any,
  idealTraits: string[]
): Promise<string> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI, usando respuesta estratégica predefinida')
      return getStrategicFallbackResponse(analysis, idealTraits)
    }

    // Crear prompt ULTRA estratégico basado en el progreso
    const strategicPrompt = createAdvancedStrategicPrompt(analysis, idealTraits, conversationText)

    console.log('🧠 Enviando prompt estratégico a OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: strategicPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      console.error('❌ Error en OpenAI API:', await response.text())
      return getStrategicFallbackResponse(analysis, idealTraits)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('✅ Respuesta estratégica de OpenAI:', aiResponse)
    return aiResponse

  } catch (error) {
    console.error('❌ Error generando respuesta estratégica:', error)
    return getStrategicFallbackResponse(analysis, idealTraits)
  }
}

function createAdvancedStrategicPrompt(analysis: any, idealTraits: string[], conversationText: string): string {
  const { matchPoints, metTraits } = analysis
  const totalTraits = idealTraits.length
  const pendingTraits = idealTraits.filter(trait => !metTraits.includes(trait))
  const nextTrait = pendingTraits[0]

  return `
Eres un VENDEDOR EXPERTO que mantiene conversaciones NATURALES mientras descubre estratégicamente si el prospecto cumple características específicas del cliente ideal.

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${idealTraits.map((trait, i) => `${i+1}. ${trait}`).join('\n')}

📊 PROGRESO ACTUAL DEL PROSPECTO:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${matchPoints}/${totalTraits}
- ✅ CUMPLE: ${metTraits.join(' | ') || 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait || 'TODAS CONFIRMADAS - BUSCAR CONTACTO'}

📝 CONTEXTO DE CONVERSACIÓN:
"${conversationText.substring(0, 500)}..."

🗣️ TU ESTRATEGIA ESPECÍFICA:
${matchPoints === 0 ? `
🌟 INICIO - Conexión + Primer filtrado
- Saluda de forma auténtica y natural
- Crea rapport inicial con 1-2 comentarios empáticos
- Haz UNA pregunta estratégica INDIRECTA para descubrir: "${nextTrait}"
- EJEMPLO para "${nextTrait}": 
  * Si es sobre cruceros: "¿Qué tipo de viajes o experiencias te emocionan más?"
  * Si es sobre perros: "¿Tienes alguna mascota o animal favorito?"
  * Si es sobre España: "¿De qué parte del mundo me escribes?"
  * Si es sobre hamburguesas: "¿Cuál es tu tipo de comida favorita?"
` : matchPoints < totalTraits ? `
💬 FILTRADO ACTIVO - Progreso ${matchPoints}/${totalTraits}
- Reconoce y conecta con lo que ya sabes sobre él
- ENFÓCATE específicamente en descubrir: "${nextTrait}"
- Haz una pregunta estratégica NATURAL para revelar esta característica
- Conecta la pregunta con algo que ya dijeron
- EJEMPLO para "${nextTrait}":
  * Si es sobre cruceros: "Suena genial! ¿Has pensado en hacer algún viaje especial, como un crucero?"
  * Si es sobre perros: "Me da curiosidad, ¿tienes alguna mascota en casa?"
  * Si es sobre España: "Perfecto! ¿Eres de España o de otro país?"
  * Si es sobre hamburguesas: "¡Excelente! ¿Eres de los que disfruta una buena hamburguesa?"
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir llamada/WhatsApp
- ¡PERFECTO! Este prospecto cumple TODAS las ${totalTraits} características
- AHORA tu objetivo es conseguir una llamada o WhatsApp
- Sé DIRECTO: "Me parece que tenemos mucho en común, ¿te gustaría que platicáramos por teléfono?"
- Ofrece valor: "Tengo algunas ideas que creo te van a encantar"
- Crea urgencia suave: "¿Te parece si coordinamos una llamada esta semana?"
`}

🎭 REGLAS FUNDAMENTALES:
1. **Conversación NATURAL** - Nunca suenes como un bot o vendedor agresivo
2. **UNA pregunta por mensaje** - No bombardees con preguntas
3. **Conecta emocionalmente** - Muestra interés genuino
4. **NUNCA reveles** que estás evaluando características específicas
5. **Máximo 150 caracteres** para Instagram

💡 EJEMPLOS DE PREGUNTAS ESTRATÉGICAS NATURALES:
- "¿Qué tipo de cosas te emocionan o te apasionan?"
- "¿Tienes algún hobby o pasatiempo favorito?"
- "¿De dónde me escribes? Me gusta conocer gente de diferentes lugares"
- "¿Cuál dirías que es tu tipo de comida o experiencia favorita?"

RESPONDE SOLO con tu siguiente mensaje estratégico, natural y conversacional de máximo 150 caracteres.
  `.trim()
}

function getStrategicFallbackResponse(analysis: any, idealTraits: string[]): string {
  const { matchPoints } = analysis
  const totalTraits = idealTraits.length

  if (matchPoints === 0) {
    const responses = [
      "¡Hola! Me da mucho gusto conectar contigo. ¿Qué tipo de cosas te emocionan más en la vida?",
      "¡Perfecto! Gracias por escribir. ¿Cuáles son tus pasatiempos o actividades favoritas?",
      "¡Excelente! ¿De qué parte del mundo me escribes? Me encanta conocer gente nueva.",
      "¡Hola! ¿Hay algo específico que te apasione o te haga sentir emocionado?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else if (matchPoints < totalTraits) {
    const responses = [
      "Interesante lo que me comentas. ¿Hay algo más que te guste hacer en tu tiempo libre?",
      "Me parece genial. ¿Tienes algún otro hobby o pasión que te emocione?",
      "Perfecto. ¿Qué otras cosas disfrutas hacer cuando tienes tiempo?",
      "Excelente. ¿Hay algo más que te defina o caracterice?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else {
    const responses = [
      "¡Increíble! Tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?",
      "¡Perfecto! Creo que podríamos conectar muy bien. ¿Cuándo podríamos hablar?",
      "¡Excelente! Me encantaría conocerte mejor. ¿Te parece si coordinamos una llamada?",
      "¡Genial! Tengo algunas ideas que creo te van a fascinar. ¿Hablamos por teléfono?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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
      // Guardar mensaje enviado en la base de datos
      await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `strategic_${Date.now()}_${Math.random()}`,
          sender_id: 'ai_strategic_assistant',
          recipient_id: senderId,
          message_text: messageText,
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: {
            ai_generated: true,
            strategic_response: true,
            source: 'webhook_strategic_response'
          }
        })

      console.log('✅ Respuesta estratégica enviada y guardada exitosamente')
    } else {
      console.error('❌ Error enviando respuesta estratégica')
    }

  } catch (error) {
    console.error('❌ Error en sendResponseWithDelay:', error)
  }
}

async function sendGenericResponse(supabase: any, senderId: string) {
  const responses = [
    "¡Hola! Gracias por escribir. ¿En qué puedo ayudarte?",
    "Me alegra que te hayas comunicado. ¿Qué necesitas saber?",
    "¡Perfecto! Estoy aquí para ayudarte.",
    "Gracias por tu mensaje. ¿Cómo puedo asistirte?"
  ]
  
  const response = responses[Math.floor(Math.random() * responses.length)]
  await sendResponseWithDelay(supabase, senderId, response)
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
