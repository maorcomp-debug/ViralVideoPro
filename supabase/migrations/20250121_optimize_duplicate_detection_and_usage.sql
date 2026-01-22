-- ============================================
-- OPTIMIZE DUPLICATE VIDEO DETECTION & USAGE COUNTING
-- ============================================
-- This migration adds indexes to improve performance for:
-- 1. Duplicate video detection (by file_size)
-- 2. Usage counting (by user_id + created_at)
-- 3. Faster queries for finding previous analyses

-- Index for duplicate video detection: user_id + file_size
-- This allows fast lookup of videos with same file_size for a user
CREATE INDEX IF NOT EXISTS idx_videos_user_file_size 
ON public.videos (user_id, file_size);

-- Index for finding videos by file_size only (fallback search)
CREATE INDEX IF NOT EXISTS idx_videos_file_size 
ON public.videos (file_size);

-- Index for usage counting: user_id + created_at
-- This allows fast counting of analyses in a date range
CREATE INDEX IF NOT EXISTS idx_analyses_user_created 
ON public.analyses (user_id, created_at DESC);

-- Index for finding analyses by video_id (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_analyses_video_id 
ON public.analyses (video_id) 
WHERE video_id IS NOT NULL;

-- Index for finding analyses by user_id + video_id (optimized query)
CREATE INDEX IF NOT EXISTS idx_analyses_user_video 
ON public.analyses (user_id, video_id) 
WHERE video_id IS NOT NULL;

-- Index for announcements: sent_at (to filter only sent announcements)
CREATE INDEX IF NOT EXISTS idx_announcements_sent_at 
ON public.announcements (sent_at) 
WHERE sent_at IS NOT NULL;

-- Index for user_announcements: user_id + created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_user_announcements_user_created 
ON public.user_announcements (user_id, created_at DESC);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON INDEX idx_videos_user_file_size IS 'Optimizes duplicate video detection by file_size for each user';
COMMENT ON INDEX idx_videos_file_size IS 'Fallback index for finding videos by file_size across all users';
COMMENT ON INDEX idx_analyses_user_created IS 'Optimizes usage counting queries by user and date range';
COMMENT ON INDEX idx_analyses_video_id IS 'Optimizes finding analyses by video_id for duplicate detection';
COMMENT ON INDEX idx_analyses_user_video IS 'Optimizes finding user analyses for specific videos';
COMMENT ON INDEX idx_announcements_sent_at IS 'Optimizes filtering sent announcements';
COMMENT ON INDEX idx_user_announcements_user_created IS 'Optimizes loading user announcements in chronological order';
