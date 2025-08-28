import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HowerCredentials {
  hower_username: string;
  hower_token: string;
}

interface HowerResponse {
  success: boolean;
  message: string;
  data: {
    hower_username: string;
    total_available: number;
    total_count: number;
    usernames: string[];
  };
}

serve(async (req) => {
  console.log('🚀 get-hower-usernames function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📥 Request body received:', body);
    
    const { instagram_user_id } = body;
    
    if (!instagram_user_id) {
      console.error('❌ Missing instagram_user_id in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'instagram_user_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Getting Hower credentials for user:', instagram_user_id);

    // Get Hower credentials from database
    const { data: userData, error: userError } = await supabase
      .from('instagram_users')
      .select('hower_username, hower_token')
      .eq('instagram_user_id', instagram_user_id)
      .single();

    console.log('📊 Database query result:', { 
      hasData: !!userData, 
      hasError: !!userError,
      errorDetails: userError ? userError.message : 'none'
    });

    if (userError) {
      console.error('❌ Error getting user data:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: `Usuario no encontrado en la base de datos: ${userError.message}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!userData || !userData.hower_username || !userData.hower_token) {
      console.log('⚠️ User has no Hower credentials:', {
        hasUserData: !!userData,
        hasUsername: userData?.hower_username ? 'yes' : 'no',
        hasToken: userData?.hower_token ? 'yes' : 'no'
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes credenciales de Hower configuradas. Ve a configuración para agregar tu usuario y token.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('📞 Calling Hower API with credentials:', { 
      username: userData.hower_username, 
      hasToken: !!userData.hower_token 
    });

    // Call Hower API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const howerResponse = await fetch('https://www.howersoftware.io/clients/api/get-sent-messages-usernames/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hower_username: userData.hower_username,
          hower_token: userData.hower_token
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('🌐 Hower API response status:', howerResponse.status);

      if (!howerResponse.ok) {
        const errorText = await howerResponse.text();
        console.error('❌ Hower API error details:', {
          status: howerResponse.status,
          statusText: howerResponse.statusText,
          response: errorText
        });
        
        let errorMessage;
        if (howerResponse.status === 401) {
          errorMessage = 'Credenciales de Hower inválidas. Verifica tu usuario y token en configuración.';
        } else if (howerResponse.status >= 500) {
          errorMessage = 'Error en los servidores de Hower. Intenta de nuevo más tarde.';
        } else {
          errorMessage = `Error de Hower (${howerResponse.status}). Contacta soporte si persiste.`;
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: errorMessage
        }), {
          status: howerResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const howerData: HowerResponse = await howerResponse.json();
      console.log('✅ Hower API success response:', { 
        success: howerData.success,
        hasData: !!howerData.data,
        usernameCount: howerData.data?.usernames?.length || 0
      });

      // Validate response structure
      if (!howerData.success || !howerData.data || !Array.isArray(howerData.data.usernames)) {
        console.error('❌ Invalid Hower response structure:', howerData);
        return new Response(JSON.stringify({
          success: false,
          error: 'Respuesta inválida de Hower. Contacta soporte.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: howerData.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error calling Hower API:', fetchError);
      
      let errorMessage;
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        errorMessage = 'Tiempo de conexión agotado con Hower. Intenta de nuevo.';
      } else {
        errorMessage = 'Error de conexión con Hower. Verifica tu conexión a internet.';
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in get-hower-usernames function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor. Intenta de nuevo más tarde.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});