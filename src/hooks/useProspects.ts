
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

    console.log(`🔍 Determinando estado para prospecto:`, {
      totalMessages: messages.length,
      lastMessageType: lastMessage.message_type,
      lastMessageTime: lastMessage.timestamp,
      hasInvitations: messages.some(msg => msg.is_invitation === true)
    });

    // Verificar si hay invitaciones enviadas
    const hasInvitation = messages.some(msg => msg.is_invitation === true && msg.message_type === 'sent');
    if (hasInvitation) {
      console.log(`✅ Estado: INVITED (hay invitación enviada)`);
      return 'invited';
    }

    // Si el último mensaje lo recibí (el prospecto me escribió) = necesita respuesta
    if (lastMessage.message_type === 'received') {
      console.log(`✅ Estado: NO_RESPONSE (último mensaje es recibido)`);
      return 'no_response';
    }

    // Si el último mensaje lo envié yo
    if (lastMessage.message_type === 'sent') {
      const lastSentTime = new Date(lastMessage.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);

      console.log(`📊 Último mensaje enviado hace ${hoursSinceLastSent.toFixed(1)} horas`);

      // Si han pasado más de 24 horas sin respuesta
      if (hoursSinceLastSent > 24) {
        // Verificar si ya había una conversación previa (si el prospecto había respondido antes)
        const receivedMessages = messages.filter(msg => msg.message_type === 'received');
        if (receivedMessages.length > 0) {
          console.log(`✅ Estado: REACTIVATION_SENT (${hoursSinceLastSent.toFixed(1)}h sin respuesta, había conversación)`);
          return 'reactivation_sent';
        } else {
          console.log(`✅ Estado: NO_RESPONSE (${hoursSinceLastSent.toFixed(1)}h sin respuesta, primera vez)`);
          return 'no_response';
        }
      } else {
        console.log(`✅ Estado: FIRST_MESSAGE_SENT (mensaje reciente: ${hoursSinceLastSent.toFixed(1)}h)`);
        return 'first_message_sent';
      }
    }

    return 'first_message_sent';
  };

  const extractUsernameFromMessage = (messages: any[]): string => {
    // Intentar obtener el username real del raw_data
    for (const message of messages) {
      if (message.raw_data) {
        // Buscar username en diferentes ubicaciones del raw_data
        if (message.raw_data.username) {
          return `@${message.raw_data.username}`;
        }
        if (message.raw_data.user?.username) {
          return `@${message.raw_data.user.username}`;
        }
        if (message.raw_data.profile?.username) {
          return `@${message.raw_data.profile.username}`;
        }
        if (message.raw_data.from?.username) {
          return `@${message.raw_data.from.username}`;
        }
      }
    }
    
    // Si no se encuentra username en raw_data, usar el sender_id como fallback
    const senderId = messages[0]?.sender_id;
    if (senderId) {
      // Crear un username más legible basado en el sender_id
      const shortId = senderId.slice(-8);
      return `@usuario_${shortId}`;
    }
    
    return 'Usuario desconocido';
  };

  const fetchProspects = async () => {
    try {
      setLoading(true);
      console.log('🔄 Obteniendo prospectos...');

      // Obtener todos los mensajes agrupados por sender_id
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log(`📊 Total mensajes obtenidos: ${messages?.length || 0}`);

      // Agrupar mensajes por sender_id
      const messagesBySender = messages?.reduce((acc: any, message) => {
        const senderId = message.sender_id;
        if (!acc[senderId]) {
          acc[senderId] = [];
        }
        acc[senderId].push(message);
        return acc;
      }, {}) || {};

      console.log(`👥 Prospectos únicos encontrados: ${Object.keys(messagesBySender).length}`);

      // Crear prospectos a partir de los mensajes agrupados
      const prospectsData: Prospect[] = Object.entries(messagesBySender).map(([senderId, senderMessages]: [string, any]) => {
        const sortedMessages = senderMessages.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const lastMessage = sortedMessages[0];
        const state = determineProspectState(senderMessages);
        const username = extractUsernameFromMessage(senderMessages);

        console.log(`👤 Prospecto ${username} (${senderId}):`, {
          totalMessages: senderMessages.length,
          lastMessageType: lastMessage.message_type,
          state: state,
          lastMessageTime: lastMessage.timestamp
        });

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

      console.log(`✅ Prospectos procesados: ${prospectsData.length}`);
      console.log('Estados:', prospectsData.reduce((acc, p) => {
        acc[p.state] = (acc[p.state] || 0) + 1;
        return acc;
      }, {} as any));

      setProspects(prospectsData);
    } catch (error) {
      console.error('💥 Error in fetchProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();

    // Suscribirse a cambios en tiempo real
    console.log('🔄 Configurando suscripción en tiempo real...');
    const channel = supabase
      .channel('prospect-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_messages'
        },
        (payload) => {
          console.log('📨 Mensaje actualizado en tiempo real:', payload);
          console.log('🔄 Recargando prospectos...');
          fetchProspects();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando suscripción en tiempo real');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    prospects,
    loading,
    refetch: fetchProspects
  };
};
