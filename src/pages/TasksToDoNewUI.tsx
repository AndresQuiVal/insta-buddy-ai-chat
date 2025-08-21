import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2, Bug, Download, Menu, Users } from 'lucide-react';
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

interface ProspectData {
  id: string;
  userName: string;
  status: string;
  firstContactDate: string;
  lastContactDate: string;
  unread: boolean;
  avatar: string;
}

const TasksToDoNewUI: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading } = useProspects(currentUser?.instagram_user_id);

  // Estados principales
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<{[key: string]: boolean}>({});
  
  // Estados para diálogo de contacto
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2 | 3>(1);
  const [dialogUser, setDialogUser] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [instagramOpened, setInstagramOpened] = useState(false);

  // Mock data para desarrollo
  const mockProspects: ProspectData[] = [
    { id: '1', userName: 'juan_fitness', status: 'pending', firstContactDate: '2024-01-15', lastContactDate: '2024-01-15', unread: true, avatar: '' },
    { id: '2', userName: 'maria_coach', status: 'responded', firstContactDate: '2024-01-14', lastContactDate: '2024-01-16', unread: false, avatar: '' },
    { id: '3', userName: 'carlos_gym', status: 'no_response', firstContactDate: '2024-01-10', lastContactDate: '2024-01-10', unread: false, avatar: '' },
  ];

  const prospects = realProspects.length > 0 ? realProspects.map(p => ({
    id: p.id,
    userName: p.username,
    status: p.state || 'pending',
    firstContactDate: p.lastMessageTime || '2024-01-15', // usando timestamp disponible
    lastContactDate: p.lastMessageTime || '2024-01-15',
    unread: p.lastMessageType !== 'received', // si el último mensaje no fue recibido, está "unread"
    avatar: '' // sin avatar URL disponible en el tipo actual
  })) : mockProspects;

  // Clasificación de prospectos
  const prospectsClassification = useMemo(() => {
    const pending = prospects.filter(p => p.status === 'esperando_respuesta' || p.status === 'pending');
    const yesterday = prospects.filter(p => {
      const lastContact = new Date(p.lastContactDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return lastContact.toDateString() === yesterday.toDateString() && p.status === 'no_response';
    });
    const week = prospects.filter(p => {
      const lastContact = new Date(p.lastContactDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastContact < weekAgo && p.status === 'no_response';
    });

    return { pending, yesterday, week };
  }, [prospects]);

  // Funciones de utilidad
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

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dialogMessage);
      toast({ 
        title: 'Copiado', 
        description: 'Mensaje copiado correctamente.' 
      });
    } catch (error) {
      console.error('Error copiando mensaje:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo copiar. Copia manualmente el texto.',
        variant: 'destructive'
      });
    }
  };

  const handleMessageSent = async (username: string) => {
    const prospect = prospects.find(p => p.userName === username);
    if (!prospect) return;
    
    setCompletedTasks(prev => ({ ...prev, [`pending-${prospect.id}`]: true }));
    toast({
      title: "¡Prospecto contactado!",
      description: `@${username} marcado como completado.`,
      duration: 3000,
    });
  };

  // Componente ProspectCard
  const ProspectCard = ({ prospect, taskType }: { prospect: ProspectData; taskType: string }) => {
    const taskKey = `${taskType}-${prospect.id}`;
    const isCompleted = completedTasks[taskKey];
    
    return (
      <div 
        className={`hower-card cursor-pointer hover:shadow-lg transition-all duration-300 ${isCompleted ? 'opacity-60 line-through' : ''} mb-4`}
        onClick={() => openOnboarding(prospect.userName, 'outreach', undefined, taskType)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={prospect.avatar || ''} />
              <AvatarFallback className="bg-hower-light text-hower-dark font-semibold">
                {prospect.userName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-hower-dark truncate">@{prospect.userName}</p>
              <p className="text-sm text-gray-600">{prospect.lastContactDate}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-hower-primary text-white">
              {taskType === 'pending' ? 'Responder' : taskType === 'yesterday' ? '1 día' : '7 días'}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className={`fixed left-0 top-0 h-full w-64 bg-hower-primary text-white transform transition-transform duration-300 z-50 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="pt-20 px-4">
        <div className="flex items-center mb-8">
          <img src={howerLogo} alt="Hower" className="w-12 h-12 mr-3" />
          <h2 className="text-xl font-bold">Hower</h2>
        </div>
        
        <nav className="space-y-2">
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Prospectos
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <MessageSquare className="w-5 h-5 mr-3" />
            Autoresponder
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            Configuración
          </a>
        </nav>
      </div>
    </div>
  );

  if (userLoading) {
    return (
      <div className="hower-gradient-bg min-h-screen flex items-center justify-center">
        <div className="hower-card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hower-primary mx-auto mb-4"></div>
          <p className="text-hower-dark">Validando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hower-gradient-bg min-h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Overlay para cerrar sidebar */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 pl-0 pt-20 px-6 overflow-y-auto h-screen">
        {/* Header con menú hamburguesa */}
        <div className="fixed top-5 left-5 z-50">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hower-button w-12 h-12 p-0 rounded-[10px] hover:scale-110 transition-transform"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Contenido principal */}
        <div className="max-w-4xl mx-auto">
          {/* Header principal */}
          <div className="text-center mb-8">
            <div className="hower-card max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <img src={howerLogo} alt="Hower" className="w-16 h-16 mr-4" />
                <div>
                  <h1 className="text-3xl font-bold text-hower-dark">Tareas de Hoy</h1>
                  <p className="text-hower-medium">Gestiona tus prospectos de Instagram</p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 text-center">
                <div className="bg-hower-light/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.pending.length}</div>
                  <div className="text-sm text-hower-medium">Pendientes</div>
                </div>
                <div className="bg-hower-light/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.yesterday.length}</div>
                  <div className="text-sm text-hower-medium">Ayer</div>
                </div>
                <div className="bg-hower-light/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-hower-dark">{prospectsClassification.week.length}</div>
                  <div className="text-sm text-hower-medium">7 días</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secciones de tareas */}
          <div className="space-y-6">
            {/* 1. Responder pendientes */}
            <div className="hower-card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActiveSection(activeSection === 'pending' ? null : 'pending')}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-6 h-6 text-hower-primary mr-3" />
                  <h3 className="text-xl font-semibold text-hower-dark">Responder pendientes</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-hower-primary text-white">{prospectsClassification.pending.length}</Badge>
                  {activeSection === 'pending' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
              
              {activeSection === 'pending' && (
                <div className="mt-6 space-y-4">
                  {prospectsClassification.pending.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>¡Excelente! No hay prospectos pendientes.</p>
                    </div>
                  ) : (
                    prospectsClassification.pending.map((prospect) => (
                      <ProspectCard key={prospect.id} prospect={prospect} taskType="pending" />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2. Seguimientos de ayer */}
            <div className="hower-card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActiveSection(activeSection === 'yesterday' ? null : 'yesterday')}
              >
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-orange-500 mr-3" />
                  <h3 className="text-xl font-semibold text-hower-dark">No respondieron ayer</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 text-white">{prospectsClassification.yesterday.length}</Badge>
                  {activeSection === 'yesterday' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
              
              {activeSection === 'yesterday' && (
                <div className="mt-6">
                  <Alert className="mb-4 border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      <strong>💡 Tip:</strong> Envía un mensaje de audio para mayor efectividad. La voz humana genera más respuestas.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    {prospectsClassification.yesterday.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>¡Excelente! No hay seguimientos de ayer pendientes.</p>
                      </div>
                    ) : (
                      prospectsClassification.yesterday.map((prospect) => (
                        <ProspectCard key={prospect.id} prospect={prospect} taskType="yesterday" />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Seguimientos de la semana */}
            <div className="hower-card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActiveSection(activeSection === 'week' ? null : 'week')}
              >
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-xl font-semibold text-hower-dark">No respondieron en 7 días</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500 text-white">{prospectsClassification.week.length}</Badge>
                  {activeSection === 'week' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
              
              {activeSection === 'week' && (
                <div className="mt-6">
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      <strong>💡 Tip:</strong> Mensaje de reactivación: "Hey [NOMBRE], hace 7 días no escucho de ti, ¿todo bien?"
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    {prospectsClassification.week.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>¡Excelente! No hay seguimientos de la semana pendientes.</p>
                      </div>
                    ) : (
                      prospectsClassification.week.map((prospect) => (
                        <ProspectCard key={prospect.id} prospect={prospect} taskType="week" />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de contacto guiado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-hower-dark">
              {dialogStep === 1 && "🤖 Generando mensaje IA"}
              {dialogStep === 2 && "📱 Contactar a @" + dialogUser}
              {dialogStep === 3 && "✅ ¡Listo!"}
            </DialogTitle>
            <DialogDescription className="text-center text-hower-medium">
              {dialogStep === 1 && "Generando mensaje personalizado con IA..."}
              {dialogStep === 2 && "Paso 1 de 2"}
              {dialogStep === 3 && "Paso 2 de 2"}
            </DialogDescription>
          </DialogHeader>

          {/* Paso 1: Generar mensaje con IA */}
          {dialogStep === 1 && (
            <div className="space-y-4">
              {isGeneratingMessage ? (
                <div className="flex flex-col items-center space-y-3 py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hower-primary"></div>
                  <p className="text-sm text-hower-medium">Generando mensaje personalizado...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-hower-light/30 to-hower-medium/20 border border-hower-light rounded-[10px] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-sm text-hower-dark">Mensaje generado por IA</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-sm font-mono mb-3 text-hower-dark">
                      {dialogMessage}
                    </div>
                    <Button 
                      onClick={copyMessage} 
                      variant="outline" 
                      size="sm"
                      className="w-full border-hower-primary text-hower-primary hover:bg-hower-primary hover:text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar mensaje
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setDialogStep(2)} className="hower-button w-full">
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
                <p className="text-sm text-hower-medium">Ahora abre Instagram y envía el mensaje:</p>
                
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-[10px] p-4 text-center">
                  <div className="text-hower-dark font-medium mb-2">
                    📱 Abrir conversación con @{dialogUser}
                  </div>
                  <Button 
                    onClick={() => {
                      window.open(`https://www.instagram.com/m/${dialogUser}/`, '_blank');
                      setInstagramOpened(true);
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Abrir Instagram
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => setDialogStep(3)}
                  disabled={!instagramOpened}
                  className={`hower-button w-full ${!instagramOpened ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {instagramOpened ? 'Continuar' : 'Abre Instagram primero'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Paso 3: Confirmar envío */}
          {dialogStep === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-[10px] p-4 text-center">
                <div className="text-green-700 font-medium mb-2">
                  📋 Copia este mensaje y envíalo:
                </div>
                <div className="bg-white rounded-lg p-3 text-sm font-mono mb-3 text-left text-hower-dark">
                  {dialogMessage}
                </div>
                <Button 
                  onClick={copyMessage} 
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-700 hover:bg-green-500 hover:text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar mensaje
                </Button>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setOpenDialog(false);
                    handleMessageSent(dialogUser);
                    setInstagramOpened(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  ✅ Listo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksToDoNewUI;