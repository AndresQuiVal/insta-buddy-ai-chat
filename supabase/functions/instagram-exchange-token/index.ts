
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

    console.log("=== CONFIGURACIÓN DE INSTAGRAM GRAPH API ===");
    console.log("Instagram App ID:", INSTAGRAM_APP_ID);
    console.log("Redirect URI recibida:", redirect_uri);
    console.log("Código recibido:", code.substring(0, 20) + "...");

    // Intercambiar código por token de acceso
    const tokenUrl = "https://api.instagram.com/oauth/access_token";
    const formData = new FormData();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirect_uri);
    formData.append("code", code);

    console.log("Enviando solicitud a Instagram API...");
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      body: formData,
    });

    const tokenData = await tokenResponse.json();
    console.log("Respuesta de Instagram API:", {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      hasError: !!tokenData.error,
    });

    if (!tokenResponse.ok) {
      console.error("Error detallado de Instagram API:", tokenData);
      return new Response(
        JSON.stringify({
          error: tokenData.error?.type || "token_exchange_failed",
          error_description: tokenData.error?.message || "Error obteniendo token de Instagram",
          debug_info: {
            client_id_used: INSTAGRAM_APP_ID,
            redirect_uri_used: redirect_uri,
            response_status: tokenResponse.status,
            instagram_error: tokenData.error,
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

    console.log("✅ Token obtenido exitosamente");

    // Obtener información del usuario de Facebook usando el token
    const userResponse = await fetch(
      `https://graph.facebook.com/v23.0/me?access_token=${tokenData.access_token}`
    );

    if (!userResponse.ok) {
      console.error("Error obteniendo usuario de Facebook:", await userResponse.text());
      return new Response(
        JSON.stringify({
          error: "user_fetch_failed",
          error_description: "No se pudo obtener información del usuario",
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

    const userData = await userResponse.json();
    console.log("✅ Usuario de Facebook obtenido:", userData);

    // Buscar Instagram Business Account
    let instagramBusinessAccountId = null;
    let pageId = null;

    console.log("=== BUSCANDO INSTAGRAM BUSINESS ACCOUNT ===");
    
    try {
      const accountsResponse = await fetch(
        `https://graph.facebook.com/v23.0/${userData.id}/accounts?fields=id,name,instagram_business_account,access_token,category&access_token=${tokenData.access_token}`
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        console.log("Páginas encontradas:", accountsData.data?.length || 0);

        // Buscar la primera página con Instagram Business Account
        for (const page of accountsData.data || []) {
          console.log(`📋 Página: ${page.name} - Instagram Business: ${!!page.instagram_business_account}`);

          if (page.instagram_business_account) {
            instagramBusinessAccountId = page.instagram_business_account.id;
            pageId = page.id;
            
            console.log("🎉 ¡INSTAGRAM BUSINESS ACCOUNT ENCONTRADO!");
            console.log("Instagram Business Account ID:", instagramBusinessAccountId);
            console.log("Page ID:", pageId);
            
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error en búsqueda de Instagram Business:", error);
    }

    // Determinar qué ID usar como identificador principal
    let finalInstagramUserId;
    
    if (instagramBusinessAccountId) {
      // Caso ideal: usar Instagram Business Account ID
      finalInstagramUserId = instagramBusinessAccountId;
      console.log("✅ Usando Instagram Business Account ID:", finalInstagramUserId);
    } else {
      // Fallback: usar Facebook User ID
      finalInstagramUserId = userData.id;
      console.log("⚠️ Fallback: Usando Facebook User ID:", finalInstagramUserId);
    }

    // Preparar respuesta con ambos IDs para máxima compatibilidad
    const responseData = {
      access_token: tokenData.access_token,
      user: userData,
      instagram_account: {
        id: finalInstagramUserId,
        username: userData?.name || "Usuario",
        business_account_id: instagramBusinessAccountId, // ID específico del negocio
        facebook_user_id: userData.id // ID de Facebook para referencia
      },
      page_id: pageId,
      debug_info: {
        app_mode: "production",
        client_id_used: INSTAGRAM_APP_ID,
        api_version: "Graph API v23.0",
        instagram_business_found: !!instagramBusinessAccountId,
        using_fallback: !instagramBusinessAccountId
      },
    };

    console.log("📤 Respuesta final enviada con Instagram User ID:", finalInstagramUserId);

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
