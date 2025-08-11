import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  Calendar,
  Target,
  Award,
  Zap,
  Clock,
  RefreshCw,
  BarChart3,
  UserPlus,
  Send,
  Inbox,
  CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AppAnalytics {
  // Estadísticas de usuarios
  totalUsers: number;
  activeUsers: number;
  todayUsers: number;
  weekUsers: number;
  monthUsers: number;
  
  // Estadísticas de mensajería global
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalAutoresponders: number;
  totalProspects: number;
  
  // Métricas de rendimiento
  globalResponseRate: number;
  averageMessagesPerUser: number;
  mostActiveUser: string;
  
  // Métricas de conversión
  totalInvitations: number;
  totalPresentations: number;
  totalInscriptions: number;
}

const AppAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando analytics generales de la app...');

      // Obtener estadísticas de usuarios
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error cargando profiles:', profilesError);
      }

      // Obtener usuarios de Instagram activos
      const { data: instagramUsers, error: instagramError } = await supabase
        .from('instagram_users')
        .select('*');

      if (instagramError) {
        console.error('Error cargando instagram users:', instagramError);
      }

      // Obtener mensajes totales
      const { data: messages, error: messagesError } = await supabase
        .from('instagram_messages')
        .select('*');

      if (messagesError) {
        console.error('Error cargando messages:', messagesError);
      }

      // Obtener autoresponders
      const { data: autoresponders, error: autorespondersError } = await supabase
        .from('autoresponder_messages')
        .select('*');

      if (autorespondersError) {
        console.error('Error cargando autoresponders:', autorespondersError);
      }

      // Obtener prospectos
      const { data: prospects, error: prospectsError } = await supabase
        .from('prospects')
        .select('*');

      if (prospectsError) {
        console.error('Error cargando prospects:', prospectsError);
      }

      // Calcular métricas
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const todayUsers = profilesData?.filter(p => 
        new Date(p.created_at) >= today
      ).length || 0;

      const weekUsers = profilesData?.filter(p => 
        new Date(p.created_at) >= weekAgo
      ).length || 0;

      const monthUsers = profilesData?.filter(p => 
        new Date(p.created_at) >= monthAgo
      ).length || 0;

      const messagesSent = messages?.filter(m => m.message_type === 'sent').length || 0;
      const messagesReceived = messages?.filter(m => m.message_type === 'received').length || 0;
      const totalInvitations = messages?.filter(m => m.is_invitation).length || 0;
      const totalPresentations = messages?.filter(m => m.is_presentation).length || 0;
      const totalInscriptions = messages?.filter(m => m.is_inscription).length || 0;

      const responseRate = messagesSent > 0 ? (messagesReceived / messagesSent) * 100 : 0;
      const averageMessagesPerUser = instagramUsers && instagramUsers.length > 0 
        ? messagesSent / instagramUsers.length 
        : 0;

      // Usuario más activo (por número de mensajes enviados)
      const userMessageCounts = instagramUsers?.map(user => {
        const userMessages = messages?.filter(m => 
          m.instagram_user_id === user.id && m.message_type === 'sent'
        ).length || 0;
        return { username: user.username, count: userMessages };
      });

      const mostActive = userMessageCounts?.reduce((prev, current) => 
        prev.count > current.count ? prev : current
      );

      const analyticsData: AppAnalytics = {
        totalUsers: profilesData?.length || 0,
        activeUsers: instagramUsers?.filter(u => u.is_active).length || 0,
        todayUsers,
        weekUsers,
        monthUsers,
        totalMessagesSent: messagesSent,
        totalMessagesReceived: messagesReceived,
        totalAutoresponders: autoresponders?.length || 0,
        totalProspects: prospects?.length || 0,
        globalResponseRate: responseRate,
        averageMessagesPerUser: averageMessagesPerUser,
        mostActiveUser: mostActive?.username || 'N/A',
        totalInvitations,
        totalPresentations,
        totalInscriptions
      };

      setAnalytics(analyticsData);
      console.log('✅ Analytics cargados:', analyticsData);

    } catch (error) {
      console.error('💥 Error cargando analytics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card className="p-6 bg-white/90 backdrop-blur-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Analytics Generales</h2>
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white/90 rounded-xl p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
        <p className="text-gray-500">No se pudieron cargar las estadísticas de la aplicación</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics de Hower Assistant</h2>
          <p className="text-gray-600">Estadísticas generales de uso de la plataforma</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Estadísticas de Usuarios */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Usuarios Registrados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total de Usuarios"
            value={analytics.totalUsers}
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Usuarios Activos"
            value={analytics.activeUsers}
            icon={<Activity className="w-5 h-5 text-white" />}
            color="bg-green-500"
            subtitle={`${((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}% del total`}
          />
          <MetricCard
            title="Registros Hoy"
            value={analytics.todayUsers}
            icon={<UserPlus className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Esta Semana"
            value={analytics.weekUsers}
            icon={<Calendar className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Este Mes"
            value={analytics.monthUsers}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-pink-500"
          />
        </div>
      </div>

      {/* Estadísticas de Mensajería */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Actividad de Mensajería</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Mensajes Enviados"
            value={analytics.totalMessagesSent.toLocaleString()}
            icon={<Send className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Respuestas Recibidas"
            value={analytics.totalMessagesReceived.toLocaleString()}
            icon={<Inbox className="w-5 h-5 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Tasa de Respuesta Global"
            value={`${analytics.globalResponseRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Prospectos Totales"
            value={analytics.totalProspects.toLocaleString()}
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Métricas de Conversión */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Métricas de Conversión</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Invitaciones"
            value={analytics.totalInvitations.toLocaleString()}
            icon={<Target className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Total Presentaciones"
            value={analytics.totalPresentations.toLocaleString()}
            icon={<Award className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Total Inscripciones"
            value={analytics.totalInscriptions.toLocaleString()}
            icon={<Zap className="w-5 h-5 text-white" />}
            color="bg-pink-500"
          />
        </div>
      </div>

      {/* Estadísticas de Automatización */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🤖 Automatización</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Autoresponders Activos"
            value={analytics.totalAutoresponders}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-indigo-500"
          />
          <MetricCard
            title="Promedio Mensajes/Usuario"
            value={analytics.averageMessagesPerUser.toFixed(0)}
            icon={<BarChart3 className="w-5 h-5 text-white" />}
            color="bg-cyan-500"
          />
          <MetricCard
            title="Usuario Más Activo"
            value={analytics.mostActiveUser}
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            color="bg-emerald-500"
            subtitle="Por mensajes enviados"
          />
        </div>
      </div>
    </div>
  );
};

export default AppAnalytics;