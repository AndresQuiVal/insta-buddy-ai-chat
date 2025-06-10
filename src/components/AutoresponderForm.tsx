import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
}

interface AutoresponderFormProps {
  message?: AutoresponderMessage | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const AutoresponderForm = ({ message, onSubmit, onCancel }: AutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (message) {
      setName(message.name);
      setMessageText(message.message_text);
      setIsActive(message.is_active);
    } else {
      setName('');
      setMessageText('');
      setIsActive(true);
    }
  }, [message]);

  const saveToLocalStorage = (messageData: any) => {
    try {
      const existingMessages = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
      
      if (message) {
        // Actualizar mensaje existente
        const updatedMessages = existingMessages.map((msg: any) => 
          msg.id === message.id ? { ...msg, ...messageData } : msg
        );
        localStorage.setItem('autoresponder-messages', JSON.stringify(updatedMessages));
      } else {
        // Agregar nuevo mensaje
        const newMessage = {
          id: `local_${Date.now()}`,
          ...messageData,
          created_at: new Date().toISOString()
        };
        existingMessages.push(newMessage);
        localStorage.setItem('autoresponder-messages', JSON.stringify(existingMessages));
      }
      
      console.log('✅ Guardado en localStorage como respaldo');
    } catch (error) {
      console.error('⚠️ Error guardando en localStorage:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const messageData = {
      name: name.trim(),
      message_text: messageText.trim(),
      is_active: isActive
    };

    try {
      // PASO 1: Siempre guardar en localStorage como respaldo
      saveToLocalStorage(messageData);

      // PASO 2: Intentar guardar en base de datos
      const instagramUser = localStorage.getItem('hower-instagram-user');
      
      if (!instagramUser) {
        toast({
          title: "Guardado localmente",
          description: "Se guardó en tu navegador. Conéctate con Instagram para sincronizar.",
          variant: "default"
        });
        onSubmit();
        return;
      }

      const userData = JSON.parse(instagramUser);
      const userId = userData.facebook?.id || userData.instagram?.id || 'instagram_user';

      if (message) {
        // Editar mensaje existente
        const { error } = await supabase
          .from('autoresponder_messages')
          .update({
            ...messageData,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        if (error) throw error;

        toast({
          title: "¡Actualizado!",
          description: "Respuesta automática actualizada correctamente",
        });
      } else {
        // Crear nuevo mensaje
        const { error } = await supabase
          .from('autoresponder_messages')
          .insert({
            ...messageData,
            user_id: userId
          });

        if (error) throw error;

        toast({
          title: "¡Creado!",
          description: "Respuesta automática creada correctamente",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving autoresponder message:', error);
      toast({
        title: "Guardado localmente",
        description: "Se guardó en tu navegador. Error al sincronizar con servidor.",
      });
      onSubmit(); // Continúa porque se guardó localmente
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la respuesta</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Bienvenida inicial"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="message">Mensaje de respuesta</Label>
        <Textarea
          id="message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Escribe el mensaje que se enviará automáticamente..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {messageText.length}/1000 caracteres
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="active">Activar esta respuesta automática</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : (message ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
};

export default AutoresponderForm;
