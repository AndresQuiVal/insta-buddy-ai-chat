
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, TrendingUp, Clock, Database, AlertCircle } from 'lucide-react';

const InstagramDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    todayMessages: 0,
    uniqueUsers: 0,
    isLoading: true,
    error: null as string | null
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Get total messages count (with timeout)
      const { count: totalMessages, error: totalError } = await Promise.race([
        supabase
          .from('instagram_messages')
          .select('*', { count: 'exact', head: true }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (totalError) throw totalError;

      // Get today's messages
      const today = new Date().toISOString().split('T')[0];
      const { count: todayMessages, error: todayError } = await Promise.race([
        supabase
          .from('instagram_messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (todayError) throw todayError;

      // Get unique users (simplified query)
      const { data: users, error: usersError } = await Promise.race([
        supabase
          .from('instagram_messages')
          .select('sender_id')
          .neq('sender_id', 'hower_bot')
          .neq('sender_id', 'diagnostic_user')
          .limit(1000), // Limit to avoid large queries
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (usersError) throw usersError;

      const uniqueUsers = new Set(users?.map(u => u.sender_id) || []).size;

      setStats({
        totalMessages: totalMessages || 0,
        todayMessages: todayMessages || 0,
        uniqueUsers,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error.message === 'Timeout' ? 'Timeout de conexión' : 'Error cargando estadísticas'
      }));
    }
  };

  if (stats.error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-medium">Error en el Dashboard</h3>
                <p className="text-sm text-gray-600">{stats.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? '...' : stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los mensajes procesados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? '...' : stats.todayMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensajes de hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? '...' : stats.uniqueUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.isLoading ? '...' : 'Activo'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema funcionando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conexiones</CardTitle>
            <CardDescription>Estado actual de las integraciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base de Datos</span>
              <span className="text-sm text-green-600">● Conectada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Webhook Instagram</span>
              <span className="text-sm text-green-600">● Activo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Instagram</span>
              <span className="text-sm text-yellow-600">⚠ Verificar en sección Token</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
            <CardDescription>Detalles técnicos del asistente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <strong>Webhook URL:</strong>
              <br />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook
              </code>
            </div>
            <div className="text-sm">
              <strong>Última actualización:</strong>
              <br />
              {new Date().toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstagramDashboard;
