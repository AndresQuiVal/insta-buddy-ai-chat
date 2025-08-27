
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Save, MessageCircle, Key, ExternalLink, MessageSquare, MousePointer, Link, UserCheck, GitBranch } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';
import { FlowEditor } from './FlowEditor';

interface CommentAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  post_id: string;
  post_url: string;
  post_caption?: string;
  is_active: boolean;
  created_at: string;
  public_reply_messages?: string[];
  require_follower?: boolean;
  follower_confirmation_message?: string;
  use_buttons?: boolean;
  buttons?: any;
  button_type?: string;
  button_text?: string;
  button_url?: string;
  postback_response?: string;
}

interface EditCommentAutoresponderFormProps {
  autoresponder: CommentAutoresponder;
  onBack: () => void;
  onSubmit: () => void;
}

const EditCommentAutoresponderForm = ({ autoresponder, onBack, onSubmit }: EditCommentAutoresponderFormProps) => {
  console.log('🔍 DEBUGGER - Datos del autoresponder recibidos:', autoresponder);
  console.log('🔍 DEBUGGER - use_buttons:', autoresponder.use_buttons);
  console.log('🔍 DEBUGGER - buttons:', autoresponder.buttons);
  console.log('🔍 DEBUGGER - button_type:', autoresponder.button_type);
  console.log('🔍 DEBUGGER - button_text:', autoresponder.button_text);
  console.log('🔍 DEBUGGER - button_url:', autoresponder.button_url);
  console.log('🔍 DEBUGGER - postback_response:', autoresponder.postback_response);
  
  const [name, setName] = useState(autoresponder.name);
  const [keywords, setKeywords] = useState<string[]>(autoresponder.keywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [dmMessage, setDmMessage] = useState(autoresponder.dm_message);
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>(
    autoresponder.public_reply_messages || ['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']
  );
  const [newPublicReply, setNewPublicReply] = useState('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [requireFollower, setRequireFollower] = useState(autoresponder.require_follower || false);
  const [useButtons, setUseButtons] = useState(autoresponder.use_buttons || false);

  // Desactivar botón cuando se activa require_follower
  const handleRequireFollowerChange = (checked: boolean) => {
    setRequireFollower(checked);
    if (checked) {
      setUseButtons(false);
      setButtonText('');
      setButtonUrl('');
      setPostbackResponse('');
      setPostbackPayload('');
    }
  };

  // Desactivar require_follower cuando se activa useButtons
  const handleUseButtonsChange = (checked: boolean) => {
    setUseButtons(checked);
    if (checked) {
      setRequireFollower(false);
    }
  };
  const [buttonType, setButtonType] = useState<'web_url' | 'postback'>(autoresponder.button_type as 'web_url' | 'postback' || 'web_url');
  const [buttonText, setButtonText] = useState(autoresponder.button_text || '');
  const [buttonUrl, setButtonUrl] = useState(autoresponder.button_url || '');
  const [postbackPayload, setPostbackPayload] = useState('');
  const [postbackResponse, setPostbackResponse] = useState(autoresponder.postback_response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [flowData, setFlowData] = useState<any>(null);

  // Cargar datos iniciales y follow-ups al montar el componente
  useEffect(() => {
    console.log('🔍 DEBUGGER - useEffect ejecutándose');
    console.log('🔍 DEBUGGER - autoresponder completo:', autoresponder);
    
    // Detectar automáticamente si hay datos de botón configurados
    const hasButtonData = autoresponder.button_text || autoresponder.button_type || autoresponder.button_url || autoresponder.postback_response;
    
    // Inicializar estado de botones - activar si use_buttons es true O si hay datos de botón
    if (autoresponder.use_buttons || hasButtonData) {
      console.log('✅ Activando switch de botones - use_buttons:', autoresponder.use_buttons, 'hasButtonData:', hasButtonData);
      setUseButtons(true);
      
      // Cargar tipo de botón y datos
      if (autoresponder.button_type) {
        setButtonType(autoresponder.button_type as 'web_url' | 'postback');
        console.log('✅ Tipo de botón cargado:', autoresponder.button_type);
      }
      
      if (autoresponder.button_text) {
        setButtonText(autoresponder.button_text);
        console.log('✅ Texto de botón cargado:', autoresponder.button_text);
      }
      
      if (autoresponder.button_url && autoresponder.button_type === 'web_url') {
        setButtonUrl(autoresponder.button_url);
        console.log('✅ URL de botón cargada:', autoresponder.button_url);
      }
      
      if (autoresponder.postback_response && autoresponder.button_type === 'postback') {
        setPostbackResponse(autoresponder.postback_response);
        console.log('✅ Respuesta postback cargada:', autoresponder.postback_response);
      }
    }
    
    loadFollowUps();
    loadExistingButtonData();
  }, [autoresponder.id]);

  const loadFollowUps = async () => {
    try {
      const { data: followUpConfigs, error } = await supabase
        .from('autoresponder_followup_configs')
        .select('*')
        .eq('comment_autoresponder_id', autoresponder.id)
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

  const loadExistingButtonData = async () => {
    try {
      console.log('🔍 Cargando datos existentes de botones para:', autoresponder.id);
      
      // Cargar desde la configuración existente del autoresponder
      if (autoresponder.buttons) {
        console.log('🔍 Botones encontrados en autoresponder:', autoresponder.buttons);
        const buttons = Array.isArray(autoresponder.buttons) ? autoresponder.buttons[0] : autoresponder.buttons;
        if (buttons && buttons.type === 'postback' && buttons.payload) {
          setPostbackPayload(buttons.payload);
          
          // Cargar respuesta de postback desde button_postback_actions
          const { data, error } = await supabase
            .from('button_postback_actions')
            .select('action_data')
            .eq('payload_key', buttons.payload)
            .eq('user_id', currentUser?.instagram_user_id || '')
            .single();

          if (data && data.action_data && typeof data.action_data === 'object') {
            const actionData = data.action_data as any;
            if (actionData.response_message) {
              setPostbackResponse(actionData.response_message);
              console.log('✅ Respuesta de postback cargada:', actionData.response_message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos de botones:', error);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const addPublicReply = () => {
    if (newPublicReply.trim() && publicReplyMessages.length < 10) {
      setPublicReplyMessages([...publicReplyMessages, newPublicReply.trim()]);
      setNewPublicReply('');
    }
  };

  const removePublicReply = (index: number) => {
    if (publicReplyMessages.length > 1) {
      setPublicReplyMessages(publicReplyMessages.filter((_, i) => i !== index));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handlePublicReplyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPublicReply();
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
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive"
      });
      return;
    }

    if (keywords.length === 0) {
      toast({
        title: "Error", 
        description: "Debes agregar al menos una palabra clave",
        variant: "destructive"
      });
      return;
    }

    if (!dmMessage.trim()) {
      toast({
        title: "Error",
        description: "El mensaje DM es requerido",
        variant: "destructive"
      });
      return;
    }

    if (publicReplyMessages.length === 0 || publicReplyMessages.some(msg => !msg.trim())) {
      toast({
        title: "Error",
        description: "Debes tener al menos un mensaje de respuesta pública válido",
        variant: "destructive"
      });
      return;
    }

    // Validación para botones
    if (useButtons) {
      if (!buttonText.trim()) {
        toast({
          title: "Error",
          description: "El texto del botón es requerido cuando usas botones",
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

    setIsSubmitting(true);

    try {
      console.log('🔄 Actualizando autoresponder de comentarios:', autoresponder.id);

      const updateData = {
        name: name.trim(),
        keywords: keywords,
        dm_message: dmMessage.trim(),
        public_reply_messages: publicReplyMessages,
        require_follower: requireFollower,
        use_buttons: useButtons,
        buttons: useButtons ? [
          buttonType === 'web_url' 
            ? { type: 'web_url', title: buttonText.trim(), url: buttonUrl.trim() }
            : { type: 'postback', title: buttonText.trim(), payload: postbackPayload.trim() }
        ] : null,
        button_type: useButtons ? buttonType : null,
        button_text: useButtons ? buttonText.trim() : null,
        button_url: (useButtons && buttonType === 'web_url') ? buttonUrl.trim() : null,
        postback_response: (useButtons && buttonType === 'postback') ? postbackResponse.trim() : null,
      };

      const { error } = await supabase
        .from('comment_autoresponders')
        .update(updateData)
        .eq('id', autoresponder.id)
        .eq('user_id', currentUser.instagram_user_id);

      if (error) {
        console.error('❌ Error actualizando autoresponder:', error);
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
            autoresponder_id: autoresponder.id,
            user_id: currentUser.instagram_user_id
          });

        if (postbackError) {
          console.error('❌ Error guardando postback action:', postbackError);
          throw postbackError;
        }
        
        console.log('✅ Postback action guardado exitosamente');
      }

      console.log('✅ Autoresponder de comentarios actualizado exitosamente');

      // Guardar follow-ups
      await saveFollowUps();

      toast({
        title: "¡Autoresponder actualizado!",
        description: `Se actualizó para @${currentUser.username} con ${publicReplyMessages.length} mensajes de respuesta`,
      });

      onSubmit();

    } catch (error) {
      console.error('❌ Error actualizando autoresponder:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el autoresponder",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFollowUps = async () => {
    try {
      // Eliminar follow-ups existentes
      const { error: deleteError } = await supabase
        .from('autoresponder_followup_configs')
        .delete()
        .eq('comment_autoresponder_id', autoresponder.id);

      if (deleteError) {
        console.error('⚠️ Error eliminando follow-ups previos:', deleteError);
      }

      // Insertar nuevos follow-ups
      if (followUps.length > 0) {
        const followUpConfigs = followUps
          .filter(f => f.message_text.trim() && f.is_active)
          .map((followUp, index) => ({
            comment_autoresponder_id: autoresponder.id,
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
          
          console.log('✅ Follow-ups guardados:', followUpConfigs.length);
        }
      }
    } catch (error) {
      console.error('💥 Error guardando follow-ups:', error);
      throw error;
    }
  };

  if (!currentUser) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600">No hay usuario de Instagram autenticado</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
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
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-purple-900">
              Editar Autoresponder de Comentarios
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Para @{currentUser.username}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={() => setIsFlowEditorOpen(true)}>
            <GitBranch className="w-4 h-4 mr-2" />
            Abrir Editor de Flujos
          </Button>
        </div>
        {/* Post Seleccionado */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Post Configurado
          </h3>
          <div className="text-sm text-gray-600">
            <a 
              href={autoresponder.post_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Ver post en Instagram <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Autoresponder */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre del Autoresponder
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Respuesta para lead magnet"
              className="mt-1"
              required
            />
          </div>

          {/* Palabras Clave */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Palabras Clave para Detectar
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Cuando un comentario contenga alguna de estas palabras, se enviará el DM automáticamente
            </p>
            
            <div className="flex gap-2 mb-3">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe una palabra clave..."
                className="flex-1"
              />
              <Button type="button" onClick={addKeyword} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeKeyword(index)}
                  />
                </Badge>
              ))}
              {keywords.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No se han agregado palabras clave
                </p>
              )}
            </div>
          </div>

          {/* Mensajes de Respuesta Pública */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensajes de Respuesta Pública
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Estos mensajes se enviarán como respuesta pública al comentario (se selecciona uno al azar)
            </p>
            
            <div className="flex gap-2 mb-3">
              <Input
                value={newPublicReply}
                onChange={(e) => setNewPublicReply(e.target.value)}
                onKeyPress={handlePublicReplyKeyPress}
                placeholder="Escribe un mensaje de respuesta pública..."
                className="flex-1"
                disabled={publicReplyMessages.length >= 10}
              />
              <Button 
                type="button" 
                onClick={addPublicReply} 
                size="sm"
                disabled={publicReplyMessages.length >= 10 || !newPublicReply.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-2">
              {publicReplyMessages.map((message, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-600 font-medium">#{index + 1}</span>
                  <span className="flex-1 text-sm text-gray-800">{message}</span>
                  {publicReplyMessages.length > 1 && (
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-red-500 flex-shrink-0"
                      onClick={() => removePublicReply(index)}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-400">
              {publicReplyMessages.length}/10 mensajes configurados
            </p>
          </div>

          {/* Mensaje DM */}
          <div>
            <Label htmlFor="dmMessage" className="text-sm font-medium text-gray-700">
              Mensaje DM Automático
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Este mensaje se enviará por DM cuando se detecte una palabra clave
            </p>
            <Textarea
              id="dmMessage"
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="¡Hola! Vi tu comentario y me gustaría enviarte más información..."
              rows={4}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {dmMessage.length}/1000 caracteres
            </p>
          </div>

          {/* Configuración de Botones */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200" style={{ display: 'none' }}>
            <div className="flex items-start space-x-3 mb-4">
              <Switch
                id="useButtons"
                checked={useButtons}
                onCheckedChange={handleUseButtonsChange}
                disabled={requireFollower}
              />
              <div className="flex-1">
                <label htmlFor="useButtons" className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${requireFollower ? 'text-gray-500' : 'text-blue-900'}`}>
                  <MousePointer className="w-4 h-4" />
                  Agregar botón interactivo al mensaje DM
                </label>
                <p className={`text-xs mt-1 ${requireFollower ? 'text-gray-500' : 'text-blue-700'}`}>
                  Si está activado, el DM incluirá un botón interactivo que el usuario puede presionar
                </p>
                {requireFollower && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ No disponible cuando "Solo enviar a seguidores" está activado
                  </p>
                )}
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
                    required={useButtons}
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
                      required={useButtons && buttonType === 'web_url'}
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
                        required={useButtons && buttonType === 'postback'}
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
                        required={useButtons && buttonType === 'postback'}
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

          {/* Verificar seguidor */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-3">
              <Switch
                id="requireFollower"
                checked={requireFollower}
                onCheckedChange={handleRequireFollowerChange}
              />
              <div className="flex-1">
                <label htmlFor="requireFollower" className="text-sm font-medium text-yellow-900 cursor-pointer flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Solo enviar Autoresponder a usuarios que me siguen...
                </label>
                <p className="text-xs text-yellow-700 mt-1">
                  Siempre se enviará un mensaje de confirmación preguntando si te siguen. 
                  Solo después de que confirmen que te siguen se enviará el mensaje del autoresponder.
                </p>
                {requireFollower && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ Los botones se desactivan automáticamente con esta opción
                  </p>
                )}
              </div>
            </div>
            
            {requireFollower && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">
                  Flujo de confirmación de seguidor
                </h4>
                <div className="text-xs text-yellow-800 space-y-1">
                  <p><strong>1.</strong> Se enviará un mensaje de confirmación preguntando si te siguen</p>
                  <p><strong>2.</strong> El prospecto debe responder 'sí' para confirmar que te sigue</p>
                  <p><strong>3.</strong> Solo después de la confirmación se enviará el mensaje del autoresponder</p>
                </div>
                <div className="mt-3 p-2 bg-yellow-200 rounded text-xs text-yellow-900">
                  <strong>Mensaje por defecto:</strong> "¡Hola! 😊 Gracias por comentar. Para poder ayudarte mejor, ¿podrías confirmar si me sigues? Solo responde 'sí' si ya me sigues y te envío lo que necesitas 💪"
                </div>
              </div>
            )}
          </div>

          <FollowUpConfig
            followUps={followUps}
            onChange={setFollowUps}
            maxFollowUps={4}
          />

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || keywords.length === 0 || publicReplyMessages.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
        <FlowEditor
          isOpen={isFlowEditorOpen}
          onClose={() => setIsFlowEditorOpen(false)}
          autoresponderData={{
            id: autoresponder.id,
            name,
            dm_message: dmMessage,
            keywords,
            is_active: true,
            use_buttons: useButtons,
            button_text: useButtons ? buttonText : undefined,
            button_type: buttonType,
            button_url: buttonType === 'web_url' ? buttonUrl : undefined,
            postback_response: buttonType === 'postback' ? postbackResponse : undefined,
            post_id: autoresponder.post_id,
            post_url: autoresponder.post_url,
            post_caption: autoresponder.post_caption,
            public_reply_messages: publicReplyMessages,
          }}
          onSave={(data) => {
            setFlowData(data);
            const nodes = data?.nodes || [];
            const button = nodes.find((n: any) => n.type === 'button')?.data || {};
            const condition = nodes.find((n: any) => n.type === 'condition')?.data || {};
            const igMsg = nodes.find((n: any) => n.type === 'instagramMessage')?.data || {};
            if (condition?.conditionKeywords) {
              setKeywords(
                condition.conditionKeywords
                  .split(',')
                  .map((k: string) => k.trim())
                  .filter(Boolean)
              );
            }
            if (button?.message !== undefined) setDmMessage(button.message);
            if (button?.buttonText !== undefined) setButtonText(button.buttonText);
            if (button?.buttonType !== undefined) setButtonType(button.buttonType === 'url' ? 'web_url' : 'postback');
            if (button?.buttonUrl !== undefined) setButtonUrl(button.buttonUrl);
            const resp = button?.postbackResponse || igMsg?.message;
            if (resp !== undefined) setPostbackResponse(resp);
            setUseButtons(!!button?.buttonText);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default EditCommentAutoresponderForm;
