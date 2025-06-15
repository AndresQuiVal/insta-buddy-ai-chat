
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prospect {
  id: string;
  instagram_user_id: string;
  prospect_instagram_id: string;
  username: string;
  profile_picture_url?: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_from_prospect: boolean;
  status: 'esperando_respuesta' | 'en_seguimiento';
  created_at: string;
  updated_at: string;
}

export interface ProspectMessage {
  id: string;
  prospect_id: string;
  message_instagram_id: string;
  message_text?: string;
  is_from_prospect: boolean;
  message_timestamp: string;
  message_type?: string;
  raw_data?: any;
  created_at: string;
}

export const useNewProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario de Instagram del localStorage
      const userDataString = localStorage.getItem('hower-instagram-user');
      if (!userDataString) {
        throw new Error('No hay información de usuario de Instagram disponible');
      }

      const userData = JSON.parse(userDataString);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;
      
      if (!instagramUserId) {
        throw new Error('No se pudo obtener el ID del usuario de Instagram');
      }

      console.log('🔍 Obteniendo prospectos para Instagram User ID:', instagramUserId);

      // Buscar el usuario en la tabla instagram_users para obtener el UUID
      const { data: instagramUser, error: userError } = await supabase
        .from('instagram_users')
        .select('id')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (userError || !instagramUser) {
        console.error('❌ Usuario no encontrado en instagram_users:', userError);
        throw new Error('Usuario no encontrado en la base de datos');
      }

      console.log('✅ Usuario encontrado con UUID:', instagramUser.id);

      // Obtener prospectos usando el UUID del usuario
      const { data: prospectsData, error: prospectsError } = await supabase
        .from('prospects')
        .select('*')
        .eq('instagram_user_id', instagramUser.id)
        .order('last_message_date', { ascending: false });

      if (prospectsError) {
        console.error('❌ Error obteniendo prospectos:', prospectsError);
        throw prospectsError;
      }

      console.log('✅ Prospectos obtenidos:', prospectsData?.length || 0);
      
      // Asegurar que el status tenga el tipo correcto
      const typedProspects: Prospect[] = (prospectsData || []).map(prospect => ({
        ...prospect,
        status: prospect.status as 'esperando_respuesta' | 'en_seguimiento'
      }));
      
      setProspects(typedProspects);

    } catch (error) {
      console.error('❌ Error en fetchProspects:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getProspectMessages = async (prospectId: string): Promise<ProspectMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('prospect_messages')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('message_timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo mensajes del prospecto:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getProspectMessages:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProspects();

    // Suscribirse a cambios en tiempo real
    console.log('🔄 Configurando suscripción en tiempo real para prospectos...');
    const channel = supabase
      .channel('prospects-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prospects'
        },
        (payload) => {
          console.log('📨 Cambio detectado en prospects:', payload);
          fetchProspects();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prospect_messages'
        },
        (payload) => {
          console.log('📨 Cambio detectado en prospect_messages:', payload);
          fetchProspects();
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción prospects:', status);
      });

    return () => {
      console.log('🔌 Desconectando suscripción prospects');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    prospects,
    loading,
    error,
    refetch: fetchProspects,
    getProspectMessages
  };
};
