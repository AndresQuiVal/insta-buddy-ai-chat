import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, User, Key, Settings } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 relative">
          <Button
            variant="ghost"
            onClick={() => navigate('/tasks-to-do')}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          {/* HowerNotebook Style Header */}
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 p-6 sm:p-8"
              style={{
                borderTopColor: '#7a60ff',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f9fafb 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 40px, 0 0'
              }}
            >
              {/* Spiral binding holes */}
              <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: '#7a60ff'}} />
                ))}
              </div>
              
              <div className="text-center ml-4 sm:ml-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Settings className="w-8 h-8 text-purple-600" />
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Configuración</h1>
                </div>
                <p className="text-gray-600 text-lg">Actualiza tu username y token de perfil</p>
                
                {/* Current Instagram User Display */}
                <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-700 mb-1">Usuario de Instagram conectado:</p>
                  <p className="text-xl font-bold text-purple-800">@{currentUser?.username || 'No disponible'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form - HowerNotebook Style */}
        <div className="relative">
          <div 
            className="bg-white rounded-2xl shadow-xl border-t-8 p-6 sm:p-8"
            style={{
              borderTopColor: '#7a60ff',
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f9fafb 0%, #ffffff 100%)
              `,
              backgroundSize: '24px 1px, 100% 100%',
              backgroundPosition: '0 40px, 0 0'
            }}
          >
            {/* Spiral binding holes */}
            <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: '#7a60ff'}} />
              ))}
            </div>
            
            <div className="ml-4 sm:ml-6 space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuario y Token de Hower</h2>
                <p className="text-gray-600">Configura tu información de usuario de la plataforma</p>
              </div>

              {/* Username Field */}
              <div className="space-y-3">
                <Label htmlFor="username" className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <User className="w-5 h-5 text-purple-600" />
                  Username del perfil
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu username"
                  className="w-full text-lg py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500">
                  Este es el username que se muestra en tu perfil de la aplicación
                </p>
              </div>

              {/* Token Field */}
              <div className="space-y-3">
                <Label htmlFor="token" className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Key className="w-5 h-5 text-purple-600" />
                  Token del perfil
                </Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Ingresa tu token"
                  className="w-full text-lg py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500">
                  Token de acceso para la integración con el perfil
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-6">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;