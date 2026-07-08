-- Drop the RPC function
DROP FUNCTION IF EXISTS public.increment_ai_usage;

-- Drop the tables
DROP TABLE IF EXISTS public.ai_generation_logs;
DROP TABLE IF EXISTS public.ai_usage_limits;
