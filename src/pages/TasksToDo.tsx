import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2 } from 'lucide-react';
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

  const [expandedDailyTip, setExpandedDailyTip] = useState(false);

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

  // Limpiar tareas completadas cuando los prospectos responden
  useEffect(() => {
    console.log('🔍 [DESTACHAR] Revisando si hay que destachar prospectos...');
    console.log('🔍 [DESTACHAR] Prospectos actuales:', realProspects.length);
    
    if (realProspects.length > 0) {
      realProspects.forEach(prospect => {
        console.log(`🔍 [DESTACHAR] Prospecto ${prospect.username}:`, {
          state: prospect.state,
          senderId: prospect.senderId,
          lastMessageType: prospect.lastMessageType,
          lastMessageTime: prospect.lastMessageTime
        });
        
        // Si el prospecto está en pending (acaba de responder), limpiar todas sus marcas de completado
        if (prospect.state === 'pending') {
          console.log(`🔄 [DESTACHAR] ${prospect.username} está en PENDING - revisando si estaba tachado...`);
          
          const taskTypes = ['pending', 'yesterday', 'week', 'new'];
          
          taskTypes.forEach(type => {
            const taskKey = `${type}-${prospect.senderId}`;
            
            setCompletedTasks(prev => {
              if (prev[taskKey]) {
                console.log(`✅ [DESTACHAR] DESTACHANDO ${prospect.username} de ${type} (prospecto respondió o cambió de estado)`);
                const updated = { ...prev };
                delete updated[taskKey]; // Remover la marca de completado
                return updated;
              } else {
                console.log(`ℹ️ [DESTACHAR] ${prospect.username} en ${type} no estaba tachado`);
                return prev;
              }
            });
          });
        } else {
          console.log(`ℹ️ [DESTACHAR] ${prospect.username} NO está en pending (estado: ${prospect.state})`);
        }
      });
    }
  }, [realProspects]);

  // Función para refrescar manualmente los datos
  const handleRefreshData = async () => {
    console.log('🔄 Refrescando datos manualmente...');
    await refetch();
    toast({
      title: "Datos actualizados",
      description: "La lista de prospectos se ha actualizado"
    });
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

  // Función para eliminar prospectos pendientes
  const deletePendingProspects = async () => {
    if (!currentUser) {
      console.log('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('🗑️ Eliminando prospectos de la lista pendientes...');
    
    try {
      const pendingProspectIds = realProspects
        .filter(p => p.state === 'pending')
        .map(p => p.senderId);
      
      console.log('📋 IDs de prospectos pendientes a eliminar:', pendingProspectIds);
      
      if (pendingProspectIds.length === 0) {
        toast({
          title: "Sin prospectos",
          description: "No hay prospectos pendientes para eliminar",
        });
        return;
      }

      // Eliminar mensajes donde el usuario envió a estos prospectos (recipient_id)
      console.log('🗑️ Eliminando mensajes enviados a estos prospectos...');
      const { data: sentMessages, error: sentError } = await supabase
        .from('instagram_messages')
        .delete()
        .eq('sender_id', currentUser.instagram_user_id)
        .in('recipient_id', pendingProspectIds);

      // Eliminar mensajes recibidos de estos prospectos (sender_id)  
      console.log('🗑️ Eliminando mensajes recibidos de estos prospectos...');
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('instagram_messages')
        .delete()
        .eq('instagram_user_id', currentUser.id)
        .in('sender_id', pendingProspectIds);

      console.log('📊 Mensajes enviados eliminados:', sentMessages);
      console.log('📊 Mensajes recibidos eliminados:', receivedMessages);

      if (sentError) {
        console.log('❌ Error eliminando mensajes enviados:', sentError);
        throw sentError;
      }

      if (receivedError) {
        console.log('❌ Error eliminando mensajes recibidos:', receivedError);
        throw receivedError;
      }

      console.log('🔄 Refrescando datos...');
      await refetch();
      
      console.log('✅ Prospectos eliminados de la lista pendientes!');
      toast({
        title: "Prospectos eliminados",
        description: `Se eliminaron ${pendingProspectIds.length} prospectos de pendientes`,
      });
      
    } catch (error) {
      console.error('💥 Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los prospectos: " + error.message,
        variant: "destructive"
      });
    }
  };
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

      // Intentar copiar mensaje automáticamente
      try {
        await navigator.clipboard.writeText(messageToSend);
        
        // Si la copia automática funciona, mostrar popup automático
        setDialogStep(1); // Paso automático
        setOpenDialog(true);

        toast({
          title: "Mensaje copiado",
          description: "Listo para enviar",
        });

        // Abrir Instagram automáticamente después de 6 segundos
        setTimeout(() => {
          window.open(instaUrl(username), '_blank');
          setOpenDialog(false);
          
          // Marcar como completado automáticamente después de 5 segundos más
          setTimeout(() => {
            handleMessageSent(username);
            toast({
              title: "¡Completado!",
              description: `@${username} marcado como contactado`,
            });
          }, 5000);
        }, 6000);

      } catch (clipboardError) {
        // Si falla la copia automática, usar flujo manual de 2 pasos
        console.log('Clipboard automático falló, usando flujo manual');
        setDialogStep(2); // Paso manual
        setOpenDialog(true);
        
        toast({
          title: "Flujo manual",
          description: "Copia el mensaje manualmente",
        });
      }
      
    } catch (error) {
      console.error('Error en el flujo de contacto:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el mensaje",
        variant: "destructive"
      });
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar todos los datos de Instagram del localStorage
    localStorage.removeItem("instagram_access_token");
    localStorage.removeItem("hower-instagram-user");
    localStorage.removeItem("hower-instagram-token");
    localStorage.removeItem("hower-auth-redirect");
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente"
    });
    
    // Redirigir a la página principal después de cerrar sesión
    setTimeout(() => {
      navigate('/', { replace: true });
      window.location.reload(); // Recargar para resetear completamente el estado
    }, 1000);
  };


  // Función para manejar cuando se envía un mensaje (marcar como completado automáticamente)
  const handleMessageSent = (username: string) => {
    // Marcar este prospecto como completado automáticamente
    const prospect = prospects.find(p => p.userName === username);
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
      toast({ 
        title: 'Copiado', 
        description: 'Mensaje copiado correctamente.' 
      });
      
      // Si estamos en el flujo manual (step 2), avanzar automáticamente al paso 3
      if (dialogStep === 2) {
        setTimeout(() => {
          setDialogStep(3);
        }, 500); // Pequeño delay para que el usuario vea el toast
      }
    } catch (error) {
      console.error('Error copiando mensaje:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo copiar. Copia manualmente el texto.',
        variant: 'destructive'
      });
    }
  };

  const instaUrl = (username: string) => `https://www.instagram.com/m/${username}`;

  // Clasificar prospectos y calcular estadísticas
  const prospectsClassification = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 🔥 NUEVA LÓGICA: Usar los estados del hook useProspects
    
    // Prospectos pendientes: state === 'pending' (separados por fuente)
    const pendingResponses = {
      hower: realProspects.filter(p => p.state === 'pending' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'pending' && p.source === 'dm').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'pending' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      ads: realProspects.filter(p => p.state === 'pending' && p.source === 'ads').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // Prospectos que no respondieron ayer: state === 'yesterday' (separados por fuente)
    const noResponseYesterday = {
      hower: realProspects.filter(p => p.state === 'yesterday' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'yesterday' && p.source === 'dm').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'yesterday' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      ads: realProspects.filter(p => p.state === 'yesterday' && p.source === 'ads').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // Prospectos que no respondieron en 7 días: state === 'week' (separados por fuente)
    const noResponse7Days = {
      hower: realProspects.filter(p => p.state === 'week' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'week' && p.source === 'dm').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'week' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      ads: realProspects.filter(p => p.state === 'week' && p.source === 'ads').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // Prospectos nuevos: nunca contactados (separados por fuente)
    const newProspects = {
      hower: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'hower'),
      dm: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'dm'),
      comment: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'comment'),
      ads: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'ads')
    };

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
    const pendingCount = prospectsClassification.pendingResponses.hower.length + 
                        prospectsClassification.pendingResponses.dm.length + 
                        prospectsClassification.pendingResponses.comment.length + 
                        prospectsClassification.pendingResponses.ads.length;
    
    const newCount = prospectsClassification.newProspects.hower.length + 
                    prospectsClassification.newProspects.dm.length + 
                    prospectsClassification.newProspects.comment.length + 
                    prospectsClassification.newProspects.ads.length;
    
    const totalProspects = pendingCount + newCount;
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

    // 🔥 DETECCIÓN AUTOMÁTICA: Si el último mensaje lo envié YO, marcar como completado
    const realProspectData = realProspects.find(rp => rp.senderId === prospect.id);
    const shouldAutoComplete = realProspectData && realProspectData.lastMessageType === 'sent';
    
    // Auto-completar si detectamos que ya respondí
    if (shouldAutoComplete && !completedTasks[taskKey] && taskType === 'pending') {
      console.log(`✅ [AUTO-COMPLETE] Marcando como completado automáticamente: ${prospect.userName}`);
      setCompletedTasks(prev => ({ ...prev, [taskKey]: true }));
    }

    console.log('Rendering ProspectCard for:', prospect.userName, 'Task type:', taskType);
    console.log('Is interaction tip active?', isInteractionTipActive);
    
    return (
      <div 
        className={`bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}
        onClick={() => openOnboarding(prospect.userName, 'outreach')}
      >
        {/* Información principal del prospecto */}
        <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={prospect.avatar || ''} />
              <AvatarFallback className="text-xs sm:text-sm">{prospect.userName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base truncate">@{prospect.userName}</p>
            </div>
          </div>
          
          {/* Solo botón de tips de interacción para seguimientos */}
          <div className="flex space-x-2 flex-shrink-0">
            {isFollowUpProspect && (
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
            )}
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
                  <h4 className="font-bold text-blue-800 text-sm font-mono">💡 Cómo interactuar con @{prospect.userName}:</h4>
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
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 hidden" />
                <span className={`${sectionCompleted || allProspectsCompleted ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>{title}</span>
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
          {/* Aviso sobre sincronización manual */}
          {prospectsClassification.pendingResponses.hower.length + prospectsClassification.pendingResponses.dm.length + prospectsClassification.pendingResponses.comment.length + prospectsClassification.pendingResponses.ads.length > 0 && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                💡 <strong>Importante:</strong> Si respondes a un prospecto desde Instagram directamente, haz clic en el botón <strong>"Sincronizar"</strong> para actualizar el estado aquí.
              </AlertDescription>
            </Alert>
          )}

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
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {isEditingListName ? (
                      <div className="flex items-center justify-center gap-2">
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
                  </div>
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
        <div className="space-y-3 sm:space-y-4 mt-12 sm:mt-16">
          {/* 1. Responder prospectos pendientes con tabs */}
          <div className="mb-4 sm:mb-6">
            <Card
              className="transition-all hover:shadow-md border-l-4 border-l-primary"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: activeSection === 'pending' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 cursor-pointer" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                    <span className={`${(completedTasks['section-pending'] || 
                      [...prospectsClassification.pendingResponses.hower, 
                       ...prospectsClassification.pendingResponses.dm, 
                       ...prospectsClassification.pendingResponses.comment, 
                       ...prospectsClassification.pendingResponses.ads].every(p => completedTasks[`pending-${p.id}`])) ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>Prospectos pendientes</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">{prospectsClassification.pendingResponses.hower.length + prospectsClassification.pendingResponses.dm.length + prospectsClassification.pendingResponses.comment.length + prospectsClassification.pendingResponses.ads.length}</Badge>
                    
                    {/* 🔥 BOTÓN DE DEBUG PARA REFRESCAR MANUALMENTE */}
                    <Button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        console.log('🔄 [DEBUG] Refrescando manualmente...');
                        console.log('🔄 [DEBUG] Estado actual de prospectos:', realProspects.length);
                        console.log('🔄 [DEBUG] Tareas completadas actuales:', Object.keys(completedTasks));
                        
                        // Forzar refetch
                        await refetch();
                        
                        console.log('🔄 [DEBUG] Después del refetch, prospectos:', realProspects.length);
                        
                        // Mostrar toast con información
                        toast({
                          title: "📱 Datos sincronizados",
                          description: `Actualizados ${realProspects.length} prospectos desde Instagram`,
                        });
                      }}
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      title="Haz clic después de responder en Instagram para sincronizar"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span className="text-xs">Sincronizar</span>
                    </Button>
                    
                    {(prospectsClassification.pendingResponses.hower.length + prospectsClassification.pendingResponses.dm.length + prospectsClassification.pendingResponses.comment.length + prospectsClassification.pendingResponses.ads.length) > 0 && (
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
                          {prospectsClassification.pendingResponses.hower.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay prospectos de Hower pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.hower.map((prospect) => (
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
                          {prospectsClassification.pendingResponses.dm.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay DM's pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.dm.map((prospect) => (
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
                          {prospectsClassification.pendingResponses.comment.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay comentarios pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.comment.map((prospect) => (
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
                          {prospectsClassification.pendingResponses.ads.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay anuncios pendientes.</p>
                            </div>
                          ) : (
                            prospectsClassification.pendingResponses.ads.map((prospect) => (
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
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0 hidden" />
                    <span className={`${(completedTasks['section-followup'] || 
                      (prospectsClassification.noResponseYesterday.hower.length === 0 && 
                       prospectsClassification.noResponseYesterday.dm.length === 0 && 
                       prospectsClassification.noResponseYesterday.comment.length === 0 && 
                       prospectsClassification.noResponseYesterday.ads.length === 0 && 
                       prospectsClassification.noResponse7Days.hower.length === 0 && 
                       prospectsClassification.noResponse7Days.dm.length === 0 && 
                       prospectsClassification.noResponse7Days.comment.length === 0 && 
                       prospectsClassification.noResponse7Days.ads.length === 0) || 
                      [...prospectsClassification.noResponseYesterday.hower, 
                       ...prospectsClassification.noResponseYesterday.dm, 
                       ...prospectsClassification.noResponseYesterday.comment, 
                       ...prospectsClassification.noResponseYesterday.ads,
                       ...prospectsClassification.noResponse7Days.hower,
                       ...prospectsClassification.noResponse7Days.dm,
                       ...prospectsClassification.noResponse7Days.comment,
                       ...prospectsClassification.noResponse7Days.ads].every(p => completedTasks[`yesterday-${p.id}`] || completedTasks[`week-${p.id}`])) ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>
                      Prospectos en seguimiento
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
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
            
            {/* Subsecciones de seguimiento - Solo se muestran cuando showFollowUpSections es true */}
            {showFollowUpSections && (
              <div className="ml-4 sm:ml-6 mt-4 space-y-3 sm:space-y-4">
                {/* 2.1 No respondieron ayer */}
                <TaskSection
                  title="No respondieron ayer"
                  count={prospectsClassification.noResponseYesterday.hower.length + 
                         prospectsClassification.noResponseYesterday.dm.length + 
                         prospectsClassification.noResponseYesterday.comment.length + 
                         prospectsClassification.noResponseYesterday.ads.length}
                  onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
                  isActive={activeSection === 'yesterday'}
                  icon={Clock}
                  prospects={[...prospectsClassification.noResponseYesterday.hower, 
                             ...prospectsClassification.noResponseYesterday.dm, 
                             ...prospectsClassification.noResponseYesterday.comment, 
                             ...prospectsClassification.noResponseYesterday.ads]}
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
                  count={prospectsClassification.noResponse7Days.hower.length + 
                         prospectsClassification.noResponse7Days.dm.length + 
                         prospectsClassification.noResponse7Days.comment.length + 
                         prospectsClassification.noResponse7Days.ads.length}
                  onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
                  isActive={activeSection === 'week'}
                  icon={Calendar}
                  prospects={[...prospectsClassification.noResponse7Days.hower,
                             ...prospectsClassification.noResponse7Days.dm,
                             ...prospectsClassification.noResponse7Days.comment,
                             ...prospectsClassification.noResponse7Days.ads]}
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
            count={prospectsClassification.newProspects.hower.length + 
                   prospectsClassification.newProspects.dm.length + 
                   prospectsClassification.newProspects.comment.length + 
                   prospectsClassification.newProspects.ads.length}
            onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
            isActive={activeSection === 'new'}
            icon={MessageCircle}
            prospects={[...prospectsClassification.newProspects.hower,
                       ...prospectsClassification.newProspects.dm,
                       ...prospectsClassification.newProspects.comment,
                       ...prospectsClassification.newProspects.ads]}
            tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
            taskType="new"
          />
        </div>

        {/* Configuración WhatsApp */}
        <div className="mt-8 sm:mt-12 text-center">
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
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => {
                              setWeekSchedule(prev => ({
                                ...prev,
                                [day]: { ...prev[day as keyof typeof prev], enabled: e.target.checked }
                              }));
                            }}
                            className="rounded"
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
          <p className="text-xs text-gray-400 mt-2 font-mono">Hecho con 💜 por Hower</p>
          
          {/* Botones de opciones */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Settings className="w-4 h-4 mr-1" />
              Otras opciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>

      </div>
      
      {/* Diálogo de contacto guiado */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        // Solo cerrar si es el flujo automático (step 1) o si el usuario realmente quiere cerrar
        if (!open && dialogStep !== 2 && dialogStep !== 3) {
          setOpenDialog(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              {dialogStep === 1 ? "✅ Mensaje Copiado" : "Enviar a @" + dialogUser}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dialogStep === 1 
                ? "Te abriremos Instagram en unos segundos" 
                : "Paso " + (dialogStep === 2 ? "1" : dialogStep) + " de 2"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Popup automático (cuando clipboard funciona) */}
          {dialogStep === 1 && (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-medium">
                  Para @{dialogUser}
                </div>
                <div className="text-sm text-green-600">
                  Solo pega el mensaje y envía
                </div>
              </div>

              <div className="border rounded-md p-3 text-sm bg-gray-50 text-left">
                {dialogMessage}
              </div>

              <div className="text-sm text-gray-500">
                ⏱️ Abriendo Instagram en 6 segundos...
              </div>
            </div>
          )}

          {/* Flujo manual paso 1 (cuando clipboard falla) */}
          {dialogStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">1) Copia este mensaje:</p>
              <div className="border rounded-md p-3 text-sm whitespace-pre-wrap bg-muted/30">
                {dialogMessage || 'Generando sugerencia…'}
              </div>
              <div className="flex justify-end">
                <Button onClick={copyMessage}><Copy className="w-4 h-4 mr-2" /> Copiar mensaje</Button>
              </div>
            </div>
          )}

          {/* Flujo manual paso 2 */}
          {dialogStep === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">2) Ahora envía el mensaje:</p>
              <a className="inline-flex items-center gap-2 text-primary underline" href={instaUrl(dialogUser)} target="_blank" rel="noopener noreferrer">
                Abrir conversación en Instagram <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-muted-foreground">Se abrirá en una nueva pestaña. Pega el mensaje y envíalo.</p>
            </div>
          )}

          {/* Botones del flujo manual */}
          {(dialogStep === 2 || dialogStep === 3) && (
            <DialogFooter>
              {dialogStep === 2 ? (
                <Button onClick={() => setDialogStep(3)}>Continuar</Button>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksToDo;