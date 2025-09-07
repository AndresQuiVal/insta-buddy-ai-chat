import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2, Bug, Download, Lightbulb } from 'lucide-react';
import html2canvas from 'html2canvas';
import howerLogo from '@/assets/hower-logo.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
      prospectStates: realProspects.map(p => `${p.username}:${p.state}`).slice(0, 5),
      prospectMessages: realProspects.map(p => `${p.username}: lastType=${p.lastMessageType}, time=${p.lastMessageTime}`).slice(0, 3)
    });
  }, [currentUser, prospectsLoading, realProspects]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Validación de autenticación - sin simulación

  // Validación de autenticación mejorada - evita mensajes innecesarios
  useEffect(() => {
    console.log('🔍 [AUTH-DEBUG] Estado de autenticación:', {
      userLoading,
      currentUser: currentUser ? currentUser.instagram_user_id : 'null',
      localStorage: localStorage.getItem('hower-instagram-user') ? 'presente' : 'ausente'
    });
    
    // Solo mostrar mensaje informativo si no hay usuario después de 3 segundos, pero NO redirigir
    if (!userLoading && !currentUser) {
      console.log('ℹ️ No hay usuario autenticado');
      // Dar un poco de tiempo para que se cargue automáticamente
      setTimeout(() => {
        if (!currentUser) {
          toast({
            title: "Información",
            description: "Para usar esta función necesitas conectar tu cuenta de Instagram",
            variant: "default"
          });
        }
      }, 3000);
    }

    // NO mostrar mensaje de Hower aquí, se maneja en checkDatabaseCredentials
    // para evitar mensajes innecesarios mientras se recuperan las credenciales
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

  // Función para cargar los usuarios de Hower - MEJORADA con verificación automática
  const loadHowerUsers = useCallback(async () => {
    // Si no hay usuario de Instagram, no continuar
    if (!currentUser?.instagram_user_id) {
      console.log('❌ No hay usuario de Instagram disponible');
      return;
    }

    // Verificar y cargar credenciales automáticamente si es necesario
    const hasCredentials = await HowerService.checkAndLoadCredentials(currentUser.instagram_user_id);
    
    if (!hasCredentials) {
      console.log('❌ No hay credenciales de Hower disponibles después de verificar BD');
      return;
    }

    setHowerLoading(true);
    try {
      console.log('🔄 [DEBUG] Iniciando loadHowerUsers con credenciales verificadas...');
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
        
        // OCULTAR ERRORES DE CONEXIÓN/TIMEOUT - No molestar al usuario
        if (response.error && (
          response.error.includes('Tiempo de conexión agotado') ||
          response.error.includes('Error de conexión') ||
          response.error.includes('No se pudo conectar con los servidores')
        )) {
          console.warn('🔕 Error de conexión Hower (oculto al usuario):', response.error);
          return; // No mostrar toast al usuario
        }
        
        // Solo mostrar otros tipos de errores
        toast({
          title: "Error al cargar datos",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('🔕 Error de conexión Hower (oculto al usuario):', error);
      // No mostrar toast al usuario para errores de conexión
    } finally {
      setHowerLoading(false);
    }
  }, [toast, currentUser?.instagram_user_id]);

  // Cargar datos de Hower al inicializar - MEJORADO para evitar pantalla de configuración repetida
  useEffect(() => {
    console.log('🔍 Verificando condiciones para cargar Hower:', {
      userLoading,
      hasCurrentUser: !!currentUser,
      isHowerAuthenticated: HowerService.isAuthenticated()
    });

    if (!userLoading && currentUser) {
      console.log('✅ Usuario disponible, verificando autenticación de Hower...');
      
      if (HowerService.isAuthenticated()) {
        console.log('🔑 Credenciales de Hower encontradas en localStorage, cargando usuarios...');
        loadHowerUsers();
      } else {
        console.log('⚠️ No hay credenciales en localStorage, verificando base de datos...');
        // Verificar si hay credenciales en la base de datos ANTES de pedir configuración
        checkDatabaseCredentials();
      }
    }
  }, [currentUser, userLoading, loadHowerUsers]);

  // Nueva función para verificar credenciales en la base de datos - MEJORADA
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
        // Migrar credenciales a localStorage para acceso rápido
        localStorage.setItem('hower_username', userData.hower_username);
        localStorage.setItem('hower_token', userData.hower_token);
        
        // Ahora cargar los usuarios automáticamente
        await loadHowerUsers();
        
        // Mostrar mensaje de éxito
        toast({
          title: "✅ Credenciales restauradas",
          description: "Se han recuperado tus credenciales de Hower automáticamente",
          variant: "default"
        });
      } else {
        console.log('⚠️ No hay credenciales guardadas. El usuario necesita configurar Hower.');
        // Solo aquí mostrar mensaje informativo, no error
        toast({
          title: "Configuración necesaria",
          description: "Para usar el CRM necesitas configurar tus credenciales de Hower en Configuración",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Error en checkDatabaseCredentials:', error);
    }
  };

  // Estado para estadísticas GROK
  const [stats, setStats] = useState({
    today: { respuestas: 0, seguimientos: 0, agendados: 0 },
    yesterday: { respuestas: 0, seguimientos: 0, agendados: 0 },
    week: { respuestas: 0, seguimientos: 0, agendados: 0 }
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
      // Generar frase motivacional siempre, incluso sin usuario
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);
      setLoading(false);
    }
  }, [userLoading]);

  // Cargar nombre de lista cuando hay usuario - RESTAURADO (consulta simple)
  useEffect(() => {
    if (currentUser) {
      loadListName();
    }
  }, [currentUser]);

  // Función para cargar estadísticas usando GROK - RESTAURADO
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

      console.log('✅ [RESPUESTAS-FIX] Valor de respuestas hoy (acumulativo):', todayData.data?.[0]?.respuestas || 0);

      setStats({
        today: {
          respuestas: todayData.data?.[0]?.respuestas || 0,
          seguimientos: todayData.data?.[0]?.seguimientos || 0,
          agendados: todayData.data?.[0]?.agendados || 0
        },
        yesterday: {
          respuestas: yesterdayData.data?.[0]?.respuestas || 0,
          seguimientos: yesterdayData.data?.[0]?.seguimientos || 0,
          agendados: yesterdayData.data?.[0]?.agendados || 0
        },
        week: {
          respuestas: weekData.data?.[0]?.respuestas || 0,
          seguimientos: weekData.data?.[0]?.seguimientos || 0,
          agendados: weekData.data?.[0]?.agendados || 0
        }
      });
    } catch (error) {
      console.error('Error cargando estadísticas GROK:', error);
    }
  }, [currentUser?.instagram_user_id]);

  // Cargar estadísticas - HABILITADO para arreglar problema de decremento
  useEffect(() => {
    if (!userLoading && currentUser) {
      console.log('🔄 [STATS] Cargando estadísticas para usuario:', currentUser.instagram_user_id);
      loadStats();
    }
  }, [currentUser, userLoading, loadStats]);

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

  // Cargar estadísticas cuando hay usuario - RESTAURADO
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser, loadStats]);

  // ✅ DESHABILITADO - El webhook ya maneja perfectamente el estado de las tareas
  // No necesitamos sincronizar manualmente porque el webhook de Instagram
  // actualiza automáticamente prospect_task_status cuando se envían/reciben mensajes

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

  // 🚀 SOLUCIÓN HÍBRIDA: Realtime inteligente con detección de dispositivo
  useEffect(() => {
    if (!currentUser) return;

    // Detectar si es móvil
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log('📱 [REALTIME] Dispositivo móvil detectado - usando polling en su lugar');
      
      // En móvil: usar polling cada 30 segundos en lugar de WebSocket
      const pollInterval = setInterval(async () => {
        try {
          console.log('🔄 [POLLING] Actualizando datos en móvil...');
          // Recargar datos de Hower cuando sea necesario
          if (HowerService.isAuthenticated()) {
            loadHowerUsers();
          }
        } catch (error) {
          console.error('❌ [POLLING] Error:', error);
        }
      }, 30000); // Cada 30 segundos

      return () => {
        console.log('📱 [POLLING] Limpiando polling de móvil');
        clearInterval(pollInterval);
      };
    } else {
      console.log('💻 [REALTIME] Desktop detectado - usando WebSocket con carga lazy');
      
      // En desktop: usar realtime pero con carga lazy (después de 2 segundos)
      const realtimeTimeout = setTimeout(() => {
        console.log('🔴 [REALTIME] Configurando suscripción a prospect_task_status...');
        
        const channel = supabase
          .channel('prospect-task-status-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'prospect_task_status',
              filter: `instagram_user_id=eq.${currentUser.instagram_user_id}`
            },
            (payload) => {
              console.log('🔴 [REALTIME] Cambio detectado:', payload);
              
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
                
                // Actualizar datos de Hower cuando se detecte actividad
                console.log('🔄 [REALTIME] Actualizando datos de Hower por cambio detectado');
                loadHowerUsers();
              }
            }
          )
          .subscribe((status) => {
            console.log('🔴 [REALTIME] Estado de suscripción:', status);
          });

        // Cleanup function para desktop
        return () => {
          console.log('🔴 [REALTIME] Cerrando suscripción de desktop...');
          supabase.removeChannel(channel);
        };
      }, 2000); // Esperar 2 segundos para que la página esté completamente cargada

      return () => {
        console.log('💻 [REALTIME] Limpiando timeout de desktop');
        clearTimeout(realtimeTimeout);
      };
    }
  }, [currentUser, loadHowerUsers]);

  // Función para refrescar manualmente los datos
  const handleRefreshData = async () => {
    console.log('🔄 Refrescando datos manualmente...');
    await Promise.all([
      refetch(),
      loadHowerUsers()
    ]);
    toast({
      title: "Datos actualizados",
      description: "La lista de prospectos y datos de Hower se han actualizado"
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


  // Función simplificada - solo para marcar que el usuario abrió Instagram pero NO tachará automáticamente
  const handleMessageSent = async (username: string, taskType: string = 'pending') => {
    console.log(`📱 [MANUAL-CLICK] Usuario indicó que envió mensaje a ${username} (solo registro, no se tacha automáticamente)`);
    
    // Solo mostrar notificación visual - el tachado real ocurrirá cuando se detecte el webhook
    toast({
      title: "Registro guardado",
      description: "El prospecto se tachará automáticamente cuando se detecte que enviaste el mensaje",
      duration: 3000
    });
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dialogMessage);
      toast({ 
        title: 'Copiado', 
        description: 'Mensaje copiado correctamente.' 
      });
      
      // No avanzar automáticamente al paso 3 - el flujo termina aquí
    } catch (error) {
      console.error('Error copiando mensaje:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo copiar. Copia manualmente el texto.',
        variant: 'destructive'
      });
    }
  };

  const instaUrl = (username: string) => `https://www.instagram.com/${username}`;

  // Clasificar prospectos y calcular estadísticas
  const prospectsClassification = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 🔥 DEBUG ESPECÍFICO PARA estamosprobando1231
    const debugProspect = realProspects.find(p => p.username === 'estamosprobando1231');
    if (debugProspect) {
      console.log('🎯 [DEBUG] estamosprobando1231 en realProspects:', {
        state: debugProspect.state,
        source: debugProspect.source,
        username: debugProspect.username,
        senderId: debugProspect.senderId
      });
    }

    // 🔥 NUEVA LÓGICA: Los prospectos YA vienen filtrados por Hower desde fetchProspects
    // NO necesitamos filtrar nuevamente - solo clasificamos por estado
    
    // Prospectos pendientes: state === 'pending' (separados por fuente)
    const pendingResponses = {
      hower: realProspects.filter(p => p.state === 'pending' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'pending' && (p.source === 'dm' || p.source === 'ads')).map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'pending' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // Prospectos que no respondieron ayer: state === 'yesterday' (separados por fuente)
    const noResponseYesterday = {
      hower: realProspects.filter(p => p.state === 'yesterday' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'yesterday' && (p.source === 'dm' || p.source === 'ads')).map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'yesterday' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // 🔥 DEBUG PARA yesterday
    const yesterdayFiltered = realProspects.filter(p => p.state === 'yesterday');
    console.log('🔍 [DEBUG] Prospectos con state=yesterday:', yesterdayFiltered.map(p => ({
      username: p.username,
      state: p.state,
      source: p.source
    })));

    // Prospectos que no respondieron en 7 días: state === 'week' (separados por fuente)
    const noResponse7Days = {
      hower: realProspects.filter(p => p.state === 'week' && p.source === 'hower').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      dm: realProspects.filter(p => p.state === 'week' && (p.source === 'dm' || p.source === 'ads')).map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean),
      comment: realProspects.filter(p => p.state === 'week' && p.source === 'comment').map(p => prospects.find(pr => pr.id === p.senderId)).filter(Boolean)
    };

    // 🔥 DEBUG PARA week
    const weekFiltered = realProspects.filter(p => p.state === 'week');
    console.log('🔍 [DEBUG] Prospectos con state=week:', weekFiltered.map(p => ({
      username: p.username,
      state: p.state,
      source: p.source
    })));

    // 🔥 DEBUG FINAL
    console.log('🔍 [DEBUG] noResponseYesterday totales:', {
      dm: noResponseYesterday.dm.length,
      comment: noResponseYesterday.comment.length,
      hower: noResponseYesterday.hower.length
    });
    console.log('🔍 [DEBUG] noResponse7Days totales:', {
      dm: noResponse7Days.dm.length,
      comment: noResponse7Days.comment.length,
      hower: noResponse7Days.hower.length
    });
    
    // 🔥 CORRECCIÓN CRÍTICA: Contar seguimientos como WhatsApp (>= 1 día, todo junto)
    const allFollowupsLikeWhatsApp = realProspects.filter(p => {
      if (!p.lastSentMessageTime) return false;
      
      const lastOwnerMessageTime = new Date(p.lastSentMessageTime);
      const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
      
      return lastOwnerMessageTime <= oneDayAgo; // Misma lógica que SQL: >= 1 día
    });
    
    const totalSeguimientosCorrect = allFollowupsLikeWhatsApp.length;
    
    console.log('🎯 [CRITICAL] COMPARACIÓN CON WHATSAPP:');
    console.log('🎯 [CRITICAL] Frontend (yesterday + week):', noResponseYesterday.dm.length + noResponseYesterday.comment.length + noResponse7Days.dm.length + noResponse7Days.comment.length);
    console.log('🎯 [CRITICAL] Frontend CORRECTO (>= 1 día como SQL):', totalSeguimientosCorrect);
    console.log('🎯 [CRITICAL] WhatsApp dice:', 11);
    console.log('🎯 [CRITICAL] ¿Coinciden?', totalSeguimientosCorrect === 11 ? '✅ SÍ' : '❌ NO');

    // Prospectos nuevos: nunca contactados (separados por fuente)
    const newProspects = {
      hower: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'hower'),
      dm: prospects.filter(p => p.status === 'new' && ['dm', 'ads'].includes(realProspects.find(r => r.senderId === p.id)?.source || 'dm')),
      comment: prospects.filter(p => p.status === 'new' && realProspects.find(r => r.senderId === p.id)?.source === 'comment')
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

    // Estadísticas usando GROK (datos persistentes de la BD)
    const yesterdayStats = {
      nuevosProspectos: stats.yesterday.respuestas,
      seguimientosHechos: stats.yesterday.seguimientos,
      agendados: stats.yesterday.agendados
    };

    // Estadísticas para LA SEMANA usando GROK
    const weekStats = {
      nuevosProspectos: stats.week.respuestas,
      seguimientosHechos: stats.week.seguimientos,
      agendados: stats.week.agendados
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

  // ELIMINADO: Sincronización que causaba decremento incorrecto en "respuestas"
  // Los stats correctos (acumulativos) vienen de grok_get_stats y no deben ser sobrescritos
  // con valores de pendingResponses que decrementan
  /*
  useEffect(() => {
    if (prospectsClassification && stats.today) {
      const todayRespuestas = prospectsClassification.pendingResponses.dm.length + prospectsClassification.pendingResponses.comment.length;
      const todaySeguimientos = prospectsClassification.noResponseYesterday.dm.length + prospectsClassification.noResponseYesterday.comment.length;
      
      // Solo actualizar si hay cambios para evitar loops infinitos
      if (stats.today.respuestas !== todayRespuestas || stats.today.seguimientos !== todaySeguimientos) {
        console.log('🔄 Sincronizando stats de HOY:', {
          anterior: { respuestas: stats.today.respuestas, seguimientos: stats.today.seguimientos },
          nuevo: { respuestas: todayRespuestas, seguimientos: todaySeguimientos }
        });
        
        setStats(prevStats => ({
          ...prevStats,
          today: {
            ...prevStats.today,
            respuestas: todayRespuestas,
            seguimientos: todaySeguimientos
          }
        }));
      }
    }
  }, [prospectsClassification, stats]);
  */

  // Calcular tiempo estimado (10-12 segundos por prospecto, usamos 11 como promedio)
  const calculateEstimatedTime = () => {
    const pendingCount = prospectsClassification.pendingResponses.dm.length + 
                        prospectsClassification.pendingResponses.comment.length;
    
    const newCount = prospectsClassification.newProspects.dm.length + 
                    prospectsClassification.newProspects.comment.length;
    
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
  const getStatsProspects = async (statsType: string, period: string) => {
    console.log(`🔍 [getStatsProspects] Solicitando ${statsType} para ${period}`);
    console.log(`🔍 [getStatsProspects] realProspects disponibles:`, realProspects.length);
    
    try {
      switch (statsType) {
        case 'nuevos':
          if (period === 'hoy') {
            // 🔥 NUEVO: Obtener prospectos directamente de la BD para que coincida con las estadísticas
            if (!currentUser?.instagram_user_id) return [];
            
            const { data: responseProspects, error } = await supabase
              .from('daily_prospect_responses')
              .select(`
                prospect_sender_id,
                first_response_at,
                response_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('response_date', new Date().toISOString().split('T')[0])
              .order('first_response_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo respuestas de hoy:', error);
              return [];
            }
            
            console.log(`✅ [getStatsProspects] Respuestas de hoy desde BD:`, responseProspects?.length || 0);
            
            // Mapear a formato esperado
            return (responseProspects || []).map((response, index) => ({
              id: `response-${response.prospect_sender_id}-${index}`,
              userName: `user_${response.prospect_sender_id.slice(-8)}`, // Username temporal
              status: 'responded',
              firstContactDate: response.first_response_at,
              lastContactDate: response.first_response_at,
              unread: true,
              avatar: '',
              prospect_instagram_id: response.prospect_sender_id
            }));
          }
          if (period === 'ayer') {
            // Obtener respuestas de ayer desde BD
            if (!currentUser?.instagram_user_id) return [];
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            const { data: responseProspects, error } = await supabase
              .from('daily_prospect_responses')
              .select(`
                prospect_sender_id,
                first_response_at,
                response_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('response_date', yesterdayStr)
              .order('first_response_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo respuestas de ayer:', error);
              return [];
            }
            
            return (responseProspects || []).map((response, index) => ({
              id: `response-${response.prospect_sender_id}-${index}`,
              userName: `user_${response.prospect_sender_id.slice(-8)}`,
              status: 'responded',
              firstContactDate: response.first_response_at,
              lastContactDate: response.first_response_at,
              unread: true,
              avatar: '',
              prospect_instagram_id: response.prospect_sender_id
            }));
          }
          
          if (period === 'semana') {
            // Obtener respuestas de la semana desde BD
            if (!currentUser?.instagram_user_id) return [];
            
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lunes
            const weekStartStr = weekStart.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];
            
            const { data: responseProspects, error } = await supabase
              .from('daily_prospect_responses')
              .select(`
                prospect_sender_id,
                first_response_at,
                response_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .gte('response_date', weekStartStr)
              .lte('response_date', todayStr)
              .order('first_response_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo respuestas de la semana:', error);
              return [];
            }
            
            return (responseProspects || []).map((response, index) => ({
              id: `response-${response.prospect_sender_id}-${index}`,
              userName: `user_${response.prospect_sender_id.slice(-8)}`,
              status: 'responded',
              firstContactDate: response.first_response_at,
              lastContactDate: response.first_response_at,
              unread: true,
              avatar: '',
              prospect_instagram_id: response.prospect_sender_id
            }));
          }
          
          return [];
        case 'seguimientos':
          if (period === 'hoy') {
            // 🔥 NUEVO: Obtener seguimientos directamente de la BD
            if (!currentUser?.instagram_user_id) return [];
            
            const { data: contactProspects, error } = await supabase
              .from('daily_prospect_contacts')
              .select(`
                prospect_sender_id,
                first_contact_at,
                contact_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('contact_date', new Date().toISOString().split('T')[0])
              .order('first_contact_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo seguimientos de hoy:', error);
              return [];
            }
            
            console.log(`✅ [getStatsProspects] Seguimientos de hoy desde BD:`, contactProspects?.length || 0);
            
            // Mapear a formato esperado
            return (contactProspects || []).map((contact, index) => ({
              id: `contact-${contact.prospect_sender_id}-${index}`,
              userName: `user_${contact.prospect_sender_id.slice(-8)}`, // Username temporal
              status: 'followed_up',
              firstContactDate: contact.first_contact_at,
              lastContactDate: contact.first_contact_at,
              unread: false,
              avatar: '',
              prospect_instagram_id: contact.prospect_sender_id
            }));
          }
          if (period === 'ayer') {
            // Obtener seguimientos de ayer desde BD
            if (!currentUser?.instagram_user_id) return [];
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            const { data: contactProspects, error } = await supabase
              .from('daily_prospect_contacts')
              .select(`
                prospect_sender_id,
                first_contact_at,
                contact_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('contact_date', yesterdayStr)
              .order('first_contact_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo seguimientos de ayer:', error);
              return [];
            }
            
            return (contactProspects || []).map((contact, index) => ({
              id: `contact-${contact.prospect_sender_id}-${index}`,
              userName: `user_${contact.prospect_sender_id.slice(-8)}`,
              status: 'followed_up',
              firstContactDate: contact.first_contact_at,
              lastContactDate: contact.first_contact_at,
              unread: false,
              avatar: '',
              prospect_instagram_id: contact.prospect_sender_id
            }));
          }
          
          if (period === 'semana') {
            // Obtener seguimientos de la semana desde BD
            if (!currentUser?.instagram_user_id) return [];
            
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lunes
            const weekStartStr = weekStart.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];
            
            const { data: contactProspects, error } = await supabase
              .from('daily_prospect_contacts')
              .select(`
                prospect_sender_id,
                first_contact_at,
                contact_date
              `)
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .gte('contact_date', weekStartStr)
              .lte('contact_date', todayStr)
              .order('first_contact_at', { ascending: false });
            
            if (error) {
              console.error('❌ Error obteniendo seguimientos de la semana:', error);
              return [];
            }
            
            return (contactProspects || []).map((contact, index) => ({
              id: `contact-${contact.prospect_sender_id}-${index}`,
              userName: `user_${contact.prospect_sender_id.slice(-8)}`,
              status: 'followed_up',
              firstContactDate: contact.first_contact_at,
              lastContactDate: contact.first_contact_at,
              unread: false,
              avatar: '',
              prospect_instagram_id: contact.prospect_sender_id
            }));
          }
          
          return [];
        case 'agendados':
          return []; // Por ahora vacío, se puede implementar después
        default:
          console.log(`⚠️ [getStatsProspects] Tipo de stats desconocido: ${statsType}`);
          return [];
      }
    } catch (error) {
      console.error(`❌ [getStatsProspects] Error procesando ${statsType} para ${period}:`, error);
      return [];
    }
  };

  // Función para abrir Instagram directamente
  const handleProspectClick = (username: string) => {
    window.open(`https://www.instagram.com/${username}`, '_blank');
  };

  // Componente para mostrar la lista de prospectos de estadísticas
  const StatsProspectsList = ({ statsType, period, taskType }: { statsType: string, period: string, taskType: string }) => {
    const [prospects, setProspects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const loadProspects = async () => {
        setLoading(true);
        try {
          const data = await getStatsProspects(statsType, period);
          setProspects(data);
          console.log(`🔍 [StatsProspectsList] ${statsType} ${period} cargados:`, data.length);
        } catch (error) {
          console.error(`❌ Error cargando ${statsType} ${period}:`, error);
          setProspects([]);
        } finally {
          setLoading(false);
        }
      };

      loadProspects();
    }, [statsType, period]);

    if (loading) {
      return <p className="text-xs text-muted-foreground italic">Cargando...</p>;
    }

    if (prospects.length === 0) {
      return <p className="text-xs text-muted-foreground italic">No hay {statsType} de {period}</p>;
    }

    return (
      <>
        {prospects.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} taskType={taskType} />
        ))}
      </>
    );
  };


  const ProspectCard = ({ prospect, taskType }: { prospect: ProspectData; taskType: string }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];
    const isFollowUpProspect = taskType === 'yesterday' || taskType === 'week';
    const interactionTipKey = `interaction-${prospect.id}`;

    const isInteractionTipActive = activeInteractionTip === interactionTipKey;

    // LÓGICA ELIMINADA: Ya no hacemos auto-complete aquí
    // La sincronización se maneja en el useEffect principal
    
    console.log('Rendering ProspectCard for:', prospect.userName, 'Task type:', taskType);
    
    return (
      <div 
        className={`bg-gradient-to-r from-white to-primary/5 border-2 border-primary/20 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-60 line-through' : ''} mb-4 p-1`}
        onClick={() => handleProspectClick(prospect.userName)}
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
          
          {/* Botones de interacción y eliminar */}
          <div className="flex space-x-2 flex-shrink-0">
            {/* Botón de eliminar prospecto */}
            <Button 
              onClick={async (e) => {
                e.stopPropagation();
                if (!currentUser?.instagram_user_id) {
                  toast({
                    title: "Error",
                    description: "No se encontró el usuario",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (window.confirm(`¿Estás seguro que quieres eliminar a @${prospect.userName}?`)) {
                  try {
                    const { error } = await supabase.rpc('delete_prospect_by_sender', {
                      p_instagram_user_id: currentUser.instagram_user_id,
                      p_prospect_sender_id: prospect.id
                    });
                    
                    if (error) {
                      console.error('Error eliminando prospecto:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo eliminar el prospecto",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    toast({
                      title: "Eliminado",
                      description: `@${prospect.userName} ha sido eliminado`
                    });
                    
                    // Refrescar la lista
                    await refetch();
                  } catch (error) {
                    console.error('Error:', error);
                    toast({
                      title: "Error",
                      description: "Ocurrió un error al eliminar el prospecto",
                      variant: "destructive"
                    });
                  }
                }
              }}
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
              disabled={isCompleted}
              title={`Eliminar @${prospect.userName}`}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {isFollowUpProspect && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInteractionTip(isInteractionTipActive ? null : interactionTipKey);
                }}
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
                disabled={isCompleted}
                title="¿Cómo aumento respuesta?"
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tip de interacción - SOLO aparece cuando se hace click */}
        {isFollowUpProspect && isInteractionTipActive && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
            <div className="mt-3">
               <div 
                 className="bg-gradient-to-r from-primary/5 to-primary/10 p-3 rounded-lg border border-primary/20"
               >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-blue-800 text-sm font-mono">Cómo interactuar con @{prospect.userName}:</h4>
                  <button 
                    onClick={() => setActiveInteractionTip(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-white rounded border-l-4 border-primary overflow-hidden">
                    <div className="flex items-center p-2">
                      <Share2 className="h-4 w-4 text-pink-600 mr-2 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold">Comentar en su historia</span>
                    </div>
                    <div className="px-2 pb-2 ml-6">
                        <p className="text-xs text-pink-700 bg-pink-50 p-2 rounded font-mono">
                          "Me encanta esto!" o "Qué buena foto!" o "Increíble!"
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
                          "Excelente contenido!" o "Muy inspirador!" o "Me gusta mucho tu estilo"
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
                          Dale like a sus últimos 3-5 posts para aparecer en su radar
                        </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-blue-600 mt-3 font-mono">
                  Haz esto ANTES de enviar el mensaje para aumentar las posibilidades de respuesta
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
    showCheckbox = true,
    customContent,
    dataOnboarding
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
    customContent?: React.ReactNode;
    dataOnboarding?: string;
  }) => {
    const taskKey = `section-${taskType}`;
    const sectionCompleted = completedTasks[taskKey];
    const allProspectsCompleted = prospects.every(p => completedTasks[`${taskType}-${p.id}`]);
    const tipKey = `tip-${taskType}`;
    const isTipExpanded = expandedTips[tipKey];
    
    // Para "new", si hay resultados automáticos (newProspectsCount > 0), mostramos solo customContent
    const showOnlyCustomContent = taskType === 'new' && customContent && newProspectsCount > 0;
    
    // Para "new", nunca mostrar como completado/tachado
    const shouldShowCompleted = taskType !== 'new' && (sectionCompleted || allProspectsCompleted);

    const toggleTip = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedTips(prev => ({ ...prev, [tipKey]: !prev[tipKey] }));
    };

    // Hook personalizado según el tipo de tarea
    const getCustomHook = (taskType: string) => {
      switch(taskType) {
        case 'yesterday':
          return {
            title: "Envíales este audio...",
            gradient: "from-yellow-100 to-yellow-200",
            border: "border-yellow-300",
            textColor: "text-yellow-800"
          };
        case 'week':
          return {
            title: "¿Más agendas? haz esto...",
            gradient: "from-yellow-100 to-yellow-200",
            border: "border-yellow-300", 
            textColor: "text-yellow-800"
          };
        case 'new':
          return {
            title: "Envía este mensaje...",
            gradient: "from-yellow-100 to-yellow-200",
            border: "border-yellow-300",
            textColor: "text-yellow-800"
          };
        default:
          return {
            title: "🔥 Secreto que aumenta respuestas 10x",
            gradient: "from-yellow-100 to-yellow-200",
            border: "border-yellow-300",
            textColor: "text-yellow-800"
          };
      }
    };

    const customHook = getCustomHook(taskType);

    return (
      <div className="mb-4 sm:mb-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${isActive ? 'ring-2 ring-primary border-l-primary' : 'border-l-gray-300'} ${shouldShowCompleted ? 'opacity-60' : ''}`}
          style={{
            background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
          }}
          data-onboarding={dataOnboarding}
        >
          <CardHeader className="pb-2 sm:pb-3" onClick={onClick}>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 hidden" />
                <span className={`${shouldShowCompleted ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>{title}</span>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <div 
                        className={`bg-gradient-to-r ${customHook.gradient} border ${customHook.border} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => console.log('Dialog trigger clicked for taskType:', taskType)}
                      >
                        <div className="flex items-center space-x-2">
                          <Lightbulb className={`h-4 w-4 ${customHook.textColor}`} />
                          <span className={`${customHook.textColor} font-semibold text-sm`}>{customHook.title}</span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 rounded-3xl shadow-xl max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-yellow-800">
                          <Lightbulb className="h-5 w-5" />
                          <span>Tip Exclusivo</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-4 bg-white/50 rounded-2xl border border-yellow-200">
                        <p className="text-yellow-800 text-sm leading-relaxed">
                          {(() => {
                            console.log('Rendering dialog content for taskType:', taskType, 'tip:', tip);
                            switch(taskType) {
                              case 'yesterday':
                                return tip || "Tip no disponible para este tipo de tarea.";
                              case 'week':
                                return tip || "Tip no disponible para este tipo de tarea.";
                              case 'new':
                                return tip || "Tip no disponible para este tipo de tarea.";
                              default:
                                return tip || "Tip no disponible para este tipo de tarea.";
                            }
                          })()}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
               {/* Mostrar solo contenido personalizado para nuevos prospectos con resultados automáticos */}
               {showOnlyCustomContent ? (
                 <div className="bg-white rounded-xl p-4 border border-gray-100">
                   {customContent}
                 </div>
               ) : (
                 <>
                   {/* Tabs para divisiones por tipo */}
                   <div className="bg-white rounded-xl p-4 border border-gray-100">
                        {(() => {
                          // Obtener todos los prospectos según el tipo de tarea
                          let allProspects = [];
                          if (taskType === 'yesterday') {
                            allProspects = [...prospectsClassification.noResponseYesterday.dm, ...prospectsClassification.noResponseYesterday.comment];
                          } else if (taskType === 'week') {
                            allProspects = [...prospectsClassification.noResponse7Days.dm, ...prospectsClassification.noResponse7Days.comment];
                          } else if (taskType === 'pending') {
                            allProspects = [...prospectsClassification.pendingResponses.dm, ...prospectsClassification.pendingResponses.comment];
                          } else if (taskType === 'new') {
                            allProspects = [...prospectsClassification.newProspects.dm, ...prospectsClassification.newProspects.comment];
                          } else {
                            allProspects = [...prospects.filter((_, i) => i % 4 === 1), ...prospects.filter((_, i) => i % 4 === 2)]; // Fallback para otros casos
                          }
                          
                          // Para taskType === 'new', no renderizar nada si no hay prospectos
                          if (taskType === 'new' && allProspects.length === 0) {
                            return null;
                          }
                          
                          return (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {allProspects.length === 0 ? (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                  <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                                  <p className="text-sm sm:text-base">
                                    {taskType === 'pending' ? '¡Excelente! No hay respuestas pendientes.' : 
                                     '¡Excelente! No hay seguimientos pendientes.'}
                                  </p>
                                </div>
                              ) : (
                                allProspects.map((prospect) => (
                                  <div key={prospect.id} className="mb-5">
                                    <ProspectCard prospect={prospect} taskType={taskType} />
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })()}
                    </div>
                   
                   {/* Custom Content para otros casos */}
                   {customContent && !showOnlyCustomContent && (
                     <div className="mt-6">
                       {customContent}
                     </div>
                   )}
                 </>
               )}
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
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: '#724bff',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Navbar morado visible */}
      <div className="h-16 w-full" style={{ backgroundColor: '#724bff' }}>
        {/* Hamburger Menu - positioned at top left */}
        <div className="absolute top-6 left-6 z-50">
          <TasksHamburgerMenu />
        </div>
      </div>
      
      {/* White Content Container with rounded corners and margin all around */}
      <div className="bg-white rounded-[32px] m-4 min-h-[calc(100vh-8rem)] px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header content */}
          <div className="mb-6 sm:mb-8 relative">
          {/* Notebook Style Header */}
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 p-6 sm:p-8"
              style={{
                borderTopColor: '#7a60ff',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f9fafb 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 40px, 0 0'
              }}
            >
              
              <div className="text-center ml-4 sm:ml-6">
                {/* Botones en el header */}
                <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button
                    onClick={() => setShowStats(!showStats)}
                    size="sm"
                    className="bg-[#724bff] hover:bg-[#6341d8] text-white border-0 font-poppins text-xs px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all"
                  >
                    {showStats ? '📊 Ocultar números' : '📊 Mis números'}
                  </Button>
                  
                </div>
                
                {/* Estadísticas - Aparece arriba del título cuando se hace click */}
          {/* Aviso crítico sobre ID incorrecto */}
          {currentUser && currentUser.instagram_user_id === '17841475990037083' && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <RefreshCw className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <div><strong>🚨 PROBLEMA DETECTADO:</strong> Tu ID de Instagram está desactualizado</div>
                  <div className="text-sm">Los mensajes de Instagram no se sincronizan porque el ID cambió. Necesitas re-autenticarte.</div>
                  <button 
                    onClick={() => {
                      // Limpiar localStorage y redirigir
                      localStorage.removeItem('hower-instagram-user');
                      toast({
                        title: "Cache limpiado",
                        description: "Redirigiendo para re-autenticación...",
                      });
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 1000);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    ✅ Arreglar - Re-autenticar ahora
                  </button>
                  <div className="text-xs text-red-600 mt-1">
                    ID actual: {currentUser.instagram_user_id} → Debe ser: 739714722170459
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          

          {showStats && (
                  <div className="mb-6" data-stats-container>
                    <div 
                      className="bg-white rounded-xl shadow-lg border-l-4 border-primary p-4 sm:p-6"
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
                        <div className="flex items-center justify-center gap-3">
                          <h2 className="text-lg font-bold text-gray-800 font-mono">
                            📊 Mis Números
                          </h2>
                          <Button
                            onClick={shareStats}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            title="Compartir estadísticas"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Tabs defaultValue="hoy" className="w-full" data-stats-section>
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                          <TabsTrigger value="hoy" className="font-mono text-sm">Hoy</TabsTrigger>
                          <TabsTrigger value="ayer" className="font-mono text-sm">Ayer</TabsTrigger>
                          <TabsTrigger value="semana" className="font-mono text-sm">Semana</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="hoy" className="space-y-3">
                          <div className="bg-gradient-to-r from-green-50 to-white p-3 rounded-lg border border-green-200">
                            <h3 className="text-base font-bold text-green-800 mb-3 font-mono">📅 Hoy</h3>
                            
                            <div className="space-y-2">
                               <div 
                                 className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                 onClick={() => setActiveStatsSection(activeStatsSection === 'hoy-nuevos' ? null : 'hoy-nuevos')}
                               >
                                 <span className="font-mono text-sm">💬 Respuestas</span>
                                 <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                   {stats.today.respuestas}
                                 </div>
                               </div>
                               
                               {/* Listado de respuestas de hoy */}
                               {activeStatsSection === 'hoy-nuevos' && (
                                 <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                   <StatsProspectsList 
                                     statsType="nuevos" 
                                     period="hoy" 
                                     taskType="stats-hoy-nuevos"
                                   />
                                 </div>
                               )}
                               
                               <div 
                                 className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all"
                                 onClick={() => setActiveStatsSection(activeStatsSection === 'hoy-seguimientos' ? null : 'hoy-seguimientos')}
                               >
                                 <span className="font-mono text-sm">🔄 Seguimientos</span>
                                 <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold text-sm">
                                   {stats.today.seguimientos}
                                 </div>
                               </div>
                               
                               {/* Listado de seguimientos de hoy */}
                               {activeStatsSection === 'hoy-seguimientos' && (
                                 <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                   <StatsProspectsList 
                                     statsType="seguimientos" 
                                     period="hoy" 
                                     taskType="stats-hoy-seguimientos"
                                   />
                                 </div>
                               )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400"
                                style={{ display: 'none' }}
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {stats.today.agendados}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="ayer" className="space-y-3">
                          <div className="bg-gradient-to-r from-primary/5 to-white p-3 rounded-lg border border-primary/20">
                            <h3 className="text-base font-bold text-primary mb-3 font-mono">📅 Ayer</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-nuevos' ? null : 'ayer-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Respuestas</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.nuevosProspectos}
                                </div>
                              </div>
                              
                              {/* Listado de prospectos nuevos de ayer */}
                              {activeStatsSection === 'ayer-nuevos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <StatsProspectsList 
                                    statsType="nuevos" 
                                    period="ayer" 
                                    taskType="stats-ayer-nuevos"
                                  />
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-seguimientos' ? null : 'ayer-seguimientos')}
                              >
                                <span className="font-mono text-sm">🔄 Seguimientos</span>
                                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.seguimientosHechos}
                                </div>
                              </div>
                              
                              {/* Listado de seguimientos de ayer */}
                              {activeStatsSection === 'ayer-seguimientos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <StatsProspectsList 
                                    statsType="seguimientos" 
                                    period="ayer" 
                                    taskType="stats-ayer-seguimientos"
                                  />
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'ayer-agendados' ? null : 'ayer-agendados')}
                                style={{ display: 'none' }}
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.agendados}
                                </div>
                              </div>
                              
                              {/* Listado de agendados de ayer */}
                              {activeStatsSection === 'ayer-agendados' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                                  <p className="text-xs text-muted-foreground italic">Funcionalidad próximamente</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="semana" className="space-y-3">
                          <div className="bg-gradient-to-r from-purple-50 to-white p-3 rounded-lg border border-purple-200">
                            <h3 className="text-base font-bold text-purple-800 mb-3 font-mono">📊 Semana</h3>
                            
                            <div className="space-y-2">
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'semana-nuevos' ? null : 'semana-nuevos')}
                              >
                                <span className="font-mono text-sm">💬 Respuestas</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {stats.week.respuestas}
                                </div>
                              </div>
                              
                              {/* Listado de prospectos nuevos de la semana */}
                              {activeStatsSection === 'semana-nuevos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <StatsProspectsList 
                                    statsType="nuevos" 
                                    period="semana" 
                                    taskType="stats-semana-nuevos"
                                  />
                                </div>
                               )}
                               
                               {/* Label PRONTO entre Respuestas y Seguimientos */}
                               <div className="flex justify-center my-3">
                                 <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-dashed border-blue-300 px-4 py-2 rounded-lg">
                                   <span className="text-blue-800 font-mono text-sm font-bold">
                                     🚀 PRONTO
                                   </span>
                                 </div>
                               </div>
                               
                               <div 
                                 className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all"
                                 onClick={() => setActiveStatsSection(activeStatsSection === 'semana-seguimientos' ? null : 'semana-seguimientos')}
                               >
                                 <span className="font-mono text-sm">🔄 Seguimientos</span>
                                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {stats.week.seguimientos}
                                </div>
                              </div>
                              
                              {/* Listado de seguimientos de la semana */}
                              {activeStatsSection === 'semana-seguimientos' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto">
                                  <StatsProspectsList 
                                    statsType="seguimientos" 
                                    period="semana" 
                                    taskType="stats-semana-seguimientos"
                                  />
                                </div>
                              )}
                              
                              <div 
                                className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => setActiveStatsSection(activeStatsSection === 'semana-agendados' ? null : 'semana-agendados')}
                                style={{ display: 'none' }}
                              >
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {stats.week.agendados}
                                </div>
                              </div>
                              
                              {/* Listado de agendados de la semana */}
                              {activeStatsSection === 'semana-agendados' && (
                                <div className="ml-4 space-y-2 max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                                  <p className="text-xs text-muted-foreground italic">Funcionalidad próximamente</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      {/* Botón Más Detalles */}
                      <div className="text-center mt-4" style={{ display: 'none' }}>
                        <Button
                          onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                          variant="outline"
                          className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 text-primary hover:from-primary/20 hover:to-primary/30 font-mono text-sm"
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
                            
                            <div className="bg-white p-3 rounded-lg border-l-4 border-primary">
                              <div className="text-sm font-mono font-bold text-primary">🎯 # de Mensajes para Lograr 1 Invitación</div>
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
                        className="text-2xl sm:text-3xl font-poppins font-bold mb-2 text-gray-800 cursor-pointer hover:text-primary text-center"
                        onClick={handleEditListName}
                        data-onboarding="main-title"
                      >
                        <span className="inline-flex flex-wrap items-center justify-center gap-2">
                          <span className="whitespace-nowrap">Mi Lista de</span> 
                          <span className="bg-[#724bff] text-white px-3 py-1 rounded-lg whitespace-nowrap">Prospectos</span>
                        </span>
                        <Edit2 className="w-4 h-4 opacity-50" style={{ display: 'none' }} />
                      </h1>
                    )}
                  </div>
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
              data-onboarding="pending-section"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: activeSection === 'pending' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 cursor-pointer" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                    <span className={`${(completedTasks['section-pending'] || 
                      [...prospectsClassification.pendingResponses.dm, 
                       ...prospectsClassification.pendingResponses.comment].every(p => completedTasks[`pending-${p.id}`])) ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>Prospectos sin responder</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">{prospectsClassification.pendingResponses.dm.length + prospectsClassification.pendingResponses.comment.length}</Badge>
                    
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
                      className="bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
                      title="Haz clic después de responder en Instagram para sincronizar"
                      style={{ display: 'none' }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span className="text-xs">Sincronizar</span>
                    </Button>
                    
                    <div className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}>
                      {activeSection === 'pending' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              {activeSection === 'pending' && (
                <CardContent className="pt-0 px-3 sm:px-6">
                  <div className="mb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div 
                          className="bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="h-4 w-4 text-yellow-800" />
                            <span className="text-yellow-800 font-semibold text-sm">¿Más agendas? haz esto...</span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 rounded-3xl shadow-xl max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2 text-yellow-800">
                            <Lightbulb className="h-5 w-5" />
                            <span>Tip Exclusivo</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-4 bg-white/50 rounded-2xl border border-yellow-200">
                          <p className="text-yellow-800 text-sm leading-relaxed">
                            ⚡ **Respuesta en 2 minutos = 3x más conversiones.** Configura notificaciones push y responde inmediatamente. El primer mensaje que ven decide si te responden o te ignoran para siempre.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                   {/* Lista de prospectos */}
                   <div className="mb-4">
                     <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {[...prospectsClassification.pendingResponses.dm, ...prospectsClassification.pendingResponses.comment].length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                              <p className="text-sm sm:text-base">¡Excelente! No hay prospectos sin responder.</p>
                            </div>
                          ) : (
                            [...prospectsClassification.pendingResponses.dm, ...prospectsClassification.pendingResponses.comment].map((prospect) => (
                              <div key={prospect.id} className="mb-5">
                                <ProspectCard prospect={prospect} taskType="pending" />
                              </div>
                            ))
                          )}
                        </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* 2. Dar Seguimientos e Interactuar */}
          <div className="mb-4 sm:mb-6">
            <Card
              className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary/30"
              data-onboarding="followup-section"
              style={{
                background: 'linear-gradient(to right, #fefefe 0%, #f8fafc 100%)',
                boxShadow: showFollowUpSections ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <CardHeader className="pb-2 sm:pb-3" onClick={() => setShowFollowUpSections(!showFollowUpSections)}>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 hidden" />
                    <span className={`${(completedTasks['section-followup'] || 
                      (prospectsClassification.noResponseYesterday.dm.length === 0 && 
                       prospectsClassification.noResponseYesterday.comment.length === 0 &&
                       prospectsClassification.noResponse7Days.dm.length === 0 && 
                       prospectsClassification.noResponse7Days.comment.length === 0) ||
                      [...prospectsClassification.noResponseYesterday.dm, 
                       ...prospectsClassification.noResponseYesterday.comment,
                       ...prospectsClassification.noResponse7Days.dm,
                       ...prospectsClassification.noResponse7Days.comment].every(p => completedTasks[`yesterday-${p.id}`] || completedTasks[`week-${p.id}`])) ? 'line-through text-gray-400' : ''} text-sm sm:text-base`}>
                      Prospectos para recontactar
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {prospectsClassification.noResponseYesterday.dm.length + 
                       prospectsClassification.noResponseYesterday.comment.length +
                       prospectsClassification.noResponse7Days.dm.length + 
                       prospectsClassification.noResponse7Days.comment.length}
                    </Badge>
                    {showFollowUpSections ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
            
            {/* Subsecciones de seguimiento - Solo se muestran cuando showFollowUpSections es true */}
            {showFollowUpSections && (
              <div className="ml-4 sm:ml-6 mt-4 space-y-3 sm:space-y-4">
                {/* Tip explicativo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4" style={{
                  backgroundImage: 'linear-gradient(90deg, #dbeafe 1px, transparent 1px)',
                  backgroundSize: '20px 1px',
                  backgroundPosition: '0 20px'
                }}>
                  <div className="flex items-start space-x-3">
                    <div>
                      <p className="text-blue-800 text-sm font-medium">
                        Estos no te contestaron, y vale la pena recontactarlos
                      </p>
                    </div>
                  </div>
                </div>
                {/* 2.1 No respondieron ayer */}
                <TaskSection
                  title="Recontactar los de ayer"
                   count={prospectsClassification.noResponseYesterday.dm.length + 
                          prospectsClassification.noResponseYesterday.comment.length}
                  onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
                  isActive={activeSection === 'yesterday'}
                  icon={Clock}
                   prospects={[...prospectsClassification.noResponseYesterday.dm, 
                              ...prospectsClassification.noResponseYesterday.comment]}
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
                      <p><strong>💡 Tip:</strong> ¡La interacción aumenta las respuestas!</p>
                    </div>
                  }
                  taskType="yesterday"
                />
                
                {/* 2.2 No respondieron en 7 días */}
                <TaskSection
                  title="Recontactar a los de hace 7 días"
                   count={prospectsClassification.noResponse7Days.dm.length + 
                          prospectsClassification.noResponse7Days.comment.length}
                  onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
                  isActive={activeSection === 'week'}
                  icon={Calendar}
                   prospects={[...prospectsClassification.noResponse7Days.dm,
                              ...prospectsClassification.noResponse7Days.comment]}
                  tip={
                    <div className="space-y-3">
                      <p>Envía este mensaje por <strong>texto</strong>:</p>
                      <div className="bg-primary/5 border-l-4 border-primary p-3 rounded font-mono text-sm" style={{
                        backgroundImage: 'linear-gradient(90deg, #dbeafe 1px, transparent 1px)',
                        backgroundSize: '20px 1px',
                        backgroundPosition: '0 15px'
                      }}>
                        "Hey hey [NOMBRE] oye, hace 7 días no escucho de ti, todo bien?"
                      </div>
                      <p><strong>💡 Tip:</strong> ¡La interacción previa aumenta las posibilidades de respuesta!</p>
                    </div>
                  }
                  taskType="week"
                />
        </div>
      )}
      
    </div>

          {/* 3. Prospectar a nuevos */}
          <div className="mt-8 sm:mt-12">
          <TaskSection
            title="Nuevas cuentas/posts con prospectos"
            count={(prospectsClassification.newProspects.dm.length + 
                   prospectsClassification.newProspects.comment.length) + newProspectsCount}
            onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
            isActive={activeSection === 'new'}
            icon={MessageCircle}
            prospects={[...prospectsClassification.newProspects.dm,
                       ...prospectsClassification.newProspects.comment]}
            tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
            taskType="new"
            dataOnboarding="new-prospects-section"
            customContent={
              <div className="mt-6">
                <div style={{ display: activeSection === 'new' ? 'block' : 'none' }}>
                  {/* Tip explicativo */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" style={{
                    backgroundImage: 'linear-gradient(90deg, #dcfce7 1px, transparent 1px)',
                    backgroundSize: '20px 1px',
                    backgroundPosition: '0 20px'
                  }}>
                    <div className="flex items-start space-x-3">
                      <div>
                        <p className="text-green-800 text-sm font-medium">
                          Nuevas cuentas / posts para prospectar
                        </p>
                      </div>
                    </div>
                  </div>
                  <NewProspectsResults instagramUserId={currentUser?.instagram_user_id || ''} />
                </div>
              </div>
            }
          />
          
          {/* Componente invisible para cargar datos y actualizar count */}
          <div style={{ display: 'none' }}>
            <NewProspectsResults 
              instagramUserId={currentUser?.instagram_user_id || ''} 
              onCountChange={setNewProspectsCount}
            />
          </div>
          </div>
          </div>

          {/* Frase motivacional como quote elegante */}
          {motivationalQuote && (
            <div className="mt-8 mb-8 text-center">
              <blockquote className="font-serif text-lg text-gray-700 italic font-light leading-relaxed max-w-2xl mx-auto">
                "{motivationalQuote}"
              </blockquote>
              <div className="mt-2 text-gray-500 text-sm">— Sabiduría para prospectores</div>
            </div>
          )}


        {/* Tips generales - Notebook style */}
        <div className="mt-12 sm:mt-16">
          <div 
            className="bg-white rounded-xl shadow-lg border-l-4 border-green-400 p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setExpandedDailyTip(!expandedDailyTip)}
            data-onboarding="tip-section"
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

        {/* Logo de Hower al final */}
        <div className="mt-8 mb-4 text-center">
          <img 
            src="/lovable-uploads/8617edb6-fc8a-4cb3-9c0c-52dd051ca7c7.png" 
            alt="Hower Logo" 
            className="h-8 mx-auto"
          />
          <br />
          
          <br />
          
          {/* Botones de opciones */}
          <div className="flex gap-3 justify-center">
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

      {/* Conectado como - Simplificado */}
      {currentUser && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Conectado como @{currentUser.username}
          </p>
        </div>
      )}

      {/* Diálogo de contacto guiado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              {dialogStep === 1 && "🤖 Generando mensaje IA"}
              {dialogStep === 2 && "📱 Contactar a @" + dialogUser}
              {dialogStep === 2 && "✅ ¡Listo!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dialogStep === 1 && "Generando mensaje personalizado con IA..."}
              {dialogStep === 2 && "Paso 2 de 2"}
            </DialogDescription>
          </DialogHeader>

          {/* Paso 1: Generar mensaje con IA */}
          {dialogStep === 1 && (
            <div className="space-y-4">
              {isGeneratingMessage ? (
                <div className="flex flex-col items-center space-y-3 py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Generando mensaje personalizado...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-sm">Mensaje generado por IA</span>
                    </div>
                    <div className="bg-white rounded p-3 text-sm font-mono mb-3">
                      {dialogMessage}
                    </div>
                    <Button 
                      onClick={copyMessage} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar mensaje
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setDialogStep(2)} className="w-full">
                      Continuar
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}

          {/* Paso 2: Abrir Instagram */}
          {dialogStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Ahora abre Instagram y envía el mensaje:</p>
                
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-primary font-medium mb-2">
                    📱 Abrir conversación con @{dialogUser}
                  </div>
                  <Button 
                    onClick={() => {
                      window.open(`https://www.instagram.com/${dialogUser}/`, '_blank');
                      setInstagramOpened(true);
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Abrir Instagram
                  </Button>
                  
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      ¿No se abrió el chat? Copia este enlace y pégalo en tu navegador:
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `https://www.instagram.com/${dialogUser}/`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Enlace copiado",
                          description: `Pega el enlace en tu navegador para ir al chat de @${dialogUser}`,
                        });
                      }}
                      className="w-full text-xs border-primary/20 text-primary hover:bg-primary/5"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar enlace de @{dialogUser}
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setOpenDialog(false);
                    handleMessageSent(dialogUser);
                    setInstagramOpened(false);
                  }}
                  disabled={!instagramOpened}
                  className={`w-full ${!instagramOpened ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {instagramOpened ? '✅ Mensaje enviado' : 'Abre Instagram primero'}
                </Button>
              </DialogFooter>
            </div>
          )}

        </DialogContent>
      </Dialog>

        </div>
      </div>
    </div>
  );
};

export default TasksToDo2;