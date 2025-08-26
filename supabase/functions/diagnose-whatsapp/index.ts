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
    console.log("🔍 DIAGNÓSTICO DEL ENDPOINT DE WHATSAPP");
    
    // Primero verificar si el endpoint responde
    console.log("1️⃣ Verificando conectividad básica...");
    
    const testUrl = "https://www.howersoftware.io/clients/api/send-whatsapp/";
    
    // Test básico de conectividad
    try {
      const basicResponse = await fetch(testUrl, {
        method: 'GET',
      });
      console.log("🌐 GET básico - Status:", basicResponse.status);
      console.log("🌐 GET básico - Headers:", JSON.stringify(Object.fromEntries(basicResponse.headers.entries())));
    } catch (getError) {
      console.log("❌ Error en GET básico:", getError.message);
    }

    // Test con POST vacío
    console.log("2️⃣ Test POST vacío...");
    try {
      const emptyPostResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("📤 POST vacío - Status:", emptyPostResponse.status);
      const emptyText = await emptyPostResponse.text();
      console.log("📤 POST vacío - Response:", emptyText);
    } catch (postError) {
      console.log("❌ Error en POST vacío:", postError.message);
    }

    // Test con datos mínimos
    console.log("3️⃣ Test POST con datos mínimos...");
    try {
      const minimalData = {
        message: "test",
        to_number: "523338459844"
      };
      
      const minimalResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalData)
      });
      
      console.log("📱 POST datos mínimos - Status:", minimalResponse.status);
      console.log("📱 POST datos mínimos - StatusText:", minimalResponse.statusText);
      console.log("📱 POST datos mínimos - Headers:", JSON.stringify(Object.fromEntries(minimalResponse.headers.entries())));
      
      const minimalText = await minimalResponse.text();
      console.log("📱 POST datos mínimos - Response:", minimalText);
      
      // Intentar parsear como JSON
      try {
        const minimalJson = JSON.parse(minimalText);
        console.log("📱 POST datos mínimos - JSON:", JSON.stringify(minimalJson, null, 2));
      } catch (jsonError) {
        console.log("⚠️ Response no es JSON válido");
      }
      
    } catch (minimalError) {
      console.log("❌ Error en POST mínimo:", minimalError.message);
      console.log("❌ Stack:", minimalError.stack);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Diagnóstico completado - revisar logs",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("🚨 ERROR CRÍTICO EN DIAGNÓSTICO:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});