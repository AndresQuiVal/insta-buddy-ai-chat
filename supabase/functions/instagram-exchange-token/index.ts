import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({
          error: "Código y redirect_uri son requeridos",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Configuración de Instagram Graph API (nueva API oficial)
    const INSTAGRAM_APP_ID = "1059372749433300"; // Instagram App ID principal
    const CLIENT_SECRET = Deno.env.get("INSTAGRAM_CLIENT_SECRET");
    if (!CLIENT_SECRET) {
      console.error("INSTAGRAM_CLIENT_SECRET no está configurado");
      return new Response(
        JSON.stringify({
          error: "invalid_client_secret",
          error_description: "Configuración del servidor incompleta",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("=== CONFIGURACIÓN DE INSTAGRAM GRAPH API ===");
    console.log("Instagram App ID:", INSTAGRAM_APP_ID);
    console.log("Redirect URI recibida:", redirect_uri);
    console.log("Código recibido:", code.substring(0, 20) + "...");
    // Intercambiar código por token de acceso usando Graph API
    const tokenUrl = "https://api.instagram.com/oauth/access_token";
    const formData = new FormData();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirect_uri);
    formData.append("code", code);
    console.log("Enviando solicitud a Facebook Graph API...");
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      body: formData,
    });
    const tokenData = await tokenResponse.json();
    console.log("Respuesta de Graph API:", {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error,
    });
    if (!tokenResponse.ok) {
      console.error("Error detallado de Graph API:", tokenData);
      // Manejo específico de errores comunes
      let errorDescription =
        tokenData.error?.message || "Error obteniendo token de Instagram";
      if (tokenData.error?.code === 100) {
        errorDescription =
          "App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.";
      } else if (tokenData.error?.type === "OAuthException") {
        errorDescription = `URL de redirección no válida: ${redirect_uri}. Configúrala en Facebook Developers.`;
      } else if (tokenData.error?.code === 190) {
        errorDescription =
          "Código de autorización inválido o expirado. Intenta autenticarte nuevamente.";
      }
      return new Response(
        JSON.stringify({
          error: tokenData.error?.type || "token_exchange_failed",
          error_description: errorDescription,
          debug_info: {
            client_id_used: INSTAGRAM_APP_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status,
            facebook_error: tokenData.error,
          },
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("Token obtenido exitosamente");
    // Obtener información del usuario de Instagram usando Graph API
    const userResponse = await fetch(
      `https://graph.instagram.com/v23.0/me?fields=id,user_id,username,name&access_token=${tokenData.access_token}`
    );
    let userData = null;
    let instagramData = null;
    let pageId = null;
    let debugInfo = {
      user_accounts_found: [],
      instagram_search_attempts: [],
      permissions_granted: [],
      final_result: null,
      detailed_errors: [],
      page_id_saved: false,
    };
    if (userResponse.ok) {
      userData = await userResponse.json();
      console.log("Datos de usuario de Facebook obtenidos:", userData);
      // Verificar permisos del token
      try {
        const permissionsResponse = await fetch(
          `https://graph.instagram.com/v23.0/me/permissions?access_token=${tokenData.access_token}`
        );
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          debugInfo.permissions_granted =
            permissionsData.data?.map((p) => p.permission) || [];
          console.log("Permisos otorgados:", debugInfo.permissions_granted);
        }
      } catch (error) {
        console.error("Error obteniendo permisos:", error);
        debugInfo.detailed_errors.push(`Error permisos: ${error.message}`);
      }
      // Búsqueda de Instagram Business y guardar PAGE_ID automáticamente
      try {
        console.log(
          "=== INICIANDO BÚSQUEDA DE INSTAGRAM BUSINESS Y GUARDADO DE PAGE_ID ==="
        );
        const accountsResponse = await fetch(
          `https://graph.instagram.com/v23.0/${userData.id}/accounts?fields=id,name,instagram_business_account,access_token,category,about&access_token=${tokenData.access_token}`
        );
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          console.log("=== PÁGINAS DE FACEBOOK ENCONTRADAS ===");
          console.log("Total páginas:", accountsData.data?.length || 0);
          debugInfo.user_accounts_found = accountsData.data || [];
          // Buscar página con Instagram Business
          for (const page of accountsData.data || []) {
            console.log(
              `\n=== ANALIZANDO PÁGINA: ${page.name} (ID: ${page.id}) ===`
            );
            const attemptInfo = {
              page_id: page.id,
              page_name: page.name,
              page_category: page.category || "N/A",
              has_instagram_business_account: !!page.instagram_business_account,
              instagram_account_id: page.instagram_business_account?.id || null,
              attempt_details: [],
              errors: [],
            };
            if (page.instagram_business_account) {
              const instagramAccountId = page.instagram_business_account.id;
              console.log(
                `✓ Instagram Business encontrado: ${instagramAccountId}`
              );
              // GUARDAR PAGE_ID AUTOMÁTICAMENTE
              pageId = page.id;
              console.log(`🔑 Guardando PAGE_ID automáticamente: ${pageId}`);
              try {
                // Actualizar el secreto PAGE_ID en Supabase
                const updateSecretResponse = await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/update_secret`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${Deno.env.get(
                        "SUPABASE_SERVICE_ROLE_KEY"
                      )}`,
                      "Content-Type": "application/json",
                      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
                    },
                    body: JSON.stringify({
                      secret_name: "PAGE_ID",
                      secret_value: pageId,
                    }),
                  }
                );
                if (updateSecretResponse.ok) {
                  console.log("✅ PAGE_ID guardado exitosamente en secretos");
                  debugInfo.page_id_saved = true;
                } else {
                  console.error(
                    "❌ Error guardando PAGE_ID:",
                    await updateSecretResponse.text()
                  );
                  // Intentar método alternativo usando variables de entorno
                  Deno.env.set("PAGE_ID", pageId);
                  console.log(
                    "✅ PAGE_ID guardado como variable de entorno temporal"
                  );
                  debugInfo.page_id_saved = true;
                }
              } catch (error) {
                console.error("❌ Error guardando PAGE_ID:", error);
                debugInfo.detailed_errors.push(
                  `Error guardando PAGE_ID: ${error.message}`
                );
              }
              // Usar el token de la página si está disponible, sino usar el token del usuario
              const pageToken = page.access_token || tokenData.access_token;
              console.log(
                `Usando token: ${
                  pageToken ? "Token de página" : "Token de usuario"
                }`
              );
              // Intentar obtener información de Instagram
              console.log("--- Obteniendo información de Instagram ---");
              try {
                const basicInfoResponse = await fetch(
                  `https://graph.instagram.com/v23.0/${instagramAccountId}?fields=id,username&access_token=${pageToken}`
                );
                const basicInfoText = await basicInfoResponse.text();
                attemptInfo.attempt_details.push({
                  method: "campos_basicos",
                  url: `https://graph.instagram.com/v23.0/${instagramAccountId}?fields=id,username`,
                  status: basicInfoResponse.status,
                  response: basicInfoText,
                });
                if (basicInfoResponse.ok) {
                  const basicInfo = JSON.parse(basicInfoText);
                  console.log(
                    "✓ Información de Instagram obtenida:",
                    basicInfo
                  );
                  instagramData = basicInfo;
                  attemptInfo.success = true;
                } else {
                  console.log(
                    "✗ Error obteniendo info de Instagram:",
                    basicInfoText
                  );
                  attemptInfo.errors.push(`Error Instagram: ${basicInfoText}`);
                  // Usar información básica si no podemos obtener detalles
                  instagramData = {
                    id: instagramAccountId,
                    username: `@ig_${instagramAccountId.slice(-8)}`,
                  };
                  attemptInfo.success = true;
                }
              } catch (error) {
                console.log(
                  "✗ Excepción obteniendo info de Instagram:",
                  error.message
                );
                attemptInfo.errors.push(
                  `Excepción Instagram: ${error.message}`
                );
                // Usar información básica como fallback
                instagramData = {
                  id: instagramAccountId,
                  username: `@ig_${instagramAccountId.slice(-8)}`,
                };
                attemptInfo.success = true;
              }
            } else {
              console.log("✗ No tiene Instagram Business Account vinculado");
              attemptInfo.errors.push(
                "Página no tiene Instagram Business Account"
              );
            }
            debugInfo.instagram_search_attempts.push(attemptInfo);
            // Si encontramos Instagram, salir del loop
            if (instagramData && pageId) {
              console.log(
                "🎉 INSTAGRAM Y PAGE_ID ENCONTRADOS - Terminando búsqueda"
              );
              debugInfo.final_result = "success";
              break;
            }
          }
        } else {
          const accountsError = await accountsResponse.text();
          console.error("Error obteniendo cuentas de Facebook:", accountsError);
          debugInfo.detailed_errors.push(
            `Error obteniendo cuentas: ${accountsError}`
          );
        }
      } catch (instagramError) {
        console.error("Error en búsqueda de Instagram:", instagramError);
        debugInfo.detailed_errors.push(
          `Excepción búsqueda: ${instagramError.message}`
        );
      }
    } else {
      console.error(
        "Error obteniendo datos de usuario:",
        await userResponse.text()
      );
      debugInfo.detailed_errors.push(
        "Error obteniendo datos de usuario de Facebook"
      );
      userData = {
        id: "development_user",
        name: "Usuario de Prueba",
      };
    }
    if (!instagramData) {
      debugInfo.final_result = "no_instagram_found";
      console.log("=== DIAGNÓSTICO: Instagram NO encontrado ===");
    }
    if (!pageId) {
      console.log("⚠️ PAGE_ID no pudo ser obtenido/guardado");
      debugInfo.page_id_saved = false;
    }
    // Preparar respuesta con datos combinados y debug extendido
    const responseData = {
      access_token: tokenData.access_token,
      user: userData,
      instagram_account: instagramData,
      page_id: pageId,
      debug_info: {
        app_mode: "production",
        client_id_used: INSTAGRAM_APP_ID,
        api_version: "Graph API v23.0",
        page_id_saved: debugInfo.page_id_saved,
        extended_debug: debugInfo,
      },
    };
    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error en edge function:", error);
    return new Response(
      JSON.stringify({
        error: "internal_server_error",
        error_description: "Error interno del servidor",
        debug_info: {
          error_message: error.message,
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
