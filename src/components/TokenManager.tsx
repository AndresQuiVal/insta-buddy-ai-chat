
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const TokenManager: React.FC = () => {
  const [token, setToken] = useState('EAAp0ic0E6bEBO2mZCzP4ddQsX5OeCx9gKdkO9gIPZBsZCCQlcYELpVzTAToBc3wog6CYL11AZB4BjHbpQvbE7S9G5r1QplWhLBqgRknuzvmpH34blv8l3GR7sMD1cwhx06mkAsxE4iDYJ4UZBSLf8y2qank7kJBGQlwgYZBxA0p3XwCi5Pw8lnuKp2Pz40oKBbZC8ymSPwiUxraoxk1tZB52ZBuZAY2DmyMalMgn16');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  // Auto-validar el token al cargar el componente
  useEffect(() => {
    if (token) {
      validateTokenDetailed(token);
    }
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
        return false;
      }

      // Test 2: Verificar permisos
      const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${tokenToTest}`);
      const permissionsData = await permissionsResponse.json();
      
      console.log('🔑 Permisos:', permissionsData);

      // Test 3: Verificar cuentas de Instagram Business
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${tokenToTest}`);
      const accountsData = await accountsResponse.json();
      
      console.log('📱 Cuentas Instagram:', accountsData);

      const hasInstagramBusiness = accountsData.data && accountsData.data.some(acc => acc.instagram_business_account);

      setValidationResult({
        isValid: true,
        user: basicData,
        permissions: permissionsData.data || [],
        instagramAccounts: accountsData.data || [],
        hasInstagramBusiness: hasInstagramBusiness
      });

      return true;
    } catch (error) {
      console.error('❌ Error validando token:', error);
      setValidationResult({
        isValid: false,
        error: error.message,
        details: { error: 'Network error' }
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
      console.log('🚀 Iniciando actualización de token...');
      
      // Primero validar el token si no lo hemos hecho
      if (!validationResult || !validationResult.isValid) {
        const isValid = await validateTokenDetailed(token);
        
        if (!isValid) {
          toast({
            title: "Token inválido",
            description: validationResult?.error || "El token no es válido",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('✅ Token validado, actualizando en servidor...');

      // Actualizar en el servidor usando la edge function
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

      // Guardar localmente también
      localStorage.setItem('instagram_access_token', token);
      localStorage.setItem('hower-instagram-token', token);

      toast({
        title: "¡Token actualizado exitosamente!",
        description: `Usuario: ${validationResult.user.name || validationResult.user.id}`,
      });
      
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

  const testCurrentToken = async () => {
    const currentToken = localStorage.getItem('instagram_access_token') || localStorage.getItem('hower-instagram-token');
    if (currentToken) {
      console.log('🧪 Probando token actual...');
      await validateTokenDetailed(currentToken);
    } else {
      toast({
        title: "No hay token",
        description: "No se encontró ningún token guardado",
        variant: "destructive"
      });
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
              placeholder="Token cargado automáticamente..."
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

        {/* Validar token diferente */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">🧪 Validar Token</h4>
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
              'Validar Token Actual'
            )}
          </Button>
        </div>

        {/* Resultado de validación */}
        {validationResult && (
          <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className="font-medium mb-2">
              {validationResult.isValid ? '✅ Token Válido' : '❌ Token Inválido'}
            </h4>
            
            {validationResult.isValid ? (
              <div className="space-y-2 text-sm">
                <div><strong>Usuario:</strong> {validationResult.user.name} (ID: {validationResult.user.id})</div>
                <div><strong>Permisos:</strong> {validationResult.permissions.length} encontrados</div>
                <div><strong>Instagram Business:</strong> {validationResult.hasInstagramBusiness ? '✅ Conectado' : '❌ No conectado'}</div>
                
                {!validationResult.hasInstagramBusiness && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                    ⚠️ No tienes una cuenta de Instagram Business conectada. Esto es necesario para recibir mensajes.
                  </div>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Ver permisos detallados</summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    {validationResult.permissions.map((perm, idx) => (
                      <div key={idx}>{perm.permission}: {perm.status}</div>
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
          <p>• Haz clic en "Actualizar Token" para guardarlo</p>
          <p>• Asegúrate de tener permisos: pages_messaging, instagram_basic</p>
          <p>• Necesitas una cuenta de Instagram Business conectada</p>
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
