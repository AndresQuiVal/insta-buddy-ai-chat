import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando sincronización automática de nuevas publicaciones...');

    // Inicializar cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let totalNewAssignments = 0;
    let processedUsers = 0;
    const results: any[] = [];

    // 1. Obtener todos los autoresponders que deben aplicarse automáticamente a todas las publicaciones
    const { data: autoAutoresponders, error: autoRespondersError } = await supabase
      .from('general_comment_autoresponders')
      .select('*')
      .eq('auto_assign_to_all_posts', true)
      .eq('is_active', true);

    if (autoRespondersError) {
      console.error('❌ Error obteniendo autoresponders automáticos:', autoRespondersError);
      throw autoRespondersError;
    }

    if (!autoAutoresponders || autoAutoresponders.length === 0) {
      console.log('📝 No hay autoresponders configurados para asignación automática');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay autoresponders con asignación automática configurados',
          stats: { processedUsers: 0, totalNewAssignments: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontrados ${autoAutoresponders.length} autoresponders con asignación automática`);

    // 2. Agrupar autoresponders por usuario
    const userAutoresponders = autoAutoresponders.reduce((acc, autoresponder) => {
      if (!acc[autoresponder.user_id]) {
        acc[autoresponder.user_id] = [];
      }
      acc[autoresponder.user_id].push(autoresponder);
      return acc;
    }, {} as Record<string, any[]>);

    // 3. Para cada usuario, obtener sus datos de Instagram y sincronizar posts
    for (const [userId, userAutorespondersList] of Object.entries(userAutoresponders)) {
      try {
        console.log(`👤 Procesando usuario: ${userId}`);
        
        // Obtener datos del usuario de Instagram
        const { data: instagramUser, error: userError } = await supabase
          .from('instagram_users')
          .select('*')
          .eq('instagram_user_id', userId)
          .eq('is_active', true)
          .single();

        if (userError || !instagramUser) {
          console.log(`⚠️ Usuario ${userId} no encontrado o inactivo, saltando...`);
          continue;
        }

        console.log(`📱 Usuario encontrado: @${instagramUser.username}`);

        // Obtener publicaciones de Instagram usando el token del usuario
        const posts = await fetchInstagramPosts(instagramUser.access_token);
        
        if (!posts || posts.length === 0) {
          console.log(`📭 No se encontraron publicaciones para ${instagramUser.username}`);
          continue;
        }

        console.log(`📝 Encontradas ${posts.length} publicaciones de @${instagramUser.username}`);

        // 4. Para cada autoresponder del usuario, verificar qué posts nuevos necesitan asignación
        let userNewAssignments = 0;

        for (const autoresponder of userAutorespondersList) {
          // Obtener asignaciones existentes para este autoresponder
          const { data: existingAssignments, error: assignmentsError } = await supabase
            .from('post_autoresponder_assignments')
            .select('post_id')
            .eq('general_autoresponder_id', autoresponder.id);

          if (assignmentsError) {
            console.error(`❌ Error obteniendo asignaciones existentes para autoresponder ${autoresponder.id}:`, assignmentsError);
            continue;
          }

          const existingPostIds = new Set(existingAssignments?.map(a => a.post_id) || []);
          
          // Filtrar posts nuevos que no tienen asignación
          const newPosts = posts.filter(post => !existingPostIds.has(post.id));

          if (newPosts.length === 0) {
            console.log(`✅ No hay nuevos posts para autoresponder "${autoresponder.name}"`);
            continue;
          }

          console.log(`🆕 Encontrados ${newPosts.length} nuevos posts para autoresponder "${autoresponder.name}"`);

          // Crear asignaciones para los nuevos posts
          const newAssignments = newPosts.map(post => ({
            general_autoresponder_id: autoresponder.id,
            user_id: userId,
            post_id: post.id,
            post_url: post.permalink,
            post_caption: post.caption || '',
            is_active: true,
          }));

          const { error: insertError } = await supabase
            .from('post_autoresponder_assignments')
            .insert(newAssignments);

          if (insertError) {
            console.error(`❌ Error creando asignaciones para autoresponder ${autoresponder.id}:`, insertError);
            continue;
          }

          userNewAssignments += newPosts.length;
          console.log(`✅ ${newPosts.length} nuevas asignaciones creadas para "${autoresponder.name}"`);
        }

        totalNewAssignments += userNewAssignments;
        processedUsers++;

        results.push({
          userId,
          username: instagramUser.username,
          postsFound: posts.length,
          newAssignments: userNewAssignments,
          autoresponders: userAutorespondersList.length
        });

        console.log(`👤 Usuario ${instagramUser.username} procesado: ${userNewAssignments} nuevas asignaciones`);

      } catch (userError) {
        console.error(`❌ Error procesando usuario ${userId}:`, userError);
        results.push({
          userId,
          error: userError.message,
          newAssignments: 0
        });
      }
    }

    console.log(`🎉 Sincronización completada: ${totalNewAssignments} nuevas asignaciones en ${processedUsers} usuarios`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización completada exitosamente`,
        stats: {
          processedUsers,
          totalNewAssignments,
          autoresponders: autoAutoresponders.length
        },
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error en sincronización automática:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Error durante la sincronización automática de publicaciones'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Obtiene publicaciones de Instagram usando Graph API
 */
async function fetchInstagramPosts(accessToken: string): Promise<InstagramPost[]> {
  try {
    console.log('📱 Obteniendo publicaciones de Instagram...');

    // Primero obtenemos la información del usuario
    const userResponse = await fetch(
      `https://graph.instagram.com/v23.0/me?fields=id,user_id,username&access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('❌ Error obteniendo info del usuario:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo información del usuario');
    }

    const userData = await userResponse.json();
    const instagramUserId = userData.user_id;

    // Obtener posts de Instagram usando el ID del usuario
    const postsResponse = await fetch(
      `https://graph.instagram.com/v23.0/${instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=50&access_token=${accessToken}`
    );
    
    if (!postsResponse.ok) {
      const errorData = await postsResponse.json();
      console.error('❌ Error de Instagram API:', errorData);
      throw new Error(errorData.error?.message || 'Error obteniendo posts');
    }
    
    const postsData = await postsResponse.json();
    console.log(`✅ ${postsData.data?.length || 0} posts obtenidos de Instagram`);
    
    return postsData.data || [];
  } catch (error) {
    console.error('❌ Error en fetchInstagramPosts:', error);
    throw error;
  }
}