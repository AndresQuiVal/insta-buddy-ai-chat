import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, XCircle } from 'lucide-react';

const TestWhatsAppProspects: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testProspectSearch = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando test de búsqueda de prospectos...');
      
      // Llamar a la función de WhatsApp que internamente hará la búsqueda
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notifications', {
        body: { test_mode: true }
      });

      if (error) {
        console.error('Error en test:', error);
        toast({
          title: "Error en el test",
          description: error.message || "Error desconocido",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Test completado:', data);
      setResults(data);
      
      toast({
        title: "Test completado",
        description: "La búsqueda de prospectos se ejecutó correctamente",
      });

    } catch (error) {
      console.error('Error en testProspectSearch:', error);
      toast({
        title: "Error",
        description: "Error al ejecutar el test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Test Búsqueda de Prospectos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Este test ejecuta la búsqueda automática de prospectos que se ejecuta antes de las notificaciones de WhatsApp.
        </p>
        
        <Button 
          onClick={testProspectSearch}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Test'}
        </Button>
        
        {results && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {results.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {results.success ? 'Éxito' : 'Error'}
              </span>
            </div>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestWhatsAppProspects;