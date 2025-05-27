
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
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  BarChart3,
  MessageSquare
} from 'lucide-react';

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

interface AIRecommendation {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
}

const AdvancedMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvancedMetrics();
  }, []);

  const loadAdvancedMetrics = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('calculate_advanced_metrics');

      if (error) {
        console.error('Error loading advanced metrics:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las métricas avanzadas",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const metric = data[0];
        setMetrics(metric);
        generateAIRecommendations(metric);
      }

    } catch (error) {
      console.error('Error in loadAdvancedMetrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = (metric: AdvancedMetrics) => {
    const recs: AIRecommendation[] = [];

    // Análisis de tasa de respuesta
    if (metric.response_rate_percentage < 10) {
      recs.push({
        type: 'danger',
        title: 'Tasa de Respuesta Baja',
        message: `Tu tasa de respuesta es del ${metric.response_rate_percentage.toFixed(1)}%, muy por debajo del 10% ideal. Esto indica que tus mensajes no están generando el interés esperado.`,
        action: 'Revisa el contenido de tus mensajes y considera personalizar más tu enfoque.'
      });
    } else if (metric.response_rate_percentage >= 10 && metric.response_rate_percentage < 15) {
      recs.push({
        type: 'warning',
        title: 'Tasa de Respuesta Aceptable',
        message: `Tu tasa de respuesta es del ${metric.response_rate_percentage.toFixed(1)}%, está en el rango aceptable pero se puede mejorar.`,
        action: 'Experimenta con diferentes horarios de envío y mensajes más atractivos.'
      });
    } else if (metric.response_rate_percentage >= 15) {
      recs.push({
        type: 'success',
        title: '¡Excelente Tasa de Respuesta!',
        message: `Tu tasa de respuesta es del ${metric.response_rate_percentage.toFixed(1)}%, ¡esto está por encima del promedio ideal!`,
        action: 'Mantén esta estrategia y considera escalar tu volumen de mensajes.'
      });
    }

    // Análisis de actividad diaria
    if (metric.today_messages === 0) {
      recs.push({
        type: 'warning',
        title: 'Sin Actividad Hoy',
        message: 'No has enviado mensajes hoy. La consistencia es clave para el éxito en prospección.',
        action: 'Establece una meta diaria de al menos 10-20 mensajes para mantener el momentum.'
      });
    } else if (metric.today_messages < 10) {
      recs.push({
        type: 'info',
        title: 'Actividad Baja Hoy',
        message: `Has enviado ${metric.today_messages} mensajes hoy. Considera aumentar tu volumen diario.`,
        action: 'Intenta enviar al menos 20 mensajes diarios para mejores resultados.'
      });
    } else if (metric.today_messages >= 20) {
      recs.push({
        type: 'success',
        title: '¡Gran Actividad Hoy!',
        message: `Has enviado ${metric.today_messages} mensajes hoy. ¡Excelente trabajo!`,
        action: 'Mantén esta consistencia para maximizar tus resultados.'
      });
    }

    // Análisis de conversión a invitaciones
    if (metric.messages_per_invitation > 10) {
      recs.push({
        type: 'warning',
        title: 'Eficiencia de Invitaciones Baja',
        message: `Necesitas ${metric.messages_per_invitation.toFixed(1)} mensajes para lograr 1 invitación. El ideal es menos de 8.`,
        action: 'Refina tu mensaje inicial para generar más interés y lograr invitaciones más rápido.'
      });
    }

    // Análisis de conversión a presentaciones
    if (metric.invitations_per_presentation > 4 && metric.total_invitations > 0) {
      recs.push({
        type: 'warning',
        title: 'Conversión de Invitación a Presentación',
        message: `Necesitas ${metric.invitations_per_presentation.toFixed(1)} invitaciones para lograr 1 presentación.`,
        action: 'Mejora tu seguimiento post-invitación y el valor percibido de tu presentación.'
      });
    }

    // Análisis de inscripciones
    if (metric.total_inscriptions === 0 && metric.total_presentations > 0) {
      recs.push({
        type: 'danger',
        title: 'Sin Inscripciones',
        message: 'Has hecho presentaciones pero no has logrado inscripciones.',
        action: 'Revisa tu propuesta de valor y considera ajustar tu oferta o presentación.'
      });
    }

    // Tiempo de respuesta
    if (metric.avg_response_time_seconds > 10) {
      recs.push({
        type: 'info',
        title: 'Tiempo de Respuesta',
        message: `Tu tiempo promedio de respuesta es ${metric.avg_response_time_seconds.toFixed(1)} segundos.`,
        action: 'Una respuesta más rápida puede mejorar la experiencia del prospecto.'
      });
    }

    setRecommendations(recs);
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Saber tus Números</h2>
          <p className="text-gray-600">Análisis detallado con recomendaciones de IA</p>
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

      {/* Métricas de Conversión */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Tener 1 Respuesta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="# de Mensajes para Tener 1 Respuesta"
            primary={metrics.messages_per_response}
            secondary="Meta: menos de 6"
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
            secondary="Meta: menos de 8"
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Para Tener 1 Presentación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="# de Mensajes para Tener 1 Presentación"
            primary={metrics.messages_per_presentation}
            icon={<MessageSquare className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="# de Invitaciones para Tener 1 Presentación"
            primary={metrics.invitations_per_presentation}
            secondary="Meta: menos de 3"
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
            secondary="Meta: menos de 2"
            icon={<Award className="w-5 h-5 text-white" />}
            color="bg-pink-600"
          />
        </div>
      </div>

      {/* Recomendaciones de IA */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Recomendaciones de Hower Assistant</h3>
        </div>
        
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border-l-4 ${
                rec.type === 'success' ? 'bg-green-50 border-green-500' :
                rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                rec.type === 'danger' ? 'bg-red-50 border-red-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {rec.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {rec.type === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                  {rec.type === 'danger' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                  {rec.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                  <p className="text-gray-600 mb-3">{rec.message}</p>
                  {rec.action && (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Lightbulb className="w-4 h-4" />
                      <span>{rec.action}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetrics;
