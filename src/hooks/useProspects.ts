
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

  const determineProspectState = (prospect: any): { state: 'pending' | 'yesterday' | 'week' | 'invited', daysSinceLastSent?: number, lastSentMessageTime?: string } => {
    const senderId = prospect.prospect_instagram_id || prospect.id;
    
    console.log(`🔥 [RECONTACTAR-DEBUG] ===== ANALIZANDO PROSPECTO =====`);
    console.log(`🔥 [RECONTACTAR-DEBUG] Username: ${prospect.username}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] Sender ID: ${senderId}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] last_owner_message_at: ${prospect.last_owner_message_at}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] last_message_from_prospect: ${prospect.last_message_from_prospect}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] Datos completos del prospecto:`, prospect);
    console.log(`🔥 [RECONTACTAR-DEBUG] ============================================`);

    // ⚠️ DEBUG ESPECÍFICO PARA estamosprobando1231
    if (prospect.username === 'estamosprobando1231') {
      console.log('🎯 [DEBUG-SPECIFIC] estamosprobando1231 datos completos:', prospect);
    }

    // Verificar si hay invitaciones enviadas (mantenemos esta lógica)
    const messages = prospect.prospect_messages || prospect.messages || [];
    if (messages.length > 0) {
      const hasInvitation = messages.some((msg: any) => 
        msg.is_invitation === true && msg.is_from_prospect === false
      );
      if (hasInvitation) {
        console.log(`✅ [${senderId.slice(-8)}] Estado: INVITED (hay invitación enviada)`);
        return { state: 'invited' };
      }
    }

    // 🔥 NUEVA LÓGICA: Si no tengo timestamp de último mensaje mío = PENDING
    if (!prospect.last_owner_message_at) {
      console.log(`🔥 [RECONTACTAR-DEBUG] Sin last_owner_message_at -> PENDING`);
      return { state: 'pending' };
    }

    // 🔥 LÓGICA ALINEADA CON SQL: Usar misma lógica que WhatsApp
    const lastOwnerMessageTime = new Date(prospect.last_owner_message_at);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Usar misma comparación que SQL: <= (now() - interval '1 day')
    const isOverOneDay = lastOwnerMessageTime <= oneDayAgo;
    const isOverSevenDays = lastOwnerMessageTime <= sevenDaysAgo;
    const hoursSinceLastOwnerMessage = (now.getTime() - lastOwnerMessageTime.getTime()) / (1000 * 60 * 60);
    const daysSinceLastOwnerMessage = hoursSinceLastOwnerMessage / 24;

    console.log(`🔥 [RECONTACTAR-DEBUG] CÁLCULOS TEMPORALES:`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Now: ${now.toISOString()}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Last owner message: ${lastOwnerMessageTime.toISOString()}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - One day ago: ${oneDayAgo.toISOString()}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Seven days ago: ${sevenDaysAgo.toISOString()}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Hours since: ${hoursSinceLastOwnerMessage.toFixed(2)}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Days since: ${daysSinceLastOwnerMessage.toFixed(2)}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Is over 1 day: ${isOverOneDay}`);
    console.log(`🔥 [RECONTACTAR-DEBUG] - Is over 7 days: ${isOverSevenDays}`);

    // Verificar si ya había conversación previa (el prospecto había respondido alguna vez)
    const hadPreviousConversation = messages.length > 0 && 
      messages.some((msg: any) => msg.is_from_prospect === true);
      
    console.log(`🔥 [RECONTACTAR-DEBUG] ¿Había conversación previa? ${hadPreviousConversation}`);

    // 🔥 LÓGICA ALINEADA CON SQL: Usar misma condición que WhatsApp
    if (isOverSevenDays) {
      console.log(`🔥 [RECONTACTAR-DEBUG] ✅ ASIGNANDO ESTADO: WEEK (${daysSinceLastOwnerMessage.toFixed(1)} días)`);
      return { 
        state: 'week', 
        daysSinceLastSent: Math.floor(daysSinceLastOwnerMessage),
        lastSentMessageTime: prospect.last_owner_message_at 
      };
    } else if (isOverOneDay) {
      console.log(`🔥 [RECONTACTAR-DEBUG] ✅ ASIGNANDO ESTADO: YESTERDAY (${daysSinceLastOwnerMessage.toFixed(1)} días)`);
      return { 
        state: 'yesterday', 
        daysSinceLastSent: Math.floor(daysSinceLastOwnerMessage),
        lastSentMessageTime: prospect.last_owner_message_at 
      };
    } else {
      // Menos de 1 día desde mi último mensaje - en PENDING
      console.log(`🔥 [RECONTACTAR-DEBUG] ✅ ASIGNANDO ESTADO: PENDING (${daysSinceLastOwnerMessage.toFixed(1)} días, < 1 día)`);
      return { 
        state: 'pending',
        daysSinceLastSent: Math.floor(daysSinceLastOwnerMessage),
        lastSentMessageTime: prospect.last_owner_message_at 
      };
    }
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
        console.log(`❌ [${shortId}] No hay token de Instagram disponible - NO RETORNAR PROSPECTO`);
        return null; // Cambio crítico: retornar null en lugar de fallback
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

    // NO crear fallback - retornar null para que se filtre el prospecto
    console.log(`❌ [${shortId}] No se pudo obtener username real - prospecto será filtrado`);
    return null;
  };

  const extractUsernameFromMessage = async (messages: InstagramMessage[], senderId: string): Promise<string | null> => {
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
    if (realUsername) {
      console.log(`✅ [${senderId.slice(-8)}] Username obtenido de Instagram API: ${realUsername}`);
      return realUsername;
    }

    // NO FALLBACK: Si no se puede obtener el username real, no mostrar el prospecto
    console.log(`❌ [${senderId.slice(-8)}] No se pudo obtener username válido - prospecto será filtrado`);
    return null;
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
    
    // Determinar estado basado en los mensajes - lógica simplificada temporal
    let state: 'pending' | 'yesterday' | 'week' | 'invited' = 'pending';
    let daysSinceLastSent: number | undefined = undefined;
    let lastSentMessageTime: string | undefined = undefined;
    
    if (lastMessage.message_type === 'sent') {
      const daysSince = (Date.now() - new Date(lastMessage.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      daysSinceLastSent = Math.floor(daysSince);
      lastSentMessageTime = lastMessage.timestamp;
      
      if (daysSince >= 7) {
        state = 'week';
      } else if (daysSince >= 1) {
        state = 'yesterday';
      }
    }
    
    const stateResult = { state, daysSinceLastSent, lastSentMessageTime };
    
    console.log(`🔍 [${senderId.slice(-8)}] Iniciando extracción de username...`);
    const username = await extractUsernameFromMessage(messagesForThisSender, senderId);
    console.log(`🔍 [${senderId.slice(-8)}] Username final obtenido: ${username}`);
    
    // FILTRO CRÍTICO: Si no se pudo obtener un username válido, no crear el prospecto
    if (!username) {
      console.log(`❌ [${senderId.slice(-8)}] No se pudo obtener username válido - prospecto descartado`);
      throw new Error(`No se pudo obtener username válido para ${senderId}`);
    }
    
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

      // 🎯 PASO 1: Obtener lista de usernames de Hower (FILTRO OBLIGATORIO)
      console.log('🔍 [FETCH] Obteniendo usernames de Hower...');
      let howerUsernames: string[] = [];
      
      try {
        const { data: howerResponse, error: howerError } = await supabase.functions.invoke(
          'get-hower-usernames',
          {
            body: { instagram_user_id: currentInstagramUserId }
          }
        );

        if (!howerError && howerResponse?.success && howerResponse?.data?.usernames) {
          howerUsernames = howerResponse.data.usernames;
          console.log(`✅ [FETCH] ${howerUsernames.length} usernames obtenidos de Hower`);
        } else {
          console.log('⚠️ [FETCH] No hay credenciales Hower o error:', howerError?.message || 'No credentials');
          console.log('🚫 [FETCH] Sin filtro Hower - no se mostrarán prospectos');
          setProspects([]);
          return;
        }
      } catch (howerError) {
        console.error('❌ [FETCH] Error obteniendo usernames de Hower:', howerError);
        setProspects([]);
        return;
      }

      // 🏗️ PASO 2: OBTENER PROSPECTOS DESDE SERVICIO
      console.log('📋 [FETCH] Obteniendo prospectos desde servicio...');
      const prospectsData = await prospectService.getProspectsByUser(currentInstagramUserId);
      
      console.log(`📊 [FETCH] ${prospectsData.length} prospectos obtenidos desde BD específica`);

      if (prospectsData.length === 0) {
        console.log('ℹ️ [FETCH] No hay prospectos en las tablas específicas');
        setProspects([]);
        return;
      }

      // 🔄 PASO 3: CONVERTIR datos de BD a formato de Prospect (CON FILTRO HOWER)
      const convertedProspects: Prospect[] = [];
      
       for (const prospectData of prospectsData) {
        try {
          console.log(`🔄 [FETCH] Procesando prospecto: ${prospectData.username} (${prospectData.prospect_instagram_id})`);
          
          // FILTROS CRÍTICOS: Excluir usernames inválidos
          if (!prospectData.username || 
              prospectData.username.startsWith('user_') || 
              prospectData.username.startsWith('prospect_') ||
              prospectData.username === prospectData.prospect_instagram_id ||
              prospectData.username.trim() === '') {
            console.log(`❌ [FETCH] Prospecto filtrado por username inválido: ${prospectData.username}`);
            continue;
          }
          
          // 🎯 FILTRO HOWER OBLIGATORIO: Solo prospectos en la lista de Hower
          const isInHowerList = howerUsernames.some(howerUsername => 
            prospectData.username === howerUsername ||
            prospectData.username === '@' + howerUsername ||
            prospectData.username.replace('@', '') === howerUsername
          );
          
          if (!isInHowerList) {
            console.log(`🚫 [FETCH] Prospecto filtrado por NO estar en lista Hower: ${prospectData.username}`);
            continue;
          }
          
          console.log(`✅ [FETCH] Prospecto ${prospectData.username} está en lista Hower - procesando...`);
          
          // Obtener mensajes del prospecto
          const messages = prospectData.prospect_messages || [];

          // ordenar de mas reciente a mas antiguo
          const sortedMessages = messages.sort((a: any, b: any) => 
            new Date(b.message_timestamp).getTime() - new Date(a.message_timestamp).getTime()
          );
          
          if (sortedMessages.length === 0) {
            console.log(`⚠️ [FETCH] Saltando prospecto sin mensajes: ${prospectData.username}`);
            continue;
          }

          const lastMessage = sortedMessages[0];
          
          // 🔥 NUEVA LÓGICA: Usar determineProspectState con los datos del prospecto
          const stateResult = determineProspectState(prospectData);
          const state = stateResult.state;
          const daysSinceLastSent = stateResult.daysSinceLastSent;
          const lastSentMessageTime = stateResult.lastSentMessageTime;

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
      
      console.log('🔄 [REALTIME] Iniciando suscripción al canal...');
      console.log('📋 [REALTIME] Parámetros de usuario:', { 
        userUUID, 
        instagramUserId: userData.instagram_user_id, 
        username: userData.username 
      });
      
      channel = supabase
        .channel(`prospect-updates-global-${Date.now()}`) // Canal único con timestamp
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'instagram_messages'
            // SIN filtro - todos los usuarios escuchan todos los mensajes
          },
          (payload) => {
            console.log('📨 [REALTIME] ===== MENSAJE DETECTADO =====');
            console.log('🔍 [REALTIME] Payload completo:', payload);
            console.log('🔍 [REALTIME] Nuevo mensaje raw:', payload.new);
            
            const newMessage = payload.new as any;
            
            // 🔥 LÓGICA FINAL CORREGIDA: Basada en los datos reales de la BD
            
            // MENSAJES ENVIADOS POR MÍ: message_type = 'sent' + mi UUID
            const isMessageSentByMe = newMessage.message_type === 'sent' && 
                                    newMessage.instagram_user_id === userUUID;
            
            // MENSAJES RECIBIDOS POR MÍ: message_type = 'received' + mi UUID
            const isMessageReceivedByMe = newMessage.message_type === 'received' && 
                                        newMessage.instagram_user_id === userUUID;
            
            console.log('🔍 [REALTIME] LÓGICA FINAL - Verificando mensaje:', {
              'MI Instagram ID': userData.instagram_user_id,
              'MI UUID': userUUID,
              'Mensaje message_type': newMessage.message_type,
              'Mensaje instagram_user_id': newMessage.instagram_user_id,
              'Mensaje sender_id': newMessage.sender_id,
              'Mensaje recipient_id': newMessage.recipient_id,
              '🚀 ES MENSAJE ENVIADO POR MÍ (sent + mi UUID)': isMessageSentByMe,
              '📨 ES MENSAJE RECIBIDO POR MÍ (received + mi UUID)': isMessageReceivedByMe,
              'usuario': userData.username
            });
            
            if (isMessageReceivedByMe) {
              console.log('✅ [REALTIME] ES MI MENSAJE RECIBIDO - actualizando prospectos...');
              setTimeout(() => {
                fetchProspects();
              }, 500);
            } else if (isMessageSentByMe) {
              console.log('🚀🚀🚀 [REALTIME] ¡MENSAJE ENVIADO DETECTADO!');
              console.log('🎯 [REALTIME] Datos del mensaje enviado:', {
                'message_id': newMessage.id,
                'message_text': newMessage.message_text,
                'recipient_id': newMessage.recipient_id,
                'timestamp': newMessage.timestamp,
                'instagram_user_id': newMessage.instagram_user_id,
                'message_type': newMessage.message_type
              });
              
              // USAR EL RECIPIENT_ID DIRECTO DE LA BD (no raw_data)
              const prospectId = newMessage.recipient_id;
              
              if (!prospectId) {
                console.error('❌ [REALTIME] NO SE ENCONTRÓ recipient_id');
                console.log('🔍 [REALTIME] Mensaje completo:', newMessage);
                return;
              }
              
              console.log(`🔄 [REALTIME] Ejecutando sync para prospecto: ${prospectId}`);
              
              // EJECUTAR SYNC CON LOG DETALLADO
              const syncParams = {
                p_instagram_user_id: userData.instagram_user_id,
                p_prospect_sender_id: prospectId,
                p_last_message_type: 'sent',
                p_task_type: 'pending' // Para mensajes en tiempo real, usar pending por defecto
              };
              
              console.log('📞 [REALTIME] Parámetros para sync:', syncParams);
              
              supabase.rpc('sync_prospect_task_status', syncParams).then((result) => {
                console.log('✅ [REALTIME] SYNC COMPLETADO:', result);
                if (result.error) {
                  console.error('❌ [REALTIME] ERROR EN SYNC:', result.error);
                } else {
                  console.log('🎉 [REALTIME] SYNC EXITOSO - el prospecto debe estar tachado ahora');
                }
                
                // REFRESCAR PROSPECTOS DESPUÉS DE SYNC
                console.log('🔄 [REALTIME] Refrescando lista de prospectos en 300ms...');
                setTimeout(() => {
                  fetchProspects();
                }, 300);
              });
              
            } else {
              console.log(`⚠️ [REALTIME] MENSAJE IGNORADO:`, {
                'message_type': newMessage.message_type,
                'instagram_user_id': newMessage.instagram_user_id,
                'mi_uuid': userUUID,
                'es_sent': newMessage.message_type === 'sent',
                'es_mi_uuid': newMessage.instagram_user_id === userUUID
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
        .subscribe((status, err) => {
          console.log('📡 [REALTIME] Estado de suscripción:', status);
          if (err) {
            console.error('❌ [REALTIME] Error en suscripción:', err);
          }
          if (status === 'SUBSCRIBED') {
            console.log('✅ [REALTIME] ¡SUSCRIPCIÓN ACTIVA CORRECTAMENTE!');
            console.log('🎯 [REALTIME] Esperando mensajes de instagram_messages...');
          } else if (status === 'CLOSED') {
            console.log('❌ [REALTIME] Suscripción cerrada');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('💥 [REALTIME] Error en canal:', err);
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
