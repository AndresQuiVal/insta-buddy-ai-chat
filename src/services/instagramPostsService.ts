
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

/**
 * Obtiene los posts recientes de Instagram usando Graph API
 */
export const getInstagramPosts = async (): Promise<InstagramPost[]> => {
  try {
    const token = localStorage.getItem('hower-instagram-token');
    
    if (!token) {
      throw new Error('No hay token de Instagram disponible');
    }

    console.log('🔍 Obteniendo posts de Instagram...');

    // Primero obtenemos las páginas del usuario
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`);
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('❌ Error obteniendo páginas:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo información de la cuenta');
    }
    
    const accountsData = await userResponse.json();
    console.log('📋 Páginas encontradas:', accountsData.data?.length || 0);
    
    // Buscar página con Instagram Business Account
    const pageWithInstagram = accountsData.data?.find((page: any) => page.instagram_business_account);
    
    if (!pageWithInstagram) {
      throw new Error('No se encontró cuenta de Instagram Business conectada');
    }
    
    const instagramAccountId = pageWithInstagram.instagram_business_account.id;
    console.log('📱 Instagram Business Account ID:', instagramAccountId);

    // Obtener posts de Instagram usando el ID correcto
    const postsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,thumbnail_url&limit=20&access_token=${token}`
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
