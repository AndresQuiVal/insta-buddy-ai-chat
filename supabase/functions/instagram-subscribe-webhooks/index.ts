
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 Iniciando suscripción a webhooks desde Edge Function...");
    
    const { instagram_user_id, access_token } = await req.json();
    
    if (!instagram_user_id || !access_token) {
      throw new Error("Faltan parámetros requeridos: instagram_user_id y access_token");
    }

    console.log("📱 Instagram User ID:", instagram_user_id);

    // Llamar a Instagram Graph API para suscribir webhooks
    const response = await fetch(`https://graph.instagram.com/v22.0/${instagram_user_id}/subscribed_apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${access_token}`
      },
      body: new URLSearchParams({
        'subscribed_fields': 'messages,comments'
      })
    });

    console.log("📡 Respuesta de Instagram API:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error desde Instagram API:", errorData);
      
      return new Response(JSON.stringify({
        success: false,
        error: errorData.error?.message || "Error suscribiendo a webhooks",
        details: errorData
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log("✅ Suscripción a webhooks exitosa:", data);

    return new Response(JSON.stringify({
      success: true,
      message: "Webhooks suscritos exitosamente",
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("💥 Error en instagram-subscribe-webhooks:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Error interno del servidor"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
