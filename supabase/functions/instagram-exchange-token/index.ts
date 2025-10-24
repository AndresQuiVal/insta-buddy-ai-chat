
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

    // ✅ OBTENER PÁGINAS DE FACEBOOK DEL USUARIO
    console.log('📋 Obteniendo páginas de Facebook del usuario...')
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${finalAccessToken}`)
    
    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json()
      console.error('❌ Error obteniendo páginas:', errorData)
      throw new Error('No se pudieron obtener las páginas de Facebook')
    }

    const pagesData = await pagesResponse.json()
    console.log('📊 Páginas obtenidas:', pagesData)

    // Buscar página con Instagram Business Account
    const pageWithInstagram = pagesData.data?.find((page: any) => page.instagram_business_account)
    
    if (!pageWithInstagram) {
      throw new Error('No se encontró una página de Facebook con Instagram Business conectado. Asegúrate de que tu cuenta de Instagram sea Business y esté conectada a una página de Facebook.')
    }

    console.log('✅ Página con Instagram encontrada:', pageWithInstagram)
    
    const instagramBusinessAccountId = pageWithInstagram.instagram_business_account.id
    const pageId = pageWithInstagram.id

    // ✅ OBTENER USERNAME DEL INSTAGRAM BUSINESS ACCOUNT
    console.log('📋 Obteniendo información del Instagram Business Account...')
    const instagramInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}?fields=username,name,profile_picture_url&access_token=${finalAccessToken}`)
    
    let finalUsername = `usuario_${instagramBusinessAccountId}`
    if (instagramInfoResponse.ok) {
      const instagramInfo = await instagramInfoResponse.json()
      console.log('📊 Info de Instagram Business Account:', instagramInfo)
      finalUsername = instagramInfo.username || finalUsername
      console.log('✅ Username obtenido:', finalUsername)
    } else {
      console.log('⚠️ No se pudo obtener username, usando temporal')
    }

    console.log('🆔 ===== ID CORRECTO DE INSTAGRAM BUSINESS ACCOUNT =====')
    console.log('👤 Instagram Business Account ID:', instagramBusinessAccountId)
    console.log('📄 Page ID:', pageId)
    console.log('📋 Username:', finalUsername)
    console.log('✅ Este ID es el correcto para hacer queries a Graph API')

    // ✅ GUARDAR EN SUPABASE CON EL ID CORRECTO DE INSTAGRAM BUSINESS ACCOUNT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('💾 ===== GUARDANDO EN BASE DE DATOS =====')
    console.log('🔑 Instagram Business Account ID:', instagramBusinessAccountId)
    console.log('📄 Page ID:', pageId)
    
    const { data: savedUser, error: saveError } = await supabase
      .from('instagram_users')
      .upsert({
        instagram_user_id: instagramBusinessAccountId,
        username: finalUsername,
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
    }
    
    console.log('✅ Usuario guardado correctamente')
    console.log('📊 Usuario guardado:', savedUser)

    return new Response(JSON.stringify({
      access_token: finalAccessToken,
      user: {
        id: tokenData.user_id,
        name: finalUsername
      },
      instagram_account: {
        id: instagramBusinessAccountId,
        user_id: instagramBusinessAccountId,
        username: finalUsername
      },
      business_account: {
        id: instagramBusinessAccountId,
        page_id: pageId
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
