-- Migration: Add takbull_orders table for payment processing
-- This table stores orders and payment transactions from Takbull payment gateway

-- ============================================
-- TAKBULL ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.takbull_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach', 'coach-pro')),
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
    plan_id UUID REFERENCES public.plans(id),
    
    -- Takbull order details
    order_reference TEXT UNIQUE, -- Order reference number from Takbull
    transaction_internal_number TEXT, -- Transaction internal number
    uniq_id UUID, -- Unique ID from Takbull
    takbull_order_number TEXT, -- Order number from Takbull
    
    -- Payment details
    status_code INTEGER, -- 0 = success, otherwise failure
    token TEXT, -- Payment token for recurring payments
    last_4_digits TEXT, -- Last 4 digits of card
    number_payments INTEGER DEFAULT 1, -- Number of payments (1 for one-time, >1 for installments)
    token_expiration_month TEXT,
    token_expiration_year TEXT,
    
    -- Order status
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Subscription details
    subscription_id UUID REFERENCES public.subscriptions(id),
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    next_payment_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Additional data
    takbull_response JSONB, -- Full response from Takbull
    error_message TEXT
);

-- Enable RLS on takbull_orders
ALTER TABLE public.takbull_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON public.takbull_orders FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
    ON public.takbull_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- System can update orders (for callbacks and IPN)
CREATE POLICY "System can update orders"
    ON public.takbull_orders FOR UPDATE
    USING (true); -- Allow updates from server-side callbacks

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON public.takbull_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_takbull_orders_updated_at 
    BEFORE UPDATE ON public.takbull_orders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_takbull_orders_user_id ON public.takbull_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_takbull_orders_order_reference ON public.takbull_orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_takbull_orders_uniq_id ON public.takbull_orders(uniq_id);
CREATE INDEX IF NOT EXISTS idx_takbull_orders_status ON public.takbull_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_takbull_orders_created_at ON public.takbull_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_takbull_orders_next_payment_date ON public.takbull_orders(next_payment_date) WHERE next_payment_date IS NOT NULL;

