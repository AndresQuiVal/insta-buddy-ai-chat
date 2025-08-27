import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      
      // También guardar en la base de datos para las funciones del servidor
      // y verificar si el usuario ha completado el onboarding
      const instagramUserDataStr = localStorage.getItem('hower-instagram-user');
      
      toast({
        title: "Credenciales guardadas",
        description: "Bienvenido al CRM de Hower",
      });
      
      // Check if user has completed onboarding
      if (instagramUserDataStr) {
        // Guardar credenciales en la base de datos
        const userData = JSON.parse(instagramUserDataStr);
        const instagramUserId = userData.instagram?.id || userData.facebook?.id;
        
        if (instagramUserId) {
          const { error: dbError } = await supabase
            .from('instagram_users')
            .update({
              hower_username: username.trim(),
              hower_token: token.trim()
            })
            .eq('instagram_user_id', instagramUserId);
          
          if (dbError) {
            console.error('Error saving Hower credentials to DB:', dbError);
            // No bloqueamos el flujo, solo logueamos el error
          }
        }
        // User exists, check if they have completed ICP onboarding
        
        if (instagramUserId) {
          // Check if ICP exists
          const { data: existingICP } = await supabase
            .from('user_icp')
            .select('id')
            .eq('instagram_user_id', instagramUserId)
            .maybeSingle();
            
          if (existingICP) {
            // ICP exists, go to dashboard
            navigate('/tasks-to-do');
          } else {
            // No ICP, start onboarding
            navigate('/icp-onboarding');
          }
          return;
        }
      }
      
      // No user data or invalid data, start onboarding
      navigate('/icp-onboarding');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Hower"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-bold text-primary">Hower</h1>
          
          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-primary text-base font-medium block text-left">
                Username:
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="usuario_ejemplo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 text-base rounded-lg border-2 border-muted-foreground/20"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="token" className="text-primary text-base font-medium block text-left">
                Contraseña:
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="tu_contraseña"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full h-12 text-base rounded-lg border-2 border-muted-foreground/20"
                disabled={isLoading}
              />
              
              <div className="text-center">
                <a 
                  href="https://www.howersoftware.io/clients/reset-password/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-lg transition-all duration-300"
            >
              {isLoading ? "Validando..." : "Validar contraseña"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowerAuth;