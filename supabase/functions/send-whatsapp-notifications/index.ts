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

interface WhatsAppAPI {
  sendMessage(to: string, message: string): Promise<any>;
}

class WhaticketAPI implements WhatsAppAPI {
  private BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJjcmVhdGU6bWVzc2FnZXMiLCJjcmVhdGU6bWVkaWFzIiwicmVhZDp3aGF0c2FwcHMiLCJ1cGRhdGU6d2hhdHNhcHBzIiwiY3JlYXRlOmNvbnRhY3RzIl0sImNvbXBhbnlJZCI6IjBlYTIzZTI2LTk4ZTItNDk1YS04ZDQ1LTliMWExZWJiYjAyOCIsImlhdCI6MTc0MjYyMjUyNX0.l6DG1rgv5m3XyliCX3_9bhftPN7AMnrei7_ZThnwCn0";
  private URL_API = "https://api.whaticket.com/api/v1";

  async getHowerAINumberId(): Promise<string | null> {
    try {
      const connections = await this.getWhatsAppConnections();
      
      for (const connection of connections) {
        const name = connection?.name;
        const id = connection?.id;
        
        if (name && id && name.includes("Hower AI")) {
          return id;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting Hower AI number:", error);
      return null;
    }
  }

  async getWhatsAppConnections(): Promise<any[]> {
    const headers = {
      "Authorization": `Bearer ${this.BEARER_TOKEN}`
    };

    try {
      const response = await fetch(`${this.URL_API}/whatsapps`, {
        headers
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error("Error getting WhatsApp connections:", error);
      return [];
    }
  }

  async sendMessage(to: string, message: string): Promise<any> {
    const howerAIId = await this.getHowerAINumberId();
    
    if (!howerAIId) {
      throw new Error("No se pudo obtener el ID de Hower AI");
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.BEARER_TOKEN}`
    };

    const payload = {
      whatsappId: howerAIId,
      messages: [
        {
          number: to,
          name: "Usuario",
          body: message
        }
      ]
    };

    try {
      const response = await fetch(`${this.URL_API}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return {
        status_code: response.status,
        response: await response.json()
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }
}

const motivationalPhrases = [
  "¡Cada prospecto es una oportunidad de oro! 💪",
  "El éxito está en la constancia. ¡Sigue así! 🚀",
  "Tus leads te están esperando. ¡Ve por ellos! 🎯",
  "La diferencia entre el éxito y el fracaso está en la acción. ¡Actúa! ⚡",
  "Cada mensaje puede cambiar tu día. ¡Escríbelo! 💬",
  "Los campeones nunca se rinden. ¡Tú tampoco! 🏆",
  "Tu siguiente cliente está a un mensaje de distancia. 📱",
  "La persistencia vence la resistencia. ¡Persiste! 💯"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Iniciando envío de notificaciones de WhatsApp...");
    
    // Obtener la fecha y hora actual
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay(); // 0=domingo, 1=lunes, etc.
    
    console.log(`⏰ Hora actual: ${currentTime}, Día: ${currentDay}`);
    
    // Buscar usuarios que tienen notificaciones habilitadas para este horario
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('whatsapp_notification_settings')
      .select(`
        *,
        hower_lite_profiles!inner(
          instagram_user_id,
          name,
          phone,
          country_code
        )
      `)
      .eq('enabled', true)
      .eq('notification_time', currentTime)
      .contains('notification_days', [currentDay]);

    if (settingsError) {
      console.error("❌ Error al obtener configuraciones:", settingsError);
      throw settingsError;
    }

    console.log(`📱 Usuarios a notificar: ${notificationSettings?.length || 0}`);

    const whatsappAPI = new WhaticketAPI();
    const results = [];

    for (const setting of notificationSettings || []) {
      try {
        const profile = setting.hower_lite_profiles;
        const instagramUserId = profile.instagram_user_id;
        
        console.log(`📊 Procesando usuario: ${profile.name} (${instagramUserId})`);

        // Obtener métricas del día actual para este usuario
        const { data: todayMetrics } = await supabase
          .from('daily_prospect_metrics')
          .select('*')
          .eq('instagram_user_id', instagramUserId)
          .eq('metric_date', now.toISOString().split('T')[0])
          .single();

        // Obtener estados de prospectos
        const { data: prospectStates } = await supabase
          .from('prospect_states')
          .select('*')
          .eq('instagram_user_id', instagramUserId);

        // Contar por estado
        const pendingResponses = prospectStates?.filter(p => p.state === 'pending_response')?.length || 0;
        const noResponse1Day = prospectStates?.filter(p => p.state === 'no_response_1day')?.length || 0;
        const noResponse7Days = prospectStates?.filter(p => p.state === 'no_response_7days')?.length || 0;
        
        // Obtener comentarios de anuncios (simulado por ahora)
        const adComments = 0; // TODO: implementar cuando tengamos esta funcionalidad

        const totalProspects = pendingResponses + noResponse1Day + noResponse7Days;
        
        // Solo enviar si hay prospectos que atender
        if (totalProspects > 0) {
          const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
          
          const message = `Hola hola ${profile.name}! oye, recuerda que tienes:
- ${pendingResponses} prospectos que debes dar seguimiento
- ${noResponse1Day + noResponse7Days} prospectos que no has respondido
- ${todayMetrics?.new_prospects_contacted || 0} prospectos nuevos a contactar hoy
- ${adComments} prospectos que han comentado tus anuncios

Para atender estos leads y que no se te enfrien, accede aquí: howertech.com/tasks-to-do/ y atiéndelos ahora!

${randomPhrase}`;

          const phoneNumber = `${profile.country_code}${profile.phone}`.replace(/[^0-9]/g, '');
          
          console.log(`📤 Enviando mensaje a ${phoneNumber}`);
          
          const result = await whatsappAPI.sendMessage(phoneNumber, message);
          
          results.push({
            user: profile.name,
            phone: phoneNumber,
            status: 'sent',
            prospects: totalProspects,
            result
          });
          
          console.log(`✅ Mensaje enviado exitosamente a ${profile.name}`);
        } else {
          console.log(`⏭️ Sin prospectos para ${profile.name}, omitiendo notificación`);
          
          results.push({
            user: profile.name,
            phone: `${profile.country_code}${profile.phone}`,
            status: 'skipped',
            reason: 'no_prospects'
          });
        }
        
        // Esperar un poco entre mensajes para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (userError) {
        console.error(`❌ Error procesando usuario ${setting.hower_lite_profiles?.name}:`, userError);
        
        results.push({
          user: setting.hower_lite_profiles?.name,
          status: 'error',
          error: userError.message
        });
      }
    }

    console.log(`🎯 Proceso completado. Mensajes enviados: ${results.filter(r => r.status === 'sent').length}`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error general en send-whatsapp-notifications:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});