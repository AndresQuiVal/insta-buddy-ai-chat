import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar } from 'lucide-react';
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

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<ProspectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  // Clasificar prospectos
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

    return {
      pendingResponses,
      noResponseYesterday,
      noResponse7Days,
      newProspects
    };
  }, [prospects]);

  const ProspectCard = ({ prospect }: { prospect: ProspectData }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={prospect.profile_picture_url || ''} />
          <AvatarFallback>{prospect.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">@{prospect.username}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(prospect.last_message_date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Button 
        onClick={() => handleContact(prospect.username)}
        size="sm"
        className="bg-primary hover:bg-primary/90"
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        Contactar
      </Button>
    </div>
  );

  const TaskSection = ({ 
    title, 
    count, 
    onClick, 
    isActive, 
    icon: Icon,
    prospects,
    tip
  }: {
    title: string;
    count: number;
    onClick: () => void;
    isActive: boolean;
    icon: any;
    prospects: ProspectData[];
    tip?: string;
  }) => (
    <div className="mb-6">
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-primary" />
              <span>{title}</span>
            </div>
            <Badge variant="secondary">{count}</Badge>
          </CardTitle>
        </CardHeader>
        
        {isActive && (
          <CardContent className="pt-0">
            {tip && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Search className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>💡 Tip:</strong> {tip}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              {prospects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>¡Excelente! No hay tareas pendientes en esta sección.</p>
                </div>
              ) : (
                prospects.map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} />
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/prospects'}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Prospectos
        </Button>
        
        <div className="text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">📋 Cosas por hacer:</h1>
          <p className="text-muted-foreground">Organiza tu día para maximizar resultados</p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {/* 1. Responder prospectos pendientes */}
        <TaskSection
          title="1. Responder prospectos pendientes"
          count={prospectsClassification.pendingResponses.length}
          onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}
          isActive={activeSection === 'pending'}
          icon={MessageSquare}
          prospects={prospectsClassification.pendingResponses}
          tip="Responde rápido para mantener el engagement. ¡La velocidad de respuesta es clave!"
        />

        {/* 2. Dar Seguimientos e Interactuar */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>2. Dar Seguimientos e Interactuar</span>
              </CardTitle>
            </CardHeader>
          </Card>
          
          {/* 2.1 No respondieron ayer */}
          <div className="ml-6 mt-4">
            <TaskSection
              title="2.1 Prospectos que no te respondieron ayer"
              count={prospectsClassification.noResponseYesterday.length}
              onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
              isActive={activeSection === 'yesterday'}
              icon={Clock}
              prospects={prospectsClassification.noResponseYesterday}
              tip='Menciona algo como: "Holaa [NOMBRE] todo bien? soy Andrés! pasaba a dejarte un mensaje y saber si aun sigues por aca? por cierto vi tu perfil y [COMPLEMENTO DEL PERFIL]" pero por audio. No olvides interactuar con sus posts: dar like, comentar, compartir. ¡La interacción aumenta las respuestas!'
            />
          </div>
          
          {/* 2.2 No respondieron en 7 días */}
          <div className="ml-6 mt-4">
            <TaskSection
              title="2.2 Prospectos que no te han respondido en 7 días"
              count={prospectsClassification.noResponse7Days.length}
              onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
              isActive={activeSection === 'week'}
              icon={Calendar}
              prospects={prospectsClassification.noResponse7Days}
              tip='Menciona algo como: "Hey hey [NOMBRE] oye, hace 7 días no escucho de ti, todo bien?" pero en texto. Aprovecha para interactuar con sus posts recientes: da like, comenta algo genuino, comparte si es relevante. ¡La interacción previa aumenta las posibilidades de respuesta!'
            />
          </div>
        </div>

        {/* 3. Prospectar a nuevos */}
        <TaskSection
          title="3. Prospectar a nuevos"
          count={prospectsClassification.newProspects.length}
          onClick={() => setActiveSection(activeSection === 'new' ? null : 'new')}
          isActive={activeSection === 'new'}
          icon={MessageCircle}
          prospects={prospectsClassification.newProspects}
          tip="Antes de enviar el primer mensaje, interactúa con sus posts más recientes: da like, comenta algo auténtico. Esto aumenta las posibilidades de que vean y respondan tu mensaje."
        />
      </div>

      {/* Tips generales */}
      <div className="mt-8">
        <Alert className="border-green-200 bg-green-50">
          <Heart className="h-4 w-4" />
          <AlertDescription>
            <strong>🚀 Tip Pro:</strong> Para cada prospecto, dedica 30 segundos a interactuar con sus posts antes de enviar mensajes. 
            Un like + comentario genuino puede triplicar tu tasa de respuesta. ¡La interacción es la clave del éxito!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default TasksToDo;