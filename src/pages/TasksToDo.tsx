import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  const [activeYesterdayTab, setActiveYesterdayTab] = useState('hower');
  const [activeWeekTab, setActiveWeekTab] = useState('hower');
  const [expandedTips, setExpandedTips] = useState<{[key: string]: boolean}>({});
  
  // Estados para diálogo de contacto guiado
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');

  // Estados para popup de contacto
  const [selectedProspect, setSelectedProspect] = useState<ProspectData | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [expandedDailyTip, setExpandedDailyTip] = useState(false);

  // Estados para nombre de lista editable y frases motivacionales
  const [listName, setListName] = useState('Mi Lista de prospección');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Cargar usuario actual y configuración inicial
  useEffect(() => {
    loadCurrentUser();
    loadProspects();
    // Generar frase motivacional aleatoria
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setMotivationalQuote(randomQuote);
  }, []);

  // Cargar nombre de lista cuando hay usuario
  useEffect(() => {
    if (currentUser) {
      loadListName();
    }
  }, [currentUser]);

  // Cargar usuario actual
  const loadCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading current user:', error);
        return;
      }

      if (data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

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

  // Manejar edición de nombre de lista
  const handleEditListName = () => {
    setTempListName(listName);
    setIsEditingListName(true);
  };

  const handleSaveListName = () => {
    if (tempListName.trim() && tempListName !== listName) {
      saveListName(tempListName);
    }
    setIsEditingListName(false);
  };

  const handleCancelEdit = () => {
    setTempListName('');
    setIsEditingListName(false);
  };


  const loadProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('last_message_date', { ascending: false })
        .limit(9); // Limitar a 9 prospectos

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
    setDialogUser(username);
    setDialogStep(1);
    setOpenDialog(true);
    
    // Si hay un mensaje predefinido, usarlo directamente, sino generar con IA
    if (predefinedMessage) {
      setDialogMessage(predefinedMessage);
    } else {
      const msg = await generateMessage(username, type);
      setDialogMessage(msg);
    }
  };

  // Función para abrir popup de contacto con IA
  const openContactPopup = async (prospect: ProspectData) => {
    setSelectedProspect(prospect);
    setContactMessage(''); // Limpiar mensaje anterior
    
    // Generar mensaje automáticamente con IA
    try {
      setGeneratingMessage(true);
      const aiMessage = await generateMessage(prospect.username, 'outreach');
      setContactMessage(aiMessage);
    } catch (error) {
      console.error('Error generando mensaje con IA:', error);
      toast({
        title: "Aviso",
        description: "No se pudo generar mensaje con IA, puedes escribir uno manual",
        variant: "default"
      });
    } finally {
      setGeneratingMessage(false);
    }
  };

  // Función para manejar contacto con prospecto (nuevo popup)
  const handleContactProspect = async () => {
    if (!selectedProspect || !contactMessage.trim()) return;

    try {
      setSendingMessage(true);
      // TODO: Implementar envío de mensaje a través del API de Instagram
      console.log('Enviando mensaje a:', selectedProspect.username);
      console.log('Mensaje:', contactMessage);

      toast({
        title: "Mensaje enviado",
        description: `Mensaje enviado a @${selectedProspect.username}`,
      });

      setSelectedProspect(null);
      setContactMessage('');
      
      // Marcar como completado
      handleMessageSent(selectedProspect.username);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Función para manejar cuando se envía un mensaje (marcar como completado automáticamente)
  const handleMessageSent = (username: string) => {
    // Marcar este prospecto como completado automáticamente
    const prospect = prospects.find(p => p.username === username);
    if (prospect) {
      // Marcar en todas las secciones donde puede aparecer este prospecto
      const taskTypes = ['pending', 'yesterday', 'week', 'new'];
      const updates: {[key: string]: boolean} = {};
      
      taskTypes.forEach(type => {
        updates[`${type}-${prospect.id}`] = true;
      });
      
      setCompletedTasks(prev => ({ ...prev, ...updates }));
      
      toast({
        title: "¡Prospecto contactado!",
        description: `@${username} marcado como completado.`,
        duration: 3000,
      });
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dialogMessage);
      toast({ title: 'Copiado', description: 'Mensaje copiado al portapapeles.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Copia manualmente el texto.' });
    }
  };

  const instaUrl = (username: string) => `https://www.instagram.com/m/${username}`;

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
      equivalencia = 'Como servirse un café ☕';
    } else if (minutes >= 5 && minutes <= 10) {
      equivalencia = 'Como ducharse 🚿';
    } else if (minutes >= 15) {
      equivalencia = 'Como ir al super 🛒';
    } else {
      equivalencia = 'Como desayunar 🍳';
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
      <div 
        className={`bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}
        onClick={() => openContactPopup(prospect)}
      >
        {/* Información principal del prospecto */}
        <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={prospect.profile_picture_url || ''} />
              <AvatarFallback className="text-xs sm:text-sm">{prospect.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base truncate">@{prospect.username}</p>
            </div>
          </div>
          {/* Botón de tips de interacción solo para seguimientos */}
          {isFollowUpProspect && (
            <div className="flex space-x-2 flex-shrink-0">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInteractionTip(isInteractionTipActive ? null : interactionTipKey);
                }}
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={isCompleted}
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">¿Cómo aumento respuesta?</span>
                <span className="sm:hidden">📈</span>
              </Button>
            </div>
          )}
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

    // Hook personalizado según el tipo de tarea
    const getCustomHook = (taskType: string) => {
      switch(taskType) {
        case 'yesterday':
          return {
            title: "🎯 Mensaje audio que funciona al 90%",
            gradient: "from-green-100 to-green-200",
            border: "border-green-300",
            textColor: "text-green-800"
          };
        case 'week':
          return {
            title: "🚀 Frase que revive contactos muertos",
            gradient: "from-blue-100 to-blue-200",
            border: "border-blue-300", 
            textColor: "text-blue-800"
          };
        case 'new':
          return {
            title: "💎 Sistema de prospección élite",
            gradient: "from-pink-100 to-pink-200",
            border: "border-pink-300",
            textColor: "text-pink-800"
          };
        default:
          return {
            title: "🔥 Secreto que aumenta respuestas 10x",
            gradient: "from-orange-100 to-orange-200",
            border: "border-orange-300",
            textColor: "text-orange-800"
          };
      }
    };

    const customHook = getCustomHook(taskType);

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
                      className={`bg-gradient-to-r ${customHook.gradient} border ${customHook.border} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={toggleTip}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`${customHook.textColor} font-semibold text-sm`}>{customHook.title}</span>
                        <ChevronRight className={`h-4 w-4 ${customHook.textColor}`} />
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
              
               {/* Tabs para divisiones por tipo */}
               <div className="bg-white rounded-xl p-4 border border-gray-100">
                 <Tabs 
                   value={taskType === 'yesterday' ? activeYesterdayTab : taskType === 'week' ? activeWeekTab : 'hower'} 
                   onValueChange={(value) => {
                     if (taskType === 'yesterday') setActiveYesterdayTab(value);
                     else if (taskType === 'week') setActiveWeekTab(value);
                   }} 
                   className="w-full"
                 >
                   <div className="overflow-x-auto pb-2">
                     <TabsList className="flex w-full min-w-fit gap-2 mb-4 bg-gray-100 p-2 rounded-xl">
                       <TabsTrigger value="hower" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap">
                         <span className="block sm:hidden">📱</span>
                         <span className="hidden sm:block">📱 Hower</span>
                       </TabsTrigger>
                       <TabsTrigger value="dms" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-green-500 data-[state=active]:text-white whitespace-nowrap">
                         <span className="block sm:hidden">💬</span>
                         <span className="hidden sm:block">💬 DM's</span>
                       </TabsTrigger>
                       <TabsTrigger value="comments" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap">
                         <span className="block sm:hidden">💭</span>
                         <span className="hidden sm:block">💭 Comentarios</span>
                       </TabsTrigger>
                       <TabsTrigger value="ads" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white whitespace-nowrap">
                         <span className="block sm:hidden">📢</span>
                         <span className="hidden sm:block">📢 Anuncios</span>
                       </TabsTrigger>
                     </TabsList>
                   </div>
                  
                   <TabsContent value="hower" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                     {prospects.filter((_, i) => i % 4 === 0).length === 0 ? (
                       <div className="text-center py-6 sm:py-8 text-muted-foreground">
                         <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                         <p className="text-sm sm:text-base">¡Excelente! No hay prospectos de Hower pendientes.</p>
                       </div>
                     ) : (
                       prospects.filter((_, i) => i % 4 === 0).map((prospect) => (
                         <div key={prospect.id} className="relative overflow-visible mb-5">
                           <div className="absolute -top-2 -right-2 z-20">
                             <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
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
                       <div className="text-center py-6 sm:py-8 text-muted-foreground">
                         <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                         <p className="text-sm sm:text-base">¡Excelente! No hay DM's pendientes.</p>
                       </div>
                     ) : (
                       prospects.filter((_, i) => i % 4 === 1).map((prospect) => (
                         <div key={prospect.id} className="relative overflow-visible mb-5">
                           <div className="absolute -top-2 -right-2 z-20">
                             <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
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
                       <div className="text-center py-6 sm:py-8 text-muted-foreground">
                         <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                         <p className="text-sm sm:text-base">¡Excelente! No hay comentarios pendientes.</p>
                       </div>
                     ) : (
                       prospects.filter((_, i) => i % 4 === 2).map((prospect) => (
                         <div key={prospect.id} className="relative overflow-visible mb-5">
                           <div className="absolute -top-2 -right-2 z-20">
                             <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
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
                       <div className="text-center py-6 sm:py-8 text-muted-foreground">
                         <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                         <p className="text-sm sm:text-base">¡Excelente! No hay anuncios pendientes.</p>
                       </div>
                     ) : (
                       prospects.filter((_, i) => i % 4 === 3).map((prospect) => (
                         <div key={prospect.id} className="relative overflow-visible mb-5">
                           <div className="absolute -top-2 -right-2 z-20">
                             <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold shadow-md border-2 border-white px-2 py-1 rounded-full">
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
                    {showStats ? '📊 Ocultar mis números' : '🚀 ¿Cómo lo hice?'}
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

                      <Tabs defaultValue="hoy" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                          <TabsTrigger value="hoy" className="font-mono text-sm">Hoy</TabsTrigger>
                          <TabsTrigger value="ayer" className="font-mono text-sm">Ayer</TabsTrigger>
                          <TabsTrigger value="semana" className="font-mono text-sm">Esta Semana</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="hoy" className="space-y-3">
                          <div className="bg-gradient-to-r from-green-50 to-white p-3 rounded-lg border border-green-200">
                            <h3 className="text-base font-bold text-green-800 mb-3 font-mono">📅 Hoy</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'hoy-nuevos' ? null : 'hoy-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Abiertas</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  0
                                </div>
                              </div>
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'hoy-seguimientos' ? null : 'hoy-seguimientos')}
                              >
                                <span className="font-mono text-sm">🔄 Seguimientos</span>
                                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold text-sm">
                                  0
                                </div>
                              </div>
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400"
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  0
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="ayer" className="space-y-3">
                          <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-200">
                            <h3 className="text-base font-bold text-blue-800 mb-3 font-mono">📅 Ayer</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-nuevos' ? null : 'ayer-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Abiertas</span>
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
                                <span className="font-mono text-sm">💬 Abiertas</span>
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
                <div className="text-center">
                  {isEditingListName ? (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input
                        type="text"
                        value={tempListName}
                        onChange={(e) => setTempListName(e.target.value)}
                        className="text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary-foreground text-gray-800 font-mono text-center"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveListName()}
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={handleSaveListName}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <h1 
                      className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 font-mono cursor-pointer hover:text-primary inline-flex items-center gap-2"
                      onClick={handleEditListName}
                    >
                      🚀 {listName}
                      <Edit2 className="w-4 h-4 opacity-50" />
                    </h1>
                  )}
                  <p className="text-sm text-gray-500 italic mb-4 font-mono">
                    {motivationalQuote}
                  </p>
                </div>
                
                {/* Tag de tiempo estimado */}
                <div className="mt-3">
                  <div className="inline-block bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300 px-4 py-2 rounded-lg max-w-md">
                    <div className="text-center">
                      <span className="text-orange-800 font-mono text-sm font-bold">
                        ⏱️ Te demorarás: {calculateEstimatedTime().minutes} minutos ({calculateEstimatedTime().equivalencia})
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
                        className="bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 border-2 border-purple-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                        onClick={() => setExpandedTips(prev => ({ ...prev, ['tip-pending']: !prev['tip-pending'] }))}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-purple-800 font-semibold text-sm">⚡ Hack de velocidad 3X más respuestas</span>
                          <ChevronRight className="h-4 w-4 text-purple-600" />
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
                         <div className="overflow-x-auto pb-2">
                           <TabsList className="flex w-full min-w-fit gap-2 mb-4 bg-gray-100 p-2 rounded-xl">
                             <TabsTrigger value="hower" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap">
                               <span className="block sm:hidden">📱</span>
                               <span className="hidden sm:block">📱 Hower</span>
                             </TabsTrigger>
                             <TabsTrigger value="dms" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-green-500 data-[state=active]:text-white whitespace-nowrap">
                               <span className="block sm:hidden">💬</span>
                               <span className="hidden sm:block">💬 DM's</span>
                             </TabsTrigger>
                             <TabsTrigger value="comments" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap">
                               <span className="block sm:hidden">💭</span>
                               <span className="hidden sm:block">💭 Comentarios</span>
                             </TabsTrigger>
                             <TabsTrigger value="ads" className="font-mono text-xs px-3 py-2 rounded-lg bg-white shadow-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white whitespace-nowrap">
                               <span className="block sm:hidden">📢</span>
                               <span className="hidden sm:block">📢 Anuncios</span>
                             </TabsTrigger>
                           </TabsList>
                         </div>
                        
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
                      Prospectos en seguimiento
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
      
      {/* Diálogo de contacto guiado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar a @{dialogUser}</DialogTitle>
            <DialogDescription>
              Paso {dialogStep} de 2
            </DialogDescription>
          </DialogHeader>

          {dialogStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">1) Copia el mensaje generado por IA:</p>
              <div className="border rounded-md p-3 text-sm whitespace-pre-wrap bg-muted/30">
                {dialogMessage || 'Generando sugerencia…'}
              </div>
              <div className="flex justify-end">
                <Button onClick={copyMessage}><Copy className="w-4 h-4 mr-2" /> Copiar mensaje</Button>
              </div>
            </div>
          )}

          {dialogStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">2) Ahora, envía el mensaje:</p>
              <a className="inline-flex items-center gap-2 text-primary underline" href={instaUrl(dialogUser)} target="_blank" rel="noopener noreferrer">
                Abrir conversación en Instagram <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-muted-foreground">Se abrirá en una nueva pestaña. Pega el mensaje y envíalo.</p>
            </div>
          )}

          <DialogFooter>
            {dialogStep === 1 ? (
              <Button onClick={() => setDialogStep(2)}>Continuar</Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpenDialog(false);
                  handleMessageSent(dialogUser);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                Listo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            className="bg-white rounded-xl shadow-lg border-l-4 border-green-400 p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setExpandedDailyTip(!expandedDailyTip)}
            style={{
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
                <Heart className="h-5 w-5 text-green-600 flex-shrink-0" />
                <h3 className="font-bold text-green-800">🚀 Tip Pro del Día</h3>
              </div>
              {expandedDailyTip ? <ChevronDown className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-green-600" />}
            </div>
            
            {expandedDailyTip && (
              <div className="mt-3 pl-8">
                <p className="text-sm sm:text-base text-green-700 font-mono leading-relaxed">
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
            src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
            alt="Hower"
            className="w-12 h-12 rounded-2xl object-cover mx-auto opacity-70 hover:opacity-100 transition-opacity"
          />
          <p className="text-xs text-gray-400 mt-2 font-mono">Powered by Hower Assistant</p>
        </div>

      </div>
      
      {/* Popup de contacto directo */}
      <Dialog open={!!selectedProspect} onOpenChange={(open) => !open && setSelectedProspect(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contactar Prospecto
            </DialogTitle>
            <DialogDescription>
              {generatingMessage 
                ? "Generando mensaje con IA..." 
                : `Envía un mensaje a @${selectedProspect?.username}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedProspect?.profile_picture_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  {selectedProspect?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">@{selectedProspect?.username}</h4>
                <p className="text-sm text-gray-600">
                  Último mensaje: {selectedProspect && new Date(selectedProspect.last_message_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="contact-message">Mensaje</Label>
              <Textarea
                id="contact-message"
                placeholder={generatingMessage ? "Generando mensaje con IA..." : "Escribe tu mensaje aquí..."}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="mt-1"
                disabled={generatingMessage}
              />
              {generatingMessage && (
                <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Generando mensaje personalizado con IA...
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedProspect(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleContactProspect}
                disabled={!contactMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Enviar Mensaje
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksToDo;