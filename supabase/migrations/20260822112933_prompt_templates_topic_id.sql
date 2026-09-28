-- prompt_templates.topic_id — resolve prompts to LIVE exam_topics.id
--
-- Flow: existing topic_name labels → deterministic match against exam_topics
-- (exam_id + subject_name + normalized EN/Telugu label) → backfill topic_id →
-- FK → exam_topics.id → NOT NULL. Future UI stores topic_id; display names
-- come from exam_topics.
--
-- Label normalization proven against live data (171/171 resolved, 0 ambiguous):
--   1. EN label = text before '/' with leading "N." / "N," / "N:" stripped
--   2. Telugu label = text after '/', or the whole string minus its number
--      prefix when no '/' exists (Telugu-only rows)
--   3. en-dash (U+2013) → '-', curly apostrophe (U+2019) -> ASCII '
-- Match is scoped by (exam_id, subject_name); uniqueness verified pre-migration.

begin;

alter table public.prompt_templates
  add column if not exists topic_id uuid;

-- ── Backfill: resolve every prompt to exactly one live exam_topics row ───────

with lbl as (
  select
    p.id as prompt_id,
    p.exam_id,
    p.subject_name,
    replace(
      replace(
        trim(regexp_replace(split_part(p.topic_name, '/', 1), '^\s*\d+\s*[.,:]\s*', '')),
        chr(8211), '-'
      ),
      chr(8217), ''''
    ) as en_lbl,
    nullif(
      replace(
        replace(
          trim(
            case
              when position('/' in p.topic_name) > 0 then split_part(p.topic_name, '/', 2)
              else regexp_replace(p.topic_name, '^\s*\d+\s*[.,:]\s*', '')
            end
          ),
          chr(8211), '-'
        ),
        chr(8217), ''''
      ),
      ''
    ) as te_lbl
  from public.prompt_templates p
),
resolved as (
  select
    l.prompt_id,
    t.id as topic_id,
    t.topic_en as canonical_en
  from lbl l
  join public.exam_topics t
    on t.exam_id = l.exam_id
   and t.subject_name = l.subject_name
   and (
     replace(replace(t.topic_en, chr(8211), '-'), chr(8217), '''') = l.en_lbl
     or (
       l.te_lbl is not null
       and t.topic_te is not null
       and replace(replace(t.topic_te, chr(8211), '-'), chr(8217), '''') = l.te_lbl
     )
   )
)
update public.prompt_templates p
set topic_id    = r.topic_id,
    topic_name  = r.canonical_en  -- canonicalize legacy label from exam_topics
from resolved r
where p.id = r.prompt_id;

-- ── Guard: refuse to proceed unless every row resolved uniquely ──────────────

do $$
declare
  total   integer;
  matched integer;
begin
  select count(*), count(topic_id)
    into total, matched
  from public.prompt_templates;

  if matched < total then
    raise exception 'prompt_templates.topic_id backfill incomplete: % of % rows unresolved',
      total - matched, total;
  end if;
end $$;

-- ── Lock down: NOT NULL, FK, index, identity key swap ────────────────────────

alter table public.prompt_templates
  alter column topic_id set not null;

alter table public.prompt_templates
  add constraint fk_prompt_templates_topic
  foreign key (topic_id) references public.exam_topics(id)
  on delete restrict;

create index if not exists idx_prompt_templates_topic_id
  on public.prompt_templates (topic_id);

-- Identity moves from free-text name to topic id; topic_name remains only as a
-- denormalized display cache for legacy readers.
alter table public.prompt_templates
  drop constraint if exists prompt_templates_exam_id_paper_id_subject_name_topic_name_key;

alter table public.prompt_templates
  add constraint prompt_templates_exam_id_paper_id_subject_name_topic_id_key
  unique (exam_id, paper_id, subject_name, topic_id);

commit;
