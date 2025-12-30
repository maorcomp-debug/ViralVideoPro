import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TakbullCallbackParams {
  transactionInternalNumber?: string;
  order_reference?: string;
  uniqId?: string;
  statusCode?: string;
  token?: string;
  Last4Digits?: string;
  numberpayments?: string;
  TokenExpirationMonth?: string;
  TokenExpirationYear?: string;
  ordernumber?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get parameters from query string
    const params: TakbullCallbackParams = req.query as any;

    if (!params.order_reference) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing order_reference' 
      });
    }

    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return res.status(500).json({ 
        ok: false, 
        error: 'Server configuration error' 
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find order by order_reference
    const { data: order, error: orderError } = await supabase
      .from('takbull_orders')
      .select('*')
      .eq('order_reference', params.order_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', params.order_reference);
      return res.status(404).json({ 
        ok: false, 
        error: 'Order not found' 
      });
    }

    const statusCode = parseInt(params.statusCode || '0', 10);
    const isSuccess = statusCode === 0;

    // Update order with transaction details
    const updateData: any = {
      transaction_internal_number: params.transactionInternalNumber,
      uniq_id: params.uniqId,
      takbull_order_number: params.ordernumber,
      status_code: statusCode,
      token: params.token,
      last_4_digits: params.Last4Digits,
      number_payments: params.numberpayments ? parseInt(params.numberpayments, 10) : 1,
      token_expiration_month: params.TokenExpirationMonth,
      token_expiration_year: params.TokenExpirationYear,
      order_status: isSuccess ? 'completed' : 'failed',
      payment_status: isSuccess ? 'paid' : 'failed',
      completed_at: isSuccess ? new Date().toISOString() : null,
      error_message: isSuccess ? null : `Payment failed with status code: ${statusCode}`,
      takbull_response: params,
    };

    const { error: updateError } = await supabase
      .from('takbull_orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to update order' 
      });
    }

    // If payment successful, process subscription
    if (isSuccess) {
      try {
        // Get plan details
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', order.plan_id)
          .single();

        if (!plan) {
          console.error('Plan not found:', order.plan_id);
          return res.status(500).json({ 
            ok: false, 
            error: 'Plan not found' 
          });
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        if (order.billing_period === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Calculate next payment date for recurring
        const nextPaymentDate = new Date(endDate);

        // Create or update subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: order.user_id,
            plan_id: order.plan_id,
            status: 'active',
            billing_period: order.billing_period,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payment_provider: 'takbull',
            payment_id: params.ordernumber || params.transactionInternalNumber,
          }, {
            onConflict: 'user_id,plan_id',
          })
          .select()
          .single();

        if (subError) {
          console.error('Error creating subscription:', subError);
          // Don't fail the callback, just log
        } else {
          // Update order with subscription_id
          await supabase
            .from('takbull_orders')
            .update({ 
              subscription_id: subscription.id,
              next_payment_date: nextPaymentDate.toISOString()
            })
            .eq('id', order.id);

          // Update user profile
          await supabase
            .from('profiles')
            .update({
              subscription_tier: order.subscription_tier,
              subscription_period: order.billing_period,
              subscription_start_date: startDate.toISOString(),
              subscription_end_date: endDate.toISOString(),
              subscription_status: 'active',
            })
            .eq('user_id', order.user_id);
        }
      } catch (error: any) {
        console.error('Error processing subscription:', error);
        // Don't fail the callback, subscription can be processed later
      }
    }

    // Redirect to thank you page
    const redirectUrl = isSuccess
      ? `${req.headers.origin || 'https://viraly.co.il'}/order-received/${params.order_reference}?status=success`
      : `${req.headers.origin || 'https://viraly.co.il'}/order-received/${params.order_reference}?status=failed`;

    return res.redirect(302, redirectUrl);

  } catch (error: any) {
    console.error('Error in callback:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}

