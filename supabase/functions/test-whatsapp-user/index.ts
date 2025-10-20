import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to send WhatsApp message
async function sendWhatsAppMessage(message: string, toNumber: string): Promise<boolean> {
  try {
    console.log(`📱 Enviando WhatsApp a: ${toNumber}`);
    console.log(`📄 Mensaje: ${message.substring(0, 100)}...`);
    
    const response = await fetch('https://www.howersoftware.io/clients/api/send-whatsapp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        to_number: toNumber
      })
    });
    
    const responseData = await response.text();
    console.log(`📤 Respuesta WhatsApp API:`, responseData);
    
    if (response.ok) {
      console.log(`✅ WhatsApp enviado exitosamente a ${toNumber}`);
      return true;
    } else {
      console.error(`❌ Error enviando WhatsApp a ${toNumber}:`, response.status, responseData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en sendWhatsAppMessage:', error);
    return false;
  }
}

// Function to get user stats (same logic as cronjob)
async function getUserStats(instagramUserId: string) {
  try {
    console.log('🔍 Getting Hower usernames for user:', instagramUserId);
    
    // Llamar al edge function para obtener usernames de Hower
    const { data: howerResponse, error: howerError } = await supabase.functions.invoke(
      'get-hower-usernames',
      {
        body: { instagram_user_id: instagramUserId }
      }
    );

    let howerUsernames: string[] = [];
    if (!howerError && howerResponse?.success && howerResponse?.data?.usernames) {
      howerUsernames = howerResponse.data.usernames;
      console.log('📞 Got Hower usernames:', { 
        usernameCount: howerUsernames.length 
      });
    } else {
      console.log('⚠️ No Hower credentials or error getting usernames:', howerError?.message || 'No credentials');
      console.log('🚫 No Hower credentials available - returning zero stats (Hower filter is mandatory)');
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    console.log('🔥 Aplicando lógica CORREGIDA del prospectService...');

    // Obtener UUID del usuario
    const { data: userUuidData, error: userUuidError } = await supabase
      .from('instagram_users')
      .select('id')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (userUuidError || !userUuidData) {
      console.error('❌ Error obteniendo UUID del usuario:', userUuidError);
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    const userUUID = userUuidData.id;

    // Obtener todos los prospectos con filtros de calidad
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select('*')
      .eq('instagram_user_id', userUUID)
      .not('username', 'like', 'user_%')
      .not('username', 'like', 'prospect_%')
      .neq('username', '');

    if (prospectsError) {
      console.error('❌ Error obteniendo prospectos:', prospectsError);
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    // Obtener estados de tareas
    const { data: taskStatuses, error: taskError } = await supabase
      .from('prospect_task_status')
      .select('prospect_sender_id, is_completed, completed_at, last_message_type')
      .eq('instagram_user_id', instagramUserId)
      .eq('task_type', 'pending');

    if (taskError) {
      console.error('❌ Error obteniendo task statuses:', taskError);
    }

    console.log(`📊 Procesando ${prospects?.length || 0} prospectos con lógica CORREGIDA`);

    let abiertas = 0;
    let seguimientos = 0;

    for (const prospect of prospects || []) {
      // Filtro Hower: Solo procesar si está en la lista de Hower
      const isInHowerList = howerUsernames.some(username => 
        prospect.username === username || 
        prospect.username.replace('@', '') === username ||
        prospect.username === '@' + username
      );

      if (!isInHowerList) {
        continue;
      }

      const taskStatus = taskStatuses?.find(task => 
        task.prospect_sender_id === prospect.prospect_instagram_id
      );

      if (!taskStatus) {
        if (prospect.last_message_from_prospect) {
          console.log(`✅ ${prospect.username} → ABIERTA (sin taskStatus, último mensaje del prospecto)`);
          abiertas++;
        }
        continue;
      }

      const { is_completed, completed_at, last_message_type } = taskStatus;

      // Lógica de recontacto principal
      if (is_completed && last_message_type === 'sent' && completed_at) {
        const completedDate = new Date(completed_at);
        const now = new Date();
        const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCompleted > 24) {
          console.log(`🔄 ${prospect.username} → SEGUIMIENTO (recontacto necesario, ${Math.round(hoursSinceCompleted)}h > 24h)`);
          seguimientos++;
          continue;
        } else {
          continue;
        }
      }

      // Lógica normal
      if (!is_completed) {
        if (prospect.last_message_from_prospect) {
          console.log(`✅ ${prospect.username} → ABIERTA (no completado, último mensaje del prospecto)`);
          abiertas++;
        } else if (prospect.last_owner_message_at) {
          const lastOwnerMessage = new Date(prospect.last_owner_message_at);
          const now = new Date();
          const hoursSinceLastMessage = (now.getTime() - lastOwnerMessage.getTime()) / (1000 * 60 * 60);
          const daysSinceLastMessage = hoursSinceLastMessage / 24;
          
          if (daysSinceLastMessage >= 7 && daysSinceLastMessage <= 14) {
            console.log(`✅ ${prospect.username} → SEGUIMIENTO (${Math.round(daysSinceLastMessage)} días - en rango 7-14)`);
            seguimientos++;
          } else if (hoursSinceLastMessage >= 24 && daysSinceLastMessage < 7) {
            console.log(`✅ ${prospect.username} → SEGUIMIENTO (${Math.round(hoursSinceLastMessage)}h desde último mensaje)`);
            seguimientos++;
          }
        }
      } else if (last_message_type === 'received') {
        console.log(`✅ ${prospect.username} → ABIERTA (completado pero último mensaje del prospecto)`);
        abiertas++;
      }
    }

    const finalStats = { 
      abiertas, 
      seguimientos, 
      agendados: 20
    };
    
    console.log('📊 Stats finales:', finalStats);
    return finalStats;
    
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { abiertas: 0, seguimientos: 0, agendados: 0 };
  }
}

// Function to create motivational message (same as cronjob)
function createMotivationalMessage(stats: { abiertas: number, seguimientos: number, agendados: number }): string {
  const greetings = [
    "¡Buenos días! 🌟",
    "¡Hola campeón! 💪",
    "¡Arranca el día con energía! ⚡",
    "¡A conquistar el día! 🚀",
    "¡Buenos días, prospector! 🎯"
  ];
  
  const motivationalPhrases = [
    "¡Cada contacto te acerca más a tu objetivo! 🎯",
    "¡El éxito está en la constancia! 💪",
    "¡Hoy es un gran día para cerrar negocios! 🚀",
    "¡Tu dedicación se convertirá en resultados! ⭐",
    "¡Sigue así, vas por buen camino! 🔥"
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
  
  const totalProspects = stats.abiertas + stats.seguimientos;
  
  return `${randomGreeting}

Tienes estos prospectos por contactar:
URGENTES de contestar: ${stats.abiertas}
Prospectos en seguimiento: ${stats.seguimientos}
Nuevos prospectos de hoy: ${stats.agendados}

Accede a este link:
https://preview--insta-buddy-ai-chat.lovable.app/tasks-to-do

y limpia esos prospectos

${randomPhrase}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { instagram_user_id } = body;
    
    console.log(`🧪 Probando WhatsApp para usuario: ${instagram_user_id || 'elsalvadoronline'}`);
    
    // Default to elsalvadoronline if no user specified
    const targetUserId = instagram_user_id || '17841405753142749';
    
    // Get user WhatsApp settings
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from('whatsapp_notification_settings')
      .select('*')
      .eq('instagram_user_id', targetUserId)
      .eq('enabled', true)
      .single();

    if (settingsError || !whatsappSettings) {
      console.error('Error getting WhatsApp settings:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Usuario no encontrado o WhatsApp no configurado" 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📱 WhatsApp configurado: ${whatsappSettings.whatsapp_number}`);
    console.log(`🌍 Timezone: ${whatsappSettings.timezone}`);
    
    // Get user stats
    const stats = await getUserStats(targetUserId);
    console.log(`📊 Stats del usuario:`, stats);
    
    // Create message
    const messageBody = createMotivationalMessage(stats);
    console.log(`📝 Mensaje creado: ${messageBody.length} caracteres`);
    
    // Send WhatsApp message
    const success = await sendWhatsAppMessage(
      messageBody, 
      whatsappSettings.whatsapp_number
    );
    
    return new Response(
      JSON.stringify({
        success: success,
        user_id: targetUserId,
        whatsapp_number: whatsappSettings.whatsapp_number,
        stats: stats,
        message_length: messageBody.length,
        message_preview: messageBody.substring(0, 100) + "...",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in test-whatsapp-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});