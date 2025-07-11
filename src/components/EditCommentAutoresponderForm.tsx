
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Save, MessageCircle, Key, ExternalLink, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';

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
}

interface EditCommentAutoresponderFormProps {
  autoresponder: CommentAutoresponder;
  onBack: () => void;
  onSubmit: () => void;
}

const EditCommentAutoresponderForm = ({ autoresponder, onBack, onSubmit }: EditCommentAutoresponderFormProps) => {
  const [name, setName] = useState(autoresponder.name);
  const [keywords, setKeywords] = useState<string[]>(autoresponder.keywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [dmMessage, setDmMessage] = useState(autoresponder.dm_message);
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>(
    autoresponder.public_reply_messages || ['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']
  );
  const [newPublicReply, setNewPublicReply] = useState('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  // Cargar follow-ups existentes al montar el componente
  useEffect(() => {
    loadFollowUps();
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

    setIsSubmitting(true);

    try {
      console.log('🔄 Actualizando autoresponder de comentarios:', autoresponder.id);

      const { error } = await supabase
        .from('comment_autoresponders')
        .update({
          name: name.trim(),
          keywords: keywords,
          dm_message: dmMessage.trim(),
          public_reply_messages: publicReplyMessages,
        })
        .eq('id', autoresponder.id)
        .eq('user_id', currentUser.instagram_user_id);

      if (error) {
        console.error('❌ Error actualizando autoresponder:', error);
        throw error;
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
      </CardContent>
    </Card>
  );
};

export default EditCommentAutoresponderForm;
