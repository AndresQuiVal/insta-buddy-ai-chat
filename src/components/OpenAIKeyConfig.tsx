
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OpenAIKeyConfig: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una API Key válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Obtener datos del usuario de Instagram
      const userDataString = localStorage.getItem('hower-instagram-user');
      if (!userDataString) {
        throw new Error('No hay información de usuario de Instagram disponible');
      }

      const userData = JSON.parse(userDataString);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;

      if (!instagramUserId) {
        throw new Error('No se pudo obtener el ID del usuario de Instagram');
      }

      // Actualizar la API Key en la base de datos
      const { error } = await supabase
        .from('instagram_users')
        .update({ openai_api_key: apiKey.trim() })
        .eq('instagram_user_id', instagramUserId);

      if (error) {
        throw error;
      }

      toast({
        title: "✅ API Key configurada",
        description: "Tu API Key de OpenAI ha sido guardada correctamente"
      });

      setOpen(false);
      setApiKey('');

    } catch (error) {
      console.error('Error guardando API Key:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la API Key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Key className="w-4 h-4" />
          Configurar OpenAI API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Configurar OpenAI API Key
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apikey">API Key de OpenAI</Label>
            <Input
              id="apikey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>Tu API Key se guarda de forma segura y es necesaria para generar sugerencias con IA.</p>
            <p className="mt-1">
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                Obtener API Key de OpenAI →
              </a>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !apiKey.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenAIKeyConfig;
