-- Add gender-specific tracking to outreach logs

ALTER TABLE outreach_logs 
ADD COLUMN IF NOT EXISTS males_reached INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS females_reached INTEGER DEFAULT 0;