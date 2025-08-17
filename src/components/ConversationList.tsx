
import React, { useState, useEffect } from 'react';
import { User, Circle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
  matchPoints: number; // 0-4 puntos de compatibilidad
  metTraits?: string[]; // Características cumplidas
}

interface ConversationListProps {
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  activeConversation,
  onSelectConversation
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useInstagramUsers();

  // Cargar conversaciones reales desde la base de datos
  useEffect(() => {
    loadRealConversations();
  }, [currentUser]);

  const loadRealConversations = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Obtener mensajes de Instagram agrupados por sender_id
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .eq('instagram_user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando mensajes:', error);
        return;
      }

      console.log('📧 Total mensajes cargados:', messages?.length);

      // Obtener análisis de prospectos
      const { data: analyses, error: analysisError } = await supabase
        .from('prospect_analysis')
        .select('*');

      const analysisMap = new Map();
      if (analyses) {
        analyses.forEach(analysis => {
          analysisMap.set(analysis.sender_id, analysis);
        });
      }

      // Obtener TODOS los prospectos (no filtrar por instagram_user_id aquí)
      const { data: prospects, error: prospectError } = await supabase
        .from('prospects')
        .select('prospect_instagram_id, username');

      const prospectMap = new Map();
      if (prospects) {
        prospects.forEach(prospect => {
          prospectMap.set(prospect.prospect_instagram_id, prospect.username);
        });
      }

      console.log('👥 Total prospectos cargados:', prospects?.length);
      console.log('🗂️ Prospect Map:', prospectMap);

      // Agrupar mensajes por sender_id
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach(message => {
        if (!conversationMap.has(message.sender_id)) {
          const analysis = analysisMap.get(message.sender_id);
          
          // Buscar username real
          let realUsername = prospectMap.get(message.sender_id);
          
          // Si no se encuentra, usar fallback
          if (!realUsername) {
            realUsername = `user_${message.sender_id.slice(-4)}`;
            console.log(`⚠️ No username encontrado para sender_id: ${message.sender_id}, usando fallback: ${realUsername}`);
          } else {
            console.log(`✅ Username encontrado para ${message.sender_id}: ${realUsername}`);
          }
          
          conversationMap.set(message.sender_id, {
            id: message.sender_id,
            userName: realUsername,
            lastMessage: message.message_text,
            timestamp: getTimeAgo(message.created_at),
            unread: message.message_type === 'received' && !message.is_read,
            matchPoints: analysis?.match_points || 0,
            metTraits: analysis?.met_traits || []
          });
        }
      });

      const realConversations = Array.from(conversationMap.values());
      console.log('💬 Conversaciones finales:', realConversations);
      setConversations(realConversations);
      
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
    return `${Math.floor(diffInMinutes / 1440)} d`;
  };

  // Ordenar conversaciones por puntos de compatibilidad
  const sortedConversations = [...conversations].sort((a, b) => b.matchPoints - a.matchPoints);

  // Escuchar actualizaciones desde localStorage para sincronizar
  useEffect(() => {
    const handleStorageChange = () => {
      const savedConversations = localStorage.getItem('hower-conversations');
      if (savedConversations) {
        try {
          const parsedConversations = JSON.parse(savedConversations);
          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];
            
            parsedConversations.forEach((savedConv: Conversation) => {
              const existingIndex = updatedConversations.findIndex(conv => conv.id === savedConv.id);
              if (existingIndex !== -1) {
                updatedConversations[existingIndex] = {
                  ...updatedConversations[existingIndex],
                  matchPoints: savedConv.matchPoints,
                  metTraits: savedConv.metTraits
                };
              }
            });
            
            return updatedConversations;
          });
        } catch (error) {
          console.error('Error parsing conversations from localStorage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('conversations-updated', loadRealConversations);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversations-updated', loadRealConversations);
    };
  }, [currentUser]);

  // Función para renderizar los indicadores de puntos de compatibilidad
  const renderMatchPoints = (points: number, metTraits?: string[]) => {
    return (
      <div>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(4)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < points ? 'fill-primary text-primary' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">{points}/4</span>
        </div>
        {metTraits && metTraits.length > 0 && (
          <div className="mt-1">
            <div className="text-xs text-gray-500">Criterios cumplidos:</div>
            <ul className="text-xs text-gray-600 ml-2">
              {metTraits.slice(0, 2).map((trait, idx) => (
                <li key={idx} className="truncate">• {trait}</li>
              ))}
              {metTraits.length > 2 && (
                <li className="text-xs text-gray-400">Y {metTraits.length - 2} más...</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Agrupar conversaciones por puntos
  const conversationsByPoints: Record<number, Conversation[]> = {};
  sortedConversations.forEach(conv => {
    if (!conversationsByPoints[conv.matchPoints]) {
      conversationsByPoints[conv.matchPoints] = [];
    }
    conversationsByPoints[conv.matchPoints].push(conv);
  });

  // Generar los grupos de conversaciones ordenados
  const conversationGroups = [4, 3, 2, 1, 0].map(points => {
    return {
      points,
      conversations: conversationsByPoints[points] || []
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Conversaciones</h2>
        <div className="flex items-center gap-2 mt-2">
          <Circle className="w-3 h-3 fill-primary text-primary" />
          <span className="text-sm text-gray-600">Hower Activo</span>
        </div>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)]">
        {conversationGroups.map((group) => (
          group.conversations.length > 0 && (
            <div key={group.points}>
              <div className="px-4 py-2 bg-gray-50 border-b border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500">
                  {group.points === 4 ? 'PROSPECTOS IDEALES' : 
                   group.points === 3 ? 'PROSPECTOS POTENCIALES' :
                   group.points === 2 ? 'PROSPECTOS EN EVALUACIÓN' :
                   group.points === 1 ? 'PROSPECTOS POCO COMPATIBLES' :
                   'NUEVOS CONTACTOS'}
                </span>
              </div>
              
              {group.conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    activeConversation === conversation.id 
                      ? 'bg-primary/5 border-l-4 border-l-primary' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          @{conversation.userName}
                        </h3>
                        <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                      </div>
                      <p className={`text-sm truncate mt-1 ${
                        conversation.unread ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                      {renderMatchPoints(conversation.matchPoints, conversation.metTraits)}
                      {conversation.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
