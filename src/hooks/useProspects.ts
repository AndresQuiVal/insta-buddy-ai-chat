import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  senderId: string;
  username: string;
  state: 'first_message_sent' | 'reactivation_sent' | 'no_response' | 'invited' | 'follow_up';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  conversationMessages: any[];
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const determineProspectState = (messages: any[]): 'first_message_sent' | 'reactivation_sent' | 'no_response' | 'invited' | 'follow_up' => {
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

      // Verificar si ya había una conversación previa (si el prospecto había respondido antes)
      const receivedMessages = messages.filter(msg => msg.message_type === 'received');
      
      if (receivedMessages.length > 0) {
        // Ya había conversación previa
        if (hoursSinceLastSent > 24) {
          console.log(`✅ Estado: REACTIVATION_SENT (${hoursSinceLastSent.toFixed(1)}h sin respuesta, había conversación)`);
          return 'reactivation_sent';
        } else {
          console.log(`✅ Estado: FOLLOW_UP (mensaje reciente con conversación previa: ${hoursSinceLastSent.toFixed(1)}h)`);
          return 'follow_up';
        }
      } else {
        // No había conversación previa (el usuario nunca ha respondido)
        if (hoursSinceLastSent > 24) {
          console.log(`✅ Estado: NO_RESPONSE (${hoursSinceLastSent.toFixed(1)}h sin respuesta, primera vez)`);
          return 'no_response';
        } else {
          console.log(`✅ Estado: FIRST_MESSAGE_SENT (mensaje reciente, primera vez: ${hoursSinceLastSent.toFixed(1)}h)`);
          return 'first_message_sent';
        }
      }
    }

    return 'first_message_sent';
  };

  const fetchInstagramUsername = async (senderId: string): Promise<string> => {
    try {
      console.log(`🔍 Obteniendo username real para sender_id: ${senderId}`);
      
      // Intentar obtener el token de Instagram desde localStorage
      const instagramToken = localStorage.getItem('hower-instagram-token');
      
      if (!instagramToken) {
        console.log('❌ No hay token de Instagram disponible');
        return `@user_${senderId.slice(-8)}`;
      }

      // Llamar a la API de Instagram para obtener información del usuario
      const response = await fetch(
        `https://graph.instagram.com/${senderId}?fields=username,name&access_token=${instagramToken}`
      );

      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ Username obtenido de Instagram:`, userData);
        
        if (userData.username) {
          return `@${userData.username}`;
        }
      } else {
        console.log(`❌ Error al obtener username de Instagram:`, response.status);
      }
    } catch (error) {
      console.error('Error fetching Instagram username:', error);
    }

    // Fallback: usar el sender_id acortado
    return `@user_${senderId.slice(-8)}`;
  };

  const extractUsernameFromMessage = async (messages: any[], senderId: string): Promise<string> => {
    // Primero intentar obtener el username real de Instagram
    const realUsername = await fetchInstagramUsername(senderId);
    if (realUsername && !realUsername.includes('user_')) {
      return realUsername;
    }

    // Intentar obtener el username del raw_data como fallback
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
        if (message.raw_data.sender?.username) {
          return `@${message.raw_data.sender.username}`;
        }
        // Buscar en el webhook data original
        if (message.raw_data.original_event?.sender?.username) {
          return `@${message.raw_data.original_event.sender.username}`;
        }
        if (message.raw_data.original_change?.sender?.username) {
          return `@${message.raw_data.original_change.sender.username}`;
        }
      }
    }
    
    // Si no se encuentra username, usar el que ya obtuvimos del API o el fallback
    return realUsername;
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
      const prospectsData: Prospect[] = await Promise.all(
        Object.entries(messagesBySender).map(async ([senderId, senderMessages]: [string, any]) => {
          const sortedMessages = senderMessages.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const lastMessage = sortedMessages[0];
          const state = determineProspectState(senderMessages);
          const username = await extractUsernameFromMessage(senderMessages, senderId);

          console.log(`👤 Prospecto ${username} (${senderId}):`, {
            totalMessages: senderMessages.length,
            lastMessageType: lastMessage.message_type,
            state: state,
            lastMessageTime: lastMessage.timestamp,
            hasReceivedMessages: senderMessages.filter((msg: any) => msg.message_type === 'received').length
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
        })
      );

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
