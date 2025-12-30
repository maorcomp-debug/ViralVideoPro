import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TakbullIPNParams {
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
  eventType?: string; // 'payment_success', 'payment_failed', 'recurring_payment', etc.
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
    const body: TakbullIPNParams = req.body || req.query;

    if (!body.order_reference) {
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
      .select('*, subscriptions(*)')
      .eq('order_reference', body.order_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', body.order_reference);
      return res.status(404).json({ 
        ok: false, 
        error: 'Order not found' 
      });
    }

    const statusCode = parseInt(body.statusCode || '0', 10);
    const isSuccess = statusCode === 0;
    const eventType = body.eventType || (isSuccess ? 'payment_success' : 'payment_failed');

    // Update order with latest transaction details
    const updateData: any = {
      transaction_internal_number: body.transactionInternalNumber || order.transaction_internal_number,
      uniq_id: body.uniqId || order.uniq_id,
      takbull_order_number: body.ordernumber || order.takbull_order_number,
      status_code: statusCode,
      token: body.token || order.token,
      last_4_digits: body.Last4Digits || order.last_4_digits,
      number_payments: body.numberpayments ? parseInt(body.numberpayments, 10) : order.number_payments,
      token_expiration_month: body.TokenExpirationMonth || order.token_expiration_month,
      token_expiration_year: body.TokenExpirationYear || order.token_expiration_year,
      takbull_response: { ...order.takbull_response, ...body },
    };

    // Handle different event types
    if (eventType === 'recurring_payment' || eventType === 'payment_success') {
      if (isSuccess) {
        updateData.order_status = 'completed';
        updateData.payment_status = 'paid';
        updateData.completed_at = new Date().toISOString();
        updateData.error_message = null;

        // Calculate next payment date
        const nextPayment = new Date();
        if (order.billing_period === 'monthly') {
          nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else {
          nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }
        updateData.next_payment_date = nextPayment.toISOString();

        // Update subscription end date
        if (order.subscription_id) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', order.subscription_id)
            .single();

          if (subscription) {
            const newEndDate = new Date(subscription.end_date);
            if (order.billing_period === 'monthly') {
              newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else {
              newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }

            await supabase
              .from('subscriptions')
              .update({
                end_date: newEndDate.toISOString(),
                status: 'active',
              })
              .eq('id', order.subscription_id);

            // Update user profile
            await supabase
              .from('profiles')
              .update({
                subscription_end_date: newEndDate.toISOString(),
                subscription_status: 'active',
              })
              .eq('user_id', order.user_id);
          }
        }
      }
    } else if (eventType === 'payment_failed') {
      updateData.order_status = 'failed';
      updateData.payment_status = 'failed';
      updateData.error_message = `Payment failed with status code: ${statusCode}`;

      // If subscription exists, mark it as inactive
      if (order.subscription_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'inactive' })
          .eq('id', order.subscription_id);

        await supabase
          .from('profiles')
          .update({ subscription_status: 'inactive' })
          .eq('user_id', order.user_id);

        // TODO: Send notification email to customer about failed payment
        // You can use Resend API here similar to contact form
      }
    }

    // Update order
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

    return res.status(200).json({ 
      ok: true, 
      message: 'IPN processed successfully' 
    });

  } catch (error: any) {
    console.error('Error in IPN:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}

