
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
  Search
} from 'lucide-react';

const InstagramDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log('DEBUG:', message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkConnection = () => {
    addLog('Verificando conexión...');
    const token = localStorage.getItem('hower-instagram-token') || localStorage.getItem('instagram_access_token');
    const user = localStorage.getItem('hower-instagram-user');
    
    addLog(`Token encontrado: ${!!token}`);
    addLog(`Datos de usuario encontrados: ${!!user}`);
    
    let userData = null;
    try {
      if (user) {
        userData = JSON.parse(user);
        addLog(`Datos parseados exitosamente: ${JSON.stringify(userData, null, 2)}`);
      }
    } catch (error) {
      addLog(`Error parseando datos de usuario: ${error.message}`);
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
    addLog('Verificando acceso a base de datos...');
    try {
      const { data, error, count } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false });

      if (error) {
        addLog(`Error de base de datos: ${error.message}`);
      } else {
        addLog(`Base de datos accesible. Mensajes encontrados: ${count}`);
        addLog(`Datos recientes: ${JSON.stringify(data, null, 2)}`);
      }

      return {
        accessible: !error,
        error: error?.message,
        messageCount: count || 0,
        recentMessages: data || []
      };
    } catch (error) {
      addLog(`Excepción en checkDatabase: ${error.message}`);
      return {
        accessible: false,
        error: error.message,
        messageCount: 0,
        recentMessages: []
      };
    }
  };

  const testWebhook = async () => {
    addLog('Iniciando test de webhook...');
    setTestingWebhook(true);
    try {
      // Intentar hacer una prueba simple a nuestro edge function
      const response = await fetch('https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      addLog(`Respuesta del webhook: ${response.status} ${response.statusText}`);
      
      return {
        webhookResponse: response.status,
        webhookWorking: response.ok || response.status === 403, // 403 es esperado sin verificación
        webhookStatus: `${response.status} ${response.statusText}`
      };
    } catch (error) {
      addLog(`Error en test de webhook: ${error.message}`);
      return {
        webhookResponse: 'Error',
        webhookWorking: false,
        webhookError: error.message
      };
    } finally {
      setTestingWebhook(false);
    }
  };

  const runDiagnostic = async () => {
    addLog('=== INICIANDO DIAGNÓSTICO COMPLETO ===');
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('Paso 1: Verificando conexión local...');
      const connectionInfo = checkConnection();
      
      addLog('Paso 2: Verificando base de datos...');
      const databaseInfo = await checkDatabase();
      
      addLog('Paso 3: Probando webhook...');
      const webhookInfo = await testWebhook();
      
      const finalDebugInfo = {
        connection: connectionInfo,
        database: databaseInfo,
        webhook: webhookInfo,
        timestamp: new Date().toISOString()
      };
      
      addLog(`Diagnóstico completado: ${JSON.stringify(finalDebugInfo, null, 2)}`);
      setDebugInfo(finalDebugInfo);
      
    } catch (error) {
      addLog(`Error en diagnóstico: ${error.message}`);
      toast({
        title: "Error en diagnóstico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    addLog('Enviando mensaje de prueba...');
    try {
      const { data, error } = await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `test_${Date.now()}`,
          sender_id: 'test_user_debug',
          recipient_id: 'me',
          message_text: `Mensaje de prueba - ${new Date().toLocaleString()}`,
          message_type: 'received',
          timestamp: new Date().toISOString(),
          raw_data: { test: true, source: 'debug_panel' }
        });

      if (error) {
        addLog(`Error insertando mensaje: ${error.message}`);
        toast({
          title: "Error insertando mensaje",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLog('Mensaje de prueba insertado exitosamente');
        toast({
          title: "Mensaje de prueba creado",
          description: "Se insertó un mensaje de prueba en la base de datos"
        });
        runDiagnostic();
      }
    } catch (error) {
      addLog(`Excepción enviando mensaje: ${error.message}`);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    addLog('Componente montado, ejecutando diagnóstico inicial...');
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
          <h3 className="text-xl font-semibold text-gray-800">Diagnóstico Instagram</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedDebug(!showAdvancedDebug)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            {showAdvancedDebug ? 'Ocultar' : 'Logs'}
          </button>
          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Logs de depuración */}
      {showAdvancedDebug && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-orange-800">Logs de Depuración</h4>
          </div>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-400">No hay logs aún...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
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

      {/* Acciones de prueba */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Acciones de Prueba</h4>
        <div className="flex gap-2">
          <button
            onClick={sendTestMessage}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Crear mensaje de prueba
          </button>
        </div>
      </div>

      {/* Estado actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Estado del Diagnóstico</h4>
        <div className="text-sm text-blue-700">
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Ejecutando diagnóstico...
            </div>
          ) : debugInfo.timestamp ? (
            <div>
              Último diagnóstico: {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          ) : (
            <div>No se ha ejecutado el diagnóstico aún</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramDebug;
