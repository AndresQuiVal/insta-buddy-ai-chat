import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2, Bug, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import howerLogo from '@/assets/hower-logo.png';
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
import ProspectActionDialog from '@/components/ProspectActionDialog';
import HowerService from '@/services/howerService';
import NewProspectsResults from '@/components/NewProspectsResults';

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

const TasksToDo2: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading, refetch } = useProspects(currentUser?.instagram_user_id);

  // Debug adicional para verificar la carga de prospectos - RESTAURADO
  useEffect(() => {
    console.log('🔍 [PROSPECTS-DEBUG] Estado de carga de prospectos:', {
      currentUserExists: !!currentUser,
      instagram_user_id: currentUser?.instagram_user_id,
      prospectsLoading,
      prospectsCount: realProspects.length,
      prospectStates: realProspects.map(p => `${p.username}:${p.state}`).slice(0, 5)
    });
  }, [currentUser, prospectsLoading, realProspects]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Validación de autenticación - sin simulación

  // Validación de autenticación sin redirects automáticos - RESTAURADO (es seguro)
  useEffect(() => {
    console.log('🔍 [AUTH-DEBUG] Estado de autenticación:', {
      userLoading,
      currentUser: currentUser ? currentUser.instagram_user_id : 'null',
      localStorage: localStorage.getItem('hower-instagram-user') ? 'presente' : 'ausente'
    });
    
    // Solo mostrar mensaje informativo si no hay usuario, pero NO redirigir
    if (!userLoading && !currentUser) {
      console.log('ℹ️ No hay usuario autenticado - mostrando mensaje informativo');
      toast({
        title: "Información",
        description: "Para usar esta función necesitas conectar tu cuenta de Instagram",
        variant: "default"
      });
    }

    // Solo mostrar mensaje si no hay credenciales de Hower, pero NO redirigir
    if (!userLoading && currentUser && !HowerService.isAuthenticated()) {
      console.log('ℹ️ No hay credenciales de Hower - mostrando mensaje informativo');
      toast({
        title: "Información",
        description: "Para acceder al CRM necesitas autenticarte con Hower",
        variant: "default"
      });
    }
  }, [currentUser, userLoading, toast]);


  const [loading, setLoading] = useState(true);
  const [howerUsernames, setHowerUsernames] = useState<string[]>([]);
  const [howerLoading, setHowerLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showFollowUpSections, setShowFollowUpSections] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [activeStatsSection, setActiveStatsSection] = useState<string | null>(null);
  const [activeInteractionTip, setActiveInteractionTip] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  
  const [expandedTips, setExpandedTips] = useState<{[key: string]: boolean}>({});
  
  // Estados para diálogo de contacto guiado
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2 | 3>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [instagramOpened, setInstagramOpened] = useState(false);
  

  const [expandedDailyTip, setExpandedDailyTip] = useState(false);
  const [listName, setListName] = useState('Mi Lista de Prospectos');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [newProspectsCount, setNewProspectsCount] = useState(0);

  // Función para cargar los usuarios de Hower - RESTAURADO
  const loadHowerUsers = useCallback(async () => {
    if (!HowerService.isAuthenticated()) {
      console.log('❌ No hay credenciales de Hower disponibles');
      return;
    }

    setHowerLoading(true);
    try {
      console.log('🔄 [DEBUG] Iniciando loadHowerUsers...');
      const response = await HowerService.getSentMessagesUsernames();
      
      console.log('🔍 [DEBUG] Response completo:', response);
      console.log('🔍 [DEBUG] response.success:', response.success);
      console.log('🔍 [DEBUG] response.data:', response.data);
      console.log('🔍 [DEBUG] response.error:', response.error);
      
      if (response.success && response.data && response.data.data && response.data.data.usernames) {
        console.log('📊 [DEBUG] Estructura de datos de Hower:', response.data.data);
        console.log('📊 [DEBUG] Total disponible:', response.data.data.total_count);
        
        // Usar todos los usernames sin límite
        const usernames = response.data.data.usernames;
        
        setHowerUsernames(usernames);
        console.log('✅ [DEBUG] Usuarios de Hower cargados:', usernames.length, 'total. Primeros 5:', usernames.slice(0, 5));
      } else {
        console.error('❌ [DEBUG] Error al cargar usuarios de Hower:', response.error);
        console.error('❌ [DEBUG] Response completo que causó el error:', JSON.stringify(response, null, 2));
        
        let errorMessage = response.error || "No se pudieron cargar los datos de Hower";
        
        // Si el error es de credenciales inválidas, mostrar enlace a configuración
        if (response.error && response.error.includes('inválidas')) {
          errorMessage = response.error;
          toast({
            title: "Error de Credenciales",
            description: (
              <div>
                {errorMessage}
                <br />
                <a 
                  href="/hower-config" 
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/hower-config';
                  }}
                >
                  Ir a Configuración
                </a>
              </div>
            ),
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Error al cargar datos",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error en loadHowerUsers:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con los servidores de Hower",
        variant: "destructive"
      });
    } finally {
      setHowerLoading(false);
    }
  }, [toast]);

  // Cargar datos de Hower al inicializar - RESTAURADO
  useEffect(() => {
    console.log('🔍 Verificando condiciones para cargar Hower:', {
      userLoading,
      hasCurrentUser: !!currentUser,
      isHowerAuthenticated: HowerService.isAuthenticated()
    });

    if (!userLoading && currentUser) {
      console.log('✅ Usuario disponible, verificando autenticación de Hower...');
      
      if (HowerService.isAuthenticated()) {
        console.log('🔑 Credenciales de Hower encontradas, cargando usuarios...');
        loadHowerUsers();
      } else {
        console.log('⚠️ No hay credenciales de Hower disponibles');
        // Verificar si hay credenciales en la base de datos
        checkDatabaseCredentials();
      }
    }
  }, [currentUser, userLoading, loadHowerUsers]);

  // Nueva función para verificar credenciales en la base de datos
  const checkDatabaseCredentials = async () => {
    try {
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        console.log('❌ No hay datos de usuario de Instagram en localStorage');
        return;
      }

      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        console.log('❌ No se pudo obtener ID de Instagram');
        return;
      }

      console.log('🔍 Verificando credenciales en BD para usuario:', instagramUserId);

      const { data: userData, error } = await supabase
        .from('instagram_users')
        .select('hower_username, hower_token')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error verificando credenciales en BD:', error);
        return;
      }

      if (userData && userData.hower_username && userData.hower_token) {
        console.log('✅ Credenciales encontradas en BD, migrando a localStorage...');
        // Migrar credenciales a localStorage
        localStorage.setItem('hower_username', userData.hower_username);
        localStorage.setItem('hower_token', userData.hower_token);
        
        // Ahora cargar los usuarios
        loadHowerUsers();
      } else {
        console.log('⚠️ No hay credenciales en BD tampoco');
      }
    } catch (error) {
      console.error('❌ Error en checkDatabaseCredentials:', error);
    }
  };

  // Estado para estadísticas GROK
  const [stats, setStats] = useState({
    today: { abiertas: 0, seguimientos: 0, agendados: 0 },
    yesterday: { abiertas: 0, seguimientos: 0, agendados: 0 },
    week: { abiertas: 0, seguimientos: 0, agendados: 0 }
  });

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

  // SEO - RESTAURADO (es seguro)
  useEffect(() => {
    document.title = 'Tareas de Hoy v2 | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Lista de tareas diarias para prospectos v2: responder pendientes, dar seguimientos y prospectar nuevos.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Lista de tareas diarias para prospectos v2: responder pendientes, dar seguimientos y prospectar nuevos.');
    }
  }, []);

  // Configuración inicial sin redirects automáticos - RESTAURADO (es seguro)
  useEffect(() => {
    if (!userLoading) {
      if (currentUser) {
        // Usuario autenticado, generar frase motivacional
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setMotivationalQuote(randomQuote);
      }
      setLoading(false);
    }
  }, [currentUser, userLoading]);

  // Cargar nombre de lista cuando hay usuario - RESTAURADO (consulta simple)
  useEffect(() => {
    if (currentUser) {
      loadListName();
    }
  }, [currentUser]);

  const loadListName = async () => {
    // Simple function to load list name from localStorage
    const saved = localStorage.getItem('hower-list-name');
    if (saved) {
      setListName(saved);
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

  // Si no está cargando y no hay usuario, mostrar página de login simplificada
  if (!userLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <img src={howerLogo} alt="Hower" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido a Hower</h1>
            <p className="text-gray-600 mt-2">Conecta tu cuenta de Instagram para comenzar</p>
          </div>
          
          <Button 
            onClick={() => navigate('/instagram-login')}
            className="w-full mb-4"
          >
            <Instagram className="mr-2 h-4 w-4" />
            Conectar Instagram
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>¿Necesitas ayuda?</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/guides')}
              className="text-primary p-0 h-auto font-normal"
            >
              Ver guías de configuración
            </Button>
          </div>
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

  // Calculate prospect counts
  const pendingCount = 1;
  const followUpCount = 3;
  const newCount = 20;

  const handleSectionClick = (section: string) => {
    if (section === 'pending') {
      window.open('https://www.instagram.com/', '_blank');
    } else if (section === 'followup') {
      window.open('https://www.instagram.com/', '_blank');
    } else if (section === 'new') {
      // Show new prospects results
      setActiveSection('new');
    }
  };

  // Vista principal
  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={howerLogo} alt="Hower" className="h-8" />
            <span className="font-semibold">Hower</span>
          </div>
          <TasksHamburgerMenu />
        </div>
        
        <div className="text-center">
          <Button 
            variant="secondary"
            className="mb-4 bg-primary-light text-white hover:bg-primary-dark font-poppins"
          >
            🚀 Mis números
          </Button>
        </div>
      </div>

      {/* Contenido principal en card blanca */}
      <div className="max-w-md mx-auto bg-white rounded-t-3xl mt-4 min-h-screen">
        {/* Encabezado del listado */}
        <div className="bg-white p-6 text-center pt-8">
          <h1 className="text-2xl font-bold text-gray-900 font-poppins mb-2">Mi Lista de Prospectos</h1>
          <p className="text-gray-600 mb-6 font-poppins">La fortuna favorece a quienes se atreven a contactar.</p>
          
          {/* Mensaje de duración estimada */}
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-center gap-2 text-black">
              <span className="font-bold">⏱ Te demorarás: 1 minuto (Como servirse un café ☕)</span>
            </div>
          </div>
        </div>

        {/* Secciones de prospectos */}
        <div className="px-6 space-y-4">
          {/* Prospectos pendientes */}
          <div 
            className="cursor-pointer transition-all hover:opacity-80 py-4 border-b border-gray-100" 
            onClick={() => handleSectionClick('pending')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-lg font-poppins">Prospectos pendientes</h3>
              </div>
              <Badge className="bg-primary text-white text-lg px-3 py-1">
                {pendingCount}
              </Badge>
            </div>
          </div>

          {/* Prospectos en seguimiento */}
          <div 
            className="cursor-pointer transition-all hover:opacity-80 py-4 border-b border-gray-100" 
            onClick={() => handleSectionClick('followup')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-lg font-poppins">Prospectos en seguimiento</h3>
              </div>
              <Badge className="bg-primary text-white text-lg px-3 py-1">
                {followUpCount}
              </Badge>
            </div>
          </div>

          {/* Nuevos prospectos */}
          <div 
            className="cursor-pointer transition-all hover:opacity-80 py-4 border-b border-gray-100" 
            onClick={() => handleSectionClick('new')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-lg font-poppins">Nuevos prospectos</h3>
              </div>
              <Badge className="bg-primary text-white text-lg px-3 py-1">
                {newCount}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tip Pro del Día */}
        <div className="p-6">
          <div className="border border-primary rounded-lg p-4 bg-white">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2 font-poppins">Tip Pro del Día</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-poppins">
                  Para cada prospecto, dedica 30 segundos a interactuar con sus posts antes de enviar mensajes. 
                  Un like + comentario genuino puede triplicar tu tasa de respuesta. ¡La interacción es la clave del éxito!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 space-y-3">
          <Button 
            className="w-full bg-primary hover:bg-primary-dark text-white font-poppins"
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
          >
            Otras opciones
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full text-red-600 border-red-200 hover:bg-red-50 font-poppins"
            onClick={() => navigate('/beta')}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>

        {/* Show new prospects results when "new" section is active */}
        {activeSection === 'new' && (
          <div className="p-6">
            <NewProspectsResults instagramUserId={currentUser?.instagram_user_id || ''} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksToDo2;
