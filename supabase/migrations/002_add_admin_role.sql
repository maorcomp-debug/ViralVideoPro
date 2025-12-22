-- ============================================
-- ADD ADMIN ROLE TO PROFILES
-- ============================================

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admin can delete profiles (optional - be careful with this)
CREATE POLICY "Admins can delete all profiles"
    ON public.profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN ACCESS TO SUBSCRIPTIONS
-- ============================================

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admin can update all subscriptions
CREATE POLICY "Admins can update all subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN ACCESS TO VIDEOS
-- ============================================

-- Admin can view all videos
CREATE POLICY "Admins can view all videos"
    ON public.videos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN ACCESS TO ANALYSES
-- ============================================

-- Admin can view all analyses
CREATE POLICY "Admins can view all analyses"
    ON public.analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN ACCESS TO TRAINEES
-- ============================================

-- Admin can view all trainees
CREATE POLICY "Admins can view all trainees"
    ON public.trainees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN ACCESS TO USAGE
-- ============================================

-- Admin can view all usage records
CREATE POLICY "Admins can view all usage"
    ON public.usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

