import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import IdealClientTraits from '@/components/IdealClientTraits';
import { ArrowRight, Copy, ExternalLink, RefreshCw } from 'lucide-react';

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
  const { currentUser } = useInstagramUsers();

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

  const [activeTab, setActiveTab] = useState<'nuevos' | 'numeros' | 'mis'>('nuevos');

  // Date range for Mis Números
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

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
      const fromDt = new Date(from);
      const toDt = new Date(to);
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

  return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Prospectos</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus nuevos prospectos, tus números y tus seguimientos.</p>
        </header>

      <main>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-lg border bg-muted/40 p-1">
            <TabsTrigger value="nuevos" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Nuevos Prospectos</TabsTrigger>
            <TabsTrigger value="numeros" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Mis Números</TabsTrigger>
            <TabsTrigger value="mis" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Mis Prospectos</TabsTrigger>
          </TabsList>

          {/* Nuevos Prospectos */}
          <TabsContent value="nuevos" className="space-y-6 mt-6">
            <section>
              <h2 className="text-lg font-medium">Prospectos de Hoy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-semibold">{totalHoy}</div>
                    <div className="text-xs text-muted-foreground mt-1">Cantidad Total de Hoy</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-semibold">{contactadosHoy}</div>
                    <div className="text-xs text-muted-foreground mt-1">Cantidad Contactados</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-semibold">{porContactarHoy}</div>
                    <div className="text-xs text-muted-foreground mt-1">Cantidad por contactar</div>
                  </CardContent>
                </Card>
              </div>

              {/* Progreso gamificación */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary/80 to-primary" style={{ width: `${progreso}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Progreso del día: {progreso}%</p>
                </div>
            </section>

            {/* ICP Config */}
            <section className="mt-6">
              <h3 className="text-sm font-medium mb-2">Configura tu ICP (Cliente Ideal)</h3>
              <Card>
                <CardContent className="p-4">
                  <IdealClientTraits />
                </CardContent>
              </Card>
            </section>

            {/* Listado */}
            <section className="mt-6">
              <div className="grid grid-cols-1 gap-2">
                {loadingToday && <div className="text-sm text-muted-foreground">Cargando...</div>}
                {!loadingToday && todayProspects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="text-sm font-medium">@{p.username}</div>
                    <div>
                      <Button size="sm" onClick={() => openOnboarding(p.username, 'outreach')}>Contactar</Button>
                    </div>
                  </div>
                ))}
                {!loadingToday && todayProspects.length === 0 && (
                  <div className="text-sm text-muted-foreground">No hay prospectos hoy.</div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Mis Números */}
          <TabsContent value="numeros" className="space-y-6 mt-6">
            <Card>
              <CardContent className="p-4">
                <section className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1">
                    <Label>Desde</Label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>Hasta</Label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                  <Button onClick={refreshCounts} disabled={loadingCounts} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                  </Button>
                </section>
              </CardContent>
            </Card>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Respuestas', value: counts.respuestas },
                { label: 'Mensajes enviados', value: counts.enviados },
                { label: 'Agendados', value: counts.agendados },
                { label: 'Seguimientos enviados', value: counts.seguimientos },
              ].map((c) => (
                <Card key={c.label}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-semibold">{c.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                  </CardContent>
                </Card>
              ))}
            </section>

            {/* Asistente por WhatsApp */}
            <section className="mt-6">
              <h3 className="text-sm font-medium mb-2">Asistente por WhatsApp</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <Label>Tu número de WhatsApp</Label>
                      <Input placeholder="+521234567890" value={whatsApp} onChange={(e) => setWhatsApp(e.target.value)} />
                    </div>
                    <Button onClick={saveWhatsApp}>Guardar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recibirás recordatorios para contactar, dar seguimiento y un resumen semanal. (Próximamente)
                  </p>
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
                          <th className="py-2 px-3 text-right">Acción</th>
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
                                  className="w-8 h-8 rounded-full object-cover"
                                  loading="lazy"
                                />
                                <span>@{p.username}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="py-2 px-3">{statusLabel(p)}</td>
                            <td className="py-2 px-3 text-right">
                              <Button size="sm" variant="outline" onClick={() => openOnboarding(p.username, 'followup')}>
                                Mensaje Seguimiento Sugerido
                              </Button>
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
            <DialogTitle>Enviar mensaje a @{dialogUser}</DialogTitle>
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
