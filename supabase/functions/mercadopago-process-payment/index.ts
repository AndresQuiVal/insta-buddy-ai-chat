import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  token: string;
  transaction_amount: number;
  installments: number;
  payment_method_id: string;
  payer_email: string;
  description?: string;
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

    const body: PaymentRequest = await req.json();
    console.log('Processing payment request:', JSON.stringify({
      ...body,
      token: body.token ? '***' : undefined // Don't log the token
    }));

    const {
      token,
      transaction_amount,
      installments,
      payment_method_id,
      payer_email,
      description = "Hower - Plan Personalizado"
    } = body;

    // Validate required fields
    if (!token || !transaction_amount || !payer_email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: token, transaction_amount, payer_email'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create payment with Mercado Pago API
    const paymentData = {
      transaction_amount,
      token,
      description,
      installments: installments || 1,
      payment_method_id,
      payer: {
        email: payer_email
      }
    };

    console.log('Sending payment to Mercado Pago:', JSON.stringify({
      ...paymentData,
      token: '***'
    }));

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    console.log('Mercado Pago response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Mercado Pago API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || 'Payment processing failed',
          details: data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Return payment result
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        payment_method: data.payment_method_id,
        transaction_amount: data.transaction_amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing payment:', error);
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
