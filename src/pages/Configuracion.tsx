import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, User, Key } from 'lucide-react';

const Configuracion = () => {
  const navigate = useNavigate();
  const { currentUser, checkCurrentUser } = useInstagramUsers();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.hower_username || '');
      setToken(currentUser.hower_token || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No se encontró el usuario actual",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('instagram_users')
        .update({
          hower_username: username.trim(),
          hower_token: token.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Actualizar el usuario local
      await checkCurrentUser();

      toast({
        title: "✅ Configuración actualizada",
        description: "Los datos se han guardado correctamente"
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/tasks-to-do')}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">Actualiza tu username y token de perfil</p>
        </div>

        {/* Configuration Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Perfil
            </CardTitle>
            <CardDescription className="text-purple-100">
              Configura tu información de usuario de la plataforma
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Current Instagram User */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">Usuario de Instagram conectado:</Label>
              <p className="text-lg font-semibold text-purple-600">@{currentUser?.username || 'No disponible'}</p>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username del perfil
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu username"
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Este es el username que se muestra en tu perfil de la aplicación
              </p>
            </div>

            {/* Token Field */}
            <div className="space-y-2">
              <Label htmlFor="token" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Token del perfil
              </Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa tu token"
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Token de acceso para la integración con el perfil
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracion;