
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InstagramConversation {
  id: string;
  updated_time: string;
}

interface InstagramMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    username?: string;
  };
  to: {
    data: Array<{
      id: string;
      username?: string;
    }>;
  };
  message?: string;
}

interface ConversationMessages {
  messages: {
    data: Array<{
      id: string;
      created_time: string;
    }>;
  };
  id: string;
}

/**
 * Sincroniza conversaciones históricas usando la Conversations API oficial de Facebook
 */
export const syncHistoricalConversations = async (accessToken: string) => {
  try {
    console.log('🔄 Iniciando sincronización usando Conversations API...');
    
    // Obtener información de la página conectada
    const pageInfo = await getConnectedPageInfo(accessToken);
    if (!pageInfo.pageId) {
      throw new Error('No se encontró página de Facebook conectada');
    }

    console.log(`📱 Usando página: ${pageInfo.pageId}`);

    // Obtener conversaciones de Instagram usando la API correcta
    const conversations = await fetchInstagramConversationsCorrect(accessToken, pageInfo.pageId);
    console.log(`💬 Se encontraron ${conversations.length} conversaciones`);

    let syncedMessages = 0;
    let syncedConversations = 0;

    for (const conversation of conversations) {
      try {
        console.log(`📨 Sincronizando conversación ${conversation.id}...`);
        
        // Obtener lista de mensajes de la conversación
        const conversationMessages = await fetchConversationMessages(accessToken, conversation.id);
        
        // Procesar solo los últimos 20 mensajes (limitación de la API)
        const messageIds = conversationMessages.messages.data.slice(0, 20);
        
        // Obtener detalles de cada mensaje
        for (const messageRef of messageIds) {
          try {
            const messageDetails = await fetchMessageDetails(accessToken, messageRef.id);
            if (messageDetails && messageDetails.message) {
              await saveHistoricalMessage(messageDetails, pageInfo.instagramAccountId || pageInfo.pageId);
              syncedMessages++;
            }
          } catch (messageError) {
            console.warn(`Error obteniendo mensaje ${messageRef.id}:`, messageError);
          }
        }
        
        syncedConversations++;
        
        // Pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
 * Obtiene información de la página conectada y cuenta de Instagram
 */
async function getConnectedPageInfo(accessToken: string) {
  // Obtener usuario de Facebook
  const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
  const userData = await userResponse.json();

  if (!userResponse.ok) {
    throw new Error(`Error obteniendo usuario: ${userData.error?.message}`);
  }

  // Obtener páginas con cuentas de Instagram
  const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/${userData.id}/accounts?fields=id,name,instagram_business_account,access_token&access_token=${accessToken}`);
  const pagesData = await pagesResponse.json();

  if (!pagesResponse.ok) {
    throw new Error(`Error obteniendo páginas: ${pagesData.error?.message}`);
  }

  // Buscar página con Instagram Business
  const pageWithInstagram = pagesData.data?.find((page: any) => page.instagram_business_account);
  
  if (!pageWithInstagram) {
    throw new Error('No se encontró página con cuenta de Instagram Business conectada');
  }

  return {
    userId: userData.id,
    pageId: pageWithInstagram.id,
    pageName: pageWithInstagram.name,
    instagramAccountId: pageWithInstagram.instagram_business_account?.id,
    pageAccessToken: pageWithInstagram.access_token || accessToken
  };
}

/**
 * Obtiene conversaciones usando la Conversations API oficial
 */
async function fetchInstagramConversationsCorrect(accessToken: string, pageId: string): Promise<InstagramConversation[]> {
  const conversationsUrl = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${accessToken}`;
  
  console.log('🔍 Consultando conversaciones:', conversationsUrl);
  
  const response = await fetch(conversationsUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo conversaciones: ${data.error?.message || 'Error desconocido'}`);
  }

  return data.data || [];
}

/**
 * Obtiene mensajes de una conversación específica
 */
async function fetchConversationMessages(accessToken: string, conversationId: string): Promise<ConversationMessages> {
  const messagesUrl = `https://graph.facebook.com/v19.0/${conversationId}?fields=messages&access_token=${accessToken}`;
  
  console.log('📨 Consultando mensajes de conversación:', conversationId);
  
  const response = await fetch(messagesUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo mensajes: ${data.error?.message || 'Error desconocido'}`);
  }

  return data;
}

/**
 * Obtiene detalles de un mensaje específico
 */
async function fetchMessageDetails(accessToken: string, messageId: string): Promise<InstagramMessage | null> {
  const messageUrl = `https://graph.facebook.com/v19.0/${messageId}?fields=id,created_time,from,to,message&access_token=${accessToken}`;
  
  const response = await fetch(messageUrl);
  const data = await response.json();

  if (!response.ok) {
    // Los mensajes más antiguos que 20 pueden devolver error "message deleted"
    if (data.error?.message?.includes('deleted') || data.error?.code === 100) {
      console.log(`⏭️ Mensaje ${messageId} no disponible (más de 20 mensajes antiguos)`);
      return null;
    }
    throw new Error(`Error obteniendo detalles del mensaje: ${data.error?.message || 'Error desconocido'}`);
  }

  return data;
}

/**
 * Guarda un mensaje histórico en la base de datos
 */
async function saveHistoricalMessage(message: InstagramMessage, businessAccountId: string) {
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

  // Determinar dirección del mensaje
  const isFromBusiness = message.from.id === businessAccountId;
  const messageType = isFromBusiness ? 'sent' : 'received';
  
  // ID del otro participante
  const otherParticipantId = isFromBusiness 
    ? message.to.data[0]?.id || 'unknown'
    : message.from.id;

  const messageData = {
    instagram_message_id: message.id,
    sender_id: message.from.id,
    recipient_id: isFromBusiness ? otherParticipantId : businessAccountId,
    message_text: message.message || 'Mensaje sin texto',
    message_type: messageType,
    timestamp: new Date(message.created_time).toISOString(),
    raw_data: {
      historical_sync: true,
      sync_date: new Date().toISOString(),
      original_message: {
        id: message.id,
        created_time: message.created_time,
        from: message.from,
        to: message.to,
        message: message.message
      } as any,
      source: 'conversations_api',
      api_version: 'v19.0'
    } as any
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
 * Verifica permisos usando la Conversations API
 */
export const checkSyncPermissions = async (accessToken: string) => {
  try {
    console.log('🔍 Verificando permisos para Conversations API...');
    
    // Verificar token básico
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
    
    if (!userResponse.ok) {
      const userData = await userResponse.json();
      return {
        hasAllPermissions: false,
        permissions: [],
        missingPermissions: [],
        requiredPermissions: [],
        error: userData.error?.message || 'Token de acceso inválido'
      };
    }

    const userData = await userResponse.json();
    console.log('✅ Token válido para usuario:', userData.name || userData.id);

    // Verificar permisos específicos
    const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`);
    
    if (!permissionsResponse.ok) {
      const permissionsError = await permissionsResponse.json();
      return {
        hasAllPermissions: false,
        permissions: [],
        missingPermissions: [],
        requiredPermissions: [],
        error: permissionsError.error?.message || 'Error verificando permisos'
      };
    }

    const permissionsData = await permissionsResponse.json();
    const grantedPermissions = permissionsData.data?.filter((p: any) => p.status === 'granted').map((p: any) => p.permission) || [];
    
    console.log('📋 Permisos concedidos:', grantedPermissions);

    // Verificar páginas y cuentas de Instagram
    let hasInstagramBusiness = false;
    let pageInfo = null;
    
    try {
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`);
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        pageInfo = accountsData.data?.find((acc: any) => acc.instagram_business_account);
        hasInstagramBusiness = !!pageInfo;
        
        if (pageInfo) {
          console.log('📱 Página con Instagram encontrada:', pageInfo.name, pageInfo.id);
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo verificar páginas:', error);
    }

    // Permisos requeridos según documentación oficial
    const requiredPermissions = [
      'instagram_basic',
      'instagram_manage_messages', 
      'pages_manage_metadata'
    ];

    const missingPermissions = requiredPermissions.filter(perm => !grantedPermissions.includes(perm));
    const hasAllPermissions = missingPermissions.length === 0 && hasInstagramBusiness;

    console.log('📊 Resultado verificación:', {
      hasAllPermissions,
      hasInstagramBusiness,
      missingPermissions
    });

    return {
      hasAllPermissions,
      permissions: grantedPermissions,
      missingPermissions,
      requiredPermissions,
      hasInstagramBusiness,
      pageInfo,
      recommendations: !hasInstagramBusiness ? [
        'Conecta una página de Facebook con cuenta de Instagram Business',
        'Asegúrate de tener los permisos: instagram_basic, instagram_manage_messages, pages_manage_metadata'
      ] : missingPermissions.length > 0 ? [
        `Solicita los permisos faltantes: ${missingPermissions.join(', ')}`
      ] : []
    };

  } catch (error) {
    console.error('💥 Error verificando permisos:', error);
    return {
      hasAllPermissions: false,
      permissions: [],
      missingPermissions: [],
      requiredPermissions: [],
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
};
