
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { X, ArrowLeft, MousePointer, Link, MessageCircle, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';
import { FlowEditor } from './FlowEditor';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
  use_keywords?: boolean;
  keywords?: string[];
  use_buttons?: boolean;
  buttons?: any;
  followups?: FollowUp[];
}

interface EditAutoresponderFormProps {
  message: AutoresponderMessage;
  onSubmit: () => void;
  onCancel: () => void;
}

const EditAutoresponderForm = ({ message, onSubmit, onCancel }: EditAutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sendOnlyFirstMessage, setSendOnlyFirstMessage] = useState(false);
  const [useKeywords, setUseKeywords] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [useButtons, setUseButtons] = useState(false);
  const [buttonType, setButtonType] = useState<'web_url' | 'postback'>('web_url');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [postbackPayload, setPostbackPayload] = useState('');
  const [postbackResponse, setPostbackResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [flowData, setFlowData] = useState(null);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    console.log('🔍 Cargando datos del autoresponder para editar:', message);
    console.log('🔍 use_buttons:', message.use_buttons);
    console.log('🔍 buttons:', message.buttons);
    
    setName(message.name);
    setMessageText(message.message_text);
    setIsActive(message.is_active);
    setSendOnlyFirstMessage(message.send_only_first_message || false);
    setUseKeywords(message.use_keywords || false);
    setKeywords(message.keywords || []);
    
    // Cargar configuración de botones
    setUseButtons(message.use_buttons === true);
    console.log('🔍 Setting useButtons to:', message.use_buttons === true);
    
    if (message.buttons) {
      console.log('🔍 Procesando configuración de botones:', message.buttons);
      const buttons = Array.isArray(message.buttons) ? message.buttons[0] : message.buttons;
      if (buttons) {
        console.log('🔍 Botón encontrado:', buttons);
        setButtonType(buttons.type || 'web_url');
        setButtonText(buttons.title || '');
        if (buttons.type === 'web_url') {
          setButtonUrl(buttons.url || '');
          console.log('🔍 Configurando web_url:', buttons.url);
        } else if (buttons.type === 'postback') {
          setPostbackPayload(buttons.payload || '');
          console.log('🔍 Configurando postback:', buttons.payload);
          // Cargar respuesta de postback si existe
          loadPostbackResponse(buttons.payload);
        }
      }
    } else {
      console.log('🔍 No hay configuración de botones');
    }
    
    // Cargar follow-ups existentes
    loadFollowUps(message.id);
  }, [message]);

  const loadFollowUps = async (autoresponderMessageId: string) => {
    try {
      const { data: followUpConfigs, error } = await supabase
        .from('autoresponder_followup_configs')
        .select('*')
        .eq('autoresponder_message_id', autoresponderMessageId)
        .order('sequence_order');

      if (error) {
        console.error('❌ Error cargando follow-ups:', error);
        return;
      }

      if (followUpConfigs) {
        const followUpsData: FollowUp[] = followUpConfigs.map(config => ({
          id: config.id,
          delay_hours: config.delay_hours,
          message_text: config.message_text,
          is_active: config.is_active
        }));
        
        setFollowUps(followUpsData);
      }
    } catch (error) {
      console.error('❌ Error cargando follow-ups:', error);
    }
  };

  const loadPostbackResponse = async (payload: string) => {
    if (!payload || !currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('button_postback_actions')
        .select('action_data')
        .eq('payload_key', payload)
        .eq('user_id', currentUser.instagram_user_id)
        .single();

      if (data && data.action_data && typeof data.action_data === 'object') {
        const actionData = data.action_data as any;
        if (actionData.response_message) {
          setPostbackResponse(actionData.response_message);
        }
      }
    } catch (error) {
      console.error('Error cargando respuesta de postback:', error);
    }
  };

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

    // Validación para botones
    if (useButtons) {
      if (!buttonText.trim()) {
        toast({
          title: "Error",
          description: "El texto del botón es requerido",
          variant: "destructive"
        });
        return;
      }

      if (buttonType === 'web_url' && !buttonUrl.trim()) {
        toast({
          title: "Error",
          description: "La URL del botón es requerida para el tipo web_url",
          variant: "destructive"
        });
        return;
      }

      if (buttonType === 'postback' && !postbackPayload.trim()) {
        toast({
          title: "Error",
          description: "El payload del postback es requerido",
          variant: "destructive"
        });
        return;
      }

      if (buttonType === 'postback' && !postbackResponse.trim()) {
        toast({
          title: "Error",
          description: "La respuesta del postback es requerida",
          variant: "destructive"
        });
        return;
      }

      // Validar URL si es web_url
      if (buttonType === 'web_url') {
        try {
          new URL(buttonUrl);
        } catch {
          toast({
            title: "Error",
            description: "Por favor ingresa una URL válida",
            variant: "destructive"
          });
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      console.log('🔄 Actualizando autoresponder:', message.id);

      const messageData = {
        name: name.trim(),
        message_text: messageText.trim(),
        is_active: isActive,
        send_only_first_message: sendOnlyFirstMessage,
        use_keywords: useKeywords,
        keywords: useKeywords ? keywords : null,
        use_buttons: useButtons,
        buttons: useButtons ? [
          buttonType === 'web_url' 
            ? { type: 'web_url', title: buttonText.trim(), url: buttonUrl.trim() }
            : { type: 'postback', title: buttonText.trim(), payload: postbackPayload.trim() }
        ] : null,
      };

      const { error } = await supabase
        .from('autoresponder_messages')
        .update(messageData)
        .eq('id', message.id)
        .eq('instagram_user_id_ref', currentUser.instagram_user_id);

      if (error) {
        console.error('❌ Error actualizando en BD:', error);
        throw error;
      }

      // Guardar postback action si es necesario
      if (useButtons && buttonType === 'postback' && postbackPayload.trim() && postbackResponse.trim()) {
        // Primero eliminar postback action existente
        await supabase
          .from('button_postback_actions')
          .delete()
          .eq('payload_key', postbackPayload.trim())
          .eq('user_id', currentUser.instagram_user_id);

        // Crear nuevo postback action
        const { error: postbackError } = await supabase
          .from('button_postback_actions')
          .insert({
            payload_key: postbackPayload.trim(),
            action_type: 'send_message',
            action_data: {
              response_message: postbackResponse.trim()
            },
            autoresponder_id: message.id,
            user_id: currentUser.instagram_user_id
          });

        if (postbackError) {
          console.error('❌ Error guardando postback action:', postbackError);
          throw postbackError;
        }
        
        console.log('✅ Postback action guardado exitosamente');
      }

      // Guardar follow-ups
      console.log('💾 Actualizando follow-ups:', followUps.length);
      
      // Primero eliminar follow-ups existentes
      const { error: deleteError } = await supabase
        .from('autoresponder_followup_configs')
        .delete()
        .eq('autoresponder_message_id', message.id);

      if (deleteError) {
        console.error('⚠️ Error eliminando follow-ups previos:', deleteError);
      }

      // Insertar nuevos follow-ups
      if (followUps.length > 0) {
        const followUpConfigs = followUps
          .filter(f => f.message_text.trim() && f.is_active)
          .map((followUp, index) => ({
            autoresponder_message_id: message.id,
            sequence_order: index + 1,
            delay_hours: followUp.delay_hours,
            message_text: followUp.message_text.trim(),
            is_active: followUp.is_active
          }));

        if (followUpConfigs.length > 0) {
          const { error: followUpError } = await supabase
            .from('autoresponder_followup_configs')
            .insert(followUpConfigs);

          if (followUpError) {
            console.error('❌ Error guardando follow-ups:', followUpError);
            throw followUpError;
          }
          
          console.log('✅ Follow-ups actualizados:', followUpConfigs.length);
        }
      }

      console.log('✅ Autoresponder actualizado exitosamente');

      toast({
        title: "¡Actualizado!",
        description: `Autoresponder actualizado para @${currentUser.username}`,
      });

      onSubmit();
    } catch (error: any) {
      console.error('❌ Error actualizando:', error);
      
      toast({
        title: "Error al actualizar",
        description: error.message || 'Error desconocido al actualizar en la base de datos',
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-purple-900">
              Editar Autoresponder de Mensajes Directos
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Para @{currentUser.username}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Configuración Básica
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Editor de Flujos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
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

              {/* Configuración de Botones */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200" style={{ display: 'none' }}>
                <div className="flex items-start space-x-3 mb-4">
                  <Switch
                    id="useButtons"
                    checked={useButtons}
                    onCheckedChange={setUseButtons}
                  />
                  <div className="flex-1">
                    <label htmlFor="useButtons" className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      Agregar botón interactivo al mensaje
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Añade un botón al mensaje DM que el usuario puede presionar
                    </p>
                  </div>
                </div>

                {useButtons && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-300">
                    <div>
                      <Label htmlFor="buttonText" className="text-sm font-medium text-blue-900">
                        Texto del Botón
                      </Label>
                      <Input
                        id="buttonText"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Ej: Ver Información, Descargar PDF..."
                        className="mt-1"
                        maxLength={20}
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        {buttonText.length}/20 caracteres
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="buttonType" className="text-sm font-medium text-blue-900">
                        Tipo de Botón
                      </Label>
                      <Select value={buttonType} onValueChange={(value: 'web_url' | 'postback') => setButtonType(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web_url">
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4" />
                              <span>URL (Redirigir a sitio web)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="postback">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4" />
                              <span>Postback (Enviar mensaje automático)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {buttonType === 'web_url' && (
                      <div>
                        <Label htmlFor="buttonUrl" className="text-sm font-medium text-blue-900">
                          URL del Botón
                        </Label>
                        <Input
                          id="buttonUrl"
                          type="url"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          placeholder="https://ejemplo.com/mi-pagina"
                          className="mt-1"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          El usuario será redirigido a esta URL cuando presione el botón
                        </p>
                      </div>
                    )}

                    {buttonType === 'postback' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="postbackPayload" className="text-sm font-medium text-blue-900">
                            Identificador del Postback
                          </Label>
                          <Input
                            id="postbackPayload"
                            value={postbackPayload}
                            onChange={(e) => setPostbackPayload(e.target.value)}
                            placeholder="Ej: GET_INFO, DOWNLOAD_PDF..."
                            className="mt-1"
                            maxLength={100}
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Identificador único para este botón (solo letras, números y guiones bajos)
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="postbackResponse" className="text-sm font-medium text-blue-900">
                            Mensaje de Respuesta Automática
                          </Label>
                          <Textarea
                            id="postbackResponse"
                            value={postbackResponse}
                            onChange={(e) => setPostbackResponse(e.target.value)}
                            placeholder="Este mensaje se enviará automáticamente cuando el usuario presione el botón..."
                            rows={3}
                            className="mt-1"
                            maxLength={1000}
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            {postbackResponse.length}/1000 caracteres - Este mensaje se enviará cuando presionen el botón
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <FollowUpConfig
                followUps={followUps}
                onChange={setFollowUps}
                maxFollowUps={4}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Actualizando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="flow">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Editor de Flujos Avanzado
                </h3>
                <p className="text-blue-700 mb-4">
                  Crea flujos complejos con múltiples mensajes, condiciones y acciones interconectadas.
                </p>
                <Button 
                  onClick={() => setIsFlowEditorOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Abrir Editor de Flujos
                </Button>
              </div>

              {flowData && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-green-900 font-medium mb-2">✅ Flujo Configurado</h4>
                  <p className="text-green-700 text-sm">
                    Tu flujo ha sido configurado exitosamente. Haz clic en "Abrir Editor de Flujos" para modificarlo.
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="text-yellow-900 font-medium mb-2">💡 ¿Qué puedes hacer con los flujos?</h4>
                <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                  <li>Crear secuencias de mensajes automáticos</li>
                  <li>Agregar botones interactivos con respuestas personalizadas</li>
                  <li>Configurar condiciones basadas en respuestas del usuario</li>
                  <li>Establecer acciones automáticas como etiquetado o notificaciones</li>
                  <li>Diseñar flujos complejos con múltiples caminos</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <FlowEditor
          isOpen={isFlowEditorOpen}
          onClose={() => setIsFlowEditorOpen(false)}
          autoresponderData={{
            id: message.id,
            name,
            message_text: messageText,
            is_active: isActive,
            keywords: useKeywords ? keywords : [],
            use_buttons: useButtons,
            buttons: useButtons ? [{
              type: buttonType,
              text: buttonText,
              title: buttonText,
              url: buttonType === 'web_url' ? buttonUrl : undefined,
              payload: buttonType === 'postback' ? (postbackPayload || 'POSTBACK') : undefined,
            }] : null,
          }}
          onSave={(data) => {
            setFlowData(data);
            console.log('✅ Flujo guardado:', data);
            toast({
              title: "¡Flujo guardado!",
              description: "Tu flujo ha sido configurado exitosamente",
            });
          }}
        />
      </CardContent>
    </Card>
  );
};

export default EditAutoresponderForm;
