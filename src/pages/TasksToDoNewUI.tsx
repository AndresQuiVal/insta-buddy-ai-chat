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

const TasksToDoNewUI: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading, refetch } = useProspects(currentUser?.instagram_user_id);

  // Debug adicional para verificar la carga de prospectos
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

  // Debug manual - simular usuario autenticado para hower.a.i
  useEffect(() => {
    const simulateAuth = () => {
      const howerUserData = {
        instagram: {
          id: "17841476552113029"
        },
        facebook: {
          id: "17841476552113029"
        },
        access_token: "stored_token",
        username: "hower.a.i"
      };
      
      console.log('🔧 [DEBUG] Simulando autenticación para hower.a.i...');
      localStorage.setItem('hower-instagram-user', JSON.stringify(howerUserData));
      console.log('✅ [DEBUG] Datos guardados en localStorage');
      
      // Forzar recarga del hook
      window.dispatchEvent(new Event('storage'));
    };
    
    // Simular si no hay datos en localStorage
    if (!localStorage.getItem('hower-instagram-user')) {
      console.log('🔧 [DEBUG] No hay datos en localStorage, simulando...');
      simulateAuth();
    }
  }, []);

  // Debug del estado de autenticación
  useEffect(() => {
    console.log('🔍 [AUTH-DEBUG] Estado de autenticación:', {
      userLoading,
      currentUser: currentUser ? currentUser.instagram_user_id : 'null',
      localStorage: localStorage.getItem('hower-instagram-user') ? 'presente' : 'ausente'
    });
    
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

  // Función para cargar estadísticas usando GROK
  const loadStats = useCallback(async () => {
    if (!currentUser?.instagram_user_id) return;

    try {
      // Usar las funciones GROK para obtener estadísticas
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

      console.log('📊 [GROK] Estadísticas cargadas:', {
        today: todayData.data?.[0],
        yesterday: yesterdayData.data?.[0],
        week: weekData.data?.[0]
      });

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

  // Función para compartir estadísticas como imagen
  const shareStats = async () => {
    console.log('🖼️ Iniciando función shareStats...');
    
    const statsElement = document.querySelector('[data-stats-container]');
    console.log('🔍 Elemento encontrado:', statsElement);
    
    if (!statsElement) {
      console.error('❌ No se encontró el elemento [data-stats-container]');
      toast({
        title: "Error",
        description: "No se pudo capturar las estadísticas",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📸 Iniciando html2canvas...');
      
      // Asegurarse de que todos los elementos estén visibles y cargados
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Crear canvas de la sección de estadísticas con mejor calidad
      const canvas = await html2canvas(statsElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: statsElement.scrollWidth,
        height: statsElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      console.log('✅ html2canvas completado. Canvas:', canvas.width, 'x', canvas.height);

      // Crear un nuevo canvas para la imagen final con mejor diseño
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d')!;
      
      // Dimensiones del canvas final - más ancho para mejor presentación
      const padding = 40;
      const headerHeight = 100;
      const footerHeight = 40;
      finalCanvas.width = Math.max(canvas.width + (padding * 2), 600);
      finalCanvas.height = canvas.height + headerHeight + footerHeight + (padding * 2);

      console.log('🎨 Canvas final:', finalCanvas.width, 'x', finalCanvas.height);

      // Fondo con gradiente elegante
      const gradient = ctx.createLinearGradient(0, 0, 0, finalCanvas.height);
      gradient.addColorStop(0, '#7a60ff'); // primary
      gradient.addColorStop(0.3, '#9c89ff'); // primary-light
      gradient.addColorStop(1, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Cargar y dibujar el logo de Hower
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      const drawContent = () => {
        // Limpiar el área del encabezado con un fondo más suave
        const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
        headerGradient.addColorStop(0, '#7a60ff');
        headerGradient.addColorStop(1, '#9c89ff');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, finalCanvas.width, headerHeight);
        
        // Dibujar logo centrado
        const logoSize = 50;
        const logoX = finalCanvas.width / 2 - 80; // Posición a la izquierda del texto
        const logoY = (headerHeight - logoSize) / 2;
        
        try {
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        } catch (error) {
          // Si no se puede cargar el logo, dibujar un placeholder
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(logoX, logoY, logoSize, logoSize);
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(logoX, logoY, logoSize, logoSize);
          
          // Texto "H" como placeholder
          ctx.fillStyle = '#7a60ff';
          ctx.font = 'bold 24px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('H', logoX + logoSize/2, logoY + logoSize/2 + 8);
        }
        
        // Añadir texto "Hower" a la derecha del logo
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Poppins, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Hower', logoX + logoSize + 15, (headerHeight / 2) + 10);
        
        // Fondo blanco para las estadísticas
        const statsY = headerHeight + padding;
        const statsHeight = canvas.height + padding;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padding, statsY - padding/2, finalCanvas.width - (padding * 2), statsHeight);
        
        // Sombra suave para las estadísticas
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        
        // Dibujar las estadísticas centradas
        const statsX = (finalCanvas.width - canvas.width) / 2;
        ctx.drawImage(canvas, statsX, statsY);
        
        // Quitar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Pie de página elegante
        const footerY = finalCanvas.height - footerHeight;
        const footerGradient = ctx.createLinearGradient(0, footerY, 0, finalCanvas.height);
        footerGradient.addColorStop(0, 'rgba(122, 96, 255, 0.1)');
        footerGradient.addColorStop(1, 'rgba(122, 96, 255, 0.2)');
        ctx.fillStyle = footerGradient;
        ctx.fillRect(0, footerY, finalCanvas.width, footerHeight);
        
        // Texto del pie
        ctx.fillStyle = '#7a60ff';
        ctx.font = '14px Poppins, sans-serif';
        ctx.textAlign = 'center';
        const currentDate = new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        ctx.fillText(`Generado el ${currentDate} | hower.ai`, finalCanvas.width / 2, footerY + 25);
        
        console.log('🎯 Creando blob...');
        
        // Convertir a blob y descargar
        finalCanvas.toBlob((blob) => {
          console.log('📦 Blob creado:', blob);
          
          if (blob) {
            console.log('💾 Iniciando descarga...');
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hower-estadisticas-${new Date().toISOString().split('T')[0]}.png`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            console.log('🔗 Link creado y añadido al DOM');
            
            link.click();
            console.log('👆 Click ejecutado');
            
            // Cleanup
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              console.log('🧹 Cleanup completado');
            }, 100);
            
            toast({
              title: "¡Estadísticas compartidas!",
              description: "La imagen se ha descargado correctamente"
            });
          } else {
            console.error('❌ No se pudo crear el blob');
            toast({
              title: "Error en blob",
              description: "No se pudo crear la imagen",
              variant: "destructive"
            });
          }
        }, 'image/png', 1.0);
      };
      
      // Intentar cargar el logo
      logo.onload = drawContent;
      logo.onerror = drawContent; // Si falla, dibujar sin logo pero con placeholder
      logo.src = howerLogo;
      
    } catch (error) {
      console.error('💥 Error en shareStats:', error);
      toast({
        title: "Error",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Cargar estadísticas cuando hay usuario
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser, loadStats]);

  // Cargar estados de tareas desde la base de datos (mejorado)
  useEffect(() => {
    const loadTaskStatusFromDB = async () => {
      if (!currentUser) return;
      
      console.log('📖 [DB-LOAD] Cargando estados desde la BD...');
      
      try {
        const { data: taskStatuses, error } = await supabase
          .from('prospect_task_status')
          .select('prospect_sender_id, task_type, is_completed, last_message_type')
          .eq('instagram_user_id', currentUser.instagram_user_id);
        
        if (error) {
          console.error('❌ [DB-LOAD] Error cargando estados:', error);
          return;
        }
        
        console.log('📊 [DB-LOAD] Estados en BD:', taskStatuses);
        
        // Convertir datos de BD al formato del estado local
        const dbTaskStates: {[key: string]: boolean} = {};
        taskStatuses?.forEach(task => {
          if (task.is_completed) {
            dbTaskStates[`${task.task_type}-${task.prospect_sender_id}`] = true;
            console.log(`📋 [DB-LOAD] Cargando como tachado: ${task.prospect_sender_id} (${task.last_message_type})`);
          } else {
            console.log(`📋 [DB-LOAD] Cargando como destachado: ${task.prospect_sender_id} (${task.last_message_type})`);
          }
        });
        
        console.log('✅ [DB-LOAD] Estados finales para UI:', Object.keys(dbTaskStates));
        setCompletedTasks(dbTaskStates);
        
      } catch (error) {
        console.error('💥 [DB-LOAD] Error general:', error);
      }
    };

    loadTaskStatusFromDB();
  }, [currentUser]);

  // 🔥 Suscripción en tiempo real para actualizaciones de prospect_task_status
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔴 [REALTIME] Configurando suscripción a prospect_task_status...');
    
    const channel = supabase
      .channel('prospect-task-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'prospect_task_status',
          filter: `instagram_user_id=eq.${currentUser.instagram_user_id}`
        },
        (payload) => {
          console.log('🔴 [REALTIME] Cambio detectado en prospect_task_status:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new;
            if (newData && newData.is_completed) {
              console.log(`🔴 [REALTIME] Marcando como completado: ${newData.prospect_sender_id}`);
              setCompletedTasks(prev => ({
                ...prev,
                [`${newData.task_type}-${newData.prospect_sender_id}`]: true
              }));
            } else if (newData && !newData.is_completed) {
              console.log(`🔴 [REALTIME] Marcando como no completado: ${newData.prospect_sender_id}`);
              setCompletedTasks(prev => {
                const updated = { ...prev };
                delete updated[`${newData.task_type}-${newData.prospect_sender_id}`];
                return updated;
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 [REALTIME] Estado de suscripción:', status);
      });

    return () => {
      console.log('🔴 [REALTIME] Cerrando suscripción...');
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

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

  const openOnboarding = async (username: string, type: 'followup' | 'outreach', predefinedMessage?: string, taskType: string = 'pending') => {
    setDialogUser(username);
    setDialogMessage('');
    setDialogStep(1);
    setInstagramOpened(false);
    setOpenDialog(true);
    
    // Solo generar mensaje si no hay uno predefinido
    if (predefinedMessage) {
      setDialogMessage(predefinedMessage);
    } else {
      setIsGeneratingMessage(true);
      try {
        const msg = await generateMessage(username, type);
        setDialogMessage(msg);
      } catch (error) {
        console.error('Error generando mensaje:', error);
        toast({
          title: "Error",
          description: "No se pudo generar el mensaje",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingMessage(false);
      }
    }
  };

  // Función mejorada para manejar cuando se envía un mensaje (guardar en BD)
  const handleMessageSent = async (username: string, taskType: string = 'pending') => {
    const prospect = prospects.find(p => p.userName === username);
    if (!prospect || !currentUser) return;

    console.log(`💾 [TASK-UPDATE] Marcando ${username} como completado en BD (taskType: ${taskType})...`);
    
    try {
      // Actualizar en la base de datos
      const { error } = await supabase.rpc('sync_prospect_task_status', {
        p_instagram_user_id: currentUser.instagram_user_id,
        p_prospect_sender_id: prospect.id,
        p_last_message_type: 'sent', // Porque YO envié el mensaje
        p_task_type: taskType // Pasar el taskType correcto (pending, yesterday, week, etc.)
      });
      
      if (error) {
        console.error('❌ [TASK-UPDATE] Error actualizando BD:', error);
      } else {
        console.log('✅ [TASK-UPDATE] Estado actualizado en BD');
        
        // Actualizar estado local con el taskType correcto
        setCompletedTasks(prev => ({ ...prev, [`${taskType}-${prospect.id}`]: true }));
        
        // GROK: Incrementar estadística "abiertas" solo una vez por día por prospecto
        try {
          const { data: wasIncremented, error: contactError } = await supabase.rpc('increment_daily_prospect_contact', {
            p_instagram_user_id: currentUser.instagram_user_id,
            p_prospect_sender_id: prospect.id
          });
          
          if (contactError) {
            console.error('Error registrando contacto diario:', contactError);
          } else if (wasIncremented) {
            console.log('📊 [GROK] Primera vez contactando a este prospecto hoy - "abiertas" incrementada');
            // Recargar estadísticas para mostrar el cambio
            await loadStats();
          } else {
            console.log('📊 [GROK] Ya contacté a este prospecto hoy - NO incrementando "abiertas"');
          }
        } catch (error) {
          console.error('Error en contacto diario:', error);
        }
        
        toast({
          title: "¡Prospecto contactado!",
          description: `@${username} marcado como completado.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('💥 [TASK-UPDATE] Error general:', error);
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

    // Totales para cada categoría
    const totalPendingResponses = Object.values(pendingResponses).flat().length;
    const totalNoResponseYesterday = Object.values(noResponseYesterday).flat().length;
    const totalNoResponse7Days = Object.values(noResponse7Days).flat().length;

    return {
      pendingResponses,
      noResponseYesterday,
      noResponse7Days,
      totals: {
        pendingResponses: totalPendingResponses,
        noResponseYesterday: totalNoResponseYesterday,
        noResponse7Days: totalNoResponse7Days
      }
    };
  }, [realProspects, prospects]);

  if (userLoading || loading) {
    return (
      <div className="hower-gradient-bg min-h-screen flex items-center justify-center">
        <div className="hower-card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hower-primary mx-auto mb-4"></div>
          <p className="text-hower-dark">Validando acceso...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="hower-gradient-bg min-h-screen flex items-center justify-center">
        <div className="hower-card text-center">
          <p className="text-hower-dark mb-4">Necesitas conectar tu cuenta de Instagram</p>
          <Button onClick={() => navigate('/')} className="hower-button">
            Conectar Instagram
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hower-gradient-bg min-h-screen">
      {/* Menu hamburguesa */}
      <TasksHamburgerMenu />

      <div className="section-container">
        {/* Header de bienvenida */}
        <div className="hower-card text-center mb-6 mx-6">
          <div className="flex items-center justify-center mb-4">
            <img src={howerLogo} alt="Hower" className="w-16 h-16 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-hower-dark">Tareas de Hoy</h1>
              <p className="text-hower-medium">@{currentUser.username}</p>
            </div>
          </div>
          
          {motivationalQuote && (
            <Alert className="mb-4 border-hower-primary/20 bg-hower-primary/5">
              <AlertDescription className="text-hower-dark text-center">
                <span className="font-medium">💪 {motivationalQuote}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-6 text-center">
            <div className="bg-hower-light/20 rounded-[10px] p-3">
              <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.totals.pendingResponses}</div>
              <div className="text-sm text-hower-medium">Pendientes</div>
            </div>
            <div className="bg-hower-light/20 rounded-[10px] p-3">
              <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.totals.noResponseYesterday}</div>
              <div className="text-sm text-hower-medium">Ayer</div>
            </div>
            <div className="bg-hower-light/20 rounded-[10px] p-3">
              <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.totals.noResponse7Days}</div>
              <div className="text-sm text-hower-medium">7 días</div>
            </div>
          </div>
        </div>

        {/* Resto del contenido se continúa desde el archivo original TasksToDo.tsx */}
        {/* ... resto del contenido original ... */}
      </div>

      {/* Dialog de contacto guiado */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        if (!open) {
          setOpenDialog(false);
          setDialogStep(1);
          setDialogUser('');
          setDialogMessage('');
          setIsGeneratingMessage(false);
          setInstagramOpened(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Contactar @{dialogUser}
              <X 
                className="h-4 w-4 cursor-pointer hover:text-red-500" 
                onClick={() => setOpenDialog(false)}
              />
            </DialogTitle>
            <DialogDescription>
              Paso {dialogStep} de 3 - Proceso de contacto guiado
            </DialogDescription>
          </DialogHeader>
          
          {/* Paso 1: Generar mensaje */}
          {dialogStep === 1 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <MessageSquare className="h-12 w-12 text-hower-primary mx-auto mb-3" />
                <p className="text-gray-600">
                  Vamos a generar un mensaje personalizado para @{dialogUser}
                </p>
              </div>
            </div>
          )}

          {/* Paso 2: Mostrar mensaje */}
          {dialogStep === 2 && (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={isGeneratingMessage ? "Generando mensaje..." : dialogMessage}
                  readOnly
                  className="min-h-[120px] pr-12"
                  placeholder="Generando mensaje personalizado..."
                />
                {!isGeneratingMessage && dialogMessage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={copyMessage}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isGeneratingMessage && (
                <Alert>
                  <AlertDescription>
                    Generando mensaje personalizado con IA...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Paso 3: Abrir Instagram */}
          {dialogStep === 3 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Instagram className="h-12 w-12 text-hower-primary mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Abre Instagram para enviar el mensaje a @{dialogUser}
                </p>
                <Button
                  onClick={() => {
                    const url = instaUrl(dialogUser);
                    window.open(url, '_blank');
                    setInstagramOpened(true);
                  }}
                  className="hower-button w-full"
                >
                  Abrir Instagram
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {dialogStep < 3 && (
              <Button
                onClick={() => {
                  if (dialogStep === 1) {
                    setDialogStep(2);
                  } else if (dialogStep === 2) {
                    setDialogStep(3);
                  }
                }}
                disabled={isGeneratingMessage}
                className="hower-button"
              >
                Continuar
              </Button>
            )}
            
            {dialogStep === 3 && (
              <Button
                onClick={() => {
                  handleMessageSent(dialogUser, 'pending');
                  setOpenDialog(false);
                }}
                disabled={!instagramOpened}
                className="hower-button"
              >
                ✓ Listo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Panel de debug de Instagram */}
      {showDebugPanel && (
        <div className="fixed bottom-4 right-4 z-50">
          <InstagramDebugPanel />
        </div>
      )}
    </div>
  );
};

export default TasksToDoNewUI;