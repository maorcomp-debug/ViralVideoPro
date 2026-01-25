-- Migration: Enable RLS on profiles table and ensure update policies work correctly
-- Date: 2025-01-22
-- This ensures that profile updates work correctly while maintaining security

-- Enable RLS on profiles table (was disabled for testing)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create SELECT policy - admins can see all, users can see own
CREATE POLICY "Admins can view all profiles"
    ON public.profiles 
    FOR SELECT
    USING (
        -- Allow if user is admin (check via email for primary admin)
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'viralypro@gmail.com'
        )
        OR
        -- Allow if user has admin role in profile
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
        )
        OR
        -- Allow users to see their own profile
        user_id = auth.uid()
    );

-- Create UPDATE policy - admins can update all, users can update own
CREATE POLICY "Admins can update all profiles"
    ON public.profiles 
    FOR UPDATE
    USING (
        -- Allow if user is admin (check via email for primary admin)
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'viralypro@gmail.com'
        )
        OR
        -- Allow if user has admin role in profile
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
        )
        OR
        -- Allow users to update their own profile
        user_id = auth.uid()
    )
    WITH CHECK (
        -- Same conditions for WITH CHECK
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'viralypro@gmail.com'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
        )
        OR
        user_id = auth.uid()
    );

-- Create INSERT policy - authenticated users can create profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles 
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;

-- Note: RLS is now enabled, but policies allow users to update their own profiles
-- This should not block updates from the application
