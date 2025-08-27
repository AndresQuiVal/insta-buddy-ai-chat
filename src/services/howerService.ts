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
    const credentials = this.getStoredCredentials();
    
    if (!credentials) {
      return {
        success: false,
        error: 'No hay credenciales de Hower guardadas'
      };
    }

    try {
      console.log('Intentando conectar con Hower API:', this.baseUrl);
      console.log('Credenciales:', { username: credentials.hower_username, hasToken: !!credentials.hower_token });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/clients/api/get-sent-messages-usernames/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(credentials),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales de Hower inválidas. Verifica tu username y token.');
        } else if (response.status >= 500) {
          throw new Error('Error de servidor de Hower. Inténtalo de nuevo más tarde.');
        } else {
          throw new Error(`Error en la API de Hower (${response.status}). Contacta soporte.`);
        }
      }

      const data = await response.json();
      console.log('Datos recibidos de Hower:', data);
      
      return {
        success: true,
        data: data
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