import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Settings, ArrowRight, RefreshCw, Instagram } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useProspects } from '@/hooks/useProspects';
import { useNavigate } from 'react-router-dom';
import TasksHamburgerMenu from '@/components/TasksHamburgerMenu';
import HowerService from '@/services/howerService';

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

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [howerUsernames, setHowerUsernames] = useState<string[]>([]);
  const [howerLoading, setHowerLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showFollowUpSections, setShowFollowUpSections] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [activeProspectTab, setActiveProspectTab] = useState('dms');
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Validación de autenticación - SIN REDIRECTS AUTOMÁTICOS
  useEffect(() => {
    // Solo mostrar mensaje si no hay usuario, pero NO redirigir
    if (!userLoading && !currentUser) {
      toast({
        title: "Información",
        description: "Para usar esta función necesitas conectar tu cuenta de Instagram",
        variant: "default"
      });
    }
    
    if (!userLoading && currentUser && !HowerService.isAuthenticated()) {
      toast({
        title: "Información",
        description: "Para ver las tareas necesitas configurar Hower",
        variant: "default"
      });
    }
    
    setLoading(false);
  }, [currentUser, userLoading, toast]);

  // Función para cargar los usuarios de Hower
  const loadHowerUsers = useCallback(async () => {
    if (!HowerService.isAuthenticated()) {
      return;
    }

    setHowerLoading(true);
    try {
      const response = await HowerService.getSentMessagesUsernames();
      
      if (response.success && response.data?.data?.usernames) {
        const usernames = response.data.data.usernames;
        setHowerUsernames(usernames);
        console.log('✅ Usuarios de Hower cargados:', usernames.length);
      } else {
        console.error('❌ Error al cargar usuarios de Hower:', response.error);
        toast({
          title: "Error al cargar datos",
          description: response.error || "No se pudieron cargar los datos de Hower",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error en loadHowerUsers:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con los servidores de Hower",
        variant: "destructive"
      });
    } finally {
      setHowerLoading(false);
    }
  }, [toast]);

  // Cargar datos de Hower al inicializar
  useEffect(() => {
    if (!userLoading && currentUser && HowerService.isAuthenticated()) {
      loadHowerUsers();
    }
  }, [currentUser, userLoading, loadHowerUsers]);

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

  // Generar frase motivacional
  useEffect(() => {
    if (currentUser) {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);
    }
  }, [currentUser]);

  // Calcular métricas de prospectos
  const prospectsMetrics = useMemo(() => {
    if (!realProspects.length) return { pending: 0, followUps: 0, scheduled: 0 };

    return {
      pending: realProspects.filter(p => p.state === 'pending').length,
      followUps: realProspects.filter(p => p.state === 'yesterday').length, // Usar 'yesterday' como follow-ups
      scheduled: realProspects.filter(p => p.state === 'week').length, // Usar 'week' como agendados
    };
  }, [realProspects]);

  // Función para marcar tarea como completada
  const handleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Renderizar componente de autenticación si no hay usuario
  if (!currentUser && !userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-primary mb-4">Tareas de Hoy</h1>
            <p className="text-muted-foreground mb-8">
              Conecta tu cuenta de Instagram para ver tus tareas diarias de prospección
            </p>
            <Button onClick={() => navigate('/')} className="mb-4">
              Conectar Instagram
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar componente de configuración si no hay Hower
  if (currentUser && !HowerService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-primary mb-4">Tareas de Hoy</h1>
            <p className="text-muted-foreground mb-8">
              Configura Hower para ver tus tareas de prospección
            </p>
            <Button onClick={() => navigate('/hower-auth')} className="mb-4">
              Configurar Hower
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando tareas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold text-foreground">Tareas de Hoy</h1>
            </div>
            <div className="flex items-center gap-2">
              <TasksHamburgerMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mensaje Motivacional */}
        {motivationalQuote && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <MessageSquare className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary font-medium">
              {motivationalQuote}
            </AlertDescription>
          </Alert>
        )}

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-foreground">{prospectsMetrics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Seguimientos</p>
                  <p className="text-2xl font-bold text-foreground">{prospectsMetrics.followUps}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                  <p className="text-2xl font-bold text-foreground">{prospectsMetrics.scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Tareas */}
        <Tabs value={activeProspectTab} onValueChange={setActiveProspectTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dms">Responder DMs</TabsTrigger>
            <TabsTrigger value="followups">Seguimientos</TabsTrigger>
            <TabsTrigger value="new">Nuevos Prospectos</TabsTrigger>
          </TabsList>

          <TabsContent value="dms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Responder Mensajes Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                {prospectsMetrics.pending > 0 ? (
                  <div className="space-y-4">
                    {realProspects
                      .filter(p => p.state === 'pending')
                      .slice(0, 5)
                      .map((prospect) => (
                        <div key={prospect.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{prospect.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">@{prospect.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Último mensaje: {new Date(prospect.lastMessageTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Pendiente</Badge>
                            <Button 
                              size="sm" 
                              onClick={() => window.open(`https://instagram.com/direct/t/${prospect.username}`, '_blank')}
                            >
                              <Instagram className="h-4 w-4 mr-1" />
                              Responder
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">¡Genial! No tienes mensajes pendientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dar Seguimientos</CardTitle>
              </CardHeader>
              <CardContent>
                {prospectsMetrics.followUps > 0 ? (
                  <div className="space-y-4">
                    {realProspects
                      .filter(p => p.state === 'yesterday')
                      .slice(0, 5)
                      .map((prospect) => (
                        <div key={prospect.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{prospect.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">@{prospect.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Último contacto: {new Date(prospect.lastMessageTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Seguimiento</Badge>
                            <Button 
                              size="sm" 
                              onClick={() => window.open(`https://instagram.com/direct/t/${prospect.username}`, '_blank')}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Seguimiento
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No tienes seguimientos pendientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Nuevos Prospectos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mb-4">
                    <BarChart3 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Usa Hower para encontrar nuevos prospectos ideales
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => navigate('/prospects')} 
                      className="w-full sm:w-auto"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ir a Prospectos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Estadísticas si hay datos de Hower */}
        {howerUsernames.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Estadísticas de Hower</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Contactados</p>
                  <p className="text-2xl font-bold text-primary">{howerUsernames.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TasksToDo;