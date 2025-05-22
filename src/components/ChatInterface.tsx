
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversation, aiConfig }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeConversation && conversationData[activeConversation]) {
      setMessages(conversationData[activeConversation]);
    } else if (activeConversation) {
      setMessages([]);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = (userMessage: string): string => {
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    if (aiConfig.autoRespond) {
      setIsTyping(true);
      
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: generateAIResponse(newMessage),
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
        
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
                  {message.timestamp.toLocaleTimeString()}
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
