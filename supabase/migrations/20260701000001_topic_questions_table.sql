-- ============================================================
-- Migration: Create exam_topics table and seed topic data
--
-- This table is the canonical registry for question topics,
-- linked to exam → paper → subject. It enables fast topic
-- lookups in the Topic Exams user tab without scanning the
-- full questions table.
--
-- Topics are also auto-registered during bulk question upload
-- via adminQuestionService.bulkInsertQuestions().
-- ============================================================

-- ─── 1. Create Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_topics (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id       text NOT NULL,
  paper_id      uuid REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  subject_name  text NOT NULL,
  topic_en      text NOT NULL,
  topic_te      text,
  display_order int  NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (exam_id, paper_id, subject_name, topic_en)
);

-- ─── 2. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exam_topics_exam_paper_subject
  ON public.exam_topics (exam_id, paper_id, subject_name);

CREATE INDEX IF NOT EXISTS idx_exam_topics_exam_id
  ON public.exam_topics (exam_id);

-- ─── 3. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.exam_topics ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all topics
CREATE POLICY "exam_topics_read_authenticated"
  ON public.exam_topics FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert/update/delete (done via admin service)
-- (No additional policy needed — service_role bypasses RLS)

-- ─── 4. Seed Data ────────────────────────────────────────────────────────────
-- Strategy: Look up paper_id dynamically from exam_papers by exam_id + paper_name
-- This avoids hard-coding UUIDs that may differ across environments.

DO $$
DECLARE
  -- BANK_EXAMS
  v_bank_prelims_id uuid;

  -- APPSC_GROUP_1
  v_g1_gen_studies_id  uuid;
  v_g1_gen_aptitude_id uuid;

  -- APPSC_GROUP_2
  v_g2_gs_mental_id   uuid;
  v_g2_social_hist_id uuid;
  v_g2_economy_sci_id uuid;

  -- APPSC_GROUP_3
  v_g3_gen_studies_id uuid;
  v_g3_contemp_id     uuid;

  -- APPSC_GROUP_4
  v_g4_paper1_id uuid;
  v_g4_paper2_id uuid;

BEGIN

  -- ── Look up paper IDs ──────────────────────────────────────────────────────

  SELECT id INTO v_bank_prelims_id
    FROM public.exam_papers
    WHERE exam_id = 'BANK_EXAMS' AND paper_name = 'Prelims Paper'
    LIMIT 1;

  SELECT id INTO v_g1_gen_studies_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_1' AND paper_name ILIKE '%General Studies%'
    LIMIT 1;

  SELECT id INTO v_g1_gen_aptitude_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_1' AND paper_name ILIKE '%General Aptitude%'
    LIMIT 1;

  SELECT id INTO v_g2_gs_mental_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_2' AND paper_name ILIKE '%General Studies and Mental Ability%'
    LIMIT 1;

  SELECT id INTO v_g2_social_hist_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_2' AND paper_name ILIKE '%Social History%'
    LIMIT 1;

  SELECT id INTO v_g2_economy_sci_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_2' AND (paper_name ILIKE '%Economy%' OR paper_name ILIKE '%Science%')
    LIMIT 1;

  SELECT id INTO v_g3_gen_studies_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_3' AND paper_name ILIKE '%General Studies%Mental Ability%Language%'
    LIMIT 1;

  SELECT id INTO v_g3_contemp_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_3' AND paper_name ILIKE '%Contemporary%'
    LIMIT 1;

  SELECT id INTO v_g4_paper1_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_4' AND paper_name ILIKE '%General Studies%Mental Ability%'
    LIMIT 1;

  SELECT id INTO v_g4_paper2_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_4' AND paper_name ILIKE '%General English%'
    LIMIT 1;

  -- ── BANK_EXAMS — Prelims Paper ─────────────────────────────────────────────

  IF v_bank_prelims_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Calculation & Speed Mathematics',                'గణన మరియు వేగవంతమైన గణితం',                   1),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Number Series',                                  'సంఖ్యా శ్రేణులు',                               2),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Arithmetic',                                     'అంకగణితం',                                      3),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Time & Work',                                    'సమయం మరియు పని',                                4),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Time, Speed & Distance',                         'సమయం, వేగం మరియు దూరం',                         5),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Mensuration',                                    'క్షేత్రమితి',                                    6),
      ('BANK_EXAMS', v_bank_prelims_id, 'Quantitative Aptitude & Data Interpretation', 'Data Interpretation',                            'డేటా విశ్లేషణ',                                  7),

      ('BANK_EXAMS', v_bank_prelims_id, 'Reasoning Ability & Computer Aptitude', 'Logical Reasoning',                                   'తార్కిక విశ్లేషణ',                              1),
      ('BANK_EXAMS', v_bank_prelims_id, 'Reasoning Ability & Computer Aptitude', 'Puzzles & Seating Arrangement',                       'పజిల్స్ మరియు కూర్చునే అమరికలు',               2),
      ('BANK_EXAMS', v_bank_prelims_id, 'Reasoning Ability & Computer Aptitude', 'Advanced Logical Reasoning',                          'ఉన్నత స్థాయి తార్కిక విశ్లేషణ',               3),
      ('BANK_EXAMS', v_bank_prelims_id, 'Reasoning Ability & Computer Aptitude', 'Computer Aptitude',                                   'కంప్యూటర్ ఆప్టిట్యూడ్',                         4),

      ('BANK_EXAMS', v_bank_prelims_id, 'English Language', 'Grammar',                                                                   NULL,                                             1),
      ('BANK_EXAMS', v_bank_prelims_id, 'English Language', 'Vocabulary',                                                                NULL,                                             2),
      ('BANK_EXAMS', v_bank_prelims_id, 'English Language', 'Reading Comprehension & Cloze Test',                                        NULL,                                             3),
      ('BANK_EXAMS', v_bank_prelims_id, 'English Language', 'Para Jumbles, Sentence Arrangement & Sentence Connectors',                  NULL,                                             4),
      ('BANK_EXAMS', v_bank_prelims_id, 'English Language', 'Error Spotting, Sentence Improvement & Mixed English Language',             NULL,                                             5),

      ('BANK_EXAMS', v_bank_prelims_id, 'General, Banking & Financial Awareness', 'Banking Awareness',                                   'బ్యాంకింగ్ అవగాహన',                             1),
      ('BANK_EXAMS', v_bank_prelims_id, 'General, Banking & Financial Awareness', 'Financial & Economic Awareness',                      'ఆర్థిక మరియు ఆర్థిక వ్యవస్థ అవగాహన',          2),
      ('BANK_EXAMS', v_bank_prelims_id, 'General, Banking & Financial Awareness', 'Current Affairs',                                     'సమకాలీన వ్యవహారాలు',                            3),
      ('BANK_EXAMS', v_bank_prelims_id, 'General, Banking & Financial Awareness', 'Static General Knowledge',                            'స్థిర సాధారణ జ్ఞానం',                           4),

      ('BANK_EXAMS', v_bank_prelims_id, 'Computer Knowledge', 'Computer Fundamentals & Hardware',                                        'కంప్యూటర్ ప్రాథమికాలు & హార్డ్వేర్',          1),
      ('BANK_EXAMS', v_bank_prelims_id, 'Computer Knowledge', 'Software, Operating Systems & MS Office',                                 'సాఫ్ట్వేర్, ఆపరేటింగ్ సిస్టమ్స్ & MS Office', 2),
      ('BANK_EXAMS', v_bank_prelims_id, 'Computer Knowledge', 'Networking, Internet & Cyber Security',                                   'నెట్వర్కింగ్, ఇంటర్నెట్ & సైబర్ భద్రత',       3),
      ('BANK_EXAMS', v_bank_prelims_id, 'Computer Knowledge', 'Database, Programming Concepts & Emerging Technologies',                  'డేటాబేస్, ప్రోగ్రామింగ్ భావనలు & అభివృద్ధి చెందుతున్న సాంకేతికతలు', 4)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_1 — General Studies ───────────────────────────────────────

  IF v_g1_gen_studies_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'Indus Valley Civilization & Early Historic India',         'సింధు లోయ నాగరికత మరియు ప్రారంభ చారిత్రక భారతదేశం',                1),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'Early Medieval India & South Indian Dynasties',             'ప్రారంభ మధ్యయుగ భారతదేశం మరియు దక్షిణ భారత రాజవంశాలు',            2),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'Delhi Sultanate, Vijayanagara & Mughal India',              'ఢిల్లీ సుల్తానేట్, విజయనగర సామ్రాజ్యం మరియు మొఘల్ భారతదేశం',      3),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'European Companies & British Expansion in India',           'యూరోపియన్ వాణిజ్య సంస్థలు మరియు భారతదేశంలో బ్రిటిష్ విస్తరణ',     4),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'Revolt of 1857 & Indian Freedom Movement',                 '1857 తిరుగుబాటు మరియు భారత స్వాతంత్ర్య ఉద్యమం',                    5),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'History and Culture', 'Gandhi, Ambedkar & Post-Independence India',               'గాంధీ, అంబేద్కర్ మరియు స్వాతంత్ర్యానంతర భారతదేశం',                 6),

      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'Indian Constitution – Evolution & Core Features',    'భారత రాజ్యాంగం – పరిణామం మరియు ప్రధాన లక్షణాలు',                   1),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'Federal Structure – Union, States & Legislature',    'సమాఖ్య వ్యవస్థ – కేంద్రం, రాష్ట్రాలు మరియు శాసనసభ',              2),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'Constitutional Bodies & Governance',                 'రాజ్యాంగ సంస్థలు మరియు పాలన',                                       3),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'Governance Reforms, LPG & Institutions',             'పాలనా సంస్కరణలు, ఎల్పీజీ మరియు సంస్థలు',                          4),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'Rights Issues & Social Justice',                     'హక్కుల సమస్యలు మరియు సామాజిక న్యాయం',                              5),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Constitution, Polity, Social Justice and International Relations', 'India''s Foreign Policy & Government Programmes',    'భారత విదేశాంగ విధానం మరియు ప్రభుత్వ కార్యక్రమాలు',                6),

      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'Basic Characteristics of Indian Economy',    'భారత ఆర్థిక వ్యవస్థ యొక్క ప్రాథమిక లక్షణాలు',   1),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'National Income',                            'జాతీయ ఆదాయం',                                     2),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'Indian Agriculture',                         'భారత వ్యవసాయం',                                   3),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'Financial Institutions',                     'ఆర్థిక సంస్థలు',                                  4),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'Andhra Pradesh Economy after Bifurcation',   'విభజన అనంతర ఆంధ్రప్రదేశ్ ఆర్థిక వ్యవస్థ',       5),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Indian and Andhra Pradesh Economy and Planning', 'A.P. Reorganisation Act, 2014',              'ఆంధ్రప్రదేశ్ పునర్వ్యవస్థీకరణ చట్టం, 2014',     6),

      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Geography', 'General Geography',    'సాధారణ భూగోళ శాస్త్రం',  1),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Geography', 'Physical Geography',   'భౌతిక భూగోళ శాస్త్రం',   2),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Geography', 'Social Geography',     'సామాజిక భూగోళ శాస్త్రం', 3),
      ('APPSC_GROUP_1', v_g1_gen_studies_id, 'Geography', 'Economic Geography',   'ఆర్థిక భూగోళ శాస్త్రం',  4)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_1 — General Aptitude ──────────────────────────────────────

  IF v_g1_gen_aptitude_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'General Mental and Psychological Abilities', 'Logical & Analytical Reasoning',    'తార్కిక మరియు విశ్లేషణాత్మక తర్కం',         1),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'General Mental and Psychological Abilities', 'Reasoning + Basic Math Concepts',   'తార్కికం మరియు ప్రాథమిక గణిత భావనలు',       2),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'General Mental and Psychological Abilities', 'Quantitative Aptitude & Geometry',  'పరిమాణాత్మక సామర్థ్యం మరియు జ్యామితి',      3),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'General Mental and Psychological Abilities', 'Algebra, Data & Intelligence',      'బీజగణితం, డేటా మరియు మేధస్సు',              4),

      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Science and Technology', 'Science and Technology',                                'సైన్స్ మరియు టెక్నాలజీ',                             1),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Science and Technology', 'Information and Communication Technology (ICT)',        'సమాచార మరియు సమాచార ప్రసార సాంకేతికత (ICT)',         2),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Science and Technology', 'Technology in Space and Defence',                      'అంతరిక్ష మరియు రక్షణ రంగంలో సాంకేతికత',             3),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Science and Technology', 'Energy Requirement and Efficiency',                    'శక్తి అవసరాలు మరియు శక్తి సామర్థ్యం',               4),
      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Science and Technology', 'Environmental Science, Biotechnology and Nanotechnology','పర్యావరణ శాస్త్రం, జీవసాంకేతిక శాస్త్రం మరియు నానోసాంకేతికత', 5),

      ('APPSC_GROUP_1', v_g1_gen_aptitude_id, 'Current Events of Regional, National and International Importance', 'Current Events of Regional, National and International Importance', 'ప్రాంతీయ, జాతీయ మరియు అంతర్జాతీయ ప్రాధాన్యత కలిగిన సమకాలీన సంఘటనలు', 1)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_2 — General Studies and Mental Ability ────────────────────

  IF v_g2_gs_mental_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Ancient History (Indus Valley Civilization, Vedic Age, Emergence of Buddhism, Emergence of Jainism)', 'ప్రాచీన భారత చరిత్ర (సింధు లోయ నాగరికత, వేద యుగం, బౌద్ధ మత ఆవిర్భావం, జైన మత ఆవిర్భావం)', 1),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Ancient History (Mauryan Empire, Gupta Empire, Harshavardhana)', 'ప్రాచీన భారత చరిత్ర (మౌర్య సామ్రాజ్యం, గుప్త సామ్రాజ్యం, హర్షవర్ధనుడు)', 2),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Indian History – Medieval History (Chola Administrative System, Delhi Sultanate)', 'భారత చరిత్ర – మధ్యయుగ చరిత్ర (చోళుల పరిపాలనా వ్యవస్థ, ఢిల్లీ సుల్తానేట్)', 3),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Medieval History (Mughal Empire, Bhakti Movement, Sufi Movement, Shivaji and Rise of Maratha Empire)', 'మధ్యయుగ భారత చరిత్ర (మొఘల్ సామ్రాజ్యం, భక్తి ఉద్యమం, సూఫీ ఉద్యమం, శివాజీ మరియు మరాఠా సామ్రాజ్య ఉదయం)', 4),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Modern History (Advent of Europeans, European Trading Companies, Struggle for Supremacy, Bengal, Bombay, Madras, Mysore, Andhra, Nizam, Governor-Generals and Viceroys)', 'ఆధునిక భారత చరిత్ర (యూరోపియన్ల రాక, యూరోపియన్ వాణిజ్య సంస్థలు, ఆధిపత్య పోరాటం, బెంగాల్, బొంబాయి, మద్రాస్, మైసూరు, ఆంధ్ర, నిజాం, గవర్నర్ జనరల్స్ మరియు వైస్రాయులు)', 5),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Modern History (1857 Revolt, Rise and Consolidation of British Power in India, Changes in Administration, Social and Cultural Spheres)', 'ఆధునిక భారత చరిత్ర (1857 తిరుగుబాటు, భారతదేశంలో బ్రిటిష్ అధికార స్థాపన మరియు బలోపేతం, పరిపాలనలో మార్పులు, సామాజిక మరియు సాంస్కృతిక రంగాలు)', 6),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian History', 'Modern History (Social and Religious Reform Movements, Indian National Movement, Post-Independence Consolidation and Reorganization)', 'ఆధునిక భారత చరిత్ర (సామాజిక మరియు మత సంస్కరణ ఉద్యమాలు, భారత జాతీయ ఉద్యమం, స్వాతంత్ర్యానంతర ఏకీకరణ మరియు పునర్వ్యవస్థీకరణ)', 7),

      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Geography', 'General & Physical Geography (Earth in Solar System, Interior of Earth, Major Landforms, Atmosphere, Climate, Ocean Water)', 'సాధారణ మరియు భౌతిక భూగోళ శాస్త్రం (సౌర కుటుంబంలో భూమి, భూమి అంతర్భాగం, ప్రధాన భూస్వరూపాలు, వాతావరణం, శీతోష్ణ స్థితి, సముద్ర జలాలు)', 1),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Geography', 'Geography of India and Andhra Pradesh (Major Physiographic Features, Climate, Drainage System, Soils, Vegetation)', 'భారతదేశం మరియు ఆంధ్రప్రదేశ్ భూగోళ శాస్త్రం (ప్రధాన భౌగోళిక స్వరూపాలు, శీతోష్ణ స్థితి, నదీ పారుదల వ్యవస్థ, నేలలు, వృక్షసంపద)', 2),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Geography', 'Economic Geography of India and Andhra Pradesh (Natural Resources, Agriculture, Agro-Based Activities, Industries, Industrial Regions, Transport, Communication, Tourism, Trade)', 'భారతదేశం మరియు ఆంధ్రప్రదేశ్ ఆర్థిక భూగోళ శాస్త్రం (సహజ వనరులు, వ్యవసాయం, వ్యవసాయ ఆధారిత కార్యకలాపాలు, పరిశ్రమలు, పారిశ్రామిక ప్రాంతాలు, రవాణా, సమాచార ప్రసారం, పర్యాటకం, వాణిజ్యం)', 3),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Geography', 'Human Geography of India and Andhra Pradesh (Human Development, Demographics, Urbanization, Migration, Racial, Tribal, Religious and Linguistic Groups)', 'భారతదేశం మరియు ఆంధ్రప్రదేశ్ మానవ భూగోళ శాస్త్రం (మానవ అభివృద్ధి, జనాభా గణాంకాలు, పట్టణీకరణ, వలసలు, జాతి, గిరిజన, మత మరియు భాషా సమూహాలు)', 4),

      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian Society', 'Structure of Indian Society (Family, Marriage, Kinship, Caste, Tribe, Ethnicity, Religion, Women)', 'భారతీయ సమాజ నిర్మాణం (కుటుంబం, వివాహం, బంధుత్వం, కులం, తెగ, జాతి, మతం, మహిళలు)', 1),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian Society', 'Social Issues (Casteism, Communalism, Regionalism, Crime Against Women, Child Abuse, Child Labour, Youth Unrest and Agitations)', 'సామాజిక సమస్యలు (కులవాదం, మతతత్వం, ప్రాంతీయత, మహిళలపై నేరాలు, బాలలపై దుర్వినియోగం, బాల కార్మికులు, యువత అసంతృప్తి మరియు ఉద్యమాలు)', 2),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Indian Society', 'Welfare Mechanism (Public Policies, Welfare Programmes, Constitutional and Statutory Provisions for SCs, STs, Minorities, BCs, Women, Disabled Persons and Children)', 'సంక్షేమ వ్యవస్థ (ప్రజా విధానాలు, సంక్షేమ కార్యక్రమాలు, ఎస్సీలు, ఎస్టీలు, మైనారిటీలు, బీసీలు, మహిళలు, దివ్యాంగులు మరియు పిల్లల కోసం రాజ్యాంగ మరియు చట్టబద్ధ నిబంధనలు)', 3),

      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Current Affairs', 'International Current Events and Issues', 'అంతర్జాతీయ సమకాలీన సంఘటనలు మరియు అంశాలు', 1),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Current Affairs', 'National Current Events and Issues (India)', 'జాతీయ సమకాలీన సంఘటనలు మరియు అంశాలు (భారతదేశం)', 2),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Current Affairs', 'Andhra Pradesh Current Events and Issues', 'ఆంధ్రప్రదేశ్ సమకాలీన సంఘటనలు మరియు అంశాలు', 3),

      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Logical Reasoning (Statement & Assumptions, Statement & Argument, Statement & Conclusion, Statement & Courses of Action)', 'తార్కిక తర్కం (ప్రకటన మరియు ఊహలు, ప్రకటన మరియు వాదన, ప్రకటన మరియు నిర్ధారణ, ప్రకటన మరియు చర్యల మార్గాలు)', 1),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Number Series, Coding-Decoding, Relations & Analytical Reasoning', 'సంఖ్యా శ్రేణులు, కోడింగ్-డీకోడింగ్, సంబంధాలు మరియు విశ్లేషణాత్మక తర్కం', 2),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Number Series, Letter Series, Odd Man Out', 'సంఖ్యా శ్రేణులు, అక్షర శ్రేణులు, భిన్నమైన అంశాన్ని గుర్తించడం', 3),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Coding-Decoding, Blood Relations, Direction Sense, Ranking & Ordering', 'కోడింగ్-డీకోడింగ్, రక్త సంబంధాలు, దిశా జ్ఞానం, ర్యాంకింగ్ మరియు క్రమబద్ధీకరణ', 4),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Data Sufficiency, Decision Making, Problem Solving & Analytical Ability', 'డేటా సమృద్ధి, నిర్ణయ సామర్థ్యం, సమస్య పరిష్కారం మరియు విశ్లేషణాత్మక సామర్థ్యం', 5),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Quantitative Aptitude (Percentages, Ratio & Proportion, Average, Profit & Loss, Simple & Compound Interest)', 'పరిమాణాత్మక సామర్థ్యం (శాతాలు, నిష్పత్తి మరియు అనుపాతం, సగటు, లాభం మరియు నష్టం, సాధారణ మరియు చక్రవడ్డీ)', 6),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Time & Work, Pipes & Cisterns, Time-Speed-Distance, Boats & Streams, Mensuration', 'సమయం మరియు పని, పైపులు మరియు తొట్టెలు, సమయం-వేగం-దూరం, పడవలు మరియు ప్రవాహాలు, క్షేత్రమితి', 7),
      ('APPSC_GROUP_2', v_g2_gs_mental_id, 'Mental Ability', 'Data Interpretation (Tables, Charts, Graphs, Caselets)', 'డేటా విశ్లేషణ (పట్టికలు, చార్టులు, గ్రాఫ్లు, కేస్లెట్లు)', 8)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_2 — Social History of AP and Indian Constitution ───────────

  IF v_g2_social_hist_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Sources, Prehistoric Cultures and Megalithic Culture in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో మూలాలు, చరిత్రపూర్వ సంస్కృతులు మరియు మెగాలిథిక్ సంస్కృతి', 1),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Satavahanas, Ikshvakus, Pallavas, Vishnukundins and Early Historical Developments in Andhra', 'శాతవాహనులు, ఇక్ష్వాకులు, పల్లవులు, విష్ణుకుండినులు మరియు ఆంధ్రలో ప్రారంభ చారిత్రక పరిణామాలు', 2),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Eastern Chalukyas, Cholas in Andhra, Kakatiyas and Their Contribution to Andhra Society and Culture', 'తూర్పు చాళుక్యులు, ఆంధ్రలో చోళులు, కాకతీయులు మరియు ఆంధ్ర సమాజం, సంస్కృతికి వారి సేవలు', 3),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Vijayanagara Empire, Bahmani Kingdom, Qutb Shahis and Socio-Cultural Developments in Andhra', 'విజయనగర సామ్రాజ్యం, బహమనీ రాజ్యం, కుతుబ్ షాహీలు మరియు ఆంధ్రలో సామాజిక-సాంస్కృతిక పరిణామాలు', 4),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Advent of Europeans, Colonial Rule, Social and Religious Reform Movements in Andhra', 'యూరోపియన్ల రాక, వలస పాలన, ఆంధ్రలో సామాజిక మరియు మత సంస్కరణ ఉద్యమాలు', 5),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Andhra Awakening, Freedom Movement in Andhra and Formation of Andhra State & Andhra Pradesh', 'ఆంధ్ర చైతన్యం, ఆంధ్రలో స్వాతంత్ర్య ఉద్యమం మరియు ఆంధ్ర రాష్ట్రం & ఆంధ్రప్రదేశ్ ఏర్పాటు', 6),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Social and Cultural History of Andhra Pradesh', 'Andhra Society, Literature, Language, Art, Architecture, Music, Dance and Cultural Heritage', 'ఆంధ్ర సమాజం, సాహిత్యం, భాష, కళ, వాస్తుశిల్పం, సంగీతం, నృత్యం మరియు సాంస్కృతిక వారసత్వం', 7),

      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Constitutional Evolution, Constituent Assembly, Salient Features, Preamble, Fundamental Rights, Directive Principles and Fundamental Duties', 'రాజ్యాంగ పరిణామం, రాజ్యాంగ సభ, ముఖ్య లక్షణాలు, పీఠిక, ప్రాథమిక హక్కులు, రాష్ట్ర విధాన మార్గదర్శక సూత్రాలు మరియు ప్రాథమిక విధులు', 1),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Union Government (President, Vice President, Prime Minister, Council of Ministers, Parliament, Attorney General)', 'కేంద్ర ప్రభుత్వం (రాష్ట్రపతి, ఉపరాష్ట్రపతి, ప్రధాన మంత్రి, మంత్రివర్గం, పార్లమెంట్, అటార్నీ జనరల్)', 2),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Judiciary, Judicial Review, Judicial Activism, Supreme Court, High Courts and Subordinate Courts', 'న్యాయవ్యవస్థ, న్యాయ సమీక్ష, న్యాయ చైతన్యం, సుప్రీంకోర్టు, హైకోర్టులు మరియు దిగువ న్యాయస్థానాలు', 3),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Federal System, Centre–State Relations, Emergency Provisions and Constitutional Bodies', 'సమాఖ్య వ్యవస్థ, కేంద్ర–రాష్ట్ర సంబంధాలు, అత్యవసర నిబంధనలు మరియు రాజ్యాంగ సంస్థలు', 4),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'State Government, Governor, Chief Minister, Council of Ministers, State Legislature and Local Self Government', 'రాష్ట్ర ప్రభుత్వం, గవర్నర్, ముఖ్యమంత్రి, మంత్రివర్గం, రాష్ట్ర శాసనసభ మరియు స్థానిక స్వపరిపాలన', 5),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Constitutional Amendments, Schedules, Elections, Political Parties, Pressure Groups and Constitutional & Non-Constitutional Bodies', 'రాజ్యాంగ సవరణలు, షెడ్యూళ్లు, ఎన్నికలు, రాజకీయ పార్టీలు, ఒత్తిడి సమూహాలు మరియు రాజ్యాంగబద్ధ & రాజ్యాంగేతర సంస్థలు', 6),
      ('APPSC_GROUP_2', v_g2_social_hist_id, 'Indian Constitution', 'Public Policy, Rights Issues, Governance, Transparency, Accountability and Contemporary Constitutional Developments', 'ప్రజా విధానాలు, హక్కుల అంశాలు, పరిపాలన, పారదర్శకత, జవాబుదారీతనం మరియు సమకాలీన రాజ్యాంగ పరిణామాలు', 7)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_2 — Indian and AP Economy and Science and Technology ───────

  IF v_g2_economy_sci_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Basic Concepts of Economics, Economic Systems, National Income and Economic Development', 'ఆర్థిక శాస్త్రం యొక్క ప్రాథమిక భావనలు, ఆర్థిక వ్యవస్థలు, జాతీయ ఆదాయం మరియు ఆర్థిక అభివృద్ధి', 1),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Planning in India, NITI Aayog, Economic Reforms, Liberalization, Privatization and Globalization', 'భారతదేశంలో ప్రణాళిక, నీతి ఆయోగ్, ఆర్థిక సంస్కరణలు, సరళీకరణ, ప్రైవేటీకరణ మరియు ప్రపంచీకరణ', 2),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Agriculture, Land Reforms, Irrigation, Rural Development and Allied Sectors', 'వ్యవసాయం, భూ సంస్కరణలు, నీటిపారుదల, గ్రామీణ అభివృద్ధి మరియు అనుబంధ రంగాలు', 3),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Industry, Industrial Policy, MSMEs, Infrastructure and Service Sector', 'పరిశ్రమలు, పారిశ్రామిక విధానం, సూక్ష్మ, చిన్న మరియు మధ్యతరహా పరిశ్రమలు (MSMEs), మౌలిక సదుపాయాలు మరియు సేవారంగం', 4),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Banking, Financial System, Money Market, Capital Market, Public Finance and Budget', 'బ్యాంకింగ్, ఆర్థిక వ్యవస్థ, ద్రవ్య మార్కెట్, మూలధన మార్కెట్, ప్రభుత్వ ఆర్థిక వ్యవహారాలు మరియు బడ్జెట్', 5),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'Poverty, Unemployment, Population, Human Development, Inclusive Growth and Welfare Programmes', 'పేదరికం, నిరుద్యోగం, జనాభా, మానవ అభివృద్ధి, సమ్మిళిత వృద్ధి మరియు సంక్షేమ కార్యక్రమాలు', 6),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Indian and AP Economy', 'External Sector, International Trade, WTO, Global Economic Institutions and Andhra Pradesh Economy', 'బాహ్య రంగం, అంతర్జాతీయ వాణిజ్యం, WTO, ప్రపంచ ఆర్థిక సంస్థలు మరియు ఆంధ్రప్రదేశ్ ఆర్థిక వ్యవస్థ', 7),

      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Basics of Science, Scientific Methods, Scientific Institutions and Contributions of Indian Scientists', 'విజ్ఞాన శాస్త్రపు ప్రాథమిక అంశాలు, శాస్త్రీయ పద్ధతులు, శాస్త్రీయ సంస్థలు మరియు భారతీయ శాస్త్రవేత్తల కృషి', 1),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Space Technology, ISRO, Satellites, Space Missions and Space Applications', 'అంతరిక్ష సాంకేతికత, ఇస్రో, ఉపగ్రహాలు, అంతరిక్ష మిషన్లు మరియు అంతరిక్ష అనువర్తనాలు', 2),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Information Technology, Computers, Artificial Intelligence, Cyber Security and Digital India', 'సమాచార సాంకేతికత, కంప్యూటర్లు, కృత్రిమ మేధస్సు, సైబర్ భద్రత మరియు డిజిటల్ ఇండియా', 3),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Biotechnology, Genetic Engineering, Nanotechnology and Emerging Scientific Innovations', 'జీవసాంకేతిక శాస్త్రం, జన్యు ఇంజనీరింగ్, నానోసాంకేతికత మరియు అభివృద్ధి చెందుతున్న శాస్త్రీయ ఆవిష్కరణలు', 4),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Health, Diseases, Vaccines, Public Health, Nutrition and Medical Technologies', 'ఆరోగ్యం, వ్యాధులు, టీకాలు, ప్రజారోగ్యం, పోషకాహారం మరియు వైద్య సాంకేతికతలు', 5),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Environment, Ecology, Biodiversity, Climate Change, Energy and Sustainable Development', 'పర్యావరణం, జీవావరణ శాస్త్రం, జీవ వైవిధ్యం, వాతావరణ మార్పు, శక్తి మరియు సుస్థిర అభివృద్ధి', 6),
      ('APPSC_GROUP_2', v_g2_economy_sci_id, 'Science and Technology', 'Defence Technology, Nuclear Technology, Robotics, Advanced Materials and Emerging Technologies', 'రక్షణ సాంకేతికత, అణు సాంకేతికత, రోబోటిక్స్, అధునాతన పదార్థాలు మరియు అభివృద్ధి చెందుతున్న సాంకేతికతలు', 7)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_3 — General Studies, Mental Ability and Language Ability ───

  IF v_g3_gen_studies_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Current Affairs of National Importance', 'National Governance, Politics, Parliament, Judiciary and Important Government Initiatives', 'జాతీయ పరిపాలన, రాజకీయాలు, పార్లమెంట్, న్యాయవ్యవస్థ మరియు ముఖ్య ప్రభుత్వ కార్యక్రమాలు', 1),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Current Affairs of National Importance', 'Economy, Budget, Banking, Finance, Welfare Schemes and Development Programmes', 'ఆర్థిక వ్యవస్థ, బడ్జెట్, బ్యాంకింగ్, ఆర్థిక వ్యవహారాలు, సంక్షేమ పథకాలు మరియు అభివృద్ధి కార్యక్రమాలు', 2),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Current Affairs of National Importance', 'Science, Technology, Space, Environment, Climate Change and Energy', 'విజ్ఞానం, సాంకేతికత, అంతరిక్షం, పర్యావరణం, వాతావరణ మార్పు మరియు శక్తి', 3),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Current Affairs of National Importance', 'International Relations, Global Organizations, Defence, Internal Security and India''s Foreign Policy', 'అంతర్జాతీయ సంబంధాలు, ప్రపంచ సంస్థలు, రక్షణ, అంతర్గత భద్రత మరియు భారత విదేశాంగ విధానం', 4),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Current Affairs of National Importance', 'Awards, Sports, Reports, Indices, Books, Important Days and Persons in News', 'అవార్డులు, క్రీడలు, నివేదికలు, సూచికలు, పుస్తకాలు, ముఖ్యమైన దినాలు మరియు వార్తల్లోని ప్రముఖ వ్యక్తులు', 5),

      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Ancient Andhra History (Prehistoric Period to Satavahanas)', 'ప్రాచీన ఆంధ్ర చరిత్ర (చరిత్రపూర్వ యుగం నుండి శాతవాహనుల వరకు)', 1),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Medieval Andhra History (Ikshvakus to Kakatiyas)', 'మధ్యయుగ ఆంధ్ర చరిత్ర (ఇక్ష్వాకుల నుండి కాకతీయుల వరకు)', 2),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Modern Andhra History (Vijayanagara Empire, Qutb Shahis, Colonial Rule and Socio-Cultural Developments)', 'ఆధునిక ఆంధ్ర చరిత్ర (విజయనగర సామ్రాజ్యం, కుతుబ్ షాహీలు, వలస పాలన మరియు సామాజిక-సాంస్కృతిక పరిణామాలు)', 3),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Andhra Movement, Formation of Andhra State, Formation of Andhra Pradesh and Reorganisation of the State', 'ఆంధ్ర ఉద్యమం, ఆంధ్ర రాష్ట్ర ఏర్పాటు, ఆంధ్రప్రదేశ్ ఏర్పాటు మరియు రాష్ట్ర పునర్వ్యవస్థీకరణ', 4),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Physical Geography of Andhra Pradesh', 'ఆంధ్రప్రదేశ్ భౌతిక భూగోళ శాస్త్రం', 5),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Economic Geography of Andhra Pradesh', 'ఆంధ్రప్రదేశ్ ఆర్థిక భూగోళ శాస్త్రం', 6),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'History and Geography of Andhra Pradesh', 'Resources, Agriculture, Irrigation, Industries, Tourism and Sustainable Development of Andhra Pradesh', 'ఆంధ్రప్రదేశ్ వనరులు, వ్యవసాయం, నీటిపారుదల, పరిశ్రమలు, పర్యాటకం మరియు సుస్థిర అభివృద్ధి', 7),

      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Logical Reasoning, Number Series, Coding-Decoding and Relations', 'తార్కిక తర్కం, సంఖ్యా శ్రేణులు, కోడింగ్-డీకోడింగ్ మరియు సంబంధాలు', 1),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Analogy, Classification, Odd One Out and Logical Grouping', 'సాదృశ్యం, వర్గీకరణ, భిన్నమైన అంశాన్ని గుర్తించడం మరియు తార్కిక సమూహీకరణ', 2),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Direction Sense, Ranking, Order and Sequence Problems', 'దిశా జ్ఞానం, ర్యాంకింగ్, క్రమం మరియు శ్రేణి సమస్యలు', 3),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Seating Arrangement, Puzzle Test and Logical Arrangements', 'కూర్చునే అమరికలు, పజిల్ పరీక్ష మరియు తార్కిక అమరికలు', 4),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Data Interpretation, Data Analysis and Data Sufficiency', 'డేటా విశ్లేషణ, డేటా విశ్లేషణాత్మక పరిశీలన మరియు డేటా సమృద్ధి', 5),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Clocks, Calendars, Cubes, Dice and Non-Verbal Reasoning', 'గడియారాలు, క్యాలెండర్లు, ఘనాలు, పాచికలు మరియు మౌఖికేతర తార్కికత', 6),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Mental Ability', 'Quantitative Aptitude, Arithmetic Reasoning and Numerical Ability', 'పరిమాణాత్మక సామర్థ్యం, అంకగణిత తార్కికత మరియు సంఖ్యా సామర్థ్యం', 7),

      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Language Ability', 'Vocabulary, Synonyms, Antonyms and One-Word Substitutions', NULL, 1),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Language Ability', 'Grammar, Parts of Speech and Error Detection', NULL, 2),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Language Ability', 'Tenses, Voice, Narration and Sentence Improvement', NULL, 3),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Language Ability', 'Idioms, Phrases, Fill in the Blanks, Usage and Sentence Completion', NULL, 4),
      ('APPSC_GROUP_3', v_g3_gen_studies_id, 'Language Ability', 'Reading Comprehension, Para Jumbles and Passage-Based Reasoning', NULL, 5)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

  -- ── APPSC_GROUP_3 — Contemporary Problems and Development of Rural Society ─

  IF v_g3_contemp_id IS NOT NULL THEN
    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Rural Health and Sanitation', 'Rural Health Infrastructure, Public Health and Healthcare Delivery in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో గ్రామీణ ఆరోగ్య మౌలిక సదుపాయాలు, ప్రజారోగ్యం మరియు ఆరోగ్య సేవల అందజేత', 1),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Rural Health and Sanitation', 'Rural Sanitation, Drinking Water, Hygiene and Public Health Awareness in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో గ్రామీణ పారిశుద్ధ్యం, తాగునీరు, పరిశుభ్రత మరియు ప్రజారోగ్య అవగాహన', 2),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Rural Health and Sanitation', 'Village Development, Rural Infrastructure and Rural Livelihoods in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో గ్రామాభివృద్ధి, గ్రామీణ మౌలిక సదుపాయాలు మరియు గ్రామీణ జీవనోపాధులు', 3),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Rural Health and Sanitation', 'Women, Children, Nutrition, Social Welfare and Human Development in Rural Andhra Pradesh', 'గ్రామీణ ఆంధ్రప్రదేశ్లో మహిళలు, పిల్లలు, పోషకాహారం, సామాజిక సంక్షేమం మరియు మానవ అభివృద్ధి', 4),

      ('APPSC_GROUP_3', v_g3_contemp_id, 'Social Tensions and Contemporary Problems', 'Social Tensions, Social Conflicts and Social Change in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో సామాజిక ఉద్రిక్తతలు, సామాజిక సంఘర్షణలు మరియు సామాజిక మార్పు', 1),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Social Tensions and Contemporary Problems', 'Problems of Deprived Groups, Social Justice and Inclusive Development in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో వెనుకబడిన వర్గాల సమస్యలు, సామాజిక న్యాయం మరియు సమగ్ర అభివృద్ధి', 2),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Social Tensions and Contemporary Problems', 'Multi-Lingual Society, Cultural Diversity, Migration and Social Integration in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో బహుభాషా సమాజం, సాంస్కృతిక వైవిధ్యం, వలసలు మరియు సామాజిక సమైక్యత', 3),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Social Tensions and Contemporary Problems', 'Unemployment, Youth Issues, Student Unrest and Human Resource Development in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో నిరుద్యోగం, యువత సమస్యలు, విద్యార్థుల అసంతృప్తి మరియు మానవ వనరుల అభివృద్ధి', 4),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Social Tensions and Contemporary Problems', 'Environment, Development, Globalization, Technology and Contemporary Challenges in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో పర్యావరణం, అభివృద్ధి, ప్రపంచీకరణ, సాంకేతికత మరియు సమకాలీన సవాళ్లు', 5),

      ('APPSC_GROUP_3', v_g3_contemp_id, 'Indian Democracy and Democratic Institutions', 'Indian Constitution, Democratic Values and Constitutional Foundations', 'భారత రాజ్యాంగం, ప్రజాస్వామ్య విలువలు మరియు రాజ్యాంగ పునాదులు', 1),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Indian Democracy and Democratic Institutions', 'Union Government, Parliament, Executive and Judiciary', 'కేంద్ర ప్రభుత్వం, పార్లమెంట్, కార్యనిర్వాహక వ్యవస్థ మరియు న్యాయవ్యవస్థ', 2),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Indian Democracy and Democratic Institutions', 'State Government, Andhra Pradesh Governance and Democratic Administration', 'రాష్ట్ర ప్రభుత్వం, ఆంధ్రప్రదేశ్ పరిపాలన మరియు ప్రజాస్వామ్య పాలన', 3),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Indian Democracy and Democratic Institutions', 'Local Self Government, Panchayati Raj and Decentralized Governance in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో స్థానిక స్వపరిపాలన, పంచాయతీ రాజ్ మరియు వికేంద్రీకృత పాలన', 4),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'Indian Democracy and Democratic Institutions', 'Elections, Political Parties, Electoral Reforms, Rights-Based Governance and Citizen Participation', 'ఎన్నికలు, రాజకీయ పార్టీలు, ఎన్నికల సంస్కరణలు, హక్కుల ఆధారిత పాలన మరియు పౌరుల భాగస్వామ్యం', 5),

      ('APPSC_GROUP_3', v_g3_contemp_id, 'General Science and Panchayati Raj', 'General Science and Everyday Science with Special Reference to Rural Andhra Pradesh', 'గ్రామీణ ఆంధ్రప్రదేశ్కు ప్రత్యేక సూచనతో సాధారణ విజ్ఞానం మరియు దైనందిన విజ్ఞానం', 1),
      ('APPSC_GROUP_3', v_g3_contemp_id, 'General Science and Panchayati Raj', 'Panchayati Raj System, Rural Local Governance and Decentralized Administration in Andhra Pradesh', 'ఆంధ్రప్రదేశ్లో పంచాయతీ రాజ్ వ్యవస్థ, గ్రామీణ స్థానిక పాలన మరియు వికేంద్రీకృత పరిపాలన', 2)
    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;
  END IF;

END $$;
