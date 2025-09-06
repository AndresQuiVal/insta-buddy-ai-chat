import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Webhook, AlertCircle, CheckCircle } from 'lucide-react';

const TestUserWebhookFix = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const { toast } = useToast();

  const fixT3stus3r1Webhook = async () => {
    try {
      setIsFixing(true);
      
      // Obtener datos del usuario t3stus3r_1
      const { data: user, error: userError } = await supabase
        .from('instagram_users')
        .select('instagram_user_id, access_token, username')
        .eq('username', 't3stus3r_1')
        .single();

      if (userError || !user) {
        throw new Error('Usuario t3stus3r_1 no encontrado');
      }

      if (!user.access_token) {
        throw new Error('No hay token de acceso para t3stus3r_1');
      }

      console.log('🔧 Resubscribiendo webhooks para @t3stus3r_1...');
      
      // Llamar función de re-suscripción
      const { data, error } = await supabase.functions.invoke('instagram-subscribe-webhooks', {
        body: {
          instagram_user_id: user.instagram_user_id,
          access_token: user.access_token
        }
      });

      if (error) {
        console.error('❌ Error en re-suscripción:', error);
        throw error;
      }

      console.log('✅ Webhooks resubscritos exitosamente:', data);
      setIsFixed(true);
      
      toast({
        title: "¡Webhooks Resubscritos!",
        description: "Los webhooks para @t3stus3r_1 han sido reactivados. Ahora debería recibir mensajes normalmente.",
        variant: "default"
      });

    } catch (error: any) {
      console.error('💥 Error completo:', error);
      toast({
        title: "Error al resubscribir",
        description: error.message || "No se pudo reactivar los webhooks",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Fix @t3stus3r_1 Webhooks
        </CardTitle>
        <CardDescription>
          Reactivar webhooks de Instagram para @t3stus3r_1
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Problema Detectado</span>
          </div>
          <p className="text-sm text-yellow-700">
            @t3stus3r_1 no recibe mensajes porque los webhooks no están suscritos correctamente.
          </p>
        </div>

        {isFixed && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">¡Arreglado!</span>
            </div>
            <p className="text-sm text-green-700">
              Los webhooks han sido reactivados. Envía un mensaje de prueba a @t3stus3r_1 para verificar.
            </p>
          </div>
        )}

        <Button 
          onClick={fixT3stus3r1Webhook}
          disabled={isFixing}
          className="w-full"
          variant={isFixed ? "outline" : "default"}
        >
          {isFixing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Reactivando webhooks...
            </>
          ) : (
            <>
              <Webhook className="h-4 w-4 mr-2" />
              {isFixed ? 'Reactivar de nuevo' : 'Reactivar Webhooks'}
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>ID Usuario:</strong> 17841476750100592</p>
          <p><strong>Mensajes enviados:</strong> 2</p>
          <p><strong>Mensajes recibidos:</strong> 0 ❌</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestUserWebhookFix;