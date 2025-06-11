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
  console.log('🚀 PROCESANDO MENSAJE - AUTORESPONDER ACTIVO')
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

    // PASO 2: Verificar si es la primera vez que esta persona escribe (para autoresponder)
    const { data: previousMessages } = await supabase
      .from('instagram_messages')
      .select('id')
      .eq('sender_id', event.sender.id)
      .eq('message_type', 'received')
      .limit(2) // Solo necesitamos saber si hay más de 1

    console.log(`📊 Mensajes previos del usuario ${event.sender.id}:`, previousMessages?.length || 0)

    // Si es la primera vez que escribe, verificar autoresponder
    if (previousMessages && previousMessages.length === 1) {
      console.log('🆕 PRIMERA VEZ QUE ESCRIBE - VERIFICANDO AUTORESPONDER')
      await handleAutoresponder(supabase, event.sender.id)
    } else {
      console.log('👥 Usuario ya escribió antes - NO se envía autoresponder')
    }
    
    console.log('✅ Mensaje procesado correctamente (autoresponder activo)')

  } catch (error) {
    console.error('❌ Error en processMessagingEvent:', error)
  }
}

async function handleAutoresponder(supabase: any, senderId: string) {
  try {
    console.log('🤖 INICIANDO PROCESO DE AUTORESPONDER')

    // Verificar si ya se le envió una respuesta automática a este usuario
    const { data: alreadySent } = await supabase
      .from('autoresponder_sent_log')
      .select('id')
      .eq('sender_id', senderId)
      .single()

    if (alreadySent) {
      console.log('⏭️ Ya se envió autoresponder a este usuario - saltando')
      return
    }

    // Obtener una respuesta automática activa (la primera que encuentre)
    const { data: autoresponderMessage } = await supabase
      .from('autoresponder_messages')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!autoresponderMessage) {
      console.log('⚠️ No hay respuestas automáticas activas en la base de datos')
      console.log('📤 ENVIANDO AUTORESPONDER POR DEFECTO')
      
      // Usar mensaje por defecto
      const defaultMessage = '¡Hola! Gracias por escribirme. Te responderé pronto. 😊'
      
      const success = await sendInstagramMessage(senderId, defaultMessage)
      
      if (success) {
        await supabase.from('autoresponder_sent_log').insert({
          sender_id: senderId,
          autoresponder_message_id: null
        })
        console.log('✅ AUTORESPONDER POR DEFECTO ENVIADO')
      }
      return
    }

    console.log('📤 ENVIANDO AUTORESPONDER:', autoresponderMessage.name)

    // Enviar la respuesta automática
    const success = await sendInstagramMessage(senderId, autoresponderMessage.message_text)

    if (success) {
      console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE')

      // Registrar que se envió para no volver a enviar
      await supabase.from('autoresponder_sent_log').insert({
        sender_id: senderId,
        autoresponder_message_id: autoresponderMessage.id
      })

      // Guardar el mensaje enviado en el historial
      const sentMessageData = {
        instagram_message_id: `autoresponder_${Date.now()}_${Math.random()}`,
        sender_id: 'autoresponder_system',
        recipient_id: senderId,
        message_text: autoresponderMessage.message_text,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        raw_data: {
          autoresponder: true,
          autoresponder_id: autoresponderMessage.id,
          source: 'autoresponder_system'
        }
      }

      await supabase.from('instagram_messages').insert(sentMessageData)
      console.log('✅ AUTORESPONDER GUARDADO EN HISTORIAL')
    } else {
      console.error('❌ ERROR ENVIANDO AUTORESPONDER')
    }

  } catch (error) {
    console.error('❌ Error en handleAutoresponder:', error)
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

    console.log('🔍 Analizando conversación por primera vez...')
    
    const userMessages = conversationHistory
      .filter(msg => msg.sender_id === senderId)
      .map(msg => msg.message_text)
      .join(' ')

    if (userMessages.trim()) {
      const analysis = await analyzeWithAI(userMessages, idealTraits)
      
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
  return { matchPoints: 0, metTraits: [], metTraitIndices: [] }
}

async function generateStrategicAIResponse(
  supabase: any,
  userMessage: string,
  conversationHistory: any[],
  currentAnalysis: AnalysisResult,
  idealTraits: Trait[],
  openaiKey: string
): Promise<string> {
  return "Respuesta IA desactivada temporalmente"
}

async function sendFirstStrategicResponse(supabase: any, userId: string, userMessage: string) {
  console.log('🤖 Respuesta estratégica inicial DESACTIVADA')
}

async function sendSimpleResponse(supabase: any, userId: string) {
  console.log('🤖 Respuesta simple DESACTIVADA')
}

async function sendResponse(supabase: any, senderId: string, messageText: string) {
  console.log('🤖 Respuesta IA DESACTIVADA')
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

    console.log('📤 ENVIANDO AUTORESPONDER A INSTAGRAM API:', JSON.stringify(messagePayload, null, 2))

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

    console.log('✅ AUTORESPONDER EXITOSO DE INSTAGRAM:', JSON.stringify(responseData, null, 2))
    return true

  } catch (error) {
    console.error('❌ ERROR EN sendInstagramMessage:', error)
    return false
  }
}
