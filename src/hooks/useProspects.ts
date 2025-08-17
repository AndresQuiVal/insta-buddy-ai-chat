
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

export const useProspects = (currentInstagramUserId?: string) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const determineProspectState = (messages: InstagramMessage[], senderId: string): 'reactivation_sent' | 'no_response' | 'invited' | 'follow_up' => {
    console.log(`🔍 [${senderId.slice(-8)}] Determinando estado con ${messages.length} mensajes`);
    
    if (messages.length === 0) {
      console.log(`✅ [${senderId.slice(-8)}] Estado: NO_RESPONSE (sin mensajes)`);
      return 'no_response';
    }

    // Filtrar y validar mensajes solo de este prospecto
    const validMessages = messages.filter(msg => msg.sender_id === senderId || msg.recipient_id === senderId);
    console.log(`📊 [${senderId.slice(-8)}] Mensajes válidos: ${validMessages.length}/${messages.length}`);

    // Ordenar mensajes por timestamp para este prospecto específico
    const sortedMessages = validMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedMessages.length === 0) {
      return 'no_response';
    }
    
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

  const extractUsernameFromRawData = (messages: InstagramMessage[]): string | null => {
    console.log(`🔍 Buscando username en raw_data de ${messages.length} mensajes...`);
    
    for (const message of messages) {
      if (message.raw_data) {
        console.log(`📝 Analizando raw_data:`, message.raw_data);
        
        // Buscar username en diferentes ubicaciones del raw_data
        const locations = [
          message.raw_data.username,
          message.raw_data.user?.username,
          message.raw_data.profile?.username,
          message.raw_data.from?.username,
          message.raw_data.sender?.username,
          message.raw_data.original_event?.sender?.username,
          message.raw_data.original_change?.sender?.username,
          message.raw_data.original_event?.from?.username,
          message.raw_data.original_change?.from?.username,
          // Buscar en estructuras más profundas
          message.raw_data.messaging?.[0]?.sender?.username,
          message.raw_data.messaging?.[0]?.from?.username,
          message.raw_data.entry?.[0]?.messaging?.[0]?.sender?.username,
          message.raw_data.entry?.[0]?.messaging?.[0]?.from?.username
        ];
        
        for (const username of locations) {
          if (username && typeof username === 'string' && username.trim()) {
            console.log(`✅ Username encontrado en raw_data: ${username}`);
            return username.replace('@', ''); // Limpiar @ si viene incluido
          }
        }
      }
    }
    
    console.log(`❌ No se encontró username en raw_data`);
    return null;
  };

  const fetchInstagramUsername = async (senderId: string): Promise<string> => {
    try {
      console.log(`🔍 Obteniendo username real para sender_id: ${senderId}`);
      
      // Intentar obtener el token de Instagram desde localStorage
      const instagramToken = localStorage.getItem('hower-instagram-token');
      
      if (!instagramToken) {
        console.log('❌ No hay token de Instagram disponible');
        return `user_${senderId.slice(-8)}`;
      }

      // Llamar a la API de Instagram para obtener información del usuario
      const response = await fetch(
        `https://graph.instagram.com/${senderId}?fields=username,name&access_token=${instagramToken}`
      );

      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ Username obtenido de Instagram:`, userData);
        
        if (userData.username) {
          return userData.username;
        }
      } else {
        console.log(`❌ Error al obtener username de Instagram:`, response.status);
      }
    } catch (error) {
      console.error('Error fetching Instagram username:', error);
    }

    // Fallback: usar el sender_id acortado
    return `user_${senderId.slice(-8)}`;
  };

  const extractUsernameFromMessage = async (messages: InstagramMessage[], senderId: string): Promise<string> => {
    // PRIORIDAD 1: Intentar extraer del raw_data del webhook
    const usernameFromRawData = extractUsernameFromRawData(messages);
    if (usernameFromRawData) {
      console.log(`✅ Username extraído del webhook: ${usernameFromRawData}`);
      return usernameFromRawData;
    }

    // PRIORIDAD 2: Intentar obtener el username real de Instagram API
    const realUsername = await fetchInstagramUsername(senderId);
    if (realUsername && !realUsername.includes('user_')) {
      console.log(`✅ Username obtenido de Instagram API: ${realUsername}`);
      return realUsername;
    }

    // FALLBACK: Usar el sender_id acortado
    console.log(`⚠️ Usando fallback para sender_id: ${senderId}`);
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
    
    if (sortedMessages.length === 0) {
      throw new Error(`No hay mensajes válidos para el prospecto ${senderId}`);
    }
    
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
      console.log('🔄 Obteniendo prospectos para usuario:', currentInstagramUserId);

      if (!currentInstagramUserId) {
        console.log('❌ No hay usuario de Instagram especificado');
        setProspects([]);
        return;
      }

      console.log('📊 Consultando base de datos con filtro:', { recipient_id: currentInstagramUserId, message_type: 'received' });

      // Obtener SOLO los mensajes del usuario actual (que recibió)
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .eq('recipient_id', currentInstagramUserId) // Solo mensajes recibidos por este usuario
        .eq('message_type', 'received') // Solo mensajes que llegaron de prospectos
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log(`📊 Total mensajes obtenidos para ${currentInstagramUserId}: ${messages?.length || 0}`);

      if (!messages || messages.length === 0) {
        console.log('ℹ️ No hay mensajes en la base de datos');
        setProspects([]);
        return;
      }

      // Agrupar mensajes por sender_id con validación estricta
      const messagesBySender = messages.reduce((acc: Record<string, InstagramMessage[]>, message: any) => {
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
      }, {});

      console.log(`👥 Prospectos únicos encontrados: ${Object.keys(messagesBySender).length}`);

      // Crear prospectos a partir de los mensajes agrupados
      const prospectsData: Prospect[] = [];
      
      for (const [senderId, senderMessages] of Object.entries(messagesBySender)) {
        try {
          const prospect = await createProspectFromMessages(senderId, senderMessages);
          prospectsData.push(prospect);
        } catch (error) {
          console.error(`❌ Error creando prospecto para ${senderId}:`, error);
        }
      }

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

      setProspects(prospectsData);
    } catch (error) {
      console.error('💥 Error in fetchProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentInstagramUserId) {
      console.log('🔄 Cargando prospectos para usuario:', currentInstagramUserId);
      fetchProspects();
    }
  }, [currentInstagramUserId]); // Refetch cuando cambie el usuario

  useEffect(() => {
    if (!currentInstagramUserId) {
      console.log('❌ No hay usuario especificado, no configurando suscripción');
      return;
    }

    console.log('🔄 Configurando suscripción en tiempo real para usuario:', currentInstagramUserId);
    const channel = supabase
      .channel(`prospect-updates-${currentInstagramUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instagram_messages',
          filter: `recipient_id=eq.${currentInstagramUserId}`
        },
        (payload) => {
          console.log('📨 Nuevo mensaje detectado:', payload);
          
          // Solo refetch si es un mensaje recibido (de un prospecto)
          if (payload.new?.message_type === 'received') {
            console.log('🔄 Recargando prospectos después del nuevo mensaje...');
            setTimeout(() => {
              fetchProspects();
            }, 500);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción en tiempo real:', status);
      });

    return () => {
      console.log('🔌 Desconectando suscripción en tiempo real');
      supabase.removeChannel(channel);
    };
  }, [currentInstagramUserId]);

  return {
    prospects,
    loading,
    refetch: fetchProspects
  };
};
