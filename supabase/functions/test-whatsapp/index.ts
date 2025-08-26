import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = "https://www.howersoftware.io/clients/api/send-whatsapp/";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧪 Iniciando prueba del endpoint de WhatsApp...");
    
    const testMessage = `🧪 PRUEBA DE CONEXIÓN - ${new Date().toLocaleString('es-MX', {timeZone: 'America/Mexico_City'})}
    
Este es un mensaje de prueba para verificar que el endpoint de WhatsApp funciona correctamente.

✅ Si recibes este mensaje, la integración está funcionando perfectamente.

Saludos! 🤖`;

    const payload = {
      message: testMessage,
      to_number: "523338459844"
    };
    
    console.log("📤 Enviando mensaje de prueba a:", payload.to_number);
    console.log("📤 Mensaje:", testMessage.substring(0, 100) + "...");
    
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
      console.log("✅ Mensaje de prueba enviado exitosamente");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Mensaje de prueba enviado exitosamente",
          details: responseData,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error("❌ Error en respuesta:", responseData.message || responseData.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al enviar mensaje de prueba",
          details: responseData,
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("❌ Error enviando mensaje de prueba:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});