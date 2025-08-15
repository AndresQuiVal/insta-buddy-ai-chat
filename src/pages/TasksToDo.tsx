import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});

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

    const pendingResponses = prospects.filter(p => 
      p.last_message_from_prospect && p.status !== 'contacted'
    );

    const noResponseYesterday = prospects.filter(p => {
      const lastMessageDate = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessageDate >= yesterday && 
             lastMessageDate < now &&
             p.status === 'contacted';
    });

    const noResponse7Days = prospects.filter(p => {
      const lastMessageDate = new Date(p.last_message_date);
      return !p.last_message_from_prospect && 
             lastMessageDate <= sevenDaysAgo &&
             p.status === 'contacted';
    });

    const newProspects = prospects.filter(p => p.status === 'new');

    // Estadísticas para AYER
    const yesterdayStats = {
      nuevosProspectos: prospects.filter(p => {
        const contactDate = new Date(p.first_contact_date);
        return contactDate >= yesterday && contactDate < now && p.status === 'new';
      }).length,
      seguimientosHechos: prospects.filter(p => {
        const lastMessage = new Date(p.last_message_date);
        return !p.last_message_from_prospect && 
               lastMessage >= yesterday && 
               lastMessage < now &&
               p.status === 'contacted';
      }).length,
      agendados: 0 // Por ahora 0, se puede conectar con sistema de citas
    };

    // Estadísticas para LA SEMANA
    const weekStats = {
      nuevosProspectos: prospects.filter(p => {
        const contactDate = new Date(p.first_contact_date);
        return contactDate >= sevenDaysAgo && p.status === 'new';
      }).length,
      seguimientosHechos: prospects.filter(p => {
        const lastMessage = new Date(p.last_message_date);
        return !p.last_message_from_prospect && 
               lastMessage >= sevenDaysAgo &&
               p.status === 'contacted';
      }).length,
      agendados: 0 // Por ahora 0, se puede conectar con sistema de citas
    };

    return {
      pendingResponses,
      noResponseYesterday,
      noResponse7Days,
      newProspects,
      yesterdayStats,
      weekStats
    };
  }, [prospects]);

  const ProspectCard = ({ prospect, taskType }: { prospect: ProspectData; taskType: string }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];

    return (
      <div className={`flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all ${isCompleted ? 'opacity-60 line-through' : ''}`}>
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
        <Button 
          onClick={() => handleContact(prospect.username)}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-xs sm:text-sm flex-shrink-0 ml-2"
          disabled={isCompleted}
        >
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Contactar</span>
          <span className="sm:hidden">💬</span>
        </Button>
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
    tip?: string;
    taskType: string;
    showCheckbox?: boolean;
  }) => {
    const taskKey = `section-${taskType}`;
    const sectionCompleted = completedTasks[taskKey];
    const allProspectsCompleted = prospects.every(p => completedTasks[`${taskType}-${p.id}`]);

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
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <Search className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>💡 Tip:</strong> {tip}
                  </AlertDescription>
                </Alert>
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
                <div className="inline-block p-2 sm:p-3 bg-red-100 rounded-full mb-3 sm:mb-4">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 font-mono">
                  📋 Lista de Tareas de Hoy
                </h1>
                
                {/* Botón para mostrar estadísticas */}
                <div className="mt-4">
                  <Button
                    onClick={() => setShowStats(!showStats)}
                    variant="outline"
                    className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 font-mono text-sm"
                  >
                    {showStats ? '📊 Ocultar mis números' : '📊 ¿Cómo lo hice ayer?'}
                  </Button>
                </div>
                
                {/* Estadísticas - Aparece justo debajo del botón */}
                {showStats && (
                  <div className="mt-6">
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
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400">
                                <span className="font-mono text-sm">🆕 Prospectos Nuevos</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.nuevosProspectos}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-yellow-400">
                                <span className="font-mono text-sm">💬 Seguimientos hechos</span>
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.seguimientosHechos}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400">
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.yesterdayStats.agendados}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="semana" className="space-y-3">
                          <div className="bg-gradient-to-r from-purple-50 to-white p-3 rounded-lg border border-purple-200">
                            <h3 className="text-base font-bold text-purple-800 mb-3 font-mono">📊 Esta Semana</h3>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-green-400">
                                <span className="font-mono text-sm">🆕 Prospectos Nuevos</span>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.nuevosProspectos}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-yellow-400">
                                <span className="font-mono text-sm">💬 Seguimientos hechos</span>
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.seguimientosHechos}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-purple-400">
                                <span className="font-mono text-sm">📅 Agendados</span>
                                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-sm">
                                  {prospectsClassification.weekStats.agendados}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List - Notebook Style */}
        <div className="space-y-3 sm:space-y-4">
          {/* 1. Responder prospectos pendientes */}
          <TaskSection
            title="1. Responder pendientes"
            count={prospectsClassification.pendingResponses.length}
            onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}
            isActive={activeSection === 'pending'}
            icon={MessageSquare}
            prospects={prospectsClassification.pendingResponses}
            tip="Responde rápido para mantener el engagement. ¡La velocidad de respuesta es clave!"
            taskType="pending"
          />

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
                      2. Dar seguimientos
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
                  title="2.1 No respondieron ayer"
                  count={prospectsClassification.noResponseYesterday.length}
                  onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
                  isActive={activeSection === 'yesterday'}
                  icon={Clock}
                  prospects={prospectsClassification.noResponseYesterday}
                  tip='Menciona algo como: "Holaa [NOMBRE] todo bien? soy Andrés! pasaba a dejarte un mensaje y saber si aun sigues por aca? por cierto vi tu perfil y [COMPLEMENTO DEL PERFIL]" pero por audio. No olvides interactuar con sus posts: dar like, comentar, compartir. ¡La interacción aumenta las respuestas!'
                  taskType="yesterday"
                />
                
                {/* 2.2 No respondieron en 7 días */}
                <TaskSection
                  title="2.2 No respondieron en 7 días"
                  count={prospectsClassification.noResponse7Days.length}
                  onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
                  isActive={activeSection === 'week'}
                  icon={Calendar}
                  prospects={prospectsClassification.noResponse7Days}
                  tip='Menciona algo como: "Hey hey [NOMBRE] oye, hace 7 días no escucho de ti, todo bien?" pero en texto. Aprovecha para interactuar con sus posts recientes: da like, comenta algo genuino, comparte si es relevante. ¡La interacción previa aumenta las posibilidades de respuesta!'
                  taskType="week"
                />
              </div>
            )}
          </div>

          {/* 3. Prospectar a nuevos */}
          <TaskSection
            title="3. Nuevos prospectos"
            count={prospectsClassification.newProspects.length}
            onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
            isActive={activeSection === 'new'}
            icon={MessageCircle}
            prospects={prospectsClassification.newProspects}
            tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
            taskType="new"
          />
        </div>

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