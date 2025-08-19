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

  // Vista normal de tareas (simplificada)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        
        {/* Hamburger Menu - Fixed position on top */}
        <div className="fixed top-4 right-4 z-50">
          <TasksHamburgerMenu onMenuClick={handleMenuClick} />
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Notebook Style Header */}
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 border-red-400 p-6 sm:p-8"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#fef2f2 0%, #ffffff 100%)
                `,
                backgroundSize: '20px 1px, 100% 100%',
                backgroundPosition: '0 20px, 0 0'
              }}
            >
              <div className="text-center">
                <div className="inline-block p-2 sm:p-3 bg-red-100 rounded-full mb-3 sm:mb-4">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 font-mono">
                    🚀 {listName}
                  </h1>
                  <p className="text-sm text-gray-500 italic mb-4 font-mono">
                    {motivationalQuote}
                  </p>
                </div>
                
                {/* Tag de tiempo estimado */}
                <div className="mt-3">
                  <div className="inline-block bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300 px-4 py-2 rounded-lg max-w-md">
                    <div className="text-center">
                      <span className="text-orange-800 font-mono text-sm font-bold">
                        ⏱️ Te demorarás: {Math.ceil(prospects.length * 11 / 60)} minutos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List - Simplified */}
        <div className="space-y-3 sm:space-y-4 mt-12 sm:mt-16">
          
          {/* Responder prospectos pendientes */}
          <Card className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-mono font-bold text-gray-800">
                    Responder pendientes
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-mono">
                    {realProspects.filter(p => p.state === 'pending').length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Responde a estos prospectos que te escribieron
              </p>
              <div className="space-y-2">
                {realProspects.filter(p => p.state === 'pending').slice(0, 5).map((prospect) => (
                  <div key={prospect.senderId} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{(prospect.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-mono">{prospect.username || prospect.senderId}</span>
                    <Button size="sm" variant="outline">
                      Responder
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seguimientos */}
          <Card className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-lg font-mono font-bold text-gray-800">
                    Hacer seguimientos
                  </span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-mono">
                    {realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Envía seguimientos a estos prospectos
              </p>
              <div className="space-y-2">
                {realProspects.filter(p => p.state === 'yesterday' || p.state === 'week').slice(0, 3).map((prospect) => (
                  <div key={prospect.senderId} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{(prospect.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-mono">{prospect.username || prospect.senderId}</span>
                    <Button size="sm" variant="outline">
                      Seguimiento
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prospectar nuevos */}
          <Card className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-green-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-mono font-bold text-gray-800">
                    Nuevos prospectos
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 font-mono">
                    {prospects.filter(p => p.status === 'new').length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Contacta a estos nuevos prospectos
              </p>
              <Button className="w-full">
                Ver todos los prospectos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-8">
            <InstagramDebugPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksToDo;