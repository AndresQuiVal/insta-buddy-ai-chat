import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  number: string;
  name: string;
  body: string;
}

interface WhatsAppConnection {
  id: string;
  name: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const API_URL = Deno.env.get('WHATICKET_API_URL') || "https://api.whaticket.com/api/v1";
const TOKEN = Deno.env.get('WHATICKET_TOKEN')!;
const CONNECTION_NAME = Deno.env.get('WHATICKET_CONNECTION_NAME') || "Hower Assistant";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

async function getWhatsAppConnectionId(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/whatsapps`, { headers });
    
    if (!response.ok) {
      console.error("❌ Error obteniendo conexiones:", await response.text());
      return null;
    }
    
    const whatsapps: WhatsAppConnection[] = await response.json();
    console.log("Conexiones encontradas:", whatsapps);
    
    const connection = whatsapps.find(w => w.name === CONNECTION_NAME);
    
    if (!connection) {
      console.error("❌ No se encontró la conexión con nombre:", CONNECTION_NAME);
      return null;
    }
    
    console.log("✅ Conexión encontrada. ID =", connection.id);
    return connection.id;
    
  } catch (error) {
    console.error("Error getting WhatsApp connection:", error);
    return null;
  }
}

async function sendWhatsAppMessage(whatsappId: string, message: WhatsAppMessage): Promise<boolean> {
  try {
    const payload = {
      whatsappId: whatsappId,
      messages: [message]
    };
    
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log("Send message status code:", response.status);
    const responseText = await response.text();
    console.log("Send message response:", responseText);
    
    return response.ok;
    
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
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
    
    // Get WhatsApp connection ID
    const whatsappId = await getWhatsAppConnectionId();
    if (!whatsappId) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener la conexión de WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get current time info
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`Current day: ${currentDay}, time: ${currentTime}, hour: ${currentHour}, minute: ${currentMinute}`);
    
    // Get all users who should receive notifications at this time
    const { data: scheduledNotifications, error: scheduleError } = await supabase
      .from('whatsapp_schedule_days')
      .select(`
        instagram_user_id,
        notification_time,
        whatsapp_notification_settings!inner(
          whatsapp_number,
          enabled
        )
      `)
      .eq('day_of_week', currentDay)
      .eq('enabled', true)
      .eq('whatsapp_notification_settings.enabled', true);
    
    if (scheduleError) {
      console.error('Error getting scheduled notifications:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener notificaciones programadas" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
        
        const message: WhatsAppMessage = {
          number: notification.whatsapp_notification_settings.whatsapp_number,
          name: "Prospecto",
          body: messageBody
        };
        
        // Send WhatsApp message
        const success = await sendWhatsAppMessage(whatsappId, message);
        
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