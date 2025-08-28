import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Key, User, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { supabase } from '@/integrations/supabase/client';

const HowerConfig = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    // Cargar credenciales existentes
    loadExistingCredentials();
  }, []);

  const loadExistingCredentials = async () => {
    try {
      // Primero verificar localStorage
      const localUsername = localStorage.getItem('hower_username');
      const localToken = localStorage.getItem('hower_token');
      
      if (localUsername && localToken) {
        setUsername(localUsername);
        setToken('••••••••••••••••'); // Ocultar token por seguridad
        setIsConnected(true);
        return;
      }

      // Si no hay en localStorage, verificar base de datos
      if (currentUser) {
        const { data, error } = await supabase
          .from('instagram_users')
          .select('hower_username, hower_token')
          .eq('instagram_user_id', currentUser.instagram_user_id)
          .maybeSingle();

        if (!error && data && data.hower_username && data.hower_token) {
          setUsername(data.hower_username);
          setToken('••••••••••••••••'); // Ocultar token por seguridad
          setIsConnected(true);
          
          // Migrar a localStorage para acceso rápido
          localStorage.setItem('hower_username', data.hower_username);
          localStorage.setItem('hower_token', data.hower_token);
        }
      }
    } catch (error) {
      console.error('Error cargando credenciales:', error);
    }
  };

  const handleSave = async () => {
    if (!username.trim() || !token.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Guardar en localStorage
      localStorage.setItem('hower_username', username.trim());
      localStorage.setItem('hower_token', token.trim());

      // Guardar en base de datos si hay usuario conectado
      if (currentUser) {
        const { error } = await supabase
          .from('instagram_users')
          .update({
            hower_username: username.trim(),
            hower_token: token.trim()
          })
          .eq('instagram_user_id', currentUser.instagram_user_id);

        if (error) {
          console.error('Error guardando en BD:', error);
          // Continuar, ya se guardó en localStorage
        }
      }

      setIsConnected(true);
      toast({
        title: "¡Configuración guardada!",
        description: "Las credenciales de Hower se han guardado correctamente",
      });
      
      // Ocultar token por seguridad
      setToken('••••••••••••••••');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('hower_username');
    localStorage.removeItem('hower_token');
    setUsername('');
    setToken('');
    setIsConnected(false);
    
    toast({
      title: "Desconectado",
      description: "Se han eliminado las credenciales de Hower",
    });
  };

  const handleEditCredentials = () => {
    setIsConnected(false);
    // Cargar credenciales reales para edición
    const realUsername = localStorage.getItem('hower_username') || '';
    const realToken = localStorage.getItem('hower_token') || '';
    setUsername(realUsername);
    setToken(realToken);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuración de Hower</h2>
        <p className="text-sm text-muted-foreground">
          Conecta tu cuenta para sincronizar datos
        </p>
      </div>

      {isConnected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Conectado como:</p>
                <p className="text-sm text-muted-foreground font-mono">{username}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditCredentials}
                >
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu usuario de Hower"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Tu token de Hower"
                />
              </div>

              <Button 
                onClick={handleSave}
                disabled={isLoading || !username.trim() || !token.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    Conectando...
                  </div>
                ) : (
                  'Conectar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HowerConfig;