
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { prospectService } from '@/services/prospectService';

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
    
    for (const message of [...messages].reverse()) { // Empezar por el más reciente (sin modificar array original)
      if (message.raw_data) {
        console.log(`📝 Analizando raw_data:`, message.raw_data);
        
        // PRIORIDAD 1: Ubicaciones más comunes para comentarios
        if (message.raw_data.commenter_username) {
          console.log(`✅ Username encontrado (commenter_username): ${message.raw_data.commenter_username}`);
          return message.raw_data.commenter_username;
        }
        
        if (message.raw_data.from?.username) {
          console.log(`✅ Username encontrado (from.username): ${message.raw_data.from.username}`);
          return message.raw_data.from.username;
        }
        
        // PRIORIDAD 2: Buscar en ubicaciones alternativas
        const locations = [
          message.raw_data.sender?.username,   // Para mensajes
          message.raw_data.username,           // Directo
          message.raw_data.user?.username,     // Usuario alternativo
          message.raw_data.profile?.username,  // Perfil
          message.raw_data.original_event?.sender?.username,
          message.raw_data.original_change?.sender?.username,
          message.raw_data.original_event?.from?.username,
          message.raw_data.original_change?.from?.username,
          message.raw_data.original_change?.commenter_username, // Comentarista en cambios
          // Buscar en estructuras más profundas
          message.raw_data.messaging?.[0]?.sender?.username,
          message.raw_data.messaging?.[0]?.from?.username,
          message.raw_data.entry?.[0]?.messaging?.[0]?.sender?.username,
          message.raw_data.entry?.[0]?.messaging?.[0]?.from?.username
        ];
        
        // PRIORIDAD 3: Buscar en entry/changes para webhooks complejos
        if (message.raw_data.entry) {
          for (const entry of message.raw_data.entry) {
            if (entry.changes) {
              for (const change of entry.changes) {
                if (change.value) {
                  // Agregar más ubicaciones desde entry/changes
                  locations.push(
                    change.value.commenter_username,
                    change.value.from?.username,
                    change.value.sender?.username
                  );
                }
              }
            }
          }
        }
        
        for (const username of locations) {
          if (username && typeof username === 'string' && username.trim()) {
            console.log(`✅ Username encontrado en raw_data: ${username}`);
            return username.replace('@', ''); // Limpiar @ si viene incluido
          }
        }
      }
    }
    
    console.log(`❌ No se encontró username en raw_data de ${messages.length} mensajes`);
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
    const shortId = senderId.slice(-8);
    
    try {
      console.log(`🔍 [${shortId}] Obteniendo username real para sender_id: ${senderId}`);
      
      // Intentar obtener el token de Instagram desde localStorage primero
      const instagramToken = localStorage.getItem('hower-instagram-token') || 
                           localStorage.getItem('instagram-access-token');
      
      console.log(`🔍 [${shortId}] Token desde localStorage: ${instagramToken ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      
      // Si no hay token, intentar obtenerlo desde el usuario actual
      if (!instagramToken) {
        console.log(`🔍 [${shortId}] Buscando token en hower-instagram-user...`);
        const savedUserData = localStorage.getItem('hower-instagram-user');
        
        if (savedUserData) {
          const userData = JSON.parse(savedUserData);
          console.log(`🔍 [${shortId}] Datos de usuario encontrados:`, { 
            hasToken: !!userData.access_token,
            userId: userData.instagram_user_id 
          });
          
          if (userData.access_token) {
            console.log(`✅ [${shortId}] Token encontrado en datos de usuario, haciendo llamada API...`);
            const apiUrl = `https://graph.instagram.com/${senderId}?fields=username,name&access_token=${userData.access_token}`;
            console.log(`🔍 [${shortId}] URL API: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            console.log(`🔍 [${shortId}] Status de respuesta API: ${response.status}`);
            
            if (response.ok) {
              const userDataResponse = await response.json();
              console.log(`✅ [${shortId}] Username obtenido de Instagram API:`, userDataResponse);
              
              if (userDataResponse.username) {
                return userDataResponse.username;
              } else {
                console.log(`⚠️ [${shortId}] Respuesta API no contiene username`);
              }
            } else {
              const errorText = await response.text();
              console.log(`❌ [${shortId}] Error en API Instagram:`, response.status, errorText);
            }
          } else {
            console.log(`❌ [${shortId}] No hay access_token en userData`);
          }
        } else {
          console.log(`❌ [${shortId}] No hay savedUserData en localStorage`);
        }
      }
      
      if (!instagramToken) {
        console.log(`❌ [${shortId}] No hay token de Instagram disponible - retornando fallback`);
        return `user_${shortId}`;
      }

      // Llamar a la API de Instagram para obtener información del usuario
      console.log(`✅ [${shortId}] Usando token principal, haciendo llamada API...`);
      const response = await fetch(
        `https://graph.instagram.com/${senderId}?fields=username,name&access_token=${instagramToken}`
      );

      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ [${shortId}] Username obtenido de Instagram con token principal:`, userData);
        
        if (userData.username) {
          return userData.username;
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ [${shortId}] Error al obtener username de Instagram:`, response.status, errorText);
      }
    } catch (error) {
      console.error(`❌ [${shortId}] Error fetching Instagram username:`, error);
    }

    // Fallback: usar el sender_id acortado
    console.log(`⚠️ [${shortId}] Usando fallback username: user_${shortId}`);
    return `user_${shortId}`;
  };

  const extractUsernameFromMessage = async (messages: InstagramMessage[], senderId: string): Promise<string> => {
    console.log(`🔍 [${senderId.slice(-8)}] ==> extractUsernameFromMessage iniciado con ${messages.length} mensajes`);
    
    // PRIORIDAD 1: Intentar extraer del raw_data del webhook
    const usernameFromRawData = extractUsernameFromRawData(messages);
    if (usernameFromRawData) {
      console.log(`✅ [${senderId.slice(-8)}] Username extraído del webhook: ${usernameFromRawData}`);
      return usernameFromRawData;
    }

    console.log(`🔄 [${senderId.slice(-8)}] No se encontró username en raw_data, intentando API de Instagram...`);
    // PRIORIDAD 2: Intentar obtener el username real de Instagram API
    const realUsername = await fetchInstagramUsername(senderId);
    if (realUsername && !realUsername.includes('user_')) {
      console.log(`✅ [${senderId.slice(-8)}] Username obtenido de Instagram API: ${realUsername}`);
      return realUsername;
    }

    // FALLBACK: Usar el sender_id acortado
    console.log(`⚠️ [${senderId.slice(-8)}] Usando fallback para sender_id: ${senderId} -> ${realUsername}`);
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
    
    console.log(`🔍 [${senderId.slice(-8)}] Iniciando extracción de username...`);
    const username = await extractUsernameFromMessage(messagesForThisSender, senderId);
    console.log(`🔍 [${senderId.slice(-8)}] Username final obtenido: ${username}`);
    
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
      console.log('🔄 [FETCH] Iniciando fetchProspects desde TABLAS ESPECÍFICAS DE PROSPECTOS');
      console.log('🕐 [FETCH] Timestamp:', new Date().toISOString());
      console.log('👤 [FETCH] Usuario:', currentInstagramUserId);

      if (!currentInstagramUserId) {
        console.log('❌ [FETCH] No hay usuario de Instagram especificado');
        setProspects([]);
        return;
      }

      // 🏗️ USAR EL NUEVO SERVICIO DE PROSPECTOS
      console.log('📋 [FETCH] Obteniendo prospectos desde servicio...');
      const prospectsData = await prospectService.getProspectsByUser(currentInstagramUserId);
      
      console.log(`📊 [FETCH] ${prospectsData.length} prospectos obtenidos desde BD específica`);

      if (prospectsData.length === 0) {
        console.log('ℹ️ [FETCH] No hay prospectos en las tablas específicas');
        setProspects([]);
        return;
      }

      // 🔄 CONVERTIR datos de BD a formato de Prospect
      const convertedProspects: Prospect[] = [];
      
      for (const prospectData of prospectsData) {
        try {
          console.log(`🔄 [FETCH] Procesando prospecto: ${prospectData.username} (${prospectData.prospect_instagram_id})`);
          
          // Obtener mensajes del prospecto
          const messages = prospectData.prospect_messages || [];
          const sortedMessages = messages.sort((a: any, b: any) => 
            new Date(b.message_timestamp).getTime() - new Date(a.message_timestamp).getTime()
          );
          
          if (sortedMessages.length === 0) {
            console.log(`⚠️ [FETCH] Saltando prospecto sin mensajes: ${prospectData.username}`);
            continue;
          }

          const lastMessage = sortedMessages[0];
          
          // Determinar estado basado en el estado de la BD y último mensaje
          let state: 'pending' | 'yesterday' | 'week' | 'invited' = 'pending';
          let daysSinceLastSent: number | undefined = undefined;
          let lastSentMessageTime: string | undefined = undefined;

          // Si el último mensaje es del prospecto -> PENDING
          if (lastMessage.is_from_prospect) {
            state = 'pending';
          } else {
            // El último mensaje es nuestro -> verificar tiempo
            const lastSentTime = new Date(lastMessage.message_timestamp).getTime();
            const now = new Date().getTime();
            const daysSince = (now - lastSentTime) / (1000 * 60 * 60 * 24);
            
            daysSinceLastSent = Math.floor(daysSince);
            lastSentMessageTime = lastMessage.message_timestamp;
            
            if (daysSince >= 7) {
              state = 'week';
            } else if (daysSince >= 1) {
              state = 'yesterday';
            }
          }

          // Determinar el tipo del último mensaje
          const lastMessageType = lastMessage.is_from_prospect ? 'received' : 'sent';
          
          // Convertir mensajes al formato esperado
          const conversationMessages = sortedMessages.map((msg: any) => ({
            ...msg,
            sender_id: msg.is_from_prospect ? prospectData.prospect_instagram_id : currentInstagramUserId,
            recipient_id: msg.is_from_prospect ? currentInstagramUserId : prospectData.prospect_instagram_id,
            message_type: msg.is_from_prospect ? 'received' : 'sent',
            timestamp: msg.message_timestamp
          }));

          const prospect: Prospect = {
            id: prospectData.prospect_instagram_id,
            senderId: prospectData.prospect_instagram_id,
            username: prospectData.username,
            state,
            source: 'dm', // Por defecto, puede mejorarse más tarde
            lastMessageTime: lastMessage.message_timestamp,
            lastMessageType,
            conversationMessages,
            daysSinceLastSent,
            lastSentMessageTime
          };

          convertedProspects.push(prospect);
          
          console.log(`✅ [FETCH] Prospecto procesado: ${prospect.username} - Estado: ${prospect.state}`);

        } catch (prospectError) {
          console.error(`❌ [FETCH] Error procesando prospecto ${prospectData.username}:`, prospectError);
        }
      }

      console.log(`✅ [FETCH] ${convertedProspects.length} prospectos convertidos exitosamente`);
      setProspects(convertedProspects);
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
        .channel(`prospect-updates-global`) // Canal global para todos los usuarios
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'instagram_messages'
            // SIN filtro - todos los usuarios escuchan todos los mensajes
          },
          (payload) => {
            console.log('📨 [REALTIME] Nuevo mensaje detectado globalmente:', payload.new);
            
            const newMessage = payload.new as any;
            
            // 🔥 FILTRAR EN EL CLIENTE: Solo procesar si es relacionado conmigo
            const isMessageFromMe = newMessage.message_type === 'sent' && newMessage.instagram_user_id === userUUID;
            const isMessageToMe = newMessage.message_type === 'received' && newMessage.instagram_user_id === userUUID;
            
            // Para mensajes enviados por mí, verificar tanto recipient como sender
            // (Instagram puede marcar de diferentes formas según el webhook)
            const isMessageSentByMe = newMessage.message_type === 'received' && 
                                    (newMessage.raw_data?.recipient?.id === userData.instagram_user_id ||
                                     newMessage.raw_data?.sender?.id === userData.instagram_user_id);
            
            console.log('🔍 [REALTIME] Verificando tipo de mensaje:', {
              'mi UUID': userUUID,
              'mi instagram_id': userData.instagram_user_id,
              'mensaje UUID': newMessage.instagram_user_id,
              'message_type': newMessage.message_type,
              'recipient_id': newMessage.raw_data?.recipient?.id,
              'sender_id': newMessage.raw_data?.sender?.id,
              'isMessageFromMe': isMessageFromMe,
              'isMessageToMe': isMessageToMe,
              'isMessageSentByMe': isMessageSentByMe,
              'COMPARANDO recipient_id con mi instagram_id': newMessage.raw_data?.recipient?.id === userData.instagram_user_id,
              'usuario': userData.username
            });
            
            if (isMessageToMe) {
              console.log('✅ [REALTIME] ES MI MENSAJE RECIBIDO - actualizando prospectos...');
              setTimeout(() => {
                fetchProspects();
              }, 500);
            } else if (isMessageFromMe || isMessageSentByMe) {
              console.log('✅ [REALTIME] ES MI MENSAJE ENVIADO - actualizando prospecto específico...');
              
              // Identificar el prospecto específico que recibió el mensaje
              const recipientId = newMessage.raw_data?.recipient?.id; // El recipient del mensaje es el prospecto
              const senderIdFromMessage = newMessage.sender_id; // También intentar con sender_id directo
              
              console.log('🎯 [REALTIME] Identificando prospecto receptor:', {
                'recipient_id_from_raw': recipientId,
                'sender_id_from_message': senderIdFromMessage,
                'raw_data': newMessage.raw_data,
                'USANDO recipient_id como prospecto': recipientId
              });
              
              // DEBUGGEAR: Verificar si tenemos un prospectId válido
              if (!recipientId && !senderIdFromMessage) {
                console.error('❌ [REALTIME] NO SE ENCONTRÓ ID DE PROSPECTO');
                console.log('🔍 [REALTIME] Datos disponibles:', newMessage);
                return;
              }
              
              const prospectId = recipientId || senderIdFromMessage;
              console.log(`🔄 [REALTIME] Marcando prospecto ${prospectId} como completado...`);
              
              // LLAMAR DIRECTAMENTE A LA FUNCIÓN DE SYNC
              console.log('📞 [REALTIME] Llamando sync_prospect_task_status...');
              supabase.rpc('sync_prospect_task_status', {
                p_instagram_user_id: userData.instagram_user_id,
                p_prospect_sender_id: prospectId,
                p_last_message_type: 'sent'
              }).then((result) => {
                console.log('✅ [REALTIME] Respuesta de sync_prospect_task_status:', result);
                
                if (result.error) {
                  console.error('❌ [REALTIME] ERROR en sync_prospect_task_status:', result.error);
                } else {
                  console.log('✅ [REALTIME] SYNC EXITOSO - refrescando lista...');
                }
                
                // Actualizar lista después de confirmar sync
                setTimeout(() => {
                  console.log('🔄 [REALTIME] Ejecutando fetchProspects...');
                  fetchProspects();
                }, 300);
              });
              
              // TAMBIÉN intentar actualizar el estado local inmediatamente  
              console.log('🔄 [REALTIME] Actualizando estado local inmediatamente...');
              // NO NECESITAMOS ESTO - el fetchProspects se encargará de actualizar
            } else {
              console.log(`⚠️ [REALTIME] No es mi mensaje (usuario: ${newMessage.instagram_user_id}, recipient: ${newMessage.raw_data?.recipient?.id})`);
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
