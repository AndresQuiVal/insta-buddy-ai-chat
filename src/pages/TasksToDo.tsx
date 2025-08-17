import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useProspects } from '@/hooks/useProspects';
import { useNavigate } from 'react-router-dom';

interface ProspectData {
  id: string;
  userName: string;
  status: string;
  firstContactDate: string;
  lastContactDate: string;
  unread: boolean;
  avatar: string;
}

interface CompletedTasks {
  [key: string]: boolean;
}

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading, refetch } = useProspects(currentUser?.instagram_user_id);

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!userLoading && !currentUser) {
      console.log('❌ No hay usuario autenticado, redirigiendo a home');
      navigate('/', { replace: true });
    }
  }, [currentUser, userLoading, navigate]);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeProspectTab, setActiveProspectTab] = useState('dms'); // DM's por defecto
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2 | 3>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  
  // Estados para nombre de lista editable y frases motivacionales
  const [listName, setListName] = useState('Mi Lista de prospección');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Frases motivacionales
  const motivationalQuotes = [
    "Cada 'no' te acerca más a un 'sí'. ¡Sigue prospectando!",
    "El éxito está en el otro lado de tu zona de confort.",
    "Hoy es el día perfecto para conquistar nuevos clientes.",
    "Tu próximo gran cliente está esperando tu mensaje.",
    "La constancia en la prospección es la clave del éxito.",
    "Cada contacto es una oportunidad de oro.",
    "Los vendedores exitosos nunca dejan de prospectar.",
    "Tu futuro se construye con cada prospecto contactado.",
    "La fortuna favorece a quienes se atreven a contactar.",
    "El mejor momento para prospectar es ahora."
  ];

  // SEO
  useEffect(() => {
    document.title = 'Tareas de Hoy | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Lista de tareas diarias para prospectos: responder pendientes, dar seguimientos y prospectar nuevos.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Lista de tareas diarias para prospectos: responder pendientes, dar seguimientos y prospectar nuevos.');
    }
  }, []);

  useEffect(() => {
    if (userLoading) {
      console.log('⏳ Mostrando pantalla de carga...');
      return;
    }
    
    if (!currentUser) {
      console.log('❌ No hay usuario autenticado, mostrando mensaje...');
      if (typeof window !== 'undefined') {
        toast({
          title: "Acceso restringido",
          description: "Necesitas conectar tu cuenta de Instagram primero",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
    } else {
      // Usuario autenticado, generar frase motivacional
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);
      setLoading(false);
    }
  }, [currentUser, userLoading, navigate, toast]);

  // Cargar nombre de lista cuando hay usuario
  useEffect(() => {
    if (currentUser) {
      loadListName();
    }
  }, [currentUser]);

  // Cargar nombre de lista personalizado
  const loadListName = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('prospect_list_settings')
        .select('list_name')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando nombre de lista:', error);
        return;
      }

      if (data) {
        setListName(data.list_name);
      }
    } catch (error) {
      console.error('Error cargando configuración de lista:', error);
    }
  };

  // Guardar nombre de lista
  const saveListName = async (newName: string) => {
    if (!currentUser || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('prospect_list_settings')
        .upsert({
          instagram_user_id: currentUser.instagram_user_id,
          list_name: newName.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error guardando nombre de lista:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el nombre de la lista",
          variant: "destructive"
        });
        return;
      }

      setListName(newName.trim());
      toast({
        title: "Guardado",
        description: "Nombre de lista actualizado correctamente",
      });
    } catch (error) {
      console.error('Error guardando lista:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el nombre de la lista",
        variant: "destructive"
      });
    }
  };

  // Función para eliminar prospectos pendientes
  const deletePendingProspects = async () => {
    if (!currentUser) return;
    
    try {
      const pendingProspectIds = realProspects
        .filter(p => p.state === 'no_response')
        .map(p => p.senderId);
      
      if (pendingProspectIds.length === 0) {
        toast({
          title: "Sin prospectos",
          description: "No hay prospectos pendientes para eliminar",
        });
        return;
      }

      // Eliminar mensajes de estos prospectos
      const { error: messagesError } = await supabase
        .from('instagram_messages')
        .delete()
        .in('sender_id', pendingProspectIds);

      if (messagesError) throw messagesError;

      // Eliminar registros de prospectos si existen
      const { error: prospectsError } = await supabase
        .from('prospects')
        .delete()
        .in('prospect_instagram_id', pendingProspectIds);

      // No lanzar error si no existen prospectos (tabla podría estar vacía)

      // Actualizar datos
      refetch();
      
      toast({
        title: "Prospectos eliminados",
        description: `Se eliminaron ${pendingProspectIds.length} prospectos pendientes`,
      });
      
    } catch (error) {
      console.error('Error eliminando prospectos pendientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los prospectos pendientes",
        variant: "destructive"
      });
    }
  };

  // Mapear los prospectos reales a la estructura que usa TasksToDo
  const prospects: ProspectData[] = realProspects.map(prospect => ({
    id: prospect.senderId,
    userName: prospect.username || `@${prospect.senderId.slice(-8)}`,
    status: prospect.state === 'no_response' ? 'esperando_respuesta' : 
           prospect.state === 'invited' ? 'enviado' : 
           prospect.state === 'follow_up' ? 'seguimiento' : 'esperando_respuesta',
    firstContactDate: prospect.lastMessageTime,
    lastContactDate: prospect.lastMessageTime,
    unread: true,
    avatar: `https://ui-avatars.com/api/?name=${prospect.username || 'U'}&background=6366f1&color=fff`
  }));

  // AI message generation via Edge Function
  const generateMessage = async (username: string, type: 'followup' | 'outreach') => {
    const base = type === 'followup'
      ? `Genera un mensaje breve y cordial de seguimiento para Instagram en español para @${username}. Tono humano, 1-2 líneas, con CTA amable para continuar la conversación.`
      : `Genera un primer mensaje breve y humano para iniciar conversación con @${username} en Instagram. Español, 1-2 líneas, con valor y CTA sutil.`;

    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: { prompt: base },
      });
      if (error) throw error;
      const text = (data as any)?.response || 'No se pudo generar mensaje';
      return String(text).trim();
    } catch (e) {
      console.error('AI error', e);
      toast({ title: 'Error generando mensaje', description: 'Intenta de nuevo en un momento.' });
      return '';
    }
  };

  const openOnboarding = async (username: string, type: 'followup' | 'outreach', predefinedMessage?: string) => {
    try {
      // Generar mensaje con IA si no hay uno predefinido
      let messageToSend = predefinedMessage;
      if (!messageToSend) {
        const msg = await generateMessage(username, type);
        messageToSend = msg;
      }

      setDialogUser(username);
      setDialogMessage(messageToSend);
      setDialogStep(1);
      setOpenDialog(true);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo preparar el mensaje' });
    }
  };

  const handleMessageSent = (username: string) => {
    // Marcar este prospecto como completado automáticamente
    const prospect = prospects.find(p => p.userName === username);
    if (prospect) {
      // Marcar en todas las secciones donde puede aparecer este prospecto
      setCompletedTasks(prev => ({
        ...prev,
        [`pending-${prospect.id}`]: true,
        [`yesterday-${prospect.id}`]: true,
        [`week-${prospect.id}`]: true,
        [`new-${prospect.id}`]: true
      }));
    }
    setOpenDialog(false);
    setDialogStep(1);
  };

  // Clasificar prospectos y calcular estadísticas
  const prospectsClassification = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Prospectos pendientes: necesitan respuesta
    const pendingResponses = prospects.filter(p => 
      p.status === 'esperando_respuesta'
    );

    // Prospectos de seguimiento: último mensaje es nuestro, no han respondido
    const noResponseYesterday = prospects.filter(p => {
      const lastMessageDate = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && 
             lastMessageDate >= yesterday && 
             lastMessageDate < now;
    });

    const noResponse7Days = prospects.filter(p => {
      const lastMessageDate = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && 
             lastMessageDate <= sevenDaysAgo;
    });

    // Prospectos nuevos: nunca contactados
    const newProspects = prospects.filter(p => p.status === 'new');

    // Prospectos específicos para estadísticas AYER
    const yesterdayNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.firstContactDate);
      return contactDate >= yesterday && contactDate < now && p.status === 'esperando_respuesta';
    });

    const yesterdayFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && 
             lastMessage >= yesterday && 
             lastMessage < now;
    });

    // Prospectos específicos para estadísticas SEMANA
    const weekNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.firstContactDate);
      return contactDate >= sevenDaysAgo && p.status === 'esperando_respuesta';
    });

    const weekFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && 
             lastMessage >= sevenDaysAgo;
    });

    // Estadísticas para AYER
    const yesterdayStats = {
      nuevosProspectos: yesterdayNewProspects.length,
      seguimientosHechos: yesterdayFollowUps.length,
      agendados: 0 // Por ahora 0, se puede conectar con sistema de citas
    };

    // Estadísticas para SEMANA
    const weekStats = {
      nuevosProspectos: weekNewProspects.length,
      seguimientosHechos: weekFollowUps.length,
      agendados: 0 // Por ahora 0, se puede conectar con sistema de citas
    };

    return {
      pendingResponses,
      noResponseYesterday,
      noResponse7Days,
      newProspects,
      yesterdayStats,
      weekStats
    };
  }, [prospects]);

  const ProspectCard = ({ 
    prospect, 
    taskType, 
    showCheckbox = true
  }: {
    prospect: ProspectData;
    taskType: string;
    showCheckbox?: boolean;
  }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];
    
    return (
      <div 
        className={`bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}
        onClick={() => openOnboarding(prospect.userName, 'outreach')}
      >
        {/* Información principal del prospecto */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={prospect.avatar || ''} />
              <AvatarFallback className="text-xs sm:text-sm">{prospect.userName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base truncate">@{prospect.userName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
            <LogOut className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Restringido</h2>
            <p className="text-gray-600 mb-6">Necesitas conectar tu cuenta de Instagram para acceder a esta sección.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ir a Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/prospects')}
            className="mb-2 text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Prospectos
          </Button>
          
          {/* Usuario Instagram Info */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conectado como</p>
                  <p className="font-semibold text-gray-800">@{currentUser?.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  ✅ Activo
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log('🔄 Refrescando prospectos manualmente...');
                    refetch();
                  }}
                  className="h-8 px-3 text-xs"
                >
                  🔄 Actualizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tasks List - Solo Prospectos pendientes */}
        <div className="space-y-4">
          <Card className="transition-all hover:shadow-md border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                  <span>Prospectos pendientes</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">{prospectsClassification.pendingResponses.length}</Badge>
                  {prospectsClassification.pendingResponses.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePendingProspects();
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                    {activeSection === 'pending' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            
            {activeSection === 'pending' && (
              <CardContent className="pt-0 px-6">
                <Tabs value={activeProspectTab} onValueChange={setActiveProspectTab} className="w-full">
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="flex w-full min-w-fit gap-2 mb-4 bg-gray-100 p-2 rounded-xl">
                      <TabsTrigger value="hower" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap">
                        📱 Hower
                      </TabsTrigger>
                      <TabsTrigger value="dms" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-green-500 data-[state=active]:text-white whitespace-nowrap">
                        💬 DM's
                      </TabsTrigger>
                      <TabsTrigger value="comments" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap">
                        💭 Comentarios
                      </TabsTrigger>
                      <TabsTrigger value="ads" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white whitespace-nowrap">
                        📢 Anuncios
                      </TabsTrigger>
                    </TabsList>
                  </div>
                 
                  <TabsContent value="hower" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-base">¡Excelente! No hay prospectos de Hower pendientes.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="dms" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {prospectsClassification.pendingResponses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p className="text-base">¡Excelente! No hay DM's pendientes.</p>
                      </div>
                    ) : (
                      prospectsClassification.pendingResponses.map((prospect) => (
                        <ProspectCard 
                          key={prospect.id}
                          prospect={prospect} 
                          taskType="pending" 
                          showCheckbox={true}
                        />
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="comments" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-base">¡Excelente! No hay comentarios pendientes.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ads" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-base">¡Excelente! No hay anuncios pendientes.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Dialog para contacto guiado */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contactar a {dialogUser}</DialogTitle>
              <DialogDescription>
                Mensaje generado para {dialogUser}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Mensaje:</Label>
                <Textarea
                  id="message"
                  value={dialogMessage}
                  onChange={(e) => setDialogMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleMessageSent(dialogUser)}>
                Marcar como Enviado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TasksToDo;