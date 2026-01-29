import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isEmail = (value: string) => {
  // Simple & safe email heuristic (avoid strict RFC parsing)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const resolveUserEmail = (externalReference: unknown, fallbackEmail: unknown) => {
  if (typeof externalReference === 'string') {
    const ref = externalReference.trim();
    if (ref.startsWith('email:')) {
      const candidate = ref.slice('email:'.length).trim();
      if (isEmail(candidate)) return candidate;
    }
    if (isEmail(ref)) return ref;
  }

  if (typeof fallbackEmail === 'string' && isEmail(fallbackEmail)) {
    return fallbackEmail.trim();
  }

  return null;
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
    console.log('🔔 Webhook received - Full payload:', JSON.stringify(body, null, 2));

    // Mercado Pago envía diferentes tipos de notificaciones
    const { type, data, action } = body;
    console.log(`📋 Notification type: ${type}, action: ${action}, data.id: ${data?.id}`);

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
          const userEmail = resolveUserEmail(paymentData.external_reference, payerEmail);
          const mercadopagoId = paymentData.id?.toString();
          
          console.log(
            `Payment approved! userEmail: ${userEmail}, payerEmail: ${payerEmail}, external_reference: ${paymentData.external_reference}, MercadoPago ID: ${mercadopagoId}`
          );

          if (userEmail && mercadopagoId) {
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
                    userEmail,
                    mercadopagoId: mercadopagoId,
                  }),
                }
              );

              const howerResult = await howerResponse.json();
              console.log('Hower API response:', JSON.stringify(howerResult));

               if (howerResult.status === 'success') {
                 console.log(`✅ Usuario creado exitosamente en Hower para ${userEmail}`);
              } else {
                console.error(`❌ Error al crear usuario en Hower: ${howerResult.message}`);
              }
            } catch (howerError) {
              console.error('Error calling Hower API:', howerError);
            }
          } else {
            console.log('Missing user email or mercadopago ID, skipping Hower registration');
          }
        } else {
          console.log(`⚠️ Payment ${paymentId} NOT approved - status: ${paymentData.status}, status_detail: ${paymentData.status_detail}`);
          console.log(`📊 Payment rejection info - description: ${paymentData.description}, payer: ${JSON.stringify(paymentData.payer)}`);
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
        console.log('📦 Preapproval full data:', JSON.stringify(preapprovalData, null, 2));
        console.log(`📋 Preapproval status: ${preapprovalData.status}, payer_email: ${preapprovalData.payer_email}`);

        // Si la suscripción fue autorizada
        if (preapprovalData.status === 'authorized') {
          const payerEmail = preapprovalData.payer_email;
          const userEmail = resolveUserEmail(preapprovalData.external_reference, payerEmail);
          const mercadopagoId = preapprovalData.id;

          console.log(
            `Subscription authorized! userEmail: ${userEmail}, payerEmail: ${payerEmail}, external_reference: ${preapprovalData.external_reference}, ID: ${mercadopagoId}`
          );

          if (userEmail && mercadopagoId) {
            try {
              const howerResponse = await fetch(
                'https://www.howersoftware.io/clients/stripe/create-checkout-session/',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userEmail,
                    mercadopagoId: mercadopagoId,
                  }),
                }
              );

              const howerResult = await howerResponse.json();
              console.log('Hower API response (subscription):', JSON.stringify(howerResult));

              if (howerResult.status === 'success') {
                console.log(`✅ Usuario creado exitosamente en Hower para suscripción ${userEmail}`);
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
