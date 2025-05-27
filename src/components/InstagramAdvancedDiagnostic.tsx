
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Webhook, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstagramAdvancedDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runAdvancedDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults({});
    
    console.log('🔍 === DIAGNÓSTICO COMPLETO INICIADO ===');
    const results: any = {};

    try {
      // Paso 1: Verificar conexión local
      console.log('DEBUG: Paso 1/4: Verificando conexión local...');
      console.log('DEBUG: === VERIFICANDO CONEXIÓN LOCAL ===');
      
      const token = localStorage.getItem('hower-instagram-token') || localStorage.getItem('instagram_access_token');
      const user = localStorage.getItem('hower-instagram-user');
      
      console.log('DEBUG: ✓ Token encontrado:', !!token, token ? `(${token.length} chars)` : '');
      console.log('DEBUG: ✓ Usuario encontrado:', !!user);
      
      results.localConnection = {
        hasToken: !!token,
        hasUser: !!user,
        tokenLength: token?.length || 0
      };

      // Paso 2: Verificar base de datos
      console.log('DEBUG: Paso 2/4: Verificando base de datos...');
      console.log('DEBUG: === VERIFICANDO BASE DE DATOS ===');
      
      const { data: messages, error: dbError, count } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) {
        console.log('DEBUG: ❌ Error en base de datos:', dbError);
        results.database = { status: 'error', error: dbError.message };
      } else {
        console.log('DEBUG: ✓ Base de datos OK. Total mensajes:', count);
        if (messages && messages.length > 0) {
          messages.forEach((msg, idx) => {
            console.log(`DEBUG:   Mensaje ${idx + 1}: ${msg.message_type} - "${msg.message_text}" (${new Date(msg.timestamp).toLocaleString()})`);
          });
        }
        results.database = { 
          status: 'success', 
          totalMessages: count,
          recentMessages: messages?.slice(0, 5) || []
        };
      }

      // Paso 3: Verificar permisos de Instagram
      console.log('DEBUG: Paso 3/4: Verificando permisos de Instagram...');
      if (token) {
        console.log('DEBUG: === VERIFICANDO PERMISOS DEL TOKEN ===');
        
        try {
          // Verificar permisos del token
          const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`);
          const permissionsData = await permissionsResponse.json();
          
          if (permissionsData.data) {
            console.log('DEBUG: Permisos del token:');
            permissionsData.data.forEach((perm: any) => {
              console.log(`DEBUG:   - ${perm.permission}: ${perm.status}`);
            });
            
            results.permissions = {
              status: 'success',
              permissions: permissionsData.data
            };
          }

          // Verificar cuentas de Instagram conectadas
          const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
          const userData = await userResponse.json();
          
          if (userData.id) {
            const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=instagram_business_account&access_token=${token}`);
            const accountsData = await accountsResponse.json();
            
            console.log('DEBUG: Cuentas de Instagram conectadas:');
            if (accountsData.data && accountsData.data.length > 0) {
              accountsData.data.forEach((account: any) => {
                if (account.instagram_business_account) {
                  console.log('DEBUG:   ✓ Cuenta encontrada:', account.instagram_business_account.id);
                }
              });
              
              results.instagramAccounts = {
                status: 'success',
                accounts: accountsData.data
              };
            } else {
              console.log('DEBUG:   ❌ No se encontraron cuentas de Instagram Business');
              results.instagramAccounts = {
                status: 'error',
                message: 'No hay cuentas de Instagram Business conectadas'
              };
            }
          }
        } catch (error: any) {
          console.log('DEBUG: ❌ Error verificando permisos:', error.message);
          results.permissions = {
            status: 'error',
            error: error.message
          };
        }
      }

      // Paso 4: Probar webhook avanzado
      console.log('DEBUG: Paso 4/4: Probando webhook avanzado...');
      console.log('DEBUG: === PRUEBA AVANZADA DE WEBHOOK ===');
      
      const webhookUrl = 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook';
      
      try {
        // Prueba 1: GET request de verificación
        console.log('DEBUG: Prueba 1: GET request de verificación...');
        const verifyResponse = await fetch(`${webhookUrl}?hub.mode=subscribe&hub.verify_token=hower-instagram-webhook-token&hub.challenge=test123`);
        const verifyText = await verifyResponse.text();
        
        results.webhookVerification = {
          status: verifyResponse.ok ? 'success' : 'error',
          statusCode: verifyResponse.status,
          response: verifyText,
          expectedChallenge: 'test123'
        };

        // Prueba 2: POST request con payload simulado
        console.log('DEBUG: Prueba 2: POST request con payload simulado...');
        const testPayload = {
          object: 'instagram',
          entry: [{
            id: '0',
            time: Math.floor(Date.now() / 1000),
            changes: [{
              field: 'messages',
              value: {
                sender: { id: '12334' },
                recipient: { id: '23245' },
                timestamp: '1527459824',
                message: {
                  mid: 'random_mid',
                  text: 'random_text'
                }
              }
            }]
          }]
        };

        const postResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': 'sha256=0120d7731a8fd19605c58a8b3a0dcc5cd7e13d6091b6fdaeb903b3e73a66c02e'
          },
          body: JSON.stringify(testPayload)
        });

        const postText = await postResponse.text();
        
        results.webhookPost = {
          status: postResponse.ok ? 'success' : 'error',
          statusCode: postResponse.status,
          response: postText
        };

        console.log('DEBUG: ✓ Webhook POST test completado');

      } catch (error: any) {
        console.log('DEBUG: ✗ Error en prueba de webhook:', error.message);
        results.webhookTest = {
          status: 'error',
          error: error.message
        };
      }

      console.log('DEBUG: 🎉 === DIAGNÓSTICO COMPLETADO ===');
      setDiagnosticResults(results);

    } catch (error: any) {
      console.error('💥 Error en diagnóstico avanzado:', error);
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
        <Webhook className="w-6 h-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Diagnóstico Avanzado del Sistema</h3>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={runAdvancedDiagnostic}
          disabled={isRunning}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Ejecutando diagnóstico avanzado...
            </>
          ) : (
            '🔍 Ejecutar Diagnóstico Completo'
          )}
        </Button>

        {Object.keys(diagnosticResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Resultados del Diagnóstico:</h4>
            
            {/* Conexión Local */}
            {diagnosticResults.localConnection && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.localConnection.hasToken ? 'success' : 'error'} />
                    <span className="font-medium">Conexión Local</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Token: {diagnosticResults.localConnection.hasToken ? '✓' : '✗'} | 
                    Usuario: {diagnosticResults.localConnection.hasUser ? '✓' : '✗'}
                  </p>
                </div>
              </div>
            )}

            {/* Base de Datos */}
            {diagnosticResults.database && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.database.status} />
                    <span className="font-medium">Base de Datos</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Total mensajes: {diagnosticResults.database.totalMessages || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Permisos */}
            {diagnosticResults.permissions && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.permissions.status} />
                    <span className="font-medium">Permisos de Instagram</span>
                  </div>
                  {diagnosticResults.permissions.permissions && (
                    <div className="text-xs text-gray-500 mt-1">
                      {diagnosticResults.permissions.permissions.map((perm: any, idx: number) => (
                        <div key={idx}>{perm.permission}: {perm.status}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cuentas de Instagram */}
            {diagnosticResults.instagramAccounts && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Send className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.instagramAccounts.status} />
                    <span className="font-medium">Cuentas de Instagram Business</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {diagnosticResults.instagramAccounts.status === 'success' 
                      ? `${diagnosticResults.instagramAccounts.accounts?.length || 0} cuentas encontradas`
                      : diagnosticResults.instagramAccounts.message
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Verificación de Webhook */}
            {diagnosticResults.webhookVerification && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Webhook className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.webhookVerification.status} />
                    <span className="font-medium">Verificación de Webhook</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {diagnosticResults.webhookVerification.statusCode} | 
                    Response: {diagnosticResults.webhookVerification.response}
                  </p>
                </div>
              </div>
            )}

            {/* POST de Webhook */}
            {diagnosticResults.webhookPost && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.webhookPost.status} />
                    <span className="font-medium">Prueba POST de Webhook</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {diagnosticResults.webhookPost.statusCode} | 
                    Response: {diagnosticResults.webhookPost.response}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">🎯 Este diagnóstico verificará:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Tokens de acceso y datos de usuario guardados</li>
            <li>• Conexión y mensajes en la base de datos</li>
            <li>• Permisos de Instagram y cuentas conectadas</li>
            <li>• Funcionalidad del webhook con pruebas reales</li>
            <li>• Verificación y POST de datos simulados</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstagramAdvancedDiagnostic;
