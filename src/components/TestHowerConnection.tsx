import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Loader2 } from 'lucide-react';
import HowerService from '@/services/howerService';

const TestHowerConnection: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const testHowerAPI = async () => {
    setIsTesting(true);
    
    try {
      console.log('🧪 Iniciando test de Hower API...');
      
      // Obtener credenciales de Hower desde localStorage
      const credentials = HowerService.getStoredCredentials();
      
      console.log('🔑 Estado de credenciales:', {
        hasCredentials: !!credentials,
        username: credentials?.hower_username || 'NO FOUND',
        hasToken: !!credentials?.hower_token
      });
      
      // Si no hay credenciales, usar credenciales de prueba hardcodeadas
      const testCredentials = credentials || {
        hower_username: "andresquival",
        hower_token: "testhower"
      };

      console.log('🧪 Usando credenciales:', {
        username: testCredentials.hower_username,
        hasToken: !!testCredentials.hower_token
      });

      // Llamar a la función de test
      const { data, error } = await supabase.functions.invoke('test-search', {
        body: { 
          howerUsername: testCredentials.hower_username,
          howerToken: testCredentials.hower_token,
          query: "emprendedores jóvenes"
        }
      });

      if (error) {
        console.error('❌ Error en test:', error);
        toast({
          title: "❌ Error en conexión",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Respuesta del test:', data);
      
      if (data?.success) {
        toast({
          title: "✅ Conexión exitosa",
          description: `Se encontraron ${data.results?.length || 0} resultados de prueba`,
        });
      } else {
        toast({
          title: "⚠️ Conexión fallida",
          description: `Error: ${data?.error || 'Sin detalles'}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Error general:', error);
      toast({
        title: "❌ Error",
        description: "Error inesperado al probar la conexión",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button 
      onClick={testHowerAPI}
      disabled={isTesting}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isTesting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <TestTube className="w-4 h-4" />
      )}
      {isTesting ? 'Probando...' : 'Test Hower API'}
    </Button>
  );
};

export default TestHowerConnection;