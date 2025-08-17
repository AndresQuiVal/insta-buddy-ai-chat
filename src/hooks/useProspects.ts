
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  senderId: string;
  username: string;
  state: 'pending' | 'yesterday' | 'week' | 'invited';
  lastMessageTime: string;
  lastMessageType: 'sent' | 'received';
  conversationMessages: any[];
  source: 'dm' | 'comment' | 'hower' | 'ads';
  daysSinceLastSent?: number; // Días desde que yo envié el último mensaje
  lastSentMessageTime?: string; // Hora del último mensaje que YO envié
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

  const determineProspectState = (messages: InstagramMessage[], senderId: string, currentUserId: string): { state: 'pending' | 'yesterday' | 'week' | 'invited', daysSinceLastSent?: number, lastSentMessageTime?: string } => {
    console.log(`🔍 [${senderId.slice(-8)}] Determinando estado con ${messages.length} mensajes`);
    
    if (messages.length === 0) {
      console.log(`✅ [${senderId.slice(-8)}] Estado: PENDING (sin mensajes)`);
      return { state: 'pending' };
    }

    // Filtrar y validar mensajes solo de este prospecto
    const validMessages = messages.filter(msg => msg.sender_id === senderId || msg.recipient_id === senderId);
    console.log(`📊 [${senderId.slice(-8)}] Mensajes válidos: ${validMessages.length}/${messages.length}`);

    // Ordenar mensajes por timestamp para este prospecto específico
    const sortedMessages = validMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedMessages.length === 0) {
      return { state: 'pending' };
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
      return { state: 'invited' };
    }

    // 🔥 NUEVA LÓGICA: Si el último mensaje lo recibí (el prospecto me escribió) = SIEMPRE PENDING
    if (lastMessage.message_type === 'received') {
      console.log(`✅ [${senderId.slice(-8)}] Estado: PENDING (último mensaje es recibido - prospecto escribió)`);
      return { state: 'pending' };
    }

    // 🔥 NUEVA LÓGICA: Si el último mensaje lo envié yo, verificar tiempo transcurrido
    if (lastMessage.message_type === 'sent') {
      const lastSentTime = new Date(lastMessage.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);
      const daysSinceLastSent = hoursSinceLastSent / 24;

      console.log(`📊 [${senderId.slice(-8)}] Último mensaje enviado hace ${daysSinceLastSent.toFixed(1)} días (${hoursSinceLastSent.toFixed(1)} horas)`);

      // Verificar si ya había una conversación previa (el prospecto había respondido antes)
      const receivedMessages = validMessages.filter(msg => msg.message_type === 'received');
      
      console.log(`💬 [${senderId.slice(-8)}] Respuestas del prospecto: ${receivedMessages.length}`);

      // Solo aplicar timer si ya había conversación previa (el prospecto me había respondido alguna vez)
      if (receivedMessages.length > 0) {
        // YA HABÍA CONVERSACIÓN - aplicar sistema de timer
        if (daysSinceLastSent >= 7) {
          console.log(`✅ [${senderId.slice(-8)}] Estado: WEEK (${daysSinceLastSent.toFixed(1)} días sin respuesta)`);
          return { 
            state: 'week', 
            daysSinceLastSent: Math.floor(daysSinceLastSent),
            lastSentMessageTime: lastMessage.timestamp 
          };
        } else if (daysSinceLastSent >= 1) {
          console.log(`✅ [${senderId.slice(-8)}] Estado: YESTERDAY (${daysSinceLastSent.toFixed(1)} días sin respuesta)`);
          return { 
            state: 'yesterday', 
            daysSinceLastSent: Math.floor(daysSinceLastSent),
            lastSentMessageTime: lastMessage.timestamp 
          };
        } else {
          // Menos de 1 día desde mi último mensaje - temporalmente en PENDING
          console.log(`✅ [${senderId.slice(-8)}] Estado: PENDING (esperando respuesta, < 1 día)`);
          return { 
            state: 'pending',
            daysSinceLastSent: Math.floor(daysSinceLastSent),
            lastSentMessageTime: lastMessage.timestamp 
          };
        }
      } else {
        // NO HABÍA CONVERSACIÓN PREVIA - el prospecto nunca ha respondido, siempre PENDING
        console.log(`✅ [${senderId.slice(-8)}] Estado: PENDING (primera vez, nunca ha respondido)`);
        return { state: 'pending' };
      }
    }

    console.log(`✅ [${senderId.slice(-8)}] Estado: PENDING (fallback)`);
    return { state: 'pending' };
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

  const determineProspectSource = (messages: InstagramMessage[]): 'dm' | 'comment' | 'hower' | 'ads' => {
    console.log(`📍 Determinando fuente del prospecto con ${messages.length} mensajes...`);
    
    for (const message of messages) {
      if (message.raw_data) {
        console.log(`🔍 Analizando raw_data:`, JSON.stringify(message.raw_data, null, 2));
        
        // PRIORIDAD 1: Detectar comentarios (webhook_source = 'comments' O tiene post_id/comment_id)
        if (message.raw_data.webhook_source === 'comments' ||
            message.raw_data.post_id || 
            message.raw_data.comment_id ||
            message.raw_data.original_event?.comment_id ||
            message.raw_data.original_change?.comment_id ||
            message.raw_data.entry?.[0]?.changes?.[0]?.value?.comment_id) {
          console.log(`✅ Fuente: COMMENT (detectado por webhook_source=comments o post_id/comment_id)`);
          return 'comment';
        }

        // PRIORIDAD 2: Detectar ads/anuncios (muy específico)
        if (message.raw_data.ad_id || 
            message.raw_data.ad_campaign_id ||
            message.raw_data.original_event?.ad_id ||
            (message.raw_data.ref && message.raw_data.ref.includes('ad'))) {
          console.log(`✅ Fuente: ADS (detectado por ad_id en raw_data)`);
          return 'ads';
        }

        // PRIORIDAD 3: Detectar Hower (MUY ESTRICTO - solo si hay evidencia clara del sistema)
        if ((message.raw_data.source === 'hower') ||
            (message.raw_data.campaign_type === 'hower') ||
            (message.raw_data.original_event?.source === 'hower') ||
            (message.raw_data.hower_system === true) ||
            (message.raw_data.automated === true && message.raw_data.system === 'hower')) {
          console.log(`✅ Fuente: HOWER (detectado por marcadores específicos del sistema)`);
          return 'hower';
        }
      }

      // CRITERIO ADICIONAL PARA HOWER: Solo si el mensaje tiene is_invitation=true Y es un mensaje enviado por nosotros
      if (message.is_invitation === true && message.message_type === 'sent') {
        console.log(`✅ Fuente: HOWER (detectado por is_invitation=true en mensaje enviado)`);
        return 'hower';
      }
    }

    // POR DEFECTO: Si no hay indicadores específicos claros, es un DM directo
    console.log(`✅ Fuente: DM (por defecto - no hay indicadores de otras fuentes)`);
    return 'dm';
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
    const stateResult = determineProspectState(messagesForThisSender, senderId, currentInstagramUserId || '');
    const username = await extractUsernameFromMessage(messagesForThisSender, senderId);
    const source = determineProspectSource(messagesForThisSender);

    const receivedCount = messagesForThisSender.filter((msg: InstagramMessage) => msg.message_type === 'received').length;
    const sentCount = messagesForThisSender.filter((msg: InstagramMessage) => msg.message_type === 'sent').length;

    console.log(`👤 [${senderId.slice(-8)}] Prospecto ${username}:`, {
      totalMessages: messagesForThisSender.length,
      sent: sentCount,
      received: receivedCount,
      lastMessageType: lastMessage.message_type,
      state: stateResult.state,
      source: source,
      lastMessageTime: lastMessage.timestamp
    });

    return {
      id: senderId,
      senderId,
      username,
      state: stateResult.state,
      source,
      lastMessageTime: lastMessage.timestamp,
      lastMessageType: lastMessage.message_type,
      conversationMessages: messagesForThisSender,
      daysSinceLastSent: stateResult.daysSinceLastSent,
      lastSentMessageTime: stateResult.lastSentMessageTime
    };
  };

  const fetchProspects = async () => {
    try {
      setLoading(true);
      console.log('🔄 [FETCH] Iniciando fetchProspects para usuario:', currentInstagramUserId);
      console.log('🕐 [FETCH] Timestamp:', new Date().toISOString());

      if (!currentInstagramUserId) {
        console.log('❌ [FETCH] No hay usuario de Instagram especificado');
        setProspects([]);
        return;
      }

      console.log('📊 [FETCH] Consultando TODOS los mensajes del usuario:', currentInstagramUserId);

      // Obtener TODOS los mensajes (enviados y recibidos) donde el usuario actual participa
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .or(`recipient_id.eq.${currentInstagramUserId},sender_id.eq.${currentInstagramUserId}`)
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

      // Agrupar mensajes por conversación (prospecto)
      const messagesByProspect = messages.reduce((acc: Record<string, InstagramMessage[]>, message: any) => {
        // Cast the database message to our InstagramMessage interface
        const instagramMessage: InstagramMessage = {
          ...message,
          message_type: message.message_type as 'sent' | 'received'
        };
        
        // Determinar el ID del prospecto (el otro participante en la conversación)
        const prospectId = instagramMessage.sender_id === currentInstagramUserId 
          ? instagramMessage.recipient_id 
          : instagramMessage.sender_id;
        
        // Solo procesar si el otro participante NO es el usuario actual
        if (prospectId !== currentInstagramUserId) {
          if (!acc[prospectId]) {
            acc[prospectId] = [];
          }
          acc[prospectId].push(instagramMessage);
        }
        
        return acc;
      }, {});

      console.log(`👥 Prospectos únicos encontrados: ${Object.keys(messagesByProspect).length}`);

      // Crear prospectos a partir de los mensajes agrupados
      const prospectsData: Prospect[] = [];
      
      for (const [prospectId, prospectMessages] of Object.entries(messagesByProspect)) {
        try {
          const prospect = await createProspectFromMessages(prospectId, prospectMessages);
          prospectsData.push(prospect);
        } catch (error) {
          console.error(`❌ Error creando prospecto para ${prospectId}:`, error);
        }
      }

      // Ordenar por tiempo del último mensaje (más reciente primero)
      prospectsData.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      console.log('✅ [FETCH] Prospectos procesados exitosamente:', prospectsData.length);
      console.log('🕐 [FETCH] Timestamp final:', new Date().toISOString());
      
      // Log detallado de estados finales
      const stateStats = prospectsData.reduce((acc, p) => {
        acc[p.state] = (acc[p.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 [FETCH] Estados finales:', stateStats);

      setProspects(prospectsData);
    } catch (error) {
      console.error('💥 Error in fetchProspects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentInstagramUserId) {
      console.log('🔄 [PROSPECTS] Cargando prospectos para usuario:', currentInstagramUserId);
      fetchProspects();
    } else {
      console.log('❌ [PROSPECTS] No hay currentInstagramUserId definido');
    }
  }, [currentInstagramUserId]); // Refetch cuando cambie el usuario

  useEffect(() => {
    if (!currentInstagramUserId) {
      console.log('❌ [REALTIME] No hay usuario especificado, no configurando suscripción');
      return;
    }

    console.log('🔄 [REALTIME] Configurando suscripción para usuario:', currentInstagramUserId);
    
    let channel: any = null;
    
    // Función async para configurar la suscripción
    const setupSubscription = async () => {
      // VERIFICAR: ¿Cuántas cuentas hay registradas?
      const { data: allUsers, error: allUsersError } = await supabase
        .from('instagram_users')
        .select('id, instagram_user_id, username, is_active')
        .eq('is_active', true);
      
      console.log('🔍 [DEBUG] TODAS las cuentas registradas:', allUsers);
      
      // Obtener el UUID del usuario actual
      const { data: userData, error } = await supabase
        .from('instagram_users')
        .select('id, instagram_user_id, username')
        .eq('instagram_user_id', currentInstagramUserId)
        .eq('is_active', true)
        .single();
      
      if (error || !userData) {
        console.log('❌ [REALTIME] No se pudo obtener UUID del usuario:', error);
        console.log('🔍 [DEBUG] Usuario buscado:', currentInstagramUserId);
        return;
      }
      
      const userUUID = userData.id;
      console.log('✅ [REALTIME] Usuario actual encontrado:', userData);
      
      channel = supabase
        .channel(`prospect-updates-${currentInstagramUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'instagram_messages'
          },
          (payload) => {
            console.log('📨 [REALTIME] Nuevo mensaje detectado:', payload);
            console.log('📨 [REALTIME] Datos del mensaje:', JSON.stringify(payload.new, null, 2));
            
            // 🔥 LÓGICA CORREGIDA: Verificar si el mensaje está relacionado con nuestro usuario
            const newMessage = payload.new;
            
            const isRelatedToUser = newMessage && (
              // Es un mensaje que YO envié (sender_id == mi Instagram ID)
              newMessage.sender_id === currentInstagramUserId || 
              // Es un mensaje que YO recibí (recipient_id == mi Instagram ID)
              newMessage.recipient_id === currentInstagramUserId ||
              // Es un mensaje en mi cuenta (instagram_user_id == mi UUID en BD)
              newMessage.instagram_user_id === userUUID ||
              // FALLBACK: Si el mensaje tiene mi UUID, es mío aunque los IDs de Instagram no coincidan
              (newMessage.instagram_user_id && newMessage.instagram_user_id === userUUID)
            );
          
            console.log('🔍 [REALTIME] Verificando relación del mensaje:', {
              'mi Instagram ID': currentInstagramUserId,
              'mi UUID en BD': userUUID,
              'sender del mensaje': newMessage?.sender_id,
              'recipient del mensaje': newMessage?.recipient_id,
              'UUID del mensaje': newMessage?.instagram_user_id,
              'está relacionado': isRelatedToUser,
              'razón': newMessage?.instagram_user_id === userUUID ? 'UUID coincide' :
                      newMessage?.sender_id === currentInstagramUserId ? 'Soy sender' :
                      newMessage?.recipient_id === currentInstagramUserId ? 'Soy recipient' : 'No relacionado'
            });
          
            if (isRelatedToUser) {
              console.log('✅ [REALTIME] Mensaje relacionado con nuestro usuario - Recargando prospectos...');
              setTimeout(() => {
                console.log('🔄 [REALTIME] Ejecutando refetch de prospectos...');
                fetchProspects();
              }, 1000);
            } else {
              console.log('⚠️ [REALTIME] Mensaje NO relacionado con nuestro usuario');
              console.log('🔍 [DEBUG] ¿Este mensaje es de otra cuenta tuya?', {
                mensajeDe: newMessage?.instagram_user_id,
                allUsers: 'Ver logs arriba para comparar'
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'instagram_messages'
          },
          (payload) => {
            console.log('📝 [REALTIME] Mensaje actualizado detectado:', payload);
            
            const updatedMessage = payload.new;
            if (updatedMessage && (
              updatedMessage.recipient_id === currentInstagramUserId || 
              updatedMessage.sender_id === currentInstagramUserId ||
              updatedMessage.instagram_user_id === userUUID
            )) {
              console.log('✅ [REALTIME] Actualización relacionada con nuestro usuario - Recargando prospectos...');
              setTimeout(() => {
                fetchProspects();
              }, 500);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 [REALTIME] Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ [REALTIME] Suscripción activa correctamente');
          } else if (status === 'CLOSED') {
            console.log('❌ [REALTIME] Suscripción cerrada');
          }
        });
    };

    // Ejecutar la configuración de suscripción
    setupSubscription();

    // Cleanup function
    return () => {
      console.log('🔌 [REALTIME] Desconectando suscripción');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentInstagramUserId]);

  return {
    prospects,
    loading,
    refetch: fetchProspects
  };
};
