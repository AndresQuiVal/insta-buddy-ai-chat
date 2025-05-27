
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Database, Webhook, MessageCircle, Instagram, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstagramDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [tokenDebugInfo, setTokenDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults({});
    setTokenDebugInfo(null);
    
    const results: any = {};

    try {
      // 1. Verificar conexión a base de datos
      console.log('🔍 1. Verificando conexión a base de datos...');
      try {
        const { data, error, count } = await supabase
          .from('instagram_messages')
          .select('*', { count: 'exact', head: true });
        
        results.database = {
          status: error ? 'error' : 'success',
          message: error ? `Error: ${error.message}` : `Conectado - ${count || 0} mensajes en total`,
          count: count || 0
        };
      } catch (err: any) {
        results.database = {
          status: 'error',
          message: `Error de conexión: ${err.message}`,
          count: 0
        };
      }

      // 2. Verificar mensajes en la base de datos
      console.log('🔍 2. Verificando mensajes existentes...');
      try {
        const { data: messages, error } = await supabase
          .from('instagram_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        results.messages = {
          status: error ? 'error' : 'success',
          message: error ? `Error: ${error.message}` : `${messages?.length || 0} mensajes encontrados`,
          data: messages || [],
          details: messages?.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            message_text: msg.message_text?.substring(0, 50) + '...',
            timestamp: msg.timestamp,
            type: msg.message_type
          })) || []
        };
      } catch (err: any) {
        results.messages = {
          status: 'error',
          message: `Error obteniendo mensajes: ${err.message}`,
          data: [],
          details: []
        };
      }

      // 3. Verificar webhook usando Supabase Functions directamente
      console.log('🔍 3. Probando webhook a través de Supabase...');
      try {
        const { data: webhookData, error: webhookError } = await supabase.functions.invoke('instagram-webhook', {
          method: 'GET',
          body: null,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        results.webhook_supabase = {
          status: webhookError ? 'error' : 'success',
          message: webhookError ? `Error: ${webhookError.message}` : 'Webhook accesible vía Supabase Functions',
          data: webhookData
        };
      } catch (err: any) {
        results.webhook_supabase = {
          status: 'error',
          message: `Error llamando webhook: ${err.message}`,
          data: null
        };
      }

      // 4. Verificar token actual y conexión con Instagram (MEJORADO)
      console.log('🔍 4. Verificando token actual y conexión Instagram...');
      const currentToken = localStorage.getItem('instagram_access_token') || localStorage.getItem('hower-instagram-token');
      
      if (currentToken) {
        try {
          // Primer paso: Verificar validez básica del token con Facebook
          console.log('4.1 Verificando token con Facebook Graph API...');
          const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${currentToken}`);
          const tokenData = await tokenResponse.json();
          
          if (tokenData.error) {
            results.token = {
              status: 'error',
              message: `Token inválido: ${tokenData.error.message}`,
              hasToken: true
            };
          } else {
            // Token básico válido, ahora verificar cuentas Instagram
            console.log('4.2 Buscando cuentas de Instagram asociadas...');
            
            // Obtener cuentas/páginas a las que tiene acceso
            const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/${tokenData.id}/accounts?fields=id,name,instagram_business_account&access_token=${currentToken}`);
            const accountsData = await accountsResponse.json();
            
            const pagesWithInstagram = accountsData.data?.filter(page => page.instagram_business_account) || [];
            
            // Información detallada para diagnóstico
            const debugInfo = {
              facebook_id: tokenData.id,
              facebook_name: tokenData.name,
              token_length: currentToken.length,
              total_pages: accountsData.data?.length || 0,
              pages_with_instagram: pagesWithInstagram.length,
              pages_details: accountsData.data?.map(page => ({
                id: page.id,
                name: page.name,
                has_instagram: !!page.instagram_business_account,
                instagram_id: page.instagram_business_account?.id || null
              })) || []
            };
            
            // Guardar detalles para diagnóstico avanzado
            setTokenDebugInfo(debugInfo);
            
            if (pagesWithInstagram.length === 0) {
              results.token = {
                status: 'warning',
                message: `Token válido pero Instagram no encontrado: La cuenta de Instagram Business no está correctamente vinculada`,
                hasToken: true,
                userData: tokenData
              };
            } else {
              // Verificar información de Instagram
              try {
                const instagramId = pagesWithInstagram[0].instagram_business_account.id;
                const instaResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramId}?fields=id,username,profile_picture_url&access_token=${currentToken}`);
                const instaData = await instaResponse.json();
                
                if (instaData.error) {
                  results.token = {
                    status: 'warning',
                    message: `Token válido pero error Instagram: ${instaData.error.message}`,
                    hasToken: true,
                    userData: tokenData
                  };
                  debugInfo.instagram_error = instaData.error;
                } else {
                  results.token = {
                    status: 'success',
                    message: `Token válido - Usuario: ${tokenData.name} / Instagram: @${instaData.username || instagramId}`,
                    hasToken: true,
                    userData: tokenData,
                    instagram: instaData
                  };
                  debugInfo.instagram_data = instaData;
                }
                
                // Actualizar la información de debug
                setTokenDebugInfo(debugInfo);
              } catch (err: any) {
                results.token = {
                  status: 'warning',
                  message: `Token válido pero error obteniendo datos Instagram: ${err.message}`,
                  hasToken: true,
                  userData: tokenData
                };
                debugInfo.instagram_error = err.message;
                setTokenDebugInfo(debugInfo);
              }
            }
          }
        } catch (err: any) {
          results.token = {
            status: 'error',
            message: `Error verificando token: ${err.message}`,
            hasToken: true,
            error: err.message
          };
        }
      } else {
        results.token = {
          status: 'error',
          message: 'No hay token guardado',
          hasToken: false
        };
      }

      // 5. Enviar mensaje de prueba directamente a Supabase
      console.log('🔍 5. Insertando mensaje de prueba directamente...');
      try {
        const testMessage = {
          instagram_message_id: `diagnostic_test_${Date.now()}`,
          sender_id: 'diagnostic_user',
          recipient_id: 'me',
          message_text: `🧪 MENSAJE DE PRUEBA DIAGNÓSTICO - ${new Date().toLocaleString()}`,
          timestamp: new Date().toISOString(),
          message_type: 'received',
          raw_data: { test: true, source: 'diagnostic' }
        };

        const { data: insertData, error: insertError } = await supabase
          .from('instagram_messages')
          .insert(testMessage)
          .select();

        results.directInsert = {
          status: insertError ? 'error' : 'success',
          message: insertError ? `Error insertando: ${insertError.message}` : 'Mensaje de prueba insertado correctamente',
          data: insertData
        };
      } catch (err: any) {
        results.directInsert = {
          status: 'error',
          message: `Error en inserción directa: ${err.message}`,
          data: null
        };
      }

      // 6. Probar webhook con payload de Instagram simulado
      console.log('🔍 6. Enviando payload simulado al webhook...');
      try {
        const testPayload = {
          object: 'instagram',
          entry: [{
            id: 'test_page_id',
            time: Date.now(),
            messaging: [{
              sender: { id: 'test_user_diagnostic' },
              recipient: { id: 'test_page_id' },
              timestamp: Date.now(),
              message: {
                mid: `test_diagnostic_${Date.now()}`,
                text: '🧪 MENSAJE DE PRUEBA DESDE DIAGNÓSTICO'
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
          response: webhookResponse
        };

        // Esperar un momento y verificar si el mensaje llegó a la base de datos
        setTimeout(async () => {
          const { data: testMessages } = await supabase
            .from('instagram_messages')
            .select('*')
            .ilike('message_text', '%MENSAJE DE PRUEBA DESDE DIAGNÓSTICO%')
            .order('created_at', { ascending: false })
            .limit(1);

          if (testMessages && testMessages.length > 0) {
            console.log('✅ Mensaje de prueba encontrado en la base de datos!');
            toast({
              title: "¡Diagnóstico exitoso!",
              description: "El mensaje de prueba llegó correctamente a la base de datos",
            });
          } else {
            console.log('❌ Mensaje de prueba NO encontrado en la base de datos');
            toast({
              title: "Problema detectado",
              description: "El webhook no está guardando mensajes en la base de datos",
              variant: "destructive"
            });
          }
        }, 3000);

      } catch (err: any) {
        results.webhookTest = {
          status: 'error',
          message: `Error enviando mensaje de prueba: ${err.message}`,
          response: null
        };
      }

      // 7. NUEVO: Verificar configuración de token en Supabase
      console.log('🔍 7. Verificando token en servidor...');
      try {
        const { data: tokenServerData, error: tokenServerError } = await supabase.functions.invoke('update-instagram-token', {
          body: { access_token: currentToken }
        });

        results.serverToken = {
          status: tokenServerError ? 'error' : 'success',
          message: tokenServerError ? `Error: ${tokenServerError.message}` : 'Verificación de token en servidor exitosa',
          data: tokenServerData,
          hasInstagramBusiness: tokenServerData?.hasInstagramBusiness
        };
      } catch (err: any) {
        results.serverToken = {
          status: 'error',
          message: `Error verificando token en servidor: ${err.message}`,
          data: null
        };
      }

      setDiagnosticResults(results);
      console.log('🎯 Resultados completos del diagnóstico:', results);

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
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
  };

  // Utilidad para comprobar la salud general del sistema
  const getSystemHealth = () => {
    if (!diagnosticResults || Object.keys(diagnosticResults).length === 0) return null;
    
    // Verificar componentes críticos
    const databaseOk = diagnosticResults.database?.status === 'success';
    const webhookOk = diagnosticResults.webhook_supabase?.status === 'success';
    const hasValidToken = diagnosticResults.token?.status === 'success';
    const hasInstagram = diagnosticResults.token?.instagram || 
                         diagnosticResults.serverToken?.hasInstagramBusiness;
    
    if (!databaseOk) return { status: 'error', message: 'Error de conexión a la base de datos' };
    if (!webhookOk) return { status: 'error', message: 'El webhook no está accesible' };
    if (!diagnosticResults.token?.hasToken) return { status: 'error', message: 'No hay token de Instagram configurado' };
    if (!hasValidToken) return { status: 'error', message: 'El token de Instagram no es válido' };
    if (!hasInstagram) return { status: 'warning', message: 'No se encontró cuenta de Instagram Business conectada' };
    
    // Si todos los componentes críticos están bien
    return { status: 'success', message: 'Todos los sistemas operativos' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Diagnóstico de Instagram</h3>
        </div>
        
        {systemHealth && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            systemHealth.status === 'success' ? 'bg-green-100 text-green-700' :
            systemHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            <StatusIcon status={systemHealth.status} />
            <span>{systemHealth.message}</span>
          </div>
        )}
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
                </div>
              </div>
            )}

            {/* Token e Instagram */}
            {diagnosticResults.token && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Instagram className="w-5 h-5 text-pink-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.token.status} />
                    <span className="font-medium">Cuenta de Instagram</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.token.message}</p>
                  
                  {tokenDebugInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">
                        Ver detalles de conexión Instagram
                      </summary>
                      <div className="mt-2 text-xs bg-white p-2 rounded border">
                        <div className="space-y-1">
                          <div><strong>Usuario Facebook:</strong> {tokenDebugInfo.facebook_name} (ID: {tokenDebugInfo.facebook_id})</div>
                          <div><strong>Longitud del token:</strong> {tokenDebugInfo.token_length} caracteres</div>
                          <div><strong>Páginas totales:</strong> {tokenDebugInfo.total_pages}</div>
                          <div><strong>Páginas con Instagram:</strong> {tokenDebugInfo.pages_with_instagram}</div>
                          
                          {tokenDebugInfo.pages_details?.length > 0 && (
                            <div className="mt-2">
                              <strong>Detalles de páginas:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                {tokenDebugInfo.pages_details.map((page: any, idx: number) => (
                                  <li key={idx}>
                                    {page.name} - 
                                    {page.has_instagram 
                                      ? <span className="text-green-600">Instagram conectado (ID: {page.instagram_id})</span>
                                      : <span className="text-red-600">Sin Instagram</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {tokenDebugInfo.instagram_data && (
                            <div className="mt-2 p-1 bg-green-50 rounded">
                              <strong>Instagram conectado:</strong> @{tokenDebugInfo.instagram_data.username || 'Sin username'} (ID: {tokenDebugInfo.instagram_data.id})
                            </div>
                          )}
                          
                          {tokenDebugInfo.instagram_error && (
                            <div className="mt-2 p-1 bg-red-50 rounded">
                              <strong>Error Instagram:</strong> {JSON.stringify(tokenDebugInfo.instagram_error)}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Webhook via Supabase */}
            {diagnosticResults.webhook_supabase && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Webhook className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.webhook_supabase.status} />
                    <span className="font-medium">Webhook (vía Supabase)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.webhook_supabase.message}</p>
                </div>
              </div>
            )}

            {/* Verificación servidor */}
            {diagnosticResults.serverToken && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Info className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.serverToken.status} />
                    <span className="font-medium">Verificación en Servidor</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.serverToken.message}</p>
                  {diagnosticResults.serverToken.hasInstagramBusiness !== undefined && (
                    <p className="text-xs mt-1">
                      Instagram Business: 
                      {diagnosticResults.serverToken.hasInstagramBusiness ? 
                        <span className="text-green-600 font-medium"> Conectado ✓</span> : 
                        <span className="text-red-600 font-medium"> No conectado ✗</span>}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mensajes */}
            {diagnosticResults.messages && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.messages.status} />
                    <span className="font-medium">Mensajes Existentes</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.messages.message}</p>
                  {diagnosticResults.messages.details && diagnosticResults.messages.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">Ver últimos mensajes</summary>
                      <div className="mt-1 text-xs bg-white p-2 rounded border">
                        {diagnosticResults.messages.details.map((msg: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-100 pb-1 mb-1 last:border-b-0 last:mb-0">
                            <div><strong>ID:</strong> {msg.id}</div>
                            <div><strong>De:</strong> {msg.sender_id}</div>
                            <div><strong>Texto:</strong> {msg.message_text}</div>
                            <div><strong>Tipo:</strong> {msg.type}</div>
                            <div><strong>Fecha:</strong> {new Date(msg.timestamp).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Inserción directa */}
            {diagnosticResults.directInsert && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Database className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.directInsert.status} />
                    <span className="font-medium">Inserción Directa en DB</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.directInsert.message}</p>
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

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">📋 Pasos para resolver problemas comunes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Si el token es válido pero Instagram no aparece:</strong> Verifica que tu cuenta de Instagram esté configurada como Business y vinculada a una Página de Facebook</li>
            <li>• <strong>Si Facebook reconoce el token pero Instagram no responde:</strong> Revisa los permisos de la app (instagram_basic, instagram_manage_messages)</li>
            <li>• <strong>Si el webhook no recibe mensajes:</strong> Verifica en Facebook Developer que esté configurado correctamente y suscrito a los eventos</li>
            <li>• <strong>Si todo parece bien pero no funcionan los mensajes:</strong> Regenera un nuevo token con todos los permisos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstagramDiagnostic;
