
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

const TokenManager: React.FC = () => {
  const [token, setToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const validateToken = async (tokenToTest: string) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokenToTest}`);
      return response.ok;
    } catch {
      return false;
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
      // Validar el token primero
      const isTokenValid = await validateToken(token);
      setIsValid(isTokenValid);

      if (!isTokenValid) {
        toast({
          title: "Token inválido",
          description: "El token no es válido o ha expirado",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el token via edge function
      const { error } = await supabase.functions.invoke('update-instagram-token', {
        body: { access_token: token }
      });

      if (error) {
        console.error('Error actualizando token:', error);
        toast({
          title: "Error del servidor",
          description: "No se pudo actualizar el token en el servidor",
          variant: "destructive"
        });
        return;
      }

      // También guardarlo localmente
      localStorage.setItem('instagram_access_token', token);

      toast({
        title: "¡Token actualizado!",
        description: "El token de Instagram se ha actualizado correctamente",
      });

      setToken('');
      
    } catch (error) {
      console.error('Error actualizando token:', error);
      toast({
        title: "Error",
        description: "Error actualizando el token",
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
        <h3 className="text-lg font-semibold text-gray-800">Actualizar Token de Instagram</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token" className="text-sm font-medium">
            Nuevo Token de Acceso:
          </Label>
          <div className="relative">
            <Input
              id="token"
              type="password"
              placeholder="EAAp0ic0E6bE... (pega tu nuevo token aquí)"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setIsValid(null);
              }}
              className="pr-10"
            />
            {isValid !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isValid ? (
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
          disabled={!token.trim() || isUpdating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isUpdating ? 'Actualizando...' : 'Actualizar Token'}
        </Button>

        <div className="text-sm text-gray-600">
          <p>• Copia tu nuevo token desde Meta Graph API Explorer</p>
          <p>• El token se validará automáticamente antes de guardarse</p>
          <p>• Esto actualizará tanto el servidor como la configuración local</p>
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
