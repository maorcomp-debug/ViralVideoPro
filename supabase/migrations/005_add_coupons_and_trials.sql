-- ============================================
-- COUPONS AND TRIALS SYSTEM
-- ============================================

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_analyses', 'trial_subscription')),
    discount_value NUMERIC, -- Percentage (0-100) or fixed amount in ILS, or number of free analyses
    trial_tier TEXT CHECK (trial_tier IN ('creator', 'pro', 'coach')),
    trial_duration_days INTEGER, -- For trial subscriptions
    max_uses INTEGER, -- NULL = unlimited
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Only admins can view all coupons
CREATE POLICY "Admins can view all coupons"
    ON public.coupons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Anyone can view active coupons (for validation during signup)
CREATE POLICY "Anyone can view active coupons for validation"
    ON public.coupons FOR SELECT
    USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Only admins can create/update/delete coupons
CREATE POLICY "Admins can create coupons"
    ON public.coupons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Admins can update coupons"
    ON public.coupons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete coupons"
    ON public.coupons FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create coupon_redemptions table to track usage
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discount_applied NUMERIC,
    applied_discount_type TEXT NOT NULL,
    trial_tier TEXT,
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    UNIQUE(coupon_id, user_id) -- Prevent duplicate redemptions by same user
);

-- Enable RLS on coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
    ON public.coupon_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert redemptions (via admin/signup process)
CREATE POLICY "System can insert redemptions"
    ON public.coupon_redemptions FOR INSERT
    WITH CHECK (true);

-- Only admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
    ON public.coupon_redemptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create user_trials table for tracking temporary trial subscriptions
CREATE TABLE IF NOT EXISTS public.user_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('creator', 'pro', 'coach')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id), -- Admin who granted the trial
    source TEXT CHECK (source IN ('coupon', 'admin_grant', 'announcement')), -- How trial was granted
    source_id UUID, -- Reference to coupon_id, announcement_id, or null
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_trials
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Users can view their own trials
CREATE POLICY "Users can view own trials"
    ON public.user_trials FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all trials
CREATE POLICY "Admins can view all trials"
    ON public.user_trials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert trials (via admin/signup process)
CREATE POLICY "System can insert trials"
    ON public.user_trials FOR INSERT
    WITH CHECK (true);

-- Admins can update/delete trials
CREATE POLICY "Admins can update trials"
    ON public.user_trials FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete trials"
    ON public.user_trials FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_active ON public.user_trials(is_active, end_date);

-- Add trigger to update coupon used_count when redemption is created
CREATE OR REPLACE FUNCTION update_coupon_used_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupon_redemption_insert
AFTER INSERT ON public.coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION update_coupon_used_count();

