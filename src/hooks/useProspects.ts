import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  senderId: string;
  username: string;
  state: 'reactivation_sent' | 'no_response' | 'invited' | 'follow_up';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  conversationMessages: any[];
}

interface InstagramMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_type: 'sent' | 'received';
  message_text: string;
  timestamp: string;
  is_invitation?: boolean;
  raw_data?: any;
  [key: string]: any;
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const determineProspectState = (messages: InstagramMessage[], senderId: string): 'reactivation_sent' | 'no_response' | 'invited' | 'follow_up' => {
    console.log(`🔍 [${senderId.slice(-8)}] Determinando estado con ${messages.length} mensajes`);
    
    if (messages.length === 0) {
      console.log(`✅ [${senderId.slice(-8)}] Estado: NO_RESPONSE (sin mensajes)`);
      return 'no_response';
    }

    // CRÍTICO: Validar que TODOS los mensajes pertenecen al mismo sender_id
    const invalidMessages = messages.filter(msg => msg.sender_id !== senderId && msg.recipient_id !== senderId);
    if (invalidMessages.length > 0) {
      console.error(`❌ [${senderId.slice(-8)}] MENSAJES CONTAMINADOS! ${invalidMessages.length} mensajes no pertenecen a este prospecto:`, invalidMessages.map(m => m.sender_id));
    }

    // Filtrar y validar mensajes solo de este prospecto
    const validMessages = messages.filter(msg => msg.sender_id === senderId || msg.recipient_id === senderId);
    console.log(`📊 [${senderId.slice(-8)}] Mensajes válidos: ${validMessages.length}/${messages.length}`);

    // Ordenar mensajes por timestamp para este prospecto específico
    const sortedMessages = validMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastMessage = sortedMessages[sortedMessages.length - 1];

    console.log(`🔍 [${senderId.slice(-8)}] Último mensaje:`, {
      type: lastMessage.message_type,
      time: lastMessage.timestamp,
      text: lastMessage.message_text?.substring(0, 30) + '...'
    });

    // Verificar si hay invitaciones enviadas
    const hasInvitation = validMessages.some(msg => msg.is_invitation === true && msg.message_type === 'sent');
    if (hasInvitation) {
      console.log(`✅ [${senderId.slice(-8)}] Estado: INVITED (hay invitación enviada)`);
      return 'invited';
    }

    // Si el último mensaje lo recibí (el prospecto me escribió) = necesita respuesta
    if (lastMessage.message_type === 'received') {
      console.log(`✅ [${senderId.slice(-8)}] Estado: NO_RESPONSE (último mensaje es recibido)`);
      return 'no_response';
    }

    // Si el último mensaje lo envié yo
    if (lastMessage.message_type === 'sent') {
      const lastSentTime = new Date(lastMessage.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);

      console.log(`📊 [${senderId.slice(-8)}] Último mensaje enviado hace ${hoursSinceLastSent.toFixed(1)} horas`);

      // Verificar si ya había una conversación previa (si el prospecto había respondido antes)
      const receivedMessages = validMessages.filter(msg => msg.message_type === 'received');
      
      console.log(`💬 [${senderId.slice(-8)}] Respuestas del prospecto: ${receivedMessages.length}`);
      
      if (receivedMessages.length > 0) {
        // Ya había conversación previa - siempre debe estar en "follow_up" (En seguimiento)
        console.log(`✅ [${senderId.slice(-8)}] Estado: FOLLOW_UP (había conversación previa, ${receivedMessages.length} respuestas del prospecto)`);
        return 'follow_up';
      } else {
        // No había conversación previa (el usuario nunca ha respondido)
        if (hoursSinceLastSent > 24) {
          console.log(`✅ [${senderId.slice(-8)}] Estado: NO_RESPONSE (${hoursSinceLastSent.toFixed(1)}h sin respuesta, primera vez)`);
          return 'no_response';
        } else {
          console.log(`✅ [${senderId.slice(-8)}] Estado: FOLLOW_UP (mensaje reciente, considerado seguimiento: ${hoursSinceLastSent.toFixed(1)}h)`);
          return 'follow_up';
        }
      }
    }

    console.log(`✅ [${senderId.slice(-8)}] Estado: NO_RESPONSE (fallback)`);
    return 'no_response';
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

  const extractUsernameFromMessage = async (messages: InstagramMessage[], senderId: string): Promise<string> => {
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

  const createProspectFromMessages = async (senderId: string, senderMessages: InstagramMessage[]): Promise<Prospect> => {
    console.log(`👤 [${senderId.slice(-8)}] Procesando prospecto con ${senderMessages.length} mensajes`);
    
    // VALIDACIÓN CRÍTICA: Asegurar que TODOS los mensajes pertenecen a este sender
    const messagesForThisSender = senderMessages.filter(msg => 
      msg.sender_id === senderId || msg.recipient_id === senderId
    );
    
    if (messagesForThisSender.length !== senderMessages.length) {
      console.error(`❌ [${senderId.slice(-8)}] FILTRO DE SEGURIDAD: ${senderMessages.length - messagesForThisSender.length} mensajes eliminados por no pertenecer a este prospecto`);
    }

    const sortedMessages = messagesForThisSender.sort((a: InstagramMessage, b: InstagramMessage) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastMessage = sortedMessages[0];
    
    // Determinar estado basado SOLO en los mensajes de ESTE prospecto
    const state = determineProspectState(messagesForThisSender, senderId);
    const username = await extractUsernameFromMessage(messagesForThisSender, senderId);

    const receivedCount = messagesForThisSender.filter((msg: InstagramMessage) => msg.message_type === 'received').length;
    const sentCount = messagesForThisSender.filter((msg: InstagramMessage) => msg.message_type === 'sent').length;

    console.log(`👤 [${senderId.slice(-8)}] Prospecto ${username}:`, {
      totalMessages: messagesForThisSender.length,
      sent: sentCount,
      received: receivedCount,
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
      conversationMessages: messagesForThisSender
    };
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

      // Agrupar mensajes por sender_id con validación estricta
      const messagesBySender = messages?.reduce((acc: Record<string, InstagramMessage[]>, message: any) => {
        // Cast the database message to our InstagramMessage interface
        const instagramMessage: InstagramMessage = {
          ...message,
          message_type: message.message_type as 'sent' | 'received'
        };
        
        // Determinar el sender_id real (puede ser sender o recipient)
        const actualSenderId = instagramMessage.message_type === 'sent' ? instagramMessage.recipient_id : instagramMessage.sender_id;
        
        if (!acc[actualSenderId]) {
          acc[actualSenderId] = [];
        }
        acc[actualSenderId].push(instagramMessage);
        return acc;
      }, {}) || {};

      console.log(`👥 Prospectos únicos encontrados: ${Object.keys(messagesBySender).length}`);

      // Validar que no haya contaminación cruzada
      Object.entries(messagesBySender).forEach(([senderId, senderMessages]: [string, InstagramMessage[]]) => {
        const foreignMessages = senderMessages.filter((msg: InstagramMessage) => 
          msg.sender_id !== senderId && msg.recipient_id !== senderId
        );
        if (foreignMessages.length > 0) {
          console.error(`❌ CONTAMINACIÓN detectada en ${senderId}: ${foreignMessages.length} mensajes extraños`);
        }
      });

      // Crear prospectos a partir de los mensajes agrupados
      const prospectsData: Prospect[] = await Promise.all(
        Object.entries(messagesBySender).map(async ([senderId, senderMessages]: [string, InstagramMessage[]]) => {
          return await createProspectFromMessages(senderId, senderMessages);
        })
      );

      // Ordenar por tiempo del último mensaje (más reciente primero)
      prospectsData.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      console.log(`✅ Prospectos procesados: ${prospectsData.length}`);
      
      // Log detallado de estados finales
      const stateStats = prospectsData.reduce((acc, p) => {
        acc[p.state] = (acc[p.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 Estados finales:', stateStats);
      
      // Log específico de prospectos en seguimiento
      const followUpProspects = prospectsData.filter(p => p.state === 'follow_up');
      console.log(`🎯 Prospectos en SEGUIMIENTO: ${followUpProspects.length}`, 
        followUpProspects.map(p => `${p.username} (${p.senderId.slice(-8)})`));

      setProspects(prospectsData);
    } catch (error) {
      console.error('💥 Error in fetchProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSingleProspect = async (senderId: string) => {
    try {
      console.log(`🔄 Actualizando prospecto individual: ${senderId.slice(-8)}`);
      
      // Obtener solo los mensajes de este prospecto específico
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error(`❌ Error fetching messages for ${senderId}:`, error);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log(`ℹ️ No hay mensajes para ${senderId}, removiendo prospecto`);
        setProspects(prev => prev.filter(p => p.senderId !== senderId));
        return;
      }

      // Cast the database messages to our InstagramMessage interface
      const instagramMessages: InstagramMessage[] = messages.map(message => ({
        ...message,
        message_type: message.message_type as 'sent' | 'received'
      }));

      const updatedProspect = await createProspectFromMessages(senderId, instagramMessages);
      
      setProspects(prev => {
        const otherProspects = prev.filter(p => p.senderId !== senderId);
        const newList = [updatedProspect, ...otherProspects].sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        console.log(`✅ Prospecto ${senderId.slice(-8)} actualizado, nuevo estado: ${updatedProspect.state}`);
        return newList;
      });
    } catch (error) {
      console.error(`💥 Error updating prospect ${senderId}:`, error);
    }
  };

  useEffect(() => {
    fetchProspects();

    // Suscribirse a cambios en tiempo real con actualización optimizada
    console.log('🔄 Configurando suscripción en tiempo real optimizada...');
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
          
          // Identificar qué prospecto cambió
          const changedMessage = payload.new || payload.old;
          if (changedMessage && typeof changedMessage === 'object') {
            const message = changedMessage as any;
            const messageType = message.message_type as 'sent' | 'received';
            const affectedSenderId = messageType === 'sent' 
              ? message.recipient_id 
              : message.sender_id;
            
            console.log(`🎯 Actualizando solo prospecto afectado: ${affectedSenderId?.slice(-8)}`);
            
            // Actualizar solo el prospecto específico que cambió
            if (affectedSenderId) {
              updateSingleProspect(affectedSenderId);
            } else {
              console.log('🔄 No se pudo identificar prospecto afectado, recargando todo');
              fetchProspects();
            }
          }
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
