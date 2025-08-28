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
    <div className="space-y-6">
      {/* Header estilo notebook */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <BookOpen className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-800 mb-2">Configuración de Hower</h2>
            <p className="text-amber-700 leading-relaxed">
              Conecta tu cuenta de Hower Software para sincronizar automáticamente los usuarios 
              que han recibido mensajes. Esto te permitirá obtener estadísticas precisas y 
              gestionar mejor tus prospectos.
            </p>
          </div>
        </div>
      </div>

      {/* Status card */}
      {isConnected ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Conexión Establecida
            </CardTitle>
            <CardDescription className="text-green-700">
              Tu cuenta de Hower está conectada correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <Label className="text-sm font-medium text-gray-600">Usuario:</Label>
                <p className="text-lg font-mono text-gray-800">{username}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditCredentials}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Configurar Conexión
            </CardTitle>
            <CardDescription className="text-orange-700">
              Ingresa tus credenciales de Hower Software para establecer la conexión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Usuario de Hower
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu usuario de Hower Software"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Token/Contraseña
                </Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Tu token o contraseña de Hower"
                  className="font-mono"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={isLoading || !username.trim() || !token.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  Conectando...
                </div>
              ) : (
                'Guardar y Conectar'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>¿Dónde encontrar mis credenciales?</strong>
          <br />
          Puedes obtener tus credenciales de Hower Software desde tu panel de control. 
          Si no tienes acceso, contacta con el soporte de Hower.
          <Button variant="link" className="h-auto p-0 ml-2 text-blue-600" asChild>
            <a href="https://howersoftware.io" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" />
              Ir a Hower Software
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default HowerConfig;