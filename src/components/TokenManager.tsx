
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
      console.log('🔍 Validando Page Access Token...');
      console.log('Token length:', tokenToTest.length);
      console.log('Token preview:', tokenToTest.substring(0, 20) + '...');

      // Test 1: Verificar información de la página (no user info)
      const pageResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokenToTest}`);
      const pageData = await pageResponse.json();
      
      console.log('📝 Respuesta de página:', pageData);

      if (pageData.error) {
        setValidationResult({
          isValid: false,
          error: pageData.error.message,
          details: pageData
        });
        return false;
      }

      // Test 2: Verificar si la página tiene Instagram Business Account conectado
      let instagramBusinessInfo = null;
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${pageData.id}?fields=instagram_business_account&access_token=${tokenToTest}`);
        const igData = await igResponse.json();
        
        console.log('📱 Instagram Business info:', igData);
        
        if (igData.instagram_business_account) {
          // Obtener detalles de la cuenta de Instagram
          const igAccountResponse = await fetch(`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=id,username,account_type,media_count&access_token=${tokenToTest}`);
          const igAccountData = await igAccountResponse.json();
          
          console.log('📊 Detalles de Instagram Business:', igAccountData);
          instagramBusinessInfo = igAccountData;
        }
      } catch (igErr) {
        console.warn('⚠️ Error obteniendo info de Instagram:', igErr);
      }

      // Test 3: Verificar permisos específicos del token (usando endpoint correcto para Page Token)
      let tokenInfo = null;
      try {
        const tokenInfoResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=access_token&access_token=${tokenToTest}`);
        const tokenInfoData = await tokenInfoResponse.json();
        console.log('🔑 Info del token:', tokenInfoData);
        tokenInfo = tokenInfoData;
      } catch (tokenErr) {
        console.warn('⚠️ Error obteniendo info del token:', tokenErr);
      }

      setValidationResult({
        isValid: true,
        page: pageData,
        instagramBusiness: instagramBusinessInfo,
        hasInstagramBusiness: !!instagramBusinessInfo,
        tokenInfo: tokenInfo
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
        description: `Página: ${validationResult.page.name || validationResult.page.id}`,
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
            Page Access Token:
          </Label>
          <div className="relative">
            <Input
              id="token"
              type="password"
              placeholder="Pega tu Page Access Token aquí..."
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
              {validationResult.isValid ? '✅ Page Access Token Válido' : '❌ Token Inválido'}
            </h4>
            
            {validationResult.isValid ? (
              <div className="space-y-2 text-sm">
                <div><strong>Página:</strong> {validationResult.page.name} (ID: {validationResult.page.id})</div>
                <div><strong>Instagram Business:</strong> {validationResult.hasInstagramBusiness ? '✅ Conectado' : '❌ No conectado'}</div>
                
                {validationResult.instagramBusiness && (
                  <div className="p-2 bg-green-100 rounded text-green-800">
                    <div><strong>@{validationResult.instagramBusiness.username}</strong></div>
                    <div>Tipo: {validationResult.instagramBusiness.account_type}</div>
                    <div>Posts: {validationResult.instagramBusiness.media_count || 0}</div>
                  </div>
                )}

                {!validationResult.hasInstagramBusiness && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                    ⚠️ Esta página no tiene una cuenta de Instagram Business conectada. Conéctala para recibir mensajes.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-700">
                <div><strong>Error:</strong> {validationResult.error}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>• Usa el <strong>Page Access Token</strong> de tu página de Facebook</p>
          <p>• Debe tener permisos: pages_messaging, instagram_basic, instagram_manage_messages</p>
          <p>• La página debe tener Instagram Business conectado</p>
          <p>• Una vez actualizado, envía un DM a tu Instagram para probar</p>
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
