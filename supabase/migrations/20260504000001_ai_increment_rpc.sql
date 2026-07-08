CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_scope TEXT, p_date DATE, p_limit INT, p_questions INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INT;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT requests_used INTO v_used 
  FROM public.ai_usage_limits 
  WHERE user_id = p_user_id AND scope = p_scope AND date = p_date 
  FOR UPDATE;

  IF NOT FOUND THEN
    -- If no record exists, insert a new one assuming limit > 0
    IF p_limit > 0 THEN
      INSERT INTO public.ai_usage_limits (user_id, scope, date, requests_used, questions_generated)
      VALUES (p_user_id, p_scope, p_date, 1, p_questions);
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  -- Check if limit is reached
  IF v_used >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment usage atomically
  UPDATE public.ai_usage_limits
  SET requests_used = requests_used + 1,
      questions_generated = questions_generated + p_questions
  WHERE user_id = p_user_id AND scope = p_scope AND date = p_date;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
