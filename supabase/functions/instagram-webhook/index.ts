
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

    // 🔥 ANÁLISIS Y RESPUESTA ESTRATÉGICA MEJORADA
    await handleStrategicAnalysisAndResponse(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function handleStrategicAnalysisAndResponse(supabase: any, senderId: string, currentMessage: string) {
  try {
    console.log('🎯 INICIANDO ANÁLISIS ESTRATÉGICO MEJORADO')
    console.log(`👤 Sender ID: ${senderId}`)
    console.log(`💬 Mensaje actual: "${currentMessage}"`)

    // 1. OBTENER CARACTERÍSTICAS IDEALES DESDE LA BASE DE DATOS
    console.log('🔍 Obteniendo características ideales...')
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
      console.log('⚠️ No hay características ideales configuradas')
      await sendGenericResponse(supabase, senderId)
      return
    }

    console.log('✅ Características ideales cargadas:', idealTraitsData.map(t => t.trait))

    // 2. OBTENER TODO EL HISTORIAL DE CONVERSACIÓN COMPLETO
    console.log('📚 Obteniendo historial COMPLETO de conversación...')
    const { data: allMessages, error: messagesError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
      await sendGenericResponse(supabase, senderId)
      return
    }

    // 3. CONSTRUIR HISTORIAL COMPLETO DE CONVERSACIÓN
    const conversationHistory = allMessages || []
    const fullConversationText = conversationHistory
      .map(msg => `${msg.message_type === 'received' ? 'Usuario' : 'IA'}: ${msg.message_text}`)
      .join('\n')

    console.log(`📝 Historial completo (${conversationHistory.length} mensajes):`)
    console.log(fullConversationText.substring(0, 500) + '...')

    // 4. ANÁLISIS ESTRATÉGICO MEJORADO
    console.log('🧠 Realizando análisis estratégico completo...')
    const analysis = await analyzeConversationStrategically(fullConversationText, idealTraitsData)
    console.log('📊 Resultado del análisis:', analysis)

    // 5. GUARDAR ANÁLISIS EN LA BASE DE DATOS
    if (analysis.matchPoints > 0) {
      console.log('💾 Guardando análisis...')
      await saveAnalysisToDatabase(supabase, senderId, analysis, conversationHistory.length)
    }

    // 6. GENERAR RESPUESTA ESTRATÉGICA INTELIGENTE
    console.log('🤖 Generando respuesta estratégica basada en contexto...')
    const strategicResponse = await generateContextualStrategicResponse(
      supabase,
      senderId,
      currentMessage,
      fullConversationText,
      analysis,
      idealTraitsData
    )

    console.log('📤 Respuesta estratégica generada:', strategicResponse)

    // 7. ENVIAR RESPUESTA AUTOMÁTICA
    await sendResponseWithDelay(supabase, senderId, strategicResponse)

  } catch (error) {
    console.error('❌ Error en análisis estratégico:', error)
    await sendGenericResponse(supabase, senderId)
  }
}

async function analyzeConversationStrategically(conversationText: string, idealTraits: any[]): Promise<any> {
  console.log('🔍 ANÁLISIS ESTRATÉGICO DE CONVERSACIÓN COMPLETA')
  
  const text = conversationText.toLowerCase()
  
  // Mapa de palabras clave específico y detallado
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "me interesa", "me interesan", "interesado", "interesada", "quiero saber",
      "información", "detalles", "precio", "costo", "cotización", "cuánto cuesta",
      "me gusta", "me encanta", "necesito", "busco", "requiero", "quiero",
      "producto", "servicio", "oferta", "promoción", "paquete", "plan",
      "crucero", "cruceros", "viaje", "viajes", "tour", "excursión", "vacaciones"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pago", "pagar", "precio", "costo", "inversión",
      "puedo pagar", "tengo dinero", "dispongo", "cuento con", "tarjeta",
      "efectivo", "financiamiento", "crédito", "mil", "miles", "pesos", "dólares",
      "vale la pena", "invertir", "gastar", "económico", "caro", "barato"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "listo", "preparado", "comprar", "reservar", "confirmar",
      "ahora", "hoy", "ya", "pronto", "inmediato", "urgente", "cuando",
      "perfecto", "de acuerdo", "acepto", "sí", "claro", "adelante", "vamos"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "estoy", "ubicado", "dirección", "ciudad", "zona", "región",
      "méxico", "guadalajara", "monterrey", "cdmx", "envío", "entrega",
      "cerca", "lejos", "local", "nacional"
    ]
  }
  
  const metTraits: string[] = []
  const metTraitIndices: number[] = []
  
  idealTraits.forEach((trait, idx) => {
    const keywords = keywordMap[trait.trait] || []
    
    console.log(`🎯 Analizando: "${trait.trait}"`)
    
    let matchFound = false
    const foundKeywords: string[] = []
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchFound = true
        foundKeywords.push(keyword)
      }
    }
    
    console.log(`   Palabras encontradas: ${foundKeywords.join(', ')}`)
    console.log(`   ¿Match?: ${matchFound ? '✅ SÍ' : '❌ NO'}`)
    
    if (matchFound) {
      metTraits.push(trait.trait)
      metTraitIndices.push(idx)
    }
  })
  
  return {
    matchPoints: metTraits.length,
    metTraits,
    metTraitIndices
  }
}

async function generateContextualStrategicResponse(
  supabase: any,
  senderId: string,
  currentMessage: string,
  fullConversationText: string,
  analysis: any,
  idealTraits: any[]
): Promise<string> {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI, usando respuesta estratégica predefinida')
      return getContextualFallbackResponse(currentMessage, analysis, idealTraits)
    }

    // Crear prompt ULTRA estratégico con contexto completo
    const strategicPrompt = createAdvancedContextualPrompt(
      currentMessage,
      fullConversationText,
      analysis,
      idealTraits
    )

    console.log('🧠 Enviando prompt contextual a OpenAI...')

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
            content: currentMessage
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      console.error('❌ Error en OpenAI API:', await response.text())
      return getContextualFallbackResponse(currentMessage, analysis, idealTraits)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('✅ Respuesta contextual de OpenAI:', aiResponse)
    return aiResponse

  } catch (error) {
    console.error('❌ Error generando respuesta contextual:', error)
    return getContextualFallbackResponse(currentMessage, analysis, idealTraits)
  }
}

function createAdvancedContextualPrompt(
  currentMessage: string,
  fullConversationText: string,
  analysis: any,
  idealTraits: any[]
): string {
  const { matchPoints, metTraits } = analysis
  const totalTraits = idealTraits.length
  const pendingTraits = idealTraits.filter((trait: any) => !metTraits.includes(trait.trait))
  const nextTrait = pendingTraits[0]?.trait

  return `
Eres un VENDEDOR EXPERTO de Instagram que mantiene conversaciones NATURALES mientras descubre estratégicamente si el prospecto cumple características del cliente ideal.

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${idealTraits.map((trait: any, i: number) => `${i+1}. ${trait.trait}`).join('\n')}

📊 PROGRESO ACTUAL DEL PROSPECTO:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${matchPoints}/${totalTraits}
- ✅ CUMPLE: ${metTraits.join(' | ') || 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait || 'TODAS CONFIRMADAS - BUSCAR CONTACTO'}

📝 HISTORIAL COMPLETO DE CONVERSACIÓN:
${fullConversationText}

💬 MENSAJE ACTUAL DEL PROSPECTO:
"${currentMessage}"

🗣️ TU ESTRATEGIA ESPECÍFICA:
${matchPoints === 0 ? `
🌟 INICIO - Responde al mensaje actual + descubrir primera característica
- Responde ESPECÍFICAMENTE a lo que acaba de preguntar
- Si pregunta tu nombre, díselo: "Soy María, asesora de viajes"
- Después conecta naturalmente y haz UNA pregunta para descubrir: "${nextTrait}"
- EJEMPLO: "Soy María, mucho gusto. Me dedico a ayudar personas a encontrar sus viajes ideales. ¿Qué tipo de experiencias te emocionan más?"
` : matchPoints < totalTraits ? `
💬 FILTRADO ACTIVO - Progreso ${matchPoints}/${totalTraits}
- Responde DIRECTAMENTE a su mensaje actual
- ENFÓCATE en descubrir: "${nextTrait}"
- Haz una pregunta estratégica NATURAL para revelar esta característica
- Conecta la pregunta con lo que ya han hablado
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir llamada/WhatsApp
- ¡PERFECTO! Este prospecto cumple TODAS las ${totalTraits} características
- Responde a su mensaje y luego busca conseguir contacto
- Sé DIRECTO: "Me parece que tenemos mucho en común, ¿te gustaría que platicáramos por teléfono?"
`}

🎭 REGLAS FUNDAMENTALES:
1. **SIEMPRE responde al mensaje actual PRIMERO**
2. **Conversación NATURAL** - Nunca suenes como bot
3. **UNA pregunta estratégica por mensaje**
4. **Conecta emocionalmente** - Muestra interés genuino
5. **Máximo 150 caracteres** para Instagram
6. **NUNCA ignores lo que te pregunta**

RESPONDE SOLO con tu siguiente mensaje natural y contextual de máximo 150 caracteres.
  `.trim()
}

function getContextualFallbackResponse(currentMessage: string, analysis: any, idealTraits: any[]): string {
  const { matchPoints } = analysis
  const totalTraits = idealTraits.length
  const lowerMessage = currentMessage.toLowerCase()

  // Respuestas específicas según el contexto del mensaje
  if (lowerMessage.includes('como te llamas') || lowerMessage.includes('cuál es tu nombre')) {
    if (matchPoints === 0) {
      return "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más cuando viajas?"
    } else if (matchPoints < totalTraits) {
      return "Soy María. Me da curiosidad, ¿has pensado en hacer algún viaje especial últimamente?"
    } else {
      return "Soy María. Me parece que tenemos mucho en común, ¿te gustaría que platicáramos por teléfono?"
    }
  }

  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
    return "¡Hola! Soy María. ¿Qué tipo de aventuras o experiencias te emocionan más?"
  }

  // Respuestas generales estratégicas
  if (matchPoints === 0) {
    const responses = [
      "Interesante. ¿Qué tipo de cosas te apasionan o te hacen sentir emocionado?",
      "Perfecto. ¿Cuáles son tus actividades favoritas en tu tiempo libre?",
      "Genial. ¿Hay algo específico que te guste hacer para relajarte o divertirte?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else if (matchPoints < totalTraits) {
    const responses = [
      "Me parece muy bien. ¿Hay algo más que te guste hacer en tu tiempo libre?",
      "Excelente. ¿Qué otras cosas disfrutas cuando tienes tiempo para ti?",
      "Perfecto. ¿Tienes algún otro hobby o pasión que te emocione?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } else {
    const responses = [
      "¡Increíble! Tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?",
      "¡Perfecto! Creo que podríamos conectar muy bien. ¿Cuándo podríamos hablar?",
      "¡Genial! Tengo ideas que creo te van a encantar. ¿Hablamos por teléfono?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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
        contextual_analysis: true,
        source: 'webhook_contextual'
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
          instagram_message_id: `contextual_${Date.now()}_${Math.random()}`,
          sender_id: 'ai_contextual_assistant',
          recipient_id: senderId,
          message_text: messageText,
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: {
            ai_generated: true,
            contextual_response: true,
            source: 'webhook_contextual_response'
          }
        })

      console.log('✅ Respuesta contextual enviada y guardada exitosamente')
    } else {
      console.error('❌ Error enviando respuesta contextual')
    }

  } catch (error) {
    console.error('❌ Error en sendResponseWithDelay:', error)
  }
}

async function sendGenericResponse(supabase: any, senderId: string) {
  const responses = [
    "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?",
    "¡Hola! Soy María. ¿Qué actividades disfrutas hacer en tu tiempo libre?",
    "Mucho gusto, soy María. ¿Hay algo específico que te apasione o te emocione?"
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
