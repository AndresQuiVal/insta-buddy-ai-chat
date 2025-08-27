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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instagram_user_id } = await req.json();
    
    if (!instagram_user_id) {
      throw new Error('instagram_user_id is required');
    }

    console.log('🔍 Getting Hower credentials for user:', instagram_user_id);

    // Get Hower credentials from database
    const { data: userData, error: userError } = await supabase
      .from('instagram_users')
      .select('hower_username, hower_token')
      .eq('instagram_user_id', instagram_user_id)
      .single();

    if (userError) {
      console.error('❌ Error getting user data:', userError);
      throw new Error('User not found');
    }

    if (!userData.hower_username || !userData.hower_token) {
      console.log('⚠️ User has no Hower credentials');
      return new Response(JSON.stringify({
        success: false,
        error: 'No Hower credentials found for user'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('📞 Calling Hower API with credentials:', { 
      username: userData.hower_username, 
      hasToken: !!userData.hower_token 
    });

    // Call Hower API
    const howerResponse = await fetch('https://www.howersoftware.io/clients/api/get-sent-messages-usernames/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hower_username: userData.hower_username,
        hower_token: userData.hower_token
      })
    });

    if (!howerResponse.ok) {
      console.error('❌ Hower API error:', howerResponse.status, howerResponse.statusText);
      throw new Error(`Hower API error: ${howerResponse.status}`);
    }

    const howerData: HowerResponse = await howerResponse.json();
    console.log('✅ Hower API response:', { 
      success: howerData.success,
      usernameCount: howerData.data?.usernames?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      data: howerData.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in get-hower-usernames function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});