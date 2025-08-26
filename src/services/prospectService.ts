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
   * Obtener todos los prospectos de un usuario
   */
  async getProspectsByUser(instagramUserId: string): Promise<any[]> {
    console.log('📋 [PROSPECT-SERVICE] Obteniendo prospectos del usuario:', instagramUserId);

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

      // Obtener análisis de prospectos por separado
      const prospectsWithAnalysis = await Promise.all(
        (prospects || []).map(async (prospect) => {
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

      console.log(`✅ [PROSPECT-SERVICE] ${prospectsWithAnalysis?.length || 0} prospectos obtenidos`);
      return prospectsWithAnalysis || [];

    } catch (error) {
      console.error('❌ [PROSPECT-SERVICE] Error en getProspectsByUser:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const prospectService = new ProspectService();