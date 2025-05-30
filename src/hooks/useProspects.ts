
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  senderId: string;
  username: string;
  state: 'first_message_sent' | 'reactivation_sent' | 'no_response' | 'invited';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  conversationMessages: any[];
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const determineProspectState = (messages: any[]): 'first_message_sent' | 'reactivation_sent' | 'no_response' | 'invited' => {
    if (messages.length === 0) return 'first_message_sent';

    // Ordenar mensajes por timestamp
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastMessage = sortedMessages[sortedMessages.length - 1];

    // Verificar si hay invitaciones enviadas
    const hasInvitation = messages.some(msg => msg.is_invitation === true && msg.message_type === 'sent');
    if (hasInvitation) {
      return 'invited';
    }

    // Si el último mensaje lo envié yo
    if (lastMessage.message_type === 'sent') {
      const lastSentTime = new Date(lastMessage.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);

      // Si han pasado más de 24 horas sin respuesta
      if (hoursSinceLastSent > 24) {
        // Verificar si ya había una conversación previa
        const receivedMessages = messages.filter(msg => msg.message_type === 'received');
        if (receivedMessages.length > 0) {
          return 'reactivation_sent';
        } else {
          return 'no_response';
        }
      } else {
        return 'first_message_sent';
      }
    }

    // Si el último mensaje lo recibí (el prospecto me escribió)
    return 'no_response'; // Necesita respuesta
  };

  const fetchProspects = async () => {
    try {
      setLoading(true);

      // Obtener todos los mensajes agrupados por sender_id
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Agrupar mensajes por sender_id
      const messagesBySender = messages?.reduce((acc: any, message) => {
        const senderId = message.sender_id;
        if (!acc[senderId]) {
          acc[senderId] = [];
        }
        acc[senderId].push(message);
        return acc;
      }, {}) || {};

      // Crear prospectos a partir de los mensajes agrupados
      const prospectsData: Prospect[] = Object.entries(messagesBySender).map(([senderId, senderMessages]: [string, any]) => {
        const sortedMessages = senderMessages.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const lastMessage = sortedMessages[0];
        const state = determineProspectState(senderMessages);

        return {
          id: senderId,
          senderId,
          username: `Usuario ${senderId.slice(-4)}`,
          state,
          lastMessageTime: lastMessage.timestamp,
          lastMessageType: lastMessage.message_type,
          conversationMessages: senderMessages
        };
      });

      // Ordenar por tiempo del último mensaje (más reciente primero)
      prospectsData.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setProspects(prospectsData);
    } catch (error) {
      console.error('Error in fetchProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('prospect-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_messages'
        },
        () => {
          fetchProspects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    prospects,
    loading,
    refetch: fetchProspects
  };
};
