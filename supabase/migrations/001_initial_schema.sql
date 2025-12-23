-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier TEXT NOT NULL UNIQUE CHECK (tier IN ('free', 'creator', 'pro', 'coach')),
    name TEXT NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_analyses_per_period INTEGER NOT NULL,
    max_video_seconds INTEGER NOT NULL,
    max_file_bytes BIGINT NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans
CREATE POLICY "Plans are viewable by everyone"
    ON public.plans FOR SELECT
    USING (is_active = true);

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'pro', 'coach')),
    subscription_period TEXT CHECK (subscription_period IN ('monthly', 'yearly')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'cancelled'))
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    payment_provider TEXT,
    payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    duration_seconds INTEGER,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
    ON public.videos FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own videos
CREATE POLICY "Users can insert own videos"
    ON public.videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
    ON public.videos FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRAINEES TABLE (for Coach Edition)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trainees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on trainees
ALTER TABLE public.trainees ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own trainees
CREATE POLICY "Coaches can view own trainees"
    ON public.trainees FOR SELECT
    USING (auth.uid() = coach_id);

-- Coaches can insert their own trainees
CREATE POLICY "Coaches can insert own trainees"
    ON public.trainees FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own trainees
CREATE POLICY "Coaches can update own trainees"
    ON public.trainees FOR UPDATE
    USING (auth.uid() = coach_id);

-- Coaches can delete their own trainees
CREATE POLICY "Coaches can delete own trainees"
    ON public.trainees FOR DELETE
    USING (auth.uid() = coach_id);

-- ============================================
-- ANALYSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    trainee_id UUID REFERENCES public.trainees(id) ON DELETE SET NULL,
    track TEXT NOT NULL CHECK (track IN ('actors', 'musicians', 'creators', 'coach', 'influencers')),
    coach_training_track TEXT CHECK (coach_training_track IN ('actors', 'musicians', 'creators', 'influencers')),
    analysis_depth TEXT CHECK (analysis_depth IN ('standard', 'deep')),
    expert_panel TEXT[] NOT NULL,
    prompt TEXT,
    result JSONB NOT NULL,
    average_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

-- Coaches can view analyses of their trainees
CREATE POLICY "Coaches can view trainee analyses"
    ON public.analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trainees
            WHERE trainees.id = analyses.trainee_id
            AND trainees.coach_id = auth.uid()
        )
    );

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    analyses_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on usage
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
    ON public.usage FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert usage (via service role)
CREATE POLICY "System can insert usage"
    ON public.usage FOR INSERT
    WITH CHECK (true);

-- System can update usage (via service role)
CREATE POLICY "System can update usage"
    ON public.usage FOR UPDATE
    USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_trainee_id ON public.analyses(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainees_coach_id ON public.trainees(coach_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_period ON public.usage(period_start, period_end);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for trainees
CREATE TRIGGER update_trainees_updated_at BEFORE UPDATE ON public.trainees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, subscription_tier, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INITIAL PLANS DATA
-- ============================================
INSERT INTO public.plans (tier, name, description, monthly_price, yearly_price, max_analyses_per_period, max_video_seconds, max_file_bytes, features, is_active) VALUES
('free', 'ניסיון', 'טעימה חינמית להכרת הפלטפורמה', 0, 0, 2, 60, 10485760, '{"saveHistory": false, "improvementTracking": false, "comparison": false, "advancedAnalysis": false, "traineeManagement": false, "pdfExport": false, "coachDashboard": false, "customExperts": false}', true),
('creator', 'יוצרים', 'מתאים ליוצרי תוכן מתחילים', 49, 490, 10, 180, 15728640, '{"saveHistory": true, "improvementTracking": true, "comparison": false, "advancedAnalysis": false, "traineeManagement": false, "pdfExport": true, "coachDashboard": false, "customExperts": false}', true),
('pro', 'יוצרים באקסטרים', 'למקצוענים שמחפשים את המקסימום', 99, 990, 30, 300, 41943040, '{"saveHistory": true, "improvementTracking": true, "comparison": true, "advancedAnalysis": true, "traineeManagement": false, "pdfExport": true, "coachDashboard": false, "customExperts": true}', true),
('coach', 'מאמנים, סוכנויות ובתי ספר למשחק', 'פלטפורמה מקצועית למאמנים וסטודיואים', 199, 1990, -1, 300, 41943040, '{"saveHistory": true, "improvementTracking": true, "comparison": true, "advancedAnalysis": true, "traineeManagement": true, "pdfExport": true, "coachDashboard": true, "customExperts": true}', true)
ON CONFLICT (tier) DO NOTHING;

