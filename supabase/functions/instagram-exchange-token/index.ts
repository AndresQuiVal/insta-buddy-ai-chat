
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
    console.log('Token obtenido exitosamente')

    // Obtener información del usuario de Facebook/Instagram
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`)
    
    if (!userResponse.ok) {
      throw new Error('Error obteniendo información del usuario')
    }
    
    const userData = await userResponse.json()
    console.log('Datos de usuario básicos obtenidos:', userData)

    // Intentar obtener páginas de Facebook conectadas con Instagram Business
    let instagramBusinessId = null
    let pageId = null
    
    try {
      console.log('🔍 Buscando cuentas de Instagram Business...')
      const pagesResponse = await fetch(`https://graph.instagram.com/me/accounts?fields=id,name,instagram_business_account&access_token=${tokenData.access_token}`)
      
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        console.log('📄 Páginas encontradas:', pagesData)
        
        const pageWithInstagram = pagesData.data?.find(page => page.instagram_business_account)
        
        if (pageWithInstagram) {
          instagramBusinessId = pageWithInstagram.instagram_business_account.id
          pageId = pageWithInstagram.id
          console.log('✅ Instagram Business ID encontrado:', instagramBusinessId)
          console.log('✅ Page ID encontrado:', pageId)
        } else {
          console.log('⚠️ No se encontró Instagram Business Account conectado')
        }
      } else {
        console.log('⚠️ No se pudieron obtener las páginas')
      }
    } catch (error) {
      console.log('⚠️ Error obteniendo Instagram Business:', error)
    }

    // Usar Instagram Business ID si está disponible, de lo contrario usar el ID personal
    const finalInstagramUserId = instagramBusinessId || userData.id
    
    console.log('🆔 ID final para guardar en Supabase:', finalInstagramUserId)
    console.log('📝 Tipo de cuenta:', instagramBusinessId ? 'Instagram Business' : 'Instagram Personal')

    // Guardar en Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('💾 Guardando usuario en instagram_users...')
    
    const { data: savedUser, error: saveError } = await supabase
      .from('instagram_users')
      .upsert({
        instagram_user_id: finalInstagramUserId, // Usar Instagram Business ID si está disponible
        username: userData.username || `Usuario_${finalInstagramUserId}`,
        access_token: tokenData.access_token,
        page_id: pageId, // Guardar page_id si está disponible
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instagram_user_id'
      })
    
    if (saveError) {
      console.error('❌ Error guardando usuario:', saveError)
    } else {
      console.log('✅ Usuario guardado/actualizado correctamente:', savedUser)
    }

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      user: userData,
      instagram_account: {
        id: finalInstagramUserId, // Usar el ID correcto
        user_id: finalInstagramUserId, // Para compatibilidad
        username: userData.username,
        instagram_business_id: instagramBusinessId,
        page_id: pageId,
        account_type: instagramBusinessId ? 'business' : 'personal'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error) {
    console.error('Error en instagram-exchange-token:', error)
    
    return new Response(JSON.stringify({
      error: 'internal_server_error',
      error_description: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
