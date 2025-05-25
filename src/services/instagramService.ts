
import { toast } from '@/components/ui/use-toast';

// Tu configuración real de Instagram
const INSTAGRAM_CLIENT_ID = '1059327249433300'; // Tu Instagram App ID real
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
    // Guardar la ruta actual para redirigir después de la autenticación
    localStorage.setItem('hower-auth-redirect', window.location.pathname);
    
    // Construir la URL de autorización de Instagram
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('response_type', 'code');
    
    console.log('Iniciando autenticación con Instagram...');
    console.log('Client ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('URL completa:', authUrl.toString());
    
    // Redirigir al usuario a Instagram para autorización
    window.location.href = authUrl.toString();
    
    return true;
  } catch (error) {
    console.error('Error iniciando autenticación de Instagram:', error);
    toast({
      title: "Error de conexión",
      description: "No se pudo iniciar la conexión con Instagram.",
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
 * Desconecta la cuenta de Instagram (elimina el token)
 */
export const disconnectInstagram = () => {
  localStorage.removeItem('hower-instagram-token');
  localStorage.removeItem('hower-auth-redirect');
  console.log('Instagram desconectado');
  toast({
    title: "Cuenta desconectada",
    description: "Tu cuenta de Instagram ha sido desconectada de Hower."
  });
  return true;
};

/**
 * Procesa la respuesta del callback de Instagram
 */
export const handleInstagramCallback = async (code: string) => {
  try {
    console.log('Procesando código de autorización de Instagram:', code);
    
    // NOTA: Aquí normalmente harías una llamada a tu backend para intercambiar
    // el código por un token de acceso usando tu Instagram App Secret
    // Por ahora, guardamos el código para simular un token exitoso
    
    const mockToken = `ig_token_${code.substring(0, 10)}_${Date.now()}`;
    localStorage.setItem('hower-instagram-token', mockToken);
    
    console.log('Token guardado exitosamente');
    
    toast({
      title: "¡Conexión exitosa!",
      description: "Tu cuenta de Instagram ha sido conectada a Hower.",
      variant: "default"
    });
    
    // Redirección al estado guardado (o al dashboard por defecto)
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    
    console.log('Redirigiendo a:', redirectPath);
    
    return {
      success: true,
      redirectPath
    };
  } catch (error) {
    console.error('Error procesando callback de Instagram:', error);
    
    toast({
      title: "Error de conexión",
      description: "No se pudo completar la conexión con Instagram. Inténtalo más tarde.",
      variant: "destructive"
    });
    
    return {
      success: false,
      error: 'Error procesando el callback de Instagram'
    };
  }
};

/**
 * Obtiene información básica del usuario (simulado por ahora)
 */
export const getInstagramUserInfo = () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return null;
  
  // Por ahora retornamos datos simulados
  // En el futuro esto hará una llamada real a la API de Instagram
  return {
    id: 'user_123',
    username: 'usuario_ejemplo',
    account_type: 'PERSONAL'
  };
};
