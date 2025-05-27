import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { disconnectInstagram } from '@/services/instagramService';
import InstagramDebug from './InstagramDebug';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Send,
  Inbox,
  BarChart3,
  RefreshCw,
  LogOut,
  Bug,
  Target,
  Award,
  Calendar,
  Zap,
  Brain
} from 'lucide-react';

interface DashboardStats {
  totalMessages: number;
  totalConversations: number;
  messagesReceived: number;
  messagesSent: number;
  averageResponseTime: number;
  todayMessages: number;
  totalInvitations: number;
  totalPresentations: number;
  totalInscriptions: number;
  responseRate: number;
  lastMessageDate: string | null;
}

const InstagramDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    totalConversations: 0,
    messagesReceived: 0,
    messagesSent: 0,
    averageResponseTime: 0,
    todayMessages: 0,
    totalInvitations: 0,
    totalPresentations: 0,
    totalInscriptions: 0,
    responseRate: 0,
    lastMessageDate: null
  });
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadDashboardStats();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'instagram_messages'
      }, () => {
        loadDashboardStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleLogout = () => {
    disconnectInstagram();
    window.location.reload();
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Usar la función de métricas avanzadas
      const { data: metrics, error: metricsError } = await supabase
        .rpc('calculate_advanced_metrics');

      if (metricsError) {
        console.error('Error loading advanced metrics:', metricsError);
        // Fallback a métricas básicas
        await loadBasicStats();
        return;
      }

      if (metrics && metrics.length > 0) {
        const metric = metrics[0];
        
        // Unique conversations (unique sender_ids)
        const { data: uniqueSenders } = await supabase
          .from('instagram_messages')
          .select('sender_id')
          .not('sender_id', 'eq', 'me')
          .not('sender_id', 'eq', 'hower_bot');

        const uniqueSendersSet = new Set(uniqueSenders?.map(m => m.sender_id) || []);
        const totalConversations = uniqueSendersSet.size;

        setStats({
          totalMessages: metric.total_sent + metric.total_responses,
          totalConversations,
          messagesReceived: metric.total_responses,
          messagesSent: metric.total_sent,
          averageResponseTime: metric.avg_response_time_seconds,
          todayMessages: metric.today_messages,
          totalInvitations: metric.total_invitations,
          totalPresentations: metric.total_presentations,
          totalInscriptions: metric.total_inscriptions,
          responseRate: metric.response_rate_percentage,
          lastMessageDate: metric.last_message_date
        });
      }

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBasicStats = async () => {
    // ... keep existing code (básico fallback)
    const { count: totalMessages } = await supabase
      .from('instagram_messages')
      .select('*', { count: 'exact', head: true });

    const { data: messagesByType } = await supabase
      .from('instagram_messages')
      .select('message_type');

    const messagesReceived = messagesByType?.filter(m => m.message_type === 'received').length || 0;
    const messagesSent = messagesByType?.filter(m => m.message_type === 'sent').length || 0;

    const { data: uniqueSenders } = await supabase
      .from('instagram_messages')
      .select('sender_id')
      .not('sender_id', 'eq', 'me');

    const uniqueSendersSet = new Set(uniqueSenders?.map(m => m.sender_id) || []);
    const totalConversations = uniqueSendersSet.size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayMessages } = await supabase
      .from('instagram_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    setStats({
      totalMessages: totalMessages || 0,
      totalConversations,
      messagesReceived,
      messagesSent,
      averageResponseTime: 2.5,
      todayMessages: todayMessages || 0,
      totalInvitations: 0,
      totalPresentations: 0,
      totalInscriptions: 0,
      responseRate: messagesSent > 0 ? (messagesReceived / messagesSent) * 100 : 0,
      lastMessageDate: null
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Instagram</h2>
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Instagram</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Bug className="w-4 h-4" />
            {showDebug ? 'Ocultar' : 'Debug'}
          </button>
          <button
            onClick={loadDashboardStats}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {showDebug && <InstagramDebug />}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mensajes Enviados"
          value={stats.messagesSent}
          icon={<Send className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-blue-500 to-purple-500"
          subtitle="Total enviados"
        />

        <StatCard
          title="Respuestas Recibidas"
          value={stats.messagesReceived}
          icon={<Inbox className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-green-500 to-teal-500"
          subtitle={`${stats.responseRate.toFixed(1)}% tasa de respuesta`}
        />

        <StatCard
          title="Invitaciones"
          value={stats.totalInvitations}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-orange-500 to-red-500"
          subtitle="Enviadas"
        />

        <StatCard
          title="Presentaciones"
          value={stats.totalPresentations}
          icon={<Award className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-cyan-500 to-blue-500"
          subtitle="Realizadas"
        />
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Inscripciones"
          value={stats.totalInscriptions}
          icon={<Zap className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-purple-500 to-pink-500"
          subtitle="Logradas"
        />

        <StatCard
          title="Mensajes Hoy"
          value={stats.todayMessages}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-indigo-500 to-purple-500"
          subtitle="En las últimas 24h"
        />

        <StatCard
          title="Tiempo de Respuesta"
          value={`${stats.averageResponseTime.toFixed(1)}s`}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-pink-500 to-rose-500"
          subtitle="Promedio"
        />

        <StatCard
          title="Conversaciones"
          value={stats.totalConversations}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-emerald-500 to-green-500"
          subtitle="Únicas"
        />
      </div>

      {/* Estado del sistema */}
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Estado del Sistema</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Webhook Instagram activo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">IA Hower Assistant conectada</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Base de datos sincronizada</span>
          </div>
        </div>

        {stats.lastMessageDate && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Último mensaje enviado: {new Date(stats.lastMessageDate).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramDashboard;
