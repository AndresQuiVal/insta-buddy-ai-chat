interface HowerUserData {
  hower_username: string;
  hower_token: string;
}

interface HowerResponse {
  data?: {
    success: boolean;
    message: string;
    data: {
      hower_username: string;
      total_available: number;
      total_count: number;
      usernames: string[];
    };
  };
  error?: string;
  success: boolean;
}

export class HowerService {
  private static baseUrl = 'https://www.howersoftware.io';

  static getStoredCredentials(): HowerUserData | null {
    const username = localStorage.getItem('hower_username');
    const token = localStorage.getItem('hower_token');
    
    if (!username || !token) {
      return null;
    }
    
    return {
      hower_username: username,
      hower_token: token
    };
  }

  static clearStoredCredentials(): void {
    localStorage.removeItem('hower_username');
    localStorage.removeItem('hower_token');
  }

  static async getSentMessagesUsernames(retryCount = 0): Promise<HowerResponse> {
    try {
      // Obtener el instagram user ID desde localStorage
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        return {
          success: false,
          error: 'No hay usuario de Instagram autenticado'
        };
      }

      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        return {
          success: false,
          error: 'No se pudo obtener el ID de Instagram'
        };
      }

      console.log('🔄 Llamando edge function get-hower-usernames para usuario:', instagramUserId);

      // Usar la edge function en lugar de llamada directa
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('get-hower-usernames', {
        body: { instagram_user_id: instagramUserId }
      });

      if (error) {
        console.error('❌ Error en edge function:', error);
        throw new Error('Error al obtener datos de Hower. Verifica tu configuración.');
      }

      if (!data.success) {
        console.error('❌ Error en respuesta:', data.error);
        throw new Error(data.error || 'Error desconocido en Hower');
      }

      console.log('✅ Datos recibidos de edge function:', data);
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error calling Hower API:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      });
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Tiempo de conexión agotado. Verifica tu conexión a internet e inténtalo de nuevo.'
          };
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          // Retry once for network errors
          if (retryCount < 1) {
            console.log('Reintentando conexión con Hower...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return this.getSentMessagesUsernames(retryCount + 1);
          }
          return {
            success: false,
            error: 'Error de conexión. No se pudo conectar con los servidores de Hower. Verifica que www.howersoftware.io esté disponible.'
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: 'Error desconocido al conectar con Hower'
      };
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredCredentials() !== null;
  }
}

export default HowerService;