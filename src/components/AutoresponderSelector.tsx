
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Check, Key, MessageSquare, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { InstagramPost } from '@/services/instagramPostsService';

interface GeneralAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  public_reply_messages: string[];
  is_active: boolean;
  created_at: string;
}

interface AutoresponderSelectorProps {
  selectedPost: InstagramPost;
  onBack: () => void;
  onCreateNew: () => void;
  onAssigned: () => void;
}

const AutoresponderSelector = ({ selectedPost, onBack, onCreateNew, onAssigned }: AutoresponderSelectorProps) => {
  const [autoresponders, setAutoresponders] = useState<GeneralAutoresponder[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
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
      console.log('🔍 Cargando autoresponders generales para selección...');

      const { data, error } = await (supabase as any)
        .from('general_comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Autoresponders disponibles:', data?.length || 0);
      setAutoresponders(data || []);
    } catch (error) {
      console.error('❌ Error cargando autoresponders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAutoresponder = async (autoresponderId: string) => {
    if (!currentUser) return;

    setAssigning(autoresponderId);

    try {
      console.log('🔗 Asignando autoresponder al post:', {
        postId: selectedPost.id,
        autoresponderId
      });

      // Verificar si ya existe una asignación para este post
      const { data: existingAssignment } = await (supabase as any)
        .from('post_autoresponder_assignments')
        .select('id')
        .eq('user_id', currentUser.instagram_user_id)
        .eq('post_id', selectedPost.id)
        .single();

      if (existingAssignment) {
        // Actualizar asignación existente
        const { error } = await (supabase as any)
          .from('post_autoresponder_assignments')
          .update({
            general_autoresponder_id: autoresponderId,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAssignment.id);

        if (error) throw error;
      } else {
        // Crear nueva asignación
        const { error } = await (supabase as any)
          .from('post_autoresponder_assignments')
          .insert([{
            user_id: currentUser.instagram_user_id,
            post_id: selectedPost.id,
            post_url: selectedPost.permalink,
            post_caption: selectedPost.caption,
            general_autoresponder_id: autoresponderId,
            is_active: true
          }]);

        if (error) throw error;
      }

      const selectedAutoresponder = autoresponders.find(a => a.id === autoresponderId);
      
      toast({
        title: "¡Autoresponder asignado!",
        description: `"${selectedAutoresponder?.name}" se asignó exitosamente al post`,
      });

      onAssigned();

    } catch (error) {
      console.error('❌ Error asignando autoresponder:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el autoresponder al post",
        variant: "destructive"
      });
    } finally {
      setAssigning(null);
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
              Seleccionar Autoresponder
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Para el post seleccionado de @{currentUser.username}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Post seleccionado */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Post Seleccionado:</h3>
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={selectedPost.thumbnail_url || selectedPost.media_url} 
                alt="Post thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">
                {selectedPost.caption?.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{selectedPost.media_type}</Badge>
                {selectedPost.like_count && (
                  <span className="text-xs text-gray-500">{selectedPost.like_count} likes</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Qué quieres hacer?
            </h3>
          </div>

          {/* Crear nuevo */}
          <Card className="border-green-200 hover:border-green-300 cursor-pointer transition-colors">
            <CardContent className="p-4">
              <Button 
                onClick={onCreateNew}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Autoresponder
              </Button>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Configura un autoresponder específico para este post
              </p>
            </CardContent>
          </Card>

          {/* Seleccionar existente */}
          {autoresponders.length > 0 ? (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                O selecciona un autoresponder existente:
              </h4>
              <div className="grid gap-3">
                {autoresponders.map((autoresponder) => (
                  <Card 
                    key={autoresponder.id} 
                    className="border-purple-200 hover:border-purple-300 cursor-pointer transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {autoresponder.name}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {autoresponder.dm_message}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAssignAutoresponder(autoresponder.id)}
                          disabled={assigning === autoresponder.id}
                          className="ml-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          {assigning === autoresponder.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Asignando...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Usar Este
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {autoresponder.public_reply_messages?.length || 1} respuestas públicas
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {autoresponder.keywords.length} palabras clave
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {autoresponder.keywords.slice(0, 3).map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {autoresponder.keywords.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{autoresponder.keywords.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-gray-300">
              <CardContent className="text-center py-6">
                <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-3">
                  No tienes autoresponders generales creados
                </p>
                <p className="text-sm text-gray-500">
                  Crea tu primer autoresponder para poder reutilizarlo en múltiples posts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoresponderSelector;
