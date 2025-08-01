import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Key,
  Clock,
  Filter,
  MessageSquare,
  Settings,
  ArrowLeft,
  Instagram,
  Globe,
  ExternalLink
} from 'lucide-react';
import AutoresponderForm from './AutoresponderForm';
import AutoresponderTypeDialog from './AutoresponderTypeDialog';
import CommentAutoresponderForm from './CommentAutoresponderForm';
import EditAutoresponderForm from './EditAutoresponderForm';
import EditCommentAutoresponderForm from './EditCommentAutoresponderForm';
import InstagramPostSelector from './InstagramPostSelector';
import GeneralAutoresponderManager from './GeneralAutoresponderManager';
import AutoresponderSelector from './AutoresponderSelector';

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
  created_at: string;
}

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

interface GeneralAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  is_active: boolean;
  public_reply_messages?: string[];
  assigned_posts?: PostAssignment[];
}

interface PostAssignment {
  id: string;
  post_id: string;
  post_url: string;
  post_caption?: string;
  is_active: boolean;
}

const AutoresponderManager: React.FC = () => {
  const [messages, setMessages] = useState<AutoresponderMessage[]>([]);
  const [commentAutoresponders, setCommentAutoresponders] = useState<CommentAutoresponder[]>([]);
  const [generalAutoresponders, setGeneralAutoresponders] = useState<GeneralAutoresponder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showPostSelector, setShowPostSelector] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEditCommentForm, setShowEditCommentForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingMessage, setEditingMessage] = useState<AutoresponderMessage | null>(null);
  const [editingCommentAutoresponder, setEditingCommentAutoresponder] = useState<CommentAutoresponder | null>(null);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const [showGeneralManager, setShowGeneralManager] = useState(false);
  const [showAutoresponderSelector, setShowAutoresponderSelector] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      fetchCommentAutoresponders();
      fetchGeneralAutoresponders();
    }
  }, [currentUser]);

  const fetchMessages = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('🔍 Cargando autoresponders para usuario:', currentUser.username);

      const { data, error } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('instagram_user_id_ref', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando autoresponders:', error);
        throw error;
      }

      console.log('✅ Autoresponders cargados:', data?.length || 0);
      console.log('🔍 Datos de autoresponders:', data);
      
      // Verificar si hay alguno con botones configurados
      data?.forEach((autoresponder, index) => {
        if (autoresponder.use_buttons || autoresponder.buttons) {
          console.log(`🔍 Autoresponder ${index} tiene botones:`, {
            id: autoresponder.id,
            name: autoresponder.name,
            use_buttons: autoresponder.use_buttons,
            buttons: autoresponder.buttons
          });
        }
      });
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentAutoresponders = async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔍 Cargando autoresponders de comentarios...');
      console.log('🆔 Buscando por user_id:', currentUser.instagram_user_id);

      const { data, error } = await supabase
        .from('comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando autoresponders de comentarios:', error);
        throw error;
      }

      console.log('✅ Autoresponders de comentarios cargados:', data?.length || 0);
      setCommentAutoresponders(data || []);
    } catch (error) {
      console.error('Error fetching comment autoresponders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders de comentarios",
        variant: "destructive"
      });
    }
  };

  const fetchGeneralAutoresponders = async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔍 Cargando autoresponders generales...');

      const { data: generalData, error: generalError } = await supabase
        .from('general_comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (generalError) throw generalError;

      // Cargar asignaciones de posts para autoresponders generales
      const { data: postAssignments, error: assignmentsError } = await supabase
        .from('post_autoresponder_assignments')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id);

      if (assignmentsError) throw assignmentsError;

      // Combinar autoresponders generales con sus asignaciones
      const generalsWithAssignments = generalData.map(general => ({
        ...general,
        assigned_posts: postAssignments.filter(
          assignment => assignment.general_autoresponder_id === general.id
        )
      }));

      console.log('✅ Autoresponders generales cargados:', generalsWithAssignments.length);
      setGeneralAutoresponders(generalsWithAssignments);
    } catch (error) {
      console.error('❌ Error cargando autoresponders generales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders generales",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = () => {
    setShowForm(false);
    setEditingMessage(null);
    fetchMessages();
  };

  const handleEdit = (message: AutoresponderMessage) => {
    console.log('🔧 Editando autoresponder:', message);
    console.log('🔧 use_buttons:', message.use_buttons);
    console.log('🔧 buttons:', message.buttons);
    setEditingMessage(message);
    setShowEditForm(true);
  };

  const handleEditCommentAutoresponder = (autoresponder: CommentAutoresponder) => {
    setEditingCommentAutoresponder(autoresponder);
    setShowEditCommentForm(true);
  };

  const handleEditSubmit = () => {
    setShowEditForm(false);
    setEditingMessage(null);
    fetchMessages();
  };

  const handleEditCommentSubmit = () => {
    setShowEditCommentForm(false);
    setEditingCommentAutoresponder(null);
    fetchCommentAutoresponders();
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('¿Estás seguro de eliminar este autoresponder?')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando autoresponder:', messageId);
      console.log('👤 Usuario actual:', currentUser?.instagram_user_id);
      
      // Primero verificar que el autoresponder pertenece al usuario actual
      const { data: autoresponder, error: fetchError } = await supabase
        .from('autoresponder_messages')
        .select('id, instagram_user_id_ref')
        .eq('id', messageId)
        .eq('instagram_user_id_ref', currentUser.instagram_user_id)
        .single();

      if (fetchError) {
        console.error('❌ Error verificando autoresponder:', fetchError);
        throw new Error('No se pudo verificar el autoresponder');
      }

      if (!autoresponder) {
        throw new Error('Autoresponder no encontrado o no tienes permisos');
      }

      // Eliminar primero los logs relacionados para evitar conflictos de foreign key
      const { error: logError } = await supabase
        .from('autoresponder_sent_log')
        .delete()
        .eq('autoresponder_message_id', messageId);

      if (logError) {
        console.warn('⚠️ Error eliminando logs de autoresponder (continuando):', logError);
      }

      // Ahora eliminar el autoresponder
      const { error } = await supabase
        .from('autoresponder_messages')
        .delete()
        .eq('id', messageId)
        .eq('instagram_user_id_ref', currentUser.instagram_user_id);

      if (error) {
        console.error('❌ Error eliminando:', error);
        throw error;
      }

      console.log('✅ Autoresponder eliminado exitosamente');
      toast({
        title: "¡Eliminado!",
        description: "Autoresponder eliminado exitosamente",
      });

      fetchMessages();
    } catch (error) {
      console.error('Error deleting autoresponder:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el autoresponder",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCommentAutoresponder = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este autoresponder de comentarios?')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando autoresponder de comentarios:', id);
      console.log('👤 Usuario actual:', currentUser?.instagram_user_id);
      
      // Primero verificar que el autoresponder pertenece al usuario actual
      const { data: autoresponder, error: fetchError } = await supabase
        .from('comment_autoresponders')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', currentUser.instagram_user_id)
        .single();

      if (fetchError) {
        console.error('❌ Error verificando autoresponder de comentarios:', fetchError);
        throw new Error('No se pudo verificar el autoresponder de comentarios');
      }

      if (!autoresponder) {
        throw new Error('Autoresponder de comentarios no encontrado o no tienes permisos');
      }

      // Eliminar primero los logs relacionados para evitar conflictos de foreign key
      const { error: logError } = await supabase
        .from('comment_autoresponder_log')
        .delete()
        .eq('comment_autoresponder_id', id);

      if (logError) {
        console.warn('⚠️ Error eliminando logs (continuando):', logError);
      }

      // Ahora eliminar el autoresponder
      const { error } = await supabase
        .from('comment_autoresponders')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.instagram_user_id);

      if (error) {
        console.error('❌ Error eliminando autoresponder de comentarios:', error);
        throw error;
      }

      console.log('✅ Autoresponder de comentarios eliminado exitosamente');
      toast({
        title: "¡Eliminado!",
        description: "Autoresponder de comentarios eliminado exitosamente",
      });

      fetchCommentAutoresponders();
    } catch (error) {
      console.error('Error deleting comment autoresponder:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el autoresponder de comentarios",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('autoresponder_messages')
        .update({ is_active: !currentStatus })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Autoresponder ${!currentStatus ? 'activado' : 'desactivado'}`,
      });

      fetchMessages();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const toggleCommentAutoresponderActive = async (id: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Cambiando estado del autoresponder de comentarios:', id);
      console.log('👤 Usuario actual:', currentUser?.instagram_user_id);
      
      const { error } = await supabase
        .from('comment_autoresponders')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('user_id', currentUser.instagram_user_id); // Verificación adicional de seguridad

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Autoresponder de comentarios ${!currentStatus ? 'activado' : 'desactivado'}`,
      });

      fetchCommentAutoresponders();
    } catch (error) {
      console.error('Error toggling comment autoresponder:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const handleTypeSelection = (type: 'comments' | 'messages') => {
    setShowTypeDialog(false);
    
    if (type === 'comments') {
      // Ir directamente al selector de posts para comentarios
      setShowPostSelector(true);
    } else {
      setShowForm(true);
    }
  };

  const handlePostSelected = (post: any) => {
    setSelectedPost(post);
    setShowPostSelector(false);
    setShowAutoresponderSelector(true);
  };

  const handleAutoresponderAssigned = () => {
    setShowAutoresponderSelector(false);
    setSelectedPost(null);
    fetchCommentAutoresponders();
  };

  const handleCreateNewFromSelector = () => {
    setShowAutoresponderSelector(false);
    setShowCommentForm(true);
  };

  const handleCommentAutoresponderSubmit = () => {
    setShowCommentForm(false);
    setSelectedPost(null);
    fetchCommentAutoresponders();
  };

  const handleBackFromCommentForm = () => {
    setShowCommentForm(false);
    setSelectedPost(null);
    setShowAutoresponderSelector(true);
  };

  const handleBackFromSelector = () => {
    setShowAutoresponderSelector(false);
    setSelectedPost(null);
    setShowPostSelector(true);
  };

  if (!currentUser) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay usuario de Instagram autenticado
          </h3>
          <p className="text-gray-600 text-center">
            Debes conectar tu cuenta de Instagram para gestionar autoresponders
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showEditForm && editingMessage) {
    return (
      <EditAutoresponderForm
        message={editingMessage}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          setShowEditForm(false);
          setEditingMessage(null);
        }}
      />
    );
  }

  if (showEditCommentForm && editingCommentAutoresponder) {
    return (
      <EditCommentAutoresponderForm
        autoresponder={editingCommentAutoresponder}
        onBack={() => {
          setShowEditCommentForm(false);
          setEditingCommentAutoresponder(null);
        }}
        onSubmit={handleEditCommentSubmit}
      />
    );
  }

  if (showPostSelector) {
    return (
      <InstagramPostSelector
        onPostSelected={handlePostSelected}
        onBack={() => {
          setShowPostSelector(false);
          setShowTypeDialog(true);
        }}
        showAutoresponderSelection={true}
      />
    );
  }

  if (showAutoresponderSelector && selectedPost) {
    return (
      <AutoresponderSelector
        selectedPost={selectedPost}
        onBack={handleBackFromSelector}
        onCreateNew={handleCreateNewFromSelector}
        onAssigned={handleAutoresponderAssigned}
      />
    );
  }

  if (showCommentForm && selectedPost) {
    return (
      <CommentAutoresponderForm
        selectedPost={selectedPost}
        onBack={handleBackFromCommentForm}
        onSubmit={handleCommentAutoresponderSubmit}
      />
    );
  }

  if (showForm) {
    return (
      <AutoresponderForm
        message={editingMessage}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingMessage(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando autoresponders...</p>
        </div>
      </div>
    );
  }

  const totalAutoresponders = messages.length + commentAutoresponders.length + generalAutoresponders.length;

  if (showGeneralManager) {
    return (
      <GeneralAutoresponderManager 
        onBack={() => setShowGeneralManager(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AutoresponderTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onSelectType={handleTypeSelection}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold">Autoresponders</h2>
            <p className="text-sm text-gray-600">
              Para @{currentUser.username} ({totalAutoresponders} total)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowGeneralManager(true)}
            variant="outline"
            className="text-purple-600 hover:text-purple-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Gestionar Generales
          </Button>
          <Button 
            onClick={() => setShowTypeDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Autoresponder
          </Button>
        </div>
      </div>

      {totalAutoresponders > 0 && (
        <div className="space-y-6">
          {messages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                Mensajes Directos / Stories ({messages.length})
              </h3>
              <div className="grid gap-4">
                {messages.map((message) => (
                  <Card key={message.id} className="border-purple-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${message.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{message.name}</h4>
                            <p className="text-xs text-gray-500">
                              Mensaje directo
                              {message.use_keywords ? ' • Con palabras clave' : ' • Sin palabras clave'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={message.is_active ? "default" : "secondary"} className="text-xs">
                            {message.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(message.id, message.is_active)}
                          >
                            {message.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(message)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(message.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {commentAutoresponders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Instagram className="w-5 h-5 text-orange-500" />
                Posts Específicos ({commentAutoresponders.length})
              </h3>
              <div className="grid gap-4">
                {commentAutoresponders.map((autoresponder) => (
                  <Card key={autoresponder.id} className="border-orange-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${autoresponder.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{autoresponder.name}</h4>
                            <a 
                              href={autoresponder.post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Ver post configurado →
                            </a>
                            <p className="text-xs text-gray-500">{autoresponder.keywords.length} palabras clave</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={autoresponder.is_active ? "default" : "secondary"} className="text-xs">
                            {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCommentAutoresponderActive(autoresponder.id, autoresponder.is_active)}
                          >
                            {autoresponder.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCommentAutoresponder(autoresponder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCommentAutoresponder(autoresponder.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {generalAutoresponders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Generales ({generalAutoresponders.length})
              </h3>
              <div className="grid gap-4">
                {generalAutoresponders.map((autoresponder) => (
                  <Card key={autoresponder.id} className="border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${autoresponder.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{autoresponder.name}</h4>
                            <p className="text-sm text-gray-600">Autoresponder general</p>
                            <p className="text-xs text-gray-500">
                              {autoresponder.keywords.length} palabras clave
                              {autoresponder.assigned_posts && autoresponder.assigned_posts.length > 0 && 
                                ` • ${autoresponder.assigned_posts.length} posts asignados`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={autoresponder.is_active ? "default" : "secondary"} className="text-xs">
                            {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {totalAutoresponders === 0 && (
        <Card className="border-dashed border-purple-300 bg-purple-50">
          <CardContent className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay autoresponders
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer autoresponder para comenzar a responder automáticamente
            </p>
            <Button 
              onClick={() => setShowTypeDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Autoresponder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoresponderManager;
