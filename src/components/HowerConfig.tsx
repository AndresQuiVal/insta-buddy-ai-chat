import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Download } from 'lucide-react';
import ExportPanel from './ExportPanel';
import howerLogo from '@/assets/hower-logo.png';

const HowerConfig = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    // Cargar credenciales existentes para mostrar en el formulario
    loadExistingCredentials();
  }, []);

  const loadExistingCredentials = async () => {
    try {
      // Primero verificar localStorage
      const localUsername = localStorage.getItem('hower_username');
      const localToken = localStorage.getItem('hower_token');
      
      if (localUsername && localToken) {
        setUsername(localUsername);
        setToken(localToken);
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
          setToken(data.hower_token);
          
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

      toast({
        title: "¡Configuración guardada!",
        description: "Las credenciales de Hower se han guardado correctamente",
      });
      
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <img 
          src={howerLogo} 
          alt="Hower" 
          className="w-16 h-16 mx-auto mb-4"
        />
        <h2 className="text-2xl font-semibold mb-2">Hower - Panel de Control</h2>
        <p className="text-muted-foreground">
          Gestiona tu configuración y exporta tus datos
        </p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <ExportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HowerConfig;