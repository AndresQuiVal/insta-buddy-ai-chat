import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Save, MessageCircle, Key, ExternalLink, MessageSquare, UserCheck, MousePointer, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { InstagramPost, formatPostDate, truncateCaption } from '@/services/instagramPostsService';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';
import { Switch } from '@/components/ui/switch';
import { FlowEditor } from './FlowEditor';

export interface CommentAutoresponderConfig {
  name: string;
  keywords: string[];
  dmMessage: string;
  publicReplyMessages: string[];
  postId: string;
  postUrl: string;
  postCaption?: string;
}

interface CommentAutoresponderFormProps {
  selectedPost: InstagramPost;
  onBack: () => void;
  onSubmit: (config: CommentAutoresponderConfig) => void;
}

const CommentAutoresponderForm = ({ selectedPost, onBack, onSubmit }: CommentAutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>([
    '¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊'
  ]);
  const [newPublicReply, setNewPublicReply] = useState('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [requireFollower, setRequireFollower] = useState(false);
  const [useButtonMessage, setUseButtonMessage] = useState(false);

  // Desactivar botón cuando se activa require_follower
  const handleRequireFollowerChange = (checked: boolean) => {
    setRequireFollower(checked);
    if (checked) {
      setUseButtonMessage(false);
      setButtonText('');
      setButtonUrl('');
      setPostbackResponse('');
    }
  };

  // Desactivar require_follower cuando se activa useButtonMessage
  const handleUseButtonMessageChange = (checked: boolean) => {
    setUseButtonMessage(checked);
    if (checked) {
      setRequireFollower(false);
    }
  };
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonType, setButtonType] = useState<'web_url' | 'postback'>('web_url');
  const [postbackResponse, setPostbackResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const [isFlowEditorOpen, setIsFlowEditorOpen] = useState(false);
  const [flowData, setFlowData] = useState<any>(null);

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

    // Validaciones del botón
    if (useButtonMessage) {
      if (!buttonText.trim()) {
        toast({
          title: "Error",
          description: "El texto del botón es requerido",
          variant: "destructive",
        });
        return;
      }
      
      if (buttonType === 'web_url') {
        if (!buttonUrl.trim()) {
          toast({
            title: "Error", 
            description: "La URL del botón es requerida",
            variant: "destructive",
          });
          return;
        }

        // Validar formato de URL
        try {
          new URL(buttonUrl);
        } catch {
          toast({
            title: "Error",
            description: "Por favor ingresa una URL válida",
            variant: "destructive",
          });
          return;
        }
      } else if (buttonType === 'postback') {
        if (!postbackResponse.trim()) {
          toast({
            title: "Error",
            description: "La respuesta del postback es requerida",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      console.log('💾 Guardando autoresponder de comentarios para usuario:', currentUser.username);
      console.log('🆔 Usando instagram_user_id como user_id:', currentUser.instagram_user_id);

      const { data, error } = await supabase
        .from('comment_autoresponders')
        .insert({
          user_id: currentUser.instagram_user_id,
          post_id: selectedPost.id,
          post_url: selectedPost.permalink,
          post_caption: selectedPost.caption,
          name: name.trim(),
          keywords: keywords,
          dm_message: dmMessage.trim(),
          public_reply_messages: publicReplyMessages,
          require_follower: requireFollower,
          use_button_message: useButtonMessage,
          button_text: useButtonMessage ? buttonText : null,
          button_url: useButtonMessage && buttonType === 'web_url' ? buttonUrl : null,
          button_type: useButtonMessage ? buttonType : 'web_url',
          postback_response: useButtonMessage && buttonType === 'postback' ? postbackResponse : null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error guardando autoresponder:', error);
        throw error;
      }

      console.log('✅ Autoresponder de comentarios guardado exitosamente:', data);

      // Guardar follow-ups
      if (followUps.length > 0) {
        const followUpConfigs = followUps
          .filter(f => f.message_text.trim() && f.is_active)
          .map((followUp, index) => ({
            comment_autoresponder_id: data.id,
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
            // No throw, porque ya se guardó el autoresponder principal
          } else {
            console.log('✅ Follow-ups guardados:', followUpConfigs.length);
          }
        }
      }

      toast({
        title: "¡Autoresponder creado!",
        description: `Se configuró para detectar comentarios en @${currentUser.username} con ${publicReplyMessages.length} mensajes de respuesta`,
      });

      onSubmit({
        name: name.trim(),
        keywords,
        dmMessage: dmMessage.trim(),
        publicReplyMessages,
        postId: selectedPost.id,
        postUrl: selectedPost.permalink,
        postCaption: selectedPost.caption
      });

    } catch (error) {
      console.error('❌ Error creando autoresponder:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el autoresponder",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar mensaje si no hay usuario autenticado
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
              Configurar Autoresponder para Comentarios
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Detectar palabras clave en comentarios de @{currentUser.username} y enviar DM automático
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
            Post Seleccionado para @{currentUser.username}
          </h3>
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={selectedPost.thumbnail_url || selectedPost.media_url} 
                alt="Post thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">
                {formatPostDate(selectedPost.timestamp)}
              </p>
              <p className="text-sm text-gray-800 line-clamp-2">
                {truncateCaption(selectedPost.caption, 120)}
              </p>
              <a 
                href={selectedPost.permalink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-1"
              >
                Ver post <ExternalLink className="w-3 h-3" />
              </a>
            </div>
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

          {/* Configuración del Botón en DM */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200" style={{ display: 'none' }}>
            <div className="flex items-start space-x-3 mb-4">
              <Switch
                id="useButtonMessage"
                checked={useButtonMessage}
                onCheckedChange={handleUseButtonMessageChange}
                disabled={requireFollower}
              />
              <div className="flex-1">
                <label htmlFor="useButtonMessage" className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${requireFollower ? 'text-gray-500' : 'text-blue-900'}`}>
                  <MousePointer className="w-4 h-4" />
                  Incluir Botón en el DM
                </label>
                <p className={`text-xs mt-1 ${requireFollower ? 'text-gray-500' : 'text-blue-700'}`}>
                  Agregar un botón al mensaje directo que se envía
                </p>
                {requireFollower && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ No disponible cuando "Solo Enviar a Seguidores" está activado
                  </p>
                )}
              </div>
            </div>

            {useButtonMessage && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-300">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Botón</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="buttonType"
                        value="web_url"
                        checked={buttonType === 'web_url'}
                        onChange={(e) => setButtonType(e.target.value as 'web_url' | 'postback')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">URL</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="buttonType"
                        value="postback"
                        checked={buttonType === 'postback'}
                        onChange={(e) => setButtonType(e.target.value as 'web_url' | 'postback')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Postback</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="buttonText" className="text-sm font-medium text-gray-700">
                    Texto del Botón
                  </Label>
                  <Input
                    id="buttonText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Ej: Ver más información"
                    className="mt-1"
                    maxLength={20}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 20 caracteres
                  </p>
                </div>

                {buttonType === 'web_url' && (
                  <div>
                    <Label htmlFor="buttonUrl" className="text-sm font-medium text-gray-700">
                      URL del Botón
                    </Label>
                    <Input
                      id="buttonUrl"
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://ejemplo.com"
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL completa incluyendo https://
                    </p>
                  </div>
                )}

                {buttonType === 'postback' && (
                  <div>
                    <Label htmlFor="postbackResponse" className="text-sm font-medium text-gray-700">
                      Respuesta del Postback
                    </Label>
                    <Textarea
                      id="postbackResponse"
                      value={postbackResponse}
                      onChange={(e) => setPostbackResponse(e.target.value)}
                      placeholder="Mensaje que se enviará cuando el usuario haga click en el botón..."
                      className="mt-1"
                      rows={3}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este mensaje se enviará automáticamente cuando el usuario haga click en el botón
                    </p>
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
                  Crear Autoresponder
                </>
              )}
            </Button>
          </div>
        </form>
        <FlowEditor
          isOpen={isFlowEditorOpen}
          onClose={() => setIsFlowEditorOpen(false)}
          autoresponderData={{
            name,
            dm_message: dmMessage,
            keywords,
            is_active: true,
            use_button_message: useButtonMessage,
            button_text: useButtonMessage ? buttonText : undefined,
            button_type: buttonType,
            button_url: buttonType === 'web_url' ? buttonUrl : undefined,
            postback_response: buttonType === 'postback' ? postbackResponse : undefined,
            post_id: selectedPost.id,
            post_url: selectedPost.permalink,
            post_caption: selectedPost.caption,
            public_reply_messages: publicReplyMessages,
          }}
          onSave={(data) => {
            setFlowData(data);
            // Aplicar cambios del flujo al formulario
            const extract = (d: any) => {
              const nodes = d?.nodes || [];
              const button = nodes.find((n: any) => n.type === 'button')?.data || {};
              const condition = nodes.find((n: any) => n.type === 'condition')?.data || {};
              const igMsg = nodes.find((n: any) => n.type === 'instagramMessage')?.data || {};
              return { button, condition, igMsg };
            };
            const { button, condition, igMsg } = extract(data);
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
            setUseButtonMessage(!!button?.buttonText);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CommentAutoresponderForm;