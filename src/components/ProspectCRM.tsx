import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  MessageCircle, 
  Calendar, 
  RefreshCw, 
  Star,
  Clock,
  User,
  Tag,
  Filter
} from 'lucide-react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectData {
  id: string;
  username: string;
  profile_picture_url?: string;
  status: 'enviados' | 'respuestas' | 'agendados';
  last_message_date: string;
  first_contact_date: string;
  last_message_from_prospect: boolean;
  autoresponder_name?: string;
  match_points?: number;
}

const ProspectCRM = () => {
  const [prospects, setProspects] = useState<ProspectData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'enviados' | 'respuestas' | 'agendados'>('all');
  const { currentUser } = useInstagramUsers();
  const { toast } = useToast();

  // Cargar prospectos
  const loadProspects = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔄 Cargando prospectos para CRM...');
      console.log('👤 Usuario actual:', currentUser.username);
      console.log('🆔 currentUser.id:', currentUser.id);

      const { data: prospects, error } = await supabase
        .from('prospects')
        .select(`
          id,
          username,
          profile_picture_url,
          status,
          last_message_date,
          first_contact_date,
          last_message_from_prospect,
          prospect_instagram_id
        `)
        .eq('instagram_user_id', currentUser.id)
        .order('last_message_date', { ascending: false });

      if (error) {
        console.error('❌ Error cargando prospectos:', error);
        throw error;
      }

      console.log('📊 Prospectos encontrados:', prospects?.length || 0);
      console.log('📋 Prospectos raw:', prospects);

      // Procesar prospectos y asignar a columnas
      const processedProspects: ProspectData[] = prospects?.map(prospect => {
        let status: 'enviados' | 'respuestas' | 'agendados' = 'enviados';
        
        // Lógica para determinar el estado
        if (prospect.status === 'agendado') {
          status = 'agendados';
        } else if (prospect.last_message_from_prospect) {
          status = 'respuestas';
        } else {
          status = 'enviados';
        }

        return {
          ...prospect,
          status,
          autoresponder_name: 'Autoresponder General', // TODO: Obtener nombre real del autoresponder
          match_points: Math.floor(Math.random() * 4) + 1 // TODO: Obtener match points reales
        };
      }) || [];

      setProspects(processedProspects);
      console.log('✅ Prospectos cargados:', processedProspects.length);

    } catch (error) {
      console.error('💥 Error cargando prospectos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, [currentUser]);

  // Filtrar prospectos por columna
  const getProspectsByStatus = (status: 'enviados' | 'respuestas' | 'agendados') => {
    return prospects.filter(prospect => prospect.status === status);
  };

  // Componente de tarjeta de prospecto
  const ProspectCard = ({ prospect }: { prospect: ProspectData }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={prospect.profile_picture_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              {prospect.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm truncate">@{prospect.username}</h4>
            </div>
            
            {prospect.autoresponder_name && (
              <Badge variant="secondary" className="text-xs mb-2">
                <Tag className="w-3 h-3 mr-1" />
                {prospect.autoresponder_name}
              </Badge>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {format(new Date(prospect.last_message_date), 'dd MMM, HH:mm', { locale: es })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Componente de columna
  const CRMColumn = ({ 
    title, 
    icon: Icon, 
    prospects, 
    color 
  }: { 
    title: string;
    icon: React.ElementType;
    prospects: ProspectData[];
    color: string;
  }) => (
    <Card className="h-full rounded-xl">
      <CardHeader className={`pb-3 ${color} rounded-t-xl`}>
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Icon className="w-5 h-5" />
          {title}
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
            {prospects.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100vh-250px)] overflow-y-auto">
        {prospects.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay prospectos en esta columna</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prospects.map((prospect) => (
              <ProspectCard key={prospect.id} prospect={prospect} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!currentUser) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No hay usuario de Instagram autenticado</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6" />
            CRM de Prospectos
          </h1>
          <p className="text-gray-600">
            {prospects.length} prospectos totales • @{currentUser.username}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProspects}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* CRM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <CRMColumn
          title="Enviados"
          icon={Send}
          prospects={getProspectsByStatus('enviados')}
          color="bg-gradient-to-r from-purple-400 to-purple-500"
        />
        
        <CRMColumn
          title="Respuestas"
          icon={MessageCircle}
          prospects={getProspectsByStatus('respuestas')}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        
        <CRMColumn
          title="Agendados"
          icon={Calendar}
          prospects={getProspectsByStatus('agendados')}
          color="bg-gradient-to-r from-purple-600 to-purple-700"
        />
      </div>
    </div>
  );
};

export default ProspectCRM;