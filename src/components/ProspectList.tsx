
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInstagramConversations, formatMessageTime, ConversationProspect } from '@/services/instagramConversationsService';
import { analyzeInstagramMessage } from '@/services/instagramTraitAnalysis';

const ProspectList: React.FC = () => {
  const [prospects, setProspects] = useState<ConversationProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando prospectos desde Instagram API...');
      
      const conversationProspects = await getInstagramConversations();
      setProspects(conversationProspects);
      
      console.log(`✅ ${conversationProspects.length} prospectos cargados`);
      
    } catch (error) {
      console.error('❌ Error cargando prospectos:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los prospectos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestion = async (prospect: ConversationProspect) => {
    console.log("🤖 Generando sugerencia con IA para:", prospect.username);
    
    if (prospect.lastMessage && prospect.lastMessage !== '[Mensaje sin contenido]') {
      try {
        console.log("📊 Analizando mensaje del prospecto:", prospect.lastMessage.substring(0, 100) + "...");
        
        await analyzeInstagramMessage(
          prospect.userId,
          prospect.lastMessage,
          prospect.username
        );
        
        toast({
          title: "✅ Análisis completado",
          description: `Características analizadas para ${prospect.username}`
        });
        
      } catch (error) {
        console.error("❌ Error al analizar características:", error);
        toast({
          title: "Error en análisis",
          description: "No se pudo completar el análisis con IA",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Sin contenido para analizar",
        description: "Este prospecto no tiene mensajes de texto para analizar",
        variant: "destructive"
      });
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const userName = prospect.username.toLowerCase();
    const lastMessage = prospect.lastMessage.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return userName.includes(search) || lastMessage.includes(search);
  });

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando prospectos desde Instagram...</p>
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
          <p className="text-sm text-gray-600">{filteredProspects.length} conversaciones activas</p>
        </div>
        <button
          onClick={loadProspects}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Actualizar prospectos"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 border-b border-purple-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de usuario o mensaje..."
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
              {searchTerm ? 'No se encontraron prospectos' : 'No hay conversaciones aún'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Las conversaciones aparecerán aquí cuando tengas mensajes en Instagram'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Mensaje</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {prospect.username.charAt(0).toUpperCase()}
                      </div>
                      <span>@{prospect.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prospect.state === 'Esperando respuesta'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {prospect.state}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm text-gray-600">
                      {prospect.lastMessage}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatMessageTime(prospect.lastMessageTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAISuggestion(prospect)}
                      className="flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      Analizar con IA
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
