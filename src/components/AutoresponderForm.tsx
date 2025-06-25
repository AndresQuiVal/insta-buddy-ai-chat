
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PersonalizationVariables from './PersonalizationVariables';

interface AutoresponderFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const AutoresponderForm = ({ onSubmit, onCancel }: AutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sendOnlyFirstMessage, setSendOnlyFirstMessage] = useState(false);
  const [useKeywords, setUseKeywords] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

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

  // Nueva función para insertar variables en el mensaje
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageText.substring(0, start) + variable + messageText.substring(end);
      setMessageText(newText);
      
      // Restaurar cursor después de la variable insertada
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      // Si no se puede obtener la posición del cursor, agregar al final
      setMessageText(messageText + variable);
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

    setIsLoading(true);

    try {
      console.log('🔄 Creando autoresponder para usuario:', currentUser.instagram_user_id);

      const messageData = {
        name: name.trim(),
        message_text: messageText.trim(),
        is_active: isActive,
        send_only_first_message: sendOnlyFirstMessage,
        use_keywords: useKeywords,
        keywords: useKeywords ? keywords : null,
        instagram_user_id_ref: currentUser.instagram_user_id,
      };

      const { error } = await supabase
        .from('autoresponder_messages')
        .insert([messageData]);

      if (error) {
        console.error('❌ Error guardando en BD:', error);
        throw error;
      }

      console.log('✅ Autoresponder creado exitosamente');

      toast({
        title: "¡Autoresponder creado!",
        description: `Configurado para @${currentUser.username}`,
      });

      onSubmit();
    } catch (error: any) {
      console.error('❌ Error creando:', error);
      
      toast({
        title: "Error al crear autoresponder",
        description: error.message || 'Error desconocido al guardar en la base de datos',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600">No hay usuario de Instagram autenticado</p>
          <Button variant="outline" onClick={onCancel} className="mt-4">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario principal */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="text-purple-900">
              Crear Autoresponder de Mensajes Directos
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Para @{currentUser.username}
            </p>
          </CardHeader>

          <CardContent className="p-6">
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
                  placeholder="Escribe el mensaje que se enviará automáticamente... Usa variables como {NOMBRE} para personalizar"
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
                  {isLoading ? 'Creando...' : 'Crear Autoresponder'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Panel de variables de personalización */}
      <div className="lg:col-span-1">
        <PersonalizationVariables onVariableClick={insertVariable} />
      </div>
    </div>
  );
};

export default AutoresponderForm;
