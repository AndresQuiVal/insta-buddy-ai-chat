
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, CheckCircle, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';

const TokenManager: React.FC = () => {
  const [token, setToken] = useState('EAAp0ic0E6bEBO5tVGAmkwZCerz8UFId7xKzg8SomYmchBU0Q4BlQ1S03yYwMCGKzIXVcRTlbWunnrfLHrZBEM28ab1pT2v9dGxXi7qBbJZCc74LE5JaJ0CqgZC5Da0vH6Q3sZAnEy1XuNROV6HZCPIwfZBnZBaVaMbfpZBZBWja9EZBAKKVuvMHvZCmnJ1rZAiN8NOC0pbOxdU9l7ZC8IZBuM9VzjbwcTV7CAZDZD');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  // Auto-validar el nuevo token al cargar el componente
  useEffect(() => {
    console.log('🔄 Nuevo token detectado, validando automáticamente...');
    validateTokenDetailed(token);
  }, []);

  const validateTokenDetailed = async (tokenToTest: string) => {
    setIsValidating(true);
    try {
      console.log('🔍 Validando nuevo token...');
      console.log('Token length:', tokenToTest.length);
      console.log('Token preview:', tokenToTest.substring(0, 20) + '...');

      // Test 1: Verificar token básico
      const basicResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokenToTest}`);
      const basicData = await basicResponse.json();
      
      console.log('📝 Respuesta básica:', basicData);

      if (basicData.error) {
        setValidationResult({
          isValid: false,
          error: basicData.error.message,
          details: basicData
        });
        toast({
          title: "Token inválido",
          description: basicData.error.message,
          variant: "destructive"
        });
        return false;
      }

      // Test 2: Verificar permisos ESPECÍFICOS para Instagram messaging
      const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${tokenToTest}`);
      const permissionsData = await permissionsResponse.json();
      
      console.log('🔑 Permisos:', permissionsData);

      // Permisos CRÍTICOS para Instagram messaging
      const requiredPermissions = [
        'instagram_basic',
        'instagram_manage_messages',
        'pages_messaging',
        'pages_show_list',
        'business_management'
      ];

      const grantedPermissions = permissionsData.data?.filter(p => p.status === 'granted').map(p => p.permission) || [];
      const missingPermissions = requiredPermissions.filter(req => !grantedPermissions.includes(req));

      // Test 3: Verificar cuentas de Instagram Business
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${tokenToTest}`);
      const accountsData = await accountsResponse.json();
      
      console.log('📱 Cuentas Instagram:', accountsData);

      const hasInstagramBusiness = accountsData.data && accountsData.data.some(acc => acc.instagram_business_account);

      // Test 4: NUEVO - Verificar capacidad de enviar mensajes
      let canSendMessages = false;
      let messagingError = null;

      if (hasInstagramBusiness && missingPermissions.length === 0) {
        // Intentar verificar el endpoint de mensajes (sin enviar nada)
        const pageWithInstagram = accountsData.data.find(acc => acc.instagram_business_account);
        if (pageWithInstagram) {
          try {
            const testResponse = await fetch(`https://graph.facebook.com/v19.0/${pageWithInstagram.id}?fields=instagram_business_account&access_token=${tokenToTest}`);
            const testData = await testResponse.json();
            
            if (!testData.error) {
              canSendMessages = true;
            } else {
              messagingError = testData.error.message;
            }
          } catch (error) {
            messagingError = 'Error verificando capacidad de mensajes';
          }
        }
      }

      setValidationResult({
        isValid: true,
        user: basicData,
        permissions: permissionsData.data || [],
        grantedPermissions,
        missingPermissions,
        instagramAccounts: accountsData.data || [],
        hasInstagramBusiness,
        canSendMessages,
        messagingError
      });

      if (missingPermissions.length > 0) {
        toast({
          title: "⚠️ Permisos insuficientes",
          description: `Faltan permisos: ${missingPermissions.join(', ')}`,
          variant: "destructive"
        });
      } else if (!canSendMessages) {
        toast({
          title: "❌ No puede enviar mensajes",
          description: messagingError || "El token no tiene capacidad para enviar mensajes de Instagram",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Token perfecto para messaging",
          description: `Usuario: ${basicData.name}`,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error validando token:', error);
      setValidationResult({
        isValid: false,
        error: error.message,
        details: { error: 'Network error' }
      });
      toast({
        title: "Error de conexión",
        description: "No se pudo verificar el token",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const updateToken = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);

    try {
      console.log('🚀 Actualizando token en servidor...');

      // PASO 1: Validar y actualizar en el servidor usando la edge function
      const { data, error } = await supabase.functions.invoke('update-instagram-token', {
        body: { access_token: token }
      });

      if (error) {
        console.error('❌ Error del servidor:', error);
        toast({
          title: "Error del servidor",
          description: error.message || "No se pudo actualizar el token",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Respuesta del servidor:', data);

      // PASO 2: Guardar localmente también
      localStorage.setItem('instagram_access_token', token);
      localStorage.setItem('hower-instagram-token', token);

      // PASO 3: NUEVO - Actualizar la variable de entorno del servidor
      console.log('🔧 Configurando token en variables de entorno del servidor...');
      
      try {
        // Llamar a una nueva edge function para configurar la variable de entorno
        const { data: envData, error: envError } = await supabase.functions.invoke('set-instagram-env-token', {
          body: { access_token: token }
        });

        if (envError) {
          console.warn('⚠️ No se pudo configurar automáticamente en el servidor:', envError);
          toast({
            title: "⚠️ Acción requerida",
            description: "Token guardado localmente. Configura manualmente INSTAGRAM_ACCESS_TOKEN en Supabase > Settings > Functions",
            variant: "default"
          });
        } else {
          console.log('✅ Token configurado en el servidor:', envData);
          toast({
            title: "¡Token actualizado exitosamente!",
            description: `Token guardado y configurado en el servidor`,
          });
        }
      } catch (envConfigError) {
        console.warn('⚠️ Error configurando variable de entorno:', envConfigError);
        toast({
          title: "⚠️ Configuración manual requerida",
          description: "Ve a Supabase > Settings > Functions y configura INSTAGRAM_ACCESS_TOKEN",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('💥 Error actualizando token:', error);
      toast({
        title: "Error",
        description: "Error inesperado actualizando el token",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Gestión de Token Instagram</h3>
      </div>

      <div className="space-y-4">
        {/* Actualizar token */}
        <div className="space-y-2">
          <Label htmlFor="token" className="text-sm font-medium">
            Nuevo Token de Acceso:
          </Label>
          <div className="relative">
            <Input
              id="token"
              type="password"
              placeholder="Tu nuevo token..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setValidationResult(null);
              }}
              className="pr-10"
            />
            {validationResult && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={updateToken}
          disabled={!token.trim() || isUpdating || isValidating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Actualizando...
            </>
          ) : (
            'Actualizar Token'
          )}
        </Button>

        {/* Validar token */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">🧪 Estado del Token</h4>
          <Button 
            onClick={() => validateTokenDetailed(token)}
            disabled={isValidating || !token}
            variant="outline"
            className="w-full"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              'Volver a Validar'
            )}
          </Button>
        </div>

        {/* Resultado de validación MEJORADO */}
        {validationResult && (
          <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className="font-medium mb-2">
              {validationResult.isValid ? '✅ Token Válido' : '❌ Token Inválido'}
            </h4>
            
            {validationResult.isValid ? (
              <div className="space-y-3 text-sm">
                <div><strong>Usuario:</strong> {validationResult.user.name} (ID: {validationResult.user.id})</div>
                
                {/* NUEVA SECCIÓN: Análisis de permisos para messaging */}
                <div className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <strong>Análisis de Permisos para Instagram Messaging:</strong>
                  </div>
                  
                  {validationResult.missingPermissions.length === 0 ? (
                    <div className="text-green-700">✅ Todos los permisos necesarios están presentes</div>
                  ) : (
                    <div className="text-red-700">
                      <div>❌ <strong>Permisos faltantes:</strong></div>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {validationResult.missingPermissions.map((perm, idx) => (
                          <li key={idx} className="text-xs">{perm}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <strong>Capacidad de envío:</strong> {validationResult.canSendMessages ? 
                      <span className="text-green-700">✅ Puede enviar mensajes</span> : 
                      <span className="text-red-700">❌ NO puede enviar mensajes</span>
                    }
                  </div>
                  
                  {validationResult.messagingError && (
                    <div className="mt-1 text-red-700 text-xs">
                      <strong>Error:</strong> {validationResult.messagingError}
                    </div>
                  )}
                </div>

                <div><strong>Instagram Business:</strong> {validationResult.hasInstagramBusiness ? '✅ Conectado' : '❌ No conectado'}</div>
                
                {!validationResult.hasInstagramBusiness && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                    ⚠️ No tienes una cuenta de Instagram Business conectada. Esto es necesario para recibir mensajes.
                  </div>
                )}

                {validationResult.missingPermissions.length > 0 && (
                  <div className="mt-2 p-3 bg-red-100 rounded text-red-800">
                    <div className="font-medium">🚨 ACCIÓN REQUERIDA:</div>
                    <div className="text-xs mt-1">
                      Ve a <a href="https://developers.facebook.com" target="_blank" className="underline">Facebook Developers</a> →  
                      Tu App → App Review → Solicita estos permisos: {validationResult.missingPermissions.join(', ')}
                    </div>
                  </div>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Ver todos los permisos ({validationResult.permissions.length})</summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-32 overflow-y-auto">
                    {validationResult.permissions.map((perm, idx) => (
                      <div key={idx} className={`px-1 py-0.5 rounded mb-1 ${perm.status === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {perm.permission}: {perm.status}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ) : (
              <div className="text-sm text-red-700">
                <div><strong>Error:</strong> {validationResult.error}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>• Tu nuevo token está cargado automáticamente</p>
          <p>• Se está validando automáticamente al cargar</p>
          <p>• Haz clic en "Actualizar Token" para guardarlo en el servidor</p>
          <p>• <strong>Necesitas permisos específicos de Instagram messaging para enviar autoresponders</strong></p>
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
