-- Migration: Sync usage counts with actual analyses in database
-- This ensures all users have accurate usage counts based on their actual analyses
-- Date: 2025-01-22

-- Function to recalculate usage for a specific user
CREATE OR REPLACE FUNCTION sync_user_usage(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  current_month_start TIMESTAMP WITH TIME ZONE;
  current_month_end TIMESTAMP WITH TIME ZONE;
  analyses_count INTEGER;
  minutes_used INTEGER;
BEGIN
  -- Calculate current month boundaries
  current_month_start := date_trunc('month', CURRENT_DATE);
  current_month_end := date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 second';
  
  -- Count analyses for current month
  SELECT COUNT(*) INTO analyses_count
  FROM analyses
  WHERE user_id = user_uuid
    AND created_at >= current_month_start
    AND created_at <= current_month_end;
  
  -- Calculate minutes used (sum of video durations)
  SELECT COALESCE(SUM(CEIL(v.duration_seconds / 60.0)), 0) INTO minutes_used
  FROM analyses a
  JOIN videos v ON a.video_id = v.id
  WHERE a.user_id = user_uuid
    AND a.created_at >= current_month_start
    AND a.created_at <= current_month_end
    AND v.duration_seconds IS NOT NULL;
  
  -- Update or insert usage record
  INSERT INTO usage (user_id, period_start, period_end, analyses_count)
  VALUES (user_uuid, current_month_start, current_month_end, analyses_count)
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    analyses_count = EXCLUDED.analyses_count,
    updated_at = NOW();
    
  RAISE NOTICE 'Synced usage for user %: % analyses, % minutes', user_uuid, analyses_count, minutes_used;
END;
$$ LANGUAGE plpgsql;

-- Sync usage for all users who have analyses
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM analyses
    WHERE created_at >= date_trunc('month', CURRENT_DATE)
  LOOP
    PERFORM sync_user_usage(user_record.user_id);
  END LOOP;
  
  RAISE NOTICE 'Usage sync completed for all users with analyses this month';
END;
$$;

-- Clean up: Drop the function after migration (optional - can keep for future use)
-- DROP FUNCTION IF EXISTS sync_user_usage(UUID);
