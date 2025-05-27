import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw } from 'lucide-react';

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

interface ConversationGroup {
  sender_id: string;
  messages: InstagramMessage[];
  last_message: InstagramMessage;
}

const InstagramMessages: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    loadInstagramMessages(false); // No mostrar toast en la carga inicial
    
    // Suscribirse a nuevos mensajes en tiempo real
    const subscription = supabase
      .channel('instagram-messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'instagram_messages'
      }, (payload) => {
        console.log('Nuevo mensaje recibido en tiempo real:', payload);
        // Solo recargar mensajes y mostrar toast si es un mensaje real, no de debug
        const newMessage = payload.new as InstagramMessage;
        
        // Filtrar mensajes de debug/webhook
        if (!newMessage.sender_id.includes('webhook_') && 
            !newMessage.sender_id.includes('debug') && 
            !newMessage.sender_id.includes('error') &&
            !newMessage.message_text.includes('PAYLOAD COMPLETO') &&
            !newMessage.message_text.includes('ERROR:') &&
            newMessage.sender_id !== 'diagnostic_user' &&
            newMessage.sender_id !== 'hower_bot') {
          
          toast({
            title: "Nuevo mensaje",
            description: `Mensaje de ${getUserDisplayName(newMessage.sender_id)}`,
          });
        }
        
        // Recargar mensajes sin mostrar toast adicional
        loadInstagramMessages(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadInstagramMessages = async (showToast = true) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading Instagram messages:', error);
        if (showToast) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los mensajes de Instagram",
            variant: "destructive"
          });
        }
        return;
      }

      // Filtrar mensajes de payload/debug que no son conversaciones reales
      const realMessages = data?.filter((message: any) => {
        // Filtrar mensajes de debug, payload completo, errores, etc.
        return !message.sender_id.includes('webhook_') && 
               !message.sender_id.includes('debug') && 
               !message.sender_id.includes('error') &&
               !message.message_text.includes('PAYLOAD COMPLETO') &&
               !message.message_text.includes('ERROR:') &&
               message.sender_id !== 'diagnostic_user';
      }) || [];

      // Verificar si hay nuevos mensajes reales para mostrar toast solo cuando sea necesario
      if (showToast && realMessages.length > lastMessageCount && lastMessageCount > 0) {
        const newMessagesCount = realMessages.length - lastMessageCount;
        toast({
          title: "Mensajes actualizados",
          description: `Se encontraron ${newMessagesCount} mensajes nuevos`,
        });
      }
      
      setLastMessageCount(realMessages.length);

      // Agrupar mensajes por conversación
      const conversationGroups: { [key: string]: InstagramMessage[] } = {};
      
      realMessages.forEach((message: any) => {
        const conversationKey = message.message_type === 'sent' ? message.recipient_id : message.sender_id;
        if (!conversationGroups[conversationKey]) {
          conversationGroups[conversationKey] = [];
        }
        conversationGroups[conversationKey].push(message);
      });

      // Convertir a array y ordenar por último mensaje
      const conversationsArray = Object.entries(conversationGroups).map(([sender_id, messages]) => ({
        sender_id,
        messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        last_message: messages[0] // El más reciente
      })).sort((a, b) => 
        new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
      );

      setConversations(conversationsArray);
      
      // Seleccionar la primera conversación si no hay ninguna seleccionada
      if (!selectedConversation && conversationsArray.length > 0) {
        setSelectedConversation(conversationsArray[0].sender_id);
      }

    } catch (error) {
      console.error('Error in loadInstagramMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener nombre de usuario más legible
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

      const { data, error } = await supabase.functions.invoke('instagram-send-message', {
        body: {
          recipient_id: selectedConversation,
          message_text: newMessage.trim()
        }
      });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje",
          variant: "destructive"
        });
        return;
      }

      // Guardar el mensaje enviado en la base de datos
      await supabase
        .from('instagram_messages')
        .insert({
          instagram_message_id: data.message_id || `sent_${Date.now()}`,
          sender_id: 'hower_bot',
          recipient_id: selectedConversation,
          message_text: newMessage.trim(),
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          raw_data: data
        });

      setNewMessage('');
      loadInstagramMessages(false); // No mostrar toast al enviar mensaje

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
          <p className="text-gray-600">Cargando mensajes de Instagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex">
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r border-purple-100">
        <div className="p-4 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Conversaciones Instagram</h3>
            <button
              onClick={() => loadInstagramMessages(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-80px)]">
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
                    <h4 className="font-medium text-gray-800 truncate">
                      {getUserDisplayName(conversation.sender_id)}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message.message_text}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(conversation.last_message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                      <p className={`text-xs mt-1 ${
                        message.message_type === 'sent' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
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
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona una conversación</h3>
              <p className="text-gray-500">Elige una conversación para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramMessages;
