-- Create audit_logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_username TEXT,
  gamemode TEXT,
  old_rank TEXT,
  new_rank TEXT,
  old_points INTEGER,
  new_points INTEGER,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_username ON audit_logs(target_username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Set up Row Level Security (optional but recommended)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT
  USING (true);

-- Only service role can insert (via API)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Prevent deletion of audit logs (logs are immutable)
CREATE POLICY "Prevent audit log deletion" ON audit_logs
  FOR DELETE
  USING (false);
