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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Notebook Style Header */}
        <div className="relative">
          <div 
            className="bg-white rounded-t-2xl shadow-lg p-6"
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
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-evenly items-center">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-blue-500 shadow-inner" />
              ))}
            </div>

            {/* Header content */}
            <div className="ml-8">
              {/* Top row with hamburger menu */}
              <div className="flex justify-between items-start mb-6">
                <div></div>
                <TasksHamburgerMenu />
              </div>

              {/* Mis números button */}
              <div className="flex justify-end mb-6">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm"
                  onClick={() => navigate('/analytics')}
                >
                  📊 Mis números
                </Button>
              </div>

              {/* Main title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Mi Lista de Prospectos</h1>
                <p className="text-gray-600 text-sm italic">
                  Cada 'no' te acerca más a un 'sí'. ¡Sigue prospectando!
                </p>
              </div>

              {/* Time estimate box */}
              <div className="bg-yellow-100 border-2 border-dashed border-yellow-400 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    Te demorarás: 1 minutos (Como servirse un café ☕)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content sections */}
        <div className="bg-white shadow-lg">
          {/* Prospectos pendientes */}
          <div className="border-l-4 border-blue-400 p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Prospectos pendientes</span>
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-800 mr-2">
                  {stats.today.abiertas}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Prospectos en seguimiento */}
          <div className="border-l-4 border-orange-400 p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Prospectos en seguimiento</span>
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-800 mr-2">
                  {stats.today.seguimientos}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Nuevos prospectos */}
          <div className="border-l-4 border-green-400 p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Nuevos prospectos</span>
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-800 mr-2">
                  {stats.today.agendados}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tip Pro del Día */}
          <div className="border-l-4 border-green-500 p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700 font-medium">🚀 Tip Pro del Día</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 text-center">
          {/* Hower logo */}
          <div className="mb-4">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full">
              Hower
            </Button>
          </div>

          {/* Made with love */}
          <p className="text-gray-500 text-sm mb-4">
            Hecho con 💜 por Hower
          </p>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="text-blue-600 border-blue-600">
              ⚙️ Otras opciones
            </Button>
            <Button variant="outline" className="text-red-600 border-red-600">
              📤 Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksToDo;