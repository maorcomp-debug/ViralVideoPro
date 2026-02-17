-- Add preferred_language to profiles for i18n (UI + emails)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'he';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_language_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_preferred_language_check 
      CHECK (preferred_language IN ('he', 'en'));
  END IF;
END $$;
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred UI/email language: he or en';
