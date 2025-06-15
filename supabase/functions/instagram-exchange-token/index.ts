
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

    // Configuración de Instagram Graph API
    const INSTAGRAM_APP_ID = "1059372749433300";
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

    console.log("=== INICIANDO PROCESO DE AUTENTICACIÓN ===");
    console.log("Instagram App ID:", INSTAGRAM_APP_ID);
    console.log("Redirect URI recibida:", redirect_uri);

    // Intercambiar código por token de acceso
    const tokenUrl = "https://api.instagram.com/oauth/access_token";
    const formData = new FormData();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirect_uri);
    formData.append("code", code);

    console.log("🔄 Intercambiando código por token...");
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      body: formData,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("❌ Error de Instagram API:", tokenData);
      return new Response(
        JSON.stringify({
          error: tokenData.error?.type || "token_exchange_failed",
          error_description: tokenData.error?.message || "Error obteniendo token de Instagram",
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

    console.log("✅ Token obtenido exitosamente");
    console.log("🔍 Datos del token:", { user_id: tokenData.user_id });

    // Obtener información del usuario de Instagram directamente
    let userData = null;
    let instagramBusinessAccountId = null;
    let pageId = null;
    let realUsername = null;

    try {
      console.log("📋 Obteniendo información del usuario con token...");
      
      // Primero intentar obtener info del usuario de Facebook
      const userResponse = await fetch(
        `https://graph.facebook.com/v23.0/me?access_token=${tokenData.access_token}`
      );

      if (userResponse.ok) {
        userData = await userResponse.json();
        console.log("✅ Usuario de Facebook obtenido:", userData);

        // Buscar páginas con Instagram Business Account
        console.log("🔍 Buscando Instagram Business Account...");
        const accountsResponse = await fetch(
          `https://graph.facebook.com/v23.0/${userData.id}/accounts?fields=id,name,instagram_business_account&access_token=${tokenData.access_token}`
        );

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          console.log(`📄 Páginas encontradas: ${accountsData.data?.length || 0}`);

          const pageWithInstagram = accountsData.data?.find(
            (page: any) => page.instagram_business_account
          );

          if (pageWithInstagram) {
            instagramBusinessAccountId = pageWithInstagram.instagram_business_account.id;
            pageId = pageWithInstagram.id;
            
            console.log("🎯 Instagram Business Account encontrado:");
            console.log("- Instagram Business ID:", instagramBusinessAccountId);
            console.log("- Page ID:", pageId);

            // Obtener el username real de Instagram
            try {
              const instagramUserResponse = await fetch(
                `https://graph.facebook.com/v23.0/${instagramBusinessAccountId}?fields=username&access_token=${tokenData.access_token}`
              );
              
              if (instagramUserResponse.ok) {
                const instagramUserData = await instagramUserResponse.json();
                realUsername = instagramUserData.username;
                console.log("✅ Username real de Instagram obtenido:", realUsername);
              }
            } catch (error) {
              console.log("⚠️ No se pudo obtener username de Instagram Business:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("💥 Error obteniendo datos de usuario:", error);
    }

    // Determinar el ID y username finales
    let finalInstagramUserId;
    let username;

    if (instagramBusinessAccountId && realUsername) {
      // Usar Instagram Business Account ID y username real
      finalInstagramUserId = instagramBusinessAccountId;
      username = realUsername;
      console.log("✅ Usando Instagram Business Account:", { id: finalInstagramUserId, username });
    } else if (userData?.id) {
      // Fallback a Facebook User ID con nombre de Facebook
      finalInstagramUserId = userData.id;
      username = userData.name || `Usuario_${userData.id}`;
      console.log("⚠️ Usando Facebook User ID como fallback:", { id: finalInstagramUserId, username });
    } else {
      // Último fallback usando datos del token
      finalInstagramUserId = tokenData.user_id || "unknown_user";
      username = `Usuario_${tokenData.user_id || "desconocido"}`;
      console.log("⚠️ Usando datos básicos del token:", { id: finalInstagramUserId, username });
    }

    // Preparar datos de respuesta
    const responseData = {
      access_token: tokenData.access_token,
      user: userData || { id: finalInstagramUserId, name: username },
      instagram_account: {
        id: finalInstagramUserId,
        username: username,
      },
      page_id: pageId,
      debug_info: {
        has_instagram_business: !!instagramBusinessAccountId,
        used_fallback: !instagramBusinessAccountId,
        real_username_found: !!realUsername,
      },
    };

    console.log("📤 Respuesta final enviada:");
    console.log("- ID:", finalInstagramUserId);
    console.log("- Username:", username);
    console.log("- Es Instagram Business:", !!instagramBusinessAccountId);

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("💥 Error general:", error);
    return new Response(
      JSON.stringify({
        error: "internal_server_error",
        error_description: "Error interno del servidor",
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
