import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot, Loader2 } from 'lucide-react';
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
  const [loadingAI, setLoadingAI] = useState<string | null>(null); // Estado para controlar qué prospecto está cargando
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
    
    // Establecer estado de carga para este prospecto específico
    setLoadingAI(prospect.id);
    
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
    } finally {
      // Quitar estado de carga
      setLoadingAI(null);
    }
  };

  const loadProspects = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔍 ===== CARGANDO PROSPECTOS =====');
      console.log('👤 Usuario actual:', currentUser.username);
      console.log('🆔 currentUser.id (UUID):', currentUser.id);
      console.log('📱 currentUser.instagram_user_id (string):', currentUser.instagram_user_id);

      // ===== DEBUG: VERIFICAR TODOS LOS PROSPECTOS =====
      console.log('🔍 PASO 1: Verificando TODOS los prospectos en la tabla...');
      const { data: allProspectsCheck, error: allError } = await supabase
        .from('prospects')
        .select('*');
      
      console.log('📊 Total prospectos en BD:', allProspectsCheck?.length || 0);
      console.log('📋 Todos los prospectos:', allProspectsCheck);
      console.log('❌ Error al consultar todos:', allError);

      // ===== DEBUG: VERIFICAR CONSULTA ESPECÍFICA =====
      console.log('🔍 PASO 2: Consultando prospectos para este usuario...');
      console.log('🎯 Filtro que se usará: instagram_user_id =', currentUser.id);
      
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

      console.log('📊 RESULTADO DE LA CONSULTA:');
      console.log('✅ Datos obtenidos:', prospectsData);
      console.log('❌ Error en consulta:', error);
      console.log('📈 Número de prospectos encontrados:', prospectsData?.length || 0);

      // ===== DEBUG: VERIFICAR RLS =====
      console.log('🔍 PASO 3: Verificando si RLS está bloqueando...');
      
      // Intentar una consulta más específica para el prospecto que sabemos que existe
      const { data: specificProspect, error: specificError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', '48ff4aad-e772-4c50-b60e-2ab4241054f9')
        .single();
      
      console.log('🎯 Consulta específica del prospecto conocido:');
      console.log('📋 Resultado:', specificProspect);
      console.log('❌ Error:', specificError);

      // ===== DEBUG: VERIFICAR DIFERENTES FILTROS =====
      console.log('🔍 PASO 4: Probando diferentes filtros...');
      
      // Probar con instagram_user_id como string
      const { data: stringFilter, error: stringError } = await supabase
        .from('prospects')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id);
      
      console.log('📱 Filtro por string instagram_user_id:', currentUser.instagram_user_id);
      console.log('📋 Resultado:', stringFilter);
      console.log('❌ Error:', stringError);

      if (error) {
        console.error('❌ Error loading prospects:', error);
        toast({
          title: "Error",
          description: `Error al cargar prospectos: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('🏁 RESULTADO FINAL:');
      if (prospectsData && prospectsData.length > 0) {
        console.log('✅ Prospectos encontrados:', prospectsData.length);
        console.log('📝 Detalles:', prospectsData.map(p => ({
          id: p.id,
          username: p.username,
          instagram_user_id: p.instagram_user_id,
          prospect_instagram_id: p.prospect_instagram_id,
          messages_count: p.prospect_messages?.length || 0,
          status: p.status
        })));
      } else {
        console.log('⚠️ NO SE ENCONTRARON PROSPECTOS');
        console.log('🔧 Posibles causas:');
        console.log('  1. RLS está bloqueando la consulta');
        console.log('  2. El instagram_user_id no coincide');
        console.log('  3. El usuario no tiene permisos para ver los datos');
      }

      setProspects(prospectsData || []);
      
    } catch (error) {
      console.error('💥 Error completo en loadProspects:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar prospectos",
        variant: "destructive"
      });
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
            <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
              <h4 className="font-semibold text-red-800 mb-2">🚨 DEBUG: Información detallada</h4>
              <div className="text-sm text-red-700 space-y-1">
                <p><strong>Usuario actual:</strong> {currentUser.username}</p>
                <p><strong>Usuario ID (UUID):</strong> {currentUser.id}</p>
                <p><strong>Instagram ID (String):</strong> {currentUser.instagram_user_id}</p>
                <p><strong>Prospectos cargados:</strong> {prospects.length}</p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Abre la consola del navegador (F12) para ver los logs detallados de la consulta.
                <br />
                Si ves prospectos en los logs pero no aparecen aquí, es un problema de RLS.
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
                      disabled={loadingAI === prospect.id}
                      className="flex items-center gap-2"
                    >
                      {loadingAI === prospect.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4" />
                          Sugerencia con IA
                        </>
                      )}
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
