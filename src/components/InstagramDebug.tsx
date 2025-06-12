import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  MessageSquare,
  Webhook,
  Info,
  Search,
  AlertCircle,
  Phone
} from 'lucide-react';

const InstagramDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  const addLog = (message: string) => {
    console.log('DEBUG:', message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkConnection = () => {
    addLog('=== VERIFICANDO CONEXIÓN LOCAL ===');
    const token = localStorage.getItem('hower-instagram-token') || localStorage.getItem('instagram_access_token');
    const user = localStorage.getItem('hower-instagram-user');
    
    addLog(`✓ Token encontrado: ${!!token} (${token ? token.length : 0} chars)`);
    addLog(`✓ Usuario encontrado: ${!!user}`);
    
    let userData = null;
    try {
      if (user) {
        userData = JSON.parse(user);
        addLog(`✓ Datos parseados: Facebook=${userData.facebook?.name}, Instagram=${userData.instagram?.username || 'NO CONECTADO'}`);
      }
    } catch (error) {
      addLog(`✗ Error parseando usuario: ${error.message}`);
    }

    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      userData: userData,
      tokenLength: token ? token.length : 0
    };
  };

  const checkDatabase = async () => {
    addLog('=== VERIFICANDO BASE DE DATOS ===');
    try {
      const { data, error, count } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact' })
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) {
        addLog(`✗ Error base de datos: ${error.message}`);
      } else {
        addLog(`✓ Base de datos OK. Total mensajes: ${count}`);
        if (data && data.length > 0) {
          data.forEach((msg, idx) => {
            addLog(`  Mensaje ${idx + 1}: ${msg.message_type} - "${msg.message_text}" (${new Date(msg.created_at).toLocaleString()})`);
          });
        } else {
          addLog(`⚠️ NO HAY MENSAJES EN LA BASE DE DATOS`);
        }
      }

      return {
        accessible: !error,
        error: error?.message,
        messageCount: count || 0,
        recentMessages: data || []
      };
    } catch (error) {
      addLog(`✗ Excepción verificando BD: ${error.message}`);
      return {
        accessible: false,
        error: error.message,
        messageCount: 0,
        recentMessages: []
      };
    }
  };

  const testWebhookAdvanced = async () => {
    addLog('=== PRUEBA AVANZADA DE WEBHOOK ===');
    setTestingWebhook(true);
    
    try {
      const webhookUrl = 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook';
      
      // Prueba 1: GET request (como lo haría Facebook)
      addLog('Prueba 1: GET request de verificación...');
      const getResponse = await fetch(`${webhookUrl}?hub.mode=subscribe&hub.verify_token=hower-instagram-webhook-token&hub.challenge=test123`);
      addLog(`GET Response: ${getResponse.status} - ${await getResponse.text()}`);
      
      // Prueba 2: POST request simulando un mensaje
      addLog('Prueba 2: POST request simulando mensaje de Instagram...');
      const testMessage = {
        object: 'instagram',
        entry: [{
          id: 'test_page_id',
          time: Date.now(),
          messaging: [{
            sender: { id: 'test_sender_456' },
            recipient: { id: 'test_recipient_789' },
            timestamp: Date.now(),
            message: {
              mid: `test_message_${Date.now()}`,
              text: 'Mensaje de prueba desde el debugger'
            }
          }]
        }]
      };
      
      const postResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      
      const postResult = await postResponse.text();
      addLog(`POST Response: ${postResponse.status} - ${postResult}`);
      
      // Verificar si el mensaje llegó a la BD
      addLog('Verificando si el mensaje de prueba llegó a la base de datos...');
      const { data: newMessages } = await supabase
        .from('instagram_messages')
        .select('*')
        .eq('sender_id', 'test_sender_456')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (newMessages && newMessages.length > 0) {
        addLog(`✓ ¡ÉXITO! El mensaje de prueba llegó a la BD: "${newMessages[0].message_text}"`);
      } else {
        addLog(`✗ El mensaje de prueba NO llegó a la base de datos`);
      }
      
      setWebhookTestResult({
        getStatus: getResponse.status,
        postStatus: postResponse.status,
        messageReached: newMessages && newMessages.length > 0,
        testPassed: getResponse.status === 200 && postResponse.status === 200
      });
      
    } catch (error) {
      addLog(`✗ Error en prueba de webhook: ${error.message}`);
      setWebhookTestResult({
        error: error.message,
        testPassed: false
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const testWebhookWithComment = async () => {
    addLog('🧪 === PRUEBA ESPECÍFICA DE COMENTARIO ===');
    try {
      const webhookUrl = 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook';
      
      // Simular exactamente cómo Facebook envía un comentario
      const commentWebhook = {
        object: 'instagram',
        entry: [{
          id: 'test_page_id',
          time: Date.now(),
          changes: [{
            field: 'comments',
            value: {
              from: { id: 'test_commenter_123' },
              media: { id: '18027917109434048' }, // Tu post ID real
              created_time: Math.floor(Date.now() / 1000),
              text: 'pedrin',
              id: `comment_test_${Date.now()}`
            }
          }]
        }]
      };
      
      addLog('📤 Enviando webhook de comentario simulado...');
      addLog('📋 Payload: ' + JSON.stringify(commentWebhook, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentWebhook)
      });
      
      const result = await response.text();
      addLog(`📨 Respuesta: ${response.status} - ${result}`);
      
      if (response.ok) {
        addLog('✅ Webhook respondió correctamente');
        // Verificar si se procesó el comentario
        setTimeout(async () => {
          const { data: logs } = await supabase
            .from('comment_autoresponder_log')
            .select('*')
            .eq('commenter_instagram_id', 'test_commenter_123')
            .order('dm_sent_at', { ascending: false })
            .limit(1);
          
          if (logs && logs.length > 0) {
            addLog('✅ ¡El comentario fue procesado y registrado!');
          } else {
            addLog('❌ El comentario no fue procesado');
          }
        }, 2000);
      } else {
        addLog('❌ Error en webhook');
      }
      
    } catch (error) {
      addLog(`💥 Error: ${error.message}`);
    }
  };

  const checkInstagramTokenPermissions = async () => {
    addLog('=== VERIFICANDO PERMISOS DEL TOKEN ===');
    const token = localStorage.getItem('hower-instagram-token');
    
    if (!token) {
      addLog('✗ No hay token para verificar');
      return null;
    }
    
    try {
      // Verificar permisos del token
      const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`);
      const permissions = await permissionsResponse.json();
      
      addLog(`Permisos del token:`);
      if (permissions.data) {
        permissions.data.forEach(perm => {
          addLog(`  - ${perm.permission}: ${perm.status}`);
        });
      }
      
      // Verificar cuentas de Instagram
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${token}`);
      const accounts = await accountsResponse.json();
      
      addLog(`Cuentas de Instagram conectadas:`);
      if (accounts.data && accounts.data.length > 0) {
        accounts.data.forEach(account => {
          if (account.instagram_business_account) {
            addLog(`  ✓ Cuenta encontrada: ${account.instagram_business_account.id}`);
          }
        });
      } else {
        addLog(`  ✗ NO HAY CUENTAS DE INSTAGRAM BUSINESS CONECTADAS`);
      }
      
      return { permissions, accounts };
    } catch (error) {
      addLog(`✗ Error verificando permisos: ${error.message}`);
      return null;
    }
  };

  const runDiagnostic = async () => {
    addLog('🔍 === DIAGNÓSTICO COMPLETO INICIADO ===');
    setLoading(true);
    setLogs([]);
    setWebhookTestResult(null);
    
    try {
      addLog('Paso 1/4: Verificando conexión local...');
      const connectionInfo = checkConnection();
      
      addLog('Paso 2/4: Verificando base de datos...');
      const databaseInfo = await checkDatabase();
      
      addLog('Paso 3/4: Verificando permisos de Instagram...');
      const permissionsInfo = await checkInstagramTokenPermissions();
      
      addLog('Paso 4/4: Probando webhook avanzado...');
      await testWebhookAdvanced();
      
      const finalDebugInfo = {
        connection: connectionInfo,
        database: databaseInfo,
        permissions: permissionsInfo,
        timestamp: new Date().toISOString()
      };
      
      addLog('🎉 === DIAGNÓSTICO COMPLETADO ===');
      setDebugInfo(finalDebugInfo);
      
    } catch (error) {
      addLog(`💥 Error en diagnóstico: ${error.message}`);
      toast({
        title: "Error en diagnóstico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendRealTestMessage = async () => {
    addLog('📨 Enviando mensaje de prueba REAL...');
    try {
      const testMessage = {
        instagram_message_id: `debug_real_${Date.now()}`,
        sender_id: 'debug_user_real',
        recipient_id: 'me',
        message_text: `🔧 MENSAJE DE PRUEBA REAL - ${new Date().toLocaleString()}`,
        message_type: 'received',
        timestamp: new Date().toISOString(),
        raw_data: { 
          test: true, 
          source: 'debug_panel_real',
          timestamp: Date.now()
        }
      };

      const { data, error } = await supabase
        .from('instagram_messages')
        .insert(testMessage)
        .select();

      if (error) {
        addLog(`✗ Error insertando: ${error.message}`);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLog(`✓ Mensaje insertado exitosamente: ID ${data[0].id}`);
        toast({
          title: "✅ Mensaje de prueba creado",
          description: "Se insertó un mensaje de prueba en la base de datos"
        });
        runDiagnostic();
      }
    } catch (error) {
      addLog(`💥 Excepción: ${error.message}`);
    }
  };

  useEffect(() => {
    addLog('🚀 Componente inicializado');
    runDiagnostic();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    return status ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const connectionData = debugInfo.connection?.userData;

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-semibold text-gray-800">🔍 Diagnóstico Avanzado Instagram</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedDebug(!showAdvancedDebug)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            {showAdvancedDebug ? 'Ocultar Logs' : 'Ver Logs'}
          </button>
          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Diagnóstico Completo
          </button>
        </div>
      </div>

      {/* Test de comentario específico - BOTÓN PRINCIPAL */}
      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
        <h4 className="font-medium text-orange-800 mb-3">🧪 Prueba de Comentario Específica</h4>
        <p className="text-sm text-orange-700 mb-3">
          Esta prueba simula exactamente cómo Facebook envía un webhook cuando alguien comenta "pedrin" en tu post.
        </p>
        <button
          onClick={testWebhookWithComment}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          🧪 Test Comentario "pedrin"
        </button>
      </div>

      {/* Resultado del test de webhook */}
      {webhookTestResult && (
        <div className={`border rounded-lg p-4 ${webhookTestResult.testPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            {webhookTestResult.testPassed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h4 className="font-medium">Resultado Test de Webhook</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div>✓ GET Status: {webhookTestResult.getStatus}</div>
            <div>✓ POST Status: {webhookTestResult.postStatus}</div>
            <div className={webhookTestResult.messageReached ? 'text-green-600' : 'text-red-600'}>
              {webhookTestResult.messageReached ? '✓' : '✗'} Mensaje llegó a BD: {webhookTestResult.messageReached ? 'SÍ' : 'NO'}
            </div>
          </div>
        </div>
      )}

      {/* Logs de depuración */}
      {showAdvancedDebug && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-orange-800">Logs Detallados de Depuración</h4>
          </div>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-400">Ejecutando diagnóstico...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Conexión Instagram */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon status={debugInfo.connection?.hasToken} />
          <h4 className="font-medium text-gray-800">Conexión Instagram</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Token presente:</span>
            <span className={debugInfo.connection?.hasToken ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.connection?.hasToken ? '✓ Sí' : '✗ No'}
            </span>
          </div>
          {debugInfo.connection?.tokenLength && (
            <div className="flex justify-between">
              <span className="text-gray-600">Longitud del token:</span>
              <span className="text-blue-600">{debugInfo.connection.tokenLength} caracteres</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Datos de usuario:</span>
            <span className={debugInfo.connection?.hasUser ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.connection?.hasUser ? '✓ Sí' : '✗ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Instagram conectado:</span>
            <span className={connectionData?.instagram ? 'text-green-600' : 'text-red-600'}>
              {connectionData?.instagram ? '✓ Sí' : '✗ No'}
            </span>
          </div>
          
          {connectionData?.facebook && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
              <strong>Facebook:</strong> {connectionData.facebook.name} (ID: {connectionData.facebook.id})
            </div>
          )}
          
          {connectionData?.instagram ? (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
              <strong>Instagram:</strong> @{connectionData.instagram.username} ({connectionData.instagram.account_type})
            </div>
          ) : (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
              <strong>⚠️ Instagram no encontrado:</strong> La cuenta de Instagram Business no está correctamente vinculada.
            </div>
          )}
        </div>
      </div>

      {/* Base de datos */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon status={debugInfo.database?.accessible} />
          <h4 className="font-medium text-gray-800">Base de Datos</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Acceso a tabla:</span>
            <span className={debugInfo.database?.accessible ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.database?.accessible ? '✓ OK' : '✗ Error'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total mensajes:</span>
            <span className="text-blue-600 font-medium">
              {debugInfo.database?.messageCount || 0}
            </span>
          </div>
          {debugInfo.database?.error && (
            <div className="text-red-600 text-xs mt-2">
              Error: {debugInfo.database.error}
            </div>
          )}
        </div>
      </div>

      {/* Webhook */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon status={debugInfo.webhook?.webhookWorking} />
          <h4 className="font-medium text-gray-800">Webhook</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className={debugInfo.webhook?.webhookWorking ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.webhook?.webhookStatus || 'No probado'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            URL: https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook
          </div>
        </div>
      </div>

      {/* Mensajes recientes */}
      {debugInfo.database?.recentMessages?.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-gray-800">Mensajes Recientes</h4>
          </div>
          <div className="space-y-2">
            {debugInfo.database.recentMessages.map((msg: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-medium">
                    {msg.message_type === 'received' ? '📥' : '📤'} {msg.sender_id}
                  </span>
                  <span className="text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-gray-700">{msg.message_text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones de prueba mejoradas */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">🧪 Acciones de Prueba Avanzadas</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={sendRealTestMessage}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Crear mensaje de prueba
          </button>
          <button
            onClick={testWebhookAdvanced}
            disabled={testingWebhook}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm disabled:opacity-50"
          >
            <Webhook className={`w-4 h-4 ${testingWebhook ? 'animate-spin' : ''}`} />
            Test Webhook Completo
          </button>
          <button
            onClick={testWebhookWithComment}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Test Comentario Específico
          </button>
        </div>
      </div>

      {/* Instrucciones específicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Phone className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">📋 Para probar mensajes REALES</h4>
        </div>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>1.</strong> Desde OTRA cuenta de Instagram, envía un mensaje directo a <strong>@priebashower</strong></p>
          <p><strong>2.</strong> El mensaje debería aparecer aquí automáticamente</p>
          <p><strong>3.</strong> Si no aparece, verifica que el webhook esté configurado correctamente en Facebook Developers</p>
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
            <strong>URL del Webhook:</strong> https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook<br/>
            <strong>Token:</strong> hower-instagram-webhook-token
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📊 Estado del Sistema</h4>
        <div className="text-sm text-blue-700">
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Ejecutando diagnóstico completo...
            </div>
          ) : debugInfo.timestamp ? (
            <div>
              ✅ Último diagnóstico: {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          ) : (
            <div>⏳ Preparando diagnóstico...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramDebug;
