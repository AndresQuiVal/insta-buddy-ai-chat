
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Save, MessageCircle, Key, ExternalLink, MessageSquare, UserCheck, MousePointer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { InstagramPost, formatPostDate, truncateCaption } from '@/services/instagramPostsService';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';
import { Switch } from '@/components/ui/switch';

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
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

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
    if (useButtonMessage) {
      if (!buttonText.trim()) {
        toast({
          title: "Error",
          description: "El texto del botón es requerido cuando usas mensaje con botón",
          variant: "destructive"
        });
        return;
      }
      
      if (!buttonUrl.trim()) {
        toast({
          title: "Error", 
          description: "La URL del botón es requerida cuando usas mensaje con botón",
          variant: "destructive"
        });
        return;
      }

      // Validar que la URL sea válida
      try {
        new URL(buttonUrl);
      } catch {
        toast({
          title: "Error",
          description: "Por favor ingresa una URL válida para el botón",
          variant: "destructive"
        });
        return;
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
          button_text: useButtonMessage ? buttonText.trim() : null,
          button_url: useButtonMessage ? buttonUrl.trim() : null,
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

          {/* Configuración de Botón en DM */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3 mb-4">
              <Switch
                id="useButtonMessage"
                checked={useButtonMessage}
                onCheckedChange={setUseButtonMessage}
              />
              <div className="flex-1">
                <label htmlFor="useButtonMessage" className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Enviar mensaje DM con botón interactivo
                </label>
                <p className="text-xs text-blue-700 mt-1">
                  Si está activado, el DM incluirá un botón que el usuario puede presionar para ir a una URL específica
                </p>
              </div>
            </div>

            {useButtonMessage && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-300">
                <div>
                  <Label htmlFor="buttonText" className="text-sm font-medium text-blue-900">
                    Texto del Botón
                  </Label>
                  <Input
                    id="buttonText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Ej: Ver más información"
                    className="mt-1"
                    maxLength={20}
                    required={useButtonMessage}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    {buttonText.length}/20 caracteres (máximo 20)
                  </p>
                </div>

                <div>
                  <Label htmlFor="buttonUrl" className="text-sm font-medium text-blue-900">
                    URL del Botón
                  </Label>
                  <Input
                    id="buttonUrl"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://tu-landing-page.com"
                    className="mt-1"
                    type="url"
                    required={useButtonMessage}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Debe ser una URL completa que comience con https://
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verificar seguidor */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-3">
              <Switch
                id="requireFollower"
                checked={requireFollower}
                onCheckedChange={setRequireFollower}
              />
              <div className="flex-1">
                <label htmlFor="requireFollower" className="text-sm font-medium text-yellow-900 cursor-pointer flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Solo enviar mensaje a usuarios que me siguen
                </label>
                <p className="text-xs text-yellow-700 mt-1">
                  Si está activado, solo se enviará el mensaje DM a usuarios que sigan tu cuenta de Instagram. 
                  Los usuarios que no te siguen no recibirán ningún mensaje.
                </p>
              </div>
            </div>
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
      </CardContent>
    </Card>
  );
};

export default CommentAutoresponderForm;
