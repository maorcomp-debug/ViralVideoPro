import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook secret (from Stripe, PayPal, etc.)
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET') ?? '';
    const signature = req.headers.get('stripe-signature') || req.headers.get('paypal-signature') || '';

    // Verify webhook signature (implement based on your payment provider)
    // For Stripe: use stripe.webhooks.constructEvent()
    // For PayPal: verify PayPal signature

    const payload = await req.json();
    const eventType = payload.type || payload.event_type;

    // Insert webhook into database
    const { data: webhookRecord, error: insertError } = await supabase
      .from('payment_webhooks')
      .insert({
        provider: payload.provider || 'stripe',
        event_type: eventType,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting webhook:', insertError);
      throw insertError;
    }

    // Process webhook
    if (eventType === 'checkout.session.completed' || eventType === 'payment.succeeded') {
      // Extract user and plan info from payload
      const customerEmail = payload.data?.object?.customer_email || payload.email;
      const planTier = payload.metadata?.plan_tier || payload.plan_tier;
      const billingPeriod = payload.metadata?.billing_period || payload.billing_period || 'monthly';
      const paymentId = payload.data?.object?.id || payload.id;

      if (!customerEmail || !planTier) {
        throw new Error('Missing required fields: customerEmail or planTier');
      }

      // Get user by email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email === customerEmail);

      if (!user) {
        throw new Error(`User not found: ${customerEmail}`);
      }

      // Get plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', planTier)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        throw new Error(`Plan not found: ${planTier}`);
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Create or update subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          billing_period: billingPeriod,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_provider: 'stripe',
          payment_id: paymentId,
        }, {
          onConflict: 'user_id,plan_id',
        });

      if (subError) {
        throw subError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: planTier,
          subscription_period: billingPeriod,
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          subscription_status: 'active',
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Mark webhook as processed
      await supabase
        .from('payment_webhooks')
        .update({ processed: true })
        .eq('id', webhookRecord.id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

