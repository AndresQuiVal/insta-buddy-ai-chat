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

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices?: number[];
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
  console.log('🚀 PROCESANDO MENSAJE DE INSTAGRAM CON IA ESTRATÉGICA')
  console.log('👤 SENDER ID:', event.sender.id)
  console.log('💬 MENSAJE:', event.message?.text)

  try {
    // PASO 0: Actualizar actividad del prospecto
    try {
      const { error: activityError } = await supabase.rpc('update_prospect_activity', {
        p_prospect_id: event.sender.id
      });
      
      if (activityError) {
        console.error('⚠️ Error actualizando actividad:', activityError);
      } else {
        console.log('✅ Actividad del prospecto actualizada');
      }
    } catch (error) {
      console.error('⚠️ Error en actualización de actividad:', error);
    }

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
      return await sendFirstStrategicResponse(supabase, event.sender.id, event.message.text)
    }

    // PASO 3: Cargar características ideales desde Supabase
    const idealTraits = await loadIdealTraits(supabase)
    
    // PASO 4: Analizar conversación para determinar progreso actual
    const currentAnalysis = await analyzeConversationProgress(supabase, event.sender.id, conversationHistory, idealTraits)
    
    // PASO 5: Generar respuesta estratégica
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.log('⚠️ No hay API key de OpenAI')
      return await sendSimpleResponse(supabase, event.sender.id)
    }

    const strategicResponse = await generateStrategicAIResponse(
      event.message.text,
      conversationHistory,
      currentAnalysis,
      idealTraits,
      openaiKey
    )

    // PASO 6: Enviar respuesta estratégica
    await sendResponse(supabase, event.sender.id, strategicResponse)
    console.log('✅ Respuesta estratégica enviada exitosamente')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
    await sendSimpleResponse(supabase, event.sender.id)
  }
}

async function loadIdealTraits(supabase: any): Promise<Trait[]> {
  try {
    const { data: traits, error } = await supabase
      .from('ideal_client_traits')
      .select('*')
      .order('position')

    if (error || !traits || traits.length === 0) {
      console.log('⚠️ No se encontraron características, usando por defecto')
      return [
        { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
        { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
        { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
        { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
      ]
    }

    return traits.map(t => ({
      trait: t.trait,
      enabled: t.enabled,
      position: t.position
    }))
  } catch (error) {
    console.error('❌ Error cargando características:', error)
    return []
  }
}

async function analyzeConversationProgress(
  supabase: any, 
  senderId: string, 
  conversationHistory: any[], 
  idealTraits: Trait[]
): Promise<AnalysisResult> {
  try {
    // Verificar si ya existe un análisis guardado
    const { data: existingAnalysis } = await supabase
      .from('prospect_analysis')
      .select('*')
      .eq('sender_id', senderId)
      .single()

    if (existingAnalysis) {
      console.log('📊 Análisis existente encontrado:', existingAnalysis)
      return {
        matchPoints: existingAnalysis.match_points || 0,
        metTraits: existingAnalysis.met_traits || [],
        metTraitIndices: existingAnalysis.met_trait_indices || []
      }
    }

    // Si no hay análisis previo, analizar ahora
    console.log('🔍 Analizando conversación por primera vez...')
    
    const userMessages = conversationHistory
      .filter(msg => msg.sender_id === senderId)
      .map(msg => msg.message_text)
      .join(' ')

    if (userMessages.trim()) {
      const analysis = await analyzeWithAI(userMessages, idealTraits)
      
      // Guardar análisis en Supabase
      await supabase.from('prospect_analysis').insert({
        sender_id: senderId,
        match_points: analysis.matchPoints,
        met_traits: analysis.metTraits,
        met_trait_indices: analysis.metTraitIndices || [],
        last_analyzed_at: new Date().toISOString(),
        message_count: conversationHistory.length
      })

      return analysis
    }

    return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
  } catch (error) {
    console.error('❌ Error analizando progreso:', error)
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
  }
}

async function analyzeWithAI(conversationText: string, idealTraits: Trait[]): Promise<AnalysisResult> {
  // Implementación de análisis con IA (simplificada)
  // En un entorno real, aquí haríamos el análisis completo
  return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
}

async function generateStrategicAIResponse(
  userMessage: string,
  conversationHistory: any[],
  currentAnalysis: AnalysisResult,
  idealTraits: Trait[],
  openaiKey: string
): Promise<string> {
  try {
    const enabledTraits = idealTraits.filter(t => t.enabled)
    const pendingTraits = enabledTraits.filter(trait => !currentAnalysis.metTraits.includes(trait.trait))
    const nextTrait = pendingTraits[0]

    console.log('🎯 GENERANDO RESPUESTA ESTRATÉGICA CON PERSONALIDAD EN WEBHOOK')
    console.log(`📊 Progreso: ${currentAnalysis.matchPoints}/${enabledTraits.length}`)
    console.log(`🎯 Próximo objetivo: ${nextTrait?.trait || 'CONSEGUIR CONTACTO'}`)

    // Crear pregunta estratégica natural
    const createNaturalQuestion = (trait: string): string => {
      const traitLower = trait.toLowerCase()
      
      if (traitLower.includes('interesado') || traitLower.includes('productos')) {
        const questions = [
          "¿Qué fue lo que más te llamó la atención de esto?",
          "¿Es algo que has estado considerando por mucho tiempo?",
          "¿Qué te motivó a buscar información sobre esto?"
        ]
        return questions[Math.floor(Math.random() * questions.length)]
      }
      
      if (traitLower.includes('presupuesto') || traitLower.includes('adquirir')) {
        const questions = [
          "¿Has considerado hacer algún tipo de inversión en algo así?",
          "¿Qué tipo de presupuesto manejas para este tipo de cosas?",
          "¿Has hecho alguna inversión similar anteriormente?"
        ]
        return questions[Math.floor(Math.random() * questions.length)]
      }
      
      if (traitLower.includes('decisión') || traitLower.includes('listo')) {
        const questions = [
          "¿Eres de los que cuando algo les convence actúan rápido?",
          "¿Prefieres tomarte tu tiempo para decidir?",
          "¿Tienes algún plazo en mente para tomar una decisión?"
        ]
        return questions[Math.floor(Math.random() * questions.length)]
      }
      
      if (traitLower.includes('zona') || traitLower.includes('servicio')) {
        const questions = [
          "¿De qué parte del país me escribes?",
          "¿Necesitarías que fuera algo local?",
          "¿Cómo está la situación por tu zona para este tipo de cosas?"
        ]
        return questions[Math.floor(Math.random() * questions.length)]
      }
      
      return "¿Podrías contarme un poco más sobre tu situación actual?"
    }

    const strategicQuestion = nextTrait ? createNaturalQuestion(nextTrait.trait) : null

    // Obtener personalidad guardada desde la base de datos
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ia_persona')
      .limit(1)

    const savedPersonality = settings && settings.length > 0 ? settings[0].ia_persona : null
    console.log(`🎭 Personalidad personalizada en webhook: ${savedPersonality ? 'SÍ' : 'NO'}`)

    // Base del prompt con o sin personalidad personalizada
    const personalitySection = savedPersonality 
      ? `🎭 TU PERSONALIDAD Y ESTILO DE COMUNICACIÓN:
${savedPersonality}

IMPORTANTE: Debes responder usando EXACTAMENTE el estilo de comunicación descrito arriba. Usa las mismas expresiones, tono y manera de hablar que se describe en tu personalidad.`
      : `🎭 TU PERSONALIDAD:
Eres María, una asesora de viajes experta y vendedora NATURAL pero ESTRATÉGICA. Eres cálida, empática y genuinamente interesada en ayudar a las personas.`

    const systemPrompt = `${personalitySection}

Tu objetivo es tener conversaciones NATURALES pero con propósito estratégico.

🎯 CARACTERÍSTICAS A DESCUBRIR:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

📊 PROGRESO ACTUAL:
- Características confirmadas: ${currentAnalysis.matchPoints}/${enabledTraits.length}
- Ya cumple: ${currentAnalysis.metTraits.join(', ') || 'Ninguna aún'}
- Próximo objetivo: ${nextTrait ? `"${nextTrait.trait}"` : 'Conseguir contacto/WhatsApp'}

ESTRATEGIA EQUILIBRADA:
${currentAnalysis.matchPoints === 0 ? 
  `🌱 INICIAL: Conecta genuinamente y pregunta: "${strategicQuestion}"` :
  currentAnalysis.matchPoints < enabledTraits.length ?
  `💬 ACTIVO: Responde empáticamente y descubre: "${strategicQuestion}"` :
  `🏆 COMPLETO: ¡Cumple todas las características! Busca conseguir WhatsApp o llamada`
}

REGLAS CONVERSACIONALES:
1. Responde específicamente al mensaje del usuario
2. Conecta emocionalmente con lo que dice
3. Incluye UNA pregunta estratégica que fluya naturalmente
4. Justifica tu curiosidad profesionalmente
5. Máximo 3 oraciones, tono cálido pero profesional
6. USA TU PERSONALIDAD específica si está definida

MENSAJE USUARIO: "${userMessage}"

Responde usando tu personalidad específica de forma natural conectando con su mensaje pero incluyendo la pregunta estratégica.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.85,
        max_tokens: 180,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error de OpenAI: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content.trim()

    console.log('✅ Respuesta estratégica con personalidad generada:', aiResponse)
    return aiResponse

  } catch (error) {
    console.error('❌ Error generando respuesta estratégica:', error)
    return "Me da mucho gusto que me hayas contactado. ¿Podrías contarme un poco más sobre lo que buscas?"
  }
}

async function sendFirstStrategicResponse(supabase: any, userId: string, userMessage: string) {
  const response = `¡Hola! Soy María, tu asesora de viajes. Me da mucho gusto que te hayas puesto en contacto. Veo que me escribes sobre "${userMessage}". ¿Qué tipo de experiencia de viaje tienes en mente?`
  await sendResponse(supabase, userId, response)
}

async function sendSimpleResponse(supabase: any, userId: string) {
  const response = "¡Hola! ¿En qué puedo ayudarte hoy?"
  await sendResponse(supabase, userId, response)
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  try {
    console.log('📨 PREPARANDO ENVÍO ESTRATÉGICO...')
    
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
      console.log('✅ MENSAJE ESTRATÉGICO ENVIADO A INSTAGRAM')
      
      // Guardar mensaje enviado
      const sentMessageData = {
        instagram_message_id: `ai_strategic_${Date.now()}_${Math.random()}`,
        sender_id: 'ai_assistant_maria_strategic',
        recipient_id: senderId,
        message_text: messageText,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          ai_generated: true,
          strategic_response: true,
          source: 'webhook_ai_strategic_response'
        }
      }

      await supabase.from('instagram_messages').insert(sentMessageData)
      console.log('✅ RESPUESTA ESTRATÉGICA GUARDADA EN BD')
    } else {
      console.error('❌ ERROR ENVIANDO RESPUESTA ESTRATÉGICA A INSTAGRAM')
    }

  } catch (error) {
    console.error('❌ ERROR EN sendResponse estratégico:', error)
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

    console.log('📤 ENVIANDO RESPUESTA ESTRATÉGICA A INSTAGRAM API:', JSON.stringify(messagePayload, null, 2))

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

    console.log('✅ RESPUESTA ESTRATÉGICA EXITOSA DE INSTAGRAM:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR EN sendInstagramMessage:', error)
    return false
  }
}
