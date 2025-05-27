
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Database, Webhook, MessageCircle } from 'lucide-react';
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

      // 4. Verificar token actual
      console.log('🔍 4. Verificando token actual...');
      const currentToken = localStorage.getItem('instagram_access_token') || localStorage.getItem('hower-instagram-token');
      if (currentToken) {
        try {
          const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${currentToken}`);
          const tokenData = await tokenResponse.json();
          
          results.token = {
            status: tokenData.error ? 'error' : 'success',
            message: tokenData.error ? `Token error: ${tokenData.error.message}` : `Token válido - Usuario: ${tokenData.name}`,
            hasToken: true
          };
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
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Diagnóstico Completo del Sistema</h3>
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

            {/* Token */}
            {diagnosticResults.token && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnosticResults.token.status} />
                    <span className="font-medium">Token de Instagram</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{diagnosticResults.token.message}</p>
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
          <h4 className="font-medium text-yellow-800 mb-2">📋 Qué hace este diagnóstico:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Verifica la conexión a la base de datos</li>
            <li>• Cuenta los mensajes existentes en la DB</li>
            <li>• Prueba el webhook vía Supabase Functions</li>
            <li>• Valida tu token de Instagram</li>
            <li>• Inserta un mensaje de prueba directamente</li>
            <li>• Envía un payload simulado al webhook</li>
            <li>• Verifica que los mensajes se procesen correctamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstagramDiagnostic;
