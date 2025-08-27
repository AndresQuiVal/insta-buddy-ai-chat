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
      const response = await fetch(`${this.baseUrl}/clients/api/get-sent-messages-usernames/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error calling Hower API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredCredentials() !== null;
  }
}

export default HowerService;