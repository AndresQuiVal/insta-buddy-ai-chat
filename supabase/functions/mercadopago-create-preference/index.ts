import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  title: string;
  description?: string;
  price: number;
  quantity?: number;
  payer_email?: string;
  external_reference?: string;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
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
    
    const { 
      title = "Hower - Plan Personalizado", 
      description = "Acceso a Hower Software",
      price = 200, 
      quantity = 1,
      payer_email,
      external_reference,
      back_urls
    } = body;

    // Crear la preferencia de pago
    const preferenceData: Record<string, unknown> = {
      items: [
        {
          id: "hower-custom-plan",
          title: title,
          description: description,
          currency_id: "MXN",
          quantity: quantity,
          unit_price: price,
        }
      ],
      back_urls: {
        success: back_urls?.success || "https://insta-buddy-ai-chat.lovable.app/thank-you",
        failure: back_urls?.failure || "https://insta-buddy-ai-chat.lovable.app/pricing-v2-discount",
        pending: back_urls?.pending || "https://insta-buddy-ai-chat.lovable.app/pricing-v2-discount",
      },
      auto_return: "approved",
      statement_descriptor: "HOWER",
      notification_url: `https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/mercadopago-webhook`,
    };

    // Agregar email del pagador si se proporciona
    if (payer_email) {
      preferenceData.payer = {
        email: payer_email
      };
    }

    // Agregar referencia externa si se proporciona
    if (external_reference) {
      preferenceData.external_reference = external_reference;
    }

    console.log('Creating Mercado Pago preference:', JSON.stringify(preferenceData));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago API error:', JSON.stringify(data));
      throw new Error(`Mercado Pago API error: ${JSON.stringify(data)}`);
    }

    console.log('Preference created successfully:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating preference:', error);
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
