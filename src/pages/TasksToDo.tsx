import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProspectData {
  id: string;
  username: string;
  profile_picture_url?: string | null;
  status: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_from_prospect: boolean;
}

interface CompletedTasks {
  [key: string]: boolean;
}

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<ProspectData[]>([]);
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
  const [expandedTips, setExpandedTips] = useState<{[key: string]: boolean}>({});

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
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('last_message_date', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Error loading prospects:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (username: string) => {
    try {
      const message = `¡Hola @${username}! 👋 Soy Andrés y me encanta conectar con personas increíbles como tú. He visto tu contenido y me parece súper interesante. ¿Te gustaría conectar? 🌟`;
      
      await navigator.clipboard.writeText(message);
      
      toast({
        title: "¡Mensaje copiado!",
        description: `El mensaje para ${username} está listo para enviar`,
        duration: 3000,
      });

      // Actualizar estado del prospecto
      await supabase
        .from('prospects')
        .update({ 
          status: 'contacted',
          last_message_date: new Date().toISOString()
        })
        .eq('username', username);

      loadProspects();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el mensaje",
        variant: "destructive"
      });
    }
  };

  // Clasificar prospectos y calcular estadísticas
  const prospectsClassification = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Prospectos pendientes: último mensaje es del prospecto, necesitan respuesta
    const pendingResponses = prospects.filter(p => 
      p.last_message_from_prospect && (p.status === 'esperando_respuesta' || p.status !== 'new')
    );

    // Prospectos de seguimiento: último mensaje es nuestro, no han respondido
    const noResponseYesterday = prospects.filter(p => {
      const lastMessageDate = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessageDate >= yesterday && 
             lastMessageDate < now &&
             (p.status === 'contacted' || p.status === 'en_seguimiento');
    });

    const noResponse7Days = prospects.filter(p => {
      const lastMessageDate = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessageDate <= sevenDaysAgo &&
             (p.status === 'contacted' || p.status === 'en_seguimiento');
    });

    // Prospectos nuevos: nunca contactados
    const newProspects = prospects.filter(p => p.status === 'new');

    // Prospectos específicos para estadísticas AYER
    const yesterdayNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.first_contact_date);
      return contactDate >= yesterday && contactDate < now && p.status === 'new';
    });

    const yesterdayFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessage >= yesterday && 
             lastMessage < now &&
             p.status === 'contacted';
    });

    // Prospectos específicos para estadísticas SEMANA
    const weekNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.first_contact_date);
      return contactDate >= sevenDaysAgo && p.status === 'new';
    });

    const weekFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessage >= sevenDaysAgo &&
             p.status === 'contacted';
    });

    // Estadísticas para AYER
    const yesterdayStats = {
      nuevosProspectos: yesterdayNewProspects.length,
      seguimientosHechos: yesterdayFollowUps.length,
      agendados: 0 // Por ahora 0, se puede conectar con sistema de citas
    };

    // Estadísticas para LA SEMANA
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
      weekStats,
      yesterdayNewProspects,
      yesterdayFollowUps,
      weekNewProspects,
      weekFollowUps
    };
  }, [prospects]);

  // Calcular tiempo estimado (10-12 segundos por prospecto, usamos 11 como promedio)
  const calculateEstimatedTime = () => {
    const totalProspects = prospectsClassification.pendingResponses.length + prospectsClassification.newProspects.length;
    const secondsPerProspect = 11; // Promedio entre 10-12 segundos
    const totalSeconds = totalProspects * secondsPerProspect;
    const minutes = Math.ceil(totalSeconds / 60); // Redondeamos hacia arriba
    
    // Determinar equivalencia según el tiempo
    let equivalencia = '';
    if (minutes < 5) {
      equivalencia = 'pts... Tiempo que tardas en servirte un café ☕';
    } else if (minutes >= 5 && minutes <= 10) {
      equivalencia = 'pts... Tiempo que demoras en ducharte 🚿';
    } else if (minutes >= 15) {
      equivalencia = 'pts... Tiempo que demoras en ir por el super 🛒';
    } else {
      equivalencia = 'pts... Menos de lo que tardas en desayunar 🍳';
    }
    
    return { minutes, totalProspects, equivalencia };
  };

  // Función para obtener prospectos según la sección de estadísticas
  const getStatsProspects = (statsType: string, period: string) => {
    switch (statsType) {
      case 'nuevos':
        return period === 'ayer' ? prospectsClassification.yesterdayNewProspects : prospectsClassification.weekNewProspects;
      case 'seguimientos':
        return period === 'ayer' ? prospectsClassification.yesterdayFollowUps : prospectsClassification.weekFollowUps;
      case 'agendados':
        return []; // Por ahora vacío, se puede implementar después
      default:
        return [];
    }
  };

  const ProspectCard = ({ prospect, taskType }: { prospect: ProspectData; taskType: string }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];
    const isFollowUpProspect = taskType === 'yesterday' || taskType === 'week';
    const interactionTipKey = `interaction-${prospect.id}`;
    const isInteractionTipActive = activeInteractionTip === interactionTipKey;

    console.log('Rendering ProspectCard for:', prospect.username, 'Task type:', taskType);
    console.log('Is interaction tip active?', isInteractionTipActive);
    
    return (
      <div className={`bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}>
        {/* Información principal del prospecto */}
        <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Checkbox 
              checked={isCompleted}
              onCheckedChange={(checked) => {
                setCompletedTasks(prev => ({ ...prev, [taskKey]: !!checked }));
              }}
              className="flex-shrink-0"
            />
            <Avatar className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={prospect.profile_picture_url || ''} />
              <AvatarFallback className="text-xs sm:text-sm">{prospect.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base truncate">@{prospect.username}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(prospect.last_message_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            {/* Botón de interacción solo para prospectos de seguimiento */}
            {isFollowUpProspect && (
              <Button 
                onClick={() => setActiveInteractionTip(isInteractionTipActive ? null : interactionTipKey)}
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={isCompleted}
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">¿Cómo aumento respuesta?</span>
                <span className="sm:hidden">📈</span>
              </Button>
            )}
            <Button 
              onClick={() => handleContact(prospect.username)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-xs sm:text-sm"
              disabled={isCompleted}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Contactar</span>
              <span className="sm:hidden">💬</span>
            </Button>
          </div>
        </div>

        {/* Tip de interacción - SOLO aparece cuando se hace click */}
        {isFollowUpProspect && isInteractionTipActive && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
            <div className="mt-3">
              <div 
                className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #e0e7ff 1px, transparent 1px)',
                  backgroundSize: '20px 1px',
                  backgroundPosition: '0 15px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-blue-800 text-sm font-mono">💡 Cómo interactuar con @{prospect.username}:</h4>
                  <button 
                    onClick={() => setActiveInteractionTip(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-white rounded border-l-4 border-pink-400 overflow-hidden">
                    <div className="flex items-center p-2">
                      <Share2 className="h-4 w-4 text-pink-600 mr-2 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold">Comentar en su historia</span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p className="text-xs text-pink-700 bg-pink-50 p-2 rounded font-mono">
                        💡 "Me encanta esto! 😍" o "Qué buena foto! 🔥" o "Increíble! 👏"
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded border-l-4 border-green-400 overflow-hidden">
                    <div className="flex items-center p-2">
                      <MessageCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold">Comentar en su último post algo positivo</span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded font-mono">
                        💡 "Excelente contenido! 💪" o "Muy inspirador! ✨" o "Me gusta mucho tu estilo 🎯"
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded border-l-4 border-red-400 overflow-hidden">
                    <div className="flex items-center p-2">
                      <Heart className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold">Dar like a sus posts recientes</span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                      <p className="text-xs text-red-700 bg-red-50 p-2 rounded font-mono">
                        💡 Dale like a sus últimos 3-5 posts para aparecer en su radar
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-blue-600 mt-3 font-mono">
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
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${isActive ? 'ring-2 ring-primary border-l-primary' : 'border-l-gray-300'} ${sectionCompleted || allProspectsCompleted ? 'opacity-60' : ''}`}
          style={{
            background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <CardHeader className="pb-2 sm:pb-3" onClick={onClick}>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                {showCheckbox && (
                  <Checkbox 
                    checked={sectionCompleted || allProspectsCompleted}
                    onCheckedChange={(checked) => {
                      setCompletedTasks(prev => ({ ...prev, [taskKey]: !!checked }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 hidden" />
                <span className={`${sectionCompleted || allProspectsCompleted ? 'line-through' : ''} text-sm sm:text-base`}>{title}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">{count}</Badge>
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
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={toggleTip}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 font-semibold text-sm">💡 Ver tip</span>
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  ) : (
                    <Alert className="border-blue-200 bg-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          <Search className="h-4 w-4 mt-0.5" />
                          <AlertDescription className="text-xs sm:text-sm">
                            <strong>💡 Tip:</strong> {tip}
                          </AlertDescription>
                        </div>
                        <button 
                          onClick={toggleTip}
                          className="text-blue-600 hover:text-blue-800 transition-colors ml-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </Alert>
                  )}
                </div>
              )}
              
              <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                {prospects.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-sm sm:text-base">¡Excelente! No hay tareas pendientes en esta sección.</p>
                  </div>
                ) : (
                  prospects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} taskType={taskType} />
                  ))
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/prospects'}
            className="mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Prospectos
          </Button>
          
          {/* Notebook Style Header */}
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 border-red-400 p-6 sm:p-8"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f9fafb 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 40px, 0 0'
              }}
            >
              {/* Spiral binding holes */}
              <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-red-400 shadow-inner" />
                ))}
              </div>
              
              <div className="text-center ml-4 sm:ml-6">
                {/* Botón para mostrar estadísticas - ARRIBA del título */}
                <div className="mb-4">
                  <Button
                    onClick={() => setShowStats(!showStats)}
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 font-mono text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    {showStats ? '📊 Ocultar mis números' : '🚀 ¿Cómo lo hice ayer?'}
                  </Button>
                </div>
                
                {/* Estadísticas - Aparece arriba del título cuando se hace click */}
                {showStats && (
                  <div className="mb-6">
                    <div 
                      className="bg-white rounded-xl shadow-lg border-l-4 border-blue-400 p-4 sm:p-6"
                      style={{
                        backgroundImage: `
                          linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                          linear-gradient(#f8fafc 0%, #ffffff 100%)
                        `,
                        backgroundSize: '24px 1px, 100% 100%',
                        backgroundPosition: '0 30px, 0 0'
                      }}
                    >
                      <div className="text-center mb-4">
                        <div className="inline-block p-2 bg-blue-100 rounded-full mb-3">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 font-mono">
                          📊 Mis Números
                        </h2>
                      </div>

                      <Tabs defaultValue="ayer" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="ayer" className="font-mono text-sm">Ayer</TabsTrigger>
                          <TabsTrigger value="semana" className="font-mono text-sm">Esta Semana</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="ayer" className="space-y-3">
                          <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-200">
                            <h3 className="text-base font-bold text-blue-800 mb-3 font-mono">📅 Ayer</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-nuevos' ? null : 'ayer-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Conversaciones Abiertas</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.nuevosProspectos}
                                </div>
                              </div>
                              
                              {/* Listado de prospectos nuevos de ayer */}
                              {activeStatsSection === 'ayer-nuevos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  {getStatsProspects('nuevos', 'ayer').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No hay prospectos nuevos de ayer</p>
                                  ) : (
                                    getStatsProspects('nuevos', 'ayer').map((prospect) => (
                                      <ProspectCard key={prospect.id} prospect={prospect} taskType="stats-ayer-nuevos" />
                                    ))
                                  )}
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-seguimientos' ? null : 'ayer-seguimientos')}
                              >
                                <span className="font-mono text-sm">💬 Seguimientos hechos</span>
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.seguimientosHechos}
                                </div>
                              </div>
                              
                              {/* Listado de seguimientos de ayer */}
                              {activeStatsSection === 'ayer-seguimientos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  {getStatsProspects('seguimientos', 'ayer').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No hay seguimientos de ayer</p>
                                  ) : (
                                    getStatsProspects('seguimientos', 'ayer').map((prospect) => (
                                      <ProspectCard key={prospect.id} prospect={prospect} taskType="stats-ayer-seguimientos" />
                                    ))
                                  )}
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-agendados' ? null : 'ayer-agendados')}
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.agendados}
                                </div>
                              </div>
                              
                              {/* Listado de agendados de ayer */}
                              {activeStatsSection === 'ayer-agendados' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <p className="text-xs text-muted-foreground italic">Funcionalidad próximamente</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="semana" className="space-y-3">
                          <div className="bg-gradient-to-r from-purple-50 to-white p-3 rounded-lg border border-purple-200">
                            <h3 className="text-base font-bold text-purple-800 mb-3 font-mono">📊 Esta Semana</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'semana-nuevos' ? null : 'semana-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Conversaciones Abiertas</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.nuevosProspectos}
                                </div>
                              </div>
                              
                              {/* Listado de prospectos nuevos de la semana */}
                              {activeStatsSection === 'semana-nuevos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  {getStatsProspects('nuevos', 'semana').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No hay prospectos nuevos esta semana</p>
                                  ) : (
                                    getStatsProspects('nuevos', 'semana').map((prospect) => (
                                      <ProspectCard key={prospect.id} prospect={prospect} taskType="stats-semana-nuevos" />
                                    ))
                                  )}
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'semana-seguimientos' ? null : 'semana-seguimientos')}
                              >
                                <span className="font-mono text-sm">💬 Seguimientos hechos</span>
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.seguimientosHechos}
                                </div>
                              </div>
                              
                              {/* Listado de seguimientos de la semana */}
                              {activeStatsSection === 'semana-seguimientos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  {getStatsProspects('seguimientos', 'semana').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No hay seguimientos esta semana</p>
                                  ) : (
                                    getStatsProspects('seguimientos', 'semana').map((prospect) => (
                                      <ProspectCard key={prospect.id} prospect={prospect} taskType="stats-semana-seguimientos" />
                                    ))
                                  )}
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'semana-agendados' ? null : 'semana-agendados')}
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.agendados}
                                </div>
                              </div>
                              
                              {/* Listado de agendados de la semana */}
                              {activeStatsSection === 'semana-agendados' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <p className="text-xs text-muted-foreground italic">Funcionalidad próximamente</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      {/* Botón Más Detalles */}
                      <div className="text-center mt-4">
                        <Button
                          onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                          variant="outline"
                          className="bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-700 hover:from-blue-200 hover:to-cyan-200 font-mono text-sm"
                        >
                          {showDetailedMetrics ? '📈 Ocultar detalles' : '📊 Más Detalles'}
                        </Button>
                      </div>
                      
                      {/* Métricas Detalladas */}
                      {showDetailedMetrics && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <h3 className="text-center font-bold text-gray-800 mb-4 font-mono">📊 Métricas Detalladas</h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border-l-4 border-green-400">
                              <div className="text-sm font-mono font-bold text-green-800">📧 # de Mensajes para Tener 1 Respuesta</div>
                              <div className="text-2xl font-bold text-green-600">4.2</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-blue-400">
                              <div className="text-sm font-mono font-bold text-blue-800">🎯 # de Mensajes para Lograr 1 Invitación</div>
                              <div className="text-2xl font-bold text-blue-600">8.7</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-purple-400">
                              <div className="text-sm font-mono font-bold text-purple-800">📋 # de Mensajes para Tener 1 Presentación</div>
                              <div className="text-2xl font-bold text-purple-600">12.3</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-orange-400">
                              <div className="text-sm font-mono font-bold text-orange-800">🤝 # de Invitaciones para Tener 1 Presentación</div>
                              <div className="text-2xl font-bold text-orange-600">2.1</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-red-400">
                              <div className="text-sm font-mono font-bold text-red-800">✅ # de Mensajes para Lograr 1 Inscripción</div>
                              <div className="text-2xl font-bold text-red-600">25.4</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-yellow-400">
                              <div className="text-sm font-mono font-bold text-yellow-800">🎫 # de Invitaciones para Lograr 1 Inscripción</div>
                              <div className="text-2xl font-bold text-yellow-600">5.8</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-indigo-400 sm:col-span-2">
                              <div className="text-sm font-mono font-bold text-indigo-800">📊 # de Presentaciones para Lograr 1 Inscripción</div>
                              <div className="text-2xl font-bold text-indigo-600">3.2</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="inline-block p-2 sm:p-3 bg-red-100 rounded-full mb-3 sm:mb-4">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 font-mono">
                  👇 Lista de Tareas de Hoy
                </h1>
                
                {/* Tag de tiempo estimado */}
                <div className="mt-3">
                  <div className="inline-block bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300 px-4 py-2 rounded-lg max-w-md">
                    <div className="text-center">
                      <span className="text-orange-800 font-mono text-sm font-bold block">
                        ⏱️ Tiempo estimado: {calculateEstimatedTime().minutes} minutos
                      </span>
                      <span className="text-orange-700 font-mono text-xs block mt-1">
                        {calculateEstimatedTime().equivalencia}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List - Notebook Style */}
        <div className="space-y-3 sm:space-y-4">
          {/* 1. Responder prospectos pendientes con tabs */}
          <div className="mb-4 sm:mb-6">
            <Card
              className="transition-all hover:shadow-md border-l-4 border-l-primary"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: activeSection === 'pending' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg cursor-pointer">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <Checkbox 
                      checked={completedTasks['section-pending']}
                      onCheckedChange={(checked) => {
                        setCompletedTasks(prev => ({ ...prev, ['section-pending']: !!checked }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={`${completedTasks['section-pending'] ? 'line-through' : ''} text-sm sm:text-base`}>Prospectos pendientes</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">{prospectsClassification.pendingResponses.length}</Badge>
                    {activeSection === 'pending' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
              
              {activeSection === 'pending' && (
                <CardContent className="pt-0 px-3 sm:px-6">
                  <div className="mb-4">
                    {!expandedTips['tip-pending'] ? (
                      <div 
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => setExpandedTips(prev => ({ ...prev, ['tip-pending']: !prev['tip-pending'] }))}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 font-semibold text-sm">💡 Ver tip</span>
                          <ChevronRight className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    ) : (
                      <Alert className="border-blue-200 bg-blue-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <Search className="h-4 w-4 mt-0.5" />
                            <AlertDescription className="text-xs sm:text-sm">
                              <strong>💡 Tip:</strong> Responde rápido para mantener el engagement. ¡La velocidad de respuesta es clave!
                            </AlertDescription>
                          </div>
                          <button 
                            onClick={() => setExpandedTips(prev => ({ ...prev, ['tip-pending']: false }))}
                            className="text-blue-600 hover:text-blue-800 transition-colors ml-2"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </Alert>
                    )}
                  </div>
                  
                  {/* Tabs estilo cuaderno */}
                  <div className="mb-4">
                    <div 
                      className="bg-white rounded-lg border border-gray-200 p-4"
                      style={{
                        backgroundImage: 'linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 1px',
                        backgroundPosition: '0 20px'
                      }}
                    >
                      <Tabs value={activeProspectTab} onValueChange={setActiveProspectTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 mb-4 bg-gray-100 p-1">
                          <TabsTrigger value="hower" className="font-mono text-xs px-1 sm:px-3 py-2">
                            <span className="block sm:hidden">📱</span>
                            <span className="hidden sm:block">📱 Hower</span>
                          </TabsTrigger>
                          <TabsTrigger value="dms" className="font-mono text-xs px-2 py-3 rounded-lg bg-white shadow-sm data-[state=active]:bg-green-500 data-[state=active]:text-white">
                            <span className="block sm:hidden">💬</span>
                            <span className="hidden sm:block">💬 DM's</span>
                          </TabsTrigger>
                          <TabsTrigger value="comments" className="font-mono text-xs px-2 py-3 rounded-lg bg-white shadow-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                            <span className="block sm:hidden">💭</span>
                            <span className="hidden sm:block">💭 Comentarios</span>
                          </TabsTrigger>
                          <TabsTrigger value="ads" className="font-mono text-xs px-2 py-3 rounded-lg bg-white shadow-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                            <span className="block sm:hidden">📢</span>
                            <span className="hidden sm:block">📢 Anuncios</span>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="hower" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 0).length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay prospectos de Hower pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 0).map((prospect) => (
                              <div key={prospect.id} className="relative overflow-visible mb-5">
                                <div className="absolute -top-2 -right-2 z-20">
                                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
                                    📱 Hower
                                  </Badge>
                                </div>
                                <ProspectCard prospect={prospect} taskType="pending" />
                              </div>
                            ))
                          )}
                        </TabsContent>
                        
                        <TabsContent value="dms" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 1).length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay DM's pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 1).map((prospect) => (
                              <div key={prospect.id} className="relative overflow-visible mb-5">
                                <div className="absolute -top-2 -right-2 z-20">
                                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
                                    💬 DM's
                                  </Badge>
                                </div>
                                <ProspectCard prospect={prospect} taskType="pending" />
                              </div>
                            ))
                          )}
                        </TabsContent>
                        
                        <TabsContent value="comments" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 2).length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay comentarios pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 2).map((prospect) => (
                              <div key={prospect.id} className="relative overflow-visible mb-5">
                                <div className="absolute -top-2 -right-2 z-20">
                                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
                                    💭 Comentarios
                                  </Badge>
                                </div>
                                <ProspectCard prospect={prospect} taskType="pending" />
                              </div>
                            ))
                          )}
                        </TabsContent>
                        
                        <TabsContent value="ads" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 3).length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay anuncios pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.filter((_, i) => i % 4 === 3).map((prospect) => (
                              <div key={prospect.id} className="relative overflow-visible mb-5">
                                <div className="absolute -top-2 -right-2 z-20">
                                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
                                    📢 Anuncios
                                  </Badge>
                                </div>
                                <ProspectCard prospect={prospect} taskType="pending" />
                              </div>
                            ))
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* 2. Dar Seguimientos e Interactuar */}
          <div className="mb-4 sm:mb-6">
            <Card
              className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-orange-300"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: showFollowUpSections ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3" onClick={() => setShowFollowUpSections(!showFollowUpSections)}>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <Checkbox 
                      checked={completedTasks['section-followup']}
                      onCheckedChange={(checked) => {
                        setCompletedTasks(prev => ({ ...prev, ['section-followup']: !!checked }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0 hidden" />
                    <span className={`text-sm sm:text-base ${completedTasks['section-followup'] ? 'line-through' : ''}`}>
                      Prospectos que debes dar seguimiento
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {prospectsClassification.noResponseYesterday.length + prospectsClassification.noResponse7Days.length}
                    </Badge>
                    {showFollowUpSections ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
            
            {/* Subsecciones de seguimiento - Solo se muestran cuando showFollowUpSections es true */}
            {showFollowUpSections && (
              <div className="ml-4 sm:ml-6 mt-4 space-y-3 sm:space-y-4">
                {/* 2.1 No respondieron ayer */}
                <TaskSection
                  title="No respondieron ayer"
                  count={prospectsClassification.noResponseYesterday.length}
                  onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
                  isActive={activeSection === 'yesterday'}
                  icon={Clock}
                  prospects={prospectsClassification.noResponseYesterday}
                  tip={
                    <div className="space-y-3">
                      <p>Envía este mensaje por <strong>audio</strong>:</p>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded font-mono text-sm" style={{
                        backgroundImage: 'linear-gradient(90deg, #fef3c7 1px, transparent 1px)',
                        backgroundSize: '20px 1px',
                        backgroundPosition: '0 15px'
                      }}>
                        "Holaa [NOMBRE] todo bien? soy Andrés! pasaba a dejarte un mensaje y saber si aun sigues por aca? por cierto vi tu perfil y [COMPLEMENTO DEL PERFIL]"
                      </div>
                      <p><strong>💡 Tip:</strong> No olvides interactuar con sus posts: dar like, comentar, compartir. ¡La interacción aumenta las respuestas!</p>
                    </div>
                  }
                  taskType="yesterday"
                />
                
                {/* 2.2 No respondieron en 7 días */}
                <TaskSection
                  title="No respondieron en 7 días"
                  count={prospectsClassification.noResponse7Days.length}
                  onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
                  isActive={activeSection === 'week'}
                  icon={Calendar}
                  prospects={prospectsClassification.noResponse7Days}
                  tip={
                    <div className="space-y-3">
                      <p>Envía este mensaje por <strong>texto</strong>:</p>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded font-mono text-sm" style={{
                        backgroundImage: 'linear-gradient(90deg, #dbeafe 1px, transparent 1px)',
                        backgroundSize: '20px 1px',
                        backgroundPosition: '0 15px'
                      }}>
                        "Hey hey [NOMBRE] oye, hace 7 días no escucho de ti, todo bien?"
                      </div>
                      <p><strong>💡 Tip:</strong> Aprovecha para interactuar con sus posts recientes: da like, comenta algo genuino, comparte si es relevante. ¡La interacción previa aumenta las posibilidades de respuesta!</p>
                    </div>
                  }
                  taskType="week"
                />
              </div>
            )}
          </div>

          {/* 3. Prospectar a nuevos */}
          <TaskSection
            title="Nuevos prospectos"
            count={prospectsClassification.newProspects.length}
            onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
            isActive={activeSection === 'new'}
            icon={MessageCircle}
            prospects={prospectsClassification.newProspects}
            tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
            taskType="new"
          />
        </div>

        {/* Configuración WhatsApp */}
        <div className="mt-6 sm:mt-8 text-center">
          <Button
            onClick={() => setShowWhatsAppConfig(!showWhatsAppConfig)}
            variant="outline"
            className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-700 hover:from-green-200 hover:to-emerald-200 font-mono text-sm transform hover:scale-105 transition-all"
          >
            <Phone className="h-4 w-4 mr-2" />
            {showWhatsAppConfig ? '📱 Ocultar configuración' : '📱 Configurar Conexión a WhatsApp'}
          </Button>
        </div>

        {showWhatsAppConfig && (
          <div className="mt-4">
            <div 
              className="bg-white rounded-xl shadow-lg border-l-4 border-green-400 p-4 sm:p-6"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f0fdf4 0%, #ffffff 100%)
                `,
                backgroundSize: '20px 1px, 100% 100%',
                backgroundPosition: '0 20px, 0 0'
              }}
            >
              <div className="text-center mb-4">
                <div className="inline-block p-2 bg-green-100 rounded-full mb-3">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 font-mono">
                  📱 Configuración de WhatsApp
                </h2>
              </div>

              {/* Número de WhatsApp */}
              <div className="mb-6">
                <Label htmlFor="whatsapp-number" className="text-sm font-mono font-bold text-green-800">
                  📞 Número de WhatsApp
                </Label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Horarios por día */}
              <div>
                <h3 className="text-sm font-mono font-bold text-green-800 mb-4">⏰ Horarios de Mensajes</h3>
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
                      <div key={day} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-mono font-bold">{dayNames[day as keyof typeof dayNames]}</Label>
                          <Checkbox
                            checked={config.enabled}
                            onCheckedChange={(checked) => {
                              setWeekSchedule(prev => ({
                                ...prev,
                                [day]: { ...prev[day as keyof typeof prev], enabled: !!checked }
                              }));
                            }}
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
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón guardar */}
              <div className="text-center mt-6">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-mono">
                  <Settings className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tips generales - Notebook style */}
        <div className="mt-6 sm:mt-8">
          <div 
            className="bg-white rounded-xl shadow-lg border-l-4 border-green-400 p-4 sm:p-6"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f0fdf4 0%, #ffffff 100%)
              `,
              backgroundSize: '20px 1px, 100% 100%',
              backgroundPosition: '0 20px, 0 0'
            }}
          >
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-800 mb-2">🚀 Tip Pro del Día</h3>
                <p className="text-sm sm:text-base text-green-700 font-mono leading-relaxed">
                  Para cada prospecto, dedica 30 segundos a interactuar con sus posts antes de enviar mensajes. 
                  Un like + comentario genuino puede triplicar tu tasa de respuesta. ¡La interacción es la clave del éxito!
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TasksToDo;