import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  ToggleLeft, 
  ToggleRight,
  Key,
  Send,
  Clock,
  Filter,
  Users,
  ArrowLeft
} from 'lucide-react';
import AutoresponderForm from './AutoresponderForm';
import EditAutoresponderForm from './EditAutoresponderForm';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message: boolean;
  use_keywords: boolean;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
  instagram_user_id_ref: string;
}

const AutoresponderManager = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoresponderMessage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useInstagramUsers();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['autoresponder-messages', currentUser?.instagram_user_id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('instagram_user_id_ref', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo autoresponders:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentUser?.instagram_user_id,
  });

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    queryClient.invalidateQueries({ queryKey: ['autoresponder-messages'] });
  };

  const handleEditSuccess = () => {
    setEditingMessage(null);
    queryClient.invalidateQueries({ queryKey: ['autoresponder-messages'] });
  };

  const handleToggleActive = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('autoresponder_messages')
        .update({ is_active: !currentStatus })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Autoresponder desactivado" : "Autoresponder activado",
        description: currentStatus ? "El autoresponder ya no enviará mensajes automáticos" : "El autoresponder comenzará a enviar mensajes automáticos",
      });

      queryClient.invalidateQueries({ queryKey: ['autoresponder-messages'] });
    } catch (error) {
      console.error('Error updating autoresponder:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el autoresponder",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (messageId: string, messageName: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar "${messageName}"? Esta acción no se puede deshacer.`);
    
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('autoresponder_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Autoresponder eliminado",
        description: `"${messageName}" ha sido eliminado correctamente`,
      });

      queryClient.invalidateQueries({ queryKey: ['autoresponder-messages'] });
    } catch (error) {
      console.error('Error deleting autoresponder:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el autoresponder",
        variant: "destructive"
      });
    }
  };

  if (!currentUser) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            Conecta tu cuenta de Instagram para gestionar autoresponders
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <AutoresponderForm
        onSubmit={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (editingMessage) {
    return (
      <EditAutoresponderForm
        message={editingMessage}
        onSubmit={handleEditSuccess}
        onCancel={() => setEditingMessage(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-purple-900 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Autoresponders de Mensajes Directos
              </CardTitle>
              <p className="text-sm text-purple-700 mt-1">
                Para @{currentUser.username}
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Autoresponder
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Cargando autoresponders...</span>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes autoresponders configurados
              </h3>
              <p className="text-gray-500 mb-6">
                Crea tu primer autoresponder para responder automáticamente a los mensajes directos
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Autoresponder
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.map((message) => (
                <Card key={message.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {message.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {message.is_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                <Send className="w-3 h-3 mr-1" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                            )}
                            
                            {message.send_only_first_message && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                <Users className="w-3 h-3 mr-1" />
                                Solo primer mensaje
                              </Badge>
                            )}
                            
                            {message.use_keywords && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                <Key className="w-3 h-3 mr-1" />
                                Con palabras clave
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {message.message_text}
                        </p>
                        
                        {message.use_keywords && message.keywords && message.keywords.length > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Palabras clave:</span>
                            <div className="flex flex-wrap gap-1">
                              {message.keywords.slice(0, 3).map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {message.keywords.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{message.keywords.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400">
                          Creado: {new Date(message.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(message.id, message.is_active)}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          {message.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMessage(message)}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(message.id, message.name)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoresponderManager;
