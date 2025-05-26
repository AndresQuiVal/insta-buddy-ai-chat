
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== INSTAGRAM WEBHOOK RECEIVED ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // Verificación del webhook (GET request de Facebook)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification:', { mode, token, challenge })

      // Token de verificación (debes configurar este mismo token en Facebook Developers)
      const VERIFY_TOKEN = 'hower-instagram-webhook-token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { status: 200 })
      } else {
        console.log('Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }

    // Procesar mensajes entrantes (POST request)
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('Webhook payload:', JSON.stringify(body, null, 2))

      // Procesar cada entrada del webhook
      for (const entry of body.entry || []) {
        console.log('Processing entry:', entry.id)

        // Procesar mensajes
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            console.log('Message change detected:', change.value)
            
            // Procesar cada mensaje
            for (const message of change.value.messages || []) {
              await processIncomingMessage(message, entry.id)
            }
          }
        }

        // Procesar menciones
        for (const messaging of entry.messaging || []) {
          if (messaging.message) {
            console.log('Direct message received:', messaging.message)
            await processDirectMessage(messaging)
          }
        }
      }

      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Error in Instagram webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processIncomingMessage(message: any, pageId: string) {
  try {
    console.log('Processing incoming message:', message)

    const messageData = {
      instagram_message_id: message.mid,
      sender_id: message.from?.id || message.sender?.id,
      recipient_id: message.to?.id || pageId,
      message_text: message.text || '',
      timestamp: new Date(message.timestamp || Date.now()),
      message_type: 'received',
      raw_data: message
    }

    console.log('Saving message to database:', messageData)

    // Guardar mensaje en la base de datos
    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error('Error saving message:', error)
      return
    }

    console.log('Message saved successfully:', data)

    // Generar y enviar respuesta automática
    if (messageData.message_text && messageData.sender_id) {
      await generateAndSendAutoResponse(
        messageData.message_text,
        messageData.sender_id,
        messageData.instagram_message_id
      )
    }

  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

async function processDirectMessage(messaging: any) {
  try {
    console.log('Processing direct message:', messaging)

    const message = messaging.message
    const messageData = {
      instagram_message_id: message.mid,
      sender_id: messaging.sender?.id,
      recipient_id: messaging.recipient?.id,
      message_text: message.text || '',
      timestamp: new Date(messaging.timestamp || Date.now()),
      message_type: 'received',
      raw_data: messaging
    }

    console.log('Saving direct message to database:', messageData)

    // Guardar mensaje en la base de datos
    const { data, error } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()

    if (error) {
      console.error('Error saving direct message:', error)
      return
    }

    console.log('Direct message saved successfully:', data)

    // Generar y enviar respuesta automática
    if (messageData.message_text && messageData.sender_id) {
      await generateAndSendAutoResponse(
        messageData.message_text,
        messageData.sender_id,
        messageData.instagram_message_id
      )
    }

  } catch (error) {
    console.error('Error processing direct message:', error)
  }
}

async function generateAndSendAutoResponse(
  messageText: string, 
  senderId: string, 
  originalMessageId: string
) {
  try {
    console.log('Generating auto response for:', messageText)

    // Obtener configuración del usuario y historial de conversación
    const conversationHistory = await getConversationHistory(senderId)
    
    // Llamar a la función de ChatGPT para generar respuesta
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chatgpt-response', {
      body: {
        message: messageText,
        conversation_history: conversationHistory,
        sender_id: senderId
      }
    })

    if (aiError) {
      console.error('Error generating AI response:', aiError)
      return
    }

    const responseText = aiResponse?.response || 'Gracias por tu mensaje. Te responderé pronto.'
    console.log('Generated AI response:', responseText)

    // Enviar respuesta a Instagram
    await sendInstagramMessage(senderId, responseText, originalMessageId)

  } catch (error) {
    console.error('Error generating auto response:', error)
  }
}

async function getConversationHistory(senderId: string) {
  try {
    const { data, error } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('timestamp', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error getting conversation history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getConversationHistory:', error)
    return []
  }
}

async function sendInstagramMessage(recipientId: string, messageText: string, replyToMessageId?: string) {
  try {
    console.log('Sending Instagram message to:', recipientId)

    // Llamar a la función para enviar mensaje
    const { data, error } = await supabase.functions.invoke('instagram-send-message', {
      body: {
        recipient_id: recipientId,
        message_text: messageText,
        reply_to_message_id: replyToMessageId
      }
    })

    if (error) {
      console.error('Error sending Instagram message:', error)
      return
    }

    console.log('Instagram message sent successfully:', data)

  } catch (error) {
    console.error('Error in sendInstagramMessage:', error)
  }
}
