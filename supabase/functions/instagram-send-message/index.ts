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
    const { 
      recipient_id, 
      message_text, 
      reply_to_message_id, 
      instagram_user_id, 
      comment_id, 
      use_button, 
      button_text, 
      button_url,
      button_type = 'web_url',
      postback_payload
    } = await req.json()

    console.log('🚀 Instagram Send Message Edge Function iniciada')
    console.log('📝 Parámetros recibidos:', {
      recipient_id,
      message_text: message_text?.substring(0, 50) + '...',
      reply_to_message_id,
      instagram_user_id,
      comment_id,
      use_button,
      button_text,
      button_url: button_url?.substring(0, 50) + '...',
      button_type,
      postback_payload
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

    // Validar configuración del botón si se usa
    if (use_button) {
      if (!button_text) {
        console.error('❌ Falta button_text para el botón')
        return new Response(
          JSON.stringify({ error: 'Button text is required when use_button is true' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (button_type === 'web_url') {
        if (!button_url) {
          console.error('❌ Falta button_url para botón web_url')
          return new Response(
            JSON.stringify({ error: 'Button URL is required for web_url type' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validar formato de URL
        try {
          new URL(button_url)
        } catch {
          console.error('❌ URL del botón no es válida:', button_url)
          return new Response(
            JSON.stringify({ error: 'Invalid button URL format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else if (button_type === 'postback') {
        if (!postback_payload) {
          console.error('❌ Falta postback_payload para botón postback')
          return new Response(
            JSON.stringify({ error: 'Postback payload is required for postback type' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
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
      // PRIVATE REPLY
      messageType = 'private_reply'
      
      if (use_button) {
        console.log(`🔘 Enviando PRIVATE REPLY CON BOTÓN ${button_type.toUpperCase()} usando comment_id:`, comment_id)
        
        const button = button_type === 'web_url' 
          ? { type: "web_url", url: button_url, title: button_text }
          : { type: "postback", payload: postback_payload, title: button_text }

        messageBody = {
          recipient: { comment_id },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message_text,
                buttons: [button]
              }
            }
          }
        }
      } else {
        messageBody = {
          recipient: { comment_id },
          message: { text: message_text }
        }
        console.log('💬 Enviando PRIVATE REPLY usando comment_id:', comment_id)
      }
    } else {
      // DM NORMAL
      messageType = 'direct_message'
      
      if (use_button) {
        console.log(`🔘 Enviando DM CON BOTÓN ${button_type.toUpperCase()} al recipient_id:`, recipient_id)
        
        const button = button_type === 'web_url' 
          ? { type: "web_url", url: button_url, title: button_text }
          : { type: "postback", payload: postback_payload, title: button_text }

        messageBody = {
          recipient: { id: recipient_id },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message_text,
                buttons: [button]
              }
            }
          }
        }
      } else {
        messageBody = {
          recipient: { id: recipient_id },
          message: { text: message_text }
        }

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

    // 🔥 ACTUALIZAR TIMESTAMP Y MÉTRICAS DIARIAS
    try {
      // Primero obtener el UUID del usuario
      const { data: instagramUser, error: userError } = await supabase
        .from('instagram_users')
        .select('id')
        .eq('instagram_user_id', instagram_user_id)
        .single()

      if (userError || !instagramUser) {
        console.error('❌ Error obteniendo UUID del usuario para actualizar timestamp:', userError)
      } else {
        // Determinar el recipient_id correcto (para private replies usamos comment_id)
        const finalRecipientId = recipient_id || comment_id

        // 1. Actualizar timestamp del último mensaje del dueño
        const { error: timestampError } = await supabase.rpc('update_prospect_owner_message_timestamp', {
          p_instagram_user_id: instagramUser.id,
          p_prospect_instagram_id: finalRecipientId,
          p_is_from_owner: true
        })
        
        if (timestampError) {
          console.error('❌ Error actualizando timestamp del último mensaje del dueño:', timestampError)
        } else {
          console.log('✅ Timestamp del último mensaje del dueño actualizado correctamente')
        }

        // 2. 📊 INCREMENTAR MÉTRICAS DIARIAS (Abiertas/Seguimientos)
        try {
          const { data: contactResult, error: contactError } = await supabase.rpc('increment_daily_prospect_contact', {
            p_instagram_user_id: instagram_user_id,  // Tu instagram user ID
            p_prospect_sender_id: finalRecipientId   // El prospecto al que le escribes
          })
          
          if (contactError) {
            console.error('❌ Error incrementando métricas de contacto diario:', contactError)
          } else {
            console.log('✅ Métricas de contacto diario actualizadas:', contactResult)
            console.log('📊 Se incrementaron las métricas según el estado del prospecto (Abiertas/Seguimientos)')
          }
        } catch (error) {
          console.error('❌ Error en RPC increment_daily_prospect_contact:', error)
        }
      }
    } catch (error) {
      console.error('❌ Error en actualización de timestamp y métricas:', error)
    }

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