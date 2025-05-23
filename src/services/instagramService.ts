
import { toast } from '@/components/ui/use-toast';

// Estas credenciales deberían guardarse en una variable de entorno en Supabase
const INSTAGRAM_CLIENT_ID = 'tu-client-id-aqui'; // Reemplaza con tu ID de Cliente real
const INSTAGRAM_REDIRECT_URI = window.location.origin + '/auth/instagram/callback';
const INSTAGRAM_SCOPE = 'user_profile,instagram_graph_user_profile,instagram_manage_messages';

export interface InstagramAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/**
 * Inicia el flujo de autenticación de Instagram
 * HARDCODED: Esta función ahora simula una autenticación exitosa inmediatamente
 */
export const initiateInstagramAuth = (config: InstagramAuthConfig = {
  clientId: INSTAGRAM_CLIENT_ID,
  redirectUri: INSTAGRAM_REDIRECT_URI,
  scope: INSTAGRAM_SCOPE
}) => {
  try {
    console.log('Simulando autenticación de Instagram...');
    
    // Guardar token simulado
    localStorage.setItem('hower-instagram-token', `demo-token-${Date.now()}`);
    
    // Mostrar mensaje de éxito
    toast({
      title: "Conexión exitosa",
      description: "Tu cuenta de Instagram ha sido conectada a Hower (simulado)."
    });
    
    // Devolver verdadero para indicar éxito
    return true;
  } catch (error) {
    console.error('Error simulando autenticación de Instagram:', error);
    toast({
      title: "Error de conexión",
      description: "No se pudo simular la conexión con Instagram.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Verifica si hay una conexión activa a Instagram
 */
export const checkInstagramConnection = (): boolean => {
  // En una implementación real, verificaríamos si tenemos un token válido
  // y si podemos hacer llamadas a la API de Instagram
  const hasToken = localStorage.getItem('hower-instagram-token') !== null;
  return hasToken;
};

/**
 * Desconecta la cuenta de Instagram (elimina el token)
 */
export const disconnectInstagram = () => {
  localStorage.removeItem('hower-instagram-token');
  toast({
    title: "Cuenta desconectada",
    description: "Tu cuenta de Instagram ha sido desconectada de Hower."
  });
  return true;
};

// Función simulada para procesar la respuesta del callback de Instagram
export const handleInstagramCallback = async (code: string) => {
  try {
    // En una implementación real, aquí harías una llamada al backend para intercambiar
    // el código por un token de acceso y luego guardarías ese token
    
    // Simulamos un token exitoso para demostración
    localStorage.setItem('hower-instagram-token', `demo-token-${Date.now()}`);
    
    toast({
      title: "Conexión exitosa",
      description: "Tu cuenta de Instagram ha sido conectada a Hower."
    });
    
    // Redirección al estado guardado (o al dashboard por defecto)
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    
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
