
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstagramUser {
  id: string;
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

export const useInstagramUsers = () => {
  const [currentUser, setCurrentUser] = useState<InstagramUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del usuario desde localStorage como fallback
      const savedUserData = localStorage.getItem('hower-instagram-user');
      if (!savedUserData) {
        setLoading(false);
        return;
      }

      const userData = JSON.parse(savedUserData);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;
      
      if (!instagramUserId) {
        setLoading(false);
        return;
      }

      // Buscar usuario en Supabase
      const { data, error } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setCurrentUser(data);
      }

    } catch (error) {
      console.error('Error checking current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateUser = async (userData: {
    instagram_user_id: string;
    username: string;
    access_token: string;
    page_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('instagram_users')
        .upsert({
          instagram_user_id: userData.instagram_user_id,
          username: userData.username,
          access_token: userData.access_token,
          page_id: userData.page_id,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instagram_user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(data);
      return { success: true, user: data };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return { success: false, error };
    }
  };

  const updateUserMetrics = async (metrics: Partial<InstagramUser>) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('instagram_users')
        .update({ ...metrics, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      setCurrentUser(prev => prev ? { ...prev, ...metrics } : null);
    } catch (error) {
      console.error('Error updating user metrics:', error);
      throw error;
    }
  };

  const getCurrentUserToken = () => {
    return currentUser?.access_token || null;
  };

  return {
    currentUser,
    loading,
    checkCurrentUser,
    createOrUpdateUser,
    updateUserMetrics,
    getCurrentUserToken
  };
};
