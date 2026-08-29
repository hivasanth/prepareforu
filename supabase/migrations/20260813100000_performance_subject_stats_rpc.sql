-- FIX-5: Server-side subject-accuracy aggregation for the performance page.
-- Replaces client-side fetching of every attempt_answers row (capped at 5000)
-- with a small, filtered, DB-side GROUP BY result. RLS is not weakened:
-- the function filters by auth.uid() itself and runs with SECURITY DEFINER
-- under an empty search_path, so row-level policies on attempts /
-- attempt_answers / questions remain enforced for the direct reads.

create or replace function public.get_user_performance_answer_stats(
  p_exam_id text default null,
  p_paper_id uuid default null,
  p_from timestamptz default null
)
returns table (
  subject_name text,
  correct bigint,
  total bigint,
  accuracy numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.subject_name as subject_name,
    count(*) filter (where aa.is_correct) as correct,
    count(*) as total,
    round(
      (count(*) filter (where aa.is_correct)::numeric / nullif(count(*), 0)::numeric) * 100,
      2
    ) as accuracy
  from public.attempt_answers aa
  join public.attempts a on a.id = aa.attempt_id
  join public.questions q on q.id = aa.question_id
  where a.user_id = auth.uid()
    and a.status = 'completed'
    and a.source = 'exam_tab'
    and (p_exam_id is null or a.exam_id = p_exam_id)
    and (p_paper_id is null or a.paper_id = p_paper_id)
    and (p_from is null or a.submitted_at >= p_from)
    and q.subject_name is not null
  group by q.subject_name
  order by accuracy desc, total desc;
$$;

revoke execute on function public.get_user_performance_answer_stats(text, uuid, timestamptz) from public, anon;
grant execute on function public.get_user_performance_answer_stats(text, uuid, timestamptz) to authenticated;
