
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstagramProfile {
  id: string;
  user_id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  token_expires_at?: string;
  page_id?: string;
  is_active: boolean;
  nuevos_prospectos_contactados: number;
  openai_api_key?: string;
  ia_persona?: string;
  created_at: string;
  updated_at: string;
}

export const useInstagramProfiles = () => {
  const [profiles, setProfiles] = useState<InstagramProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profilesData = data || [];
      setProfiles(profilesData);

      // Establecer el primer perfil activo como predeterminado
      const firstActive = profilesData.find(p => p.is_active);
      if (firstActive && !activeProfile) {
        setActiveProfile(firstActive);
      }

    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveProfiles = () => {
    return profiles.filter(p => p.is_active);
  };

  const updateProfileMetrics = async (profileId: string, metrics: Partial<InstagramProfile>) => {
    try {
      const { error } = await supabase
        .from('instagram_profiles')
        .update({ ...metrics, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (error) throw error;
      
      // Actualizar estado local
      setProfiles(prev => 
        prev.map(p => p.id === profileId ? { ...p, ...metrics } : p)
      );

      if (activeProfile?.id === profileId) {
        setActiveProfile(prev => prev ? { ...prev, ...metrics } : null);
      }

    } catch (error) {
      console.error('Error updating profile metrics:', error);
      throw error;
    }
  };

  const incrementNewProspects = async (profileId: string, increment: number = 1) => {
    try {
      const { error } = await supabase.rpc('increment_nuevos_prospectos', {
        profile_id: profileId,
        increment_by: increment
      });

      if (error) throw error;
      
      // Refrescar perfiles
      fetchProfiles();
    } catch (error) {
      console.error('Error incrementing prospects:', error);
    }
  };

  const resetNewProspects = async (profileId: string) => {
    try {
      const { error } = await supabase.rpc('reset_nuevos_prospectos', {
        profile_id: profileId
      });

      if (error) throw error;
      
      // Refrescar perfiles
      fetchProfiles();
    } catch (error) {
      console.error('Error resetting prospects:', error);
    }
  };

  const getProfileMetrics = async (profileId: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_advanced_metrics_by_profile', {
        profile_id: profileId
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching profile metrics:', error);
      return null;
    }
  };

  return {
    profiles,
    activeProfile,
    setActiveProfile,
    loading,
    fetchProfiles,
    getActiveProfiles,
    updateProfileMetrics,
    incrementNewProspects,
    resetNewProspects,
    getProfileMetrics
  };
};
