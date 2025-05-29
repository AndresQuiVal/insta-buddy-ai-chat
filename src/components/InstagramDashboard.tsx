import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { disconnectInstagram } from '@/services/instagramService';
import RecommendationsCarousel from './RecommendationsCarousel';
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
  Brain,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdvancedMetrics from './AdvancedMetrics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface AIRecommendation {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface InstagramDashboardProps {
  onShowAnalysis?: () => void;
}

const InstagramDashboard: React.FC<InstagramDashboardProps> = ({ onShowAnalysis }) => {
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
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const timeFilterOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'all', label: 'Todo el Tiempo' }
  ];

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
  }, [timeFilter]);

  const handleLogout = () => {
    disconnectInstagram();
    window.location.reload();
  };

  const generateAIRecommendations = (stats: DashboardStats) => {
    const recs: AIRecommendation[] = [];

    // Análisis de tasa de respuesta
    if (stats.responseRate < 10) {
      recs.push({
        type: 'danger',
        title: 'Tasa de Respuesta Baja',
        message: `Tu tasa de respuesta es del ${stats.responseRate.toFixed(1)}%, muy por debajo del 10% ideal. Esto indica que tus mensajes no están generando el interés esperado.`,
        action: 'Revisa el contenido de tus mensajes y considera personalizar más tu enfoque.'
      });
    } else if (stats.responseRate >= 10 && stats.responseRate < 15) {
      recs.push({
        type: 'warning',
        title: 'Tasa de Respuesta Aceptable',
        message: `Tu tasa de respuesta es del ${stats.responseRate.toFixed(1)}%, está en el rango aceptable pero se puede mejorar.`,
        action: 'Experimenta con diferentes horarios de envío y mensajes más atractivos.'
      });
    } else if (stats.responseRate >= 15) {
      recs.push({
        type: 'success',
        title: '¡Excelente Tasa de Respuesta!',
        message: `Tu tasa de respuesta es del ${stats.responseRate.toFixed(1)}%, ¡esto está por encima del promedio ideal!`,
        action: 'Mantén esta estrategia y considera escalar tu volumen de mensajes.'
      });
    }

    // Análisis de actividad diaria
    if (stats.todayMessages === 0) {
      recs.push({
        type: 'warning',
        title: 'Sin Actividad Hoy',
        message: 'No has enviado mensajes hoy. La consistencia es clave para el éxito en prospección.',
        action: 'Establece una meta diaria de al menos 10-20 mensajes para mantener el momentum.'
      });
    } else if (stats.todayMessages < 10) {
      recs.push({
        type: 'info',
        title: 'Actividad Baja Hoy',
        message: `Has enviado ${stats.todayMessages} mensajes hoy. Considera aumentar tu volumen diario.`,
        action: 'Intenta enviar al menos 20 mensajes diarios para mejores resultados.'
      });
    } else if (stats.todayMessages >= 20) {
      recs.push({
        type: 'success',
        title: '¡Gran Actividad Hoy!',
        message: `Has enviado ${stats.todayMessages} mensajes hoy. ¡Excelente trabajo!`,
        action: 'Mantén esta consistencia para maximizar tus resultados.'
      });
    }

    // Análisis de conversión
    if (stats.totalInvitations === 0 && stats.messagesSent > 0) {
      recs.push({
        type: 'warning',
        title: 'Sin Invitaciones',
        message: 'Has enviado mensajes pero no has logrado invitaciones.',
        action: 'Enfócate en generar más interés antes de hacer la invitación formal.'
      });
    }

    if (stats.totalInscriptions === 0 && stats.totalPresentations > 0) {
      recs.push({
        type: 'danger',
        title: 'Sin Inscripciones',
        message: 'Has hecho presentaciones pero no has logrado inscripciones.',
        action: 'Revisa tu propuesta de valor y considera ajustar tu oferta o presentación.'
      });
    }

    setRecommendations(recs);
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString();
      default:
        return null;
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Construir query base
      let messagesQuery = supabase.from('instagram_messages').select('*');
      
      if (dateFilter) {
        messagesQuery = messagesQuery.gte('created_at', dateFilter);
      }

      const { data: messages, error } = await messagesQuery;

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Calcular estadísticas filtradas
      const messagesSent = messages?.filter(m => m.message_type === 'sent').length || 0;
      const messagesReceived = messages?.filter(m => m.message_type === 'received').length || 0;
      const totalInvitations = messages?.filter(m => m.is_invitation).length || 0;
      const totalPresentations = messages?.filter(m => m.is_presentation).length || 0;
      const totalInscriptions = messages?.filter(m => m.is_inscription).length || 0;

      // Mensajes de hoy (siempre calculado para el día actual)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayData } = await supabase
        .from('instagram_messages')
        .select('*')
        .eq('message_type', 'sent')
        .gte('created_at', today.toISOString());

      const todayMessages = todayData?.length || 0;

      // Calcular tiempo promedio de respuesta
      const responseTimes = messages?.filter(m => m.response_time_seconds).map(m => m.response_time_seconds) || [];
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      // Calcular tasa de respuesta
      const responseRate = messagesSent > 0 ? (messagesReceived / messagesSent) * 100 : 0;

      // Fecha del último mensaje
      const lastMessage = messages?.filter(m => m.message_type === 'sent')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const dashboardStats = {
        totalMessages: messagesSent + messagesReceived,
        totalConversations: 0, // No se muestra en el dashboard
        messagesReceived,
        messagesSent,
        averageResponseTime,
        todayMessages,
        totalInvitations,
        totalPresentations,
        totalInscriptions,
        responseRate,
        lastMessageDate: lastMessage?.created_at || null
      };

      setStats(dashboardStats);
      generateAIRecommendations(dashboardStats);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {/* Filtro de tiempo */}
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {timeFilterOptions.find(opt => opt.value === timeFilter)?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTimeDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeFilter(option.value as TimeFilter);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                      timeFilter === option.value ? 'bg-purple-50 text-purple-600' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={loadDashboardStats}
            className="p-2 bg-transparent hover:bg-purple-100 rounded-full text-purple-500 border border-transparent hover:border-purple-200 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Mensajes Hoy"
          value={stats.todayMessages}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-blue-500 to-purple-500"
          subtitle="En las últimas 24h"
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

        <StatCard
          title="Inscripciones"
          value={stats.totalInscriptions}
          icon={<Zap className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-purple-500 to-pink-500"
          subtitle="Logradas"
        />

        <StatCard
          title="Tiempo de Respuesta"
          value={`${stats.averageResponseTime.toFixed(1)}s`}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-pink-500 to-rose-500"
          subtitle="Promedio"
        />
      </div>

      {/* Recomendaciones de Hower Assistant en Carousel */}
      <div className="mt-8">
        <button
          className="flex items-center gap-2 text-purple-600 font-semibold focus:outline-none hover:underline"
          onClick={() => setShowRecommendations(!showRecommendations)}
        >
          <Lightbulb className="w-5 h-5" />
          {showRecommendations ? 'Ocultar Recomendaciones' : 'Ver Recomendaciones de Hower Assistant'}
        </button>
        {showRecommendations && (
          <div className="mt-4">
            <RecommendationsCarousel recommendations={recommendations} />
          </div>
        )}
      </div>

      {/* Botón de Análisis Detallado */}
      <div className="mt-8">
        <Button 
          onClick={onShowAnalysis}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          <Brain className="w-4 h-4 mr-2" />
          Análisis detallado
        </Button>
      </div>

      {/* Modal de Análisis Detallado */}
      {showMetrics && (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              onClick={() => setShowMetrics(false)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
              variant="ghost"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Análisis Detallado</h1>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <AdvancedMetrics />
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardDebugPanel: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
        >
          <Bug className="w-5 h-5 text-orange-500" />
        </button>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-600">
          <Bug className="w-5 h-5" /> Debug
        </h3>
        <div className="text-sm text-gray-700">
          <p>Panel de diagnóstico y depuración del sistema.</p>
        </div>
      </div>
    </div>
  );
};

export default InstagramDashboard;
