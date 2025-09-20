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
      const filteredProspects = prospects?.filter(prospect => {
        const taskStatus = taskStatuses?.find(task => 
          task.prospect_sender_id === prospect.prospect_instagram_id
        );
        
        if (!taskStatus) {
          // No hay estado de tarea = incluir
          return true;
        }
        
        const { is_completed, completed_at, last_message_type } = taskStatus;
        
        if (!is_completed) {
          // No está completado = incluir
          return true;
        }
        
        // Está completado - verificar si debe reaparecer para recontacto
        if (last_message_type === 'sent' && completed_at) {
          const completedDate = new Date(completed_at);
          const now = new Date();
          const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
          
          const shouldReappear = hoursSinceCompleted > 24;
          
          if (shouldReappear) {
            console.log(`🔄 [PROSPECT-SERVICE] Prospecto ${prospect.username} reapareció para recontacto (${Math.round(hoursSinceCompleted)}h desde completado)`);
            
            // Sobreescribir last_owner_message_at con completed_at para correcta categorización UI
            prospect.last_owner_message_at = completed_at;
            
            // Destachar el prospecto (marcar como no completado)
            supabase
              .from('prospect_task_status')
              .update({ is_completed: false })
              .eq('instagram_user_id', instagramUserId)
              .eq('prospect_sender_id', prospect.prospect_instagram_id)
              .eq('task_type', 'pending')
              .then(() => console.log(`✅ [PROSPECT-SERVICE] Prospecto ${prospect.username} destachado automáticamente`));
            
            return true;
          } else {
            console.log(`🚫 [PROSPECT-SERVICE] Prospecto ${prospect.username} filtrado (completado hace ${Math.round(hoursSinceCompleted)}h < 24h)`);
            return false;
          }
        } else {
          // Completado pero sin envío previo = no incluir
          console.log(`🚫 [PROSPECT-SERVICE] Prospecto ${prospect.username} filtrado (completado sin envío previo)`);
          return false;
        }
      }) || [];

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

      console.log(`✅ [PROSPECT-SERVICE] ${prospectsWithAnalysis?.length || 0} prospectos finales con análisis`);
      return prospectsWithAnalysis || [];

    } catch (error) {
      console.error('❌ [PROSPECT-SERVICE] Error en getProspectsByUser:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const prospectService = new ProspectService();