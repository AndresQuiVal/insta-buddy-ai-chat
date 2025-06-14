import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Configuración de Instagram Graph API (nueva API oficial)
const INSTAGRAM_APP_ID = "1059372749433300"; // Instagram App ID principal
const INSTAGRAM_REDIRECT_URI =
  window.location.origin + "/auth/instagram/callback";
const INSTAGRAM_SCOPE =
  "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish"; // Nuevos permisos para Graph API

export interface InstagramAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/**
 * Inicia el flujo de autenticación con Instagram Graph API
 */
export const initiateInstagramAuth = (
  config: InstagramAuthConfig = {
    clientId: INSTAGRAM_APP_ID,
    redirectUri: INSTAGRAM_REDIRECT_URI,
    scope: INSTAGRAM_SCOPE,
  }
) => {
  try {
    console.log("Iniciando autenticación con Instagram Graph API...");
    console.log("Instagram App ID:", config.clientId);
    console.log("Redirect URI:", config.redirectUri);
    console.log("Scope:", config.scope);
    console.log("Current domain:", window.location.origin);

    // Guardar la ruta actual para redirigir después de la autenticación
    localStorage.setItem("hower-auth-redirect", window.location.pathname);

    // Construir URL de autorización de Instagram Business
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.append("client_id", config.clientId);
    authUrl.searchParams.append("redirect_uri", config.redirectUri);
    authUrl.searchParams.append("scope", config.scope);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", "hower-state-" + Date.now()); // Seguridad

    console.log("URL de autorización construida:", authUrl.toString());

    // Verificar que estamos en un dominio válido
    const currentDomain = window.location.hostname;
    if (
      currentDomain === "localhost" ||
      currentDomain.includes("lovableproject.com")
    ) {
      console.log("Dominio válido para desarrollo/producción:", currentDomain);
    } else {
      console.warn(
        "Dominio no configurado en Facebook Developers:",
        currentDomain
      );
      toast({
        title: "Advertencia de configuración",
        description: `Asegúrate de que ${currentDomain} esté configurado como URL válida en Facebook Developers`,
        variant: "destructive",
      });
    }

    // Redirigir al usuario a Facebook para autorización
    window.location.href = authUrl.toString();

    return true;
  } catch (error) {
    console.error("Error iniciando autenticación de Instagram:", error);
    toast({
      title: "Error de conexión",
      description:
        "No se pudo iniciar la conexión con Instagram. Verifica la configuración de la app.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Verifica si hay una conexión activa a Instagram
 */
export const checkInstagramConnection = (): boolean => {
  // Verificar primero en Supabase
  const savedUserData = localStorage.getItem("hower-instagram-user");
  if (savedUserData) {
    try {
      const userData = JSON.parse(savedUserData);
      return !!(userData.instagram?.id || userData.facebook?.id);
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Desconecta la cuenta de Instagram
 */
export const disconnectInstagram = () => {
  localStorage.removeItem("hower-instagram-token");
  localStorage.removeItem("hower-instagram-user");
  localStorage.removeItem("hower-auth-redirect");
  console.log("Instagram desconectado");
  toast({
    title: "Cuenta desconectada",
    description: "Tu cuenta de Instagram ha sido desconectada de Hower.",
  });
  return true;
};

/**
 * Procesa la respuesta del callback de Instagram y guarda en Supabase
 */
export const handleInstagramCallback = async (code: string) => {
  try {
    console.log("Procesando código de autorización:", code);
    console.log("Usando Facebook App ID:", INSTAGRAM_APP_ID);
    console.log("Redirect URI utilizada:", INSTAGRAM_REDIRECT_URI);

    // Llamar a Supabase Edge Function para intercambiar el código por token
    const { data, error } = await supabase.functions.invoke(
      "instagram-exchange-token",
      {
        body: {
          code: code,
          redirect_uri: INSTAGRAM_REDIRECT_URI,
        },
      }
    );

    if (error) {
      console.error("Error llamando edge function:", error);

      // Manejo específico de errores comunes
      if (error.message.includes("invalid_client")) {
        toast({
          title: "Error de configuración",
          description:
            "App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.",
          variant: "destructive",
        });
      } else if (error.message.includes("redirect_uri")) {
        toast({
          title: "Error de URL",
          description: `URL de redirección no válida. Configura ${INSTAGRAM_REDIRECT_URI} en Facebook Developers.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error del servidor",
          description: error.message || "Error procesando la autenticación",
          variant: "destructive",
        });
      }

      throw new Error(error.message || "Error del servidor");
    }

    if (data.error) {
      console.error("Error de Graph API:", data.error);

      // Manejo específico de errores de Graph API
      let errorMessage = data.error_description || data.error;

      if (data.error === "invalid_client") {
        errorMessage =
          "App no válida. Verifica que la app esté configurada correctamente en Facebook Developers.";
      } else if (data.error.includes("redirect_uri")) {
        errorMessage = `URL de redirección no coincide. Configura ${INSTAGRAM_REDIRECT_URI} en Facebook Developers.`;
      } else if (data.error === "access_denied") {
        errorMessage = "Acceso denegado por el usuario.";
      }

      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    }

    const token = data.access_token;

    console.log("Token de acceso obtenido:", token);

    // Guardar datos del usuario (Facebook + Instagram si está disponible)
    const userData = {
      facebook: data.user,
      instagram: data.instagram_account ?? data.user,
    };
    localStorage.setItem("hower-instagram-user", JSON.stringify(userData));

    // Crear o actualizar usuario en Supabase
    const instagramUserId = userData.instagram?.id || userData.facebook?.id;
    const username = userData.instagram?.username || userData.facebook?.name || "Usuario";

    if (instagramUserId) {
      const { data: dbData, error: dbError } = await supabase
        .from('instagram_users')
        .upsert({
          instagram_user_id: instagramUserId,
          username: username,
          access_token: token,
          page_id: data.page_id,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instagram_user_id'
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error guardando usuario en Supabase:", dbError);
        toast({
          title: "Error de base de datos",
          description: "No se pudo guardar la información del usuario.",
          variant: "destructive",
        });
      } else {
        console.log("Usuario guardado en Supabase:", dbData);
      }
    }

    console.log("Token y datos de usuario guardados exitosamente");
    console.log("Usuario conectado:", userData);

    // Determinar qué nombre mostrar
    const displayName = userData.instagram?.username
      ? `@${userData.instagram.username}`
      : userData.instagram?.name ?? "Usuario";

    toast({
      title: "¡Conexión exitosa!",
      description: `Conectado como ${displayName}`,
      variant: "default",
    });

    // Redirección al estado guardado
    const redirectPath = localStorage.getItem("hower-auth-redirect") || "/";
    localStorage.removeItem("hower-auth-redirect");

    return {
      success: true,
      redirectPath,
      user: userData,
    };
  } catch (error) {
    console.error("Error procesando callback de Instagram:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Obtiene información del usuario conectado usando Graph API
 */
export const getInstagramUserInfo = async () => {
  // Intentar obtener de Supabase primero
  const savedUserData = localStorage.getItem("hower-instagram-user");
  if (!savedUserData) return null;

  try {
    const userData = JSON.parse(savedUserData);
    const instagramUserId = userData.instagram?.id || userData.facebook?.id;
    
    if (!instagramUserId) return null;

    // Obtener datos actualizados de Supabase
    const { data, error } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (error) {
      console.error("Error obteniendo usuario de Supabase:", error);
      return userData; // Fallback a datos locales
    }

    return {
      facebook: userData.facebook,
      instagram: {
        id: data.instagram_user_id,
        username: data.username,
        ...userData.instagram
      },
      supabase: data
    };
  } catch (error) {
    console.error("Error obteniendo información del usuario:", error);
    return null;
  }
};

/**
 * Obtiene posts recientes del usuario usando Graph API
 */
export const getInstagramPosts = async () => {
  const token = localStorage.getItem("hower-instagram-token");
  if (!token) return [];

  try {
    // Primero obtenemos el ID del usuario
    const userInfo = await getInstagramUserInfo();

    if (!userInfo?.instagram?.id) {
      console.warn("No hay cuenta de Instagram conectada");
      return [];
    }

    const instagramAccountId = userInfo.instagram.id;

    // Obtener media de Instagram usando Graph API
    const response = await fetch(
      `https://graph.instagram.com/v23.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token}`
    );

    if (!response.ok) {
      throw new Error("Error obteniendo posts");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error obteniendo posts de Instagram:", error);
    return [];
  }
};

/**
 * Envía un mensaje de texto a través de Instagram usando la nueva Graph API
 */
export const sendInstagramMessage = async (
  messageText: string,
  recipientId: string,
  replyToMessageId?: string
) => {
  try {
    console.log("📤 Enviando mensaje de Instagram...");
    console.log("Message:", messageText);
    console.log("Recipient ID:", recipientId);

    // Verificar que tenemos los datos necesarios
    if (!messageText || !recipientId) {
      throw new Error(
        "Faltan parámetros requeridos: messageText y recipientId"
      );
    }

    // Obtener el usuario actual de Instagram
    const savedUserData = localStorage.getItem('hower-instagram-user');
    if (!savedUserData) {
      toast({
        title: "Usuario no encontrado",
        description: "Por favor reconecta tu cuenta de Instagram",
        variant: "destructive"
      });
      throw new Error("No se encontró información del usuario. Reconecta tu cuenta de Instagram.");
    }

    const userData = JSON.parse(savedUserData);
    const instagramUserId = userData.instagram?.id || userData.facebook?.id;

    if (!instagramUserId) {
      toast({
        title: "Usuario inválido",
        description: "Por favor reconecta tu cuenta de Instagram",
        variant: "destructive"
      });
      throw new Error("ID de usuario de Instagram no encontrado.");
    }

    console.log("✅ Usuario encontrado:", instagramUserId);

    // Llamar a la edge function con el Instagram User ID
    console.log("🚀 Usando edge function para enviar mensaje...");

    const { data, error } = await supabase.functions.invoke(
      "instagram-send-message",
      {
        body: {
          recipient_id: recipientId,
          message_text: messageText,
          reply_to_message_id: replyToMessageId,
          instagram_user_id: instagramUserId // Enviar Instagram User ID en lugar del token
        },
      }
    );

    console.log("📨 Respuesta de edge function:", {
      data,
      error,
    });

    if (error) {
      console.error("❌ Error desde edge function:", error);
      let errorDescription = error.message || "Error enviando mensaje";

      if (error.message?.includes("token_not_found")) {
        errorDescription = "Token de Instagram no encontrado. Reconecta tu cuenta.";
      } else if (error.message?.includes("invalid_client")) {
        errorDescription = "Token de acceso inválido o expirado. Reconecta tu cuenta de Instagram.";
      } else if (error.message?.includes("send_message_failed")) {
        errorDescription = "Falló el envío del mensaje. Verifica que el destinatario sea válido.";
      }

      toast({
        title: "Error enviando mensaje",
        description: errorDescription,
        variant: "destructive",
      });
      throw new Error(errorDescription);
    }

    if (data?.error) {
      console.error("❌ Error en respuesta de edge function:", data);
      let errorDescription =
        data.error_description || data.error || "Error enviando mensaje";

      // Manejo específico de errores de token
      if (data.error === 'send_message_failed' && data.debug_info?.instagram_error?.code === 190) {
        errorDescription = "Token de Instagram expirado. Por favor reconecta tu cuenta.";
        
        toast({
          title: "Token expirado",
          description: "Tu token de Instagram ha expirado. Reconecta tu cuenta.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error enviando mensaje",
          description: errorDescription,
          variant: "destructive",
        });
      }
      
      throw new Error(errorDescription);
    }

    if (!data?.success) {
      console.error("❌ Respuesta no exitosa:", data);
      throw new Error("No se pudo enviar el mensaje");
    }

    console.log("✅ Mensaje enviado exitosamente a través de edge function");
    toast({
      title: "¡Mensaje enviado!",
      description: "Tu mensaje fue enviado exitosamente a Instagram",
    });

    return {
      success: true,
      message_id: data.message_id,
      recipient_id: data.recipient_id,
    };
  } catch (error) {
    console.error("💥 Error en sendInstagramMessage:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    // Solo mostrar toast si no se mostró antes
    if (
      !errorMessage.includes("Token de acceso") &&
      !errorMessage.includes("Falló el envío") &&
      !errorMessage.includes("Token expirado")
    ) {
      toast({
        title: "Error de envío",
        description: errorMessage,
        variant: "destructive",
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Obtiene información de la página conectada para envío de mensajes
 */
async function getConnectedPageInfo(accessToken: string) {
  try {
    // Obtener usuario autenticado (opcional, solo para debug)
    const userResponse = await fetch(
      `https://graph.instagram.com/v23.0/me?access_token=${accessToken}`
    );
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(`Error obteniendo usuario: ${userData.error?.message}`);
    }

    // Obtener las páginas que administra el usuario
    const pagesResponse = await fetch(
      `https://graph.instagram.com/v23.0/me/accounts?fields=id,name,instagram_business_account,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      throw new Error(`Error obteniendo páginas: ${pagesData.error?.message}`);
    }

    // Buscar página con Instagram Business
    const pageWithInstagram = pagesData.data?.find(
      (page: any) => page.instagram_business_account
    );

    if (!pageWithInstagram) {
      throw new Error(
        "No se encontró página con cuenta de Instagram Business conectada"
      );
    }

    return {
      userId: userData.id,
      pageId: pageWithInstagram.id,
      pageName: pageWithInstagram.name,
      instagramAccountId: pageWithInstagram.instagram_business_account?.id,
      pageAccessToken: pageWithInstagram.access_token || accessToken,
    };
  } catch (error) {
    console.error("Error obteniendo información de página:", error);
    throw error;
  }
}

/**
 * Guarda un mensaje en la base de datos
 */
async function saveMessageToDatabase(messageData: any) {
  try {
    const { error } = await supabase
      .from("instagram_messages")
      .insert(messageData);

    if (error) {
      console.error("Error guardando mensaje en BD:", error);
      throw error;
    }

    console.log("💾 Mensaje guardado en base de datos");
  } catch (error) {
    console.error("Error en saveMessageToDatabase:", error);
    // No lanzar error aquí para no bloquear el envío
  }
}
