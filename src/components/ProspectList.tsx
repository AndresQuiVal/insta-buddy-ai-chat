
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InstagramMessage {
  id: string;
  instagram_message_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  raw_data: any;
}

interface Prospect {
  sender_id: string;
  messages: InstagramMessage[];
  last_message: InstagramMessage;
  message_count: number;
}

const ProspectList: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    const storedPageId = localStorage.getItem('hower-page-id');
    if (storedPageId) {
      setPageId(storedPageId);
    }
    loadProspects();
  }, []);

  const getUserDisplayName = (senderId: string) => {
    if (senderId === 'hower_bot') return 'Hower Assistant';
    if (senderId.length > 8) {
      return `Usuario ${senderId.slice(-4)}`;
    }
    return `Usuario ${senderId}`;
  };

  const getProspectState = (prospect: Prospect) => {
    const receivedMessages = prospect.messages.filter(msg => msg.message_type === 'received');
    const sentMessages = prospect.messages.filter(msg => msg.message_type === 'sent');
    
    if (receivedMessages.length === 0) {
      return 'Sin respuesta';
    } else if (prospect.last_message.message_type === 'received') {
      return 'Esperando respuesta';
    } else {
      return 'En seguimiento';
    }
  };

  const handleAISuggestion = (prospect: Prospect) => {
    toast({
      title: "Sugerencia con IA",
      description: `Generando sugerencia para ${getUserDisplayName(prospect.sender_id)}...`
    });
  };

  const loadProspects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los prospectos",
          variant: "destructive"
        });
        return;
      }

      const realMessages = data?.filter((message: any) => {
        return !message.sender_id.includes('webhook_') && 
               !message.sender_id.includes('debug') && 
               !message.sender_id.includes('error') &&
               !message.message_text.includes('PAYLOAD COMPLETO') &&
               !message.message_text.includes('ERROR:') &&
               message.sender_id !== 'diagnostic_user';
      }) || [];

      const myPageId = pageId || localStorage.getItem('hower-page-id');
      const prospectGroups: { [key: string]: InstagramMessage[] } = {};
      
      realMessages.forEach((message: any) => {
        let prospectId = '';
        let messageType: 'sent' | 'received' = 'received';
        
        if (myPageId) {
          if (message.sender_id === myPageId) {
            prospectId = message.recipient_id;
            messageType = 'sent';
          } else {
            prospectId = message.sender_id;
            messageType = 'received';
          }
        } else {
          if (message.raw_data?.is_echo || message.message_type === 'sent') {
            messageType = 'sent';
            prospectId = message.recipient_id;
          } else {
            messageType = 'received';
            prospectId = message.sender_id;
          }
        }
        
        if (!prospectGroups[prospectId]) {
          prospectGroups[prospectId] = [];
        }
        
        prospectGroups[prospectId].push({
          ...message,
          message_type: messageType
        });
      });

      const prospectsArray = Object.entries(prospectGroups).map(([prospectId, messages]) => {
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        return {
          sender_id: prospectId,
          messages: sortedMessages,
          last_message: sortedMessages[sortedMessages.length - 1],
          message_count: sortedMessages.length,
        };
      });

      prospectsArray.sort((a, b) => 
        new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
      );

      setProspects(prospectsArray);
      
    } catch (error) {
      console.error('Error in loadProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const userName = getUserDisplayName(prospect.sender_id).toLowerCase();
    const lastMessage = prospect.last_message.message_text.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return userName.includes(search) || lastMessage.includes(search);
  });

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
            placeholder="Buscar por nombre o mensaje..."
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
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los prospectos aparecerán aquí cuando lleguen mensajes'}
            </p>
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
                <TableRow key={prospect.sender_id}>
                  <TableCell className="font-medium">
                    {getUserDisplayName(prospect.sender_id)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getProspectState(prospect) === 'Sin respuesta' 
                        ? 'bg-red-100 text-red-800'
                        : getProspectState(prospect) === 'Esperando respuesta'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
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
