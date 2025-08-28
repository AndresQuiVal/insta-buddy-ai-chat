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
      console.log('📱 Instagram user data from localStorage:', instagramUserData ? 'found' : 'not found');
      
      if (!instagramUserData) {
        console.error('❌ No hay usuario de Instagram en localStorage');
        return {
          success: false,
          error: 'No hay usuario de Instagram autenticado'
        };
      }

      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      console.log('🆔 Instagram user ID obtenido:', instagramUserId);
      
      if (!instagramUserId) {
        console.error('❌ No se pudo obtener el ID de Instagram del objeto:', instagramUser);
        return {
          success: false,
          error: 'No se pudo obtener el ID de Instagram'
        };
      }

      console.log('🔄 Intentando obtener datos de Hower para usuario:', instagramUserId);

      // Primero intentar con la edge function (base de datos)
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase.functions.invoke('get-hower-usernames', {
          body: { instagram_user_id: instagramUserId }
        });

        console.log('📊 Respuesta de edge function - data:', data, 'error:', error);

        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }

        if (data && data.success) {
          console.log('✅ Datos obtenidos exitosamente via edge function');
          return {
            success: true,
            data: data.data
          };
        } else {
          throw new Error(data?.error || 'Edge function returned unsuccessful response');
        }

      } catch (edgeFunctionError) {
        console.log('⚠️ Edge function falló, intentando método directo:', edgeFunctionError);

        // FALLBACK: Usar credenciales de localStorage y llamada directa
        const localCredentials = this.getStoredCredentials();
        
        if (!localCredentials) {
          console.error('❌ Tampoco hay credenciales en localStorage');
          return {
            success: false,
            error: 'No hay credenciales de Hower disponibles. Ve a configuración para agregarlas.'
          };
        }

        console.log('🔄 Usando credenciales de localStorage como fallback:', {
          username: localCredentials.hower_username,
          hasToken: !!localCredentials.hower_token
        });

        // Migrar credenciales a la base de datos para la próxima vez
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase
            .from('instagram_users')
            .update({
              hower_username: localCredentials.hower_username,
              hower_token: localCredentials.hower_token
            })
            .eq('instagram_user_id', instagramUserId);
          console.log('✅ Credenciales migradas a la base de datos');
        } catch (migrationError) {
          console.warn('⚠️ No se pudieron migrar las credenciales:', migrationError);
        }

        // Llamada directa a Hower API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(`${this.baseUrl}/clients/api/get-sent-messages-usernames/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify(localCredentials),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          console.log('🌐 Respuesta directa de Hower API:', response.status, response.statusText);

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Credenciales de Hower inválidas. Verifica tu username y token en configuración.');
            } else if (response.status >= 500) {
              throw new Error('Error de servidor de Hower. Inténtalo de nuevo más tarde.');
            } else {
              throw new Error(`Error en la API de Hower (${response.status}). Contacta soporte.`);
            }
          }

          const howerData = await response.json();
          console.log('✅ Datos obtenidos exitosamente via API directa:', {
            success: howerData.success,
            usernamesCount: howerData.data?.usernames?.length || 0
          });
          
          return {
            success: true,
            data: howerData
          };

        } catch (directApiError) {
          clearTimeout(timeoutId);
          console.error('❌ Error en API directa:', directApiError);
          
          if (directApiError instanceof Error) {
            if (directApiError.name === 'AbortError') {
              throw new Error('Tiempo de conexión agotado. Verifica tu conexión a internet e inténtalo de nuevo.');
            } else if (directApiError.message.includes('Failed to fetch') || directApiError.message.includes('Network Error')) {
              if (retryCount < 1) {
                console.log('🔄 Reintentando conexión con Hower...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.getSentMessagesUsernames(retryCount + 1);
              }
              throw new Error('Error de conexión. No se pudo conectar con los servidores de Hower. Verifica que www.howersoftware.io esté disponible.');
            }
            throw directApiError;
          }
          
          throw new Error('Error desconocido al conectar con Hower');
        }
      }

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