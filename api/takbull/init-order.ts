import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitOrderRequest {
  userId: string;
  subscriptionTier: 'creator' | 'pro' | 'coach' | 'coach-pro';
  billingPeriod: 'monthly' | 'yearly';
  planId?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body: InitOrderRequest = req.body;

    // Validation
    if (!body.userId || !body.subscriptionTier || !body.billingPeriod) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: userId, subscriptionTier, billingPeriod' 
      });
    }

    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const takbullApiKey = process.env.TAKBULL_API_KEY;
    const takbullApiSecret = process.env.TAKBULL_API_SECRET;
    const redirectUrl = process.env.TAKBULL_REDIRECT_URL || `${req.headers.origin || 'https://viraly.co.il'}/order-received`;

    // Debug logging (don't log secrets in production)
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasTakbullApiKey: !!takbullApiKey,
      hasTakbullApiSecret: !!takbullApiSecret,
      redirectUrl,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials not configured:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseServiceKey: !!supabaseServiceKey,
      });
      return res.status(500).json({ 
        ok: false, 
        error: 'Server configuration error: Supabase credentials missing. Please check Vercel environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' 
      });
    }

    if (!takbullApiKey || !takbullApiSecret) {
      console.error('❌ Takbull API credentials not configured:', {
        hasTakbullApiKey: !!takbullApiKey,
        hasTakbullApiSecret: !!takbullApiSecret,
      });
      return res.status(500).json({ 
        ok: false, 
        error: 'Payment gateway not configured: Takbull API credentials missing. Please check Vercel environment variables: TAKBULL_API_KEY and TAKBULL_API_SECRET' 
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get plan details
    let planId = body.planId;
    if (!planId) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, monthly_price, yearly_price')
        .eq('tier', body.subscriptionTier)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Plan not found' 
        });
      }
      planId = plan.id;
    }

    // Calculate amount based on billing period
    const { data: plan, error: planFetchError } = await supabase
      .from('plans')
      .select('monthly_price, yearly_price')
      .eq('id', planId)
      .single();

    if (planFetchError || !plan) {
      console.error('❌ Error fetching plan:', planFetchError);
      return res.status(400).json({ 
        ok: false, 
        error: 'Plan not found' 
      });
    }

    const amount = body.billingPeriod === 'monthly' 
      ? plan.monthly_price 
      : plan.yearly_price;

    console.log('💰 Plan details:', {
      planId,
      billingPeriod: body.billingPeriod,
      monthlyPrice: plan.monthly_price,
      yearlyPrice: plan.yearly_price,
      amount,
    });

    // Generate unique order reference
    const orderReference = `VRL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('takbull_orders')
      .insert({
        user_id: body.userId,
        subscription_tier: body.subscriptionTier,
        billing_period: body.billingPeriod,
        plan_id: planId,
        order_reference: orderReference,
        order_status: 'pending',
        payment_status: 'pending',
        is_recurring: true,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to create order' 
      });
    }

    // Prepare request to Takbull API
    const takbullPayload = {
      API_Key: takbullApiKey,
      API_Secret: takbullApiSecret,
      DealType: 4, // Subscription
      OrderReference: orderReference,
      Amount: amount,
      RedirectAddress: redirectUrl,
      Currency: 'ILS',
      Language: 'he',
      // Additional subscription parameters
      Recurring: true,
      NumberOfPayments: body.billingPeriod === 'yearly' ? 12 : 1, // For yearly, split into 12 monthly payments
    };

    console.log('📤 Calling Takbull API with payload:', {
      API_Key: takbullApiKey ? `${takbullApiKey.substring(0, 10)}...` : 'MISSING',
      API_Secret: takbullApiSecret ? '***' : 'MISSING',
      DealType: takbullPayload.DealType,
      OrderReference: takbullPayload.OrderReference,
      Amount: takbullPayload.Amount,
      RedirectAddress: takbullPayload.RedirectAddress,
      Currency: takbullPayload.Currency,
      Language: takbullPayload.Language,
      Recurring: takbullPayload.Recurring,
      NumberOfPayments: takbullPayload.NumberOfPayments,
    });

    // Call Takbull API
    let takbullResponse;
    try {
      takbullResponse = await fetch('https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(takbullPayload),
      });

      console.log('📥 Takbull API response status:', takbullResponse.status, takbullResponse.statusText);
    } catch (fetchError: any) {
      console.error('❌ Error calling Takbull API:', fetchError);
      // Update order status to failed
      await supabase
        .from('takbull_orders')
        .update({ 
          order_status: 'failed',
          error_message: `Network error: ${fetchError.message}`
        })
        .eq('id', order.id);

      return res.status(500).json({ 
        ok: false, 
        error: `Network error connecting to payment gateway: ${fetchError.message}` 
      });
    }

    if (!takbullResponse.ok) {
      const errorText = await takbullResponse.text();
      console.error('❌ Takbull API error:', {
        status: takbullResponse.status,
        statusText: takbullResponse.statusText,
        body: errorText,
      });
      
      // Update order status to failed
      await supabase
        .from('takbull_orders')
        .update({ 
          order_status: 'failed',
          error_message: `Takbull API error: ${takbullResponse.status} - ${errorText}`
        })
        .eq('id', order.id);

      return res.status(500).json({ 
        ok: false, 
        error: `Payment gateway error: ${takbullResponse.status} - ${errorText}` 
      });
    }

    const takbullData = await takbullResponse.json();
    
    console.log('📥 Takbull API response:', {
      responseCode: takbullData.responseCode,
      hasUrl: !!(takbullData.url || takbullData.redirectUrl),
      message: takbullData.message,
    });

    // Update order with Takbull response
    await supabase
      .from('takbull_orders')
      .update({ 
        takbull_response: takbullData,
        order_status: takbullData.responseCode === 0 ? 'processing' : 'failed',
        error_message: takbullData.responseCode !== 0 ? takbullData.message : null
      })
      .eq('id', order.id);

    if (takbullData.responseCode !== 0) {
      console.error('❌ Takbull API returned error:', takbullData);
      return res.status(400).json({ 
        ok: false, 
        error: takbullData.message || 'Failed to initialize payment' 
      });
    }

    const paymentUrl = takbullData.url || takbullData.redirectUrl;
    if (!paymentUrl) {
      console.error('❌ No payment URL in Takbull response:', takbullData);
      return res.status(500).json({ 
        ok: false, 
        error: 'No payment URL received from Takbull' 
      });
    }

    console.log('✅ Payment URL received successfully');

    // Return success with payment URL
    return res.status(200).json({
      ok: true,
      orderId: order.id,
      orderReference: orderReference,
      paymentUrl: paymentUrl,
      uniqId: takbullData.uniqId,
    });

  } catch (error: any) {
    console.error('Error in init-order:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}

