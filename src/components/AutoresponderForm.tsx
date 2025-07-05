
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { X } from 'lucide-react';
import ButtonConfig from './ButtonConfig';

interface ButtonData {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
  action_type?: 'message' | 'url_redirect';
  action_data?: any;
}

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
  use_keywords?: boolean;
  keywords?: string[];
  use_buttons?: boolean;
  buttons?: ButtonData[];
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
  const [useKeywords, setUseKeywords] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [useButtons, setUseButtons] = useState(false);
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (message) {
      setName(message.name);
      setMessageText(message.message_text);
      setIsActive(message.is_active);
      setSendOnlyFirstMessage(message.send_only_first_message || false);
      setUseKeywords(message.use_keywords || false);
      setKeywords(message.keywords || []);
      setUseButtons(message.use_buttons || false);
      setButtons(message.buttons || []);
    } else {
      setName('');
      setMessageText('');
      setIsActive(true);
      setSendOnlyFirstMessage(false);
      setUseKeywords(false);
      setKeywords([]);
      setUseButtons(false);
      setButtons([]);
    }
  }, [message]);

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No hay usuario de Instagram autenticado",
        variant: "destructive"
      });
      return;
    }
    
    if (!name.trim() || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    if (useKeywords && keywords.length === 0) {
      toast({
        title: "Error",
        description: "Si activas el filtro de palabras clave, debes agregar al menos una palabra",
        variant: "destructive"
      });
      return;
    }

    if (useButtons && buttons.length === 0) {
      toast({
        title: "Error",
        description: "Si activas botones, debes agregar al menos un botón",
        variant: "destructive"
      });
      return;
    }

    // Validar botones
    if (useButtons) {
      for (const button of buttons) {
        if (!button.title.trim()) {
          toast({
            title: "Error",
            description: "Todos los botones deben tener un título",
            variant: "destructive"
          });
          return;
        }
        
        if (button.type === 'web_url' && !button.url?.trim()) {
          toast({
            title: "Error",
            description: "Los botones de URL deben tener una URL válida",
            variant: "destructive"
          });
          return;
        }
        
        if (button.type === 'postback' && !button.payload?.trim()) {
          toast({
            title: "Error",
            description: "Los botones de acción deben tener un payload",
            variant: "destructive"
          });
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      console.log('💾 Guardando autoresponder para usuario:', currentUser.username);

      const messageData = {
        name: name.trim(),
        message_text: messageText.trim(),
        is_active: isActive,
        send_only_first_message: sendOnlyFirstMessage,
        use_keywords: useKeywords,
        keywords: useKeywords ? keywords : null,
        use_buttons: useButtons,
        buttons: useButtons ? buttons : null,
        instagram_user_id_ref: currentUser.instagram_user_id,
        instagram_user_id: currentUser.id
      };

      let result;

      if (message) {
        console.log('🔄 Actualizando autoresponder:', message.id);
        result = await supabase
          .from('autoresponder_messages')
          .update(messageData)
          .eq('id', message.id);
      } else {
        console.log('➕ Creando nuevo autoresponder para usuario:', currentUser.username);
        result = await supabase
          .from('autoresponder_messages')
          .insert([messageData]);
      }

      if (result.error) {
        console.error('❌ Error guardando en BD:', result.error);
        throw result.error;
      }

      // Guardar acciones de postback si hay botones con postback
      if (useButtons && buttons.some(b => b.type === 'postback')) {
        const postbackActions = buttons
          .filter(b => b.type === 'postback')
          .map(button => ({
            payload_key: button.payload!,
            action_type: button.action_type || 'message',
            action_data: button.action_data || {},
            user_id: currentUser.instagram_user_id
          }));

        if (postbackActions.length > 0) {
          const { error: postbackError } = await supabase
            .from('button_postback_actions')
            .upsert(postbackActions, { 
              onConflict: 'payload_key',
              ignoreDuplicates: false 
            });

          if (postbackError) {
            console.warn('⚠️ Error guardando acciones postback:', postbackError);
          }
        }
      }

      console.log('✅ AUTORESPONDER GUARDADO PARA USUARIO:', currentUser.username);

      toast({
        title: message ? "¡Actualizado!" : "¡Creado!",
        description: `Respuesta automática ${useButtons ? 'con botones ' : ''}guardada para @${currentUser.username}`,
      });

      onSubmit();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      
      toast({
        title: "Error al guardar",
        description: error.message || 'Error desconocido al guardar en la base de datos',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No hay usuario de Instagram autenticado</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700">
          <span className="font-medium">Usuario:</span> @{currentUser.username}
        </p>
      </div>

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
          maxLength={640}
        />
        <p className="text-sm text-gray-500 mt-1">
          {messageText.length}/640 caracteres {useButtons && '(máx. para mensajes con botones)'}
        </p>
      </div>

      <ButtonConfig
        useButtons={useButtons}
        onUseButtosChange={setUseButtons}
        buttons={buttons}
        onButtonsChange={setButtons}
      />

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

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="useKeywords"
            checked={useKeywords}
            onCheckedChange={setUseKeywords}
          />
          <Label htmlFor="useKeywords">Solo responder a palabras clave específicas</Label>
        </div>
        
        {useKeywords && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <Label htmlFor="newKeyword">Agregar palabra clave</Label>
              <div className="flex gap-2">
                <Input
                  id="newKeyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={handleKeywordInputKeyPress}
                  placeholder="Ej: hola, info, precios..."
                  className="flex-1"
                />
                <Button type="button" onClick={addKeyword} disabled={!newKeyword.trim()}>
                  Agregar
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Solo responderá si el mensaje contiene alguna de estas palabras (no importan mayúsculas/minúsculas)
              </p>
            </div>
            
            {keywords.length > 0 && (
              <div>
                <Label>Palabras clave configuradas:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
