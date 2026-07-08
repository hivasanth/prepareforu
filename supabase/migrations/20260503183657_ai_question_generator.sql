-- Create ai_usage_limits table
CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  requests_used INT DEFAULT 0,
  questions_generated INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, date)
);

-- Create ai_generation_logs table
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  requested_count INT DEFAULT 0,
  generated_count INT DEFAULT 0,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_usage_limits
-- Admin can view/manage all
CREATE POLICY "rls_ai_usage_admin_all"
ON public.ai_usage_limits
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their own limits
CREATE POLICY "rls_ai_usage_self_select"
ON public.ai_usage_limits
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policies for ai_generation_logs
-- Admin can view/manage all
CREATE POLICY "rls_ai_logs_admin_all"
ON public.ai_generation_logs
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their own logs
CREATE POLICY "rls_ai_logs_self_select"
ON public.ai_generation_logs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
