interface HowerUserData {
  hower_username: string;
  hower_token: string;
}

interface HowerResponse {
  data?: any[];
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

  static async getSentMessagesUsernames(): Promise<HowerResponse> {
    const credentials = this.getStoredCredentials();
    
    if (!credentials) {
      return {
        success: false,
        error: 'No hay credenciales de Hower guardadas'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/clients/api/get-sent-messages-usernames/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error calling Hower API:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Tiempo de conexión agotado. Verifica tu conexión a internet e inténtalo de nuevo.'
          };
        } else if (error.message.includes('fetch')) {
          return {
            success: false,
            error: 'Error de conexión. No se pudo conectar con los servidores de Hower. Verifica tu conexión a internet.'
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