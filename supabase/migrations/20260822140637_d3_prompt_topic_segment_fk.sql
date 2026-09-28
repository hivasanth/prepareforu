-- D3 — prompt/topic segment integrity (HIGH security remediation)
--
-- Defect: prompt_templates.topic_id was enforced only by a single-column FK
-- to exam_topics.id, proving "topic exists" but NOT "topic belongs to the
-- same exam/paper/subject as the prompt". A manipulated request could pair
-- a valid topic_id from any other segment with an arbitrary exam/paper/subject.
--
-- Fix: composite FK
--   prompt_templates (exam_id, paper_id, subject_name, topic_id)
--     → exam_topics (exam_id, paper_id, subject_name, id)
-- which proves "this exact topic belongs to this exact segment".
-- Postgres requires a UNIQUE key on the referenced columns; id being the PK
-- already guarantees global uniqueness, so the new unique key cannot reject
-- any legitimate topic row — it exists solely to anchor the FK.
--
-- Types verified LIVE: text↔text, uuid↔uuid. All 171 prompt rows scanned:
-- 0 NULL topic_id, 0 orphans, 0 cross-segment mismatches, 0 identity dups.

begin;

-- Pre-guard: refuse migration if any live row would violate the new invariant.
do $$
declare invalid integer;
begin
  select count(*) into invalid
  from public.prompt_templates p
  left join public.exam_topics t
    on t.id = p.topic_id
   and t.exam_id = p.exam_id
   and t.paper_id is not distinct from p.paper_id
   and t.subject_name = p.subject_name
  where t.id is null;
  if invalid > 0 then
    raise exception 'D3 pre-check failed: % prompt rows reference a topic outside their exam/paper/subject', invalid;
  end if;
end $$;

-- Referenced key required by the composite FK.
alter table public.exam_topics
  add constraint exam_topics_exam_id_paper_id_subject_name_id_key
  unique (exam_id, paper_id, subject_name, id);

-- Replace the existence-only FK with the segment-aware composite FK.
alter table public.prompt_templates
  drop constraint fk_prompt_templates_topic;

alter table public.prompt_templates
  add constraint fk_prompt_templates_topic_segment
  foreign key (exam_id, paper_id, subject_name, topic_id)
  references public.exam_topics (exam_id, paper_id, subject_name, id)
  on delete restrict;

commit;
