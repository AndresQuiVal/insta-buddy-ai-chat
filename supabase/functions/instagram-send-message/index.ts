
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { recipient_id, message_text, reply_to_message_id, instagram_user_id, comment_id, use_button, button_text, button_url } = await req.json()

    console.log('🚀 Instagram Send Message Edge Function iniciada')
    console.log('📝 Parámetros recibidos:', {
      recipient_id,
      message_text: message_text?.substring(0, 50) + '...',
      reply_to_message_id,
      instagram_user_id,
      comment_id,
      use_button,
      button_text,
      button_url: button_url?.substring(0, 50) + '...'
    })

    // Validar parámetros requeridos
    if (!message_text || !instagram_user_id) {
      console.error('❌ Faltan parámetros requeridos')
      return new Response(
        JSON.stringify({
          error: 'missing_required_params',
          message: 'Se requieren message_text e instagram_user_id'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Para private replies necesitamos comment_id, para DMs normales necesitamos recipient_id
    if (!comment_id && !recipient_id) {
      console.error('❌ Se requiere comment_id para private reply o recipient_id para DM normal')
      return new Response(
        JSON.stringify({
          error: 'missing_recipient_params',
          message: 'Se requiere comment_id para private reply o recipient_id para DM normal'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar parámetros de botón si se usa botón
    if (use_button) {
      if (!button_text || !button_url) {
        console.error('❌ Faltan parámetros de botón')
        return new Response(
          JSON.stringify({
            error: 'missing_button_params',
            message: 'Se requieren button_text y button_url cuando use_button es true'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validar que la URL sea válida
      try {
        new URL(button_url)
      } catch {
        console.error('❌ URL de botón inválida')
        return new Response(
          JSON.stringify({
            error: 'invalid_button_url',
            message: 'La URL del botón debe ser una URL válida'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Buscando token para usuario:', instagram_user_id)

    // Obtener token del usuario desde Supabase
    const { data: userData, error: userError } = await supabase
      .from('instagram_users')
      .select('access_token, instagram_user_id, username')
      .eq('instagram_user_id', instagram_user_id)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      console.error('❌ Error obteniendo usuario:', userError)
      return new Response(
        JSON.stringify({
          error: 'token_not_found',
          message: 'No se encontró token para este usuario de Instagram'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessToken = userData.access_token
    console.log('✅ Token encontrado para usuario:', userData.username)

    // Verificar validez del token antes de usar
    console.log('🔍 Verificando validez del token...')
    const tokenTestResponse = await fetch(`https://graph.instagram.com/me?access_token=${accessToken}`)
    const tokenTestData = await tokenTestResponse.json()

    if (tokenTestData.error) {
      console.error('❌ Token inválido:', tokenTestData.error)
      return new Response(
        JSON.stringify({
          error: 'invalid_token',
          message: 'Token de Instagram inválido o expirado',
          debug_info: { token_error: tokenTestData.error }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const instagramId = tokenTestData.id
    console.log('✅ Token válido - ID:', instagramId)

    // Construir el cuerpo del mensaje según el tipo
    let messageBody
    let messageType

    if (comment_id) {
      // 🆕 PRIVATE REPLY - Usando la documentación oficial
      messageType = 'private_reply'
      
      if (use_button) {
        // PRIVATE REPLY CON BOTÓN
        messageBody = {
          recipient: { 
            comment_id: comment_id 
          },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message_text,
                buttons: [
                  {
                    type: "web_url",
                    url: button_url,
                    title: button_text
                  }
                ]
              }
            }
          }
        }
        console.log('🔘 Enviando PRIVATE REPLY CON BOTÓN usando comment_id:', comment_id)
      } else {
        // PRIVATE REPLY NORMAL
        messageBody = {
          recipient: { 
            comment_id: comment_id 
          },
          message: { 
            text: message_text 
          }
        }
        console.log('💬 Enviando PRIVATE REPLY usando comment_id:', comment_id)
      }
    } else {
      // DM NORMAL
      messageType = 'direct_message'
      
      if (use_button) {
        // DM CON BOTÓN
        messageBody = {
          recipient: { 
            id: recipient_id 
          },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message_text,
                buttons: [
                  {
                    type: "web_url",
                    url: button_url,
                    title: button_text
                  }
                ]
              }
            }
          }
        }
        
        // Solo agregar reply_to para mensajes normales (no se puede con template de botón)
        // Los templates de botón no soportan reply_to según la documentación
        console.log('🔘 Enviando DM CON BOTÓN a recipient_id:', recipient_id)
      } else {
        // DM NORMAL
        messageBody = {
          recipient: { 
            id: recipient_id 
          },
          message: { 
            text: message_text 
          }
        }

        // Solo agregar reply_to para mensajes normales
        if (reply_to_message_id) {
          messageBody.message.reply_to = { mid: reply_to_message_id }
        }
        console.log('💬 Enviando DM NORMAL a recipient_id:', recipient_id)
      }
    }

    console.log('📤 Enviando mensaje...')
    console.log('🎯 URL:', `https://graph.instagram.com/v23.0/${instagramId}/messages`)
    console.log('💬 Tipo de mensaje:', messageType)
    console.log('💬 Cuerpo del mensaje:', JSON.stringify(messageBody, null, 2))

    // Enviar mensaje usando la API de Instagram
    const response = await fetch(`https://graph.instagram.com/v23.0/${instagramId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(messageBody)
    })

    const responseData = await response.json()
    console.log('📨 Respuesta de Instagram:', JSON.stringify(responseData, null, 2))

    if (responseData.error) {
      console.error('❌ Error enviando mensaje:', responseData.error)
      
      // Manejar error específico de ventana de tiempo
      if (responseData.error.message && responseData.error.message.includes('outside of allowed window')) {
        console.log('⏰ Mensaje fuera de ventana permitida')
        return new Response(
          JSON.stringify({
            error: 'outside_allowed_window',
            message: messageType === 'private_reply' 
              ? 'Private reply fuera de ventana de 7 días' 
              : 'DM fuera de ventana de 24h',
            debug_info: {
              instagram_error: responseData.error,
              message_type: messageType
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          error: 'send_message_failed',
          message: 'Error enviando mensaje a Instagram',
          debug_info: {
            instagram_error: responseData.error,
            status: response.status,
            instagramId,
            message_body_sent: messageBody,
            message_type: messageType
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Mensaje enviado exitosamente')
    console.log('🆔 Message ID:', responseData.message_id)
    console.log('👤 Recipient ID:', responseData.recipient_id)

    return new Response(
      JSON.stringify({
        success: true,
        message_id: responseData.message_id,
        recipient_id: responseData.recipient_id,
        message_type: messageType,
        debug_info: {
          instagramId,
          username: userData.username,
          used_comment_id: comment_id || null
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error general:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
