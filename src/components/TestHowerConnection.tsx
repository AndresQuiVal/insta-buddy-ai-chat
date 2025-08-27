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
      // Obtener credenciales de Hower desde localStorage
      const credentials = HowerService.getStoredCredentials();
      
      if (!credentials) {
        toast({
          title: "❌ Sin credenciales",
          description: "No hay credenciales de Hower guardadas",
          variant: "destructive"
        });
        return;
      }

      console.log('🧪 Probando conexión con Hower API...');

      // Llamar a la función de test
      const { data, error } = await supabase.functions.invoke('test-search', {
        body: { 
          howerUsername: credentials.hower_username,
          howerToken: credentials.hower_token,
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