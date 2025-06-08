
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

    // 🔥 ANÁLISIS COMPLETO Y RESPUESTA ESTRATÉGICA
    await handleIntelligentConversationAnalysis(supabase, event.sender.id, event.message.text)

  } catch (error) {
    console.error('❌ Error processing messaging event:', error)
    throw error
  }
}

async function handleIntelligentConversationAnalysis(supabase: any, senderId: string, currentMessage: string) {
  try {
    console.log('🧠 INICIANDO ANÁLISIS COMPLETO DE CONVERSACIÓN')
    console.log(`👤 Sender ID: ${senderId}`)
    console.log(`💬 Mensaje actual: "${currentMessage}"`)

    // 1. OBTENER HISTORIAL COMPLETO DE CONVERSACIÓN ORDENADO
    console.log('📚 Obteniendo HISTORIAL COMPLETO...')
    const { data: allMessages, error: messagesError } = await supabase
      .from('instagram_messages')
      .select('*')
      .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
      await sendFallbackResponse(supabase, senderId, currentMessage)
      return
    }

    const conversationHistory = allMessages || []
    console.log(`📝 HISTORIAL ENCONTRADO: ${conversationHistory.length} mensajes`)

    // 2. OBTENER CARACTERÍSTICAS IDEALES
    console.log('🎯 Obteniendo características ideales...')
    const { data: idealTraitsData, error: traitsError } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .eq('enabled', true)
      .order('position')

    if (traitsError || !idealTraitsData || idealTraitsData.length === 0) {
      console.log('⚠️ No hay características configuradas')
      await sendFallbackResponse(supabase, senderId, currentMessage)
      return
    }

    console.log('✅ Características cargadas:', idealTraitsData.map(t => t.trait))

    // 3. CONSTRUIR HISTORIAL PARA ANÁLISIS
    const fullConversation = conversationHistory
      .map(msg => `${msg.message_type === 'received' ? 'Usuario' : 'IA'}: ${msg.message_text}`)
      .join('\n')

    console.log('💭 CONVERSACIÓN COMPLETA:')
    console.log(fullConversation)

    // 4. ANÁLISIS ESTRATÉGICO BASADO EN TODA LA CONVERSACIÓN
    const analysis = await analyzeFullConversation(fullConversation, idealTraitsData)
    console.log('📊 ANÁLISIS COMPLETADO:', analysis)

    // 5. GUARDAR ANÁLISIS
    if (analysis.matchPoints > 0) {
      await saveProspectAnalysis(supabase, senderId, analysis, conversationHistory.length)
    }

    // 6. GENERAR RESPUESTA INTELIGENTE BASADA EN CONTEXTO COMPLETO
    const intelligentResponse = await generateContextualResponse(
      currentMessage,
      fullConversation,
      analysis,
      idealTraitsData,
      conversationHistory
    )

    console.log('🤖 RESPUESTA GENERADA:', intelligentResponse)

    // 7. ENVIAR RESPUESTA
    await sendResponseWithDelay(supabase, senderId, intelligentResponse)

  } catch (error) {
    console.error('❌ Error en análisis completo:', error)
    await sendFallbackResponse(supabase, senderId, currentMessage)
  }
}

async function analyzeFullConversation(conversationText: string, idealTraits: any[]): Promise<any> {
  console.log('🔍 ANALIZANDO CONVERSACIÓN COMPLETA')
  
  const text = conversationText.toLowerCase()
  
  // Mapa expandido de palabras clave
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "me interesa", "me interesan", "interesado", "interesada", "quiero saber",
      "información", "detalles", "precio", "costo", "cotización", "cuánto cuesta",
      "me gusta", "me encanta", "necesito", "busco", "requiero", "quiero",
      "producto", "servicio", "oferta", "promoción", "paquete", "plan",
      "crucero", "cruceros", "viaje", "viajes", "tour", "excursión", "vacaciones",
      "disfrutar", "conocer", "explorar", "destino", "aventura"
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
  
  idealTraits.forEach((trait) => {
    const keywords = keywordMap[trait.trait] || []
    
    let matchFound = false
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchFound = true
        break
      }
    }
    
    console.log(`   🎯 "${trait.trait}": ${matchFound ? '✅ SÍ' : '❌ NO'}`)
    
    if (matchFound) {
      metTraits.push(trait.trait)
    }
  })
  
  return {
    matchPoints: metTraits.length,
    metTraits
  }
}

async function generateContextualResponse(
  currentMessage: string,
  fullConversation: string,
  analysis: any,
  idealTraits: any[],
  conversationHistory: any[]
): Promise<string> {
  
  const { matchPoints, metTraits } = analysis
  const totalTraits = idealTraits.length
  const lowerCurrentMessage = currentMessage.toLowerCase()
  
  console.log(`🤖 Generando respuesta contextual para ${matchPoints}/${totalTraits} características`)
  console.log(`📩 Mensaje actual: "${currentMessage}"`)
  
  // RESPONDER ESPECÍFICAMENTE AL MENSAJE ACTUAL
  
  // Si pregunta sobre conversación anterior
  if (lowerCurrentMessage.includes('leíste mi conversación') || 
      lowerCurrentMessage.includes('leiste mi conversacion') ||
      lowerCurrentMessage.includes('de lo que hemos hablado') || 
      lowerCurrentMessage.includes('conversación anterior')) {
    
    if (matchPoints === 0) {
      return "Claro, he visto que nos estamos conociendo. Me contabas sobre ti. ¿Qué tipo de actividades te emocionan más?"
    } else if (matchPoints === 1) {
      return "Sí, claro que la he leído. Veo que tienes interés en ciertas cosas. ¿Has estado ahorrando para algo especial últimamente?"
    } else if (matchPoints === 2) {
      return "Por supuesto, he revisado nuestra conversación. Me parece que tienes buen criterio. ¿Eres de las personas que cuando algo les convence actúan rápido?"
    } else if (matchPoints >= 3) {
      return "Claro que sí, he leído todo lo que me has contado. Me da mucha confianza platicar contigo. ¿Te gustaría que habláramos por teléfono?"
    }
  }

  // Si pregunta nombre
  if (lowerCurrentMessage.includes('como te llamas') || 
      lowerCurrentMessage.includes('cómo te llamas') ||
      lowerCurrentMessage.includes('cuál es tu nombre') ||
      lowerCurrentMessage.includes('cual es tu nombre') ||
      lowerCurrentMessage.includes('quien eres') ||
      lowerCurrentMessage.includes('quién eres')) {
    
    if (matchPoints === 0) {
      return "Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más cuando piensas en viajar?"
    } else if (matchPoints === 1) {
      const pendingTrait = idealTraits.find(trait => !metTraits.includes(trait.trait))
      if (pendingTrait?.trait.includes('presupuesto')) {
        return "Soy María, encantada. ¿Has estado ahorrando para algo especial últimamente?"
      } else if (pendingTrait?.trait.includes('decisión')) {
        return "Soy María. ¿Eres de las personas que cuando algo les convence actúan rápido?"
      } else {
        return "Soy María. ¿De qué ciudad me escribes?"
      }
    } else if (matchPoints >= 2) {
      return "Soy María. Me da la impresión de que tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?"
    }
  }
  
  // Si saluda
  if (lowerCurrentMessage.includes('hola') || 
      lowerCurrentMessage.includes('buenos') ||
      lowerCurrentMessage.includes('buenas')) {
    
    // Verificar si ya saludó antes
    const previousGreetings = conversationHistory.filter(msg => 
      msg.message_type === 'received' && 
      (msg.message_text.toLowerCase().includes('hola') || msg.message_text.toLowerCase().includes('buenos'))
    )
    
    if (previousGreetings.length > 1) {
      if (matchPoints === 0) {
        return "¡Qué gusto verte de nuevo! ¿Qué tipo de experiencias te hacen sentir más emocionado?"
      } else if (matchPoints < totalTraits) {
        return "¡Hola otra vez! ¿En qué más te puedo ayudar?"
      } else {
        return "¡Hola! Me encanta que sigas aquí. ¿Cuándo podríamos hablar por teléfono?"
      }
    } else {
      return "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de aventuras te emocionan más?"
    }
  }

  // Si dice "How" (inglés)
  if (lowerCurrentMessage.trim() === 'how') {
    return "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
  }
  
  // ESTRATEGIA BASADA EN PROGRESO
  if (matchPoints === 0) {
    // Primer contacto - descubrir primera característica
    const responses = [
      "¿Qué tipo de experiencias te hacen sentir más emocionado?",
      "¿Cuáles son tus actividades favoritas para relajarte?",
      "¿Hay algo que hayas estado queriendo hacer hace tiempo?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  } 
  
  if (matchPoints < totalTraits) {
    // Filtrado activo - buscar siguiente característica
    const pendingTrait = idealTraits.find(trait => !metTraits.includes(trait.trait))
    
    if (pendingTrait?.trait.includes('presupuesto')) {
      return "Me parece muy bien. ¿Has estado ahorrando para algo especial?"
    } else if (pendingTrait?.trait.includes('decisión')) {
      return "Perfecto. ¿Eres de los que cuando algo les convence no dudan en actuar?"
    } else if (pendingTrait?.trait.includes('zona')) {
      return "Excelente. ¿De qué parte del país me escribes?"
    } else {
      return "Genial. ¿Qué otros planes tienes para este año?"
    }
  } 
  
  // Cliente ideal - buscar contacto
  const contactResponses = [
    "¡Increíble! Tenemos mucho en común. ¿Te gustaría que platicáramos por teléfono?",
    "¡Perfecto! Creo que tengo ideas que te van a encantar. ¿Cuándo podríamos hablar?",
    "¡Genial! Me parece que podríamos hacer algo increíble juntos. ¿Hablamos por WhatsApp?"
  ]
  
  return contactResponses[Math.floor(Math.random() * contactResponses.length)]
}

async function saveProspectAnalysis(supabase: any, senderId: string, analysis: any, messageCount: number) {
  try {
    const analysisData = {
      sender_id: senderId,
      match_points: analysis.matchPoints,
      met_traits: analysis.metTraits,
      last_analyzed_at: new Date().toISOString(),
      message_count: messageCount,
      analysis_data: {
        timestamp: new Date().toISOString(),
        intelligent_analysis: true,
        source: 'webhook_intelligent'
      }
    }

    await supabase
      .from('prospect_analysis')
      .upsert(analysisData, { 
        onConflict: 'sender_id',
        ignoreDuplicates: false 
      })

    console.log('✅ Análisis guardado exitosamente')
  } catch (error) {
    console.error('❌ Error guardando análisis:', error)
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
          instagram_message_id: `intelligent_${Date.now()}_${Math.random()}`,
          sender_id: 'ai_intelligent_assistant',
          recipient_id: senderId,
          message_text: messageText,
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: {
            ai_generated: true,
            intelligent_response: true,
            source: 'webhook_intelligent_response'
          }
        })

      console.log('✅ Respuesta inteligente enviada y guardada exitosamente')
    }

  } catch (error) {
    console.error('❌ Error en sendResponseWithDelay:', error)
  }
}

async function sendFallbackResponse(supabase: any, senderId: string, currentMessage: string) {
  const lowerMessage = currentMessage.toLowerCase()
  
  let response = "¡Hola! Soy María, asesora de viajes. ¿Qué tipo de experiencias te emocionan más?"
  
  if (lowerMessage.includes('como te llamas') || lowerMessage.includes('cómo te llamas')) {
    response = "Soy María, asesora de viajes. ¿Qué tipo de aventuras disfrutas?"
  } else if (lowerMessage.includes('hola')) {
    response = "¡Hola! Soy María. ¿Qué actividades te hacen sentir más emocionado?"
  } else if (lowerMessage.includes('leíste mi conversación') || lowerMessage.includes('leiste mi conversacion')) {
    response = "Claro, he visto que nos estamos conociendo. ¿Qué tipo de experiencias te emocionan?"
  }
  
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
