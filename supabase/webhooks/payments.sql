-- ============================================
-- PAYMENT WEBHOOK HANDLER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_payment_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    plan_tier TEXT;
    billing_period TEXT;
    subscription_start TIMESTAMPTZ;
    subscription_end TIMESTAMPTZ;
    plan_record RECORD;
BEGIN
    -- Extract data from webhook payload (adjust based on your payment provider)
    -- This is a template for Stripe webhook structure
    
    -- Assuming webhook table structure:
    -- webhook_data JSONB contains the payment provider payload
    
    -- Get user email from webhook data
    user_email := NEW.payload->>'customer_email';
    plan_tier := NEW.payload->>'plan_tier'; -- 'creator', 'pro', 'coach'
    billing_period := NEW.payload->>'billing_period'; -- 'monthly' or 'yearly'
    
    -- Find the plan
    SELECT * INTO plan_record
    FROM public.plans
    WHERE tier = plan_tier AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found: %', plan_tier;
    END IF;
    
    -- Calculate subscription dates
    subscription_start := NOW();
    IF billing_period = 'monthly' THEN
        subscription_end := subscription_start + INTERVAL '1 month';
    ELSE
        subscription_end := subscription_start + INTERVAL '1 year';
    END IF;
    
    -- Find user by email
    WITH user_data AS (
        SELECT id FROM auth.users WHERE email = user_email LIMIT 1
    )
    INSERT INTO public.subscriptions (
        user_id,
        plan_id,
        status,
        billing_period,
        start_date,
        end_date,
        payment_provider,
        payment_id
    )
    SELECT
        user_data.id,
        plan_record.id,
        'active',
        billing_period::TEXT,
        subscription_start,
        subscription_end,
        NEW.payload->>'payment_provider',
        NEW.payload->>'payment_id'
    FROM user_data
    ON CONFLICT (user_id, plan_id) DO UPDATE
    SET
        status = 'active',
        billing_period = EXCLUDED.billing_period,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        payment_provider = EXCLUDED.payment_provider,
        payment_id = EXCLUDED.payment_id,
        updated_at = NOW();
    
    -- Update user profile subscription info
    UPDATE public.profiles
    SET
        subscription_tier = plan_tier,
        subscription_period = billing_period,
        subscription_start_date = subscription_start,
        subscription_end_date = subscription_end,
        subscription_status = 'active',
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WEBHOOKS TABLE (if using database webhooks)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- 'stripe', 'paypal', etc.
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Only service role can insert webhooks (via API)
CREATE POLICY "Service role can manage webhooks"
    ON public.payment_webhooks
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTION TO PROCESS WEBHOOK
-- ============================================

CREATE OR REPLACE FUNCTION public.process_payment_webhook(webhook_id UUID)
RETURNS void AS $$
DECLARE
    webhook_record RECORD;
BEGIN
    -- Get webhook
    SELECT * INTO webhook_record
    FROM public.payment_webhooks
    WHERE id = webhook_id AND processed = false
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Webhook not found or already processed';
    END IF;
    
    -- Process webhook based on event type
    IF webhook_record.event_type = 'payment.succeeded' OR webhook_record.event_type = 'checkout.session.completed' THEN
        PERFORM public.handle_payment_webhook();
    END IF;
    
    -- Mark as processed
    UPDATE public.payment_webhooks
    SET processed = true
    WHERE id = webhook_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error
    UPDATE public.payment_webhooks
    SET 
        processed = true,
        error_message = SQLERRM
    WHERE id = webhook_id;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

