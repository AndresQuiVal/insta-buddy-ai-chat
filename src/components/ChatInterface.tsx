import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChatMessage, handleAutomaticResponse, isOpenAIConfigured } from '@/services/openaiService';
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';
import { handleStrategicAutomaticResponse } from '@/services/openaiService';
import { supabase } from '@/integrations/supabase/client';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAnalyzing, analyzeConversation, updateConversationInStorage, loadIdealTraits } = useAITraitAnalysis();

  // Cargar las características ideales del cliente desde localStorage
  useEffect(() => {
    loadTraitsFromStorage();
    
    // Escuchar actualizaciones de características
    const handleTraitsUpdate = (event: CustomEvent) => {
      console.log("🔔 Características actualizadas, recargando...", event.detail);
      setIdealTraits(event.detail);
    };

    window.addEventListener('traits-updated', handleTraitsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('traits-updated', handleTraitsUpdate as EventListener);
    };
  }, []);

  const loadTraitsFromStorage = () => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      console.log("🔍 DEBUG: Cargando características desde localStorage:", savedTraits);
      
      if (savedTraits) {
        const parsedTraits = JSON.parse(savedTraits);
        const formattedTraits = parsedTraits.map((item: any) => ({
          trait: item.trait,
          enabled: item.enabled
        }));
        setIdealTraits(formattedTraits);
        console.log("✅ DEBUG: Características cargadas en ChatInterface:", formattedTraits);
        console.log("🎯 DEBUG: Características habilitadas:", formattedTraits.filter((t: any) => t.enabled));
      } else {
        console.log("⚠️ DEBUG: No hay características guardadas, usando por defecto");
        setDefaultTraits();
      }
    } catch (error) {
      console.error("❌ DEBUG: Error al cargar características:", error);
      setDefaultTraits();
    }
  };

  const setDefaultTraits = () => {
    const defaultTraits = [
      { trait: "Interesado en nuestros productos o servicios", enabled: true },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true },
      { trait: "Está listo para tomar una decisión de compra", enabled: true },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true }
    ];
    setIdealTraits(defaultTraits);
    console.log("🔧 DEBUG: Características por defecto establecidas:", defaultTraits);
  };

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
      console.log("🔄 DEBUG: Cargando conversación:", activeConversation);
      
      // Cargar mensajes específicos de la conversación
      if (conversationData[activeConversation]) {
        setMessages(conversationData[activeConversation]);
        console.log("📝 DEBUG: Mensajes cargados desde conversationData:", conversationData[activeConversation]);
      } else {
        setMessages([]);
        console.log("📭 DEBUG: No hay mensajes en conversationData para:", activeConversation);
      }

      // Cargar datos de compatibilidad guardados
      try {
        const savedConversations = localStorage.getItem('hower-conversations');
        console.log("💾 DEBUG: Conversaciones guardadas en localStorage:", savedConversations);
        
        if (savedConversations) {
          const conversations = JSON.parse(savedConversations);
          const currentConv = conversations.find((conv: Conversation) => conv.id === activeConversation);
          
          if (currentConv) {
            console.log("✅ DEBUG: Conversación encontrada:", currentConv);
            setCurrentMatchPoints(currentConv.matchPoints || 0);
            setMetTraits(currentConv.metTraits || []);
            
            // Si hay mensajes guardados, usarlos en lugar de los del simulador
            if (currentConv.messages && currentConv.messages.length > 0) {
              setMessages(currentConv.messages);
              console.log("📱 DEBUG: Usando mensajes guardados:", currentConv.messages);
            }
          } else {
            console.log("🆕 DEBUG: Nueva conversación, inicializando puntos");
            // Inicializar para una nueva conversación
            setCurrentMatchPoints(0);
            setMetTraits([]);
          }
        }
      } catch (e) {
        console.error("❌ DEBUG: Error al cargar datos de conversación:", e);
      }
    }
  }, [activeConversation]);

  // Guardar conversación actual con puntos de compatibilidad
  useEffect(() => {
    const saveConversation = async () => {
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
            // Crear nueva conversación - intentar obtener username real
            let realUsername = `user_${activeConversation.slice(-4)}`;
            
            try {
              // Intentar obtener el username real desde los prospectos
              const { data: prospect } = await supabase
                .from('prospects')
                .select('username')
                .eq('prospect_instagram_id', activeConversation)
                .maybeSingle();
              
              if (prospect?.username) {
                realUsername = prospect.username;
                console.log(`✅ Username encontrado para nueva conversación: ${realUsername}`);
              } else {
                console.log(`⚠️ No username encontrado para ${activeConversation}, usando fallback: ${realUsername}`);
              }
            } catch (error) {
              console.log('Error obteniendo username:', error);
            }
            
            conversations.push({
              id: activeConversation,
              userName: realUsername,
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
          window.dispatchEvent(new CustomEvent('conversations-updated'));
          
          console.log("💾 DEBUG: Conversación guardada con puntos:", currentMatchPoints, "características:", metTraits);
        } catch (e) {
          console.error("❌ DEBUG: Error al guardar conversación:", e);
        }
      }
    };

    saveConversation();
  }, [activeConversation, currentMatchPoints, metTraits, messages]);

  // 🔥 NUEVO: Analizar automáticamente cuando cambian los mensajes
  useEffect(() => {
    if (messages.length > 0 && idealTraits.length > 0) {
      console.log("🤖 DEBUG: TRIGGER - Mensajes cambiaron, analizando automáticamente...");
      console.log("📊 DEBUG: Total mensajes:", messages.length);
      console.log("🎯 DEBUG: Características disponibles:", idealTraits.filter(t => t.enabled).length);
      
      // Solo analizar si hay mensajes del usuario
      const userMessages = messages.filter(m => m.sender === 'user');
      if (userMessages.length > 0) {
        console.log("👤 DEBUG: Mensajes de usuario encontrados:", userMessages.length);
        analyzeConversationForTraits(messages);
      } else {
        console.log("⚠️ DEBUG: No hay mensajes de usuario para analizar");
      }
    }
  }, [messages, idealTraits]);

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
    idealClientTraits: idealTraits.filter(trait => trait.enabled).map(trait => trait.trait)
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

  // Función mejorada para analizar conversación con IA
  const analyzeConversationForTraits = async (newMessages: Message[]) => {
    console.log("🤖 DEBUG: === INICIANDO ANÁLISIS AUTOMÁTICO ===");
    console.log("📊 DEBUG: Número de características ideales:", idealTraits.length);
    console.log("🎯 DEBUG: Características habilitadas:", idealTraits.filter(t => t.enabled));
    console.log("💬 DEBUG: Número de mensajes a analizar:", newMessages.length);
    console.log("📝 DEBUG: Mensajes del usuario:", newMessages.filter(m => m.sender === 'user'));
    
    if (idealTraits.length === 0) {
      console.log("⚠️ DEBUG: No hay características para analizar");
      return;
    }

    // Verificar si hay OpenAI configurado
    const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
    console.log("🔑 DEBUG: OpenAI Key configurada:", openaiKey ? 'SÍ' : 'NO');

    try {
      // Convertir mensajes al formato esperado
      const conversationMessages = newMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));

      console.log("🔄 DEBUG: Enviando a analyzeConversation...");
      
      // Usar el análisis con IA
      const result = await analyzeConversation(conversationMessages);
      
      console.log("✅ DEBUG: Resultado del análisis AUTOMÁTICO:", result);
      
      // Actualizar estado local INMEDIATAMENTE
      console.log("🔄 DEBUG: Actualizando estado local...");
      setCurrentMatchPoints(result.matchPoints);
      setMetTraits(result.metTraits);
      
      console.log("🎯 DEBUG: Puntos actualizados AUTOMÁTICAMENTE:", result.matchPoints);
      console.log("📋 DEBUG: Características detectadas AUTOMÁTICAMENTE:", result.metTraits);
      
      // Actualizar en localStorage
      if (activeConversation) {
        updateConversationInStorage(activeConversation, result.matchPoints, result.metTraits);
      }
      
      // Mostrar toast si se detectaron nuevas características
      if (result.matchPoints > 0) {
        toast({
          title: `🎯 ¡${result.matchPoints} característica${result.matchPoints > 1 ? 's' : ''} detectada${result.matchPoints > 1 ? 's' : ''}!`,
          description: `Puntuación: ${result.matchPoints}/${idealTraits.filter(t => t.enabled).length} estrella${result.matchPoints !== 1 ? 's' : ''}`,
        });
      }
      
      console.log("✅ DEBUG: Análisis AUTOMÁTICO completado exitosamente");
      
    } catch (error) {
      console.error("❌ DEBUG: Error en análisis AUTOMÁTICO:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) {
      console.log("⚠️ DEBUG: No se puede enviar mensaje - mensaje vacío o sin conversación activa");
      return;
    }

    console.log("📤 DEBUG: === ENVIANDO MENSAJE CON IA ESTRATÉGICA ===");
    console.log("💬 DEBUG: Mensaje:", newMessage);
    console.log("🎯 DEBUG: Conversación activa:", activeConversation);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setNewMessage('');

    console.log("📊 DEBUG: Total de mensajes después del envío:", newMessages.length);

    // Respuesta automática estratégica de IA (si está habilitada)
    if (aiConfig.autoRespond) {
      console.log("🤖 DEBUG: IA estratégica configurada para responder automáticamente...");
      setIsTyping(true);
      
      setTimeout(async () => {
        let responseText = '';
        
        try {
          // Usar el nuevo sistema estratégico
          const conversationHistory = getOpenAIConversationHistory(newMessages);
          
          responseText = await handleStrategicAutomaticResponse(
            newMessage,
            activeConversation,
            conversationHistory
          );
          
          console.log("✅ DEBUG: Respuesta estratégica generada:", responseText);
        } catch (error) {
          console.error("❌ DEBUG: Error al generar respuesta estratégica:", error);
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
        
        console.log("🎯 DEBUG: Respuesta estratégica agregada, analizando automáticamente...");
        
        toast({
          title: "🎯 IA Estratégica Respondió",
          description: `${aiConfig.name} envió una respuesta enfocada en descubrir características del cliente ideal`,
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
      <div className="flex flex-col p-4 border-t border-purple-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            🎯 Compatibilidad automática
            {isAnalyzing && (
              <span className="ml-2 text-xs text-blue-600 animate-pulse">
                Analizando en tiempo real...
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
            <p className="text-sm text-green-600">
              ● Activo - Respuestas automáticas: {aiConfig.autoRespond ? 'ON' : 'OFF'}
              {isAnalyzing && <span className="ml-2 text-blue-600 animate-pulse">Analizando con IA...</span>}
            </p>
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

      {/* Indicador de compatibilidad automática */}
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
