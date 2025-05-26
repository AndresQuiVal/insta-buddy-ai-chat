
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Send,
  Inbox,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalMessages: number;
  totalConversations: number;
  messagesReceived: number;
  messagesSent: number;
  averageResponseTime: number;
  todayMessages: number;
}

const InstagramDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    totalConversations: 0,
    messagesReceived: 0,
    messagesSent: 0,
    averageResponseTime: 0,
    todayMessages: 0
  });
  const [loading, setLoading] = useState(true);

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

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Total messages
      const { count: totalMessages } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact', head: true });

      // Messages by type
      const { data: messagesByType } = await supabase
        .from('instagram_messages')
        .select('message_type');

      const messagesReceived = messagesByType?.filter(m => m.message_type === 'received').length || 0;
      const messagesSent = messagesByType?.filter(m => m.message_type === 'sent').length || 0;

      // Unique conversations (unique sender_ids)
      const { data: uniqueSenders } = await supabase
        .from('instagram_messages')
        .select('sender_id')
        .not('sender_id', 'eq', 'me');

      const uniqueSendersSet = new Set(uniqueSenders?.map(m => m.sender_id) || []);
      const totalConversations = uniqueSendersSet.size;

      // Today's messages
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
        averageResponseTime: 2.5, // Placeholder - could calculate from actual data
        todayMessages: todayMessages || 0
      });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <button
          onClick={loadDashboardStats}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total de Mensajes"
          value={stats.totalMessages}
          icon={<MessageCircle className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-blue-500 to-purple-500"
          subtitle="Todos los mensajes procesados"
        />

        <StatCard
          title="Conversaciones Activas"
          value={stats.totalConversations}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-green-500 to-teal-500"
          subtitle="Usuarios únicos"
        />

        <StatCard
          title="Mensajes Hoy"
          value={stats.todayMessages}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-orange-500 to-red-500"
          subtitle="En las últimas 24h"
        />

        <StatCard
          title="Mensajes Recibidos"
          value={stats.messagesReceived}
          icon={<Inbox className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-cyan-500 to-blue-500"
          subtitle="De usuarios"
        />

        <StatCard
          title="Respuestas Enviadas"
          value={stats.messagesSent}
          icon={<Send className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-purple-500 to-pink-500"
          subtitle="Automáticas y manuales"
        />

        <StatCard
          title="Tiempo de Respuesta"
          value={`${stats.averageResponseTime}s`}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-indigo-500 to-purple-500"
          subtitle="Promedio"
        />
      </div>

      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6" style={{ display: 'none' }}>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Resumen de Actividad</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Distribución de Mensajes</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recibidos</span>
                <span className="text-sm font-medium text-gray-800">{stats.messagesReceived}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.totalMessages > 0 ? (stats.messagesReceived / stats.totalMessages) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Enviados</span>
                <span className="text-sm font-medium text-gray-800">{stats.messagesSent}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.totalMessages > 0 ? (stats.messagesSent / stats.totalMessages) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Estado del Sistema</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Webhook activo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">ChatGPT conectado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Base de datos sincronizada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramDashboard;
