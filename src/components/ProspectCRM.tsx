import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  MessageCircle, 
  Calendar, 
  RefreshCw, 
  Star,
  Clock,
  User,
  Tag,
  Filter,
  X,
  Edit2,
  Check
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
  const [selectedProspect, setSelectedProspect] = useState<ProspectData | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [listName, setListName] = useState('Mi Lista de prospección');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [tempListName, setTempListName] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const { currentUser } = useInstagramUsers();
  const { toast } = useToast();

  // Frases motivacionales
  const motivationalQuotes = [
    "Cada 'no' te acerca más a un 'sí'. ¡Sigue prospectando!",
    "El éxito está en el otro lado de tu zona de confort.",
    "Hoy es el día perfecto para conquistar nuevos clientes.",
    "Tu próximo gran cliente está esperando tu mensaje.",
    "La constancia en la prospección es la clave del éxito.",
    "Cada contacto es una oportunidad de oro.",
    "Los vendedores exitosos nunca dejan de prospectar.",
    "Tu futuro se construye con cada prospecto contactado.",
    "La fortuna favorece a quienes se atreven a contactar.",
    "El mejor momento para prospectar es ahora."
  ];

  // Cargar nombre de lista y generar frase motivacional
  useEffect(() => {
    if (currentUser) {
      loadListName();
    }
    // Generar frase motivacional aleatoria
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setMotivationalQuote(randomQuote);
  }, [currentUser]);

  // Cargar nombre de lista personalizado
  const loadListName = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('prospect_list_settings')
        .select('list_name')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando nombre de lista:', error);
        return;
      }

      if (data) {
        setListName(data.list_name);
      }
    } catch (error) {
      console.error('Error cargando configuración de lista:', error);
    }
  };

  // Guardar nombre de lista
  const saveListName = async (newName: string) => {
    if (!currentUser || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('prospect_list_settings')
        .upsert({
          instagram_user_id: currentUser.instagram_user_id,
          list_name: newName.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error guardando nombre de lista:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el nombre de la lista",
          variant: "destructive"
        });
        return;
      }

      setListName(newName.trim());
      toast({
        title: "Guardado",
        description: "Nombre de lista actualizado correctamente",
      });
    } catch (error) {
      console.error('Error guardando lista:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el nombre de la lista",
        variant: "destructive"
      });
    }
  };

  // Manejar edición de nombre de lista
  const handleEditListName = () => {
    setTempListName(listName);
    setIsEditingListName(true);
  };

  const handleSaveListName = () => {
    if (tempListName.trim() && tempListName !== listName) {
      saveListName(tempListName);
    }
    setIsEditingListName(false);
  };

  const handleCancelEdit = () => {
    setTempListName('');
    setIsEditingListName(false);
  };

  // Cargar prospectos (reducir cantidad)
  const loadProspects = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔄 Cargando prospectos para CRM...');

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
        .order('last_message_date', { ascending: false })
        .limit(9); // Limitar a 9 prospectos

      if (error) {
        console.error('❌ Error cargando prospectos:', error);
        throw error;
      }

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

  // Función para manejar el contacto con prospecto
  const handleContactProspect = async () => {
    if (!selectedProspect || !contactMessage.trim()) return;

    try {
      setSendingMessage(true);
      // TODO: Implementar envío de mensaje a través del API de Instagram
      console.log('Enviando mensaje a:', selectedProspect.username);
      console.log('Mensaje:', contactMessage);

      toast({
        title: "Mensaje enviado",
        description: `Mensaje enviado a @${selectedProspect.username}`,
      });

      setSelectedProspect(null);
      setContactMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Componente de tarjeta de prospecto
  const ProspectCard = ({ prospect }: { prospect: ProspectData }) => (
    <Card 
      className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20"
      onClick={() => setSelectedProspect(prospect)}
    >
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
          <div className="flex items-center gap-2 mb-2">
            <User className="w-6 h-6" />
            {isEditingListName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempListName}
                  onChange={(e) => setTempListName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveListName()}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveListName}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <h1 
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary flex items-center gap-2"
                onClick={handleEditListName}
              >
                {listName}
                <Edit2 className="w-4 h-4 opacity-50" />
              </h1>
            )}
          </div>
          <p className="text-gray-600">
            {prospects.length} prospectos totales • @{currentUser.username}
          </p>
          <p className="text-sm text-gray-500 italic mt-1">
            {motivationalQuote}
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

      {/* Popup de contacto */}
      <Dialog open={!!selectedProspect} onOpenChange={(open) => !open && setSelectedProspect(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contactar Prospecto
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje a @{selectedProspect?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedProspect?.profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  {selectedProspect?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">@{selectedProspect?.username}</h4>
                <p className="text-sm text-gray-600">
                  Último mensaje: {selectedProspect && format(new Date(selectedProspect.last_message_date), 'dd MMM, HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                placeholder="Escribe tu mensaje aquí..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedProspect(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleContactProspect}
                disabled={!contactMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Mensaje
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectCRM;