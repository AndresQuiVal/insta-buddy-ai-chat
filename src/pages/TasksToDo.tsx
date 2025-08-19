import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2, Bug } from 'lucide-react';
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
import { InstagramDebugPanel } from '@/components/InstagramDebugPanel';
import TasksHamburgerMenu from '@/components/TasksHamburgerMenu';
import DreamCustomerRadar from '@/components/DreamCustomerRadar';

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
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [currentView, setCurrentView] = useState<'tasks' | 'icp'>('tasks');

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!userLoading && !currentUser) {
      console.log('❌ No hay usuario autenticado, redirigiendo a home');
      navigate('/', { replace: true });
    }
  }, [currentUser, userLoading, navigate]);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [listName, setListName] = useState('Mi Lista de prospección');
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

  // Validar acceso y configuración inicial
  useEffect(() => {
    if (!userLoading) {
      if (!currentUser) {
        toast({
          title: "Acceso restringido",
          description: "Necesitas conectar tu cuenta de Instagram primero",
          variant: "destructive"
        });
        navigate('/');
        return;
      } else {
        // Usuario autenticado, generar frase motivacional
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setMotivationalQuote(randomQuote);
        setLoading(false);
      }
    }
  }, [currentUser, userLoading, navigate, toast]);

  // Mapear los prospectos reales a la estructura que usa TasksToDo
  const prospects: ProspectData[] = realProspects.map(prospect => ({
    id: prospect.senderId,
    userName: prospect.username || `@${prospect.senderId.slice(-8)}`,
    status: prospect.state === 'pending' ? 'esperando_respuesta' : 
           prospect.state === 'invited' ? 'enviado' : 
           (prospect.state === 'yesterday' || prospect.state === 'week') ? 'seguimiento' : 'esperando_respuesta',
    firstContactDate: prospect.lastMessageTime,
    lastContactDate: prospect.lastMessageTime,
    unread: true,
    avatar: `https://ui-avatars.com/api/?name=${prospect.username || 'U'}&background=6366f1&color=fff`
  }));

  const handleMenuClick = (option: string) => {
    if (option === 'icp') {
      setCurrentView('icp');
    }
  };

  // Pantalla de carga mientras se valida el usuario
  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Validando acceso...</p>
        </div>
      </div>
    );
  }

  // Pantalla de carga para datos
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  // Si estamos en vista ICP, mostrar solo el componente ICP
  if (currentView === 'icp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {/* Hamburger Menu - Fixed position on top */}
          <div className="fixed top-4 right-4 z-50">
            <TasksHamburgerMenu onMenuClick={handleMenuClick} />
          </div>

          {/* Back to Tasks button */}
          <div className="mb-6">
            <Button 
              onClick={() => setCurrentView('tasks')}
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Tareas
            </Button>
          </div>

          <DreamCustomerRadar />
        </div>
      </div>
    );
  }

  // Vista normal de tareas
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hamburger Menu - Fixed position on top */}
      <div className="fixed top-4 right-4 z-50">
        <TasksHamburgerMenu onMenuClick={handleMenuClick} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Debug
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Titulo Principal */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Tareas de Hoy</h1>
          <p className="text-muted-foreground">Gestiona tus actividades de prospección</p>
        </div>

        {/* Resumen de actividad */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{realProspects.filter(p => p.state === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seguimientos</p>
                  <p className="text-2xl font-bold">{realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold">{Object.values(completedTasks).filter(Boolean).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{prospects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secciones de Tareas */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Responder ({realProspects.filter(p => p.state === 'pending').length})</TabsTrigger>
            <TabsTrigger value="followup">Seguimientos ({realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').length})</TabsTrigger>
            <TabsTrigger value="prospect">Prospectar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Mensajes Pendientes de Respuesta
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estos prospectos te han enviado mensajes que necesitan respuesta
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {realProspects.filter(p => p.state === 'pending').length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">¡Todo al día!</h3>
                    <p className="text-muted-foreground">No tienes mensajes pendientes por responder</p>
                  </div>
                ) : (
                  realProspects.filter(p => p.state === 'pending').map((prospect) => (
                    <div key={prospect.senderId} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{(prospect.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{prospect.username || prospect.senderId}</p>
                          <p className="text-sm text-muted-foreground">
                            Último mensaje: {new Date(prospect.lastMessageTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => navigate('/prospects')}>
                        Responder
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="followup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Seguimientos Programados
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Prospectos que requieren seguimiento según tu estrategia
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin seguimientos pendientes</h3>
                    <p className="text-muted-foreground">Todos los seguimientos están al día</p>
                  </div>
                ) : (
                  realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').map((prospect) => (
                    <div key={prospect.senderId} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{(prospect.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{prospect.username || prospect.senderId}</p>
                          <p className="text-sm text-muted-foreground">
                            Seguimiento: {prospect.state === 'yesterday' ? 'Ayer' : 'Esta semana'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('/prospects')}>
                        Enviar seguimiento
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prospect" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Prospección Activa
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Busca y contacta nuevos prospectos potenciales
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Button className="justify-start h-auto p-4" onClick={() => navigate('/prospects')}>
                    <div className="flex items-center gap-3 w-full">
                      <Search className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Buscar nuevos prospectos</div>
                        <div className="text-sm text-muted-foreground">Encuentra cuentas que encajen con tu ICP</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3 w-full">
                      <Heart className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Revisar interacciones</div>
                        <div className="text-sm text-muted-foreground">Analiza likes y comentarios recientes</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="mt-8">
          <InstagramDebugPanel />
        </div>
      )}
    </div>
  );
};

export default TasksToDo;