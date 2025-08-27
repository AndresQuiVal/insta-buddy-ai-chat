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
    
    // We'll get current time for each user's timezone individually
    console.log("UTC time:", new Date().toISOString());
    
    // Get all scheduled notifications first
    const { data: scheduleDays, error: scheduleError } = await supabase
      .from('whatsapp_schedule_days')
      .select('*')
      .eq('enabled', true);

    if (scheduleError) {
      console.error('Error getting scheduled days:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener días programados" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!scheduleDays || scheduleDays.length === 0) {
      console.log("No hay días programados");
      return new Response(
        JSON.stringify({ message: "No hay días programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp settings for each user
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from('whatsapp_notification_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error getting WhatsApp settings:', settingsError);
      return new Response(
        JSON.stringify({ error: "Error al obtener configuración WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine schedule and settings data
    const scheduleData = scheduleDays.map(day => {
      const settings = whatsappSettings.find(s => s.instagram_user_id === day.instagram_user_id);
      return {
        ...day,
        whatsapp_notification_settings: settings
      };
    }).filter(item => item.whatsapp_notification_settings);
    
    if (!scheduleData || scheduleData.length === 0) {
      console.log("No hay usuarios con configuración de horarios");
      return new Response(
        JSON.stringify({ message: "No hay usuarios programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${scheduleData.length} users with scheduled notifications`);
    
    const results = [];
    
    // Process each user
    for (const notification of scheduleData) {
      try {
        const userTimezone = notification.whatsapp_notification_settings.timezone || 'America/Mexico_City';
        
        // Get current time in user's timezone
        const userTime = new Date().toLocaleString("en-US", {timeZone: userTimezone});
        const userDate = new Date(userTime);
        const userDay = userDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const userCurrentTime = userDate.toTimeString().substring(0, 5); // HH:MM format
        
        // Check if current day matches the scheduled day
        if (userDay !== notification.day_of_week) {
          console.log(`Skipping user ${notification.instagram_user_id} - day mismatch (${userDay} vs ${notification.day_of_week}) in timezone ${userTimezone}`);
          continue;
        }
        
        const notificationTime = notification.notification_time.substring(0, 5); // HH:MM
        
        // Check if current time matches notification time exactly
        if (userCurrentTime !== notificationTime) {
          console.log(`Skipping user ${notification.instagram_user_id} - time mismatch (${userCurrentTime} vs ${notificationTime}) in timezone ${userTimezone}`);
          continue;
        }
        
        console.log(`✅ Processing user: ${notification.instagram_user_id} at ${userCurrentTime} in ${userTimezone}`);
        
        // 🚀 NUEVO: Buscar prospectos ANTES de enviar notificación
        console.log(`🔍 Iniciando búsqueda de prospectos para usuario ${notification.instagram_user_id}...`);
        
        try {
          const { data: searchResponse, error: searchError } = await supabase.functions.invoke('search-prospects', {
            body: { instagramUserId: notification.instagram_user_id }
          });
          
          if (searchError) {
            console.log(`⚠️ Error en búsqueda de prospectos para ${notification.instagram_user_id}:`, searchError);
          } else if (searchResponse?.success) {
            console.log(`✅ Búsqueda de prospectos completada para ${notification.instagram_user_id}:`, searchResponse.message);
          } else if (searchResponse?.hasICP === false) {
            console.log(`ℹ️ Usuario ${notification.instagram_user_id} no tiene ICP configurado, saltando búsqueda de prospectos`);
          }
        } catch (prospectError) {
          console.log(`❌ Error general en búsqueda de prospectos para ${notification.instagram_user_id}:`, prospectError);
        }
        
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