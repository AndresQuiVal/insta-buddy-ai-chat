
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
  Filter
} from 'lucide-react';
import AutoresponderForm from './AutoresponderForm';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
  use_keywords?: boolean;
  keywords?: string[];
  created_at: string;
}

const AutoresponderManager: React.FC = () => {
  const [messages, setMessages] = useState<AutoresponderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoresponderMessage | null>(null);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
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

  const handleSubmit = () => {
    setShowForm(false);
    setEditingMessage(null);
    fetchMessages();
  };

  const handleEdit = (message: AutoresponderMessage) => {
    setEditingMessage(message);
    setShowForm(true);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('¿Estás seguro de eliminar este autoresponder?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('autoresponder_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "¡Eliminado!",
        description: "Autoresponder eliminado exitosamente",
      });

      fetchMessages();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el autoresponder",
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

  // Mostrar mensaje si no hay usuario autenticado
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold">Autoresponders</h2>
            <p className="text-sm text-gray-600">
              Para @{currentUser.username}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Autoresponder
        </Button>
      </div>

      {/* Lista de autoresponders */}
      <div className="grid gap-4">
        {messages.map((message) => (
          <Card key={message.id} className="border-purple-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${message.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <CardTitle className="text-lg">{message.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-700">{message.message_text}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={message.is_active ? "default" : "secondary"}>
                    {message.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  
                  {message.send_only_first_message && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Solo primer mensaje
                    </Badge>
                  )}
                  
                  {message.use_keywords && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Con palabras clave
                    </Badge>
                  )}
                </div>

                {message.use_keywords && message.keywords && message.keywords.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1 mb-2">
                      <Key className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">Palabras clave:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {message.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card className="border-dashed border-purple-300 bg-purple-50">
          <CardContent className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay autoresponders
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer autoresponder para comenzar a responder automáticamente a tus DMs
            </p>
            <Button 
              onClick={() => setShowForm(true)}
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
