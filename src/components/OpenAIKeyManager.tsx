import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { Key, Eye, EyeOff } from 'lucide-react';

const OpenAIKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();
  const { currentUser, checkCurrentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser?.openai_api_key) {
      setApiKey(currentUser.openai_api_key);
    }
  }, [currentUser]);

  const handleSaveKey = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una API key válida",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "La API key de OpenAI debe comenzar con 'sk-'",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('instagram_users')
        .update({ openai_api_key: apiKey.trim() })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error updating OpenAI key:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar la API key",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ API Key guardada",
        description: "Tu API key de OpenAI ha sido configurada correctamente"
      });

      // Refrescar datos del usuario
      await checkCurrentUser();

    } catch (error) {
      console.error('Error saving OpenAI key:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('instagram_users')
        .update({ openai_api_key: null })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error removing OpenAI key:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la API key",
          variant: "destructive"
        });
        return;
      }

      setApiKey('');
      toast({
        title: "API Key eliminada",
        description: "Tu API key de OpenAI ha sido eliminada"
      });

      // Refrescar datos del usuario
      await checkCurrentUser();

    } catch (error) {
      console.error('Error removing OpenAI key:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">No hay usuario autenticado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          OpenAI API Key
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configura tu API key para usar las sugerencias de IA en prospectos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openai-key">API Key</Label>
          <div className="relative">
            <Input
              id="openai-key"
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveKey} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          
          {currentUser.openai_api_key && (
            <Button 
              variant="outline" 
              onClick={handleRemoveKey}
              disabled={loading}
            >
              Eliminar
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Obtén tu API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a></p>
          <p>• La API key se guarda de forma segura en tu perfil</p>
          <p>• Se usa solo para generar sugerencias de mensajes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenAIKeyManager;
