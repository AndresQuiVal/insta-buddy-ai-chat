
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
    const { code, redirect_uri } = await req.json()

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Código y redirect_uri son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configuración de Instagram Graph API (nueva API oficial)
    const FACEBOOK_APP_ID = '2942884966099377' // Facebook App ID principal
    const CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET')

    if (!CLIENT_SECRET) {
      console.error('INSTAGRAM_CLIENT_SECRET no está configurado')
      return new Response(
        JSON.stringify({ 
          error: 'invalid_client_secret', 
          error_description: 'Configuración del servidor incompleta' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== CONFIGURACIÓN DE INSTAGRAM GRAPH API ===')
    console.log('Facebook App ID:', FACEBOOK_APP_ID)
    console.log('Redirect URI recibida:', redirect_uri)
    console.log('Código recibido:', code.substring(0, 20) + '...')

    // Intercambiar código por token de acceso usando Graph API
    const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token'
    
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
      code: code
    })

    console.log('Enviando solicitud a Facebook Graph API...')
    
    const tokenResponse = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'GET'
    })

    const tokenData = await tokenResponse.json()
    
    console.log('Respuesta de Graph API:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error
    })
    
    if (!tokenResponse.ok) {
      console.error('Error detallado de Graph API:', tokenData)
      
      // Manejo específico de errores comunes
      let errorDescription = tokenData.error?.message || 'Error obteniendo token de Instagram'
      
      if (tokenData.error?.code === 100) {
        errorDescription = 'App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.'
      } else if (tokenData.error?.type === 'OAuthException') {
        errorDescription = `URL de redirección no válida: ${redirect_uri}. Configúrala en Facebook Developers.`
      } else if (tokenData.error?.code === 190) {
        errorDescription = 'Código de autorización inválido o expirado. Intenta autenticarte nuevamente.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: tokenData.error?.type || 'token_exchange_failed',
          error_description: errorDescription,
          debug_info: {
            client_id_used: FACEBOOK_APP_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status,
            facebook_error: tokenData.error
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token obtenido exitosamente')

    // Obtener información del usuario de Instagram usando Graph API
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`)
    
    let userData = null
    let instagramData = null
    let debugInfo = {
      user_accounts_found: [],
      instagram_search_attempts: [],
      permissions_granted: [],
      final_result: null,
      detailed_errors: []
    }

    if (userResponse.ok) {
      userData = await userResponse.json()
      console.log('Datos de usuario de Facebook obtenidos:', userData)

      // NUEVO: Verificar permisos del token
      try {
        const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${tokenData.access_token}`)
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          debugInfo.permissions_granted = permissionsData.data?.map(p => p.permission) || []
          console.log('Permisos otorgados:', debugInfo.permissions_granted)
        }
      } catch (error) {
        console.error('Error obteniendo permisos:', error)
        debugInfo.detailed_errors.push(`Error permisos: ${error.message}`)
      }

      // MEJORADO: Búsqueda más completa de Instagram con debug detallado
      try {
        console.log('=== INICIANDO BÚSQUEDA DETALLADA DE INSTAGRAM ===')
        
        // Primero buscar todas las cuentas/páginas del usuario con más campos
        const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=id,name,instagram_business_account,access_token,category,about&access_token=${tokenData.access_token}`)
        
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          console.log('=== PÁGINAS DE FACEBOOK ENCONTRADAS ===')
          console.log('Total páginas:', accountsData.data?.length || 0)
          console.log('Páginas completas:', JSON.stringify(accountsData, null, 2))
          
          debugInfo.user_accounts_found = accountsData.data || []
          
          // Verificar cada página en detalle
          for (const page of accountsData.data || []) {
            console.log(`\n=== ANALIZANDO PÁGINA: ${page.name} (ID: ${page.id}) ===`)
            
            const attemptInfo = {
              page_id: page.id,
              page_name: page.name,
              page_category: page.category || 'N/A',
              has_instagram_business_account: !!page.instagram_business_account,
              instagram_account_id: page.instagram_business_account?.id || null,
              attempt_details: [],
              errors: []
            }

            if (page.instagram_business_account) {
              const instagramAccountId = page.instagram_business_account.id
              console.log(`✓ Instagram Business encontrado: ${instagramAccountId}`)
              
              // Usar el token de la página si está disponible, sino usar el token del usuario
              const pageToken = page.access_token || tokenData.access_token
              console.log(`Usando token: ${pageToken ? 'Token de página' : 'Token de usuario'}`)
              
              // MÉTODO 1: Intentar con campos básicos primero
              console.log('--- Intento 1: Campos básicos ---')
              try {
                const basicInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username&access_token=${pageToken}`)
                const basicInfoText = await basicInfoResponse.text()
                
                attemptInfo.attempt_details.push({
                  method: 'campos_basicos',
                  url: `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username`,
                  status: basicInfoResponse.status,
                  response: basicInfoText
                })
                
                if (basicInfoResponse.ok) {
                  const basicInfo = JSON.parse(basicInfoText)
                  console.log('✓ Campos básicos obtenidos:', basicInfo)
                  instagramData = basicInfo
                  attemptInfo.success = true
                } else {
                  console.log('✗ Error campos básicos:', basicInfoText)
                  attemptInfo.errors.push(`Campos básicos: ${basicInfoText}`)
                }
              } catch (error) {
                console.log('✗ Excepción campos básicos:', error.message)
                attemptInfo.errors.push(`Excepción campos básicos: ${error.message}`)
              }
              
              // MÉTODO 2: Si no funcionó, intentar con otros campos
              if (!instagramData) {
                console.log('--- Intento 2: Campos alternativos ---')
                try {
                  const altInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,name,profile_picture_url&access_token=${pageToken}`)
                  const altInfoText = await altInfoResponse.text()
                  
                  attemptInfo.attempt_details.push({
                    method: 'campos_alternativos',
                    url: `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,name,profile_picture_url`,
                    status: altInfoResponse.status,
                    response: altInfoText
                  })
                  
                  if (altInfoResponse.ok) {
                    const altInfo = JSON.parse(altInfoText)
                    console.log('✓ Campos alternativos obtenidos:', altInfo)
                    instagramData = altInfo
                    attemptInfo.success = true
                  } else {
                    console.log('✗ Error campos alternativos:', altInfoText)
                    attemptInfo.errors.push(`Campos alternativos: ${altInfoText}`)
                  }
                } catch (error) {
                  console.log('✗ Excepción campos alternativos:', error.message)
                  attemptInfo.errors.push(`Excepción campos alternativos: ${error.message}`)
                }
              }
              
              // MÉTODO 3: Si aún no funciona, intentar solo el ID
              if (!instagramData) {
                console.log('--- Intento 3: Solo ID ---')
                try {
                  const idOnlyResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?access_token=${pageToken}`)
                  const idOnlyText = await idOnlyResponse.text()
                  
                  attemptInfo.attempt_details.push({
                    method: 'solo_id',
                    url: `https://graph.facebook.com/v19.0/${instagramAccountId}`,
                    status: idOnlyResponse.status,
                    response: idOnlyText
                  })
                  
                  if (idOnlyResponse.ok) {
                    const idOnly = JSON.parse(idOnlyText)
                    console.log('✓ Solo ID obtenido:', idOnly)
                    instagramData = { id: instagramAccountId, ...idOnly }
                    attemptInfo.success = true
                  } else {
                    console.log('✗ Error solo ID:', idOnlyText)
                    attemptInfo.errors.push(`Solo ID: ${idOnlyText}`)
                  }
                } catch (error) {
                  console.log('✗ Excepción solo ID:', error.message)
                  attemptInfo.errors.push(`Excepción solo ID: ${error.message}`)
                }
              }
              
            } else {
              console.log('✗ No tiene Instagram Business Account vinculado')
              attemptInfo.errors.push('Página no tiene Instagram Business Account')
            }
            
            debugInfo.instagram_search_attempts.push(attemptInfo)
            
            // Si encontramos Instagram, salir del loop
            if (instagramData) {
              console.log('🎉 INSTAGRAM ENCONTRADO - Terminando búsqueda')
              debugInfo.final_result = 'success'
              break
            }
          }
        } else {
          const accountsError = await accountsResponse.text()
          console.error('Error obteniendo cuentas de Facebook:', accountsError)
          debugInfo.detailed_errors.push(`Error obteniendo cuentas: ${accountsError}`)
          debugInfo.instagram_search_attempts.push({
            error: 'No se pudieron obtener cuentas de Facebook',
            details: accountsError,
            status: accountsResponse.status
          })
        }
      } catch (instagramError) {
        console.error('Error en búsqueda de Instagram:', instagramError)
        debugInfo.detailed_errors.push(`Excepción búsqueda: ${instagramError.message}`)
        debugInfo.instagram_search_attempts.push({
          error: 'Excepción durante búsqueda',
          details: instagramError.message
        })
      }
    } else {
      console.error('Error obteniendo datos de usuario:', await userResponse.text())
      debugInfo.detailed_errors.push('Error obteniendo datos de usuario de Facebook')
      // En modo Development, esto puede fallar pero no es crítico
      userData = {
        id: 'development_user',
        name: 'Usuario de Prueba'
      }
    }

    if (!instagramData) {
      debugInfo.final_result = 'no_instagram_found'
      console.log('=== DIAGNÓSTICO FINAL DETALLADO ===')
      console.log('Instagram NO encontrado. Debug completo:', JSON.stringify(debugInfo, null, 2))
    }

    // Preparar respuesta con datos combinados y debug extendido
    const responseData = {
      access_token: tokenData.access_token,
      user: userData,
      instagram_account: instagramData,
      debug_info: {
        app_mode: 'production',
        client_id_used: FACEBOOK_APP_ID,
        api_version: 'Graph API v19.0',
        extended_debug: debugInfo
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en edge function:', error)
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
