import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, RefreshCw, Webhook } from 'lucide-react';

interface WebhookStatus {
  instagram_user_id: string;
  username: string;
  webhook_subscribed: boolean;
  last_message_received: string | null;
  autoresponders_count: number;
}

const WebhookDebug = () => {
  const [webhookStatuses, setWebhookStatuses] = useState<WebhookStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResubscribing, setIsResubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhookStatuses();
  }, []);

  const loadWebhookStatuses = async () => {
    try {
      setIsLoading(true);

      // Obtener usuarios activos
      const { data: users, error: usersError } = await supabase
        .from('instagram_users')
        .select('instagram_user_id, username, access_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const statuses: WebhookStatus[] = [];

      for (const user of users || []) {
        // Verificar último mensaje recibido
        const { data: lastMessage } = await supabase
          .from('instagram_messages')
          .select('created_at')
          .eq('message_type', 'received')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Contar autoresponders activos del usuario
        const { data: autoresponders } = await supabase
          .from('autoresponder_messages')
          .select('id')
          .eq('instagram_user_id_ref', user.instagram_user_id)
          .eq('is_active', true);

        statuses.push({
          instagram_user_id: user.instagram_user_id,
          username: user.username,
          webhook_subscribed: false, // Se verificará con la API
          last_message_received: lastMessage?.created_at || null,
          autoresponders_count: autoresponders?.length || 0
        });
      }

      setWebhookStatuses(statuses);
    } catch (error) {
      console.error('Error loading webhook statuses:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estados de webhook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resubscribeWebhooks = async () => {
    try {
      setIsResubscribing(true);
      let successCount = 0;
      let errorCount = 0;

      for (const status of webhookStatuses) {
        try {
          // Obtener el token del usuario
          const { data: user } = await supabase
            .from('instagram_users')
            .select('access_token')
            .eq('instagram_user_id', status.instagram_user_id)
            .single();

          if (!user?.access_token) {
            console.log(`No token available for ${status.username}`);
            errorCount++;
            continue;
          }

          // Llamar a la función de re-suscripción
          const { data, error } = await supabase.functions.invoke('instagram-subscribe-webhooks', {
            body: {
              instagram_user_id: status.instagram_user_id,
              access_token: user.access_token
            }
          });

          if (error) {
            console.error(`Error resubscribing ${status.username}:`, error);
            errorCount++;
          } else {
            console.log(`Successfully resubscribed ${status.username}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Exception resubscribing ${status.username}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Re-suscripción completada",
        description: `${successCount} exitosos, ${errorCount} errores`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      // Recargar estados
      await loadWebhookStatuses();
    } catch (error) {
      console.error('Error resubscribing webhooks:', error);
      toast({
        title: "Error",
        description: "Error durante la re-suscripción de webhooks",
        variant: "destructive"
      });
    } finally {
      setIsResubscribing(false);
    }
  };

  const getLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Hace menos de 1 hora';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Diagnóstico de Webhooks
          </CardTitle>
          <CardDescription>
            Verificando estado de webhooks y autoresponders...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Diagnóstico de Webhooks y Autoresponders
          </CardTitle>
          <CardDescription>
            Estado actual de webhooks de Instagram y configuración de autoresponders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total de usuarios activos: {webhookStatuses.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Autoresponders configurados: {webhookStatuses.reduce((acc, status) => acc + status.autoresponders_count, 0)}
              </p>
            </div>
            <Button 
              onClick={resubscribeWebhooks}
              disabled={isResubscribing}
              className="flex items-center gap-2"
            >
              {isResubscribing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-suscribir Webhooks
            </Button>
          </div>

          <div className="space-y-3">
            {webhookStatuses.map((status) => (
              <div 
                key={status.instagram_user_id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{status.username}</span>
                    <Badge variant={status.autoresponders_count > 0 ? "default" : "secondary"}>
                      {status.autoresponders_count} autoresponders
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Último mensaje: {getLastMessageTime(status.last_message_received)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {status.last_message_received ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {status.last_message_received ? 'Activo' : 'Sin actividad'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {webhookStatuses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios activos
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Solución de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">Si los autoresponders no funcionan:</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Haz clic en "Re-suscribir Webhooks" arriba</li>
              <li>Verifica que la URL del webhook esté configurada correctamente en Facebook Developer Console</li>
              <li>Asegúrate de que los autoresponders estén activos y tengan palabras clave configuradas</li>
              <li>Envía un mensaje de prueba desde otra cuenta de Instagram</li>
            </ol>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">URL del Webhook:</h4>
            <p className="text-sm text-blue-700 font-mono break-all">
              https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookDebug;