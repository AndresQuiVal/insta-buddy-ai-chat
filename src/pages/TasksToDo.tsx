import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Clock, Search, Heart, MessageCircle, Share2, CheckCircle, Calendar, ChevronDown, ChevronRight, BarChart3, Phone, Settings, ArrowRight, Copy, Edit2, Check, X, LogOut, Instagram, RefreshCw, Trash2, Bug, Download } from 'lucide-react';
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
import TasksHamburgerMenu from '@/components/TasksHamburgerMenu';
import ProspectActionDialog from '@/components/ProspectActionDialog';
import HowerService from '@/services/howerService';
import NewProspectsResults from '@/components/NewProspectsResults';

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading, refetch } = useProspects(currentUser?.instagram_user_id);

  // Estados básicos
  const [loading, setLoading] = useState(true);
  const [howerUsernames, setHowerUsernames] = useState<string[]>([]);
  const [stats, setStats] = useState({
    today: { abiertas: 0, seguimientos: 0, agendados: 0 },
    yesterday: { abiertas: 0, seguimientos: 0, agendados: 0 },
    week: { abiertas: 0, seguimientos: 0, agendados: 0 }
  });

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

  // Verificación de autenticación simplificada
  useEffect(() => {
    if (!userLoading) {
      if (!currentUser) {
        toast({
          title: "Acceso restringido",
          description: "Necesitas conectar tu cuenta de Instagram",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        return;
      }

      if (!HowerService.isAuthenticated()) {
        toast({
          title: "Credenciales requeridas", 
          description: "Necesitas autenticarte con Hower",
          variant: "destructive"
        });
        navigate('/hower-auth', { replace: true });
        return;
      }

      // Si llegamos aquí, todo está bien
      setLoading(false);
      loadStats();
    }
  }, [userLoading, currentUser, navigate, toast]);

  // Cargar estadísticas
  const loadStats = async () => {
    if (!currentUser?.instagram_user_id) return;

    try {
      const { data, error } = await supabase.rpc('grok_get_stats', {
        p_instagram_user_id: currentUser.instagram_user_id,
        p_period: 'today'
      });

      if (!error && data?.[0]) {
        setStats(prev => ({
          ...prev,
          today: {
            abiertas: data[0].abiertas || 0,
            seguimientos: data[0].seguimientos || 0,
            agendados: data[0].agendados || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Pantalla de carga
  if (userLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {userLoading ? 'Validando acceso...' : 'Cargando tareas...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header con menú hamburguesa */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="absolute top-4 right-4 z-10">
            <TasksHamburgerMenu />
          </div>
          
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
              {/* Spiral binding holes */}
              <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: '#7a60ff'}} />
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 ml-8">
                <div className="flex items-center space-x-3">
                  <img src={howerLogo} alt="Hower" className="h-8 w-8" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tareas de Hoy</h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {currentUser?.username && `@${currentUser.username}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estadísticas básicas */}
              <div className="grid grid-cols-3 gap-4 ml-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.today.abiertas}</div>
                    <div className="text-sm text-gray-600">Urgentes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.today.seguimientos}</div>
                    <div className="text-sm text-gray-600">Seguimientos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.today.agendados}</div>
                    <div className="text-sm text-gray-600">Agendados</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Lista de Prospectos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prospectsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando prospectos...</p>
                </div>
              ) : realProspects.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay prospectos disponibles</p>
                  <p className="text-sm text-gray-400">Conecta tus mensajes para ver tus prospectos aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {realProspects.slice(0, 10).map((prospect) => (
                    <div key={prospect.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{prospect.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">@{prospect.username}</div>
                          <div className="text-sm text-gray-500">
                            {prospect.lastMessageType === 'received' ? 'Te respondió' : 'Esperando respuesta'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{prospect.state}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TasksToDo;