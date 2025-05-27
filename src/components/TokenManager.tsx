
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Key, Clock } from 'lucide-react';

const TokenManager: React.FC = () => {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid' | 'rate_limited'>('unknown');
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('instagram_access_token');
    if (savedToken) {
      setTokenStatus('unknown'); // Don't auto-validate to avoid rate limiting
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate?.trim()) return false;

    try {
      setIsValidating(true);
      console.log('🔍 Validando token...');
      console.log('Token length:', tokenToValidate.length);
      console.log('Token preview:', tokenToValidate.substring(0, 20) + '...');

      const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokenToValidate}`);
      const data = await response.json();
      
      console.log('📝 Respuesta básica:', JSON.stringify(data, null, 2));

      if (data.error) {
        if (data.error.code === 4) {
          setTokenStatus('rate_limited');
          toast({
            title: "Límite de API alcanzado",
            description: "Demasiadas solicitudes. Espera unos minutos antes de validar de nuevo.",
            variant: "destructive"
          });
          return false;
        } else {
          setTokenStatus('invalid');
          toast({
            title: "Token inválido",
            description: data.error.message,
            variant: "destructive"
          });
          return false;
        }
      }

      if (data.id && data.name) {
        setTokenStatus('valid');
        setLastValidation(new Date());
        toast({
          title: "Token válido",
          description: `Conectado como: ${data.name}`,
        });
        return true;
      }

      setTokenStatus('invalid');
      return false;
    } catch (error) {
      console.error('Error validando token:', error);
      setTokenStatus('invalid');
      toast({
        title: "Error de conexión",
        description: "No se pudo validar el token",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive"
      });
      return;
    }

    const isValid = await validateToken(token);
    
    if (isValid) {
      localStorage.setItem('instagram_access_token', token);
      setToken('');
      toast({
        title: "¡Token guardado!",
        description: "Tu token de Instagram se ha configurado correctamente",
      });
    }
  };

  const handleValidateExisting = async () => {
    const savedToken = localStorage.getItem('instagram_access_token');
    if (savedToken) {
      await validateToken(savedToken);
    }
  };

  const getStatusIcon = () => {
    switch (tokenStatus) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'rate_limited':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Key className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (tokenStatus) {
      case 'valid':
        return 'Token válido y funcionando';
      case 'invalid':
        return 'Token inválido o expirado';
      case 'rate_limited':
        return 'Límite de API alcanzado - espera unos minutos';
      default:
        return 'Estado del token desconocido';
    }
  };

  const savedToken = localStorage.getItem('instagram_access_token');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Gestión de Token de Instagram
          </CardTitle>
          <CardDescription>
            Configura y valida tu token de acceso de Instagram Graph API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedToken ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <p className="font-medium">{getStatusText()}</p>
                    {lastValidation && (
                      <p className="text-sm text-gray-500">
                        Última validación: {lastValidation.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleValidateExisting}
                  disabled={isValidating || tokenStatus === 'rate_limited'}
                  variant="outline"
                  size="sm"
                >
                  {isValidating ? 'Validando...' : 'Validar'}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Token configurado</h4>
                <p className="text-sm text-blue-700">
                  Tienes un token guardado. Para cambiarlo, ingresa uno nuevo abajo.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-800 font-medium">No hay token configurado</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="token">Token de Instagram Graph API</Label>
            <div className="flex gap-3">
              <Input
                id="token"
                type="password"
                placeholder="EAA... (pega tu token aquí)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSaveToken}
                disabled={!token.trim() || isValidating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isValidating ? 'Validando...' : 'Guardar Token'}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Obtén tu token desde{' '}
              <a 
                href="https://developers.facebook.com/tools/explorer/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Meta Graph API Explorer
              </a>
            </p>
          </div>

          {tokenStatus === 'rate_limited' && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">⚠️ Límite de API alcanzado</h4>
              <p className="text-sm text-orange-700">
                La aplicación ha hecho demasiadas solicitudes a la API de Facebook. 
                Espera entre 5-10 minutos antes de validar el token nuevamente.
              </p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">💡 Consejos para evitar límites de API</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• No valides el token muy frecuentemente</li>
              <li>• Usa tokens de larga duración cuando sea posible</li>
              <li>• Evita refrescar la página repetidamente</li>
              <li>• Los límites se reinician automáticamente después de unos minutos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenManager;
