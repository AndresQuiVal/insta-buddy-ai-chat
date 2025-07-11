import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  success: boolean;
  stats?: {
    processedUsers: number;
    totalNewAssignments: number;
    autoresponders: number;
  };
  details?: any[];
  error?: string;
}

const NewPostsSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleManualSync = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando sincronización manual de nuevas publicaciones...');

      const { data, error } = await supabase.functions.invoke('sync-new-posts', {
        body: { manual: true }
      });

      if (error) {
        console.error('❌ Error en edge function:', error);
        throw new Error(error.message || 'Error ejecutando sincronización');
      }

      console.log('✅ Sincronización completada:', data);
      
      setLastSyncResult(data);

      if (data.success) {
        toast({
          title: "¡Sincronización completada!",
          description: `${data.stats?.totalNewAssignments || 0} nuevas asignaciones creadas para ${data.stats?.processedUsers || 0} usuarios`,
        });
      } else {
        toast({
          title: "Error en sincronización",
          description: data.error || "Error durante la sincronización",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('💥 Error en sincronización manual:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      setLastSyncResult({
        success: false,
        error: errorMessage
      });

      toast({
        title: "Error ejecutando sincronización",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <RefreshCw className="w-5 h-5" />
          Sincronización de Nuevas Publicaciones
        </CardTitle>
        <p className="text-sm text-blue-700">
          Sincroniza automáticamente las nuevas publicaciones con autoresponders configurados para "todas las publicaciones".
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información del cron automático */}
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Clock className="w-4 h-4" />
            <strong>Sincronización automática:</strong> Todos los días a las 9:00 AM
          </div>
        </div>

        {/* Botón de sincronización manual */}
        <Button
          onClick={handleManualSync}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Ahora
            </>
          )}
        </Button>

        {/* Resultado de la última sincronización */}
        {lastSyncResult && (
          <div className={`p-3 rounded-lg border ${
            lastSyncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastSyncResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                lastSyncResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastSyncResult.success ? 'Sincronización exitosa' : 'Error en sincronización'}
              </span>
            </div>
            
            {lastSyncResult.success && lastSyncResult.stats && (
              <div className="text-xs text-green-700 space-y-1">
                <div>• {lastSyncResult.stats.processedUsers} usuarios procesados</div>
                <div>• {lastSyncResult.stats.totalNewAssignments} nuevas asignaciones creadas</div>
                <div>• {lastSyncResult.stats.autoresponders} autoresponders automáticos encontrados</div>
              </div>
            )}
            
            {!lastSyncResult.success && (
              <div className="text-xs text-red-700">
                {lastSyncResult.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewPostsSyncButton;