
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  senderId: string;
  username: string;
  state: 'primer_mensaje_enviado' | 'seguimiento' | 'sin_contestar' | 'invitado';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  conversationMessages: any[];
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const determineProspectState = (messages: any[]): 'primer_mensaje_enviado' | 'seguimiento' | 'sin_contestar' | 'invitado' => {
    if (messages.length === 0) return 'primer_mensaje_enviado';

    // Ordenar mensajes por timestamp
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastMessage = sortedMessages[sortedMessages.length - 1];

    // Verificar si hay invitaciones enviadas
    const hasInvitation = messages.some(msg => msg.is_invitation === true && msg.message_type === 'sent');
    if (hasInvitation) {
      return 'invitado';
    }

    // Si el último mensaje lo recibí (el prospecto me escribió) = necesita respuesta
    if (lastMessage.message_type === 'received') {
      return 'sin_contestar';
    }

    // Si el último mensaje lo envié yo
    if (lastMessage.message_type === 'sent') {
      const lastSentTime = new Date(lastMessage.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);

      // Si han pasado más de 24 horas sin respuesta
      if (hoursSinceLastSent > 24) {
        // Verificar si ya había una conversación previa (si el prospecto había respondido antes)
        const receivedMessages = messages.filter(msg => msg.message_type === 'received');
        if (receivedMessages.length > 0) {
          return 'seguimiento';
        } else {
          return 'sin_contestar';
        }
      } else {
        return 'primer_mensaje_enviado';
      }
    }

    return 'primer_mensaje_enviado';
  };

  const extractUsernameFromMessage = (messages: any[]): string => {
    // Buscar en raw_data por el username real de Instagram
    for (const message of messages) {
      if (message.raw_data) {
        // Intentar extraer username de diferentes lugares en raw_data
        if (message.raw_data.entry?.[0]?.messaging?.[0]?.sender?.id) {
          // Si hay información del usuario en los datos
          if (message.raw_data.user?.username) {
            return `@${message.raw_data.user.username}`;
          }
          // Si hay información en el perfil
          if (message.raw_data.profile?.username) {
            return `@${message.raw_data.profile.username}`;
          }
        }
        
        // Intentar otros campos comunes donde puede estar el username
        if (message.raw_data.username) {
          return `@${message.raw_data.username}`;
        }
        if (message.raw_data.from?.username) {
          return `@${message.raw_data.from.username}`;
        }
      }
    }
    
    // Si no se encuentra username en raw_data, usar el sender_id como fallback
    const senderId = messages[0]?.sender_id;
    return senderId ? `Usuario ${senderId.slice(-4)}` : 'Usuario desconocido';
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
        const username = extractUsernameFromMessage(senderMessages);

        return {
          id: senderId,
          senderId,
          username,
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
          console.log('Mensaje actualizado, recargando prospectos...');
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
