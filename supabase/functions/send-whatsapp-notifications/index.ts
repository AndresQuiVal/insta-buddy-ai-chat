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
    
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("📥 Status code:", response.status);
    const responseData = await response.json();
    console.log("📥 Response:", responseData);
    
    if (response.ok && responseData.success) {
      console.log("✅ Mensaje enviado exitosamente");
      return true;
    } else {
      console.error("❌ Error en respuesta:", responseData.message || responseData.error);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error enviando mensaje WhatsApp:", error);
    return false;
  }
}

async function getUserStats(instagramUserId: string) {
  try {
    // Get stats using the existing function
    const { data: stats, error } = await supabase
      .rpc('grok_get_stats', {
        p_instagram_user_id: instagramUserId,
        p_period: 'today'
      });
      
    if (error) {
      console.error('Error getting user stats:', error);
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }
    
    return stats[0] || { abiertas: 0, seguimientos: 0, agendados: 0 };
    
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { abiertas: 0, seguimientos: 0, agendados: 0 };
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
        
        // Skip if no prospects to contact
        const totalProspects = (stats.abiertas || 0) + (stats.seguimientos || 0);
        if (totalProspects === 0) {
          console.log(`Skipping user ${notification.instagram_user_id} - no prospects to contact`);
          results.push({
            instagram_user_id: notification.instagram_user_id,
            status: 'skipped',
            reason: 'no_prospects'
          });
          continue;
        }
        
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