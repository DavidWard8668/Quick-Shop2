-- Create issue_reports table
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  issue_type TEXT CHECK (issue_type IN ('bug', 'feature', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  page_info JSONB,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own issues
CREATE POLICY "Users can create issue reports" ON public.issue_reports
  FOR INSERT
  WITH CHECK (true);

-- Create policy for users to view their own issues
CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create index for faster queries
CREATE INDEX idx_issue_reports_user_id ON public.issue_reports(user_id);
CREATE INDEX idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX idx_issue_reports_created_at ON public.issue_reports(created_at DESC);