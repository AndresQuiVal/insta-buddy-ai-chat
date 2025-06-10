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

async function getSystemPrompt(supabase: any) {
  try {
    // Obtener personalidad configurada
    const { data: personalityData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'personality')
      .single()

    // Obtener nombre del asistente
    const { data: pageData } = await supabase
      .from('instagram_pages')
      .select('page_name')
      .single()

    // Obtener características del cliente ideal
    const { data: traitsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ideal_client_traits')
      .single()

    let systemPrompt = ''
    const pageName = pageData?.page_name || 'la cuenta'
    const traits = traitsData?.value || []

    if (personalityData?.value) {
      systemPrompt = personalityData.value
      console.log('✅ Usando personalidad configurada')
    } else {
      systemPrompt = `Eres el asistente de ${pageName}. Tu objetivo es mantener una conversación natural mientras identificas si el usuario cumple con las características del cliente ideal.`
      console.log('⚠️ No hay personalidad configurada, usando genérica')
    }

    // Agregar instrucciones sobre características del cliente ideal
    if (traits.length > 0) {
      systemPrompt += `\n\nDurante la conversación, debes identificar si el usuario cumple con alguna de estas características:\n`
      traits.forEach((trait: any, index: number) => {
        if (trait.enabled) {
          systemPrompt += `${index + 1}. ${trait.trait}\n`
        }
      })
      systemPrompt += `\nDebes hacer preguntas naturales y estratégicas que te ayuden a identificar estas características. NO preguntes directamente por ellas, sino que debes llevar la conversación de manera natural para descubrirlas.`
    }

    return systemPrompt
  } catch (error) {
    console.error('❌ Error al obtener personalidad:', error)
    return 'Eres un asistente profesional y amable. Tu objetivo es mantener una conversación natural mientras identificas si el usuario cumple con las características del cliente ideal.'
  }
}

async function processMessagingEvent(supabase: any, event: MessagingEvent) {
  console.log('🚀 PROCESANDO MENSAJE DE INSTAGRAM')
  console.log('👤 SENDER ID:', event.sender.id)
  console.log('💬 MENSAJE:', event.message?.text)

  try {
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
      }
    }

    const { error: saveError } = await supabase
      .from('instagram_messages')
      .insert(messageData)

    if (saveError) {
      throw saveError
    }

    // PASO 2: Obtener historial de conversación
    const { data: conversationHistory } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', event.sender.id)
      .order('timestamp', { ascending: true })

    // PASO 3: Procesar conversación para OpenAI
    const processedConversation = conversationHistory.map((msg: any) => ({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.message_text
    }))

    // PASO 4: Obtener system prompt
    const systemPrompt = await getSystemPrompt(supabase)

    // PASO 5: Generar respuesta con OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key no configurada')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...processedConversation
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error de OpenAI: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let aiResponse = data.choices[0].message.content.trim()

    // PASO 6: Verificación final de respuesta genérica
    const genericResponses = [
      'interesante',
      'cuéntame más',
      'qué bueno',
      'me gustaría saber',
      'qué bien',
      'dime más',
      'que interesante',
      'que bueno',
      'cuentame mas',
      'me gustaria saber',
      'que bien',
      'dime mas',
      'que tal',
      'como estas',
      'entiendo',
      'comprendo',
      'ya veo'
    ]

    const isGenericResponse = (text: string) => {
      const normalizedText = text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      
      // Check for exact matches
      if (genericResponses.some(phrase => normalizedText.includes(phrase))) {
        return true
      }

      // Check for response length
      if (text.length < 20) {
        return true
      }

      // Check if it's just a question
      if (text.trim().endsWith('?') && text.split(' ').length < 10) {
        return true
      }

      return false
    }

    if (isGenericResponse(aiResponse)) {
      console.log('⚠️ Respuesta genérica detectada, regenerando...')
      
      // Agregar instrucción específica
      const newSystemPrompt = systemPrompt + '\n\nIMPORTANTE: Debes dar una respuesta específica y detallada, relacionada con el tema de la conversación. NO des respuestas genéricas como "interesante" o "cuéntame más".'
      
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: newSystemPrompt },
            ...processedConversation
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (!retryResponse.ok) {
        throw new Error(`Error de OpenAI en retry: ${retryResponse.status} ${retryResponse.statusText}`)
      }

      const retryData = await retryResponse.json()
      aiResponse = retryData.choices[0].message.content.trim()
    }

    // PASO 7: Guardar respuesta de la IA
    const responseData = {
      instagram_message_id: `ai_${Date.now()}`,
      sender_id: event.recipient.id,
      recipient_id: event.sender.id,
      message_text: aiResponse,
      message_type: 'sent',
      timestamp: new Date().toISOString(),
      is_read: true,
      raw_data: {
        ai_generated: true,
        original_message: event.message
      }
    }

    const { error: responseSaveError } = await supabase
      .from('instagram_messages')
      .insert(responseData)

    if (responseSaveError) {
      throw responseSaveError
    }

    // PASO 8: Enviar respuesta a Instagram
    const pageAccessToken = Deno.env.get('INSTAGRAM_PAGE_ACCESS_TOKEN')
    if (!pageAccessToken) {
      throw new Error('Token de acceso de página no configurado')
    }

    const sendMessageResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: event.sender.id,
          },
          message: {
            text: aiResponse,
          },
        }),
      }
    )

    if (!sendMessageResponse.ok) {
      throw new Error(`Error al enviar mensaje: ${sendMessageResponse.status} ${sendMessageResponse.statusText}`)
    }

    // PASO 9: Analizar características del cliente ideal
    const { data: traitsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ideal_client_traits')
      .single()

    if (traitsData?.value) {
      const traits = traitsData.value
      const enabledTraits = traits.filter((t: any) => t.enabled)

      if (enabledTraits.length > 0) {
        // Analizar el mensaje actual
        const analysisPrompt = `
          Analiza el siguiente mensaje y determina si indica que el usuario cumple con alguna de estas características:
          ${enabledTraits.map((t: any, i: number) => `${i + 1}. ${t.trait}`).join('\n')}

          Mensaje: "${event.message.text}"

          Responde SOLO con un array de números (índices) de las características que se cumplen. Por ejemplo: [1,3] si se cumplen la primera y tercera característica. Si no se cumple ninguna, responde [].
        `

        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'Eres un analizador de texto preciso. Responde exactamente lo que se te pide.' },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0,
            max_tokens: 50,
          }),
        })

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          const metTraitIndices = JSON.parse(analysisData.choices[0].message.content)
          console.log('✅ Características detectadas:', metTraitIndices)

          // Actualizar en Supabase
          const metTraits = metTraitIndices.map((i: number) => enabledTraits[i - 1].trait)
          await saveTraitsToSupabase(supabase, event.sender.id, metTraits, metTraitIndices.length)
        }
      }
    }

    console.log('✅ Mensaje procesado y respondido correctamente')
  } catch (error) {
    console.error('❌ Error al procesar mensaje:', error)
    
    // En caso de error, enviar una respuesta simple
    try {
      await sendSimpleResponse(supabase, event.sender.id)
    } catch (sendError) {
      console.error('❌ Error al enviar respuesta simple:', sendError)
    }
  }
}

async function sendFirstResponse(supabase: any, userId: string) {
  // Obtener personalidad configurada
  let systemPrompt = ''
  try {
    const savedPersonality = localStorage.getItem('hower-system-prompt')
    if (savedPersonality) {
      systemPrompt = savedPersonality
      console.log('✅ Usando personalidad configurada para primer mensaje')
    } else {
      console.log('⚠️ No hay personalidad configurada, usando genérica')
      systemPrompt = 'Eres un asistente profesional y amable. Tu objetivo es mantener una conversación natural mientras identificas si el usuario cumple con las características del cliente ideal.'
    }
  } catch (error) {
    console.log('⚠️ Error al obtener personalidad:', error)
    systemPrompt = 'Eres un asistente profesional y amable. Tu objetivo es mantener una conversación natural mientras identificas si el usuario cumple con las características del cliente ideal.'
  }

  // Obtener características del cliente ideal
  let idealTraits = []
  try {
    const savedTraits = localStorage.getItem('hower-ideal-client-traits')
    if (savedTraits) {
      idealTraits = JSON.parse(savedTraits)
        .filter((trait: any) => trait.enabled)
        .map((trait: any) => trait.trait)
      console.log('✅ Usando características configuradas para primer mensaje:', idealTraits)
    }
  } catch (error) {
    console.log('⚠️ Error al obtener características:', error)
  }

  // Generar prompt para primer mensaje
  const traitsPrompt = idealTraits.length > 0 
    ? `\n\nCARACTERÍSTICAS DEL CLIENTE IDEAL A IDENTIFICAR:
${idealTraits.map((trait, i) => `${i + 1}. ${trait}`).join('\n')}

INSTRUCCIONES ADICIONALES:
- Da un saludo amigable y profesional
- Preséntate brevemente
- Haz una pregunta abierta que pueda ayudar a identificar alguna de estas características
- NO preguntes directamente sobre las características
- La pregunta debe ser natural y relacionada con el contexto`
    : '';

  const fullPrompt = `${systemPrompt}${traitsPrompt}

INSTRUCCIÓN:
Genera un primer mensaje de saludo para iniciar la conversación. El mensaje debe ser amigable, profesional y terminar con una pregunta abierta.`

  // Generar primer mensaje con OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    console.log('⚠️ No hay API key de OpenAI para primer mensaje')
    return await sendSimpleResponse(supabase, userId)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: 'Genera un mensaje de saludo inicial' }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      throw new Error('Error al generar primer mensaje con OpenAI')
    }

    const data = await response.json()
    const firstMessage = data.choices[0].message.content.trim()
    
    await sendResponse(supabase, userId, firstMessage)
  } catch (error) {
    console.error('❌ Error al generar primer mensaje:', error)
    await sendSimpleResponse(supabase, userId)
  }
}

async function sendSimpleResponse(supabase: any, userId: string) {
  // Obtener nombre del asistente de la personalidad
  let assistantName = 'Asistente'
  try {
    const savedPersonality = localStorage.getItem('hower-system-prompt')
    if (savedPersonality) {
      // Intentar extraer el nombre del prompt
      const nameMatch = savedPersonality.match(/soy\s+([^,.!?]+)/i)
      if (nameMatch) {
        assistantName = nameMatch[1].trim()
      }
    }
  } catch (error) {
    console.log('⚠️ Error al obtener nombre del asistente:', error)
  }

  const response = `¡Hola! Soy ${assistantName}. ¿En qué puedo ayudarte hoy?`
  await sendResponse(supabase, userId, response)
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

async function saveTraitsToSupabase(supabase: any, senderId: string, metTraits: string[], matchPoints: number) {
  try {
    // Primero, buscar si ya existe un registro para este usuario
    const { data: existingData } = await supabase
      .from('prospect_analysis')
      .select('*')
      .eq('sender_id', senderId)
      .single()

    const now = new Date().toISOString()

    if (existingData) {
      // Actualizar registro existente
      const { error: updateError } = await supabase
        .from('prospect_analysis')
        .update({
          met_traits: metTraits,
          match_points: matchPoints,
          updated_at: now,
          last_analyzed_at: now
        })
        .eq('sender_id', senderId)

      if (updateError) {
        throw updateError
      }
      console.log('✅ Características actualizadas en Supabase')
    } else {
      // Crear nuevo registro
      const { error: insertError } = await supabase
        .from('prospect_analysis')
        .insert({
          sender_id: senderId,
          met_traits: metTraits,
          match_points: matchPoints,
          created_at: now,
          updated_at: now,
          last_analyzed_at: now,
          message_count: 1
        })

      if (insertError) {
        throw insertError
      }
      console.log('✅ Características guardadas en Supabase')
    }
  } catch (error) {
    console.error('❌ Error al guardar características en Supabase:', error)
  }
}
