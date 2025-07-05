
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  MessageSquare, 
  Key, 
  Globe, 
  Instagram,
  Settings,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface DirectMessageAutoresponder {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  send_only_first_message?: boolean;
  use_keywords?: boolean;
  keywords?: string[];
  type: 'direct_message';
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
  public_reply_messages?: string[];
  type: 'comment_specific';
}

interface GeneralAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  is_active: boolean;
  public_reply_messages?: string[];
  type: 'general';
  assigned_posts?: PostAssignment[];
}

interface PostAssignment {
  id: string;
  post_id: string;
  post_url: string;
  post_caption?: string;
  is_active: boolean;
}

type AllAutoresponder = DirectMessageAutoresponder | CommentAutoresponder | GeneralAutoresponder;

const AllAutorespondersList = () => {
  const [autoresponders, setAutoresponders] = useState<AllAutoresponder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser) {
      loadAllAutoresponders();
    }
  }, [currentUser]);

  const loadAllAutoresponders = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('🔍 Cargando todos los autoresponders...');

      // Cargar autoresponders de mensajes directos
      const { data: directMessages, error: dmError } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('instagram_user_id_ref', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (dmError) throw dmError;

      // Cargar autoresponders de comentarios específicos
      const { data: commentAutoresponders, error: commentError } = await supabase
        .from('comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      if (commentError) throw commentError;

      // Cargar autoresponders generales con sus asignaciones
      const { data: generalAutoresponders, error: generalError } = await supabase
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

      // Combinar todos los autoresponders
      const allAutoresponders: AllAutoresponder[] = [
        // Mensajes directos
        ...directMessages.map(dm => ({
          ...dm,
          type: 'direct_message' as const
        })),
        // Comentarios específicos
        ...commentAutoresponders.map(comment => ({
          ...comment,
          type: 'comment_specific' as const
        })),
        // Generales con sus asignaciones
        ...generalAutoresponders.map(general => ({
          ...general,
          type: 'general' as const,
          assigned_posts: postAssignments.filter(
            assignment => assignment.general_autoresponder_id === general.id
          )
        }))
      ];

      console.log('✅ Todos los autoresponders cargados:', allAutoresponders.length);
      setAutoresponders(allAutoresponders);
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

  const toggleAutoresponderActive = async (autoresponder: AllAutoresponder) => {
    try {
      let updatePromise;

      switch (autoresponder.type) {
        case 'direct_message':
          updatePromise = supabase
            .from('autoresponder_messages')
            .update({ is_active: !autoresponder.is_active })
            .eq('id', autoresponder.id)
            .eq('instagram_user_id_ref', currentUser.instagram_user_id);
          break;
        case 'comment_specific':
          updatePromise = supabase
            .from('comment_autoresponders')
            .update({ is_active: !autoresponder.is_active })
            .eq('id', autoresponder.id)
            .eq('user_id', currentUser.instagram_user_id);
          break;
        case 'general':
          updatePromise = supabase
            .from('general_comment_autoresponders')
            .update({ is_active: !autoresponder.is_active })
            .eq('id', autoresponder.id)
            .eq('user_id', currentUser.instagram_user_id);
          break;
        default:
          throw new Error('Tipo de autoresponder no válido');
      }

      const { error } = await updatePromise;
      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Autoresponder ${!autoresponder.is_active ? 'activado' : 'desactivado'}`,
      });

      loadAllAutoresponders();
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const getAutoresponderIcon = (type: string) => {
    switch (type) {
      case 'direct_message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'comment_specific':
        return <Instagram className="w-5 h-5 text-orange-500" />;
      case 'general':
        return <Globe className="w-5 h-5 text-blue-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAutoresponderTypeName = (type: string) => {
    switch (type) {
      case 'direct_message':
        return 'Mensajes Directos';
      case 'comment_specific':
        return 'Post Específico';
      case 'general':
        return 'General';
      default:
        return 'Desconocido';
    }
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
            Debes conectar tu cuenta de Instagram para ver tus autoresponders
          </p>
        </CardContent>
      </Card>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold">Mis Autoresponders</h2>
            <p className="text-sm text-gray-600">
              Todos los autoresponders configurados para @{currentUser.username} ({autoresponders.length} total)
            </p>
          </div>
        </div>
      </div>

      {autoresponders.length === 0 ? (
        <Card className="border-dashed border-purple-300 bg-purple-50">
          <CardContent className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes autoresponders configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Ve a la pestaña "Gestionar" para crear tu primer autoresponder
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {autoresponders.map((autoresponder) => (
            <Card key={`${autoresponder.type}-${autoresponder.id}`} className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${autoresponder.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {getAutoresponderIcon(autoresponder.type)}
                    <div>
                      <CardTitle className="text-lg">{autoresponder.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {getAutoresponderTypeName(autoresponder.type)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAutoresponderActive(autoresponder)}
                  >
                    {autoresponder.is_active ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Mensaje */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {autoresponder.type === 'direct_message' ? 'Mensaje:' : 'Mensaje DM:'}
                    </p>
                    <p className="text-gray-700">
                      {autoresponder.type === 'direct_message' 
                        ? (autoresponder as DirectMessageAutoresponder).message_text
                        : autoresponder.dm_message}
                    </p>
                  </div>
                  
                  {/* Estados y configuraciones */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={autoresponder.is_active ? "default" : "secondary"}>
                      {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    
                    {autoresponder.type === 'direct_message' && 
                     (autoresponder as DirectMessageAutoresponder).send_only_first_message && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Solo primer mensaje
                      </Badge>
                    )}
                    
                    {(autoresponder.type === 'comment_specific' || autoresponder.type === 'general') &&
                     autoresponder.public_reply_messages && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {autoresponder.public_reply_messages.length} respuestas públicas
                      </Badge>
                    )}
                  </div>

                  {/* Palabras clave */}
                  {autoresponder.keywords && autoresponder.keywords.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1 mb-2">
                        <Key className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Palabras clave:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {autoresponder.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded ${
                              autoresponder.type === 'direct_message' 
                                ? 'bg-purple-100 text-purple-700'
                                : autoresponder.type === 'comment_specific'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts asignados para autoresponders generales */}
                  {autoresponder.type === 'general' && 
                   (autoresponder as GeneralAutoresponder).assigned_posts && 
                   (autoresponder as GeneralAutoresponder).assigned_posts!.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1 mb-2">
                        <Instagram className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Asignado a {(autoresponder as GeneralAutoresponder).assigned_posts!.length} post(s):
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(autoresponder as GeneralAutoresponder).assigned_posts!.slice(0, 3).map((assignment, index) => (
                          <div key={assignment.id} className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${assignment.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <a 
                              href={assignment.post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              Post #{index + 1}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                        {(autoresponder as GeneralAutoresponder).assigned_posts!.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{(autoresponder as GeneralAutoresponder).assigned_posts!.length - 3} más...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* URL del post para autoresponders específicos */}
                  {autoresponder.type === 'comment_specific' && (
                    <div className="pt-2 text-xs text-gray-500">
                      <a 
                        href={(autoresponder as CommentAutoresponder).post_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Ver post configurado
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllAutorespondersList;
