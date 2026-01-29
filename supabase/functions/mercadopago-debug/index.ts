import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const url = new URL(req.url);
    let preapprovalId = url.searchParams.get('preapproval_id');
    let paymentId = url.searchParams.get('payment_id');

    // NOTE: When calling via tools, Content-Type might not be application/json.
    // So we parse body as text and JSON.parse if possible.
    if (!preapprovalId && !paymentId && req.method !== 'GET') {
      try {
        const raw = await req.text();
        if (raw) {
          const body = JSON.parse(raw);
          if (body && typeof body === 'object') {
            const candidatePreapproval = (body.preapproval_id || body.preapprovalId) as unknown;
            const candidatePayment = (body.payment_id || body.paymentId) as unknown;

            if (typeof candidatePreapproval === 'string' && candidatePreapproval.trim()) {
              preapprovalId = candidatePreapproval.trim();
            }
            if (typeof candidatePayment === 'string' && candidatePayment.trim()) {
              paymentId = candidatePayment.trim();
            }
          }
        }
      } catch {
        // ignore body parse errors
      }
    }

    console.log('🔍 Debug request - method:', req.method, '- preapproval_id:', preapprovalId, 'payment_id:', paymentId);

    const results: Record<string, unknown> = {};

    // Consultar preapproval si se proporciona ID
    if (preapprovalId) {
      console.log(`📋 Fetching preapproval: ${preapprovalId}`);
      const preapprovalResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const preapprovalData = await preapprovalResponse.json();
      console.log('📦 Preapproval data:', JSON.stringify(preapprovalData, null, 2));
      
      results.preapproval = {
        id: preapprovalData.id,
        status: preapprovalData.status,
        payer_email: preapprovalData.payer_email,
        payer_id: preapprovalData.payer_id,
        reason: preapprovalData.reason,
        date_created: preapprovalData.date_created,
        last_modified: preapprovalData.last_modified,
        collector_id: preapprovalData.collector_id,
        application_id: preapprovalData.application_id,
        auto_recurring: preapprovalData.auto_recurring,
        summarized: preapprovalData.summarized,
        next_payment_date: preapprovalData.next_payment_date,
        // Campos importantes para debug
        full_response: preapprovalData,
      };
    }

    // Consultar payment si se proporciona ID
    if (paymentId) {
      console.log(`💳 Fetching payment: ${paymentId}`);
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const paymentData = await paymentResponse.json();
      console.log('💰 Payment data:', JSON.stringify(paymentData, null, 2));
      
      results.payment = {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        description: paymentData.description,
        payer: paymentData.payer,
        transaction_amount: paymentData.transaction_amount,
        date_created: paymentData.date_created,
        date_approved: paymentData.date_approved,
        payment_method_id: paymentData.payment_method_id,
        payment_type_id: paymentData.payment_type_id,
        // Campos importantes para debug de rechazos
        call_for_authorize_id: paymentData.call_for_authorize_id,
        processing_mode: paymentData.processing_mode,
        issuer_id: paymentData.issuer_id,
        // Full response para análisis completo
        full_response: paymentData,
      };
    }

    // Si no se proporcionó ningún ID, buscar los últimos preapprovals
    if (!preapprovalId && !paymentId) {
      console.log('📋 No ID provided, fetching recent preapprovals...');
      const searchResponse = await fetch(
        `https://api.mercadopago.com/preapproval/search?status=pending&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const searchData = await searchResponse.json();
      console.log('🔎 Recent preapprovals:', JSON.stringify(searchData, null, 2));
      
      results.recent_preapprovals = searchData.results?.map((p: Record<string, unknown>) => ({
        id: p.id,
        status: p.status,
        payer_email: p.payer_email,
        reason: p.reason,
        date_created: p.date_created,
      })) || [];
      results.total_found = searchData.paging?.total || 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        ...results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Debug error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
