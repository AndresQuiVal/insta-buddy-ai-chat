
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Configuración de Instagram Graph API (nueva API oficial)
const FACEBOOK_APP_ID = '2942884966099377'; // Facebook App ID principal
const INSTAGRAM_REDIRECT_URI = window.location.origin + '/auth/instagram/callback';
const INSTAGRAM_SCOPE = 'instagram_basic,pages_show_list,business_management'; // Nuevos permisos para Graph API

export interface InstagramAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/**
 * Inicia el flujo de autenticación con Instagram Graph API
 */
export const initiateInstagramAuth = (config: InstagramAuthConfig = {
  clientId: FACEBOOK_APP_ID,
  redirectUri: INSTAGRAM_REDIRECT_URI,
  scope: INSTAGRAM_SCOPE
}) => {
  try {
    console.log('Iniciando autenticación con Instagram Graph API...');
    console.log('Facebook App ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('Scope:', config.scope);
    console.log('Current domain:', window.location.origin);
    
    // Guardar la ruta actual para redirigir después de la autenticación
    localStorage.setItem('hower-auth-redirect', window.location.pathname);
    
    // Construir URL de autorización de Facebook/Instagram usando Graph API
    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', 'hower-state-' + Date.now()); // Agregar state para seguridad
    
    console.log('URL de autorización construida:', authUrl.toString());
    
    // Verificar que estamos en un dominio válido
    const currentDomain = window.location.hostname;
    if (currentDomain === 'localhost' || currentDomain.includes('lovableproject.com')) {
      console.log('Dominio válido para desarrollo/producción:', currentDomain);
    } else {
      console.warn('Dominio no configurado en Facebook Developers:', currentDomain);
      toast({
        title: "Advertencia de configuración",
        description: `Asegúrate de que ${currentDomain} esté configurado como URL válida en Facebook Developers`,
        variant: "destructive"
      });
    }
    
    // Redirigir al usuario a Facebook para autorización
    window.location.href = authUrl.toString();
    
    return true;
  } catch (error) {
    console.error('Error iniciando autenticación de Instagram:', error);
    toast({
      title: "Error de conexión",
      description: "No se pudo iniciar la conexión con Instagram. Verifica la configuración de la app.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Verifica si hay una conexión activa a Instagram
 */
export const checkInstagramConnection = (): boolean => {
  const hasToken = localStorage.getItem('hower-instagram-token') !== null;
  console.log('Verificando conexión Instagram:', hasToken);
  return hasToken;
};

/**
 * Desconecta la cuenta de Instagram
 */
export const disconnectInstagram = () => {
  localStorage.removeItem('hower-instagram-token');
  localStorage.removeItem('hower-instagram-user');
  localStorage.removeItem('hower-auth-redirect');
  console.log('Instagram desconectado');
  toast({
    title: "Cuenta desconectada",
    description: "Tu cuenta de Instagram ha sido desconectada de Hower."
  });
  return true;
};

/**
 * Procesa la respuesta del callback de Instagram usando Supabase Edge Function
 */
export const handleInstagramCallback = async (code: string) => {
  try {
    console.log('Procesando código de autorización:', code);
    console.log('Usando Facebook App ID:', FACEBOOK_APP_ID);
    console.log('Redirect URI utilizada:', INSTAGRAM_REDIRECT_URI);
    
    // Llamar a Supabase Edge Function para intercambiar el código por token
    const { data, error } = await supabase.functions.invoke('instagram-exchange-token', {
      body: {
        code: code,
        redirect_uri: INSTAGRAM_REDIRECT_URI
      }
    });

    if (error) {
      console.error('Error llamando edge function:', error);
      
      // Manejo específico de errores comunes
      if (error.message.includes('invalid_client')) {
        toast({
          title: "Error de configuración",
          description: "App ID o Client Secret incorrectos. Verifica la configuración en Facebook Developers.",
          variant: "destructive"
        });
      } else if (error.message.includes('redirect_uri')) {
        toast({
          title: "Error de URL",
          description: `URL de redirección no válida. Configura ${INSTAGRAM_REDIRECT_URI} en Facebook Developers.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error del servidor",
          description: error.message || 'Error procesando la autenticación',
          variant: "destructive"
        });
      }
      
      throw new Error(error.message || 'Error del servidor');
    }

    if (data.error) {
      console.error('Error de Graph API:', data.error);
      
      // Manejo específico de errores de Graph API
      let errorMessage = data.error_description || data.error;
      
      if (data.error === 'invalid_client') {
        errorMessage = "App no válida. Verifica que la app esté configurada correctamente en Facebook Developers.";
      } else if (data.error.includes('redirect_uri')) {
        errorMessage = `URL de redirección no coincide. Configura ${INSTAGRAM_REDIRECT_URI} en Facebook Developers.`;
      } else if (data.error === 'access_denied') {
        errorMessage = "Acceso denegado por el usuario.";
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw new Error(errorMessage);
    }

    // Guardar token y datos del usuario
    localStorage.setItem('hower-instagram-token', data.access_token);
    
    // Guardar datos del usuario (Facebook + Instagram si está disponible)
    const userData = {
      facebook: data.user,
      instagram: data.instagram_account
    };
    localStorage.setItem('hower-instagram-user', JSON.stringify(userData));
    
    console.log('Token y datos de usuario guardados exitosamente');
    console.log('Usuario conectado:', userData);
    
    // Determinar qué nombre mostrar
    const displayName = data.instagram_account?.username 
      ? `@${data.instagram_account.username}` 
      : data.user?.name || 'Usuario';
    
    toast({
      title: "¡Conexión exitosa!",
      description: `Conectado como ${displayName}`,
      variant: "default"
    });
    
    // Redirección al estado guardado
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    
    return {
      success: true,
      redirectPath,
      user: userData
    };
  } catch (error) {
    console.error('Error procesando callback de Instagram:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Obtiene información del usuario conectado usando Graph API
 */
export const getInstagramUserInfo = async () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return null;
  
  try {
    // Primero obtenemos info básica del usuario de Facebook
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
    
    if (!userResponse.ok) {
      throw new Error('Error obteniendo información del usuario');
    }
    
    const userData = await userResponse.json();
    
    // Intentamos obtener cuentas de Instagram
    let instagramData = null;
    try {
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=instagram_business_account&access_token=${token}`);
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const pageWithInstagram = accountsData.data?.find(page => page.instagram_business_account);
        
        if (pageWithInstagram) {
          const instagramAccountId = pageWithInstagram.instagram_business_account.id;
          const instagramInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username,account_type,media_count&access_token=${token}`);
          
          if (instagramInfoResponse.ok) {
            instagramData = await instagramInfoResponse.json();
          }
        }
      }
    } catch (error) {
      console.warn('No se pudo obtener información de Instagram:', error);
    }
    
    const combinedData = {
      facebook: userData,
      instagram: instagramData
    };
    
    // Actualizar datos guardados
    localStorage.setItem('hower-instagram-user', JSON.stringify(combinedData));
    
    return combinedData;
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    
    // Fallback a datos guardados localmente
    const userDataString = localStorage.getItem('hower-instagram-user');
    if (userDataString) {
      return JSON.parse(userDataString);
    }
    
    return null;
  }
};

/**
 * Obtiene posts recientes del usuario usando Graph API
 */
export const getInstagramPosts = async () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return [];
  
  try {
    // Primero obtenemos el ID del usuario
    const userInfo = await getInstagramUserInfo();
    
    if (!userInfo?.instagram?.id) {
      console.warn('No hay cuenta de Instagram conectada');
      return [];
    }
    
    const instagramAccountId = userInfo.instagram.id;
    
    // Obtener media de Instagram usando Graph API
    const response = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo posts');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error obteniendo posts de Instagram:', error);
    return [];
  }
};
