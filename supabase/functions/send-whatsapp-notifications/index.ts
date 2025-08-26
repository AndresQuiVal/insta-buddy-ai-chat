import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const WHATSAPP_API_URL = "https://www.howersoftware.io/clients/api/send-whatsapp/";

async function sendWhatsAppMessage(message: string, toNumber: string): Promise<boolean> {
  try {
    const payload = {
      message: message,
      to_number: toNumber
    };
    
    console.log("📤 Enviando mensaje WhatsApp a:", toNumber);
    console.log("📤 Mensaje:", message.substring(0, 100) + "...");
    console.log("📤 Payload completo:", JSON.stringify(payload));
    console.log("📤 URL:", WHATSAPP_API_URL);
    
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("📥 Status code:", response.status);
    console.log("📥 Status text:", response.statusText);
    console.log("📥 Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
    
    const responseText = await response.text();
    console.log("📥 Response text (raw):", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("📥 Response JSON:", JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log("⚠️ No se pudo parsear como JSON:", parseError.message);
      responseData = { raw: responseText };
    }
    
    if (response.ok && responseData.success) {
      console.log("✅ Mensaje enviado exitosamente");
      return true;
    } else {
      console.error("❌ Error en respuesta:");
      console.error("❌ Status:", response.status);
      console.error("❌ Data:", responseData);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error enviando mensaje WhatsApp:", error);
    console.error("❌ Error stack:", error.stack);
    return false;
  }
}

async function getUserStats(instagramUserId: string) {
  try {
    // Get user UUID first
    const { data: userData, error: userError } = await supabase
      .from('instagram_users')
      .select('id')
      .eq('instagram_user_id', instagramUserId)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.error('Error getting user:', userError);
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    // Get prospects waiting for response
    const { data: prospectsData, error: prospectsError } = await supabase
      .from('prospects')
      .select('prospect_instagram_id, last_owner_message_at')
      .eq('instagram_user_id', userData.id)
      .eq('status', 'esperando_respuesta');

    if (prospectsError) {
      console.error('Error getting prospects:', prospectsError);
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    // Get completed tasks (tachados) for pending, yesterday, and week
    const { data: taskStatus, error: taskError } = await supabase
      .from('prospect_task_status')
      .select('prospect_sender_id, task_type, is_completed')
      .eq('instagram_user_id', instagramUserId)
      .eq('is_completed', true)
      .in('task_type', ['pending', 'yesterday', 'week']);

    if (taskError) {
      console.error('Error getting task status:', taskError);
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    // Create sets of completed (tachados) prospect IDs by task type
    const completedPending = new Set(
      taskStatus?.filter(t => t.task_type === 'pending').map(t => t.prospect_sender_id) || []
    );
    const completedYesterday = new Set(
      taskStatus?.filter(t => t.task_type === 'yesterday').map(t => t.prospect_sender_id) || []
    );
    const completedWeek = new Set(
      taskStatus?.filter(t => t.task_type === 'week').map(t => t.prospect_sender_id) || []
    );

    const prospects = prospectsData || [];
    const now = new Date();
    
    let abiertas = 0; // Prospectos pendientes NO tachados
    let seguimientos = 0; // Prospectos en seguimiento NO tachados
    
    prospects.forEach(prospect => {
      const prospectId = prospect.prospect_instagram_id;
      
      if (!prospect.last_owner_message_at) {
        // No previous message sent = new prospect (pending)
        if (!completedPending.has(prospectId)) {
          abiertas++;
        }
      } else {
        const lastMessageTime = new Date(prospect.last_owner_message_at);
        const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastMessage >= 24) { // More than 24 hours = follow-up
          // Check if completed in yesterday or week tasks
          if (!completedYesterday.has(prospectId) && !completedWeek.has(prospectId)) {
            seguimientos++;
          }
        } else {
          // Less than 24 hours = pending
          if (!completedPending.has(prospectId)) {
            abiertas++;
          }
        }
      }
    });

    console.log(`📊 Real-time stats for ${instagramUserId}:`);
    console.log(`   💬 Abiertas (pendientes NO tachados): ${abiertas}`);
    console.log(`   🔄 Seguimientos (yesterday+week NO tachados): ${seguimientos}`);
    console.log(`   🎯 Agendados (siempre): 20`);

    return { 
      abiertas, 
      seguimientos, 
      agendados: 20  // SIEMPRE 20 como solicitado
    };
    
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { abiertas: 0, seguimientos: 0, agendados: 20 };
  }
}

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
    console.log("🚀 Starting WhatsApp notification process...");
    console.log("🔧 Usando endpoint simplificado de WhatsApp");
    
    // Get current time info IN MEXICO TIME ZONE
    const mexicoTime = new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"});
    const now = new Date(mexicoTime);
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`Current day (Mexico): ${currentDay}, time (Mexico): ${currentTime}, hour: ${currentHour}, minute: ${currentMinute}`);
    
    // Get all scheduled notifications for today
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('whatsapp_schedule_days')
      .select('instagram_user_id, notification_time')
      .eq('day_of_week', currentDay)
      .eq('enabled', true);
    
    if (scheduleError) {
      console.error('Error getting scheduled days:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener días programados" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get WhatsApp settings for these users
    const userIds = scheduleData?.map(s => s.instagram_user_id) || [];
    
    if (userIds.length === 0) {
      console.log("No hay usuarios programados para este día y hora");
      return new Response(
        JSON.stringify({ message: "No hay usuarios programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: settingsData, error: settingsError } = await supabase
      .from('whatsapp_notification_settings')
      .select('instagram_user_id, whatsapp_number, enabled')
      .in('instagram_user_id', userIds)
      .eq('enabled', true);
    
    if (settingsError) {
      console.error('Error getting WhatsApp settings:', settingsError);
      return new Response(
        JSON.stringify({ error: "Error al obtener configuraciones de WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Combine schedule and settings data
    const scheduledNotifications = scheduleData.filter(schedule => {
      const settings = settingsData?.find(s => s.instagram_user_id === schedule.instagram_user_id);
      return settings && settings.enabled;
    }).map(schedule => {
      const settings = settingsData.find(s => s.instagram_user_id === schedule.instagram_user_id);
      return {
        ...schedule,
        whatsapp_notification_settings: settings
      };
    });
    
    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log("No hay notificaciones programadas para este momento");
      return new Response(
        JSON.stringify({ message: "No hay notificaciones programadas" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${scheduledNotifications.length} users with scheduled notifications`);
    
    const results = [];
    
    // Process each user
    for (const notification of scheduledNotifications) {
      try {
        const notificationTime = notification.notification_time.substring(0, 5); // HH:MM
        
        // Check if current time matches notification time exactly
        if (currentTime !== notificationTime) {
          console.log(`Skipping user ${notification.instagram_user_id} - time mismatch (${currentTime} vs ${notificationTime})`);
          continue;
        }
        
        console.log(`Processing user: ${notification.instagram_user_id}`);
        
        // Get user stats
        const stats = await getUserStats(notification.instagram_user_id);
        console.log(`User stats:`, stats);
        
        // SIEMPRE enviar mensaje, sin importar si hay prospectos o no
        console.log(`💪 Enviando mensaje motivacional independientemente de prospectos`);
        
        // Create message
        const messageBody = createMotivationalMessage(stats);
        
        // Send WhatsApp message using new simplified endpoint
        const success = await sendWhatsAppMessage(
          messageBody, 
          notification.whatsapp_notification_settings.whatsapp_number
        );
        
        results.push({
          instagram_user_id: notification.instagram_user_id,
          whatsapp_number: notification.whatsapp_notification_settings.whatsapp_number,
          status: success ? 'sent' : 'failed',
          stats: stats,
          message_length: messageBody.length
        });
        
        console.log(`Message ${success ? 'sent successfully' : 'failed'} to ${notification.instagram_user_id}`);
        
      } catch (error) {
        console.error(`Error processing user ${notification.instagram_user_id}:`, error);
        results.push({
          instagram_user_id: notification.instagram_user_id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log("🏁 WhatsApp notification process completed");
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-whatsapp-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});