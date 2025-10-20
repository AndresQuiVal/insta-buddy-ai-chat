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

// Function to get user stats
async function getUserStats(instagramUserId: string) {
  try {
    const { data: stats, error } = await supabase
      .rpc('grok_get_stats', { 
        p_instagram_user_id: instagramUserId,
        p_period: 'today',
        p_hower_usernames: null
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

// Function to create motivational message
function createMotivationalMessage(stats: { abiertas: number, seguimientos: number, agendados: number }): string {
  const greetings = [
    "¡Buenos días! ☀️",
    "¡Hola! 👋",
    "¡Qué tal! 😊"
  ];
  
  const phrases = [
    "¡Es hora de brillar! ✨",
    "¡A por todas! 💪",
    "¡Vamos con todo! 🚀"
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  return `${randomGreeting}

📊 Tu resumen de prospectos:
• Conversaciones abiertas: ${stats.abiertas}
• Seguimientos pendientes: ${stats.seguimientos}
• Reuniones programadas: ${stats.agendados}

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