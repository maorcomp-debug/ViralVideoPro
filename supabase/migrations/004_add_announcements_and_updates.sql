-- Add receive_updates field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS receive_updates BOOLEAN DEFAULT true;

-- Create announcements table for admin to send updates
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    target_tier TEXT[], -- Array of subscription tiers to target (null = all users)
    target_all BOOLEAN DEFAULT true -- If true, send to all users who want updates
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Only admins can view all announcements
CREATE POLICY "Admins can view all announcements"
    ON public.announcements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND created_by = auth.uid()
    );

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements"
    ON public.announcements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
    ON public.announcements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_sent_at ON public.announcements(sent_at DESC);

-- Create user_announcements table to track which users received which announcements
CREATE TABLE IF NOT EXISTS public.user_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- Enable RLS on user_announcements
ALTER TABLE public.user_announcements ENABLE ROW LEVEL SECURITY;

-- Users can view their own announcements
CREATE POLICY "Users can view own announcements"
    ON public.user_announcements FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert user_announcements (via admin function/edge function)
CREATE POLICY "System can insert user announcements"
    ON public.user_announcements FOR INSERT
    WITH CHECK (true);

-- Users can update their own announcements (mark as read)
CREATE POLICY "Users can update own announcements"
    ON public.user_announcements FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_announcements_user_id ON public.user_announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_announcements_announcement_id ON public.user_announcements(announcement_id);
CREATE INDEX IF NOT EXISTS idx_user_announcements_read_at ON public.user_announcements(read_at);

