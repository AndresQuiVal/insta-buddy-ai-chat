import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  try {
    console.log("🧪 PRUEBA DIRECTA AL ENDPOINT DE WHATSAPP");
    
    // Hacer la llamada directa al endpoint
    const response = await fetch("https://www.howersoftware.io/clients/api/send-whatsapp/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🧪 PRUEBA DIRECTA - ${new Date().toLocaleString('es-MX', {timeZone: 'America/Mexico_City'})}

Este es un mensaje de prueba para verificar el endpoint de WhatsApp.

Si recibes esto, ¡funciona! 🎉`,
        to_number: "523338459844"
      })
    });
    
    const responseData = await response.text();
    
    console.log("📊 Status:", response.status);
    console.log("📄 Response:", responseData);
    
    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      response: responseData,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});