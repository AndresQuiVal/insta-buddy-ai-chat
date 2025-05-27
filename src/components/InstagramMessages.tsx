
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw, Settings, Clock } from 'lucide-react';
import { handleAutomaticResponse } from '@/services/openaiService';

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

interface Conversation {
  sender_id: string;
  messages: InstagramMessage[];
  last_message: InstagramMessage;
  unread_count: number;
}

const InstagramMessages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [aiDelay, setAiDelay] = useState(3); // Delay en segundos
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    loadConversations();
    
    // Suscribirse a nuevos mensajes en tiempo real
    const subscription = supabase
      .channel('instagram-messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'instagram_messages'
      }, (payload) => {
        console.log('Nuevo mensaje recibido:', payload);
        const newMessage = payload.new as InstagramMessage;
        
        // Solo generar respuesta automática para mensajes recibidos (no enviados)
        if (newMessage.message_type === 'received' && aiEnabled) {
          handleNewIncomingMessage(newMessage);
        }
        
        loadConversations();
        toast({
          title: "Nuevo mensaje",
          description: `Mensaje de ${getUserDisplayName(newMessage.sender_id)}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [aiEnabled, aiDelay]);

  const loadConversations = async () => {
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
          description: "No se pudieron cargar los mensajes",
          variant: "destructive"
        });
        return;
      }

      // Filtrar mensajes reales y agrupar por conversación
      const realMessages = data?.filter((message: any) => {
        return !message.sender_id.includes('webhook_') && 
               !message.sender_id.includes('debug') && 
               !message.sender_id.includes('error') &&
               !message.message_text.includes('PAYLOAD COMPLETO') &&
               !message.message_text.includes('ERROR:') &&
               message.sender_id !== 'diagnostic_user';
      }) || [];

      // Agrupar mensajes por conversación
      const conversationGroups: { [key: string]: InstagramMessage[] } = {};
      
      realMessages.forEach((message: any) => {
        const conversationKey = message.message_type === 'sent' ? message.recipient_id : message.sender_id;
        if (!conversationGroups[conversationKey]) {
          conversationGroups[conversationKey] = [];
        }
        conversationGroups[conversationKey].push(message);
      });

      // Convertir a array de conversaciones
      const conversationsArray = Object.entries(conversationGroups).map(([sender_id, messages]) => {
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const unreadCount = messages.filter(msg => msg.message_type === 'received').length;
        
        return {
          sender_id,
          messages: sortedMessages,
          last_message: messages[0], // El más reciente
          unread_count: unreadCount
        };
      }).sort((a, b) => 
        new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
      );

      setConversations(conversationsArray);
      
      // Seleccionar la primera conversación si no hay ninguna seleccionada
      if (!selectedConversation && conversationsArray.length > 0) {
        setSelectedConversation(conversationsArray[0].sender_id);
      }

    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewIncomingMessage = async (message: InstagramMessage) => {
    if (!aiEnabled) return;

    console.log(`Generando respuesta automática en ${aiDelay} segundos...`);
    
    // Delay antes de responder
    setTimeout(async () => {
      try {
        // Configuración básica del negocio (esto se puede hacer configurable después)
        const businessConfig = {
          businessName: "Hower Assistant",
          businessDescription: "Asistente inteligente para Instagram",
          tone: "Amigable, profesional y servicial",
          idealClientTraits: [
            "Interesado en nuestros productos o servicios",
            "Tiene presupuesto adecuado",
            "Está listo para tomar decisiones",
            "Se encuentra en nuestra zona de servicio"
          ]
        };

        const aiResponse = await handleAutomaticResponse(
          message.message_text,
          [], // Historial vacío por ahora
          businessConfig
        );

        // Guardar la respuesta automática
        await supabase
          .from('instagram_messages')
          .insert({
            instagram_message_id: `ai_response_${Date.now()}`,
            sender_id: 'hower_bot',
            recipient_id: message.sender_id,
            message_text: aiResponse,
            message_type: 'sent',
            timestamp: new Date().toISOString(),
            raw_data: { 
              auto_response: true,
              original_message_id: message.instagram_message_id,
              delay_used: aiDelay
            }
          });

        console.log('Respuesta automática enviada:', aiResponse);
      } catch (error) {
        console.error('Error generando respuesta automática:', error);
      }
    }, aiDelay * 1000);
  };

  const getUserDisplayName = (senderId: string) => {
    if (senderId === 'hower_bot') return 'Hower Assistant';
    if (senderId.length > 8) {
      return `Usuario ${senderId.slice(-4)}`;
    }
    return `Usuario ${senderId}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);

      // Guardar el mensaje enviado manualmente
      await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: `manual_${Date.now()}`,
          sender_id: 'hower_bot',
          recipient_id: selectedConversation,
          message_text: newMessage.trim(),
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: { manual_response: true }
        });

      setNewMessage('');
      loadConversations();

      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje fue enviado exitosamente",
      });

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: "Error enviando mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const selectedMessages = conversations.find(conv => conv.sender_id === selectedConversation)?.messages || [];

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex">
      {/* Panel de configuración */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-semibold mb-4">Configuración de IA</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Respuestas automáticas habilitadas</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delay de respuesta (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={aiDelay}
                  onChange={(e) => setAiDelay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de conversaciones (bandejas) */}
      <div className="w-1/3 border-r border-purple-100">
        <div className="p-4 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Bandejas</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Configuración de IA"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={loadConversations}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Indicador de estado de IA */}
          <div className="flex items-center gap-2 mt-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              IA {aiEnabled ? 'Activa' : 'Inactiva'} • {aiDelay}s delay
            </span>
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-100px)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No hay conversaciones aún</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.sender_id}
                onClick={() => setSelectedConversation(conversation.sender_id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.sender_id ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 truncate">
                        {getUserDisplayName(conversation.sender_id)}
                      </h4>
                      {conversation.unread_count > 0 && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message.message_text}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(conversation.last_message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat de la conversación seleccionada */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {getUserDisplayName(selectedConversation)}
                  </h3>
                  <p className="text-sm text-green-600">● En línea</p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.message_type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.message_type === 'sent' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.message_type === 'sent' 
                        ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.message_type === 'sent' ? (
                        <Bot className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.message_type === 'sent'
                        ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.message_text}</p>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        message.message_type === 'sent' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.raw_data?.auto_response && (
                          <Bot className="w-3 h-3" />
                        )}
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t border-purple-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona una bandeja</h3>
              <p className="text-gray-500">Elige una conversación para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramMessages;
