import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Configuración real de Instagram
const INSTAGRAM_CLIENT_ID = '1059372749433300';
const INSTAGRAM_REDIRECT_URI = window.location.origin + '/auth/instagram/callback';
const INSTAGRAM_SCOPE = 'user_profile,user_media';

export interface InstagramAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/**
 * Inicia el flujo de autenticación real de Instagram
 */
export const initiateInstagramAuth = (config: InstagramAuthConfig = {
  clientId: INSTAGRAM_CLIENT_ID,
  redirectUri: INSTAGRAM_REDIRECT_URI,
  scope: INSTAGRAM_SCOPE
}) => {
  try {
    console.log('Iniciando autenticación real con Instagram...');
    console.log('Client ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('Scope:', config.scope);
    
    // Guardar la ruta actual para redirigir después de la autenticación
    localStorage.setItem('hower-auth-redirect', window.location.pathname);
    
    // Construir URL de autorización de Instagram usando Basic Display API
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', 'hower-state-' + Date.now()); // Agregar state para seguridad
    
    console.log('URL de autorización construida:', authUrl.toString());
    
    // Redirigir al usuario a Instagram para autorización
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
    
    // Llamar a Supabase Edge Function para intercambiar el código por token
    const { data, error } = await supabase.functions.invoke('instagram-exchange-token', {
      body: {
        code: code,
        redirect_uri: INSTAGRAM_REDIRECT_URI
      }
    });

    if (error) {
      console.error('Error llamando edge function:', error);
      throw new Error(error.message || 'Error del servidor');
    }

    if (data.error) {
      console.error('Error de Instagram API:', data.error);
      throw new Error(data.error_description || data.error);
    }

    // Guardar token y datos del usuario
    localStorage.setItem('hower-instagram-token', data.access_token);
    localStorage.setItem('hower-instagram-user', JSON.stringify(data.user));
    
    console.log('Token y datos de usuario guardados exitosamente');
    
    toast({
      title: "¡Conexión exitosa!",
      description: `Conectado como @${data.user.username}`,
      variant: "default"
    });
    
    // Redirección al estado guardado
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    
    return {
      success: true,
      redirectPath,
      user: data.user
    };
  } catch (error) {
    console.error('Error procesando callback de Instagram:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    toast({
      title: "Error de conexión",
      description: `No se pudo completar la conexión con Instagram: ${errorMessage}`,
      variant: "destructive"
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Obtiene información del usuario conectado usando la API real
 */
export const getInstagramUserInfo = async () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return null;
  
  try {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo información del usuario');
    }
    
    const userData = await response.json();
    
    // Actualizar datos guardados
    localStorage.setItem('hower-instagram-user', JSON.stringify(userData));
    
    return userData;
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
 * Obtiene posts recientes del usuario usando la API real
 */
export const getInstagramPosts = async () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return [];
  
  try {
    const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token}`);
    
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
