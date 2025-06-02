
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Instagram, User, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstagramAccountDiagnostic = () => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentConfig = () => {
    const token = localStorage.getItem('hower-instagram-token') || 
                  localStorage.getItem('instagram_access_token');
    const userData = localStorage.getItem('hower-instagram-user');
    const pageId = localStorage.getItem('hower-page-id');

    return {
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : null,
      userData: userData ? JSON.parse(userData) : null,
      pageId: pageId,
      timestamp: localStorage.getItem('hower-auth-timestamp')
    };
  };

  const testCurrentToken = async () => {
    setIsLoading(true);
    try {
      const config = getCurrentConfig();
      
      if (!config.hasToken) {
        toast({
          title: "No hay token",
          description: "No se encontró ningún token guardado",
          variant: "destructive"
        });
        return;
      }

      const token = localStorage.getItem('hower-instagram-token') || 
                    localStorage.getItem('instagram_access_token');

      console.log('🧪 Probando token actual:', token?.substring(0, 20) + '...');

      // Test 1: Verificar token básico
      const basicResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
      const basicData = await basicResponse.json();
      
      let result = {
        tokenValid: basicResponse.ok,
        user: basicData,
        error: basicData.error || null,
        permissions: [],
        instagramAccounts: [],
        hasInstagramBusiness: false
      };

      if (basicResponse.ok) {
        // Test 2: Verificar permisos
        try {
          const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`);
          const permissionsData = await permissionsResponse.json();
          result.permissions = permissionsData.data || [];
        } catch (error) {
          console.error('Error obteniendo permisos:', error);
        }

        // Test 3: Verificar cuentas de Instagram
        try {
          const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`);
          const accountsData = await accountsResponse.json();
          result.instagramAccounts = accountsData.data || [];
          result.hasInstagramBusiness = result.instagramAccounts.some(acc => acc.instagram_business_account);
        } catch (error) {
          console.error('Error obteniendo cuentas:', error);
        }
      }

      setDiagnosticData(result);

      if (result.tokenValid) {
        toast({
          title: "Token válido",
          description: `Conectado como: ${result.user.name}`,
        });
      } else {
        toast({
          title: "Token inválido",
          description: result.error?.message || "El token no es válido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error en diagnóstico:', error);
      toast({
        title: "Error de diagnóstico",
        description: "No se pudo verificar la configuración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const config = getCurrentConfig();
    if (config.hasToken) {
      testCurrentToken();
    }
  }, []);

  const config = getCurrentConfig();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Instagram className="w-6 h-6 text-pink-500" />
        <h3 className="text-lg font-semibold">Diagnóstico de Cuenta Instagram</h3>
      </div>

      <div className="space-y-4">
        {/* Configuración actual */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">📋 Configuración Actual</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Token guardado:</span>
              <span className={config.hasToken ? 'text-green-600' : 'text-red-600'}>
                {config.hasToken ? '✅ Sí' : '❌ No'}
              </span>
            </div>
            {config.hasToken && (
              <div className="flex justify-between">
                <span>Token:</span>
                <span className="text-xs font-mono">{config.token}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>PAGE-ID:</span>
              <span className={config.pageId ? 'text-green-600' : 'text-red-600'}>
                {config.pageId || 'No configurado'}
              </span>
            </div>
            {config.userData && (
              <div className="mt-2 p-2 bg-white rounded">
                <div className="text-xs">
                  <div><strong>Facebook:</strong> {config.userData.facebook?.name} (ID: {config.userData.facebook?.id})</div>
                  {config.userData.instagram && (
                    <div><strong>Instagram:</strong> @{config.userData.instagram.username} (ID: {config.userData.instagram.id})</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultado del diagnóstico */}
        {diagnosticData && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">🔍 Resultado del Diagnóstico</h4>
            
            {diagnosticData.tokenValid ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Token válido para: {diagnosticData.user.name}</span>
                </div>
                
                <div className="text-sm">
                  <div><strong>Permisos:</strong> {diagnosticData.permissions.length} encontrados</div>
                  <div className="text-xs ml-2">
                    {diagnosticData.permissions.map((perm: any, idx: number) => (
                      <span key={idx} className={`mr-2 px-1 rounded ${perm.status === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {perm.permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm">
                  <div><strong>Páginas de Facebook:</strong> {diagnosticData.instagramAccounts.length}</div>
                  {diagnosticData.instagramAccounts.map((page: any, idx: number) => (
                    <div key={idx} className="text-xs ml-2 p-1 bg-white rounded">
                      📄 {page.name} (ID: {page.id})
                      {page.instagram_business_account ? (
                        <span className="ml-2 text-green-600">✅ Instagram Business conectado</span>
                      ) : (
                        <span className="ml-2 text-red-600">❌ Sin Instagram Business</span>
                      )}
                    </div>
                  ))}
                </div>

                {!diagnosticData.hasInstagramBusiness && (
                  <div className="p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                    ⚠️ No tienes ninguna página con Instagram Business conectado. Esto es necesario para recibir y enviar mensajes.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Token inválido: {diagnosticData.error?.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button 
            onClick={testCurrentToken}
            disabled={!config.hasToken || isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Verificando...' : 'Verificar Token Actual'}
          </Button>
          
          <Button
            onClick={() => {
              console.log('📋 Configuración completa:', {
                localStorage: {
                  'hower-instagram-token': localStorage.getItem('hower-instagram-token')?.substring(0, 20) + '...',
                  'instagram_access_token': localStorage.getItem('instagram_access_token')?.substring(0, 20) + '...',
                  'hower-instagram-user': localStorage.getItem('hower-instagram-user'),
                  'hower-page-id': localStorage.getItem('hower-page-id')
                },
                diagnosticData
              });
              toast({
                title: "Información exportada",
                description: "Revisa la consola del navegador para ver todos los detalles"
              });
            }}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-1" />
            Ver Detalles Completos
          </Button>
        </div>

        {/* Instrucciones para el problema actual */}
        <div className="p-4 bg-amber-50 rounded-lg">
          <h4 className="font-medium mb-2">💡 Para el error "400 Session Invalid" en Facebook Developers</h4>
          <div className="text-sm space-y-1">
            <p>1. <strong>Verifica que tu nueva cuenta de Instagram esté añadida como "Probador de Instagram"</strong></p>
            <p>2. Ve a tu app en Facebook Developers → Roles → Probadores de Instagram</p>
            <p>3. Añade tu nueva cuenta de Instagram con permisos de prueba</p>
            <p>4. Acepta la invitación desde la cuenta de Instagram</p>
            <p>5. Intenta generar el token nuevamente</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InstagramAccountDiagnostic;
