
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Award, 
  Zap, 
  RefreshCw,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface AdvancedMetrics {
  total_sent: number;
  total_responses: number;
  total_invitations: number;
  total_presentations: number;
  total_inscriptions: number;
  messages_per_response: number;
  messages_per_invitation: number;
  messages_per_presentation: number;
  invitations_per_presentation: number;
  messages_per_inscription: number;
  invitations_per_inscription: number;
  presentations_per_inscription: number;
  today_messages: number;
  response_rate_percentage: number;
  avg_response_time_seconds: number;
  last_message_date: string | null;
}

const AdvancedMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser?.instagram_user_id) {
      loadAdvancedMetrics();
    }
  }, [currentUser?.instagram_user_id]);

  const loadAdvancedMetrics = async () => {
    if (!currentUser?.instagram_user_id) {
      console.log('❌ No hay usuario actual para cargar métricas avanzadas');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Cargando métricas avanzadas para usuario:', currentUser.instagram_user_id);

      // Usar la función SQL que filtra por usuario específico
      const { data, error } = await supabase.rpc(
        'calculate_advanced_metrics_by_instagram_user',
        { user_instagram_id: currentUser.instagram_user_id }
      );

      if (error) {
        console.error('❌ Error loading advanced metrics:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las métricas avanzadas",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const metric = data[0];
        console.log('✅ Métricas avanzadas cargadas:', metric);
        setMetrics(metric);
      } else {
        console.log('⚠️ No hay métricas avanzadas para este usuario');
        setMetrics(null);
      }

    } catch (error) {
      console.error('💥 Error in loadAdvancedMetrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    primary: string | number;
    secondary?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, primary, secondary, icon, color }) => (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{primary}</p>
        {secondary && (
          <p className="text-sm text-gray-500">{secondary}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Saber tus Números</h2>
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/90 rounded-xl p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay datos suficientes</h3>
        <p className="text-gray-500">Envía algunos mensajes para ver tus métricas avanzadas</p>
        <p className="text-sm text-gray-400 mt-2">Usuario: @{currentUser?.username}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Saber tus Números</h2>
          <p className="text-gray-600">Análisis detallado de @{currentUser?.username}</p>
        </div>
        <button
          onClick={loadAdvancedMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Métricas Totales */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Totales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Mensajes Enviados en Total"
            primary={metrics.total_sent}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Respuestas en Total"
            primary={metrics.total_responses}
            secondary={`${metrics.response_rate_percentage.toFixed(1)}% tasa`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Invitaciones en Total"
            primary={metrics.total_invitations}
            icon={<Target className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Presentaciones en Total"
            primary={metrics.total_presentations}
            icon={<Award className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Inscripciones en Total"
            primary={metrics.total_inscriptions}
            icon={<Zap className="w-5 h-5 text-white" />}
            color="bg-pink-500"
          />
        </div>
      </div>

      {/* Métricas de Conversión Simplificadas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Tener 1 Respuesta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="# de Mensajes para Tener 1 Respuesta"
            primary={metrics.messages_per_response}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Lograr 1 Invitación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="# de Mensajes para Lograr 1 Invitación"
            primary={metrics.messages_per_invitation}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Tener 1 Presentación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="# de Mensajes para Tener 1 Presentación"
            primary={metrics.messages_per_presentation}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="# de Invitaciones para Tener 1 Presentación"
            primary={metrics.invitations_per_presentation}
            icon={<Target className="w-5 h-5 text-white" />}
            color="bg-purple-400"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Lograr 1 Inscripción</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="# de Mensajes para Lograr 1 Inscripción"
            primary={metrics.messages_per_inscription}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-pink-500"
          />
          <MetricCard
            title="# de Invitaciones para Lograr 1 Inscripción"
            primary={metrics.invitations_per_inscription}
            icon={<Target className="w-5 h-5 text-white" />}
            color="bg-pink-400"
          />
          <MetricCard
            title="# de Presentaciones para Lograr 1 Inscripción"
            primary={metrics.presentations_per_inscription}
            icon={<Award className="w-5 h-5 text-white" />}
            color="bg-pink-600"
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetrics;
