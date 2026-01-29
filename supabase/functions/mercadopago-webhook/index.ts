import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

        // Solo procesar pagos aprobados
        if (paymentData.status === 'approved') {
          const payerEmail = paymentData.payer?.email;
          const mercadopagoId = paymentData.id?.toString();
          
          console.log(`Payment approved! Email: ${payerEmail}, MercadoPago ID: ${mercadopagoId}`);

          if (payerEmail && mercadopagoId) {
            // Llamar al endpoint de Hower para crear credenciales
            try {
              const howerResponse = await fetch(
                'https://www.howersoftware.io/clients/stripe/create-checkout-session/',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userEmail: payerEmail,
                    mercadopagoId: mercadopagoId,
                  }),
                }
              );

              const howerResult = await howerResponse.json();
              console.log('Hower API response:', JSON.stringify(howerResult));

              if (howerResult.status === 'success') {
                console.log(`✅ Usuario creado exitosamente en Hower para ${payerEmail}`);
              } else {
                console.error(`❌ Error al crear usuario en Hower: ${howerResult.message}`);
              }
            } catch (howerError) {
              console.error('Error calling Hower API:', howerError);
            }
          } else {
            console.log('Missing payer email or mercadopago ID, skipping Hower registration');
          }
        } else {
          console.log(`Payment ${paymentId} status: ${paymentData.status} - not approved, skipping`);
        }
      }
    }

    // Procesar notificaciones de suscripción (preapproval)
    if (type === 'subscription_preapproval' || action?.includes('preapproval')) {
      const preapprovalId = data?.id;
      
      if (preapprovalId) {
        const preapprovalResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${preapprovalId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const preapprovalData = await preapprovalResponse.json();
        console.log('Preapproval data:', JSON.stringify(preapprovalData));

        // Si la suscripción fue autorizada
        if (preapprovalData.status === 'authorized') {
          const payerEmail = preapprovalData.payer_email;
          const mercadopagoId = preapprovalData.id;

          console.log(`Subscription authorized! Email: ${payerEmail}, ID: ${mercadopagoId}`);

          if (payerEmail && mercadopagoId) {
            try {
              const howerResponse = await fetch(
                'https://www.howersoftware.io/clients/stripe/create-checkout-session/',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userEmail: payerEmail,
                    mercadopagoId: mercadopagoId,
                  }),
                }
              );

              const howerResult = await howerResponse.json();
              console.log('Hower API response (subscription):', JSON.stringify(howerResult));

              if (howerResult.status === 'success') {
                console.log(`✅ Usuario creado exitosamente en Hower para suscripción ${payerEmail}`);
              } else {
                console.error(`❌ Error al crear usuario en Hower: ${howerResult.message}`);
              }
            } catch (howerError) {
              console.error('Error calling Hower API for subscription:', howerError);
            }
          }
        }
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
