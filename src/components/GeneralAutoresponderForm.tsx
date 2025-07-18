import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, X, MessageSquare, Key, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { getInstagramPosts } from '@/services/instagramPostsService';
import FollowUpConfig, { FollowUp } from './FollowUpConfig';

interface GeneralAutoresponder {
  id: string;
  name: string;
  keywords: string[];
  dm_message: string;
  public_reply_messages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GeneralAutoresponderFormProps {
  autoresponder?: GeneralAutoresponder | null;
  onBack: () => void;
  onSubmit: () => void;
}

const GeneralAutoresponderForm = ({ autoresponder, onBack, onSubmit }: GeneralAutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [publicReplies, setPublicReplies] = useState<string[]>(['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']);
  const [newPublicReply, setNewPublicReply] = useState('');
  const [applyToAllPosts, setApplyToAllPosts] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (autoresponder) {
      setName(autoresponder.name);
      setKeywords(autoresponder.keywords);
      setDmMessage(autoresponder.dm_message);
      setPublicReplies(autoresponder.public_reply_messages || ['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊']);
      
      // Cargar follow-ups existentes
      loadFollowUps(autoresponder.id);
    }
  }, [autoresponder]);

  const loadFollowUps = async (generalAutoresponderID: string) => {
    try {
      const { data: followUpConfigs, error } = await supabase
        .from('autoresponder_followup_configs')
        .select('*')
        .eq('general_autoresponder_id', generalAutoresponderID)
        .order('sequence_order');

      if (error) {
        console.error('❌ Error cargando follow-ups:', error);
        return;
      }

      if (followUpConfigs) {
        const followUpsData: FollowUp[] = followUpConfigs.map(config => ({
          id: config.id,
          delay_hours: config.delay_hours,
          message_text: config.message_text,
          is_active: config.is_active
        }));
        
        setFollowUps(followUpsData);
      }
    } catch (error) {
      console.error('❌ Error cargando follow-ups:', error);
    }
  };

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

    try {
      setLoading(true);

      const autoresponderData = {
        user_id: currentUser.instagram_user_id,
        name: name.trim(),
        keywords,
        dm_message: dmMessage.trim(),
        public_reply_messages: publicReplies.filter(reply => reply.trim()),
        auto_assign_to_all_posts: applyToAllPosts,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (autoresponder) {
        console.log('🔄 Actualizando autoresponder general:', autoresponder.id);

        const { error } = await (supabase as any)
          .from('general_comment_autoresponders')
          .update(autoresponderData)
          .eq('id', autoresponder.id)
          .eq('user_id', currentUser.instagram_user_id);

        if (error) throw error;

        // Guardar follow-ups para actualización
        await saveFollowUps(autoresponder.id, 'general');

        toast({
          title: "¡Actualizado!",
          description: "Autoresponder general actualizado exitosamente",
        });
      } else {
        console.log('➕ Creando nuevo autoresponder general');

        const { data: newAutoresponder, error } = await (supabase as any)
          .from('general_comment_autoresponders')
          .insert([autoresponderData])
          .select()
          .single();

        if (error) throw error;

        // Guardar follow-ups para nuevo autoresponder
        await saveFollowUps(newAutoresponder.id, 'general');

        // Si se seleccionó "Aplicar a todas las publicaciones", crear asignaciones automáticas
        if (applyToAllPosts && newAutoresponder) {
          console.log('🌐 Aplicando autoresponder a todas las publicaciones existentes...');
          
          // Verificar que hay token de Instagram
          const instagramToken = localStorage.getItem('hower-instagram-token');
          if (!instagramToken) {
            toast({
              title: "Autoresponder creado",
              description: "Autoresponder creado, pero necesitas conectar tu cuenta de Instagram para asignación automática. Ve a Configuración para conectar tu cuenta.",
              variant: "destructive"
            });
          } else {
            try {
              // Obtener todos los posts de Instagram
              const posts = await getInstagramPosts();
              console.log(`📝 Encontrados ${posts.length} posts para asignar`);

              // Crear asignaciones para cada post
              if (posts.length > 0) {
                console.log(`📝 Procesando ${posts.length} posts para asignación...`);
                
                let successCount = 0;
                let skipCount = 0;
                
                // Procesar posts uno por uno para evitar conflictos
                for (const post of posts) {
                  try {
                    const assignment = {
                      general_autoresponder_id: newAutoresponder.id,
                      user_id: currentUser.instagram_user_id,
                      post_id: post.id,
                      post_url: post.permalink,
                      post_caption: post.caption || '',
                      is_active: true,
                    };

                    // Verificar si ya existe una asignación para este post
                    const { data: existing } = await (supabase as any)
                      .from('post_autoresponder_assignments')
                      .select('id')
                      .eq('user_id', currentUser.instagram_user_id)
                      .eq('post_id', post.id)
                      .maybeSingle();

                    if (existing) {
                      // Ya existe, actualizar
                      await (supabase as any)
                        .from('post_autoresponder_assignments')
                        .update({ general_autoresponder_id: newAutoresponder.id })
                        .eq('id', existing.id);
                      skipCount++;
                    } else {
                      // No existe, crear nuevo
                      await (supabase as any)
                        .from('post_autoresponder_assignments')
                        .insert([assignment]);
                      successCount++;
                    }
                  } catch (error) {
                    console.error('❌ Error procesando post:', post.id, error);
                    skipCount++;
                  }
                }

                const totalProcessed = successCount + skipCount;
                toast({
                  title: "¡Autoresponder configurado!",
                  description: `Autoresponder creado y aplicado a ${totalProcessed} publicaciones (${successCount} nuevas, ${skipCount} actualizadas).`,
                });
              } else {
                toast({
                  title: "¡Autoresponder creado!",
                  description: "Autoresponder creado. No se encontraron publicaciones existentes para asignar automáticamente.",
                });
              }
            } catch (postsError) {
              console.error('❌ Error obteniendo posts de Instagram:', postsError);
              toast({
                title: "Autoresponder creado",
                description: "Autoresponder creado, pero no se pudieron obtener las publicaciones para asignación automática. Necesitas conectar tu cuenta de Instagram.",
                variant: "destructive"
              });
            }
          }
        } else {
          toast({
            title: "¡Creado!",
            description: "Autoresponder general creado exitosamente",
          });
        }
      }

      onSubmit();
    } catch (error) {
      console.error('❌ Error guardando autoresponder general:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el autoresponder",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFollowUps = async (autoresponderID: string, type: 'general') => {
    try {
      // Eliminar follow-ups existentes
      const { error: deleteError } = await supabase
        .from('autoresponder_followup_configs')
        .delete()
        .eq('general_autoresponder_id', autoresponderID);

      if (deleteError) {
        console.error('⚠️ Error eliminando follow-ups previos:', deleteError);
      }

      // Insertar nuevos follow-ups
      if (followUps.length > 0) {
        const followUpConfigs = followUps
          .filter(f => f.message_text.trim() && f.is_active)
          .map((followUp, index) => ({
            general_autoresponder_id: autoresponderID,
            sequence_order: index + 1,
            delay_hours: followUp.delay_hours,
            message_text: followUp.message_text.trim(),
            is_active: followUp.is_active
          }));

        if (followUpConfigs.length > 0) {
          const { error: followUpError } = await supabase
            .from('autoresponder_followup_configs')
            .insert(followUpConfigs);

          if (followUpError) {
            console.error('❌ Error guardando follow-ups:', followUpError);
            throw followUpError;
          }
          
          console.log('✅ Follow-ups guardados:', followUpConfigs.length);
        }
      }
    } catch (error) {
      console.error('💥 Error guardando follow-ups:', error);
      throw error;
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-green-900">
              {autoresponder ? 'Editar' : 'Crear'} Autoresponder General
            </CardTitle>
            <p className="text-sm text-green-700 mt-1">
              Configura un autoresponder reutilizable para múltiples posts
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Autoresponder *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Autoresponder para productos de fitness"
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

          {/* Aplicar a todas las publicaciones */}
          {!autoresponder && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="applyToAllPosts"
                  checked={applyToAllPosts}
                  onCheckedChange={(checked) => setApplyToAllPosts(checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor="applyToAllPosts" className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Aplicar automáticamente a todas las publicaciones de la cuenta
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    Si activas esta opción, el autoresponder se aplicará automáticamente a todas tus publicaciones existentes y futuras.
                    No necesitarás asignar posts manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <FollowUpConfig
            followUps={followUps}
            onChange={setFollowUps}
            maxFollowUps={4}
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
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
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

export default GeneralAutoresponderForm;
