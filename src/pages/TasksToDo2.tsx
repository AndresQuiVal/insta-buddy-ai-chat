import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BarChart3, LogOut, Clock, Lightbulb, Rocket } from 'lucide-react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useProspects } from '@/hooks/useProspects';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProspectData {
  id: string;
  username: string;
  state: 'pending' | 'yesterday' | 'week' | 'invited';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  source: 'dm' | 'comment' | 'hower' | 'ads';
  daysSinceLastSent?: number;
  conversationMessages: any[];
}

const TasksToDo2: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const { prospects: realProspects, loading: prospectsLoading } = useProspects(currentUser?.instagram_user_id);

  const [expandedDailyTip, setExpandedDailyTip] = useState(false);

  // Función para abrir Instagram directamente
  const handleProspectClick = (username: string) => {
    window.open(`https://www.instagram.com/${username}`, '_blank');
  };

  // Clasificación de prospectos usando la estructura real
  const prospectsClassification = useMemo(() => {
    if (!realProspects || realProspects.length === 0) {
      return {
        pending: [],
        yesterday: [],
        week: [],
        newProspects: []
      };
    }

    const pending = realProspects.filter(p => p.state === 'pending');
    const yesterday = realProspects.filter(p => p.state === 'yesterday');
    const week = realProspects.filter(p => p.state === 'week');
    
    // Nuevos prospectos son los que tienen menos de 24 horas desde el último mensaje
    const now = new Date();
    const yesterday24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const newProspects = realProspects.filter(p => 
      new Date(p.lastMessageTime) >= yesterday24h
    );

    return {
      pending,
      yesterday,
      week,
      newProspects
    };
  }, [realProspects]);

  const ProspectCard = ({ prospect }: { prospect: ProspectData }) => {
    return (
      <div 
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => handleProspectClick(prospect.username)}
      >
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prospect.username}`} />
            <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
              {prospect.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
              @{prospect.username}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {prospect.lastMessageTime 
                ? `Último mensaje: ${new Date(prospect.lastMessageTime).toLocaleDateString()}`
                : 'Sin mensajes'
              }
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    );
  };

  // Pantalla de carga
  if (userLoading || prospectsLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando tus prospectos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              Acceso requerido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Para acceder necesitas autenticarte con Hower
            </p>
            <Button 
              onClick={() => navigate('/hower-auth')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPending = prospectsClassification.pending.length;
  const totalFollowUp = prospectsClassification.yesterday.length + prospectsClassification.week.length;
  const totalNew = prospectsClassification.newProspects.length;

  return (
    <div className="min-h-screen bg-primary">
      {/* Encabezado */}
      <div className="bg-primary px-4 py-6">
        <div className="max-w-md mx-auto text-center">
          <Button 
            onClick={() => navigate('/analytics')}
            className="bg-primary/80 hover:bg-primary/70 text-white font-medium px-6 py-3 rounded-xl shadow-lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            🚀 Mis números
          </Button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-md mx-auto px-4 pb-8">
        {/* Título Principal */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Mi Lista de Prospectos
          </h1>
          <p className="text-white/80 text-sm">
            La fortuna favorece a quienes se atreven a contactar.
          </p>
        </div>

        {/* Mensaje de Duración */}
        <div className="bg-orange-100 border-2 border-orange-400 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center">
            <Clock className="w-5 h-5 text-black mr-2" />
            <span className="font-bold text-black">
              ⏱ Te demorarás: 1 minuto (Como servirse un café ☕)
            </span>
          </div>
        </div>

        {/* Secciones de Prospectos */}
        <div className="space-y-4 mb-6">
          {/* Prospectos Pendientes */}
          <Card className="bg-white rounded-2xl shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Prospectos pendientes
                </CardTitle>
                {totalPending > 0 && (
                  <Badge className="bg-primary text-white font-bold px-3 py-1 rounded-full">
                    {totalPending}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalPending === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">¡Excelente! No hay prospectos pendientes.</p>
                </div>
              ) : (
                prospectsClassification.pending
                  .slice(0, 5)
                  .map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} />
                  ))
              )}
            </CardContent>
          </Card>

          {/* Prospectos en Seguimiento */}
          <Card className="bg-white rounded-2xl shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Prospectos en seguimiento
                </CardTitle>
                {totalFollowUp > 0 && (
                  <Badge className="bg-primary text-white font-bold px-3 py-1 rounded-full">
                    {totalFollowUp}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalFollowUp === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">¡Excelente! No hay seguimientos pendientes.</p>
                </div>
              ) : (
                [...prospectsClassification.yesterday, ...prospectsClassification.week]
                  .slice(0, 5)
                  .map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} />
                  ))
              )}
            </CardContent>
          </Card>

          {/* Nuevos Prospectos */}
          <Card className="bg-white rounded-2xl shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Nuevos prospectos
                </CardTitle>
                {totalNew > 0 && (
                  <Badge className="bg-primary text-white font-bold px-3 py-1 rounded-full">
                    {totalNew}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalNew === 0 ? (
                <div className="text-center py-8">
                  <Button 
                    onClick={() => navigate('/hower-prospector')}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    🔍 Buscar nuevos prospectos
                  </Button>
                </div>
              ) : (
                prospectsClassification.newProspects
                  .slice(0, 5)
                  .map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} />
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tip Pro del Día */}
        <Card className="bg-white rounded-2xl shadow-lg border-2 border-primary mb-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setExpandedDailyTip(!expandedDailyTip)}
          >
            <div className="flex items-center">
              <div className="bg-primary rounded-full p-2 mr-3">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Tip Pro del Día
              </CardTitle>
            </div>
          </CardHeader>
          {expandedDailyTip && (
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Para cada prospecto, dedica 30 segundos a interactuar con sus posts antes de enviar mensajes. 
                Un like + comentario genuino puede triplicar tu tasa de respuesta. ¡La interacción es la clave del éxito!
              </p>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/settings')}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl"
          >
            Otras opciones
          </Button>
          <Button 
            onClick={() => navigate('/hower-auth')}
            variant="outline"
            className="w-full border-2 border-gray-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TasksToDo2;