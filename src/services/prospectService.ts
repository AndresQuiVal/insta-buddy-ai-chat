import { supabase } from '@/integrations/supabase/client';

export interface ProspectServiceInterface {
  createOrUpdateProspect: (
    instagramUserId: string,
    prospectInstagramId: string,
    username: string,
    profilePictureUrl?: string
  ) => Promise<string>;
  
  addProspectMessage: (
    prospectId: string,
    messageInstagramId: string,
    messageText: string,
    isFromProspect: boolean,
    messageTimestamp: string,
    messageType?: string,
    rawData?: any
  ) => Promise<string>;

  getProspectsByUser: (
    instagramUserId: string
  ) => Promise<any[]>;
}

export class ProspectService implements ProspectServiceInterface {
  
  /**
   * Crear o actualizar un prospecto en la base de datos
   */
  async createOrUpdateProspect(
    instagramUserId: string,
    prospectInstagramId: string,
    username: string,
    profilePictureUrl?: string
  ): Promise<string> {
    console.log('🏗️ [PROSPECT-SERVICE] Creando/actualizando prospecto:', {
      instagramUserId,
      prospectInstagramId,
      username,
      profilePictureUrl
    });

    try {
      // Buscar el UUID del usuario de Instagram
      const { data: userData, error: userError } = await supabase
        .from('instagram_users')
        .select('id')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (userError || !userData) {
        throw new Error(`Usuario Instagram no encontrado: ${instagramUserId}`);
      }

      const userUUID = userData.id;

      // Usar la función de base de datos para crear/actualizar el prospecto
      const { data, error } = await supabase
        .rpc('create_or_update_prospect', {
          p_instagram_user_id: userUUID,
          p_prospect_instagram_id: prospectInstagramId,
          p_username: username,
          p_profile_picture_url: profilePictureUrl
        });

      if (error) {
        console.error('❌ Error creando/actualizando prospecto:', error);
        throw error;
      }

      console.log('✅ [PROSPECT-SERVICE] Prospecto creado/actualizado con ID:', data);
      return data;

    } catch (error) {
      console.error('❌ [PROSPECT-SERVICE] Error en createOrUpdateProspect:', error);
      throw error;
    }
  }

  /**
   * Agregar un mensaje al prospecto
   */
  async addProspectMessage(
    prospectId: string,
    messageInstagramId: string,
    messageText: string,
    isFromProspect: boolean,
    messageTimestamp: string,
    messageType: string = 'text',
    rawData?: any
  ): Promise<string> {
    console.log('💬 [PROSPECT-SERVICE] Agregando mensaje al prospecto:', {
      prospectId,
      messageInstagramId,
      isFromProspect,
      messageType,
      messageText: messageText.substring(0, 50) + '...'
    });

    try {
      // Usar la función de base de datos para agregar el mensaje
      const { data, error } = await supabase
        .rpc('add_prospect_message', {
          p_prospect_id: prospectId,
          p_message_instagram_id: messageInstagramId,
          p_message_text: messageText,
          p_is_from_prospect: isFromProspect,
          p_message_timestamp: messageTimestamp,
          p_message_type: messageType,
          p_raw_data: rawData
        });

      if (error) {
        console.error('❌ Error agregando mensaje del prospecto:', error);
        throw error;
      }

      console.log('✅ [PROSPECT-SERVICE] Mensaje agregado con ID:', data);
      return data;

    } catch (error) {
      console.error('❌ [PROSPECT-SERVICE] Error en addProspectMessage:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los prospectos de un usuario (CON FILTRO DE TACHADOS)
   */
  async getProspectsByUser(instagramUserId: string): Promise<any[]> {
    console.log('📋 [PROSPECT-SERVICE] Obteniendo prospectos con filtro de tachados para usuario:', instagramUserId);

    try {
      // Buscar el UUID del usuario de Instagram
      const { data: userData, error: userError } = await supabase
        .from('instagram_users')
        .select('id')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (userError || !userData) {
        throw new Error(`Usuario Instagram no encontrado: ${instagramUserId}`);
      }

      const userUUID = userData.id;

      // Obtener prospectos con sus mensajes - FILTROS ESTRICTOS
      const { data: prospects, error: prospectsError } = await supabase
        .from('prospects')
        .select(`
          *,
          prospect_messages (
            *
          )
        `)
        .eq('instagram_user_id', userUUID)  // FILTRO POR USUARIO ESPECÍFICO
        .not('username', 'like', 'user_%')  // EXCLUIR usernames genéricos user_*
        .not('username', 'like', 'prospect_%')  // EXCLUIR usernames genéricos prospect_*
        .neq('username', '')  // EXCLUIR usernames vacíos
        .order('last_message_date', { ascending: false });

      if (prospectsError) {
        console.error('❌ Error obteniendo prospectos:', prospectsError);
        throw prospectsError;
      }

      // 🔥 NUEVO: Obtener estados de tareas para filtrar tachados (igual que WhatsApp SQL)
      const { data: taskStatuses, error: taskError } = await supabase
        .from('prospect_task_status')
        .select('prospect_sender_id, is_completed, completed_at, last_message_type')
        .eq('instagram_user_id', instagramUserId)
        .eq('task_type', 'pending');

      if (taskError) {
        console.error('⚠️ [PROSPECT-SERVICE] Error obteniendo estados de tareas:', taskError);
      }

      // Crear mapa de estados de tareas
      const taskStatusMap = new Map();
      if (taskStatuses) {
        taskStatuses.forEach(task => {
          taskStatusMap.set(task.prospect_sender_id, task.is_completed);
        });
      }

      // 🔥 APLICAR FILTRO DE TACHADOS CON LÓGICA DE RECONTACTO (24 HORAS)
      console.log(`🔥🔥🔥 [PROSPECT-SERVICE] ===== INICIANDO FILTRADO DE TACHADOS =====`);
      console.log(`🔥🔥🔥 [PROSPECT-SERVICE] Total prospectos a evaluar: ${prospects?.length || 0}`);
      console.log(`🔥🔥🔥 [PROSPECT-SERVICE] TaskStatuses encontrados: ${taskStatuses?.length || 0}`);
      
      if (taskStatuses && taskStatuses.length > 0) {
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] Primeros 3 taskStatuses:`, taskStatuses.slice(0, 3));
      }
      
      // Usar Promise.all para procesar filtros de manera asíncrona
      const filteredProspectsPromises = prospects?.map(async (prospect) => {
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] ===== EVALUANDO PROSPECTO =====`);
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] Username: ${prospect.username}`);
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] ID: ${prospect.prospect_instagram_id}`);
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] last_message_from_prospect (antes): ${prospect.last_message_from_prospect}`);
        
        const taskStatus = taskStatuses?.find(task => 
          task.prospect_sender_id === prospect.prospect_instagram_id
        );
        
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] TaskStatus encontrado:`, taskStatus);
        
        if (!taskStatus) {
          // No hay estado de tarea = incluir siempre
          console.log(`✅ [PROSPECT-SERVICE] Prospecto ${prospect.username} incluido (sin taskStatus)`);
          return prospect;
        }
        
        const { is_completed, completed_at, last_message_type } = taskStatus;
        
        // 🔥 LÓGICA PRINCIPAL: Si no está completado = incluir siempre
        if (!is_completed) {
          console.log(`✅ [PROSPECT-SERVICE] Prospecto ${prospect.username} incluido (no completado)`);
          return prospect;
        }
        
        // 🔥 LÓGICA DE RECONTACTO: Solo aplica si está completado Y hay completed_at y last_message_type = 'sent'
        console.log(`🔍 [PROSPECT-SERVICE] Evaluando recontacto para ${prospect.username}: is_completed=${is_completed}, last_message_type=${last_message_type}, completed_at=${completed_at}`);
        
        if (is_completed && last_message_type === 'sent' && completed_at) {
          const completedDate = new Date(completed_at);
          const now = new Date();
          const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
          
          console.log(`⏰ [PROSPECT-SERVICE] ${prospect.username}: ${Math.round(hoursSinceCompleted)}h desde completed_at`);
          
          if (hoursSinceCompleted > 24) {
            console.log(`🔄 [PROSPECT-SERVICE] Prospecto ${prospect.username} necesita recontacto (${Math.round(hoursSinceCompleted)}h > 24h)`);
            
            // Actualizar en memoria para la UI
            prospect.last_owner_message_at = completed_at;
            prospect.last_message_from_prospect = false;
            
            console.log(`📝 [PROSPECT-SERVICE] Actualizando BD para ${prospect.username}: last_owner_message_at=${completed_at}, last_message_from_prospect=false`);
            
            // Actualizar en la base de datos
            const { data: updateData, error: updateError } = await supabase
              .from('prospects')
              .update({ 
                last_owner_message_at: completed_at,
                last_message_from_prospect: false
              })
              .eq('instagram_user_id', prospect.instagram_user_id)
              .eq('prospect_instagram_id', prospect.prospect_instagram_id)
              .select();
            
            if (updateError) {
              console.error(`❌ [PROSPECT-SERVICE] Error actualizando prospect ${prospect.username}:`, updateError);
            } else {
              console.log(`✅ [PROSPECT-SERVICE] BD actualizada para ${prospect.username}. Registros: ${updateData?.length || 0}`);
            }
            
            // Destachar el prospecto
            const { error: taskError } = await supabase
              .from('prospect_task_status')
              .update({ is_completed: false })
              .eq('instagram_user_id', instagramUserId)
              .eq('prospect_sender_id', prospect.prospect_instagram_id)
              .eq('task_type', 'pending');
            
            if (taskError) {
              console.error(`❌ [PROSPECT-SERVICE] Error destachando ${prospect.username}:`, taskError);
            } else {
              console.log(`✅ [PROSPECT-SERVICE] Prospecto ${prospect.username} destachado`);
            }
            
            return prospect;
          } else {
            // Completado hace menos de 24h = filtrar
            console.log(`🚫 [PROSPECT-SERVICE] Prospecto ${prospect.username} filtrado (completado hace ${Math.round(hoursSinceCompleted)}h < 24h)`);
            return null;
          }
        }
        
        // Si está completado pero sin last_message_type='sent' o sin completed_at
        console.log(`🚫 [PROSPECT-SERVICE] Prospecto ${prospect.username} filtrado (completado sin envío válido)`);
        return null;
      }) || [];

      // Esperar a que todas las promesas se resuelvan y filtrar nulls
      const filteredProspectsResults = await Promise.all(filteredProspectsPromises);
      const filteredProspects = filteredProspectsResults.filter(prospect => prospect !== null);

      console.log(`✅ [PROSPECT-SERVICE] ${filteredProspects.length} prospectos NO tachados (de ${prospects?.length || 0} totales)`);

      // Obtener análisis de prospectos por separado
      const prospectsWithAnalysis = await Promise.all(
        filteredProspects.map(async (prospect) => {
          const { data: analysis } = await supabase
            .from('prospect_analysis')
            .select('match_points, met_traits, last_analyzed_at')
            .eq('sender_id', prospect.prospect_instagram_id)
            .maybeSingle();

          return {
            ...prospect,
            prospect_analysis: analysis ? [analysis] : []
          };
        })
      );

      console.log(`🔥🔥🔥 [PROSPECT-SERVICE] ===== RESULTADO FINAL =====`);
      console.log(`🔥🔥🔥 [PROSPECT-SERVICE] ${prospectsWithAnalysis?.length || 0} prospectos finales con análisis`);
      
      // Debug: Verificar el estado final de last_message_from_prospect
      prospectsWithAnalysis.forEach(prospect => {
        console.log(`🔥🔥🔥 [PROSPECT-SERVICE] Final ${prospect.username}: last_message_from_prospect = ${prospect.last_message_from_prospect}`);
      });
      
      return prospectsWithAnalysis || [];

    } catch (error) {
      console.error('❌ [PROSPECT-SERVICE] Error en getProspectsByUser:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const prospectService = new ProspectService();