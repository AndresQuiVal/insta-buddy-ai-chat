
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, MessageCircle, Cloud, Key, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import AutoresponderForm from './AutoresponderForm';
import AutoresponderTypeDialog from './AutoresponderTypeDialog';
import InstagramPostSelector from './InstagramPostSelector';
import CommentAutoresponderForm, { CommentAutoresponderConfig } from './CommentAutoresponderForm';
import { InstagramPost } from '@/services/instagramPostsService';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message: boolean;
  use_keywords: boolean;
  keywords: string[];
  created_at: string;
  type: 'message'; // Para distinguir del tipo comentario
}

interface CommentAutoresponder {
  id: string;
  name: string;
  dm_message: string; // Diferente nombre de campo
  is_active: boolean;
  keywords: string[];
  created_at: string;
  post_url: string;
  post_caption: string | null;
  type: 'comment'; // Para distinguir del tipo mensaje
}

// Tipo unificado para mostrar en la lista
type UnifiedAutoresponder = {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
  use_keywords?: boolean;
  keywords: string[];
  created_at: string;
  type: 'message' | 'comment';
  post_url?: string;
  post_caption?: string | null;
};

const AutoresponderManager = () => {
  const [messages, setMessages] = useState<UnifiedAutoresponder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoresponderMessage | null>(null);
  const [showPostSelector, setShowPostSelector] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('📋 Cargando autoresponders desde AMBAS TABLAS...');
      
      // Cargar autoresponders normales
      const { data: normalAutoresponders, error: normalError } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (normalError) {
        console.error('❌ Error cargando autoresponders normales:', normalError);
        throw normalError;
      }

      // Cargar autoresponders de comentarios
      const { data: commentAutoresponders, error: commentError } = await supabase
        .from('comment_autoresponders')
        .select('*')
        .order('created_at', { ascending: false });

      if (commentError) {
        console.error('❌ Error cargando autoresponders de comentarios:', commentError);
        throw commentError;
      }

      // Unificar ambos tipos en una sola lista
      const unifiedList: UnifiedAutoresponder[] = [
        // Autoresponders normales
        ...(normalAutoresponders || []).map((ar): UnifiedAutoresponder => ({
          id: ar.id,
          name: ar.name,
          message_text: ar.message_text,
          is_active: ar.is_active,
          send_only_first_message: ar.send_only_first_message,
          use_keywords: ar.use_keywords,
          keywords: ar.keywords || [],
          created_at: ar.created_at,
          type: 'message'
        })),
        // Autoresponders de comentarios
        ...(commentAutoresponders || []).map((ar): UnifiedAutoresponder => ({
          id: ar.id,
          name: ar.name,
          message_text: ar.dm_message, // Mapear dm_message a message_text
          is_active: ar.is_active,
          keywords: ar.keywords || [],
          created_at: ar.created_at,
          type: 'comment',
          post_url: ar.post_url,
          post_caption: ar.post_caption
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('✅ Autoresponders cargados:', {
        normales: normalAutoresponders?.length || 0,
        comentarios: commentAutoresponders?.length || 0,
        total: unifiedList.length
      });
      
      setMessages(unifiedList);
      
    } catch (error) {
      console.error('❌ Error loading autoresponders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas automáticas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean, type: 'message' | 'comment') => {
    try {
      console.log('🔄 Cambiando estado de autoresponder:', id, 'a', !currentActive, 'tipo:', type);
      
      const table = type === 'message' ? 'autoresponder_messages' : 'comment_autoresponders';
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando estado:', error);
        throw error;
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === id ? { ...msg, is_active: !currentActive } : msg
        )
      );

      console.log('✅ Estado actualizado correctamente');

      toast({
        title: "¡Actualizado!",
        description: `Respuesta automática ${!currentActive ? 'activada' : 'desactivada'}`,
      });
    } catch (error) {
      console.error('Error toggling message:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async (id: string, type: 'message' | 'comment') => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta automática?')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando autoresponder:', id, 'tipo:', type);
      
      const table = type === 'message' ? 'autoresponder_messages' : 'comment_autoresponders';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando:', error);
        throw error;
      }

      setMessages(prev => prev.filter(msg => msg.id !== id));
      
      console.log('✅ Autoresponder eliminado correctamente');

      toast({
        title: "¡Eliminado!",
        description: "Respuesta automática eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la respuesta automática",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = () => {
    loadMessages();
    setShowForm(false);
    setEditingMessage(null);
  };

  const handleNewAutoresponder = () => {
    setShowTypeDialog(true);
  };

  const handleSelectType = (type: 'comments' | 'messages') => {
    setShowTypeDialog(false);
    
    if (type === 'comments') {
      // Mostrar selector de posts para comentarios
      setShowPostSelector(true);
      return;
    }
    
    // Para mensajes directos, mostrar el formulario normal
    if (type === 'messages') {
      setShowForm(true);
    }
  };

  const handlePostSelect = (post: InstagramPost) => {
    setSelectedPost(post);
    setShowPostSelector(false);
    setShowCommentForm(true);
  };

  const handleCommentAutoresponderSubmit = async (config: CommentAutoresponderConfig) => {
    try {
      console.log('💾 Autoresponder de comentarios enviado desde formulario:', config);
      
      toast({
        title: "¡Autoresponder creado!",
        description: `Se configuró "${config.name}" para detectar comentarios`,
      });
      
      // Volver al listado principal
      setShowCommentForm(false);
      setSelectedPost(null);
      loadMessages(); // Recargar la lista para incluir autoresponders de comentarios
      
    } catch (error) {
      console.error('Error en submit de autoresponder de comentarios:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el autoresponder",
        variant: "destructive"
      });
    }
  };

  const handleBackFromSelector = () => {
    setShowPostSelector(false);
    setShowTypeDialog(true);
  };

  const handleBackFromCommentForm = () => {
    setShowCommentForm(false);
    setShowPostSelector(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si está mostrando el selector de posts
  if (showPostSelector) {
    return (
      <div className="space-y-6">
        <InstagramPostSelector
          onPostSelect={handlePostSelect}
          onBack={handleBackFromSelector}
        />
      </div>
    );
  }

  // Si está mostrando el formulario de comentarios
  if (showCommentForm && selectedPost) {
    return (
      <div className="space-y-6">
        <CommentAutoresponderForm
          selectedPost={selectedPost}
          onBack={handleBackFromCommentForm}
          onSubmit={handleCommentAutoresponderSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Autoresponder</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <p>Configura respuestas automáticas para nuevos prospectos</p>
            <Cloud className="w-4 h-4 text-green-500" />
          </div>
        </div>
        
        {/* Floating Add Button with Hover Expansion */}
        <div className="group relative">
          <Button
            onClick={handleNewAutoresponder}
            className="group-hover:w-auto w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-0 group-hover:px-4 overflow-hidden"
          >
            <Plus className="w-6 h-6 text-white flex-shrink-0" />
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-white hidden group-hover:inline">
              Agregar respuesta automática
            </span>
          </Button>
        </div>
      </div>

      <AutoresponderTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onSelectType={handleSelectType}
      />

      {showForm && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="text-purple-900">
              {editingMessage ? 'Editar Respuesta Automática' : 'Nueva Respuesta Automática'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AutoresponderForm
              message={editingMessage}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMessage(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No hay respuestas automáticas
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Crea tu primera respuesta automática para nuevos prospectos
              </p>
              <Button 
                onClick={handleNewAutoresponder}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Respuesta
              </Button>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {message.name}
                      </h3>
                      <Switch
                        checked={message.is_active}
                        onCheckedChange={() => toggleActive(message.id, message.is_active, message.type)}
                      />
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        message.is_active 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {message.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      {/* Badge para tipo */}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        message.type === 'comment'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        {message.type === 'comment' ? 'Comentarios' : 'Mensajes'}
                      </span>
                    </div>
                    
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.send_only_first_message && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Solo primer mensaje
                        </span>
                      )}
                      {message.use_keywords && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          Palabras clave
                        </span>
                      )}
                      {message.type === 'comment' && message.keywords && message.keywords.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          Palabras clave
                        </span>
                      )}
                    </div>

                    {/* Post info para autoresponders de comentarios */}
                    {message.type === 'comment' && message.post_url && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-600 font-medium mb-1">Post configurado:</p>
                            {message.post_caption && (
                              <p className="text-xs text-blue-700 mb-2 line-clamp-2">
                                {message.post_caption.length > 80 
                                  ? message.post_caption.substring(0, 80) + '...' 
                                  : message.post_caption}
                              </p>
                            )}
                            <a 
                              href={message.post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              Ver post <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message preview - hidden on mobile */}
                    {!isMobile && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 italic line-clamp-2">
                          "{message.message_text.length > 100 
                            ? message.message_text.substring(0, 100) + '...' 
                            : message.message_text}"
                        </p>
                      </div>
                    )}

                    {/* Keywords */}
                    {message.keywords && message.keywords.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {message.keywords.slice(0, 3).map((keyword, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-200"
                            >
                              {keyword}
                            </span>
                          ))}
                          {message.keywords.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-200">
                              +{message.keywords.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {message.type === 'message' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMessage(message as AutoresponderMessage);
                          setShowForm(true);
                        }}
                        className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMessage(message.id, message.type)}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AutoresponderManager;
