import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔄 Iniciando procesamiento de estados de prospectos...");
    
    // Obtener todos los usuarios activos de Instagram
    const { data: instagramUsers, error: usersError } = await supabase
      .from('instagram_users')
      .select('instagram_user_id, username')
      .eq('is_active', true);

    if (usersError) {
      console.error("❌ Error al obtener usuarios de Instagram:", usersError);
      throw usersError;
    }

    console.log(`👥 Procesando ${instagramUsers?.length || 0} usuarios`);

    const results = [];

    for (const user of instagramUsers || []) {
      try {
        console.log(`📱 Procesando usuario: ${user.username} (${user.instagram_user_id})`);

        // Obtener todas las conversaciones del usuario
        const { data: conversations, error: messagesError } = await supabase
          .from('instagram_messages')
          .select(`
            sender_id,
            recipient_id,
            message_type,
            timestamp,
            message_text,
            raw_data
          `)
          .eq('instagram_user_id', (
            await supabase
              .from('instagram_users')
              .select('id')
              .eq('instagram_user_id', user.instagram_user_id)
              .single()
          ).data?.id)
          .order('timestamp', { ascending: false });

        if (messagesError) {
          console.error(`❌ Error al obtener mensajes para ${user.username}:`, messagesError);
          continue;
        }

        // Agrupar mensajes por sender_id (prospecto)
        const conversationMap = new Map();
        
        for (const message of conversations || []) {
          const senderId = message.sender_id;
          
          if (!conversationMap.has(senderId)) {
            conversationMap.set(senderId, []);
          }
          
          conversationMap.get(senderId).push(message);
        }

        let updatedCount = 0;

        // Procesar cada conversación
        for (const [senderId, messages] of conversationMap.entries()) {
          try {
            // Ordenar mensajes por timestamp descendente (más reciente primero)
            messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            const lastMessage = messages[0];
            const now = new Date();
            const lastMessageDate = new Date(lastMessage.timestamp);
            const daysDiff = Math.floor((now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Extraer username del raw_data o usar un valor por defecto
            let username = 'unknown';
            try {
              if (lastMessage.raw_data) {
                const rawData = typeof lastMessage.raw_data === 'string' 
                  ? JSON.parse(lastMessage.raw_data) 
                  : lastMessage.raw_data;
                username = rawData?.sender?.username || rawData?.username || senderId;
              }
            } catch (e) {
              console.warn(`⚠️ No se pudo extraer username para ${senderId}, usando ID como fallback`);
              username = senderId;
            }

            // Determinar el estado basado en el tipo del último mensaje
            let newState = 'responded';
            let lastClientMessage = null;
            let lastProspectMessage = null;

            // Buscar el último mensaje del cliente y del prospecto
            for (const msg of messages) {
              if (msg.message_type === 'sent' && !lastClientMessage) {
                lastClientMessage = new Date(msg.timestamp);
              }
              if (msg.message_type === 'received' && !lastProspectMessage) {
                lastProspectMessage = new Date(msg.timestamp);
              }
            }

            // Si el último mensaje es del cliente (sent) y no ha respondido el prospecto
            if (lastMessage.message_type === 'sent') {
              if (daysDiff >= 7) {
                newState = 'no_response_7days';
              } else if (daysDiff >= 1) {
                newState = 'no_response_1day';
              } else {
                newState = 'pending_response';
              }
            }

            // Actualizar o crear el estado del prospecto
            await supabase.rpc('update_prospect_state', {
              p_instagram_user_id: user.instagram_user_id,
              p_prospect_username: username,
              p_prospect_sender_id: senderId,
              p_state: newState,
              p_last_client_message_at: lastClientMessage?.toISOString(),
              p_last_prospect_message_at: lastProspectMessage?.toISOString()
            });

            updatedCount++;

            console.log(`✅ Actualizado estado de ${username}: ${newState}`);

          } catch (convError) {
            console.error(`❌ Error procesando conversación ${senderId}:`, convError);
          }
        }

        results.push({
          user: user.username,
          instagram_user_id: user.instagram_user_id,
          conversations_processed: conversationMap.size,
          states_updated: updatedCount
        });

        console.log(`🎯 Usuario ${user.username}: ${updatedCount} estados actualizados`);

      } catch (userError) {
        console.error(`❌ Error procesando usuario ${user.username}:`, userError);
        
        results.push({
          user: user.username,
          error: userError.message
        });
      }
    }

    const totalProcessed = results.reduce((sum, r) => sum + (r.conversations_processed || 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.states_updated || 0), 0);

    console.log(`🏁 Proceso completado. Conversaciones procesadas: ${totalProcessed}, Estados actualizados: ${totalUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      users_processed: results.length,
      conversations_processed: totalProcessed,
      states_updated: totalUpdated,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error general en process-prospect-states:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});