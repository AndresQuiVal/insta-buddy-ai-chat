import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageCircle, Clock, ArrowRight, Calendar, Phone, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TasksToDo() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [prospectStates, setProspectStates] = useState<any[]>([]);
  const [yesterdayMetrics, setYesterdayMetrics] = useState<any>(null);
  const [todayMetrics, setTodayMetrics] = useState<any>(null);
  const [instagramUser, setInstagramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // SEO
  useEffect(() => {
    document.title = 'Tasks To Do | Hower Lite';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Dashboard de tareas diarias para prospectos: gestiona respuestas pendientes, seguimientos y métricas de prospección.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Dashboard de tareas diarias para prospectos: gestiona respuestas pendientes, seguimientos y métricas de prospección.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario de Instagram activo
      const { data: igUser, error: igError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (igError || !igUser) {
        console.log('No hay usuario de Instagram conectado');
        setLoading(false);
        return;
      }

      setInstagramUser(igUser);

      // Obtener estados de prospectos
      const { data: statesData, error: statesError } = await supabase
        .from('prospect_states')
        .select('*')
        .eq('instagram_user_id', igUser.instagram_user_id)
        .order('updated_at', { ascending: false });

      if (statesError) {
        console.error('Error loading prospect states:', statesError);
      } else {
        setProspectStates(statesData || []);
      }

      // Obtener métricas de ayer
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('daily_prospect_metrics')
        .select('*')
        .eq('instagram_user_id', igUser.instagram_user_id)
        .eq('metric_date', yesterdayDate)
        .maybeSingle();

      setYesterdayMetrics(yesterdayData);

      // Obtener métricas de hoy
      const todayDate = new Date().toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('daily_prospect_metrics')
        .select('*')
        .eq('instagram_user_id', igUser.instagram_user_id)
        .eq('metric_date', todayDate)
        .maybeSingle();

      setTodayMetrics(todayData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar prospectos por estado
  const pendingProspects = prospectStates.filter(p => p.state === 'pending_response');
  const noResponse1Day = prospectStates.filter(p => p.state === 'no_response_1day');
  const noResponse7Days = prospectStates.filter(p => p.state === 'no_response_7days');

  const ProspectCard = ({ prospect }: { prospect: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{prospect.prospect_username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">@{prospect.prospect_username}</p>
              <p className="text-sm text-muted-foreground">
                {prospect.last_prospect_message_at && 
                  `Último mensaje: ${new Date(prospect.last_prospect_message_at).toLocaleDateString()}`
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => window.open(`https://instagram.com/m/${prospect.prospect_username}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir conversación Instagram
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={async () => {
                try {
                  await supabase.rpc('update_daily_metric', {
                    p_instagram_user_id: instagramUser?.instagram_user_id,
                    p_metric_type: 'follow_ups_done'
                  });
                  toast({
                    title: "✅ Seguimiento completado",
                    description: "Métrica actualizada correctamente"
                  });
                  loadData();
                } catch (error) {
                  console.error('Error updating metric:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo actualizar la métrica",
                    variant: "destructive"
                  });
                }
              }}
            >
              Listo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!instagramUser) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Conecta tu Instagram</CardTitle>
            <CardDescription>
              Necesitas conectar tu cuenta de Instagram para ver tus tareas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/instagram-callback'} className="w-full">
              Conectar Instagram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tasks To Do</h1>
              <p className="text-muted-foreground">
                Gestiona tus prospectos y mantén el control de tu prospección
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/hower-lite-setup'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yesterday">Como lo hice ayer</TabsTrigger>
                <TabsTrigger value="today">Tareas de hoy</TabsTrigger>
              </TabsList>

              <TabsContent value="yesterday" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Mis Números - Ayer</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="text-2xl font-bold text-blue-600">{yesterdayMetrics?.new_prospects_contacted || 0}</div>
                      <div className="text-sm text-muted-foreground text-center">Nuevos prospectos contactados</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="text-2xl font-bold text-green-600">{yesterdayMetrics?.follow_ups_done || 0}</div>
                      <div className="text-sm text-muted-foreground text-center">Seguimientos hechos</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="text-2xl font-bold text-purple-600">{yesterdayMetrics?.responses_obtained || 0}</div>
                      <div className="text-sm text-muted-foreground text-center">Respuestas obtenidas</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="text-2xl font-bold text-orange-600">{yesterdayMetrics?.pending_responses || 0}</div>
                      <div className="text-sm text-muted-foreground text-center">Conversaciones abiertas</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="today" className="space-y-6">
                {/* Mis Números - Hoy */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mis Números - Hoy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-blue-600">{todayMetrics?.new_prospects_contacted || 0}</div>
                        <div className="text-sm text-muted-foreground text-center">Nuevos prospectos contactados</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-green-600">{todayMetrics?.follow_ups_done || 0}</div>
                        <div className="text-sm text-muted-foreground text-center">Seguimientos hechos</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-purple-600">{todayMetrics?.responses_obtained || 0}</div>
                        <div className="text-sm text-muted-foreground text-center">Respuestas obtenidas</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-orange-600">{todayMetrics?.pending_responses || 0}</div>
                        <div className="text-sm text-muted-foreground text-center">Conversaciones abiertas</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Prospectos Pendientes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Prospectos Pendientes ({pendingProspects.length})
                    </CardTitle>
                    <CardDescription>
                      Personas que te han escrito y están esperando tu respuesta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingProspects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>¡Excelente! No tienes prospectos pendientes por responder.</p>
                      </div>
                    ) : (
                      pendingProspects.map((prospect) => (
                        <ProspectCard key={prospect.id} prospect={prospect} />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Prospectos que debes dar seguimiento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Prospectos que debes dar seguimiento
                    </CardTitle>
                    <CardDescription>
                      Personas a las que les escribiste pero no han respondido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* No respondieron ayer */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        No respondieron ayer ({noResponse1Day.length})
                      </h4>
                      <div className="space-y-4">
                        {noResponse1Day.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay prospectos en esta categoría</p>
                        ) : (
                          noResponse1Day.map((prospect) => (
                            <ProspectCard key={prospect.id} prospect={prospect} />
                          ))
                        )}
                      </div>
                    </div>

                    {/* No respondieron hace 7 días */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        No respondieron hace 7 días ({noResponse7Days.length})
                      </h4>
                      <div className="space-y-4">
                        {noResponse7Days.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay prospectos en esta categoría</p>
                        ) : (
                          noResponse7Days.map((prospect) => (
                            <ProspectCard key={prospect.id} prospect={prospect} />
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}