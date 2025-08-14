import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  const [activeTab, setActiveTab] = useState<'nuevos' | 'numeros' | 'mis'>('numeros');


  const [loadingCounts, setLoadingCounts] = useState(false);
  const [counts, setCounts] = useState({
    respuestas: 0,
    enviados: 0,
    agendados: 0,
    seguimientos: 0,
  });

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
          .from('autoresponder_followups')
          .select('id', { count: 'exact', head: true })
          .gte('followup_sent_at', fromISO)
          .lte('followup_sent_at', toISO),
      ]);

      setCounts({
        respuestas: rec.count || 0,
        enviados: sent.count || 0,
        agendados: pres.count || 0,
        seguimientos: fol.count || 0,
      });
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
      const text = (data as any)?.generatedText || (data as any)?.message || JSON.stringify(data);
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

  const openOnboarding = async (username: string, type: 'followup' | 'outreach') => {
    setDialogUser(username);
    setDialogStep(1);
    setOpenDialog(true);
    const msg = await generateMessage(username, type);
    setDialogMessage(msg);
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

  // Gamificación simple (progreso del día)
  const totalHoy = todayProspects.length;
  const contactadosHoy = todayProspects.filter(p => p.status === 'en_seguimiento').length;
  const porContactarHoy = Math.max(0, totalHoy - contactadosHoy);
  const progreso = totalHoy > 0 ? Math.round((contactadosHoy / totalHoy) * 100) : 0;

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

  // Si no hay usuario conectado, mostrar login de Instagram
  if (!currentUser) {
    return <InstagramLogin />;
  }

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

      <main>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-xl border bg-card p-1 shadow-sm">
            <TabsTrigger value="numeros" aria-label="Mis Números" className="rounded-lg transition-colors data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="nuevos" aria-label="Nuevos" className="rounded-lg transition-colors data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30">
              <UserPlus className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="mis" aria-label="Mis Prospectos" className="rounded-lg transition-colors data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30">
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {/* Nuevos Prospectos */}
          <TabsContent value="nuevos" className="space-y-6 mt-6">
            <section>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <Card>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--hower-primary) / 0.12)', color: 'hsl(var(--hower-primary))' }}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-4xl font-semibold leading-none">{totalHoy}</div>
                      <div className="text-xs text-muted-foreground mt-1">Hoy</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))' }}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-4xl font-semibold leading-none">{contactadosHoy}</div>
                      <div className="text-xs text-muted-foreground mt-1">Contactados</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--hower-medium) / 0.12)', color: 'hsl(var(--hower-medium))' }}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-4xl font-semibold leading-none">{porContactarHoy}</div>
                      <div className="text-xs text-muted-foreground mt-1">Por contactar</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progreso gamificación */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${progreso}%`, background: 'var(--gradient-hower)' }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progreso}%</p>
                </div>
            </section>


            {/* Listado de Prospectos de Ejemplo */}
            <section className="mt-6">
              <div className="grid grid-cols-1 gap-3">
                {/* Ejemplos de prospectos */}
                {[
                  {
                    username: "maria_fitness_coach",
                    profilePic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
                    status: "nuevo"
                  },
                  {
                    username: "carlos_entrepreneur",
                    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", 
                    status: "contactado"
                  },
                  {
                    username: "ana_marketing_pro",
                    profilePic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
                    status: "nuevo"
                  },
                  {
                    username: "luis_designer_mx",
                    profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
                    status: "respondió"
                  },
                  {
                    username: "sofia_coach_life",
                    profilePic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
                    status: "nuevo"
                  }
                ].map((prospect, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={prospect.profilePic} 
                        alt={`Perfil de ${prospect.username}`}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                        loading="lazy"
                      />
                      <div>
                        <div className="text-sm font-medium">@{prospect.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {prospect.status === "nuevo" && "🆕 Nuevo prospecto"}
                          {prospect.status === "contactado" && "✅ Ya contactado"}  
                          {prospect.status === "respondió" && "💬 Respondió"}
                        </div>
                      </div>
                    </div>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => openOnboarding(prospect.username, 'outreach')} 
                              aria-label="Contactar"
                              variant={prospect.status === "nuevo" ? "default" : "outline"}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {prospect.status === "nuevo" ? "Contactar ahora" : "Ver conversación"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
                
                {/* Mostrar prospectos reales si los hay */}
                {!loadingToday && todayProspects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.profile_picture_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"} 
                        alt={`Perfil de ${p.username}`}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                        loading="lazy"
                      />
                      <div>
                        <div className="text-sm font-medium">@{p.username}</div>
                        <div className="text-xs text-muted-foreground">🔴 Real - {statusLabel(p)}</div>
                      </div>
                    </div>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" onClick={() => openOnboarding(p.username, 'outreach')} aria-label="Contactar">
                              <Send className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Contactar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
                
                {loadingToday && <div className="text-sm text-muted-foreground">Cargando...</div>}
                {!loadingToday && todayProspects.length === 0 && (
                  <div className="text-sm text-muted-foreground mt-4">
                    Por ahora mostramos ejemplos. Los prospectos reales aparecerán aquí cuando se sincronicen.
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Mis Números */}
          <TabsContent value="numeros" className="space-y-6 mt-6">

            <section>
              <div className="mb-8">
                <h2 className="text-lg font-medium text-foreground mb-2">Mis Números</h2>
                <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { 
                    label: 'Respuestas', 
                    value: counts.respuestas, 
                    Icon: MessageSquare, 
                    color: 'hsl(var(--success))',
                    lightBg: 'hsl(var(--success) / 0.1)',
                    description: 'Te respondieron'
                  },
                  { 
                    label: 'Enviados', 
                    value: counts.enviados, 
                    Icon: Send, 
                    color: 'hsl(var(--hower-primary))',
                    lightBg: 'hsl(var(--hower-primary) / 0.1)',
                    description: 'Mensajes que enviaste'
                  },
                  { 
                    label: 'Agendados', 
                    value: counts.agendados, 
                    Icon: CalendarClock, 
                    color: 'hsl(var(--hower-medium))',
                    lightBg: 'hsl(var(--hower-medium) / 0.1)',
                    description: 'Reuniones programadas'
                  },
                  { 
                    label: 'Seguimientos', 
                    value: counts.seguimientos, 
                    Icon: Repeat, 
                    color: 'hsl(var(--chart-4))',
                    lightBg: 'hsl(var(--chart-4) / 0.1)',
                    description: 'Segundos mensajes'
                  },
                ].map(({ label, value, Icon, color, lightBg, description }) => (
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
                        
                        {/* Descripción */}
                        <div>
                          <h3 className="font-semibold text-sm text-foreground mb-1">{label}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
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
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Listo</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectsPage;
