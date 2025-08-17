import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const InstagramDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkCurrentUser = () => {
    const savedUserData = localStorage.getItem('hower-instagram-user');
    if (savedUserData) {
      const userData = JSON.parse(savedUserData);
      console.log('👤 Usuario en localStorage:', userData);
      return userData;
    }
    return null;
  };

  const testWebhookConnection = async () => {
    setIsLoading(true);
    try {
      const currentUser = checkCurrentUser();
      if (!currentUser) {
        setDebugInfo({ error: 'No hay usuario logueado' });
        return;
      }

      // Verificar usuario en DB
      const { data: dbUser, error: dbError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .single();

      if (dbError) {
        setDebugInfo({ error: 'Error obteniendo usuario de DB', details: dbError });
        return;
      }

      // Obtener mensajes recientes
      const { data: recentMessages, error: msgError } = await supabase
        .from('instagram_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.instagram_user_id},recipient_id.eq.${currentUser.instagram_user_id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (msgError) {
        setDebugInfo({ error: 'Error obteniendo mensajes', details: msgError });
        return;
      }

      // Llamar edge function para sincronizar
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-new-posts', {
        body: { instagram_user_id: currentUser.instagram_user_id }
      });

      setDebugInfo({
        currentUser,
        dbUser,
        recentMessages: recentMessages || [],
        syncResult,
        syncError,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en debug:', error);
      setDebugInfo({ error: 'Error general', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Panel de Debug - Instagram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testWebhookConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verificar Estado y Sincronizar
            </>
          )}
        </Button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Información de Debug:</h3>
            <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Usuario actual:</strong> {checkCurrentUser()?.username || 'No detectado'}</p>
          <p><strong>Instagram ID:</strong> {checkCurrentUser()?.instagram_user_id || 'No detectado'}</p>
          <p><strong>Token:</strong> {checkCurrentUser()?.access_token ? '✅ Presente' : '❌ Faltante'}</p>
        </div>
      </CardContent>
    </Card>
  );
};