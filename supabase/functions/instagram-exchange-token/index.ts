
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    
    console.log('=== CONFIGURACIÓN DE INSTAGRAM GRAPH API ===')
    
    // Verificar variables de entorno críticas
    const instagramAppId = Deno.env.get('INSTAGRAM_APP_ID')
    const instagramClientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')
    
    console.log('Instagram App ID:', instagramAppId ? 'Configurado ✓' : 'NO CONFIGURADO ❌')
    console.log('Instagram Client Secret:', instagramClientSecret ? 'Configurado ✓' : 'NO CONFIGURADO ❌')
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    if (!instagramAppId || !instagramClientSecret) {
      console.error('❌ Variables de entorno faltantes')
      return new Response(JSON.stringify({
        error: 'configuration_error',
        error_description: 'Instagram App ID o Client Secret no configurados en Supabase'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Intercambiar código por token de acceso
    console.log('Enviando solicitud a Instagram API...')
    
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: instagramAppId,
        client_secret: instagramClientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
        code: code,
      }),
    })

    console.log('Respuesta de Instagram API:', { status: tokenResponse.status, ok: tokenResponse.ok })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Error de Instagram API:', errorData)
      
      return new Response(JSON.stringify({
        error: errorData.error_type || 'token_exchange_failed',
        error_description: errorData.error_message || 'Failed to exchange code for token'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Token de acceso obtenido exitosamente')

    // Intercambiar por token de larga duración
    console.log('🔄 Intercambiando por token de larga duración...')
    const longLivedTokenResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${instagramClientSecret}&access_token=${tokenData.access_token}`)
    
    let finalAccessToken = tokenData.access_token
    if (longLivedTokenResponse.ok) {
      const longLivedTokenData = await longLivedTokenResponse.json()
      finalAccessToken = longLivedTokenData.access_token
      console.log('✅ Token de larga duración obtenido')
    } else {
      console.log('⚠️ No se pudo obtener token de larga duración, usando token normal')
    }

    // Obtener información básica del usuario
    console.log('📋 Obteniendo información del usuario...')
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${finalAccessToken}`)
    
    if (!userResponse.ok) {
      throw new Error('Error obteniendo información del usuario')
    }
    
    const userData = await userResponse.json()
    console.log('👤 Datos de usuario básicos obtenidos:', userData)

    // ✅ PASO CRÍTICO: OBTENER EL INSTAGRAM BUSINESS ACCOUNT ID REAL
    console.log('🎯 ===== OBTENIENDO INSTAGRAM BUSINESS ACCOUNT ID =====')
    
    let instagramBusinessId = null
    let pageId = null
    
    // Intentar obtener desde Graph API directamente
    try {
      const igAccountResponse = await fetch(`https://graph.instagram.com/me?fields=id,account_type&access_token=${finalAccessToken}`)
      
      if (igAccountResponse.ok) {
        const igAccountData = await igAccountResponse.json()
        console.log('📱 Datos de cuenta Instagram:', igAccountData)
        
        if (igAccountData.account_type === 'BUSINESS') {
          instagramBusinessId = igAccountData.id
          console.log('✅ Instagram Business Account ID encontrado:', instagramBusinessId)
        }
      }
    } catch (error) {
      console.log('⚠️ Error obteniendo Instagram Business Account:', error)
    }

    // ✅ ID FINAL PARA WEBHOOK: DEBE SER EL BUSINESS ACCOUNT ID
    const finalInstagramUserId = instagramBusinessId || userData.id
    
    console.log('🆔 ===== ID FINAL PARA WEBHOOK =====')
    console.log('👤 Instagram Personal ID:', userData.id)
    console.log('🏢 Instagram Business ID:', instagramBusinessId || 'No encontrado')
    console.log('💾 ID FINAL para Supabase (QUE USARÁ EL WEBHOOK):', finalInstagramUserId)

    // ✅ GUARDAR EN SUPABASE CON EL ID CORRECTO
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('💾 ===== GUARDANDO CON ID CORRECTO =====')
    console.log('🔑 Guardando con instagram_user_id:', finalInstagramUserId)
    
    const { data: savedUser, error: saveError } = await supabase
      .from('instagram_users')
      .upsert({
        instagram_user_id: finalInstagramUserId, // ✅ ESTE ES EL ID QUE USARÁ EL WEBHOOK
        username: userData.username || `Usuario_${finalInstagramUserId}`,
        access_token: finalAccessToken,
        page_id: pageId,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instagram_user_id'
      })
      .select()
    
    if (saveError) {
      console.error('❌ Error guardando usuario:', saveError)
      throw new Error('Error guardando usuario en base de datos')
    } else {
      console.log('✅ Usuario guardado/actualizado correctamente')
      console.log('📊 Usuario guardado:', savedUser)
    }

    // ✅ VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
    const { data: verifyUser, error: verifyError } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('instagram_user_id', finalInstagramUserId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verificando usuario guardado:', verifyError)
    } else {
      console.log('✅ ===== VERIFICACIÓN EXITOSA =====')
      console.log('🆔 Usuario en BD con instagram_user_id:', verifyUser.instagram_user_id)
      console.log('👤 Username:', verifyUser.username)
      console.log('🔗 ID interno BD:', verifyUser.id)
    }

    console.log('🎯 ===== EL WEBHOOK BUSCARÁ POR =====')
    console.log('🔍 recipient_id en webhook DEBE SER:', finalInstagramUserId)

    return new Response(JSON.stringify({
      access_token: finalAccessToken,
      user: userData,
      instagram_account: {
        id: finalInstagramUserId,
        user_id: finalInstagramUserId, // ✅ MISMO ID PARA COMPATIBILIDAD
        username: userData.username,
        instagram_business_id: instagramBusinessId,
        page_id: pageId,
        account_type: instagramBusinessId ? 'business' : 'personal'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error) {
    console.error('💥 Error en instagram-exchange-token:', error)
    
    return new Response(JSON.stringify({
      error: 'internal_server_error',
      error_description: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
