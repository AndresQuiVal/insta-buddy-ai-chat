
import React, { useState, useEffect } from 'react';
import { User, Circle, Star } from 'lucide-react';

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
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      userName: 'maria_gonzalez',
      lastMessage: '¡Hola! Me interesa tu producto',
      timestamp: '2 min',
      unread: true,
      matchPoints: 4,
      metTraits: ['Interesado en nuestros productos o servicios', 'Tiene presupuesto adecuado para adquirir nuestras soluciones', 'Está listo para tomar una decisión de compra', 'Se encuentra en nuestra zona de servicio']
    },
    {
      id: '2',
      userName: 'carlos_tech',
      lastMessage: '¿Cuáles son los precios?',
      timestamp: '15 min',
      unread: false,
      matchPoints: 3,
      metTraits: ['Interesado en nuestros productos o servicios', 'Tiene presupuesto adecuado para adquirir nuestras soluciones', 'Está listo para tomar una decisión de compra']
    },
    {
      id: '3',
      userName: 'ana_designer',
      lastMessage: 'Perfecto, muchas gracias',
      timestamp: '1 h',
      unread: false,
      matchPoints: 2,
      metTraits: ['Interesado en nuestros productos o servicios', 'Tiene presupuesto adecuado para adquirir nuestras soluciones']
    },
    {
      id: '4',
      userName: 'luis_startup',
      lastMessage: '¿Tienen descuentos?',
      timestamp: '3 h',
      unread: true,
      matchPoints: 1,
      metTraits: ['Interesado en nuestros productos o servicios']
    },
    {
      id: '5',
      userName: 'nuevo_usuario',
      lastMessage: 'Acabo de conocer tu marca',
      timestamp: '5 h',
      unread: false,
      matchPoints: 0,
      metTraits: []
    }
  ]);

  // Escuchar actualizaciones de matchPoints desde localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedConversations = localStorage.getItem('hower-conversations');
      if (savedConversations) {
        try {
          const parsedConversations = JSON.parse(savedConversations);
          setConversations(prevConversations => {
            // Fusionar las conversaciones guardadas con las existentes
            const updatedConversations = [...prevConversations];
            
            parsedConversations.forEach((savedConv: Conversation) => {
              const existingIndex = updatedConversations.findIndex(conv => conv.id === savedConv.id);
              if (existingIndex !== -1) {
                // Actualizar conversación existente
                updatedConversations[existingIndex] = {
                  ...updatedConversations[existingIndex],
                  matchPoints: savedConv.matchPoints,
                  metTraits: savedConv.metTraits
                };
              } else {
                // Añadir nueva conversación
                updatedConversations.push(savedConv);
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
    // Cargar conversaciones guardadas al iniciar
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Ordenar conversaciones por puntos de compatibilidad
  const sortedConversations = [...conversations].sort((a, b) => b.matchPoints - a.matchPoints);

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
          unread: true,
          matchPoints: Math.floor(Math.random() * 5), // 0-4 puntos aleatorios
          metTraits: []
        };
        
        setConversations(prev => [newConversation, ...prev].slice(0, 10));
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

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
