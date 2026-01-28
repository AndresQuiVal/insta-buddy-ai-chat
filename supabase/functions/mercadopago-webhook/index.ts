import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el body del webhook
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Mercado Pago envía diferentes tipos de notificaciones
    const { type, data, action } = body;

    // Procesar notificaciones de pago
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id;
      
      if (paymentId) {
        // Obtener detalles del pago desde la API de Mercado Pago
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const paymentData = await paymentResponse.json();
        console.log('Payment data:', JSON.stringify(paymentData));

        // Aquí puedes guardar la información del pago en tu base de datos
        // Por ejemplo:
        // await supabase.from('payments').upsert({
        //   payment_id: paymentData.id,
        //   status: paymentData.status,
        //   amount: paymentData.transaction_amount,
        //   payer_email: paymentData.payer?.email,
        //   external_reference: paymentData.external_reference,
        //   created_at: paymentData.date_created,
        // });

        console.log(`Payment ${paymentId} processed with status: ${paymentData.status}`);
      }
    }

    // Mercado Pago espera un 200 OK para confirmar que recibimos la notificación
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    // Aún devolvemos 200 para evitar reintentos innecesarios
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
