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
    
    // Get current UTC time
    const utcNow = new Date();
    console.log(`UTC time: ${utcNow.toISOString()}`);
    
    // Get all enabled scheduled notifications with user timezone info
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('whatsapp_schedule_days')
      .select(`
        instagram_user_id, 
        notification_time, 
        day_of_week,
        whatsapp_notification_settings!inner(timezone, enabled)
      `)
      .eq('enabled', true)
      .eq('whatsapp_notification_settings.enabled', true);
    
    if (scheduleError) {
      console.error('Error getting scheduled days:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener días programados" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (scheduleError) {
      console.error('Error getting scheduled days:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener días programados" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduleData || scheduleData.length === 0) {
      console.log("No hay usuarios programados");
      return new Response(
        JSON.stringify({ message: "No hay usuarios programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter notifications that match current time in their timezone
    const validNotifications = [];
    
    for (const schedule of scheduleData) {
      const userTimezone = schedule.whatsapp_notification_settings.timezone;
      
      // Convert current UTC time to user's timezone
      const userTime = new Date().toLocaleString("en-US", {timeZone: userTimezone});
      const userLocalTime = new Date(userTime);
      const userDay = userLocalTime.getDay();
      const userTimeString = userLocalTime.toTimeString().substring(0, 5); // HH:MM
      
      console.log(`User ${schedule.instagram_user_id}: timezone=${userTimezone}, day=${userDay}, time=${userTimeString}, scheduled_day=${schedule.day_of_week}, scheduled_time=${schedule.notification_time.substring(0, 5)}`);
      
      // Check if current day and time match the scheduled notification
      if (userDay === schedule.day_of_week && userTimeString === schedule.notification_time.substring(0, 5)) {
        validNotifications.push(schedule);
        console.log(`✅ User ${schedule.instagram_user_id} matches scheduled time`);
      } else {
        console.log(`⏰ User ${schedule.instagram_user_id} doesn't match (day: ${userDay}vs${schedule.day_of_week}, time: ${userTimeString}vs${schedule.notification_time.substring(0, 5)})`);
      }
    }
    
    const scheduledNotifications = validNotifications;
    
    if (scheduledNotifications.length === 0) {
      console.log("No hay notificaciones que coincidan con el momento actual");
      return new Response(
        JSON.stringify({ message: "No hay notificaciones programadas para este momento" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${scheduledNotifications.length} users with scheduled notifications`);
    
    const results = [];
    
    // Process each user (they already passed the time/day validation)
    for (const notification of scheduledNotifications) {
      try {
        console.log(`Processing user: ${notification.instagram_user_id}`);
        
        // Get user stats
        const stats = await getUserStats(notification.instagram_user_id);
        console.log(`User stats:`, stats);
        
        // SIEMPRE enviar mensaje, sin importar si hay prospectos o no
        console.log(`💪 Enviando mensaje motivacional independientemente de prospectos`);
        
        // Create message
        const messageBody = createMotivationalMessage(stats);
        
        // Get WhatsApp number from settings
        const { data: settings, error: settingsError } = await supabase
          .from('whatsapp_notification_settings')
          .select('whatsapp_number')
          .eq('instagram_user_id', notification.instagram_user_id)
          .single();
          
        if (settingsError || !settings?.whatsapp_number) {
          console.error(`No WhatsApp number found for user ${notification.instagram_user_id}`);
          continue;
        }

        // Send WhatsApp message using new simplified endpoint
        const success = await sendWhatsAppMessage(
          messageBody, 
          settings.whatsapp_number
        );
        
        results.push({
          instagram_user_id: notification.instagram_user_id,
          whatsapp_number: settings.whatsapp_number,
          timezone: notification.whatsapp_notification_settings.timezone,
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