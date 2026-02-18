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
  /** Preferred UI language for payment page: 'he' | 'en'. Pass from app; Takbull may support both. */
  preferredLanguage?: 'he' | 'en';
}

// RULE: This API only creates an order and returns the payment URL. It does NOT update profile or subscription.
// מעבר לחבילה חדשה מתבצע רק לאחר קבלת תשלום בהצלחה (callback) – לא בלחיצה על שדרוג.
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

    // Get plan details (include name for Takbull product display)
    let planId = body.planId;
    if (!planId) {
      const { data: planRow, error: planError } = await supabase
        .from('plans')
        .select('id, name, monthly_price, yearly_price')
        .eq('tier', body.subscriptionTier)
        .eq('is_active', true)
        .single();

      if (planError || !planRow) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Plan not found' 
        });
      }
      planId = planRow.id;
    }

    // Calculate amount based on billing period (fetch plan with name for product display)
    const { data: plan, error: planFetchError } = await supabase
      .from('plans')
      .select('id, name, monthly_price, yearly_price')
      .eq('id', planId)
      .single();

    if (planFetchError || !plan) {
      console.error('❌ Error fetching plan:', planFetchError);
      return res.status(400).json({ 
        ok: false, 
        error: 'Plan not found' 
      });
    }

    let amount = body.billingPeriod === 'monthly' 
      ? plan.monthly_price 
      : plan.yearly_price;

    // Fetch profile for discount and for Takbull customer data (name, email, phone)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, phone, pending_payment_discount_type, pending_payment_discount_value')
      .eq('user_id', body.userId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    }

    const discountType = (profile as any)?.pending_payment_discount_type;
    const discountValue = (profile as any)?.pending_payment_discount_value;
    if (discountType && discountValue != null && amount > 0) {
      if (discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(discountValue)));
        amount = Math.round(amount * (1 - pct / 100));
      } else if (discountType === 'fixed_amount') {
        const fixed = Math.min(amount, Math.max(0, Number(discountValue)));
        amount = Math.round(amount - fixed);
      }
      amount = Math.max(0, amount);
      console.log('💰 Applied registration coupon discount:', { discountType, discountValue, finalAmount: amount });
    }

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

    // Product display name for Takbull (from plan or tier fallback)
    const productName = (plan as any)?.name || `Viraly Pro - ${body.subscriptionTier}`;
    const customerName = (profile as any)?.full_name?.trim() || '';
    const customerEmail = (profile as any)?.email || '';
    const customerPhone = (profile as any)?.phone?.trim() || '';

    // Prepare request to Takbull API
    // Try multiple authentication methods as different APIs use different formats
    const takbullPayload: any = {
      DealType: 4, // Subscription
      Interval:1,
      OrderReference: orderReference,
      OrderTotalSum: amount,
      InitialAmount: amount,
      InitialAmountDescription: productName,
      Products: [
        {
          ProductName: productName,
          Price: amount,
        },
      ],
      Customer: {
        CustomerFullName: customerName,
        Email: customerEmail,
        PhoneNumber: customerPhone,
      },
      RedirectAddress: redirectUrl,
      Currency: 'ILS',
      Language: (body.preferredLanguage === 'en' ? 'en' : 'he') as string,
    };

    // Add subscription parameters if needed (check Takbull docs)
    // Some APIs might not support these fields or require different format
    if (body.billingPeriod === 'yearly') {
      // For yearly subscriptions, you might need to handle differently
      // Check Takbull API docs for recurring payment setup
      takbullPayload.RecuringInterval = 4;
      takbullPayload.NumberOfPayments = 12; // 12 monthly payments
    } else {
      takbullPayload.RecuringInterval = 5;
      takbullPayload.NumberOfPayments = 1;
    }

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
      FullPayload: JSON.stringify(takbullPayload),
    });

    // Call Takbull API
    // Try method 1: API keys in body (original method)
    let takbullResponse;
    try {
      const takbullPayloadWithKeys = {
        ...takbullPayload,
        API_Key: takbullApiKey,
        API_Secret: takbullApiSecret,
      };

      console.log('📤 Attempting Takbull API call with keys in body...');
      
      takbullResponse = await fetch('https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(takbullPayloadWithKeys),
      });

      console.log('📥 Takbull API response status:', takbullResponse.status, takbullResponse.statusText);

      // If 401, try method 2: API keys in headers
      if (takbullResponse.status === 401) {
        console.log('⚠️ 401 Unauthorized with keys in body, trying keys in headers...');
        
        takbullResponse = await fetch('https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'API_Key': takbullApiKey || '',
            'API_Secret': takbullApiSecret || '',
          },
          body: JSON.stringify(takbullPayload),
        });

        console.log('📥 Takbull API response status (headers method):', takbullResponse.status, takbullResponse.statusText);
      }

      // If still 401, try method 3: Basic Auth
      if (takbullResponse.status === 401) {
        console.log('⚠️ 401 Unauthorized with headers, trying Basic Auth...');
        
        const basicAuth = Buffer.from(`${takbullApiKey}:${takbullApiSecret}`).toString('base64');
        
        takbullResponse = await fetch('https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify(takbullPayloadWithKeys),
        });

        console.log('📥 Takbull API response status (Basic Auth):', takbullResponse.status, takbullResponse.statusText);
      }
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

    // Update order with Takbull response (including uniqId for future lookup)
    await supabase
      .from('takbull_orders')
      .update({ 
        takbull_response: takbullData,
        uniq_id: takbullData.uniqId || null, // Store uniqId for callback lookup
        order_status: takbullData.responseCode === 0 ? 'processing' : 'failed',
        error_message: takbullData.responseCode !== 0 ? takbullData.message : null
      })
      .eq('id', order.id);
    
    console.log('✅ Order updated with Takbull response, uniqId:', takbullData.uniqId);

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

