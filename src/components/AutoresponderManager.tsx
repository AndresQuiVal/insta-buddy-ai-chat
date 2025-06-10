
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, MessageCircle, Cloud, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AutoresponderForm from './AutoresponderForm';

interface AutoresponderMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  created_at: string;
}

const AutoresponderManager = () => {
  const [messages, setMessages] = useState<AutoresponderMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoresponderMessage | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'localStorage'>('database');
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const localMessages = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
      setMessages(localMessages);
      setDataSource('localStorage');
      console.log('📱 Cargado desde localStorage:', localMessages.length, 'mensajes');
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setMessages([]);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMessages(data || []);
      setDataSource('database');
      console.log('☁️ Cargado desde base de datos:', data?.length || 0, 'mensajes');
      
    } catch (error) {
      console.error('Error loading from database, fallback to localStorage:', error);
      loadFromLocalStorage();
      toast({
        title: "Modo sin conexión",
        description: "Cargando datos desde tu navegador",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('autoresponder_messages')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === id ? { ...msg, is_active: !currentActive } : msg
        )
      );

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

  const deleteMessage = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta automática?')) {
      return;
    }

    try {
      if (dataSource === 'database') {
        const { error } = await supabase
          .from('autoresponder_messages')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // También eliminar de localStorage
      const localMessages = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
      const updatedLocal = localMessages.filter((msg: any) => msg.id !== id);
      localStorage.setItem('autoresponder-messages', JSON.stringify(updatedLocal));

      setMessages(prev => prev.filter(msg => msg.id !== id));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
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
            <div className="flex items-center gap-1 text-sm">
              {dataSource === 'database' ? (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Sincronizado</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600">Local</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Respuesta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMessage ? 'Editar Respuesta Automática' : 'Nueva Respuesta Automática'}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay respuestas automáticas
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Crea tu primera respuesta automática para nuevos prospectos
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Respuesta
              </Button>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {message.name}
                      </h3>
                      <Switch
                        checked={message.is_active}
                        onCheckedChange={() => toggleActive(message.id, message.is_active)}
                      />
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        message.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {message.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">
                      {message.message_text}
                    </p>
                    <p className="text-sm text-gray-500">
                      Creada el {new Date(message.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMessage(message);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMessage(message.id)}
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
