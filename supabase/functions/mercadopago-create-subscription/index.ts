import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SubscriptionRequest {
  payer_email: string;
  reason?: string;
  transaction_amount?: number;
  external_reference?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
    }

    const body: SubscriptionRequest = await req.json();
    console.log('Creating subscription:', JSON.stringify(body));

    const {
      payer_email,
      reason = "Hower - Suscripción Mensual",
      transaction_amount = 200,
      external_reference
    } = body;

    if (!payer_email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El email es requerido para crear la suscripción'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create a subscription (preapproval) without associated plan
    // This allows for more flexibility and direct card charging
    const subscriptionData = {
      reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount,
        currency_id: "MXN"
      },
      payer_email,
      back_url: "https://insta-buddy-ai-chat.lovable.app/thank-you",
      external_reference: external_reference || `hower_sub_${Date.now()}`
    };

    console.log('Subscription data:', JSON.stringify(subscriptionData));

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();
    console.log('Mercado Pago response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Mercado Pago API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || 'Error al crear la suscripción',
          details: data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: data.id,
        init_point: data.init_point,
        status: data.status,
        next_payment_date: data.next_payment_date,
        payer_email: data.payer_email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
