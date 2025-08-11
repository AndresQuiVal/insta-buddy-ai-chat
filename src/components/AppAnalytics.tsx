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
  CheckCircle,
  Settings,
  Bot,
  User
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RecentAutoresponder {
  id: string;
  name: string;
  type: 'general' | 'comment' | 'dm';
  created_at: string;
  updated_at: string;
  instagram_user_id?: string;
  user_id?: string;
  username?: string;
  is_active: boolean;
  keywords?: string[];
  message_preview?: string;
}

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

  // Autoresponders recientes
  recentAutoresponders: RecentAutoresponder[];
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

      // Obtener autoresponders recientes con información del usuario
      const { data: recentAutorespondersData, error: recentError } = await supabase
        .from('autoresponder_messages')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          is_active,
          keywords,
          message_text,
          instagram_user_id_ref
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Obtener autoresponders de comentarios
      const { data: commentAutoresponders, error: commentError } = await supabase
        .from('comment_autoresponders')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          is_active,
          keywords,
          dm_message,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Obtener autoresponders generales de comentarios
      const { data: generalAutoresponders, error: generalError } = await supabase
        .from('general_comment_autoresponders')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          is_active,
          keywords,
          dm_message,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Combinar todos los autoresponders y obtener información del usuario
      const allAutoresponders: RecentAutoresponder[] = [];

      // Procesar autoresponders de DM
      if (recentAutorespondersData) {
        for (const ar of recentAutorespondersData) {
          const user = instagramUsers?.find(u => u.instagram_user_id === ar.instagram_user_id_ref);
          allAutoresponders.push({
            id: ar.id,
            name: ar.name,
            type: 'dm',
            created_at: ar.created_at,
            updated_at: ar.updated_at,
            instagram_user_id: ar.instagram_user_id_ref,
            username: user?.username || 'Usuario desconocido',
            is_active: ar.is_active,
            keywords: ar.keywords,
            message_preview: ar.message_text?.substring(0, 100) + (ar.message_text?.length > 100 ? '...' : '')
          });
        }
      }

      // Procesar autoresponders de comentarios específicos
      if (commentAutoresponders) {
        for (const ar of commentAutoresponders) {
          const user = instagramUsers?.find(u => u.instagram_user_id === ar.user_id);
          allAutoresponders.push({
            id: ar.id,
            name: ar.name,
            type: 'comment',
            created_at: ar.created_at,
            updated_at: ar.updated_at,
            user_id: ar.user_id,
            username: user?.username || 'Usuario desconocido',
            is_active: ar.is_active,
            keywords: ar.keywords,
            message_preview: ar.dm_message?.substring(0, 100) + (ar.dm_message?.length > 100 ? '...' : '')
          });
        }
      }

      // Procesar autoresponders generales de comentarios
      if (generalAutoresponders) {
        for (const ar of generalAutoresponders) {
          const user = instagramUsers?.find(u => u.instagram_user_id === ar.user_id);
          allAutoresponders.push({
            id: ar.id,
            name: ar.name,
            type: 'general',
            created_at: ar.created_at,
            updated_at: ar.updated_at,
            user_id: ar.user_id,
            username: user?.username || 'Usuario desconocido',
            is_active: ar.is_active,
            keywords: ar.keywords,
            message_preview: ar.dm_message?.substring(0, 100) + (ar.dm_message?.length > 100 ? '...' : '')
          });
        }
      }

      // Ordenar todos los autoresponders por fecha de creación
      allAutoresponders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

      const totalAutoresponderCount = allAutoresponders.length;

      const analyticsData: AppAnalytics = {
        totalUsers: profilesData?.length || 0,
        activeUsers: instagramUsers?.filter(u => u.is_active).length || 0,
        todayUsers,
        weekUsers,
        monthUsers,
        totalMessagesSent: messagesSent,
        totalMessagesReceived: messagesReceived,
        totalAutoresponders: totalAutoresponderCount,
        totalProspects: prospects?.length || 0,
        globalResponseRate: responseRate,
        averageMessagesPerUser: averageMessagesPerUser,
        mostActiveUser: mostActive?.username || 'N/A',
        totalInvitations,
        totalPresentations,
        totalInscriptions,
        recentAutoresponders: allAutoresponders.slice(0, 15) // Mostrar los 15 más recientes
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

      {/* Usuarios Recientes que Configuraron Autoresponders */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🤖 Usuarios Recientes con Autoresponders</h3>
        <div className="space-y-4">
          {analytics.recentAutoresponders.length > 0 ? (
            analytics.recentAutoresponders.map((autoresponder) => (
              <Card key={autoresponder.id} className="p-4 bg-white/90 backdrop-blur-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      autoresponder.type === 'dm' ? 'bg-blue-500' :
                      autoresponder.type === 'comment' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {autoresponder.type === 'dm' ? <Send className="w-5 h-5 text-white" /> :
                       autoresponder.type === 'comment' ? <MessageSquare className="w-5 h-5 text-white" /> :
                       <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">@{autoresponder.username}</h4>
                      <p className="text-sm text-gray-600">{autoresponder.name}</p>
                      <p className="text-xs text-gray-500">
                        {autoresponder.type === 'dm' ? 'Autoresponder DM' :
                         autoresponder.type === 'comment' ? 'Autoresponder Comentarios' : 'Autoresponder General'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      autoresponder.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {autoresponder.is_active ? 'Activo' : 'Inactivo'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(autoresponder.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {autoresponder.keywords && autoresponder.keywords.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Palabras clave:</p>
                    <div className="flex flex-wrap gap-1">
                      {autoresponder.keywords.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                      {autoresponder.keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                          +{autoresponder.keywords.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {autoresponder.message_preview && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Vista previa del mensaje:</p>
                    <p className="text-sm text-gray-700 italic">"{autoresponder.message_preview}"</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center bg-white/90 backdrop-blur-lg">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay autoresponders configurados recientemente</p>
            </Card>
          )}
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