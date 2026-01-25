-- Migration: Sync usage counts with actual analyses in database
-- This ensures all users have accurate usage counts based on their actual analyses
-- Date: 2025-01-22
-- Note: This migration doesn't modify the usage table structure
-- It just ensures that getUsageForCurrentPeriod() will return correct counts
-- by counting directly from the analyses table (which is what the function does)

-- The usage is calculated on-the-fly from the analyses table
-- This migration is informational - the actual sync happens in the application
-- by calling getUsageForCurrentPeriod() which counts from analyses table

-- However, we can create a helper function to verify counts are correct
CREATE OR REPLACE FUNCTION verify_user_usage_count(user_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  current_month_analyses_count BIGINT,
  calculated_from_analyses BOOLEAN
) AS $$
DECLARE
  current_month_start TIMESTAMP WITH TIME ZONE;
  current_month_end TIMESTAMP WITH TIME ZONE;
  analyses_count BIGINT;
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
  
  RETURN QUERY SELECT 
    user_uuid,
    analyses_count,
    true as calculated_from_analyses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_user_usage_count(UUID) TO authenticated;

-- Note: The application's getUsageForCurrentPeriod() function already counts
-- directly from the analyses table, so no data migration is needed.
-- This migration just adds a verification function for debugging.
