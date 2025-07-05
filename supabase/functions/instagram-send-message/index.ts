
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientId, message, buttons, userId } = await req.json()
    
    console.log('📤 ENVIANDO MENSAJE:', {
      recipientId,
      message: message?.substring(0, 50) + '...',
      hasButtons: !!buttons,
      buttonsCount: buttons?.length || 0,
      userId
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener token de acceso del usuario
    const { data: user, error: userError } = await supabase
      .from('instagram_users')
      .select('access_token')
      .eq('instagram_user_id', userId)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      console.error('❌ Usuario no encontrado:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: corsHeaders }
      )
    }

    const accessToken = user.access_token

    // Preparar el payload del mensaje
    let messagePayload: any = {
      recipient: {
        id: recipientId
      }
    }

    // Si hay botones, usar template de botones
    if (buttons && buttons.length > 0) {
      console.log('🔘 Enviando mensaje con botones:', buttons.length)
      
      // Convertir botones al formato de Instagram API
      const instagramButtons = buttons.map((button: any) => {
        if (button.type === 'web_url') {
          return {
            type: 'web_url',
            url: button.url,
            title: button.title
          }
        } else if (button.type === 'postback') {
          return {
            type: 'postback',
            title: button.title,
            payload: button.payload
          }
        }
        return button
      }).slice(0, 3) // Máximo 3 botones

      messagePayload.message = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: message,
            buttons: instagramButtons
          }
        }
      }
    } else {
      // Mensaje de texto normal
      messagePayload.message = {
        text: message
      }
    }

    console.log('📋 PAYLOAD FINAL:', JSON.stringify(messagePayload, null, 2))

    // Enviar mensaje a Instagram API
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Error de Instagram API:', responseData)
      throw new Error(`Instagram API error: ${JSON.stringify(responseData)}`)
    }

    console.log('✅ MENSAJE ENVIADO:', responseData)

    // Guardar en base de datos
    await supabase
      .from('instagram_messages')
      .insert({
        instagram_message_id: responseData.message_id || `sent_${Date.now()}`,
        sender_id: userId,
        recipient_id: recipientId,
        message_text: buttons ? `[BOTONES] ${message}` : message,
        message_type: 'sent',
        raw_data: {
          ...responseData,
          sent_payload: messagePayload,
          has_buttons: !!buttons,
          buttons_count: buttons?.length || 0
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.message_id,
        hasButtons: !!buttons 
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
