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
    console.log('📱 Obteniendo información del usuario de Instagram...');
    
    // Obtener usuario de localStorage primero (SIEMPRE usar estos datos)
    const savedUserData = localStorage.getItem('hower-instagram-user');
    if (!savedUserData) {
      throw new Error('No hay usuario conectado. Por favor, conéctate primero.');
    }
    
    const userData = JSON.parse(savedUserData);
    if (!userData?.instagram?.id) {
      throw new Error('Datos de Instagram incompletos. Por favor, reconéctate.');
    }
    
    console.log('✅ Usando Instagram User ID de localStorage:', userData.instagram.id);
    
    return {
      id: userData.instagram.id,
      user_id: userData.instagram.id,
      username: userData.instagram.username || 'Usuario',
      account_type: 'Business',
      profile_picture_url: userData.instagram.profile_picture_url,
    } as InstagramUser;
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
    console.log('📱 Solicitando posts del usuario ID:', instagramUserId);
    
    const postsResponse = await fetch(
      `https://graph.instagram.com/v23.0/${instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,thumbnail_url&limit=100&access_token=${token}`
    );
    
    if (!postsResponse.ok) {
      const errorData = await postsResponse.json();
      console.error('❌ Error de Instagram API:', errorData);
      console.error('❌ Status:', postsResponse.status);
      console.error('❌ Error completo:', JSON.stringify(errorData, null, 2));
      
      // Capturar el mensaje de error específico
      const errorMessage = errorData.error?.message || errorData.message || 'Error obteniendo posts';
      throw new Error(errorMessage);
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