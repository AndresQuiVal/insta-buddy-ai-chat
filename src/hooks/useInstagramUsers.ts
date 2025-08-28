
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

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      console.log('🔍 Verificando usuario actual...');
      
      // Obtener datos del usuario desde localStorage
      const savedUserData = localStorage.getItem('hower-instagram-user');
      console.log('📱 Datos en localStorage:', savedUserData);
      
      if (!savedUserData) {
        console.log('❌ No hay datos en localStorage');
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const userData = JSON.parse(savedUserData);
      
      // ✅ USAR INSTAGRAM ID COMO PREFIERES
      const instagramUserId = userData.instagram?.id;
      
      console.log('🆔 Instagram User ID extraído (INSTAGRAM ID):', instagramUserId);
      console.log('📊 Datos completos del usuario:', userData);
      console.log('📋 Instagram ID:', userData.instagram?.id);
      console.log('📋 Facebook ID:', userData.facebook?.id);
      
      if (!instagramUserId) {
        console.log('❌ No se pudo extraer Instagram User ID');
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Buscar usuario en Supabase
      console.log('🔎 Buscando en Supabase con ID:', instagramUserId);
      const { data, error } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error buscando usuario en Supabase:', error);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Usuario encontrado en Supabase:', data);
        setCurrentUser(data);
      } else {
        console.log('⚠️ Usuario no encontrado en Supabase con ID:', instagramUserId);
        console.log('🔍 Verificando todos los usuarios en BD...');
        
        // Debug: mostrar todos los usuarios
        const { data: allUsers } = await supabase
          .from('instagram_users')
          .select('instagram_user_id, username');
        console.log('📊 Usuarios en BD:', allUsers);
        
        // 🔄 NUEVO: Verificar si hay un usuario con el mismo username pero diferente ID
        if (userData.instagram?.username) {
          const { data: userByUsername } = await supabase
            .from('instagram_users')
            .select('*')
            .eq('username', userData.instagram.username)
            .maybeSingle();
          
          if (userByUsername) {
            console.log('🔄 [FIX] Usuario encontrado por username con ID diferente:', userByUsername);
            console.log(`🔄 [FIX] Actualizando localStorage: ${instagramUserId} → ${userByUsername.instagram_user_id}`);
            
            // Actualizar los datos en localStorage con el ID correcto
            const updatedUserData = {
              ...userData,
              instagram: {
                ...userData.instagram,
                id: userByUsername.instagram_user_id
              }
            };
            
            localStorage.setItem('hower-instagram-user', JSON.stringify(updatedUserData));
            
            console.log('✅ [FIX] LocalStorage actualizado con ID correcto');
            setCurrentUser(userByUsername);
            
            return; // Salir temprano porque encontramos y actualizamos
          }
        }
        
        setCurrentUser(null);
      }

    } catch (error) {
      console.error('💥 Error en checkCurrentUser:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentUser();
  }, []);

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

  useEffect(() => {
    checkCurrentUser();
  }, []);

  return {
    currentUser,
    loading,
    checkCurrentUser,
    createOrUpdateUser,
    updateUserMetrics,
    getCurrentUserToken
  };
};
