-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    false,
    41943040, -- 40MB
    ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR VIDEOS BUCKET
-- ============================================

-- Users can upload their own videos
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Coaches can view videos of their trainees
CREATE POLICY "Coaches can view trainee videos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM public.trainees
        WHERE trainees.coach_id = auth.uid()
        AND (storage.foldername(name))[1] = trainees.id::text
    )
);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- STORAGE POLICIES FOR THUMBNAILS BUCKET
-- ============================================

-- Everyone can view thumbnails (public bucket)
CREATE POLICY "Thumbnails are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Users can upload their own thumbnails
CREATE POLICY "Users can upload own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own thumbnails
CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

