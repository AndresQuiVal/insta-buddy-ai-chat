import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { disconnectInstagram } from '@/services/instagramService';
import RecommendationsCarousel from './RecommendationsCarousel';
import MetricTooltip from './MetricTooltip';
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
  ArrowLeft,
  UserPlus
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
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface DashboardStats {
  totalMessages: number;
  totalConversations: number;
  messagesReceived: number;
  messagesSent: number;
  averageResponseTime: number;
  todayMessages: number;
  totalInvitations: number;
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
  const [idealTraits, setIdealTraits] = useState<{trait: string, enabled: boolean}[]>([]);

  const timeFilterOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'all', label: 'Todo el Tiempo' }
  ];

  const { isAnalyzing, analyzeAll, loadIdealTraits } = useAITraitAnalysis();
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser?.instagram_user_id) {
      loadDashboardStats();
    }

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'instagram_messages'
      }, () => {
        if (currentUser?.instagram_user_id) {
          loadDashboardStats();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [timeFilter, currentUser?.instagram_user_id]);

  useEffect(() => {
    const traits = loadIdealTraits();
    setIdealTraits(traits);
    console.log("📋 Características cargadas en Dashboard:", traits);
  }, [loadIdealTraits]);

  const handleLogout = () => {
    disconnectInstagram();
    window.location.reload();
  };

  const handleAnalyzeAll = async () => {
    console.log("🔍 Iniciando análisis completo con IA...");
    
    try {
      await analyzeAll();
      
      toast({
        title: "🤖 ¡Análisis completado!",
        description: "Todas las conversaciones han sido analizadas con IA",
      });
      
      // Recargar estadísticas después del análisis
      await loadDashboardStats();
      
    } catch (error) {
      console.error("Error en análisis:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al analizar las conversaciones",
        variant: "destructive"
      });
    }
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

    // Análisis de conversión
    if (stats.totalInvitations === 0 && stats.messagesSent > 0) {
      recs.push({
        type: 'warning',
        title: 'Sin Invitaciones',
        message: 'Has enviado mensajes pero no has logrado invitaciones.',
        action: 'Enfócate en generar más interés antes de hacer la invitación formal.'
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

  // Función para calcular respuestas únicas
  const calculateUniqueResponses = (messages: any[]) => {
    // Agrupar mensajes por sender_id (prospecto)
    const messagesByProspect = messages.reduce((acc, message) => {
      if (message.message_type === 'received') {
        if (!acc[message.sender_id]) {
          acc[message.sender_id] = [];
        }
        acc[message.sender_id].push(message);
      }
      return acc;
    }, {} as Record<string, any[]>);

    let uniqueResponses = 0;

    // Para cada prospecto, contar respuestas únicas
    Object.values(messagesByProspect).forEach((prospectMessages: any[]) => {
      // Ordenar mensajes por timestamp
      const sortedMessages = prospectMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // La primera respuesta siempre cuenta
      if (sortedMessages.length > 0) {
        uniqueResponses++;
      }

      // Verificar gaps de 5+ horas entre respuestas
      for (let i = 1; i < sortedMessages.length; i++) {
        const currentTime = new Date(sortedMessages[i].timestamp).getTime();
        const previousTime = new Date(sortedMessages[i - 1].timestamp).getTime();
        const timeDiff = (currentTime - previousTime) / (1000 * 60 * 60); // diferencia en horas

        if (timeDiff >= 5) {
          uniqueResponses++;
        }
      }
    });

    return uniqueResponses;
  };

  // Función para calcular tiempo promedio de respuesta real
  const calculateAverageResponseTime = (messages: any[]) => {
    const responseTimes: number[] = [];
    
    // Agrupar mensajes por sender_id (prospecto)
    const messagesByProspect = messages.reduce((acc, message) => {
      if (!acc[message.sender_id]) {
        acc[message.sender_id] = [];
      }
      acc[message.sender_id].push(message);
      return acc;
    }, {} as Record<string, any[]>);

    // Para cada prospecto, calcular tiempos de respuesta
    Object.values(messagesByProspect).forEach((prospectMessages: any[]) => {
      const sortedMessages = prospectMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 1; i < sortedMessages.length; i++) {
        const currentMsg = sortedMessages[i];
        const previousMsg = sortedMessages[i - 1];

        // Si el mensaje actual es una respuesta (received) y el anterior fue enviado (sent)
        if (currentMsg.message_type === 'received' && previousMsg.message_type === 'sent') {
          const responseTime = new Date(currentMsg.timestamp).getTime() - new Date(previousMsg.timestamp).getTime();
          const responseTimeInSeconds = responseTime / 1000;
          responseTimes.push(responseTimeInSeconds);
        }
      }
    });

    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  };

  // Función para formatear tiempo de respuesta
  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else if (seconds < 86400) {
      return `${Math.round(seconds / 3600)}h`;
    } else {
      return `${Math.round(seconds / 86400)}d`;
    }
  };

  const loadDashboardStats = async () => {
    if (!currentUser?.instagram_user_id) {
      console.log('❌ No hay usuario actual para cargar métricas');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Cargando métricas para usuario:', currentUser.instagram_user_id);

      // Usar la nueva función SQL que filtra por usuario específico
      const { data: metricsData, error: metricsError } = await supabase.rpc(
        'calculate_advanced_metrics_by_instagram_user',
        { user_instagram_id: currentUser.instagram_user_id }
      );

      if (metricsError) {
        console.error('❌ Error cargando métricas:', metricsError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las métricas",
          variant: "destructive"
        });
        return;
      }

      if (metricsData && metricsData.length > 0) {
        const metrics = metricsData[0];
        console.log('✅ Métricas cargadas para usuario:', metrics);

        const dashboardStats = {
          totalMessages: metrics.total_sent + metrics.total_responses,
          totalConversations: 0,
          messagesReceived: metrics.total_responses,
          messagesSent: metrics.total_sent,
          averageResponseTime: metrics.avg_response_time_seconds,
          todayMessages: currentUser.nuevos_prospectos_contactados || 0, // Usar valor del usuario
          totalInvitations: metrics.total_invitations,
          responseRate: metrics.response_rate_percentage,
          lastMessageDate: metrics.last_message_date
        };

        setStats(dashboardStats);
        generateAIRecommendations(dashboardStats);
      } else {
        console.log('⚠️ No hay métricas para este usuario');
        // Mantener valores por defecto si no hay datos
        setStats(prev => ({
          ...prev,
          todayMessages: currentUser.nuevos_prospectos_contactados || 0
        }));
      }

    } catch (error) {
      console.error('💥 Error en loadDashboardStats:', error);
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
    tooltip?: {
      title: string;
      description: string;
      examples?: string[];
    };
  }> = ({ title, value, icon, color, tooltip }) => {
    const cardContent = (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </div>
    );

    if (tooltip) {
      return (
        <MetricTooltip
          title={tooltip.title}
          description={tooltip.description}
          examples={tooltip.examples}
        >
          {cardContent}
        </MetricTooltip>
      );
    }

    return cardContent;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Instagram</h2>
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Instagram</h2>
          <p className="text-sm text-gray-600">Métricas específicas de @{currentUser?.username}</p>
        </div>
        
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Nuevos prospectos contactados"
          value={stats.todayMessages}
          icon={<UserPlus className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-blue-500 to-purple-500"
          tooltip={{
            title: "Nuevos prospectos contactados (manual)",
            description: "Número de personas nuevas contactadas. Este valor se actualiza manualmente y no se incrementa automáticamente.",
            examples: [
              "Se actualiza solo cuando lo hagas manualmente",
              "No se incrementa automáticamente al enviar mensajes",
              "Representa tu actividad de prospección manual"
            ]
          }}
        />

        <StatCard
          title="Respuestas Recibidas"
          value={stats.messagesReceived}
          icon={<Inbox className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-green-500 to-teal-500"
          tooltip={{
            title: "Respuestas recibidas únicas",
            description: "Número de prospectos que han respondido a tus mensajes. Solo cuenta la primera respuesta de cada persona o respuestas después de 5+ horas de silencio.",
            examples: [
              "Prospecto responde por primera vez = +1",
              "Prospecto responde después de 5+ horas = +1", 
              "Respuestas inmediatas en conversación = no cuenta"
            ]
          }}
        />

        <StatCard
          title="Invitaciones"
          value={stats.totalInvitations}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-orange-500 to-red-500"
          tooltip={{
            title: "Enlaces de reunión enviados",
            description: "Número de veces que has enviado enlaces de Zoom, Google Meet u otras plataformas de videollamada a tus prospectos.",
            examples: [
              "Links de Zoom: zoom.us/j/123456",
              "Links de Google Meet: meet.google.com/abc-def",
              "Links de Teams, Skype, etc."
            ]
          }}
        />

        <StatCard
          title="Tiempo de Respuesta"
          value={formatResponseTime(stats.averageResponseTime)}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-gradient-to-r from-pink-500 to-rose-500"
          tooltip={{
            title: "Tiempo promedio de respuesta",
            description: "Tiempo promedio que tardan tus prospectos en responderte desde que envías un mensaje. Un tiempo menor indica mayor interés.",
            examples: [
              "Menos de 1 hora = muy interesado",
              "1-24 horas = interés moderado",
              "Más de 24 horas = interés bajo"
            ]
          }}
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
