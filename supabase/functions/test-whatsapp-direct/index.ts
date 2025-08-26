import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧪 INICIANDO PRUEBA DIRECTA DEL ENDPOINT");
    
    const testPayload = {
      message: `🧪 PRUEBA DIRECTA - ${new Date().toLocaleString('es-MX', {timeZone: 'America/Mexico_City'})}

Este es un mensaje de prueba directa del endpoint de WhatsApp.

Si lo recibes, todo funciona bien! 🎉`,
      to_number: "523338459844"
    };
    
    console.log("📞 Llamando al endpoint:", "https://www.howersoftware.io/clients/api/send-whatsapp/");
    console.log("📦 Payload:", JSON.stringify(testPayload, null, 2));
    
    const startTime = Date.now();
    
    const response = await fetch("https://www.howersoftware.io/clients/api/send-whatsapp/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
    console.log("📊 Status:", response.status);
    console.log("📊 Status Text:", response.statusText);
    console.log("📊 Headers:", Object.fromEntries(response.headers.entries()));
    
    let responseData;
    const responseText = await response.text();
    console.log("📄 Response Text (raw):", responseText);
    
    try {
      responseData = JSON.parse(responseText);
      console.log("📋 Response Data (parsed):", responseData);
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError);
      responseData = { raw: responseText };
    }
    
    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      data: responseData,
      timestamp: new Date().toISOString(),
      endpoint: "https://www.howersoftware.io/clients/api/send-whatsapp/",
      payload: testPayload
    };
    
    if (response.ok) {
      console.log("✅ Llamada exitosa!");
    } else {
      console.error("❌ Error en la llamada!");
    }
    
    return new Response(
      JSON.stringify(result, null, 2),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error("🚨 ERROR CRÍTICO:", error);
    console.error("🚨 Error Stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});