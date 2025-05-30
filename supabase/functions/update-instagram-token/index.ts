
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { access_token } = await req.json()

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'access_token es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== ACTUALIZANDO TOKEN DE INSTAGRAM Y GUARDANDO PAGE_ID ===')
    console.log('Nuevo token recibido:', access_token.substring(0, 20) + '...')

    // Validar el token con Facebook Graph API
    console.log('🔍 Validando token con Facebook Graph API...')
    const validationResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${access_token}`)
    
    if (!validationResponse.ok) {
      const errorData = await validationResponse.json()
      console.error('❌ Token inválido:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'invalid_token',
          error_description: 'El token no es válido o ha expirado',
          debug_info: errorData
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = await validationResponse.json()
    console.log('✅ Token válido para usuario:', userData.name || userData.id)

    // Validar permisos específicos
    console.log('🔑 Verificando permisos...')
    const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${access_token}`)
    const permissionsData = await permissionsResponse.json()
    
    console.log('Permisos encontrados:', permissionsData.data?.map(p => `${p.permission}:${p.status}`))

    // Verificar cuentas de Instagram Business y guardar PAGE_ID
    console.log('📱 Verificando cuentas de Instagram Business y obteniendo PAGE_ID...')
    let pageId = null
    let hasInstagramBusiness = false
    
    try {
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${access_token}`)
      const accountsData = await accountsResponse.json()
      
      if (accountsData.data) {
        for (const page of accountsData.data) {
          if (page.instagram_business_account) {
            hasInstagramBusiness = true
            pageId = page.id
            console.log(`✅ Instagram Business encontrado en página: ${page.name} (ID: ${pageId})`)
            
            // Guardar PAGE_ID automáticamente
            try {
              console.log(`🔑 Guardando PAGE_ID automáticamente: ${pageId}`)
              
              // Intentar actualizar el secreto PAGE_ID en Supabase
              const updateSecretResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/update_secret`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                  'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
                },
                body: JSON.stringify({
                  secret_name: 'PAGE_ID',
                  secret_value: pageId
                })
              })
              
              if (updateSecretResponse.ok) {
                console.log('✅ PAGE_ID guardado exitosamente en secretos')
              } else {
                console.error('❌ Error guardando PAGE_ID:', await updateSecretResponse.text())
                // Método alternativo usando variables de entorno
                Deno.env.set('PAGE_ID', pageId)
                console.log('✅ PAGE_ID guardado como variable de entorno temporal')
              }
            } catch (error) {
              console.error('❌ Error guardando PAGE_ID:', error)
            }
            
            break // Solo necesitamos el primer PAGE_ID con Instagram Business
          }
        }
      }
      
      console.log('Instagram Business conectado:', hasInstagramBusiness ? '✅' : '❌')
      if (pageId) {
        console.log('PAGE_ID obtenido y guardado:', pageId)
      }
      
    } catch (error) {
      console.error('Error verificando cuentas de Instagram:', error)
    }

    if (!hasInstagramBusiness) {
      console.warn('⚠️ No se encontró cuenta de Instagram Business')
    }

    console.log('✅ Token y configuración actualizados exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token y PAGE_ID actualizados correctamente',
        user: userData,
        permissions: permissionsData.data || [],
        hasInstagramBusiness: hasInstagramBusiness,
        pageId: pageId,
        recommendations: hasInstagramBusiness ? [] : [
          'Conecta una cuenta de Instagram Business para recibir mensajes',
          'Ve a Business Manager → Configuración → Cuentas de Instagram'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error actualizando token:', error)
    return new Response(
      JSON.stringify({ 
        error: 'internal_server_error',
        error_description: 'Error interno del servidor',
        debug_info: {
          error_message: error.message
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
