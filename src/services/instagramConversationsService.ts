
import { supabase } from '@/integrations/supabase/client';

export interface InstagramConversation {
  id: string;
  updated_time: string;
  participants: {
    data: Array<{
      id: string;
      username?: string;
      name?: string;
    }>;
  };
  messages: {
    data: Array<{
      id: string;
      created_time: string;
      from: {
        id: string;
        username?: string;
      };
      message?: string;
      story_mention?: any;
      attachments?: {
        data: Array<{
          id: string;
          mime_type: string;
          name: string;
          size: number;
        }>;
      };
    }>;
  };
}

export interface ConversationProspect {
  id: string;
  userId: string;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  state: 'En seguimiento' | 'Esperando respuesta';
  isFromOwner: boolean;
}

/**
 * Obtiene las conversaciones usando Instagram Graph API
 */
export const getInstagramConversations = async (): Promise<ConversationProspect[]> => {
  try {
    const token = localStorage.getItem('hower-instagram-token');
    const userDataString = localStorage.getItem('hower-instagram-user');
    
    if (!token) {
      throw new Error('No hay token de Instagram disponible');
    }

    if (!userDataString) {
      throw new Error('No hay información de usuario disponible');
    }

    const userData = JSON.parse(userDataString);
    const ownerId = userData.instagram?.id || userData.facebook?.id;
    
    if (!ownerId) {
      throw new Error('No se pudo obtener el ID del propietario de la cuenta');
    }

    console.log('🔍 Obteniendo conversaciones para owner ID:', ownerId);

    // Llamar a la API de conversaciones de Instagram
    const conversationsResponse = await fetch(
      `https://graph.instagram.com/v23.0/me/conversations?platform=instagram&access_token=${token}`
    );

    if (!conversationsResponse.ok) {
      const errorData = await conversationsResponse.json();
      console.error('❌ Error obteniendo conversaciones:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo conversaciones');
    }

    const conversationsData = await conversationsResponse.json();
    console.log('✅ Conversaciones obtenidas:', conversationsData);

    if (!conversationsData.data || conversationsData.data.length === 0) {
      console.log('ℹ️ No hay conversaciones disponibles');
      return [];
    }

    // Procesar cada conversación
    const prospects: ConversationProspect[] = [];

    for (const conversation of conversationsData.data) {
      try {
        const prospect = processConversation(conversation, ownerId);
        if (prospect) {
          prospects.push(prospect);
        }
      } catch (error) {
        console.warn(`Error procesando conversación ${conversation.id}:`, error);
      }
    }

    // Ordenar por tiempo del último mensaje (más reciente primero)
    prospects.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    console.log(`✅ ${prospects.length} prospectos procesados exitosamente`);
    return prospects;

  } catch (error) {
    console.error('❌ Error en getInstagramConversations:', error);
    throw error;
  }
};

/**
 * Procesa una conversación individual para crear un prospecto
 */
function processConversation(conversation: InstagramConversation, ownerId: string): ConversationProspect | null {
  try {
    // Encontrar el participante que no es el owner
    const otherParticipant = conversation.participants?.data?.find(p => p.id !== ownerId);
    
    if (!otherParticipant) {
      console.warn(`No se encontró otro participante en conversación ${conversation.id}`);
      return null;
    }

    // Obtener el último mensaje
    const messages = conversation.messages?.data || [];
    if (messages.length === 0) {
      console.warn(`No hay mensajes en conversación ${conversation.id}`);
      return null;
    }

    // Los mensajes vienen ordenados por created_time descendente
    const lastMessage = messages[0];
    
    // Determinar si el último mensaje es del owner
    const isFromOwner = lastMessage.from.id === ownerId;
    
    // Determinar el estado según quién envió el último mensaje
    const state = isFromOwner ? 'En seguimiento' : 'Esperando respuesta';

    // Extraer texto del mensaje
    let messageText = lastMessage.message || '';
    
    // Si no hay texto, verificar si es una story mention
    if (!messageText && lastMessage.story_mention) {
      messageText = '[Mencionó en historia]';
    }
    
    // Si no hay texto, verificar si hay adjuntos
    if (!messageText && lastMessage.attachments?.data?.length) {
      const attachment = lastMessage.attachments.data[0];
      messageText = `[${attachment.mime_type?.includes('image') ? 'Imagen' : 'Archivo'}]`;
    }
    
    // Fallback si no hay contenido
    if (!messageText) {
      messageText = '[Mensaje sin contenido]';
    }

    return {
      id: conversation.id,
      userId: otherParticipant.id,
      username: otherParticipant.username || otherParticipant.name || `Usuario ${otherParticipant.id.slice(-4)}`,
      lastMessage: messageText,
      lastMessageTime: lastMessage.created_time,
      state,
      isFromOwner
    };

  } catch (error) {
    console.error(`Error procesando conversación ${conversation.id}:`, error);
    return null;
  }
}

/**
 * Formatea la fecha para mostrar en la UI
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Ahora';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d`;
  }
};
