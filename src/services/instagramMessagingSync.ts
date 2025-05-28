
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InstagramConversation {
  id: string;
  participants: any[];
  updated_time: string;
  message_count: number;
}

interface InstagramMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    name?: string;
    username?: string;
  };
  to: {
    data: Array<{
      id: string;
      name?: string;
    }>;
  };
  message: string;
  attachments?: any[];
}

/**
 * Sincroniza conversaciones históricas desde Instagram Messaging API
 */
export const syncHistoricalConversations = async (accessToken: string) => {
  try {
    console.log('🔄 Iniciando sincronización de conversaciones históricas...');
    
    // Obtener información del usuario conectado
    const userInfo = await getUserInstagramAccountId(accessToken);
    if (!userInfo.instagramAccountId) {
      throw new Error('No se encontró cuenta de Instagram Business conectada');
    }

    // Obtener conversaciones de Instagram
    const conversations = await fetchInstagramConversations(accessToken, userInfo.instagramAccountId);
    console.log(`📱 Se encontraron ${conversations.length} conversaciones`);

    let syncedMessages = 0;
    let syncedConversations = 0;

    for (const conversation of conversations) {
      try {
        console.log(`📨 Sincronizando conversación ${conversation.id}...`);
        
        // Obtener mensajes de la conversación
        const messages = await fetchConversationMessages(accessToken, conversation.id);
        
        // Procesar y guardar mensajes
        for (const message of messages) {
          await saveHistoricalMessage(message, userInfo.instagramAccountId);
          syncedMessages++;
        }
        
        syncedConversations++;
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error sincronizando conversación ${conversation.id}:`, error);
      }
    }

    console.log(`✅ Sincronización completada: ${syncedMessages} mensajes, ${syncedConversations} conversaciones`);
    
    toast({
      title: "Sincronización completada",
      description: `Se sincronizaron ${syncedMessages} mensajes de ${syncedConversations} conversaciones`,
    });

    return {
      success: true,
      syncedMessages,
      syncedConversations
    };

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    
    toast({
      title: "Error de sincronización",
      description: error instanceof Error ? error.message : "Error desconocido",
      variant: "destructive"
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
};

/**
 * Obtiene el Instagram Account ID del usuario conectado
 */
async function getUserInstagramAccountId(accessToken: string) {
  // Obtener información del usuario de Facebook
  const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
  const userData = await userResponse.json();

  if (!userResponse.ok) {
    throw new Error(`Error obteniendo usuario: ${userData.error?.message}`);
  }

  // Obtener páginas con cuentas de Instagram
  const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=instagram_business_account,access_token&access_token=${accessToken}`);
  const pagesData = await pagesResponse.json();

  if (!pagesResponse.ok) {
    throw new Error(`Error obteniendo páginas: ${pagesData.error?.message}`);
  }

  // Buscar la primera página con Instagram Business
  const pageWithInstagram = pagesData.data?.find((page: any) => page.instagram_business_account);
  
  if (!pageWithInstagram) {
    throw new Error('No se encontró cuenta de Instagram Business conectada');
  }

  return {
    userId: userData.id,
    pageId: pageWithInstagram.id,
    instagramAccountId: pageWithInstagram.instagram_business_account.id,
    pageAccessToken: pageWithInstagram.access_token || accessToken
  };
}

/**
 * Obtiene la lista de conversaciones de Instagram
 */
async function fetchInstagramConversations(accessToken: string, instagramAccountId: string): Promise<InstagramConversation[]> {
  const conversationsUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}/conversations?fields=id,participants,updated_time,message_count&limit=50&access_token=${accessToken}`;
  
  const response = await fetch(conversationsUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo conversaciones: ${data.error?.message}`);
  }

  return data.data || [];
}

/**
 * Obtiene los mensajes de una conversación específica
 */
async function fetchConversationMessages(accessToken: string, conversationId: string): Promise<InstagramMessage[]> {
  const messagesUrl = `https://graph.facebook.com/v19.0/${conversationId}/messages?fields=id,created_time,from,to,message,attachments&limit=100&access_token=${accessToken}`;
  
  const response = await fetch(messagesUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo mensajes: ${data.error?.message}`);
  }

  return data.data || [];
}

/**
 * Guarda un mensaje histórico en la base de datos
 */
async function saveHistoricalMessage(message: InstagramMessage, instagramAccountId: string) {
  // Verificar si el mensaje ya existe
  const { data: existingMessage } = await supabase
    .from('instagram_messages')
    .select('id')
    .eq('instagram_message_id', message.id)
    .single();

  if (existingMessage) {
    console.log(`⏭️ Mensaje ${message.id} ya existe, omitiendo...`);
    return;
  }

  // Determinar quién envió el mensaje
  const isFromBusiness = message.from.id === instagramAccountId;
  const messageType = isFromBusiness ? 'sent' : 'received';
  
  // ID del otro participante (cliente)
  const otherParticipantId = isFromBusiness 
    ? message.to.data[0]?.id || 'unknown'
    : message.from.id;

  const messageData = {
    instagram_message_id: message.id,
    sender_id: message.from.id,
    recipient_id: isFromBusiness ? otherParticipantId : instagramAccountId,
    message_text: message.message || 'Mensaje sin texto',
    message_type: messageType,
    timestamp: new Date(message.created_time).toISOString(),
    raw_data: {
      historical_sync: true,
      sync_date: new Date().toISOString(),
      original_message: message,
      source: 'instagram_messaging_api'
    }
  };

  const { error } = await supabase
    .from('instagram_messages')
    .insert(messageData);

  if (error) {
    console.error(`Error guardando mensaje ${message.id}:`, error);
    throw error;
  }

  console.log(`💾 Mensaje histórico guardado: ${message.id}`);
}

/**
 * Verifica los permisos necesarios para la sincronización
 */
export const checkSyncPermissions = async (accessToken: string) => {
  try {
    const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`);
    const permissionsData = await permissionsResponse.json();

    if (!permissionsResponse.ok) {
      throw new Error('Error verificando permisos');
    }

    const permissions = permissionsData.data?.map((p: any) => p.permission) || [];
    
    const requiredPermissions = [
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list'
    ];

    const missingPermissions = requiredPermissions.filter(perm => !permissions.includes(perm));

    return {
      hasAllPermissions: missingPermissions.length === 0,
      permissions,
      missingPermissions,
      requiredPermissions
    };

  } catch (error) {
    console.error('Error verificando permisos:', error);
    return {
      hasAllPermissions: false,
      permissions: [],
      missingPermissions: [],
      requiredPermissions: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
