
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface ProspectMessage {
  id: string;
  message_instagram_id: string;
  message_text: string;
  is_from_prospect: boolean;
  message_timestamp: string;
  message_type: string;
  raw_data: any;
}

interface Prospect {
  id: string;
  prospect_instagram_id: string;
  username: string;
  profile_picture_url?: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_from_prospect: boolean;
  status: string;
  messages?: ProspectMessage[];
}

const ProspectList: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useInstagramUsers();

  useEffect(() => {
    if (currentUser) {
      loadProspects();
    }
  }, [currentUser]);

  const getProspectState = (prospect: Prospect) => {
    if (prospect.status === 'esperando_respuesta') {
      return 'Esperando respuesta';
    } else if (prospect.status === 'en_seguimiento') {
      return 'En seguimiento';
    } else if (prospect.status === 'reunion_agendada') {
      return 'Reunión agendada';
    }
    return 'Sin respuesta';
  };

  const handleAISuggestion = async (prospect: Prospect) => {
    if (!currentUser?.openai_api_key) {
      toast({
        title: "API Key de OpenAI requerida",
        description: "Por favor, configura tu API key de OpenAI en la configuración de tu cuenta",
        variant: "destructive"
      });
      return;
    }

    console.log("🤖 Generando sugerencia con IA para:", prospect.username);
    
    try {
      // Obtener todas las conversaciones del prospecto
      const { data: messages, error: messagesError } = await supabase
        .from('prospect_messages')
        .select('*')
        .eq('prospect_id', prospect.id)
        .order('message_timestamp', { ascending: true });

      if (messagesError) {
        console.error("Error obteniendo mensajes:", messagesError);
        toast({
          title: "Error",
          description: "No se pudieron obtener los mensajes de la conversación",
          variant: "destructive"
        });
        return;
      }

      if (!messages || messages.length === 0) {
        toast({
          title: "Sin conversación",
          description: "No hay mensajes suficientes para generar una sugerencia",
          variant: "destructive"
        });
        return;
      }

      // Formatear la conversación para la IA
      const conversationText = messages.map(msg => {
        const sender = msg.is_from_prospect ? prospect.username : 'Yo';
        return `${sender}: ${msg.message_text}`;
      }).join('\n');

      console.log("📊 Conversación formateada:", conversationText);

      // Llamar a la función de edge para generar sugerencia con IA
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-prospect-suggestion', {
        body: {
          conversation: conversationText,
          prospect_name: prospect.username,
          openai_api_key: currentUser.openai_api_key
        }
      });

      if (aiError) {
        console.error("Error en sugerencia IA:", aiError);
        toast({
          title: "Error en IA",
          description: "No se pudo generar la sugerencia con IA",
          variant: "destructive"
        });
        return;
      }

      if (aiResponse?.suggestion) {
        // Mostrar la sugerencia en un toast más largo o modal
        toast({
          title: "💡 Sugerencia de IA",
          description: aiResponse.suggestion,
          duration: 10000, // 10 segundos para leer
        });
        
        console.log("✅ Sugerencia generada:", aiResponse.suggestion);
      } else {
        toast({
          title: "Sin sugerencia",
          description: "La IA no pudo generar una sugerencia para esta conversación",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("❌ Error al generar sugerencia:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar la sugerencia",
        variant: "destructive"
      });
    }
  };

  const loadProspects = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔍 Cargando prospectos para usuario:', currentUser.username);
      console.log('🆔 Usuario ID:', currentUser.id);
      console.log('🆔 Instagram User ID:', currentUser.instagram_user_id);

      // DEPURACIÓN: Primero verificar qué hay en la tabla prospects
      const { data: allProspects, error: allError } = await supabase
        .from('prospects')
        .select('*');

      console.log('📊 TODOS los prospectos en la base de datos:', allProspects);
      console.log('❌ Error al consultar todos los prospectos:', allError);

      // Consulta principal usando el instagram_user_id como UUID para que coincida con el webhook
      const { data: prospectsData, error } = await supabase
        .from('prospects')
        .select(`
          *,
          prospect_messages (
            id,
            message_instagram_id,
            message_text,
            is_from_prospect,
            message_timestamp,
            message_type,
            raw_data
          )
        `)
        .eq('instagram_user_id', currentUser.id)
        .order('last_message_date', { ascending: false });

      console.log('📋 Consulta con filtro por UUID instagram_user_id:', {
        filter: `instagram_user_id = ${currentUser.id}`,
        result: prospectsData,
        error: error
      });

      if (error) {
        console.error('❌ Error loading prospects:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los prospectos",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Prospectos cargados para este usuario:', prospectsData?.length || 0);
      
      if (prospectsData && prospectsData.length > 0) {
        console.log('📝 Detalles de prospectos encontrados:', prospectsData.map(p => ({
          id: p.id,
          username: p.username,
          instagram_user_id: p.instagram_user_id,
          prospect_instagram_id: p.prospect_instagram_id,
          messages_count: p.prospect_messages?.length || 0
        })));
      } else {
        console.log('⚠️ No se encontraron prospectos. Verificando relación de datos...');
        
        // Verificar si el problema es la relación entre datos
        console.log('🔍 Verificando si hay prospectos con este instagram_user_id:', currentUser.id);
        
        // También verificar por el string del instagram_user_id
        const { data: prospectsWithStringId } = await supabase
          .from('prospects')
          .select('*')
          .eq('prospect_instagram_id', currentUser.instagram_user_id);
          
        console.log('📊 Prospectos encontrados con string ID:', prospectsWithStringId);
      }

      setProspects(prospectsData || []);
      
    } catch (error) {
      console.error('💥 Error in loadProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const userName = prospect.username.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return userName.includes(search);
  });

  if (!currentUser) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No hay usuario de Instagram autenticado
          </h3>
          <p className="text-gray-500">
            Debes conectar tu cuenta de Instagram para ver tus prospectos
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando prospectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <div>
          <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> Mis Prospectos
          </h2>
          <p className="text-sm text-gray-600">{filteredProspects.length} prospectos</p>
          <p className="text-xs text-gray-500">Usuario: {currentUser.username}</p>
        </div>
        <button
          onClick={loadProspects}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 border-b border-purple-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredProspects.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No se encontraron prospectos' : 'No hay prospectos aún'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los prospectos aparecerán aquí cuando recibas mensajes'}
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Información de depuración:</h4>
              <p className="text-sm text-blue-700">
                <strong>Usuario actual:</strong> {currentUser.username}<br/>
                <strong>Usuario ID (UUID):</strong> {currentUser.id}<br/>
                <strong>Instagram ID (String):</strong> {currentUser.instagram_user_id}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Revisa la consola del navegador (F12) para ver logs detallados de la consulta a la base de datos.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {prospect.profile_picture_url && (
                        <img 
                          src={prospect.profile_picture_url} 
                          alt={prospect.username}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {prospect.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prospect.status === 'esperando_respuesta'
                        ? 'bg-yellow-100 text-yellow-800'
                        : prospect.status === 'reunion_agendada'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getProspectState(prospect)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAISuggestion(prospect)}
                      className="flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      Sugerencia con IA
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ProspectList;
