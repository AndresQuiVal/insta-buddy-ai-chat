import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn } from 'lucide-react';

const HowerAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !token.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu username y token de Hower",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Guardar en localStorage
      localStorage.setItem('hower_username', username.trim());
      localStorage.setItem('hower_token', token.trim());
      
      toast({
        title: "Credenciales guardadas",
        description: "Bienvenido al CRM de Hower",
      });
      
      // Navegar al CRM
      navigate('/tasks-to-do');
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al guardar las credenciales",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <img
                src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
                alt="Hower"
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
              />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inicia sesión en Hower
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Ingresa tus credenciales de Hower para acceder al CRM
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username de Hower
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="andresquiroz"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                Token de Hower
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="mi_token_secreto_123"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0"
              >
                {isLoading ? (
                  "Guardando..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Acceder al CRM
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleBack}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowerAuth;