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

  const checkConnection = () => {
    const token = localStorage.getItem('hower-instagram-token');
    const user = localStorage.getItem('hower-instagram-user');
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      userData: user ? JSON.parse(user) : null
    };
  };

  const checkDatabase = async () => {
    try {
      const { data, error, count } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false });

      return {
        accessible: !error,
        error: error?.message,
        messageCount: count || 0,
        recentMessages: data || []
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
        messageCount: 0,
        recentMessages: []
      };
    }
  };

  const testWebhook = async () => {
    setTestingWebhook(true);
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      return {
        webhookResponse: response.status,
        webhookWorking: response.ok
      };
    } catch (error) {
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
    setLoading(true);
    
    try {
      const connectionInfo = checkConnection();
      const databaseInfo = await checkDatabase();
      const webhookInfo = await testWebhook();
      
      setDebugInfo({
        connection: connectionInfo,
        database: databaseInfo,
        webhook: webhookInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
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
    try {
      const { data, error } = await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `test_${Date.now()}`,
          sender_id: 'test_user_123',
          recipient_id: 'me',
          message_text: 'Mensaje de prueba desde debug',
          message_type: 'received',
          timestamp: new Date().toISOString(),
          raw_data: { test: true }
        });

      if (error) {
        toast({
          title: "Error insertando mensaje",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Mensaje de prueba creado",
          description: "Se insertó un mensaje de prueba en la base de datos"
        });
        runDiagnostic();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    return status ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const connectionData = debugInfo.connection?.userData;
  const advancedDebugData = connectionData?.debug_info?.extended_debug;

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
            {showAdvancedDebug ? 'Ocultar' : 'Debug Avanzado'}
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
          <div className="flex justify-between">
            <span className="text-gray-600">Datos de usuario:</span>
            <span className={debugInfo.connection?.hasUser ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.connection?.hasUser ? '✓ Sí' : '✗ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Instagram conectado:</span>
            <span className={connectionData?.instagram ? 'text-green-600' : 'text-red-600'}>
              {connectionData?.instagram ? '✓ Sí' : '✗ No - ESTE ES EL PROBLEMA'}
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

      {/* Debug Avanzado */}
      {showAdvancedDebug && advancedDebugData && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-orange-800">Diagnóstico Avanzado</h4>
          </div>
          
          <div className="space-y-3 text-sm">
            {/* Permisos */}
            {advancedDebugData.permissions_granted && (
              <div>
                <strong className="text-orange-800">Permisos otorgados:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {advancedDebugData.permissions_granted.map((perm: string, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cuentas encontradas */}
            {advancedDebugData.user_accounts_found && (
              <div>
                <strong className="text-orange-800">Páginas de Facebook encontradas: {advancedDebugData.user_accounts_found.length}</strong>
                {advancedDebugData.user_accounts_found.map((account: any, idx: number) => (
                  <div key={idx} className="mt-1 p-2 bg-white rounded border text-xs">
                    <div><strong>Página:</strong> {account.name} (ID: {account.id})</div>
                    <div className={account.instagram_business_account ? 'text-green-700' : 'text-red-700'}>
                      <strong>Instagram Business:</strong> {account.instagram_business_account ? '✓ Conectado' : '✗ No conectado'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Intentos de búsqueda */}
            {advancedDebugData.instagram_search_attempts && (
              <div>
                <strong className="text-orange-800">Intentos de búsqueda de Instagram:</strong>
                {advancedDebugData.instagram_search_attempts.map((attempt: any, idx: number) => (
                  <div key={idx} className="mt-1 p-2 bg-white rounded border text-xs">
                    {attempt.page_name && <div><strong>Página:</strong> {attempt.page_name}</div>}
                    {attempt.has_instagram_business_account !== undefined && (
                      <div className={attempt.has_instagram_business_account ? 'text-green-700' : 'text-red-700'}>
                        <strong>Tiene Instagram:</strong> {attempt.has_instagram_business_account ? 'Sí' : 'No'}
                      </div>
                    )}
                    {attempt.error && (
                      <div className="text-red-700"><strong>Error:</strong> {attempt.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3 p-2 bg-white rounded border">
              <strong className="text-orange-800">Resultado final:</strong>
              <span className={advancedDebugData.final_result === 'success' ? 'text-green-700 ml-2' : 'text-red-700 ml-2'}>
                {advancedDebugData.final_result === 'success' ? 'Instagram encontrado ✓' : 'Instagram NO encontrado ✗'}
              </span>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default InstagramDebug;
