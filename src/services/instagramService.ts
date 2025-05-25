
import { toast } from '@/hooks/use-toast';

// Configuración de Instagram (mantenemos para futura migración a API real)
const INSTAGRAM_CLIENT_ID = '1059372749433300';
const INSTAGRAM_REDIRECT_URI = window.location.origin + '/auth/instagram/callback';
const INSTAGRAM_SCOPE = 'user_profile,user_media';

export interface InstagramAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/**
 * Inicia el flujo de autenticación simulado de Instagram
 */
export const initiateInstagramAuth = (config: InstagramAuthConfig = {
  clientId: INSTAGRAM_CLIENT_ID,
  redirectUri: INSTAGRAM_REDIRECT_URI,
  scope: INSTAGRAM_SCOPE
}) => {
  try {
    console.log('Iniciando simulación de autenticación con Instagram...');
    
    // Guardar la ruta actual para redirigir después de la autenticación
    localStorage.setItem('hower-auth-redirect', window.location.pathname);
    
    // Simular el proceso de autorización de Instagram
    // En lugar de redirigir a Instagram, simulamos el callback exitoso
    setTimeout(() => {
      // Generar un código simulado
      const simulatedCode = `AQD${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
      
      console.log('Simulando callback exitoso con código:', simulatedCode);
      
      // Procesar el "callback" simulado
      handleInstagramCallback(simulatedCode);
    }, 1500); // Simular un pequeño delay como si fuera real
    
    // Mostrar mensaje de progreso
    toast({
      title: "Conectando con Instagram",
      description: "Procesando autenticación...",
      variant: "default"
    });
    
    return true;
  } catch (error) {
    console.error('Error en simulación de autenticación de Instagram:', error);
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
 * Procesa la respuesta del callback de Instagram (simulado)
 */
export const handleInstagramCallback = async (code: string) => {
  try {
    console.log('Procesando código de autorización simulado:', code);
    
    // Simular datos de usuario de Instagram
    const simulatedUser = {
      id: `ig_user_${Math.random().toString(36).substring(2, 10)}`,
      username: `usuario_${Math.random().toString(36).substring(2, 6)}`,
      account_type: 'PERSONAL',
      media_count: Math.floor(Math.random() * 100) + 10
    };
    
    // Simular token de acceso
    const mockToken = `ig_token_${code.substring(3, 13)}_${Date.now()}`;
    
    // Guardar datos simulados
    localStorage.setItem('hower-instagram-token', mockToken);
    localStorage.setItem('hower-instagram-user', JSON.stringify(simulatedUser));
    
    console.log('Token y datos de usuario guardados exitosamente');
    console.log('Usuario simulado:', simulatedUser);
    
    toast({
      title: "¡Conexión exitosa!",
      description: `Conectado como @${simulatedUser.username}`,
      variant: "default"
    });
    
    // Redirección al estado guardado (o al dashboard por defecto)
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    
    console.log('Simulación completada exitosamente');
    
    return {
      success: true,
      redirectPath,
      user: simulatedUser
    };
  } catch (error) {
    console.error('Error procesando simulación de Instagram:', error);
    
    toast({
      title: "Error de conexión",
      description: "No se pudo completar la conexión con Instagram. Inténtalo más tarde.",
      variant: "destructive"
    });
    
    return {
      success: false,
      error: 'Error procesando la simulación de Instagram'
    };
  }
};

/**
 * Obtiene información del usuario conectado
 */
export const getInstagramUserInfo = () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return null;
  
  const userDataString = localStorage.getItem('hower-instagram-user');
  if (userDataString) {
    return JSON.parse(userDataString);
  }
  
  // Datos por defecto si no hay información guardada
  return {
    id: 'user_default',
    username: 'usuario_conectado',
    account_type: 'PERSONAL',
    media_count: 25
  };
};

/**
 * Simula obtener posts recientes del usuario
 */
export const getInstagramPosts = () => {
  const token = localStorage.getItem('hower-instagram-token');
  if (!token) return [];
  
  // Simular posts de Instagram
  return [
    {
      id: '1',
      caption: 'Mi último post en Instagram 📸',
      media_type: 'IMAGE',
      media_url: '/placeholder.svg',
      timestamp: new Date().toISOString()
    },
    {
      id: '2', 
      caption: 'Otro post genial 🌟',
      media_type: 'IMAGE',
      media_url: '/placeholder.svg',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ];
};

/**
 * Función para uso futuro con API real (comentada)
 */
/*
export const exchangeCodeForTokenReal = async (code: string) => {
  // Esta función sería llamada desde tu backend en producción
  const tokenUrl = 'https://api.instagram.com/oauth/access_token';
  
  const formData = new FormData();
  formData.append('client_id', INSTAGRAM_CLIENT_ID);
  formData.append('client_secret', 'SECRET_KEY_FROM_BACKEND'); // Nunca en frontend
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', INSTAGRAM_REDIRECT_URI);
  formData.append('code', code);
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error intercambiando código por token:', error);
    throw error;
  }
};
*/
