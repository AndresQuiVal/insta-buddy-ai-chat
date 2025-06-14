
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
    const { recipient_id, message_text, reply_to_message_id, instagram_user_id } = await req.json()

    console.log('🚀 Instagram Send Message Edge Function iniciada')
    console.log('📝 Parámetros recibidos:', {
      recipient_id,
      message_text: message_text?.substring(0, 50) + '...',
      reply_to_message_id,
      instagram_user_id
    })

    // Validar parámetros requeridos
    if (!recipient_id || !message_text || !instagram_user_id) {
      console.error('❌ Faltan parámetros requeridos')
      return new Response(
        JSON.stringify({
          error: 'missing_required_params',
          message: 'Se requieren recipient_id, message_text e instagram_user_id'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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
          message: 'No se encontró token para este usuario de Instagram',
          debug_info: { userError, instagram_user_id }
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessToken = userData.access_token
    console.log('✅ Token encontrado para usuario:', userData.username)
    console.log('🔑 Token length:', accessToken.length)

    // Obtener información de las páginas del usuario
    console.log('📋 Obteniendo páginas del usuario...')
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()

    console.log('📄 Respuesta de páginas:', JSON.stringify(pagesData, null, 2))

    if (pagesData.error) {
      console.error('❌ Error obteniendo páginas:', pagesData.error)
      return new Response(
        JSON.stringify({
          error: 'facebook_api_error',
          message: pagesData.error.message,
          debug_info: { pagesData }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar página con Instagram Business conectado
    const pageWithInstagram = pagesData.data?.find((page: any) => page.instagram_business_account)

    if (!pageWithInstagram) {
      console.error('❌ No se encontró página con Instagram Business')
      return new Response(
        JSON.stringify({
          error: 'no_instagram_business_account',
          message: 'No se encontró cuenta de Instagram Business conectada',
          debug_info: { pagesData }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const pageId = pageWithInstagram.id
    const instagramAccountId = pageWithInstagram.instagram_business_account.id

    console.log('✅ Página encontrada:', {
      pageId,
      instagramAccountId,
      pageName: pageWithInstagram.name
    })

    // Construir el cuerpo del mensaje
    const messageBody: any = {
      recipient: { id: recipient_id },
      message: { text: message_text }
    }

    // Agregar reply_to si se proporciona
    if (reply_to_message_id) {
      messageBody.message.reply_to = { mid: reply_to_message_id }
    }

    console.log('📤 Enviando mensaje...')
    console.log('🎯 URL:', `https://graph.facebook.com/v19.0/${pageId}/messages`)
    console.log('💬 Cuerpo del mensaje:', JSON.stringify(messageBody, null, 2))

    // Enviar mensaje usando Page ID y access token
    const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messageBody,
        access_token: accessToken
      })
    })

    const responseData = await response.json()
    console.log('📨 Respuesta de Instagram:', JSON.stringify(responseData, null, 2))

    if (responseData.error) {
      console.error('❌ Error enviando mensaje:', responseData.error)
      return new Response(
        JSON.stringify({
          error: 'send_message_failed',
          message: 'Error enviando mensaje a Instagram',
          debug_info: {
            instagram_error: responseData.error,
            status: response.status,
            pageId,
            instagramAccountId
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

    return new Response(
      JSON.stringify({
        success: true,
        message_id: responseData.message_id,
        recipient_id: responseData.recipient_id || recipient_id,
        debug_info: {
          pageId,
          instagramAccountId,
          username: userData.username
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
        message: error.message,
        debug_info: { error: error.toString() }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
