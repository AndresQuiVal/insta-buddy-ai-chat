import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UpdateUsernamesButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateUsernames = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Iniciando actualización de usernames...');
      
      const { data, error } = await supabase.functions.invoke('update-prospect-usernames');
      
      if (error) {
        console.error('❌ Error al actualizar usernames:', error);
        toast({
          title: "Error",
          description: "No se pudieron actualizar los usernames: " + error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ Resultado:', data);
        toast({
          title: "¡Éxito!",
          description: `Procesados ${data.processed} prospectos. Actualizados: ${data.updated}, Errores: ${data.errors}`,
        });
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Actualizar Usernames</h3>
        <p className="text-sm text-gray-600 mb-4">
          Actualiza los usernames genéricos (user_123456) con los usernames reales de Instagram.
        </p>
        <Button
          onClick={handleUpdateUsernames}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Actualizando...' : 'Actualizar Usernames'}
        </Button>
      </div>
    </div>
  );
};

export default UpdateUsernamesButton;