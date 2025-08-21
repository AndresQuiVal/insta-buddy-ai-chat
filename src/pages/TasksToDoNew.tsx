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

const TasksToDoNew: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading, refetch } = useProspects(currentUser?.instagram_user_id);

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showFollowUpSections, setShowFollowUpSections] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [activeStatsSection, setActiveStatsSection] = useState<string | null>(null);
  const [activeInteractionTip, setActiveInteractionTip] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { enabled: false, time: '09:00' },
    tuesday: { enabled: false, time: '09:00' },
    wednesday: { enabled: false, time: '09:00' },
    thursday: { enabled: false, time: '09:00' },
    friday: { enabled: false, time: '09:00' },
    saturday: { enabled: false, time: '09:00' },
    sunday: { enabled: false, time: '09:00' },
  });
  const [activeProspectTab, setActiveProspectTab] = useState('hower');
  const [activeYesterdayTab, setActiveYesterdayTab] = useState('hower');
  const [activeWeekTab, setActiveWeekTab] = useState('hower');
  const [expandedTips, setExpandedTips] = useState<{[key: string]: boolean}>({});
  
  // Estados para diálogo de contacto guiado
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2 | 3>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [instagramOpened, setInstagramOpened] = useState(false);

  const [expandedDailyTip, setExpandedDailyTip] = useState(false);

  // Estados para nombre de lista editable y frases motivacionales
  const [listName, setListName] = useState('Mi Lista de prospección');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');

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

  // Clasificación y lógica de prospectos
  const prospectsClassification = useMemo(() => {
    if (!realProspects || realProspects.length === 0) {
      return {
        pendingResponses: { hower: [], dm: [], comment: [], ads: [] },
        noResponseYesterday: { hower: [], dm: [], comment: [], ads: [] },
        noResponse7Days: { hower: [], dm: [], comment: [], ads: [] },
        newProspects: { hower: [], dm: [], comment: [], ads: [] },
        yesterdayNewProspects: [],
        weekNewProspects: [],
        yesterdayFollowUps: [],
        weekFollowUps: [],
        yesterdayStats: { nuevosProspectos: 0, seguimientos: 0 },
        weekStats: { nuevosProspectos: 0, seguimientos: 0 }
      };
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const classification = {
      pendingResponses: { hower: [], dm: [], comment: [], ads: [] },
      noResponseYesterday: { hower: [], dm: [], comment: [], ads: [] },
      noResponse7Days: { hower: [], dm: [], comment: [], ads: [] },
      newProspects: { hower: [], dm: [], comment: [], ads: [] },
      yesterdayNewProspects: [],
      weekNewProspects: [],
      yesterdayFollowUps: [],
      weekFollowUps: [],
      yesterdayStats: { nuevosProspectos: 0, seguimientos: 0 },
      weekStats: { nuevosProspectos: 0, seguimientos: 0 }
    };

    realProspects.forEach(prospect => {
      const prospectData: ProspectData = {
        id: prospect.id,
        userName: prospect.username,
        status: prospect.state,
        firstContactDate: prospect.lastMessageTime || '',
        lastContactDate: prospect.lastMessageTime || '',
        unread: false,
        avatar: ''
      };

      const firstContactDate = new Date(prospect.lastMessageTime || '');
      const lastContactDate = new Date(prospect.lastMessageTime || '');

      // Distribución por tipo (simulada)
      const typeIndex = Math.abs(prospect.username.charCodeAt(0)) % 4;
      const typeMap = ['hower', 'dm', 'comment', 'ads'];
      const type = typeMap[typeIndex];

      if (prospect.state === 'pending') {
        classification.pendingResponses[type].push(prospectData);
      }

      if (prospect.state === 'pending') {
        classification.noResponseYesterday[type].push(prospectData);
        classification.yesterdayFollowUps.push(prospectData);
      }

      if (prospect.state === 'week') {
        classification.noResponse7Days[type].push(prospectData);
        classification.weekFollowUps.push(prospectData);
      }

      if (prospect.state === 'invited') {
        classification.newProspects[type].push(prospectData);
      }

      // Estadísticas de ayer
      if (firstContactDate >= yesterday) {
        classification.yesterdayNewProspects.push(prospectData);
        classification.yesterdayStats.nuevosProspectos++;
      }

      // Estadísticas de la semana
      if (firstContactDate >= sevenDaysAgo) {
        classification.weekNewProspects.push(prospectData);
        classification.weekStats.nuevosProspectos++;
      }
    });

    return classification;
  }, [realProspects]);

  // Funciones auxiliares similares a la versión original
  const loadStats = useCallback(async () => {
    if (!currentUser?.instagram_user_id) return;

    try {
      const [todayData, yesterdayData, weekData] = await Promise.all([
        supabase.rpc('grok_get_stats', {
          p_instagram_user_id: currentUser.instagram_user_id,
          p_period: 'today'
        }),
        supabase.rpc('grok_get_stats', {
          p_instagram_user_id: currentUser.instagram_user_id,
          p_period: 'yesterday'
        }),
        supabase.rpc('grok_get_stats', {
          p_instagram_user_id: currentUser.instagram_user_id,
          p_period: 'week'
        })
      ]);

      setStats({
        today: {
          abiertas: todayData.data?.[0]?.abiertas || 0,
          seguimientos: todayData.data?.[0]?.seguimientos || 0,
          agendados: todayData.data?.[0]?.agendados || 0
        },
        yesterday: {
          abiertas: yesterdayData.data?.[0]?.abiertas || 0,
          seguimientos: yesterdayData.data?.[0]?.seguimientos || 0,
          agendados: yesterdayData.data?.[0]?.agendados || 0
        },
        week: {
          abiertas: weekData.data?.[0]?.abiertas || 0,
          seguimientos: weekData.data?.[0]?.seguimientos || 0,
          agendados: weekData.data?.[0]?.agendados || 0
        }
      });
    } catch (error) {
      console.error('Error cargando estadísticas GROK:', error);
    }
  }, [currentUser?.instagram_user_id]);

  const shareStats = async () => {
    // ... función shareStats aquí (simplificada)
    toast({
      title: "Función en desarrollo",
      description: "La función de compartir estadísticas estará disponible pronto"
    });
  };

  const loadListName = async () => {
    // ... función loadListName aquí
  };

  const saveListName = async () => {
    if (tempListName.trim()) {
      setListName(tempListName.trim());
      setIsEditingListName(false);
      setTempListName('');
    }
  };

  const handleRefreshData = () => {
    refetch();
    loadStats();
    toast({
      title: "Datos actualizados",
      description: "Se han refrescado los datos de prospectos"
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('hower-instagram-user');
    navigate('/');
  };

  const openOnboarding = (username: string, type: string, context?: any, taskType?: string) => {
    console.log('Abriendo onboarding para:', username, type, taskType);
    // Aquí iría la lógica del onboarding
  };

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

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      loadStats();
      loadListName();
      
      // Generar frase motivacional
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);
      setLoading(false);
    }
  }, [currentUser, loadStats]);

  // Si no hay usuario, redirigir
  useEffect(() => {
    if (!userLoading && !currentUser) {
      toast({
        title: "Acceso restringido",
        description: "Necesitas conectar tu cuenta de Instagram primero",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [currentUser, userLoading, navigate, toast]);

  // Loading state
  if (userLoading || prospectsLoading || loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #7a60ff 50%, #fff 50%)',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  const ProspectCard = ({ prospect, taskType }: { prospect: ProspectData; taskType: string }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];
    const isFollowUpProspect = taskType === 'yesterday' || taskType === 'week';
    const interactionTipKey = `interaction-${prospect.id}`;
    const isInteractionTipActive = activeInteractionTip === interactionTipKey;
    
    return (
      <div 
        className={`border-2 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}
        style={{
          background: 'linear-gradient(to right, #ffffff 0%, #f5f8fa 100%)',
          border: '1px solid #ccc',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onClick={() => openOnboarding(prospect.userName, 'outreach', undefined, taskType)}
      >
        <div 
          className="flex items-center justify-between p-6 rounded-xl"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '10px'
          }}
        >
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={prospect.avatar || ''} />
              <AvatarFallback 
                className="text-xs sm:text-sm"
                style={{
                  backgroundColor: '#7a60ff',
                  color: 'white'
                }}
              >
                {prospect.userName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p 
                className="font-semibold text-sm sm:text-base truncate"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  color: '#5f0099'
                }}
              >
                @{prospect.userName}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2 flex-shrink-0">
            {isFollowUpProspect && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInteractionTip(isInteractionTipActive ? null : interactionTipKey);
                }}
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm"
                style={{
                  backgroundColor: '#7a60ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Poppins, sans-serif'
                }}
                disabled={isCompleted}
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">¿Cómo aumento respuesta?</span>
                <span className="sm:hidden">📈</span>
              </Button>
            )}
          </div>
        </div>

        {isFollowUpProspect && isInteractionTipActive && (
          <div 
            className="px-3 sm:px-4 pb-3 sm:pb-4"
            style={{ borderTop: '1px solid #f0f0f0' }}
          >
            <div className="mt-3">
              <div 
                className="p-3 rounded-lg"
                style={{
                  background: 'linear-gradient(to right, #f0fdf4 0%, #f3e8ff 100%)',
                  border: '1px solid #ccc',
                  borderRadius: '10px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="font-bold text-sm"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      color: '#5f0099'
                    }}
                  >
                    💡 Cómo interactuar con @{prospect.userName}:
                  </h4>
                  <button 
                    onClick={() => setActiveInteractionTip(null)}
                    className="transition-colors"
                    style={{ color: '#7a60ff' }}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div 
                    className="rounded overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      borderLeft: '4px solid #f472b6'
                    }}
                  >
                    <div className="flex items-center p-2">
                      <Share2 className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#ec4899' }} />
                      <span 
                        className="text-sm font-bold"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Comentar en su historia
                      </span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p 
                        className="text-xs p-2 rounded"
                        style={{
                          color: '#be185d',
                          backgroundColor: '#fdf2f8',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        💡 "Me encanta esto! 😍" o "Qué buena foto! 🔥" o "Increíble! 👏"
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="rounded overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      borderLeft: '4px solid #10b981'
                    }}
                  >
                    <div className="flex items-center p-2">
                      <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#059669' }} />
                      <span 
                        className="text-sm font-bold"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Comentar en su último post algo positivo
                      </span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p 
                        className="text-xs p-2 rounded"
                        style={{
                          color: '#047857',
                          backgroundColor: '#f0fdf4',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        💡 "Excelente contenido! 💪" o "Muy inspirador! ✨" o "Me gusta mucho tu estilo 🎯"
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="rounded overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      borderLeft: '4px solid #ef4444'
                    }}
                  >
                    <div className="flex items-center p-2">
                      <Heart className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#dc2626' }} />
                      <span 
                        className="text-sm font-bold"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Dar like a sus posts recientes
                      </span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p 
                        className="text-xs p-2 rounded"
                        style={{
                          color: '#b91c1c',
                          backgroundColor: '#fef2f2',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        💡 Dale like a sus últimos 3-5 posts para aparecer en su radar
                      </p>
                    </div>
                  </div>
                </div>
                
                <p 
                  className="text-xs mt-3"
                  style={{
                    color: '#7a60ff',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  ⚡ Haz esto ANTES de enviar el mensaje para aumentar las posibilidades de respuesta
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskSection = ({ 
    title, 
    count, 
    onClick, 
    isActive, 
    icon: Icon,
    prospects,
    tip,
    taskType,
    showCheckbox = true
  }: {
    title: string;
    count: number;
    onClick: () => void;
    isActive: boolean;
    icon: any;
    prospects: ProspectData[];
    tip?: string | React.ReactNode;
    taskType: string;
    showCheckbox?: boolean;
  }) => {
    const taskKey = `section-${taskType}`;
    const sectionCompleted = completedTasks[taskKey];
    const allProspectsCompleted = prospects.every(p => completedTasks[`${taskType}-${p.id}`]);
    const tipKey = `tip-${taskType}`;
    const isTipExpanded = expandedTips[tipKey];

    const toggleTip = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedTips(prev => ({ ...prev, [tipKey]: !prev[tipKey] }));
    };

    return (
      <div className="mb-4 sm:mb-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2' : ''} ${sectionCompleted || allProspectsCompleted ? 'opacity-60' : ''}`}
          style={{
            background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #ccc',
            borderRadius: '10px',
            borderLeft: isActive ? '4px solid #7a60ff' : '4px solid #ccc',
            
          }}
        >
          <CardHeader className="pb-2 sm:pb-3" onClick={onClick}>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 hidden" style={{ color: '#7a60ff' }} />
                <span 
                  className={`${sectionCompleted || allProspectsCompleted ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: sectionCompleted || allProspectsCompleted ? '#9ca3af' : '#5f0099'
                  }}
                >
                  {title}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{
                    backgroundColor: '#7a60ff',
                    color: 'white'
                  }}
                >
                  {count}
                </Badge>
                {isActive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardTitle>
          </CardHeader>
          
          {isActive && (
            <CardContent className="pt-0 px-3 sm:px-6">
              {tip && (
                <div className="mb-4">
                  {!isTipExpanded ? (
                    <div 
                      className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      style={{
                        background: 'linear-gradient(to right, #ddd6fe 0%, #e0e7ff 100%)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '10px'
                      }}
                      onClick={toggleTip}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-semibold text-sm"
                          style={{
                            color: '#7c3aed',
                            fontFamily: 'Poppins, sans-serif'
                          }}
                        >
                          🔥 Secreto que aumenta respuestas 10x
                        </span>
                        <ChevronRight className="h-4 w-4" style={{ color: '#7c3aed' }} />
                      </div>
                    </div>
                  ) : (
                    <Alert 
                      className="border-blue-200"
                      style={{
                        backgroundColor: '#dbeafe',
                        border: '1px solid #93c5fd',
                        borderRadius: '10px'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          <Search className="h-4 w-4 mt-0.5" />
                          <AlertDescription className="text-xs sm:text-sm">
                            <strong style={{ fontFamily: 'Poppins, sans-serif' }}>💡 Tip:</strong> {tip}
                          </AlertDescription>
                        </div>
                        <button 
                          onClick={toggleTip}
                          className="transition-colors ml-2"
                          style={{ color: '#3b82f6' }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </Alert>
                  )}
                </div>
              )}
              
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #f0f0f0',
                  borderRadius: '10px'
                }}
              >
                <Tabs 
                  value={taskType === 'yesterday' ? activeYesterdayTab : taskType === 'week' ? activeWeekTab : 'hower'} 
                  onValueChange={(value) => {
                    if (taskType === 'yesterday') setActiveYesterdayTab(value);
                    else if (taskType === 'week') setActiveWeekTab(value);
                  }} 
                  className="w-full"
                >
                  <div className="overflow-x-auto pb-2">
                    <TabsList 
                      className="flex w-full min-w-fit gap-2 mb-4 p-2 rounded-xl"
                      style={{ backgroundColor: '#f3f4f6' }}
                    >
                      <TabsTrigger 
                        value="hower" 
                        className="font-mono text-xs px-3 py-2 rounded-lg shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: 'white',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <span className="block sm:hidden">📱</span>
                        <span className="hidden sm:block">📱 Hower</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="dms" 
                        className="font-mono text-xs px-3 py-2 rounded-lg shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: 'white',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <span className="block sm:hidden">💬</span>
                        <span className="hidden sm:block">💬 DM's</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="comments" 
                        className="font-mono text-xs px-3 py-2 rounded-lg shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: 'white',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <span className="block sm:hidden">💭</span>
                        <span className="hidden sm:block">💭 Comentarios</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="ads" 
                        className="font-mono text-xs px-3 py-2 rounded-lg shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: 'white',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <span className="block sm:hidden">📢</span>
                        <span className="hidden sm:block">📢 Anuncios</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                 
                  <TabsContent value="hower" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {prospects.filter((_, i) => i % 4 === 0).length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                        <p 
                          className="text-sm sm:text-base"
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: '#6b7280'
                          }}
                        >
                          ¡Excelente! No hay prospectos de Hower pendientes.
                        </p>
                      </div>
                    ) : (
                      prospects.filter((_, i) => i % 4 === 0).map((prospect) => (
                        <div key={prospect.id} className="relative overflow-visible mb-5">
                          <div className="absolute -top-2 -right-2 z-20">
                            <Badge 
                              className="text-xs font-bold shadow-md px-2 py-1 rounded-full"
                              style={{
                                background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                                color: 'white',
                                border: '2px solid white'
                              }}
                            >
                              📱 Hower
                            </Badge>
                          </div>
                          <ProspectCard prospect={prospect} taskType={taskType} />
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="dms" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {prospects.filter((_, i) => i % 4 === 1).length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                        <p 
                          className="text-sm sm:text-base"
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: '#6b7280'
                          }}
                        >
                          ¡Excelente! No hay DM's pendientes.
                        </p>
                      </div>
                    ) : (
                      prospects.filter((_, i) => i % 4 === 1).map((prospect) => (
                        <div key={prospect.id} className="relative overflow-visible mb-5">
                          <div className="absolute -top-2 -right-2 z-20">
                            <Badge 
                              className="text-xs font-bold shadow-md px-2 py-1 rounded-full"
                              style={{
                                background: 'linear-gradient(to right, #10b981, #059669)',
                                color: 'white',
                                border: '2px solid white'
                              }}
                            >
                              💬 DM's
                            </Badge>
                          </div>
                          <ProspectCard prospect={prospect} taskType={taskType} />
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="comments" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {prospects.filter((_, i) => i % 4 === 2).length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                        <p 
                          className="text-sm sm:text-base"
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: '#6b7280'
                          }}
                        >
                          ¡Excelente! No hay comentarios pendientes.
                        </p>
                      </div>
                    ) : (
                      prospects.filter((_, i) => i % 4 === 2).map((prospect) => (
                        <div key={prospect.id} className="relative overflow-visible mb-5">
                          <div className="absolute -top-2 -right-2 z-20">
                            <Badge 
                              className="text-xs font-bold shadow-md px-2 py-1 rounded-full"
                              style={{
                                background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
                                color: 'white',
                                border: '2px solid white'
                              }}
                            >
                              💭 Comentarios
                            </Badge>
                          </div>
                          <ProspectCard prospect={prospect} taskType={taskType} />
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="ads" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {prospects.filter((_, i) => i % 4 === 3).length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                        <p 
                          className="text-sm sm:text-base"
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: '#6b7280'
                          }}
                        >
                          ¡Excelente! No hay anuncios pendientes.
                        </p>
                      </div>
                    ) : (
                      prospects.filter((_, i) => i % 4 === 3).map((prospect) => (
                        <div key={prospect.id} className="relative overflow-visible mb-5">
                          <div className="absolute -top-2 -right-2 z-20">
                            <Badge 
                              className="text-xs font-bold shadow-md px-2 py-1 rounded-full"
                              style={{
                                background: 'linear-gradient(to right, #f97316, #ea580c)',
                                color: 'white',
                                border: '2px solid white'
                              }}
                            >
                              📢 Anuncios
                            </Badge>
                          </div>
                          <ProspectCard prospect={prospect} taskType={taskType} />
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen overflow-auto"
      style={{
        background: 'linear-gradient(to bottom right, #7a60ff 50%, #fff 50%)',
        fontFamily: 'Poppins, sans-serif',
        margin: 0,
        padding: 0,
        paddingLeft: '300px',
        paddingTop: '100px',
        paddingRight: '20px',
        paddingBottom: '20px'
      }}
    >
      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div 
            className="bg-white p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <InstagramDebugPanel />
            <Button 
              onClick={() => setShowDebugPanel(false)} 
              className="mt-4"
              style={{
                backgroundColor: '#7a60ff',
                color: 'white',
                fontFamily: 'Poppins, sans-serif',
                textAlign: 'center',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Menu hamburguesa fijo */}
      <div 
        style={{
          display: 'block',
          position: 'fixed',
          left: '20px',
          top: '20px',
          zIndex: 1001
        }}
      >
        <TasksHamburgerMenu />
      </div>

      {/* Contenedor principal con max-width */}
      <div className="max-w-4xl mx-auto">
        {/* Header tipo notebook */}
        <Card 
          className="mb-4 sm:mb-6 overflow-hidden relative"
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            border: '1px solid #ccc'
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #7a60ff 0%, #9c89ff 50%, #ffffff 100%)'
            }}
          />
          
          <div className="relative bg-white/10 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      {isEditingListName ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={tempListName}
                            onChange={(e) => setTempListName(e.target.value)}
                            className="text-lg sm:text-xl font-bold bg-white/50 border-white/30 text-white"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveListName();
                              } else if (e.key === 'Escape') {
                                setIsEditingListName(false);
                                setTempListName('');
                              }
                            }}
                            autoFocus
                          />
                          <Button 
                            onClick={saveListName}
                            size="sm"
                            variant="outline"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 p-1"
                            style={{ borderRadius: '10px' }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            onClick={() => {
                              setIsEditingListName(false);
                              setTempListName('');
                            }}
                            size="sm"
                            variant="outline"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 p-1"
                            style={{ borderRadius: '10px' }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <h1 
                          className="text-lg sm:text-xl font-bold text-white cursor-pointer hover:text-purple-100 transition-colors flex items-center space-x-2"
                          style={{ fontFamily: 'Poppins, sans-serif', color: 'white' }}
                          onClick={() => {
                            setIsEditingListName(true);
                            setTempListName(listName);
                          }}
                        >
                          <span>{listName}</span>
                          <Edit2 className="h-4 w-4 opacity-70" />
                        </h1>
                      )}
                    </div>
                    
                    <p 
                      className="text-sm mt-1 italic"
                      style={{ fontFamily: 'Poppins, sans-serif', color: 'white' }}
                    >
                      {motivationalQuote}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowDebugPanel(true)}
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    style={{ borderRadius: '10px', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Bug className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Debug</span>
                  </Button>
                  
                  <Button
                    onClick={handleRefreshData}
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    style={{ borderRadius: '10px', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Refrescar</span>
                  </Button>
                  
                  <Button
                    onClick={() => setShowStats(!showStats)}
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    style={{ borderRadius: '10px', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">
                      {showStats ? 'Ocultar' : 'Ver'} Stats
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </div>
        </Card>

        {/* Estadísticas */}
        {showStats && (
          <div className="mb-6" data-stats-container>
            <div 
              className="shadow-lg p-4 sm:p-6"
              style={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #3b82f6',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f8fafc 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 30px, 0 0'
              }}
            >
              <div className="text-center mb-4">
                <div 
                  className="inline-block p-2 rounded-full mb-3"
                  style={{ backgroundColor: '#dbeafe' }}
                >
                  <BarChart3 className="h-6 w-6" style={{ color: '#2563eb' }} />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <h2 
                    className="text-lg font-bold"
                    style={{ 
                      color: '#374151',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  >
                    📊 Mis Números
                  </h2>
                  <Button
                    onClick={shareStats}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    title="Compartir estadísticas"
                    style={{ 
                      backgroundColor: '#7a60ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px'
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="hoy" className="w-full" data-stats-section>
                <TabsList 
                  className="grid w-full grid-cols-3 mb-4"
                  style={{ 
                    backgroundColor: '#f3f4f6',
                    borderRadius: '10px'
                  }}
                >
                  <TabsTrigger 
                    value="hoy" 
                    className="text-sm"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Hoy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ayer" 
                    className="text-sm"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Ayer
                  </TabsTrigger>
                  <TabsTrigger 
                    value="semana" 
                    className="text-sm"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Esta Semana
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="hoy" className="space-y-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #f0fdf4 0%, #ffffff 100%)',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px'
                    }}
                  >
                    <h3 
                      className="text-base font-bold mb-3"
                      style={{
                        color: '#166534',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      📅 Hoy
                    </h3>
                    
                    <div className="space-y-2">
                      <div 
                        className="flex justify-between items-center p-2 rounded transition-all"
                        style={{
                          backgroundColor: 'white',
                          borderLeft: '4px solid #22c55e',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          💬 Abiertas
                        </span>
                        <div 
                          className="px-2 py-1 rounded-full font-bold text-sm"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          {stats.today.abiertas}
                        </div>
                      </div>
                      
                      <div 
                        className="flex justify-between items-center p-2 rounded transition-all"
                        style={{
                          backgroundColor: 'white',
                          borderLeft: '4px solid #fb923c',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          🔄 Seguimientos
                        </span>
                        <div 
                          className="px-2 py-1 rounded-full font-bold text-sm"
                          style={{
                            backgroundColor: '#fed7aa',
                            color: '#9a3412'
                          }}
                        >
                          {stats.today.seguimientos}
                        </div>
                      </div>
                      
                      <div 
                        className="flex justify-between items-center p-2 rounded"
                        style={{
                          backgroundColor: 'white',
                          borderLeft: '4px solid #a855f7'
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          📅 Agendados
                        </span>
                        <div 
                          className="px-2 py-1 rounded-full font-bold text-sm"
                          style={{
                            backgroundColor: '#e9d5ff',
                            color: '#7c2d12'
                          }}
                        >
                          {stats.today.agendados}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ayer" className="space-y-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #dbeafe 0%, #ffffff 100%)',
                      border: '1px solid #93c5fd',
                      borderRadius: '10px'
                    }}
                  >
                    <h3 
                      className="text-base font-bold mb-3"
                      style={{
                        color: '#1e40af',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      📅 Ayer
                    </h3>
                    
                    <div className="space-y-2">
                      <div 
                        className="flex justify-between items-center p-2 rounded transition-all"
                        style={{
                          backgroundColor: 'white',
                          borderLeft: '4px solid #22c55e',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          💬 Abiertas
                        </span>
                        <div 
                          className="px-2 py-1 rounded-full font-bold text-sm"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          {prospectsClassification.yesterdayStats.nuevosProspectos}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="semana" className="space-y-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #f3e8ff 0%, #ffffff 100%)',
                      border: '1px solid #c4b5fd',
                      borderRadius: '10px'
                    }}
                  >
                    <h3 
                      className="text-base font-bold mb-3"
                      style={{
                        color: '#7c3aed',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      📅 Esta Semana
                    </h3>
                    
                    <div className="space-y-2">
                      <div 
                        className="flex justify-between items-center p-2 rounded transition-all"
                        style={{
                          backgroundColor: 'white',
                          borderLeft: '4px solid #22c55e',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          💬 Abiertas
                        </span>
                        <div 
                          className="px-2 py-1 rounded-full font-bold text-sm"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          {prospectsClassification.weekStats.nuevosProspectos}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Lista de tareas */}
        <div className="space-y-4 sm:space-y-6">
          {/* 1. Responder a pendientes */}
          <TaskSection
            title="Responder pendientes"
            count={
              prospectsClassification.pendingResponses.hower.length + 
              prospectsClassification.pendingResponses.dm.length + 
              prospectsClassification.pendingResponses.comment.length + 
              prospectsClassification.pendingResponses.ads.length
            }
            onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}
            isActive={activeSection === 'pending'}
            icon={MessageSquare}
            prospects={[
              ...prospectsClassification.pendingResponses.hower,
              ...prospectsClassification.pendingResponses.dm,
              ...prospectsClassification.pendingResponses.comment,
              ...prospectsClassification.pendingResponses.ads
            ]}
            tip="Responde lo antes posible. Los mensajes respondidos rápido tienen mayor tasa de conversión."
            taskType="pending"
          />

          {/* 2. Dar Seguimientos e Interactuar */}
          <div className="mb-4 sm:mb-6">
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: showFollowUpSections ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #ccc',
                borderRadius: '10px',
                borderLeft: '4px solid #fb923c'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3" onClick={() => setShowFollowUpSections(!showFollowUpSections)}>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 hidden" style={{ color: '#ea580c' }} />
                    <span 
                      className="text-sm sm:text-base"
                      style={{ 
                        fontFamily: 'Poppins, sans-serif',
                        color: '#5f0099'
                      }}
                    >
                      Prospectos en seguimiento
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{
                        backgroundColor: '#7a60ff',
                        color: 'white'
                      }}
                    >
                      {prospectsClassification.noResponseYesterday.hower.length + 
                       prospectsClassification.noResponseYesterday.dm.length + 
                       prospectsClassification.noResponseYesterday.comment.length + 
                       prospectsClassification.noResponseYesterday.ads.length + 
                       prospectsClassification.noResponse7Days.hower.length + 
                       prospectsClassification.noResponse7Days.dm.length + 
                       prospectsClassification.noResponse7Days.comment.length + 
                       prospectsClassification.noResponse7Days.ads.length}
                    </Badge>
                    {showFollowUpSections ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
            
            {showFollowUpSections && (
              <div className="ml-4 sm:ml-6 mt-4 space-y-3 sm:space-y-4">
                <TaskSection
                  title="No respondieron ayer"
                  count={
                    prospectsClassification.noResponseYesterday.hower.length + 
                    prospectsClassification.noResponseYesterday.dm.length + 
                    prospectsClassification.noResponseYesterday.comment.length + 
                    prospectsClassification.noResponseYesterday.ads.length
                  }
                  onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
                  isActive={activeSection === 'yesterday'}
                  icon={Clock}
                  prospects={[
                    ...prospectsClassification.noResponseYesterday.hower, 
                    ...prospectsClassification.noResponseYesterday.dm, 
                    ...prospectsClassification.noResponseYesterday.comment, 
                    ...prospectsClassification.noResponseYesterday.ads
                  ]}
                  tip="Envía un mensaje por audio: 'Holaa [NOMBRE] todo bien? soy Andrés! pasaba a dejarte un mensaje y saber si aun sigues por aca? por cierto vi tu perfil y [COMPLEMENTO DEL PERFIL]'"
                  taskType="yesterday"
                />
                
                <TaskSection
                  title="No respondieron en 7 días"
                  count={
                    prospectsClassification.noResponse7Days.hower.length + 
                    prospectsClassification.noResponse7Days.dm.length + 
                    prospectsClassification.noResponse7Days.comment.length + 
                    prospectsClassification.noResponse7Days.ads.length
                  }
                  onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
                  isActive={activeSection === 'week'}
                  icon={Calendar}
                  prospects={[
                    ...prospectsClassification.noResponse7Days.hower,
                    ...prospectsClassification.noResponse7Days.dm,
                    ...prospectsClassification.noResponse7Days.comment,
                    ...prospectsClassification.noResponse7Days.ads
                  ]}
                  tip="Envía un mensaje por texto: 'Hey hey [NOMBRE] oye, hace 7 días no escucho de ti, todo bien?'"
                  taskType="week"
                />
              </div>
            )}
          </div>

          {/* 3. Prospectar a nuevos */}
          <TaskSection
            title="Nuevos prospectos"
            count={
              prospectsClassification.newProspects.hower.length + 
              prospectsClassification.newProspects.dm.length + 
              prospectsClassification.newProspects.comment.length + 
              prospectsClassification.newProspects.ads.length
            }
            onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
            isActive={activeSection === 'new'}
            icon={MessageCircle}
            prospects={[
              ...prospectsClassification.newProspects.hower,
              ...prospectsClassification.newProspects.dm,
              ...prospectsClassification.newProspects.comment,
              ...prospectsClassification.newProspects.ads
            ]}
            tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
            taskType="new"
          />
        </div>

        {/* Configuración WhatsApp */}
        <div className="mt-8 sm:mt-12 text-center">
          <Button
            onClick={() => setShowWhatsAppConfig(!showWhatsAppConfig)}
            variant="outline"
            className="transform hover:scale-105 transition-all"
            style={{
              background: 'linear-gradient(to right, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #bbf7d0',
              color: '#059669',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '14px',
              borderRadius: '10px'
            }}
          >
            <Phone className="h-4 w-4 mr-2" />
            {showWhatsAppConfig ? '📱 Ocultar configuración' : '📱 Configurar Conexión a WhatsApp'}
          </Button>
        </div>

        {showWhatsAppConfig && (
          <div className="mt-4">
            <div 
              className="shadow-lg p-4 sm:p-6"
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                borderLeft: '4px solid #22c55e',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f0fdf4 0%, #ffffff 100%)
                `,
                backgroundSize: '20px 1px, 100% 100%',
                backgroundPosition: '0 20px, 0 0'
              }}
            >
              <div className="text-center mb-4">
                <div 
                  className="inline-block p-2 rounded-full mb-3"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <Phone className="h-6 w-6" style={{ color: '#16a34a' }} />
                </div>
                <h2 
                  className="text-lg font-bold"
                  style={{ 
                    color: '#374151',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  📱 Configuración de WhatsApp
                </h2>
              </div>

              <div className="mb-6">
                <Label 
                  htmlFor="whatsapp-number" 
                  className="text-sm font-bold"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    color: '#166534'
                  }}
                >
                  📞 Número de WhatsApp
                </Label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="mt-2"
                  style={{
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                />
              </div>

              <div>
                <h3 
                  className="text-sm font-bold mb-4"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    color: '#166534'
                  }}
                >
                  ⏰ Horarios de Mensajes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(weekSchedule).map(([day, config]) => {
                    const dayNames = {
                      monday: 'Lunes',
                      tuesday: 'Martes', 
                      wednesday: 'Miércoles',
                      thursday: 'Jueves',
                      friday: 'Viernes',
                      saturday: 'Sábado',
                      sunday: 'Domingo'
                    };
                    
                    return (
                      <div 
                        key={day} 
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px'
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label 
                            className="text-sm font-bold"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {dayNames[day as keyof typeof dayNames]}
                          </Label>
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => {
                              setWeekSchedule(prev => ({
                                ...prev,
                                [day]: { ...prev[day as keyof typeof prev], enabled: e.target.checked }
                              }));
                            }}
                            style={{ borderRadius: '4px' }}
                          />
                        </div>
                        <Input
                          type="time"
                          value={config.time}
                          onChange={(e) => {
                            setWeekSchedule(prev => ({
                              ...prev,
                              [day]: { ...prev[day as keyof typeof prev], time: e.target.value }
                            }));
                          }}
                          disabled={!config.enabled}
                          className="text-sm"
                          style={{
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontFamily: 'Poppins, sans-serif'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center mt-6">
                <Button 
                  className="font-mono"
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontFamily: 'Poppins, sans-serif',
                    borderRadius: '10px',
                    border: 'none'
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tips generales */}
        <div className="mt-6 sm:mt-8">
          <div 
            className="shadow-lg p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setExpandedDailyTip(!expandedDailyTip)}
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              borderLeft: '4px solid #22c55e',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f0fdf4 0%, #ffffff 100%)
              `,
              backgroundSize: '20px 1px, 100% 100%',
              backgroundPosition: '0 20px, 0 0'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 flex-shrink-0" style={{ color: '#16a34a' }} />
                <h3 
                  className="font-bold"
                  style={{
                    color: '#166534',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  🚀 Tip Pro del Día
                </h3>
              </div>
              {expandedDailyTip ? 
                <ChevronDown className="h-4 w-4" style={{ color: '#16a34a' }} /> : 
                <ChevronRight className="h-4 w-4" style={{ color: '#16a34a' }} />
              }
            </div>
            
            {expandedDailyTip && (
              <div className="mt-3 pl-8">
                <p 
                  className="text-sm sm:text-base leading-relaxed"
                  style={{
                    color: '#059669',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  Para cada prospecto, dedica 30 segundos a interactuar con sus posts antes de enviar mensajes. 
                  Un like + comentario genuino puede triplicar tu tasa de respuesta. ¡La interacción es la clave del éxito!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Logo de Hower al final */}
        <div className="mt-8 mb-4 text-center">
          <img
            src={howerLogo}
            alt="Hower"
            className="w-12 h-12 rounded-2xl object-cover mx-auto opacity-70 hover:opacity-100 transition-opacity"
          />
          <p 
            className="text-xs mt-2"
            style={{ 
              color: '#9ca3af',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            Hecho con 💜 por Hower
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              style={{
                color: '#2563eb',
                border: '1px solid #93c5fd',
                borderRadius: '10px',
                fontFamily: 'Poppins, sans-serif',
                backgroundColor: 'transparent'
              }}
            >
              <Settings className="w-4 h-4 mr-1" />
              Otras opciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              style={{
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                fontFamily: 'Poppins, sans-serif',
                backgroundColor: 'transparent'
              }}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksToDoNew;