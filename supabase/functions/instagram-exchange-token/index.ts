
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
    console.log('Instagram App ID:', Deno.env.get('INSTAGRAM_APP_ID'))
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    // Intercambiar código por token de acceso usando Facebook Graph API
    console.log('Enviando solicitud a Facebook Graph API...')
    
    const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('INSTAGRAM_APP_ID')!,
        client_secret: Deno.env.get('INSTAGRAM_CLIENT_SECRET')!,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
        code: code,
      }),
    })

    console.log('Respuesta de Graph API:', { status: tokenResponse.status, ok: tokenResponse.ok, hasError: !tokenResponse.ok })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Error de Graph API:', errorData)
      
      return new Response(JSON.stringify({
        error: errorData.error?.type || 'token_exchange_failed',
        error_description: errorData.error?.message || 'Failed to exchange code for token'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const tokenData = await tokenResponse.json()
    console.log('Token obtenido exitosamente')

    // ✅ OBTENER INFORMACIÓN DEL USUARIO DE FACEBOOK PRIMERO
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`)
    
    if (!userResponse.ok) {
      throw new Error('Error obteniendo información del usuario de Facebook')
    }
    
    const userData = await userResponse.json()
    console.log('Datos de usuario de Facebook obtenidos:', userData)

    // ✅ BUSCAR INSTAGRAM BUSINESS ACCOUNT Y OBTENER EL ID CORRECTO PARA WEBHOOKS
    console.log('=== INICIANDO BÚSQUEDA DE INSTAGRAM BUSINESS Y GUARDADO DE PAGE_ID ===')
    
    let instagramBusinessAccountId = null;
    let pageId = null;
    
    try {
      // Obtener páginas administradas por el usuario
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${tokenData.access_token}`
      );
      
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        console.log('Páginas obtenidas:', pagesData);
        
        // Buscar página con Instagram Business Account
        const pageWithInstagram = pagesData.data?.find(
          (page: any) => page.instagram_business_account
        );
        
        if (pageWithInstagram) {
          instagramBusinessAccountId = pageWithInstagram.instagram_business_account.id;
          pageId = pageWithInstagram.id;
          
          console.log('✅ Instagram Business Account encontrado:');
          console.log('- Instagram Business Account ID:', instagramBusinessAccountId);
          console.log('- Page ID:', pageId);
          
          // ✅ GUARDAR EN SUPABASE CON EL ID CORRECTO PARA WEBHOOKS
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          console.log('💾 Guardando usuario en instagram_users con ID correcto...');
          
          const { data: savedUser, error: saveError } = await supabase
            .from('instagram_users')
            .upsert({
              instagram_user_id: instagramBusinessAccountId, // ✅ USAR EL ID CORRECTO PARA WEBHOOKS
              username: userData.name || `Usuario_${instagramBusinessAccountId}`,
              access_token: tokenData.access_token,
              page_id: pageId,
              is_active: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'instagram_user_id'
            });
          
          if (saveError) {
            console.error('❌ Error guardando usuario:', saveError);
          } else {
            console.log('✅ Usuario guardado/actualizado correctamente:', savedUser);
          }
          
        } else {
          console.log('❌ No se encontró página con Instagram Business Account');
        }
      } else {
        const errorData = await pagesResponse.json();
        console.error('Error obteniendo páginas de Facebook:', errorData);
      }
    } catch (error) {
      console.error('⚠️ Error buscando Instagram Business Account:', error);
    }

    if (!instagramBusinessAccountId) {
      console.log('⚠️ Instagram Business Account ID no pudo ser obtenido');
    }
    
    if (!pageId) {
      console.log('⚠️ PAGE_ID no pudo ser obtenido');
    }

    // ✅ RETORNAR RESPUESTA CON TODOS LOS IDs NECESARIOS
    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      user: userData,
      instagram_business_account_id: instagramBusinessAccountId, // ✅ ID PARA WEBHOOKS
      page_id: pageId,
      instagram_account: instagramBusinessAccountId ? {
        id: instagramBusinessAccountId,
        business_account_id: instagramBusinessAccountId // ✅ DUPLICAR PARA COMPATIBILIDAD
      } : null
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
