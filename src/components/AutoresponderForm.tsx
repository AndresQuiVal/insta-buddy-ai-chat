
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { syncAutoresponders } from '@/services/autoresponderSync';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
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
  const [sendOnlyFirstMessage, setSendOnlyFirstMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (message) {
      setName(message.name);
      setMessageText(message.message_text);
      setIsActive(message.is_active);
      setSendOnlyFirstMessage(message.send_only_first_message || false);
    } else {
      setName('');
      setMessageText('');
      setIsActive(true);
      setSendOnlyFirstMessage(false);
    }
  }, [message]);

  const saveToLocalStorage = async (messageData: any) => {
    try {
      const existingMessages = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
      
      if (message) {
        const updatedMessages = existingMessages.map((msg: any) => 
          msg.id === message.id ? { ...msg, ...messageData } : msg
        );
        localStorage.setItem('autoresponder-messages', JSON.stringify(updatedMessages));
      } else {
        const newMessage = {
          id: `local_${Date.now()}`,
          ...messageData,
          created_at: new Date().toISOString()
        };
        existingMessages.push(newMessage);
        localStorage.setItem('autoresponder-messages', JSON.stringify(existingMessages));
      }
      
      console.log('✅ Guardado en localStorage');
      
      // Sincronizar con webhook
      await syncAutoresponders();
      
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
      is_active: isActive,
      send_only_first_message: sendOnlyFirstMessage
    };

    try {
      console.log('📋 Guardando autoresponder:', messageData);

      // Guardar SOLO en localStorage
      await saveToLocalStorage(messageData);

      toast({
        title: message ? "¡Actualizado!" : "¡Creado!",
        description: "Respuesta automática guardada en localStorage y sincronizada",
      });

      onSubmit();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      
      toast({
        title: "Error al guardar",
        description: error.message || 'Error desconocido al guardar',
        variant: "destructive"
      });
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

      <div className="flex items-center space-x-2">
        <Switch
          id="sendOnlyFirst"
          checked={sendOnlyFirstMessage}
          onCheckedChange={setSendOnlyFirstMessage}
        />
        <Label htmlFor="sendOnlyFirst">Solo enviar el primer mensaje</Label>
        <p className="text-sm text-gray-500">
          {sendOnlyFirstMessage 
            ? "Solo responderá la primera vez que alguien te escriba" 
            : "Responderá a todos los mensajes que recibas"
          }
        </p>
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
