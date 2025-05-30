
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('=== INSTAGRAM WEBHOOK RECEIVED ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN') || 'your_verify_token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado exitosamente')
        return new Response(challenge, { 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        })
      } else {
        console.log('❌ Token de verificación inválido')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      
      console.log('📨 Webhook payload recibido:', JSON.stringify(body, null, 2))

      if (body.object === 'instagram') {
        let processedMessages = 0

        for (const entry of body.entry || []) {
          console.log('\n--- PROCESANDO ENTRY ---')
          console.log('Entry ID:', entry.id)

          const messaging = entry.messaging || []
          console.log('📱 Encontrados', messaging.length, 'mensajes en messaging')

          for (const message of messaging) {
            // Saltar eventos de lectura (read receipts)
            if (message.read) {
              continue
            }

            // Procesar solo mensajes de texto
            if (message.message && message.message.text) {
              console.log('💬 Procesando mensaje de texto')
              console.log('🔄 Procesando mensaje de texto')

              const messageText = message.message.text
              const senderId = message.sender.id
              const recipientId = message.recipient.id
              const timestamp = new Date(message.timestamp)
              const isEcho = message.message.is_echo || false

              // Obtener el PAGE_ID desde localStorage (debería estar en los secretos de Supabase)
              const PAGE_ID = Deno.env.get('PAGE_ID') || '17841474700701346' // Fallback al PAGE_ID que veo en los logs

              console.log('📋 Detalles del mensaje:')
              console.log('- Sender ID:', senderId)
              console.log('- Recipient ID:', recipientId)
              console.log('- PAGE_ID:', PAGE_ID)
              console.log('- Is Echo:', isEcho)
              console.log('- Texto:', messageText)

              // Determinar el tipo de mensaje basado en el sender
              // Si el sender es nuestro PAGE_ID, es un mensaje enviado por nosotros
              // Si el recipient es nuestro PAGE_ID, es un mensaje recibido
              let messageType: 'sent' | 'received'
              let actualSenderId: string

              if (senderId === PAGE_ID || isEcho) {
                // Mensaje enviado por nosotros
                messageType = 'sent'
                actualSenderId = recipientId // El prospecto es el recipient
                console.log('📤 Mensaje ENVIADO por nosotros hacia:', actualSenderId)
              } else {
                // Mensaje recibido de un prospecto
                messageType = 'received'
                actualSenderId = senderId // El prospecto es el sender
                console.log('📥 Mensaje RECIBIDO del prospecto:', actualSenderId)
              }

              // Detectar si es una invitación
              const isInvitation = detectInvitation(messageText)
              console.log('🔍 Detección de invitación:', isInvitation ? 'SÍ' : 'NO', 'para mensaje:', `"${messageText}"`)

              // Verificar si es respuesta única
              const isUniqueResponse = await checkUniqueResponse(supabase, actualSenderId, messageType)
              console.log('🔍 Respuesta única:', isUniqueResponse ? 'SÍ' : 'NO')

              // Preparar datos del mensaje
              const messageData = {
                instagram_message_id: message.message.mid,
                sender_id: actualSenderId,
                recipient_id: messageType === 'sent' ? actualSenderId : PAGE_ID,
                message_text: messageText,
                message_type: messageType,
                timestamp: timestamp.toISOString(),
                raw_data: body,
                is_invitation: isInvitation,
                is_unique_response: isUniqueResponse
              }

              console.log('💾 Guardando mensaje:', `"${messageText}"`, 'de Usuario', actualSenderId.slice(-4), 
                isInvitation ? '(INVITACIÓN DETECTADA)' : '', 
                isUniqueResponse ? '(RESPUESTA ÚNICA)' : '(RESPUESTA NO ÚNICA)')

              // Guardar mensaje en la base de datos
              const { error: insertError } = await supabase
                .from('instagram_messages')
                .insert(messageData)

              if (insertError) {
                console.error('❌ Error guardando mensaje:', insertError)
              } else {
                console.log('✅ Mensaje guardado exitosamente', 
                  isInvitation ? 'con marcador de invitación' : '', 
                  isUniqueResponse ? '(respuesta única)' : '(respuesta no única)')
                processedMessages++
              }

              console.log('📱 Mensaje procesado, respuesta automática se manejará desde el frontend')
            }
          }
        }

        console.log(`\n🎯 RESUMEN: ${processedMessages} mensajes procesados`)
        return new Response('ok', { headers: corsHeaders })
      }
    }

    return new Response('ok', { headers: corsHeaders })
  } catch (error) {
    console.error('❌ Error en webhook:', error)
    return new Response('Error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})

function detectInvitation(text: string): boolean {
  const invitationPatterns = [
    /zoom\.us/i,
    /meet\.google/i,
    /teams\.microsoft/i,
    /calendly/i,
    /cal\.com/i,
    /whatsapp/i,
    /wa\.me/i,
    /telegram/i,
    /t\.me/i,
    /discord/i,
    /link/i,
    /enlace/i,
    /reunión/i,
    /reunion/i,
    /meeting/i,
    /call/i,
    /llamada/i,
    /videollamada/i,
    /cita/i,
    /appointment/i
  ]
  
  return invitationPatterns.some(pattern => pattern.test(text))
}

async function checkUniqueResponse(supabase: any, senderId: string, messageType: 'sent' | 'received'): Promise<boolean> {
  try {
    // Obtener el último mensaje de este sender
    const { data: lastMessages, error } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error obteniendo últimos mensajes:', error)
      return false
    }

    if (!lastMessages || lastMessages.length === 0) {
      // Es el primer mensaje de este prospecto
      return messageType === 'received'
    }

    // Si es un mensaje enviado por nosotros, no es respuesta única
    if (messageType === 'sent') {
      return false
    }

    // Si es un mensaje recibido, verificar cuánto tiempo ha pasado desde el último mensaje recibido
    const lastReceivedMessage = lastMessages.find(msg => msg.message_type === 'received')
    
    if (!lastReceivedMessage) {
      // Es la primera respuesta del prospecto
      return true
    }

    const lastReceivedTime = new Date(lastReceivedMessage.timestamp).getTime()
    const now = new Date().getTime()
    const hoursSinceLastReceived = (now - lastReceivedTime) / (1000 * 60 * 60)

    console.log(`⏰ Tiempo desde último mensaje recibido: ${hoursSinceLastReceived.toFixed(1)} horas`)

    // Es respuesta única si han pasado más de 5 horas
    if (hoursSinceLastReceived > 5) {
      console.log('✅ Respuesta después de 5+ horas - ÚNICA')
      return true
    } else {
      console.log('❌ Respuesta después de solo', hoursSinceLastReceived.toFixed(1), 'horas - NO ÚNICA')
      return false
    }

  } catch (error) {
    console.error('Error en checkUniqueResponse:', error)
    return false
  }
}
