import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, MessageSquare, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import ButtonConfig from './ButtonConfig';

interface ButtonData {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
  action_type?: 'message' | 'url_redirect';
  action_data?: any;
}

interface CommentAutoresponder {
  id: string;
  post_id: string;
  post_url: string;
  post_caption?: string;
  name: string;
  keywords: string[];
  dm_message: string;
  public_reply_messages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  use_buttons?: boolean;
  buttons?: ButtonData[];
}

interface CommentAutoresponderFormProps {
  autoresponder?: CommentAutoresponder | null;
  onBack: () => void;
  onSubmit: () => void;
  selectedPost?: {
    id: string;
    permalink: string;
    caption?: string;
  } | null;
}

const CommentAutoresponderForm = ({ autoresponder, onBack, onSubmit, selectedPost }: CommentAutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [publicReplies, setPublicReplies] = useState<string[]>(['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']);
  const [newPublicReply, setNewPublicReply] = useState('');
  const [useButtons, setUseButtons] = useState(false);
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (autoresponder) {
      setName(autoresponder.name);
      setKeywords(autoresponder.keywords);
      setDmMessage(autoresponder.dm_message);
      setPublicReplies(autoresponder.public_reply_messages || ['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']);
      setUseButtons(autoresponder.use_buttons || false);
      setButtons(autoresponder.buttons || []);
    }
  }, [autoresponder]);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toLowerCase())) {
      setKeywords([...keywords, keywordInput.trim().toLowerCase()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const addPublicReply = () => {
    if (newPublicReply.trim() && !publicReplies.includes(newPublicReply.trim())) {
      setPublicReplies([...publicReplies, newPublicReply.trim()]);
      setNewPublicReply('');
    }
  };

  const removePublicReply = (index: number) => {
    if (publicReplies.length > 1) {
      setPublicReplies(publicReplies.filter((_, i) => i !== index));
    }
  };

  const updatePublicReply = (index: number, value: string) => {
    const updated = [...publicReplies];
    updated[index] = value;
    setPublicReplies(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive"
      });
      return;
    }

    if (!name.trim() || !dmMessage.trim() || keywords.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPost && !autoresponder) {
      toast({
        title: "Error",
        description: "Por favor selecciona un post",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const autoresponderData = {
        user_id: currentUser.instagram_user_id,
        post_id: autoresponder?.post_id || selectedPost?.id || '',
        post_url: autoresponder?.post_url || selectedPost?.permalink || '',
        post_caption: autoresponder?.post_caption || selectedPost?.caption || null,
        name: name.trim(),
        keywords,
        dm_message: dmMessage.trim(),
        public_reply_messages: publicReplies.filter(reply => reply.trim()),
        is_active: true,
        use_buttons: useButtons,
        buttons: useButtons && buttons.length > 0 ? buttons : null,
        updated_at: new Date().toISOString()
      };

      if (autoresponder) {
        console.log('🔄 Actualizando autoresponder de comentarios:', autoresponder.id);

        const { error } = await (supabase as any)
          .from('comment_autoresponders')
          .update(autoresponderData)
          .eq('id', autoresponder.id)
          .eq('user_id', currentUser.instagram_user_id);

        if (error) throw error;

        toast({
          title: "¡Actualizado!",
          description: "Autoresponder de comentarios actualizado exitosamente",
        });
      } else {
        console.log('➕ Creando nuevo autoresponder de comentarios');

        const { error } = await (supabase as any)
          .from('comment_autoresponders')
          .insert([autoresponderData]);

        if (error) throw error;

        toast({
          title: "¡Creado!",
          description: "Autoresponder de comentarios creado exitosamente",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('❌ Error guardando autoresponder de comentarios:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el autoresponder",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-blue-900">
              {autoresponder ? 'Editar' : 'Crear'} Autoresponder de Comentarios
            </CardTitle>
            <p className="text-sm text-blue-700 mt-1">
              Configura respuestas automáticas para un post específico
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post seleccionado */}
          {(selectedPost || autoresponder) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Post seleccionado:</h3>
              <p className="text-sm text-blue-700">
                {autoresponder?.post_caption || selectedPost?.caption || 'Post de Instagram'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ID: {autoresponder?.post_id || selectedPost?.id}
              </p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Autoresponder *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Autoresponder para post de fitness"
              required
            />
          </div>

          {/* Palabras clave */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-1" />
              Palabras Clave *
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Agregar palabra clave..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeKeyword(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {keywords.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Agrega al menos una palabra clave</p>
            )}
          </div>

          {/* Mensaje DM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Privado (DM) *
            </label>
            <Textarea
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="Escribe el mensaje que se enviará por DM cuando alguien comente..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Respuestas públicas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Respuestas Públicas
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Se enviará una respuesta aleatoria de las configuradas
            </p>
            <div className="space-y-3">
              {publicReplies.map((reply, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => updatePublicReply(index, e.target.value)}
                    placeholder={`Respuesta pública ${index + 1}`}
                  />
                  {publicReplies.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePublicReply(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newPublicReply}
                  onChange={(e) => setNewPublicReply(e.target.value)}
                  placeholder="Nueva respuesta pública..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPublicReply())}
                />
                <Button type="button" onClick={addPublicReply} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Configuración de botones */}
          <ButtonConfig
            useButtons={useButtons}
            onUseButtosChange={setUseButtons}
            buttons={buttons}
            onButtonsChange={setButtons}
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
              disabled={loading || !name.trim() || !dmMessage.trim() || keywords.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                `${autoresponder ? 'Actualizar' : 'Crear'} Autoresponder`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CommentAutoresponderForm;
