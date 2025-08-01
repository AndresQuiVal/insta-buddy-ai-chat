import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Instagram,
  Link,
  Zap
} from 'lucide-react';

interface CommentAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  post_caption?: string;
  is_active: boolean;
  use_button_message?: boolean;
  button_text?: string;
  button_type?: string;
  button_url?: string;
  postback_response?: string;
  // Para distinguir el tipo
  type?: 'specific' | 'general';
  post_id?: string;
  post_url?: string;
}

interface DirectMessage {
  id: string;
  name: string;
  message_text: string;
  is_active: boolean;
  keywords?: string[];
}

const SimpleAutoresponderManager: React.FC = () => {
  const [commentAutoresponders, setCommentAutoresponders] = useState<CommentAutoresponder[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch comment autoresponders (específicos)
      const { data: commentData } = await supabase
        .from('comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      // Fetch general comment autoresponders
      const { data: generalData } = await supabase
        .from('general_comment_autoresponders')
        .select('*')
        .eq('user_id', currentUser.instagram_user_id)
        .order('created_at', { ascending: false });

      // Fetch direct message autoresponders
      const { data: messageData } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('instagram_user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Combinar autoresponders específicos y generales
      const allCommentAutoresponders = [
        ...(commentData || []).map(item => ({ ...item, type: 'specific' as const })),
        ...(generalData || []).map(item => ({ ...item, type: 'general' as const }))
      ];

      setCommentAutoresponders(allCommentAutoresponders);
      setDirectMessages(messageData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los autoresponders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentActive = async (id: string, currentStatus: boolean, type?: 'specific' | 'general') => {
    try {
      const tableName = type === 'general' ? 'general_comment_autoresponders' : 'comment_autoresponders';
      
      await supabase
        .from(tableName)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      setCommentAutoresponders(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_active: !currentStatus } : item
        )
      );

      toast({
        title: "Estado actualizado",
        description: `Autoresponder ${!currentStatus ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const toggleMessageActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('autoresponder_messages')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      setDirectMessages(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_active: !currentStatus } : item
        )
      );

      toast({
        title: "Estado actualizado",
        description: `Autoresponder ${!currentStatus ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando autoresponders...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center p-12">
        <Instagram className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Conecta tu cuenta de Instagram</h3>
        <p className="text-muted-foreground">
          Para gestionar autoresponders necesitas conectar tu cuenta de Instagram
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Autoresponders</h1>
          <p className="text-muted-foreground">
            Respuestas automáticas para @{currentUser.username}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Crear Nuevo
        </Button>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Comentarios ({commentAutoresponders.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <Zap className="w-4 h-4" />
            Mensajes Directos ({directMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          {commentAutoresponders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sin autoresponders de comentarios</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea respuestas automáticas para comentarios en tus posts
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Autoresponder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {commentAutoresponders.map((autoresponder) => (
                <Card key={autoresponder.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{autoresponder.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={autoresponder.type === 'general' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {autoresponder.type === 'general' ? 'General' : 'Específico'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {autoresponder.keywords.length} palabras clave
                          </Badge>
                          {autoresponder.use_button_message && (
                            <Badge variant="outline" className="text-xs gap-1">
                              {autoresponder.button_type === 'web_url' ? (
                                <>
                                  <Link className="w-3 h-3" />
                                  Botón URL
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  Botón Postback
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <Switch
                            checked={autoresponder.is_active}
                            onCheckedChange={() => toggleCommentActive(autoresponder.id, autoresponder.is_active, autoresponder.type)}
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Palabras clave:</p>
                        <div className="flex flex-wrap gap-1">
                          {autoresponder.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Mensaje privado:</p>
                        <p className="text-sm bg-muted p-2 rounded text-muted-foreground line-clamp-2">
                          {autoresponder.dm_message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {directMessages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sin autoresponders de mensajes</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea respuestas automáticas para mensajes directos y stories
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Autoresponder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {directMessages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{message.name}</CardTitle>
                        {message.keywords && message.keywords.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {message.keywords.length} palabras clave
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {message.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <Switch
                            checked={message.is_active}
                            onCheckedChange={() => toggleMessageActive(message.id, message.is_active)}
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Mensaje:</p>
                      <p className="text-sm bg-muted p-2 rounded text-muted-foreground line-clamp-2">
                        {message.message_text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleAutoresponderManager;