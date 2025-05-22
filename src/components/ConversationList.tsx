
import React, { useState, useEffect } from 'react';
import { User, Circle } from 'lucide-react';

interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
}

interface ConversationListProps {
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  activeConversation,
  onSelectConversation
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      userName: 'maria_gonzalez',
      lastMessage: '¡Hola! Me interesa tu producto',
      timestamp: '2 min',
      unread: true
    },
    {
      id: '2',
      userName: 'carlos_tech',
      lastMessage: '¿Cuáles son los precios?',
      timestamp: '15 min',
      unread: false
    },
    {
      id: '3',
      userName: 'ana_designer',
      lastMessage: 'Perfecto, muchas gracias',
      timestamp: '1 h',
      unread: false
    },
    {
      id: '4',
      userName: 'luis_startup',
      lastMessage: '¿Tienen descuentos?',
      timestamp: '3 h',
      unread: true
    }
  ]);

  // Simular nuevas conversaciones
  useEffect(() => {
    const interval = setInterval(() => {
      const newUsers = ['sofia_marketing', 'david_dev', 'laura_design', 'pedro_sales'];
      const messages = [
        '¡Hola! ¿Están disponibles?',
        'Me interesa colaborar',
        '¿Pueden ayudarme?',
        'Excelente trabajo'
      ];
      
      if (Math.random() > 0.7) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          userName: newUsers[Math.floor(Math.random() * newUsers.length)],
          lastMessage: messages[Math.floor(Math.random() * messages.length)],
          timestamp: 'ahora',
          unread: true
        };
        
        setConversations(prev => [newConversation, ...prev].slice(0, 8));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full">
      <div className="p-4 border-b border-purple-100">
        <h2 className="text-lg font-semibold text-gray-800">Conversaciones</h2>
        <div className="flex items-center gap-2 mt-2">
          <Circle className="w-3 h-3 fill-green-500 text-green-500" />
          <span className="text-sm text-gray-600">IA Activa</span>
        </div>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)]">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-purple-50 ${
              activeConversation === conversation.id 
                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-l-purple-500' 
                : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
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
                {conversation.unread && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
