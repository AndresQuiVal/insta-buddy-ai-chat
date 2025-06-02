import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChatMessage, handleAutomaticResponse, isOpenAIConfigured } from '@/services/openaiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  activeConversation: string | null;
  aiConfig: {
    name: string;
    personality: string;
    responseDelay: number;
    autoRespond: boolean;
  };
}

interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
  matchPoints: number;
  metTraits: string[];
  messages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversation, aiConfig }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [idealTraits, setIdealTraits] = useState<{trait: string, enabled: boolean}[]>([]);
  const [currentMatchPoints, setCurrentMatchPoints] = useState(0);
  const [metTraits, setMetTraits] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar las características ideales del cliente
  useEffect(() => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      if (savedTraits) {
        setIdealTraits(JSON.parse(savedTraits));
      }
    } catch (e) {
      console.error("Error al cargar características del cliente ideal:", e);
    }
  }, []);

  // Simulador de conversaciones por usuario
  const conversationData: { [key: string]: Message[] } = {
    '1': [
      { id: '1', text: '¡Hola! Me interesa tu producto', sender: 'user', timestamp: new Date(Date.now() - 120000) },
      { id: '2', text: '¡Hola! Gracias por tu interés. Soy un asistente de IA y estaré encantado de ayudarte. ¿Qué te gustaría saber sobre nuestros productos?', sender: 'ai', timestamp: new Date(Date.now() - 118000) }
    ],
    '2': [
      { id: '1', text: '¿Cuáles son los precios?', sender: 'user', timestamp: new Date(Date.now() - 900000) },
      { id: '2', text: 'Te puedo ayudar con información sobre precios. Tenemos diferentes planes que se adaptan a distintas necesidades. ¿Podrías contarme un poco más sobre lo que buscas?', sender: 'ai', timestamp: new Date(Date.now() - 898000) }
    ]
  };

  // Cargar conversación y datos de compatibilidad desde localStorage
  useEffect(() => {
    if (activeConversation) {
      // Cargar mensajes específicos de la conversación
      if (conversationData[activeConversation]) {
        setMessages(conversationData[activeConversation]);
      } else {
        setMessages([]);
      }

      // Cargar datos de compatibilidad guardados
      try {
        const savedConversations = localStorage.getItem('hower-conversations');
        if (savedConversations) {
          const conversations = JSON.parse(savedConversations);
          const currentConv = conversations.find((conv: Conversation) => conv.id === activeConversation);
          
          if (currentConv) {
            setCurrentMatchPoints(currentConv.matchPoints || 0);
            setMetTraits(currentConv.metTraits || []);
            
            // Si hay mensajes guardados, usarlos en lugar de los del simulador
            if (currentConv.messages && currentConv.messages.length > 0) {
              setMessages(currentConv.messages);
            }
          } else {
            // Inicializar para una nueva conversación
            setCurrentMatchPoints(0);
            setMetTraits([]);
          }
        }
      } catch (e) {
        console.error("Error al cargar datos de conversación:", e);
      }
    }
  }, [activeConversation]);

  // Guardar conversación actual con puntos de compatibilidad
  useEffect(() => {
    if (activeConversation && messages.length > 0) {
      try {
        const savedConversationsStr = localStorage.getItem('hower-conversations');
        let conversations: Conversation[] = [];
        
        if (savedConversationsStr) {
          conversations = JSON.parse(savedConversationsStr);
        }
        
        // Buscar si esta conversación ya existe
        const existingIndex = conversations.findIndex(conv => conv.id === activeConversation);
        const lastMessage = messages[messages.length - 1];
        
        if (existingIndex !== -1) {
          // Actualizar conversación existente
          conversations[existingIndex] = {
            ...conversations[existingIndex],
            lastMessage: lastMessage.text,
            timestamp: '1m',
            matchPoints: currentMatchPoints,
            metTraits: metTraits,
            messages: messages
          };
        } else {
          // Crear nueva conversación
          conversations.push({
            id: activeConversation,
            userName: `user_${activeConversation}`,
            lastMessage: lastMessage.text,
            timestamp: '1m',
            unread: false,
            matchPoints: currentMatchPoints,
            metTraits: metTraits,
            messages: messages
          });
        }
        
        // Guardar en localStorage
        localStorage.setItem('hower-conversations', JSON.stringify(conversations));
        
        // Disparar evento para que otros componentes (ConversationList) se actualicen
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error("Error al guardar conversación:", e);
      }
    }
  }, [activeConversation, currentMatchPoints, metTraits, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Convertir historial de mensajes al formato de OpenAI
  const getOpenAIConversationHistory = (messages: Message[]): ChatMessage[] => {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  // Business configuration for AI
  const businessConfig = {
    businessName: aiConfig.name,
    businessDescription: "Asistente virtual que ayuda a filtrar prospectos potenciales.",
    tone: aiConfig.personality === 'amigable' ? 'amigable y cercano' : 
          aiConfig.personality === 'profesional' ? 'profesional y formal' : 'casual y relajado',
    // Cargar las características desde localStorage o usar valores por defecto
    idealClientTraits: (() => {
      try {
        const savedTraits = localStorage.getItem('hower-ideal-client-traits');
        if (savedTraits) {
          const traits = JSON.parse(savedTraits);
          return traits.filter((trait: any) => trait.enabled).map((trait: any) => trait.trait);
        }
      } catch (e) {
        console.error("Error al cargar características del cliente ideal:", e);
      }
      return [
        "Interesado en nuestros productos o servicios",
        "Tiene presupuesto adecuado para adquirir nuestras soluciones",
        "Está listo para tomar una decisión de compra",
        "Se encuentra en nuestra zona de servicio"
      ];
    })()
  };

  const generateSimpleResponse = (userMessage: string): string => {
    const responses = {
      amigable: [
        '¡Hola! Gracias por escribir. ¿En qué puedo ayudarte hoy?',
        'Me alegra mucho que te hayas puesto en contacto. ¿Qué necesitas?',
        '¡Perfecto! Estoy aquí para ayudarte con cualquier duda.',
        'Excelente pregunta. Te ayudo a resolverla enseguida.',
        '¡Genial! Me encanta poder asistirte.'
      ],
      profesional: [
        'Buenos días. Estaré encantado de asistirle con su consulta.',
        'Gracias por contactarnos. ¿Cómo puedo ayudarle?',
        'Entiendo su consulta. Permítame proporcionarle la información.',
        'Perfecto. Le ayudo a resolver su solicitud.',
        'Muchas gracias por su interés. ¿Qué información necesita?'
      ],
      casual: [
        '¡Hey! ¿Qué tal? ¿En qué te puedo echar una mano?',
        '¡Hola! ¿Cómo va todo? ¿Qué necesitas?',
        '¡Buenas! ¿En qué puedo ayudarte?',
        'Perfecto, dime qué necesitas',
        '¡Dale! Te ayudo con lo que sea'
      ]
    };

    const personalityResponses = responses[aiConfig.personality as keyof typeof responses] || responses.amigable;
    return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
  };

  // Improved function to analyze conversation with better keyword detection
  const analyzeConversation = (newMessages: Message[]) => {
    if (idealTraits.length === 0) return;

    setIsAnalyzing(true);
    console.log("🔍 INICIANDO ANÁLISIS DE CARACTERÍSTICAS...");

    // Obtener solo las características habilitadas
    const enabledTraits = idealTraits.filter(t => t.enabled).map(t => t.trait);
    if (enabledTraits.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    console.log("✅ Características habilitadas para análisis:", enabledTraits);

    // Solo analizar los mensajes del usuario, no los del AI
    const userMessages = newMessages.filter(msg => msg.sender === 'user');
    
    if (userMessages.length === 0) {
      setIsAnalyzing(false);
      return;
    }
    
    // Analizar cada mensaje del usuario individualmente y concatenarlos
    const conversationText = userMessages.map(msg => msg.text.toLowerCase()).join(' ');
    
    console.log("📝 Analizando texto de conversación:", conversationText);
    
    // Verificar cada característica
    const newMetTraits: string[] = [...metTraits];
    let newTraitsDetected = 0;
    
    enabledTraits.forEach(trait => {
      // Palabras clave relacionadas con cada característica - más específicas y con variaciones
      const keywordMap: Record<string, string[]> = {
        "Interesado en nuestros productos o servicios": [
          "interesa", "producto", "servicio", "necesito", "busco", 
          "quiero", "comprar", "tienen", "ofrecen", "información",
          "conocer", "saber", "precio", "cotización", "propuesta"
        ],
        "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
          "presupuesto", "dispongo", "puedo pagar", "cuesta", "precio", 
          "inversión", "económico", "financiar", "pago", "costo",
          "dinero", "gastar", "pagar", "efectivo", "tarjeta", "recursos"
        ],
        "Está listo para tomar una decisión de compra": [
          "decidido", "comprar", "adquirir", "cuando", "ahora", 
          "inmediato", "listo", "proceder", "compra", "ya",
          "hoy", "pronto", "mañana", "semana", "momento", "urgente"
        ],
        "Se encuentra en nuestra zona de servicio": [
          "vivo", "ubicado", "dirección", "ciudad", "zona", "región", 
          "local", "envío", "entrega", "domicilio", "casa",
          "oficina", "trabajo", "calle", "avenida", "país", "área"
        ]
      };
      
      // Obtiene las palabras clave para esta característica
      const keywords = keywordMap[trait] || [];
      
      // Verifica si alguna palabra clave está contenida en la conversación
      const matchFound = keywords.some(keyword => {
        // Buscar la palabra como substring (más permisivo)
        return conversationText.includes(keyword.toLowerCase());
      });
      
      console.log(`🎯 Característica "${trait}" - Coincidencia encontrada: ${matchFound}`);
      
      if (matchFound && !newMetTraits.includes(trait)) {
        console.log(`✅ NUEVA CARACTERÍSTICA DETECTADA: ${trait}`);
        newMetTraits.push(trait);
        newTraitsDetected++;
        
        // Mostrar toast cuando se detecta una nueva característica
        toast({
          title: "¡Nueva característica detectada!",
          description: trait,
        });
      }
    });
    
    // Solo actualizar si hay cambios
    if (JSON.stringify(newMetTraits) !== JSON.stringify(metTraits)) {
      console.log("📊 Actualizando características cumplidas:", newMetTraits);
      setMetTraits(newMetTraits);
      setCurrentMatchPoints(Math.min(newMetTraits.length, enabledTraits.length));
      
      if (newTraitsDetected > 0) {
        toast({
          title: `${newTraitsDetected} característica${newTraitsDetected > 1 ? 's' : ''} nueva${newTraitsDetected > 1 ? 's' : ''}`,
          description: `Puntuación actual: ${newMetTraits.length}/${enabledTraits.length} estrella${newMetTraits.length !== 1 ? 's' : ''}`,
        });
      }
    }
    
    setTimeout(() => setIsAnalyzing(false), 1000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setNewMessage('');

    // Analizar la conversación para detectar rasgos
    analyzeConversation(newMessages);

    if (aiConfig.autoRespond) {
      setIsTyping(true);
      
      // Determinar si se usa OpenAI o la respuesta simple
      const useOpenAI = isOpenAIConfigured();
      
      setTimeout(async () => {
        let responseText = '';
        
        if (useOpenAI) {
          try {
            // Usar OpenAI para generar respuesta
            const conversationHistory = getOpenAIConversationHistory(newMessages);
            
            // Verificar si hay un prompt personalizado guardado
            const savedPrompt = localStorage.getItem('hower-system-prompt');
            
            responseText = await handleAutomaticResponse(
              newMessage,
              conversationHistory,
              businessConfig,
              savedPrompt // Pasar el prompt personalizado si existe
            );
          } catch (error) {
            console.error("Error al generar respuesta con OpenAI:", error);
            responseText = generateSimpleResponse(newMessage);
          }
        } else {
          // Usar respuesta simple
          responseText = generateSimpleResponse(newMessage);
        }
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai',
          timestamp: new Date()
        };
        
        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        setIsTyping(false);
        
        // Analizar nuevamente con la respuesta de la IA
        analyzeConversation(finalMessages);
        
        toast({
          title: "IA Respondió",
          description: `${aiConfig.name} ha enviado una respuesta`,
        });
      }, aiConfig.responseDelay);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Renderizar indicadores de compatibilidad
  const renderCompatibilityIndicator = () => {
    const enabledTraits = idealTraits.filter(t => t.enabled);
    const maxPoints = enabledTraits.length || 4;
    
    return (
      <div className="flex flex-col p-4 border-t border-purple-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            Compatibilidad del prospecto
            {isAnalyzing && (
              <span className="ml-2 text-xs text-blue-600 animate-pulse">
                Analizando...
              </span>
            )}
          </h4>
          <div className="flex items-center">
            {[...Array(maxPoints)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < currentMatchPoints ? 'fill-primary text-primary' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{currentMatchPoints}/{maxPoints}</span>
          </div>
        </div>
        
        <div className="space-y-1 mt-1">
          {enabledTraits.map((trait, idx) => {
              const isMet = metTraits.includes(trait.trait);
              return (
                <div key={idx} className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isMet ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`${isMet ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {trait.trait}
                  </span>
                  {isMet && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </div>
              );
            })}
        </div>
        
        {enabledTraits.length === 0 && (
          <div className="text-xs text-gray-500 italic">
            No hay características configuradas. Ve a Configuración → Cliente Ideal para configurarlas.
          </div>
        )}
      </div>
    );
  };

  if (!activeConversation) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona una conversación</h3>
          <p className="text-gray-500">Elige una conversación para comenzar a chatear con la IA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col">
      {/* Header del chat */}
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{aiConfig.name}</h3>
            <p className="text-sm text-green-600">● Activo</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-green-400 to-blue-500'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  {message.timestamp instanceof Date 
                    ? message.timestamp.toLocaleTimeString() 
                    : 'Tiempo no disponible'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de compatibilidad */}
      {renderCompatibilityIndicator()}

      {/* Input de mensaje */}
      <div className="p-4 border-t border-purple-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
