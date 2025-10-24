import { supabase } from '@/integrations/supabase/client';

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
}

export interface InstagramUser {
  id: string;
  user_id: string;
  username: string;
  name?: string;
  account_type?: 'Business' | 'Media_Creator';
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

/**
 * Obtiene la información del usuario de Instagram
 */
export const getInstagramUserInfo = async (): Promise<InstagramUser> => {
  try {
    const token = localStorage.getItem('hower-instagram-token');
    
    if (!token) {
      throw new Error('No hay token de Instagram disponible');
    }

    console.log('🔍 Obteniendo información del usuario de Instagram...');

    const response = await fetch(
      `https://graph.instagram.com/v23.0/me?fields=id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${token}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error obteniendo información del usuario:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo información del usuario');
    }

    const userData = await response.json();
    console.log('✅ Información del usuario obtenida:', userData);

    return userData;
  } catch (error) {
    console.error('❌ Error en getInstagramUserInfo:', error);
    throw error;
  }
};

/**
 * Obtiene los posts recientes de Instagram usando Graph API
 */
export const getInstagramPosts = async (): Promise<InstagramPost[]> => {
  try {
    const token = localStorage.getItem('hower-instagram-token');
    
    if (!token) {
      throw new Error('No hay token de Instagram disponible');
    }

    console.log('🔍 Obteniendo información del usuario...');
    
    // Primero obtenemos la información del usuario
    const userInfo = await getInstagramUserInfo();
    const instagramUserId = userInfo.user_id;

    console.log('📱 Instagram User ID:', instagramUserId);

    // Obtener posts de Instagram usando el ID del usuario
    const postsResponse = await fetch(
      `https://graph.instagram.com/v23.0/${instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,thumbnail_url&limit=100&access_token=${token}`
    );
    
    if (!postsResponse.ok) {
      const errorData = await postsResponse.json();
      console.error('❌ Error de Instagram API:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo posts');
    }
    
    const postsData = await postsResponse.json();
    console.log('✅ Posts obtenidos:', postsData.data?.length || 0);
    
    return postsData.data || [];
  } catch (error) {
    console.error('❌ Error en getInstagramPosts:', error);
    throw error;
  }
};

/**
 * Formatea la fecha de un post de Instagram
 */
export const formatPostDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Trunca el caption de un post para mostrar un preview
 */
export const truncateCaption = (caption: string | undefined, maxLength: number = 100): string => {
  if (!caption) return 'Sin descripción';
  return caption.length > maxLength ? caption.substring(0, maxLength) + '...' : caption;
};