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

    // Log received parameters for debugging
    console.log('📥 Takbull callback received:', {
      order_reference: params.order_reference,
      ordernumber: params.ordernumber,
      transactionInternalNumber: params.transactionInternalNumber,
      statusCode: params.statusCode,
      uniqId: params.uniqId,
      allParams: JSON.stringify(params),
    });

    // Try to find order by order_reference, ordernumber, or transactionInternalNumber
    let orderReference = params.order_reference || params.ordernumber || params.transactionInternalNumber;

    if (!orderReference) {
      console.error('❌ No order reference found in callback params');
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing order reference' 
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

    // Find order by order_reference, ordernumber, or transactionInternalNumber
    // Note: Takbull returns ordernumber which is different from our order_reference
    let order;
    let orderError;

    console.log('🔍 Searching for order with params:', {
      order_reference: params.order_reference,
      ordernumber: params.ordernumber,
      transactionInternalNumber: params.transactionInternalNumber,
    });

    // Try ordernumber first (this is what Takbull returns)
    if (params.ordernumber) {
      console.log('🔍 Trying to find order by takbull_order_number:', params.ordernumber);
      const result = await supabase
        .from('takbull_orders')
        .select('*')
        .eq('takbull_order_number', params.ordernumber)
        .single();
      order = result.data;
      orderError = result.error;
      if (order) {
        console.log('✅ Found order by takbull_order_number:', order.id);
      } else {
        console.log('❌ Order not found by takbull_order_number, error:', orderError);
      }
    }

    // If not found, try order_reference
    if (!order && params.order_reference) {
      console.log('🔍 Trying to find order by order_reference:', params.order_reference);
      const result = await supabase
        .from('takbull_orders')
        .select('*')
        .eq('order_reference', params.order_reference)
        .single();
      order = result.data;
      orderError = result.error;
      if (order) {
        console.log('✅ Found order by order_reference:', order.id);
      } else {
        console.log('❌ Order not found by order_reference, error:', orderError);
      }
    }

    // If still not found, try transactionInternalNumber
    if (!order && params.transactionInternalNumber) {
      console.log('🔍 Trying to find order by transaction_internal_number:', params.transactionInternalNumber);
      const result = await supabase
        .from('takbull_orders')
        .select('*')
        .eq('transaction_internal_number', params.transactionInternalNumber)
        .single();
      order = result.data;
      orderError = result.error;
      if (order) {
        console.log('✅ Found order by transaction_internal_number:', order.id);
      } else {
        console.log('❌ Order not found by transaction_internal_number, error:', orderError);
      }
    }

    // If still not found, try searching by uniqId (this might be in the order)
    if (!order && params.uniqId) {
      console.log('🔍 Trying to find order by uniq_id:', params.uniqId);
      const result = await supabase
        .from('takbull_orders')
        .select('*')
        .eq('uniq_id', params.uniqId)
        .single();
      order = result.data;
      orderError = result.error;
      if (order) {
        console.log('✅ Found order by uniq_id:', order.id);
      } else {
        console.log('❌ Order not found by uniq_id, error:', orderError);
      }
    }

    // If still not found, try to find by searching recent pending orders
    // This is a fallback when Takbull ordernumber doesn't match our order_reference
    if (!order) {
      console.log('⚠️ Order not found by any direct method, trying fallback search...');
      console.log('🔍 Searching for recent pending orders (within last 2 hours)...');
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = await supabase
        .from('takbull_orders')
        .select('*')
        .eq('order_status', 'pending')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (result.data && result.data.length > 0) {
        console.log(`🔍 Found ${result.data.length} recent pending orders`);
        // Take the most recent one
        order = result.data[0];
        console.log('✅ Using most recent pending order as fallback:', {
          orderId: order.id,
          orderReference: order.order_reference,
          createdAt: order.created_at,
        });
      } else {
        console.log('❌ No recent pending orders found');
      }
    }

    if (!order) {
      console.error('❌ Order not found:', {
        searchedBy: {
          order_reference: params.order_reference,
          ordernumber: params.ordernumber,
          transactionInternalNumber: params.transactionInternalNumber,
          uniqId: params.uniqId,
        },
        error: orderError,
      });
      return res.status(404).json({ 
        ok: false, 
        error: `Order not found. Searched by: order_reference=${params.order_reference}, ordernumber=${params.ordernumber}, transactionInternalNumber=${params.transactionInternalNumber}, uniqId=${params.uniqId}` 
      });
    }

    console.log('✅ Order found:', {
      orderId: order.id,
      orderReference: order.order_reference,
      userId: order.user_id,
      subscriptionTier: order.subscription_tier,
      billingPeriod: order.billing_period,
    });

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

        // Get old profile before update (for upgrade modal and to preserve tracks)
        let oldTier: string = 'free';
        let oldProfile: any = null;
        if (isSuccess) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', order.user_id)
            .single();
          
          oldProfile = profileData;
          oldTier = oldProfile?.subscription_tier || 'free';
          console.log('📊 Old subscription tier:', oldTier);
          console.log('📊 New subscription tier:', order.subscription_tier);
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

        // Check if subscription already exists
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', order.user_id)
          .eq('plan_id', order.plan_id)
          .maybeSingle();

        let subscription;
        let subError;

        if (existingSubscription) {
          // Update existing subscription
          console.log('📝 Updating existing subscription:', existingSubscription.id);
          const { data: updatedSub, error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              billing_period: order.billing_period,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_provider: 'takbull',
              payment_id: params.ordernumber || params.transactionInternalNumber,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id)
            .select()
            .single();
          
          subscription = updatedSub;
          subError = updateError;
        } else {
          // Create new subscription
          console.log('➕ Creating new subscription');
          const { data: newSub, error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: order.user_id,
              plan_id: order.plan_id,
              status: 'active',
              billing_period: order.billing_period,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_provider: 'takbull',
              payment_id: params.ordernumber || params.transactionInternalNumber,
            })
            .select()
            .single();
          
          subscription = newSub;
          subError = insertError;
        }

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
        }

        // Get tier from plan (more reliable than from order)
        const tierToUse = plan.tier || order.subscription_tier;
        
        // Determine tracks based on tier
        // For paid tiers (pro, coach, coach-pro), set all 4 tracks
        // For creator, preserve existing tracks or keep existing track
        // For free, they need to select a track
        let selectedTracks: string[] = [];
        let selectedPrimaryTrack: string | null = null;
        
        // Get existing tracks from old profile
        const existingTracks = oldProfile?.selected_tracks || [];
        const existingPrimaryTrack = oldProfile?.selected_primary_track || null;
        
        if (tierToUse === 'pro' || tierToUse === 'coach' || tierToUse === 'coach-pro') {
          // All 4 tracks for pro/coach tiers - open all tracks
          selectedTracks = ['actors', 'musicians', 'creators', 'influencers'];
          selectedPrimaryTrack = existingPrimaryTrack || 'actors'; // Keep existing primary track or default to actors
        } else if (tierToUse === 'creator') {
          // Creator tier - preserve existing tracks, or keep existing primary track
          if (existingTracks.length > 0) {
            selectedTracks = existingTracks;
            selectedPrimaryTrack = existingPrimaryTrack || existingTracks[0];
          } else if (existingPrimaryTrack) {
            // If no selected_tracks array but has primary track, preserve it
            selectedTracks = [existingPrimaryTrack];
            selectedPrimaryTrack = existingPrimaryTrack;
          }
          // If no tracks exist, user will select in UpgradeBenefitsModal
        }
        // For 'free' tier, don't set tracks - user must select
        
        // Build update object - ALWAYS update subscription fields
        const profileUpdate: any = {
          subscription_tier: tierToUse,
          subscription_period: order.billing_period,
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        };
        
        // Update tracks if we have them (for pro/coach) or preserve them (for creator)
        if (selectedTracks.length > 0) {
          profileUpdate.selected_tracks = selectedTracks;
        }
        if (selectedPrimaryTrack) {
          profileUpdate.selected_primary_track = selectedPrimaryTrack;
        }
        
        // Update user profile with tier from plan
        const { error: profileUpdateError, data: updatedProfile } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', order.user_id)
          .select()
          .single();

        if (profileUpdateError) {
          console.error('❌ Error updating profile:', profileUpdateError);
          console.error('❌ Profile update data:', JSON.stringify(profileUpdate, null, 2));
        } else {
          console.log('✅ Profile updated successfully:', {
            userId: order.user_id,
            oldTier: oldTier,
            newTier: tierToUse,
            subscriptionStatus: 'active',
            planId: plan.id,
            planTier: plan.tier,
            selectedTracks: updatedProfile?.selected_tracks || 'none',
            selectedPrimaryTrack: updatedProfile?.selected_primary_track || 'none',
          });
        }
      } catch (error: any) {
        console.error('Error processing subscription:', error);
        // Don't fail the callback, subscription can be processed later
      }
    }

    // Get tier from plan for response (more reliable)
    let finalTier = order.subscription_tier;
    if (isSuccess) {
      try {
        const { data: planData } = await supabase
          .from('plans')
          .select('tier')
          .eq('id', order.plan_id)
          .single();
        if (planData?.tier) {
          finalTier = planData.tier;
        }
      } catch (e) {
        console.warn('Could not fetch plan tier for response, using order tier');
      }
    }

    // Return JSON response (the frontend page will handle the redirect)
    return res.status(200).json({
      ok: true,
      success: isSuccess,
      orderId: order.id,
      orderReference: orderReference,
      oldTier: oldTier,
      newTier: finalTier,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed',
    });

  } catch (error: any) {
    console.error('Error in callback:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}

