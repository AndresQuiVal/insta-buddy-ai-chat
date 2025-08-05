import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Key, MessageSquare, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import GeneralAutoresponderForm from './GeneralAutoresponderForm';

interface GeneralAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  public_reply_messages: string[];
  require_follower?: boolean;
  follower_confirmation_message?: string;
  use_button_message?: boolean;
  button_text?: string;
  button_url?: string;
  button_type?: 'web_url' | 'postback';
  postback_response?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GeneralAutoresponderManagerProps {
  onBack: () => void;
}

const GeneralAutoresponderManager = ({ onBack }: GeneralAutoresponderManagerProps) => {
  const [autoresponders, setAutoresponders] = useState<GeneralAutoresponder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAutoresponder, setEditingAutoresponder] = useState<GeneralAutoresponder | null>(null);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser) {
      loadAutoresponders();
    }
  }, [currentUser]);

  const loadAutoresponders = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('🔍 Cargando autoresponders generales para user_id:', currentUser.instagram_user_id);

      const { data, error } = await supabase
        .from('general_comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Autoresponders generales encontrados:', data?.length || 0);
      console.log('📋 Datos completos:', data);
      
      // Transformar los datos para asegurar tipos correctos
      const transformedData = data?.map(item => ({
        ...item,
        button_type: (item.button_type === 'postback' ? 'postback' : 'web_url') as 'web_url' | 'postback'
      })) || [];
      
      setAutoresponders(transformedData);
    } catch (error) {
      console.error('❌ Error cargando autoresponders generales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (autoresponder: GeneralAutoresponder) => {
    setEditingAutoresponder(autoresponder);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este autoresponder? También se eliminarán todas sus asignaciones a posts.')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando autoresponder general:', id);
      
      const { error } = await supabase
        .from('general_comment_autoresponders')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.instagram_user_id);

      if (error) throw error;

      toast({
        title: "¡Eliminado!",
        description: "Autoresponder eliminado exitosamente",
      });

      loadAutoresponders();
    } catch (error) {
      console.error('❌ Error eliminando autoresponder:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el autoresponder",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('general_comment_autoresponders')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('user_id', currentUser.instagram_user_id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Autoresponder ${!currentStatus ? 'activado' : 'desactivado'}`,
      });

      loadAutoresponders();
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const handleViewPosts = async (autoresponderID: string) => {
    try {
      console.log('🔍 Consultando posts asignados para autoresponder:', autoresponderID);
      
      const { data: assignments, error } = await supabase
        .from('post_autoresponder_assignments')
        .select('*')
        .eq('general_autoresponder_id', autoresponderID)
        .eq('user_id', currentUser?.instagram_user_id);

      if (error) {
        console.error('❌ Error consultando assignments:', error);
        throw error;
      }

      console.log('📋 Assignments encontrados:', assignments);

      const postCount = assignments?.length || 0;
      
      if (postCount === 0) {
        alert('No hay posts asignados a este autoresponder.');
        return;
      }
      
      // Crear una lista más legible de los posts
      const postList = assignments?.map((assignment, index) => {
        const caption = assignment.post_caption ? 
          (assignment.post_caption.length > 80 ? 
            assignment.post_caption.substring(0, 80) + '...' : 
            assignment.post_caption) : 
          'Sin título';
        return `${index + 1}. ${caption}\n   ID: ${assignment.post_id}`;
      }).join('\n\n') || '';
      
      alert(`Posts asignados (${postCount}):\n\n${postList}\n\n✅ Estado: ${assignments?.[0]?.is_active ? 'Activos' : 'Inactivos'}`);
    } catch (error) {
      console.error('❌ Error obteniendo posts asignados:', error);
      toast({
        title: "Error",
        description: "No se pudieron obtener los posts asignados",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingAutoresponder(null);
    loadAutoresponders();
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

  if (showForm) {
    return (
      <GeneralAutoresponderForm
        autoresponder={editingAutoresponder}
        onBack={() => {
          setShowForm(false);
          setEditingAutoresponder(null);
        }}
        onSubmit={handleFormSubmit}
      />
    );
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Cargando autoresponders...</p>
          </div>
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
              Autoresponders Generales
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Crea autoresponders reutilizables para asignar a múltiples posts
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Autoresponders ({autoresponders.length})
            </h3>
            <p className="text-sm text-gray-600">
              Para @{currentUser.username}
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Autoresponder
          </Button>
        </div>

        {autoresponders.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay autoresponders creados
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer autoresponder general para reutilizar en múltiples posts
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Autoresponder
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {autoresponders.map((autoresponder) => (
              <Card key={autoresponder.id} className="border-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${autoresponder.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <h4 className="font-semibold text-gray-900">{autoresponder.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(autoresponder.id, autoresponder.is_active)}
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
                        onClick={() => handleViewPosts(autoresponder.id)}
                        title="Ver posts asignados"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(autoresponder)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(autoresponder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mensaje DM:</p>
                      <p className="text-sm text-gray-700">{autoresponder.dm_message}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={autoresponder.is_active ? "default" : "secondary"}>
                        {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {autoresponder.public_reply_messages?.length || 1} respuestas públicas
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Key className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Palabras clave:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {autoresponder.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {autoresponder.public_reply_messages && autoresponder.public_reply_messages.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <MessageSquare className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">Respuestas públicas:</span>
                        </div>
                        <div className="space-y-1">
                          {autoresponder.public_reply_messages.slice(0, 2).map((message, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded text-xs">
                              <span className="text-green-600 font-medium">#{index + 1}</span>
                              <span className="text-gray-700 flex-1 truncate">{message}</span>
                            </div>
                          ))}
                          {autoresponder.public_reply_messages.length > 2 && (
                            <p className="text-xs text-gray-500 italic">
                              +{autoresponder.public_reply_messages.length - 2} más...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneralAutoresponderManager;
