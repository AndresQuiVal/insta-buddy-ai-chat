import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import InstagramLogin from '@/components/InstagramLogin';
import IdealClientTraits from '@/components/IdealClientTraits';
import { ArrowRight, Copy, ExternalLink, RefreshCw, MessageSquare, Send, CalendarClock, Repeat, BarChart3, UserPlus, Users, CheckCircle, Clock, Wand2, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import howerLogo from '@/assets/hower-logo.png';

interface ProspectRow {
  id: string;
  username: string;
  profile_picture_url?: string | null;
  status: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_from_prospect: boolean;
}

const formatDateISO = (d: Date) => d.toISOString();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const ProspectsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const navigate = useNavigate();

  // SEO minimal
  useEffect(() => {
    document.title = 'Prospectos | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Prospectos y métricas de prospección: nuevos prospectos, seguimientos y números clave.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Prospectos y métricas de prospección: nuevos prospectos, seguimientos y números clave.');
    }
    // canonical
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      link.href = window.location.href;
      document.head.appendChild(link);
    } else {
      link.href = window.location.href;
    }
  }, []);

  // Agregar estilos de confeti
  useEffect(() => {
    if (!document.querySelector('#confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes celebration-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-20px) scale(1.05);
          }
          60% {
            transform: translateY(-10px) scale(1.02);
          }
        }
        @keyframes celebration-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.6);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'nuevos' | 'numeros' | 'mis'>('numeros');


  const [loadingCounts, setLoadingCounts] = useState(false);
  const [counts, setCounts] = useState(() => {
    // Inicializar con valores guardados en localStorage
    const savedEnviados = localStorage.getItem('hower-dashboard-enviados');
    return {
      respuestas: 0,
      enviados: savedEnviados ? parseInt(savedEnviados) : 0,
      agendados: 0,
      seguimientos: 0,
    };
  });

  const [showProspectSources, setShowProspectSources] = useState(false);
  const [dailySentMessages, setDailySentMessages] = useState(() => {
    // Resetear contactados si es un nuevo día
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('hower-last-reset-date');
    
    if (lastResetDate !== today) {
      localStorage.setItem('hower-last-reset-date', today);
      localStorage.removeItem('hower-contacted-prospects');
      localStorage.setItem('hower-daily-sent', '0');
      return 0;
    }
    
    // Inicializar con el conteo real de prospectos contactados
    const contactedProspects = JSON.parse(localStorage.getItem('hower-contacted-prospects') || '[]');
    return contactedProspects.length;
  });
  
  // Estados para celebración
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(() => {
    const saved = localStorage.getItem('hower-daily-streak');
    return saved ? parseInt(saved) : 1;
  });
  
  // Datos reales de fuentes de prospectos basados en @marikowskaya
  const prospectSources = [
    { username: 'marikowskaya', color: '#EC4899' }
  ];

  
  // Función para obtener color aleatorio de fuente
  const getRandomSourceColor = () => {
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Función para obtener descripción de origen de prospecto con color
  const getProspectSourceWithColor = () => {
    return { text: "Sigue a @marikowskaya", color: "#EC4899" };
  };

  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);

  // Nuevos prospectos (de hoy)
  const todayStartISO = useMemo(() => formatDateISO(startOfDay(new Date())), []);
  const [todayProspects, setTodayProspects] = useState<ProspectRow[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);

  // WhatsApp assistant
  const [whatsApp, setWhatsApp] = useState<string>(() => localStorage.getItem('hower-wa') || '');
  const saveWhatsApp = () => {
    localStorage.setItem('hower-wa', whatsApp);
    toast({ title: 'Guardado', description: 'Tu WhatsApp fue guardado. Pronto recibirás notificaciones.' });
  };

  const getActiveInstagramAccount = async () => {
    // Busca el usuario activo más reciente
    const { data, error } = await supabase
      .from('instagram_users')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  };

  const refreshCounts = async () => {
    setLoadingCounts(true);
    try {
      const iu = await getActiveInstagramAccount();
      if (!iu) {
        setCounts({ respuestas: 0, enviados: 0, agendados: 0, seguimientos: 0 });
        return;
      }
      // Use last 7 days as default range
      const fromDt = new Date();
      fromDt.setDate(fromDt.getDate() - 7);
      const toDt = new Date();
      toDt.setHours(23, 59, 59, 999);

      const fromISO = formatDateISO(fromDt);
      const toISO = formatDateISO(toDt);

      // Parallel queries
      const [rec, sent, pres, fol] = await Promise.all([
        supabase
          .from('instagram_messages')
          .select('id', { count: 'exact', head: true })
          .eq('instagram_user_id', iu.id)
          .eq('message_type', 'received')
          .gte('timestamp', fromISO)
          .lte('timestamp', toISO),
        supabase
          .from('instagram_messages')
          .select('id', { count: 'exact', head: true })
          .eq('instagram_user_id', iu.id)
          .eq('message_type', 'sent')
          .gte('timestamp', fromISO)
          .lte('timestamp', toISO),
        supabase
          .from('instagram_messages')
          .select('id', { count: 'exact', head: true })
          .eq('instagram_user_id', iu.id)
          .eq('is_presentation', true)
          .gte('timestamp', fromISO)
          .lte('timestamp', toISO),
        supabase
          .from('daily_prospect_metrics')
          .select('follow_ups_done')
          .eq('instagram_user_id', iu.instagram_user_id)
          .eq('metric_date', new Date().toISOString().split('T')[0])
          .single(),
      ]);

      const newCounts = {
        respuestas: rec.count || 0,
        enviados: Math.max(sent.count || 0, counts.enviados), // Mantener el máximo entre BD y localStorage
        agendados: pres.count || 0,
        seguimientos: fol.data?.follow_ups_done || 0, // Usar datos de daily_prospect_metrics
      };
      
      setCounts(newCounts);
      
      // Actualizar localStorage con el nuevo valor de enviados si es mayor
      if (newCounts.enviados > counts.enviados) {
        localStorage.setItem('hower-dashboard-enviados', newCounts.enviados.toString());
      }
    } finally {
      setLoadingCounts(false);
    }
  };

  const refreshProspects = async () => {
    setLoadingProspects(true);
    try {
      const iu = await getActiveInstagramAccount();
      if (!iu) {
        setProspects([]);
        return;
        }
      const { data, error } = await supabase
        .from('prospects')
        .select('id, username, profile_picture_url, status, first_contact_date, last_message_date, last_message_from_prospect')
        .eq('instagram_user_id', iu.id)
        .order('last_message_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      setProspects((data || []) as ProspectRow[]);
    } catch (e) {
      console.error(e);
      setProspects([]);
    } finally {
      setLoadingProspects(false);
    }
  };

  const refreshTodayProspects = async () => {
    setLoadingToday(true);
    try {
      const iu = await getActiveInstagramAccount();
      if (!iu) {
        setTodayProspects([]);
        return;
      }
      const { data, error } = await supabase
        .from('prospects')
        .select('id, username, profile_picture_url, status, first_contact_date, last_message_date, last_message_from_prospect')
        .eq('instagram_user_id', iu.id)
        .gte('first_contact_date', todayStartISO)
        .order('first_contact_date', { ascending: false });
      if (error) throw error;
      setTodayProspects((data || []) as ProspectRow[]);
    } catch (e) {
      console.error(e);
      setTodayProspects([]);
    } finally {
      setLoadingToday(false);
    }
  };

  useEffect(() => {
    refreshCounts();
    refreshProspects();
    refreshTodayProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (p: ProspectRow) => {
    if (p.status === 'en_seguimiento') return 'En Seguimiento';
    if (p.status === 'esperando_respuesta') return 'Esperando a que contestes';
    // Heurística simple para "Primer mensaje enviado"
    if (!p.last_message_from_prospect && p.first_contact_date === p.last_message_date) return 'Primer mensaje enviado';
    // Fallback
    return 'En Seguimiento';
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

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');

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

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dialogMessage);
      toast({ title: 'Copiado', description: 'Mensaje copiado al portapapeles.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Copia manualmente el texto.' });
    }
  };

  // Función para manejar el envío de mensaje y gamificación
  const handleMessageSent = async (username: string) => {
    const totalProspectos = 17; // Total de prospectos reales de @marikowskaya
    const prospectsToShow = todayProspects.length > 0 ? todayProspects.length : totalProspectos;
    
    // Obtener lista de prospectos ya contactados
    const contactedProspects = JSON.parse(localStorage.getItem('hower-contacted-prospects') || '[]');
    
    // Si ya se contactó este prospecto, no incrementar contador
    if (contactedProspects.includes(username)) {
      toast({
        title: '⚠️ Ya contactado',
        description: `Ya enviaste un mensaje a @${username} hoy.`,
        duration: 3000,
      });
      return;
    }
    
    // Agregar prospecto a la lista de contactados
    const newContactedProspects = [...contactedProspects, username];
    localStorage.setItem('hower-contacted-prospects', JSON.stringify(newContactedProspects));
    
    const newCount = newContactedProspects.length;
    setDailySentMessages(newCount);
    localStorage.setItem('hower-daily-sent', newCount.toString());
    
    // Actualizar contador de enviados en el dashboard y guardarlo
    const newEnviados = counts.enviados + 1;
    setCounts(prev => ({ ...prev, enviados: newEnviados }));
    localStorage.setItem('hower-dashboard-enviados', newEnviados.toString());
    
    // Verificar si completó todos los prospectos del día
    if (newCount >= prospectsToShow) {
      // ¡CELEBRACIÓN ÉPICA!
      const newStreak = dailyStreak + 1;
      setDailyStreak(newStreak);
      localStorage.setItem('hower-daily-streak', newStreak.toString());
      
      setShowCelebration(true);
      
      // Confeti
      createConfetti();
      
    } else {
      // Mensaje de progreso intermedio
      const restantes = prospectsToShow - newCount;
      toast({
        title: '📩 Mensaje enviado',
        description: `¡Perfecto! Te faltan ${restantes} prospectos por contactar hoy.`,
        duration: 3000,
      });
    }
  };

  // Función para crear confeti
  const createConfetti = () => {
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100vw';
    confettiContainer.style.height = '100vh';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9999';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.borderRadius = '50%';
        confetti.style.animation = 'confetti-fall 3s linear forwards';
        confettiContainer.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }, i * 50);
    }
    
    setTimeout(() => {
      confettiContainer.remove();
    }, 4000);
  };

  const instaUrl = (username: string) => `https://www.instagram.com/${username}`;

  // Gamificación mejorada
  const totalProspectos = 17; // Total de prospectos reales de @marikowskaya
  const prospectsToShow = todayProspects.length > 0 ? todayProspects.length : totalProspectos;
  const totalParaContactar = prospectsToShow;
  const progreso = totalParaContactar > 0 ? Math.round((dailySentMessages / totalParaContactar) * 100) : 0;

  // Si está cargando, mostrar loading
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando conexión...</p>
        </div>
      </div>
    );
  }

  // Login de Instagram removido - acceso libre a prospectos

  return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <img src={howerLogo} alt="Logo Hower Assistant" className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20" loading="lazy" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Prospectos</h1>
              <div className="h-1 w-20 rounded-full mt-2" style={{ background: 'var(--gradient-hower)' }} />
            </div>
          </div>
          
        </header>

        {/* Botón Tareas de Hoy */}
        <div className="text-center mb-8">
          <Button 
            onClick={() => {
              if (!currentUser && !userLoading) {
                toast({
                  title: "Acceso restringido",
                  description: "Necesitas conectar tu cuenta de Instagram primero", 
                  variant: "destructive"
                });
                navigate('/');
                return;
              }
              window.location.href = '/tasks-to-do';
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CalendarClock className="h-5 w-5 mr-2" />
            Tareas de Hoy
          </Button>
        </div>

      <main>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-2xl border-0 shadow-lg mb-6">
            <TabsTrigger 
              value="numeros" 
              aria-label="Mis Números" 
              className="rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-gray-600 hover:text-purple-500 font-medium border-0"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Números
            </TabsTrigger>
            <TabsTrigger 
              value="nuevos" 
              aria-label="Nuevos" 
              className="rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-gray-600 hover:text-purple-500 font-medium border-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevos
            </TabsTrigger>
            <TabsTrigger 
              value="mis" 
              aria-label="Mis Prospectos" 
              className="rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-gray-600 hover:text-purple-500 font-medium border-0"
            >
              <Users className="h-4 w-4 mr-2" />
              Lista
            </TabsTrigger>
          </TabsList>

          {/* Nuevos Prospectos */}
          <TabsContent value="nuevos" className="space-y-6 mt-6">
            <section>
              {/* Callout para fuentes de prospectos */}
              <div className="mb-6">
                <div 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => setShowProspectSources(!showProspectSources)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-900">Ver de donde se obtuvieron los prospectos</h3>
                        <p className="text-sm text-blue-700">Cuentas de Instagram analizadas</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${showProspectSources ? 'rotate-90' : ''}`} />
                  </div>
                  
                  {showProspectSources && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prospectSources.map((source, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.instagram.com/${source.username}`, '_blank');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: source.color }}
                              />
                            <div>
                              <p className="text-sm font-medium text-gray-900">@{source.username}</p>
                            </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progreso gamificación mejorado */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Progreso de hoy</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    {dailySentMessages}/{totalParaContactar} contactados
                  </span>
                </div>
                <div className="relative">
                  <div className="h-4 w-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                      style={{ width: `${totalParaContactar > 0 ? (dailySentMessages / totalParaContactar) * 100 : 0}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {totalParaContactar > 0 ? Math.round((dailySentMessages / totalParaContactar) * 100) : 0}% completado
                    </span>
                  </div>
                </div>
              </div>
            </section>


            {/* Listado de Prospectos */}
            <section className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Prospectos para contactar</h3>
                <p className="text-sm text-muted-foreground">Lista de personas para contactar hoy</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {/* Prospectos reales completos de @marikowskaya */}
                {[
                  {
                    username: "salonantoniacb",
                    firstName: "Salon",
                    fullName: "Salon Antonia Cuerpo & Belleza",
                    profilePic: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Holaaa Salon, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? vi tus publicaciones recientes y se siente mucha vibra positiva"
                  },
                  {
                    username: "aran_alma",
                    firstName: "Aran",
                    fullName: "Aran Alcalde",
                    profilePic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Aran, Vi que sigues a @marikowskaya ... Te sirvieron sus ideas para armar una rutina cosmética sencilla? P. D. vi tus publicaciones recientes y tienen un estilo muy único"
                  },
                  {
                    username: "love_roll",
                    firstName: "Love",
                    fullName: "Love & Roll Torrelavega",
                    profilePic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hola hola Love!!, Vi que sigues a @marikowskaya ... Has probado algún consejo de sus tutoriales de maquillaje? vi tus publicaciones recientes y se nota tu dedicación"
                  },
                  {
                    username: "sarahkeer_es",
                    firstName: "SarahKeer",
                    fullName: "SarahKeer España",
                    profilePic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Ey SarahKeer, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? vi tus publicaciones recientes y se nota tu dedicación"
                  },
                  {
                    username: "imeibarcelona",
                    firstName: "Clínicas",
                    fullName: "Clínicas IMÈI",
                    profilePic: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Clínicas, Vi que sigues a @marikowskaya ... Has probado algún consejo de sus tutoriales de maquillaje? vi tus posts recientes y se siente mucha vibra positiva"
                  },
                  {
                    username: "isacar_natural",
                    firstName: "Angela",
                    fullName: "Angela",
                    profilePic: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Angela, Vi que sigues a @marikowskaya ... Has aplicado alguna de sus rutinas de skincare paso a paso? P. D. vi tus publicaciones recientes y se nota tu dedicación"
                  },
                  {
                    username: "clara_nails89",
                    firstName: "Clara",
                    fullName: "UÑAS💫PESTAÑAS💫MAQUILLAJE💫",
                    profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Ey Clara, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? P. D. vi tus posts recientes y se nota tu dedicación"
                  },
                  {
                    username: "juaniflower_5",
                    firstName: "Juana",
                    fullName: "Juana Lopera López",
                    profilePic: "https://images.unsplash.com/photo-1592188657297-c6473609e988?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Juana, Vi que sigues a @marikowskaya ... Qué opinas de su enfoque de skincare sin filtros? P. D. vi tus posts recientes y me parecieron súper auténticas"
                  },
                  {
                    username: "mariarieramakeup",
                    firstName: "Maria",
                    fullName: "Maria Riera • Maquillaje profesional",
                    profilePic: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Holaaa Maria, Vi que sigues a @marikowskaya ... Qué opinas de su enfoque de skincare sin filtros? vi tus posts recientes y me parecieron súper auténticas"
                  },
                  {
                    username: "rfl.solorio",
                    firstName: "Rafael",
                    fullName: "Rafael Solorio",
                    profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Cómo te va Rafael!, Vi que sigues a @marikowskaya ... Te sirvieron sus ideas para armar una rutina cosmética sencilla? P. D. vi tus posts recientes y tienen un estilo muy único"
                  },
                  {
                    username: "remax_susan_siso.synergy",
                    firstName: "Susan",
                    fullName: "Susan Siso",
                    profilePic: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Holaaa Susan, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? vi tus publicaciones recientes y se siente mucha vibra positiva"
                  },
                  {
                    username: "invitada_perfecta",
                    firstName: "Sandra",
                    fullName: "Sandra Majada",
                    profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Holaaa Sandra, Vi que sigues a @marikowskaya ... Te sirvieron sus ideas para armar una rutina cosmética sencilla? P. D. vi tus posts recientes y se nota tu dedicación"
                  },
                  {
                    username: "jessie_naturalandhair",
                    firstName: "Jessie",
                    fullName: "Maquillaje Peluquería Málaga",
                    profilePic: "https://images.unsplash.com/photo-1526736947343-afea1ec891dc?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Ey Jessie, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? vi tus posts recientes y me parecieron súper auténticas"
                  },
                  {
                    username: "itsandra_tgn",
                    firstName: "Sandra",
                    fullName: "ⓢⓐⓝⓓⓡⓐ - inspofashion",
                    profilePic: "https://images.unsplash.com/photo-1611695434398-4f4b330623e6?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hola hola Sandra!!, Vi que sigues a @marikowskaya ... Qué opinas de su enfoque de skincare sin filtros? P. D. vi tus posts recientes y me parecieron súper auténticas"
                  },
                  {
                    username: "marikowskaya",
                    firstName: "Marikowskaya",
                    fullName: "Marikowskaya",
                    profilePic: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Marikowskaya, Vi que sigues a @marikowskaya ... Has probado algún consejo de sus tutoriales de maquillaje? vi tus publicaciones recientes y tienen un estilo muy único"
                  },
                  {
                    username: "marsunestilistasalgorta",
                    firstName: "Marsun",
                    fullName: "Marsun Estilistas",
                    profilePic: "https://images.unsplash.com/photo-1595475207225-428b62bda831?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Cómo te va Marsun!, Vi que sigues a @marikowskaya ... Te identificas con su manera de explicar belleza sin complicaciones? P. D. vi tus posts recientes y se nota tu dedicación"
                  },
                  {
                    username: "nuclear.beauty",
                    firstName: "Amparo",
                    fullName: "Amparo Violero ⚛ Ciencia Cosmética",
                    profilePic: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop&crop=face",
                    sourceColor: "#EC4899",
                    sourceType: "Sigue a @marikowskaya",
                    message: "Hey!, Hola Amparo, Vi que sigues a @marikowskaya ... Has aplicado alguna de sus rutinas de skincare paso a paso? vi tus posts recientes y se siente mucha vibra positiva"
                  }
                ].map((prospect, index) => {
                  // Verificar si ya fue contactado
                  const contactedProspects = JSON.parse(localStorage.getItem('hower-contacted-prospects') || '[]');
                  const isContacted = contactedProspects.includes(prospect.username);
                  
                  return (
                    <div key={index} className={`flex items-center justify-between rounded-xl border bg-card px-4 py-4 transition-all duration-200 hover:shadow-md ${isContacted ? 'opacity-60 bg-green-50 border-green-200' : 'hover:bg-muted/30'}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={prospect.profilePic} 
                            alt={`Perfil de ${prospect.username}`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                            loading="lazy"
                          />
                          {/* Etiqueta de color de fuente */}
                          <div 
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: prospect.sourceColor }}
                            title={prospect.sourceType}
                          />
                          {/* Indicador de contactado */}
                          {isContacted && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                            @{prospect.username}
                            {isContacted && <span className="text-xs text-green-600 font-semibold whitespace-nowrap">✓ Contactado</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2 truncate">
                            {prospect.fullName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 mb-2">
                            <span 
                              className="px-2 py-1 text-xs rounded-full text-white font-medium whitespace-nowrap"
                              style={{ backgroundColor: prospect.sourceColor }}
                            >
                              {prospect.sourceType}
                            </span>
                          </div>
                          {/* Preview del mensaje - oculto en móvil para ahorrar espacio */}
                          <div className="hidden sm:block mt-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground italic max-w-md">
                            "{prospect.message.substring(0, 80)}..."
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        {isContacted ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium whitespace-nowrap">
                            <CheckCircle className="w-4 h-4" />
                            Ya contactado
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    openOnboarding(prospect.username, 'outreach', prospect.message);
                                  }} 
                                  aria-label="Contactar"
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Contactar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Contactar prospecto
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Mostrar prospectos reales de la BD si los hay */}
                {!loadingToday && todayProspects.map((p) => {
                  const sourceInfo = getProspectSourceWithColor();
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 hover:bg-muted/30 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={p.profile_picture_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"} 
                            alt={`Perfil de ${p.username}`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                            loading="lazy"
                          />
                          <div 
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: sourceInfo.color }}
                            title={sourceInfo.text}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            @{p.username}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="px-2 py-1 text-xs rounded-full text-white font-medium"
                              style={{ backgroundColor: sourceInfo.color }}
                            >
                              {sourceInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => openOnboarding(p.username, 'outreach')} 
                                aria-label="Contactar"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Contactar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Contactar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
                
                {loadingToday && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Cargando prospectos...</span>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Mis Números */}
          <TabsContent value="numeros" className="space-y-6 mt-6">

            <section>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-foreground">Mis Números</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { 
                    label: 'Respuestas', 
                    value: counts.respuestas, 
                    Icon: MessageSquare, 
                    color: 'hsl(var(--success))',
                    lightBg: 'hsl(var(--success) / 0.1)'
                  },
                  { 
                    label: 'Enviados', 
                    value: counts.enviados, 
                    Icon: Send, 
                    color: 'hsl(var(--hower-primary))',
                    lightBg: 'hsl(var(--hower-primary) / 0.1)'
                  },
                  { 
                    label: 'Agendados', 
                    value: counts.agendados, 
                    Icon: CalendarClock, 
                    color: 'hsl(var(--hower-medium))',
                    lightBg: 'hsl(var(--hower-medium) / 0.1)'
                  },
                  { 
                    label: 'Seguimientos', 
                    value: counts.seguimientos, 
                    Icon: Repeat, 
                    color: 'hsl(var(--chart-4))',
                    lightBg: 'hsl(var(--chart-4) / 0.1)'
                  },
                ].map(({ label, value, Icon, color, lightBg }) => (
                  <Card key={label} className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-0">
                      <div className="p-6">
                        {/* Header con ícono */}
                        <div className="flex items-center justify-between mb-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ 
                              backgroundColor: lightBg,
                              color: color
                            }}
                          >
                            <Icon className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold tracking-tight" style={{ color: color }}>
                              {loadingCounts ? '...' : value.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Título */}
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">{label}</h3>
                        </div>

                        {/* Indicador de progreso sutil */}
                        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              backgroundColor: color,
                              width: value > 0 ? '100%' : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Refresh button */}
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshCounts} 
                  disabled={loadingCounts}
                  className="gap-2 text-xs hover:bg-muted/50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCounts ? 'animate-spin' : ''}`} />
                  {loadingCounts ? 'Cargando...' : 'Actualizar'}
                </Button>
              </div>
            </section>

            {/* WhatsApp */}
            <section className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <Input placeholder="+52 WhatsApp" value={whatsApp} onChange={(e) => setWhatsApp(e.target.value)} aria-label="WhatsApp" />
                    </div>
                    <Button onClick={saveWhatsApp} aria-label="Guardar">Guardar</Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Mis Prospectos */}
          <TabsContent value="mis" className="space-y-4 mt-6">
            <section>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-muted/40 text-muted-foreground">
                          <th className="py-2 px-3">Prospecto</th>
                          <th className="py-2 px-3">Estado</th>
                          <th className="py-2 px-3 text-right"><Wand2 className="w-4 h-4 inline" aria-label="Acción" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingProspects && (
                          <tr><td className="py-4 px-3" colSpan={3}>Cargando...</td></tr>
                        )}
                        {!loadingProspects && prospects.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3">
                              <a
                                href={instaUrl(p.username)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 hover:underline"
                              >
                                <img
                                  src={p.profile_picture_url || '/placeholder.svg'}
                                  alt={`Avatar de @${p.username}`}
                                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                                  loading="lazy"
                                />
                                <span>@{p.username}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="py-2 px-3">{statusLabel(p)}</td>
                            <td className="py-2 px-3 text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => openOnboarding(p.username, 'followup')} aria-label="Seguimiento sugerido">
                                      <Wand2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Seguimiento sugerido</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        ))}
                        {!loadingProspects && prospects.length === 0 && (
                          <tr><td className="py-4 px-3" colSpan={3}>Sin prospectos todavía.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding Dialog */}
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
              <p className="text-sm text-muted-foreground">1) Copia el mensaje de seguimiento dando clic aquí:</p>
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
                onClick={async () => {
                  await handleMessageSent(dialogUser);
                  setOpenDialog(false);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                Listo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Celebración Épica */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 border-0 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-blue-600/90" />
          <div className="relative z-10">
            <DialogHeader className="text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-2xl" style={{ animation: 'celebration-bounce 2s infinite, celebration-glow 2s infinite' }}>
                <span className="text-3xl">🎉</span>
              </div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                ¡NIVEL COMPLETADO!
              </DialogTitle>
              <DialogDescription className="text-lg text-purple-100 mt-2">
                ¡Has contactado todos los prospectos de hoy!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-center">
              {/* Stats de celebración */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4 text-yellow-300">🔥 ¡Subiste de nivel!</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl p-3 border border-white/10">
                    <div className="text-2xl font-bold text-yellow-300">{dailyStreak}</div>
                    <div className="text-xs text-purple-100">Días seguidos</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl p-3 border border-white/10">
                    <div className="text-2xl font-bold text-yellow-300">100%</div>
                    <div className="text-xs text-purple-100">Completado</div>
                  </div>
                </div>
              </div>

              {/* Mensaje motivacional */}
              <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl p-6 border-2 border-yellow-400/30">
                <div className="text-yellow-300 text-lg font-semibold mb-2">🎯 ¡Sigue así!</div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Estás construyendo un hábito increíble. A los <span className="font-bold text-yellow-300">10 días seguidos</span> de prospectar recibirás una <span className="font-bold text-yellow-300">sesión exclusiva con un mentor</span> para llevar tu prospección al siguiente nivel.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((dailyStreak / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-yellow-300 font-medium">{dailyStreak}/10</span>
                </div>
              </div>

              {/* Botón de continuar */}
              <Button 
                onClick={() => setShowCelebration(false)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-purple-900 font-bold py-4 text-lg shadow-2xl border-0 transition-all duration-300 hover:scale-105"
              >
                ¡Continuar conquistando! 🚀
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectsPage;
