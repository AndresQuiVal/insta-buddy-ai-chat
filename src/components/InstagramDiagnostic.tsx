
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Database, Webhook, MessageCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstagramDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults({});
    
    const results: any = {};

    try {
      // 1. Verificar conexión a base de datos y mensajes recientes
      console.log('🔍 1. Verificando base de datos y mensajes recientes...');
      try {
        const { data: recentMessages, error, count } = await supabase
          .from('instagram_messages')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5);
        
        results.database = {
          status: error ? 'error' : 'success',
          message: error ? `Error: ${error.message}` : `Conectado - ${count || 0} mensajes en total`,
          count: count || 0,
          recentMessages: recentMessages || []
        };
      } catch (err: any) {
        results.database = {
          status: 'error',
          message: `Error de conexión: ${err.message}`,
          count: 0,
          recentMessages: []
        };
      }

      // 2. Probar webhook directamente
      console.log('🔍 2. Probando webhook directamente...');
      try {
        const webhookUrl = 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook';
        const testUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=hower-instagram-webhook-token&hub.challenge=test123`;
        
        const response = await fetch(testUrl);
        const responseText = await response.text();
        
        results.webhookDirect = {
          status: response.ok ? 'success' : 'error',
          message: response.ok ? 'Webhook accesible - Verificación exitosa' : `Error ${response.status}: ${response.statusText}`,
          url: testUrl,
          statusCode: response.status,
          response: responseText
        };
      } catch (err: any) {
        results.webhookDirect = {
          status: 'error',
          message: `Error conectando al webhook: ${err.message}`,
          url: 'No disponible'
        };
      }

      // 3. Verificar token de Instagram
      console.log('🔍 3. Verificando token de Instagram...');
      const currentToken = localStorage.getItem('hower-instagram-token');
      if (currentToken) {
        try {
          const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${currentToken}`);
          const tokenData = await tokenResponse.json();
          
          if (tokenData.error) {
            results.token = {
              status: 'error',
              message: `Token error: ${tokenData.error.message}`,
              hasToken: true
            };
          } else {
            // Intentar obtener información de Instagram Business
            try {
              const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/${tokenData.id}/accounts?fields=instagram_business_account&access_token=${currentToken}`);
              const accountsData = await accountsResponse.json();
              
              let instagramInfo = 'No conectado';
              if (accountsData.data && accountsData.data.length > 0) {
                const pageWithInstagram = accountsData.data.find(page => page.instagram_business_account);
                if (pageWithInstagram) {
                  instagramInfo = 'Conectado ✓';
                }
              }
              
              results.token = {
                status: 'success',
                message: `Token válido - Usuario: ${tokenData.name} / Instagram Business: ${instagramInfo}`,
                hasToken: true,
                userInfo: tokenData
              };
            } catch (igErr) {
              results.token = {
                status: 'success',
                message: `Token válido - Usuario: ${tokenData.name} / Instagram Business: Error verificando`,
                hasToken: true,
                userInfo: tokenData
              };
            }
          }
        } catch (err: any) {
          results.token = {
            status: 'error',
            message: `Error verificando token: ${err.message}`,
            hasToken: true
          };
        }
      } else {
        results.token = {
          status: 'error',
          message: 'No hay token guardado - Necesitas conectar Instagram',
          hasToken: false
        };
      }

      // 4. Probar envío de mensaje de prueba al webhook
      console.log('🔍 4. Enviando mensaje de prueba al webhook...');
      try {
        const testPayload = {
          object: 'instagram',
          entry: [{
            id: 'test_page_id',
            time: Math.floor(Date.now() / 1000),
            messaging: [{
              sender: { id: 'test_diagnostic_user' },
              recipient: { id: 'test_page_id' },
              timestamp: Math.floor(Date.now() / 1000),
              message: {
                mid: `diagnostic_test_${Date.now()}`,
                text: `🧪 MENSAJE DE PRUEBA DIAGNÓSTICO - ${new Date().toLocaleString()}`
              }
            }]
          }]
        };

        const { data: webhookResponse, error: webhookResponseError } = await supabase.functions.invoke('instagram-webhook', {
          body: testPayload
        });

        results.webhookTest = {
          status: webhookResponseError ? 'error' : 'success',
          message: webhookResponseError ? `Error: ${webhookResponseError.message}` : 'Mensaje enviado al webhook correctamente',
          response: webhookResponse || 'OK'
        };

      } catch (err: any) {
        results.webhookTest = {
          status: 'error',
          message: `Error enviando mensaje de prueba: ${err.message}`,
          response: null
        };
      }

      setDiagnosticResults(results);
      console.log('🎯 Resultados completos del diagnóstico:', results);

      // Determinar estado general
      const hasErrors = Object.values(results).some((result: any) => result.status === 'error');
      
      if (!hasErrors) {
        toast({
          title: "¡Diagnóstico exitoso!",
          description: "Todos los sistemas funcionan correctamente",
        });
      } else {
        toast({
          title: "Se encontraron problemas",
          description: "Revisa los resultados del diagnóstico",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('💥 Error en diagnóstico:', error);
      toast({
        title: "Error en diagnóstico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Diagnóstico de Instagram</h3>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={runFullDiagnostic}
          disabled={isRunning}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Ejecutando diagnóstico...
            </>
          ) : (
            '🔍 Ejecutar Diagnóstico Completo'
          )}
        </Button>

        {Object.keys(diagnosticResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Resultados del Diagnóstico:</h4>
            
            {/* Base de datos */}
            {diagnosticResults.database && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.database.status} />
                    <span className="font-medium">Base de Datos</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.database.message}</p>
                  {diagnosticResults.database.recentMessages && diagnosticResults.database.recentMessages.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">Ver últimos mensajes</summary>
                      <div className="mt-1 text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                        {diagnosticResults.database.recentMessages.map((msg: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-100 pb-1 mb-1 last:border-b-0 last:mb-0">
                            <div><strong>De:</strong> {msg.sender_id.substring(0, 20)}...</div>
                            <div><strong>Texto:</strong> {msg.message_text.substring(0, 50)}...</div>
                            <div><strong>Fecha:</strong> {new Date(msg.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Token */}
            {diagnosticResults.token && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.token.status} />
                    <span className="font-medium">Cuenta de Instagram</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.token.message}</p>
                  {diagnosticResults.token.status === 'error' && !diagnosticResults.token.hasToken && (
                    <button 
                      onClick={() => window.location.href = '/settings'}
                      className="mt-2 text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                    >
                      Conectar Instagram
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Webhook directo */}
            {diagnosticResults.webhookDirect && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Webhook className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.webhookDirect.status} />
                    <span className="font-medium">Webhook (Directo)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.webhookDirect.message}</p>
                  {diagnosticResults.webhookDirect.url && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">Ver detalles</summary>
                      <div className="mt-1 text-xs bg-white p-2 rounded border">
                        <div><strong>URL:</strong> {diagnosticResults.webhookDirect.url}</div>
                        <div><strong>Status:</strong> {diagnosticResults.webhookDirect.statusCode}</div>
                        {diagnosticResults.webhookDirect.response && (
                          <div><strong>Respuesta:</strong> {diagnosticResults.webhookDirect.response}</div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Test de webhook */}
            {diagnosticResults.webhookTest && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.webhookTest.status} />
                    <span className="font-medium">Prueba de Webhook</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.webhookTest.message}</p>
                  {diagnosticResults.webhookTest.response && (
                    <p className="text-xs text-gray-500 mt-1">Respuesta: {JSON.stringify(diagnosticResults.webhookTest.response)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📋 Pasos para configurar el webhook:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Ve a <strong>Facebook Developers</strong> → Tu app → Productos → Webhooks</li>
            <li>Configura la URL: <code className="bg-blue-100 px-1 rounded">https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook</code></li>
            <li>Token de verificación: <code className="bg-blue-100 px-1 rounded">hower-instagram-webhook-token</code></li>
            <li>Campos de suscripción: <strong>messages</strong></li>
          </ol>
          <a 
            href="https://developers.facebook.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir Facebook Developers
          </a>
        </div>
      </div>
    </div>
  );
};

export default InstagramDiagnostic;
