-- ============================================================
-- Migration: Add missing Group 3 topics + seed all Group 4 topics
--
-- Changes:
--   1. Re-insert all Group 3 topics (ON CONFLICT DO NOTHING is safe)
--      Includes 2 new Group 3 Paper 2 topics that were missing.
--      Also updates Language Ability Telugu translations (were NULL).
--   2. Seed all Group 4 topics (Paper 1 & Paper 2) — were never added.
-- ============================================================

DO $$
DECLARE
  -- APPSC_GROUP_3
  v_g3_paper1_id uuid;
  v_g3_paper2_id uuid;

  -- APPSC_GROUP_4
  v_g4_paper1_id uuid;
  v_g4_paper2_id uuid;

BEGIN

  -- ── Resolve Group 3 Paper IDs (broad ILIKE for robustness) ────────────────

  SELECT id INTO v_g3_paper1_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_3'
      AND (
        paper_name ILIKE '%General Studies%Mental Ability%Language%'
        OR paper_name ILIKE '%General Studies, Mental Ability%'
      )
    LIMIT 1;

  SELECT id INTO v_g3_paper2_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_3'
      AND (
        paper_name ILIKE '%Contemporary%'
        OR paper_name ILIKE '%Rural Society%'
      )
    LIMIT 1;

  -- ── Resolve Group 4 Paper IDs ──────────────────────────────────────────────

  SELECT id INTO v_g4_paper1_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_4'
      AND (
        paper_name ILIKE '%General Studies%Mental Ability%'
        OR paper_name ILIKE '%General Studies & Mental%'
      )
    LIMIT 1;

  SELECT id INTO v_g4_paper2_id
    FROM public.exam_papers
    WHERE exam_id = 'APPSC_GROUP_4'
      AND (
        paper_name ILIKE '%General English%'
        OR paper_name ILIKE '%General Telugu%'
      )
    LIMIT 1;

  -- ── APPSC_GROUP_3 — Paper 1: General Studies, Mental Ability and Language Ability ──

  IF v_g3_paper1_id IS NOT NULL THEN

    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES

      -- Current Affairs of National Importance (5 topics)
      ('APPSC_GROUP_3', v_g3_paper1_id, 'Current Affairs of National Importance',
        'National Governance, Politics, Parliament, Judiciary and Important Government Initiatives',
        'జాతీయ పరిపాలన, రాజకీయాలు, పార్లమెంట్, న్యాయవ్యవస్థ మరియు ముఖ్య ప్రభుత్వ కార్యక్రమాలు', 1),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Current Affairs of National Importance',
        'Economy, Budget, Banking, Finance, Welfare Schemes and Development Programmes',
        'ఆర్థిక వ్యవస్థ, బడ్జెట్, బ్యాంకింగ్, ఆర్థిక వ్యవహారాలు, సంక్షేమ పథకాలు మరియు అభివృద్ధి కార్యక్రమాలు', 2),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Current Affairs of National Importance',
        'Science, Technology, Space, Environment, Climate Change and Energy',
        'విజ్ఞానం, సాంకేతికత, అంతరిక్షం, పర్యావరణం, వాతావరణ మార్పు మరియు శక్తి', 3),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Current Affairs of National Importance',
        'International Relations, Global Organizations, Defence, Internal Security and India''s Foreign Policy',
        'అంతర్జాతీయ సంబంధాలు, ప్రపంచ సంస్థలు, రక్షణ, అంతర్గత భద్రత మరియు భారత విదేశాంగ విధానం', 4),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Current Affairs of National Importance',
        'Awards, Sports, Reports, Indices, Books, Important Days and Persons in News',
        'అవార్డులు, క్రీడలు, నివేదికలు, సూచికలు, పుస్తకాలు, ముఖ్యమైన దినాలు మరియు వార్తల్లోని ప్రముఖ వ్యక్తులు', 5),

      -- History and Geography of Andhra Pradesh (7 topics)
      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Ancient Andhra History (Prehistoric Period to Satavahanas)',
        'ప్రాచీన ఆంధ్ర చరిత్ర (చరిత్రపూర్వ యుగం నుండి శాతవాహనుల వరకు)', 1),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Medieval Andhra History (Ikshvakus to Kakatiyas)',
        'మధ్యయుగ ఆంధ్ర చరిత్ర (ఇక్ష్వాకుల నుండి కాకతీయుల వరకు)', 2),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Modern Andhra History (Vijayanagara Empire, Qutb Shahis, Colonial Rule and Socio-Cultural Developments)',
        'ఆధునిక ఆంధ్ర చరిత్ర (విజయనగర సామ్రాజ్యం, కుతుబ్ షాహీలు, వలస పాలన మరియు సామాజిక-సాంస్కృతిక పరిణామాలు)', 3),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Andhra Movement, Formation of Andhra State, Formation of Andhra Pradesh and Reorganisation of the State',
        'ఆంధ్ర ఉద్యమం, ఆంధ్ర రాష్ట్ర ఏర్పాటు, ఆంధ్రప్రదేశ్ ఏర్పాటు మరియు రాష్ట్ర పునర్వ్యవస్థీకరణ', 4),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Physical Geography of Andhra Pradesh',
        'ఆంధ్రప్రదేశ్ భౌతిక భూగోళ శాస్త్రం', 5),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Economic Geography of Andhra Pradesh',
        'ఆంధ్రప్రదేశ్ ఆర్థిక భూగోళ శాస్త్రం', 6),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'History and Geography of Andhra Pradesh',
        'Resources, Agriculture, Irrigation, Industries, Tourism and Sustainable Development of Andhra Pradesh',
        'ఆంధ్రప్రదేశ్ వనరులు, వ్యవసాయం, నీటిపారుదల, పరిశ్రమలు, పర్యాటకం మరియు సుస్థిర అభివృద్ధి', 7),

      -- Mental Ability (7 topics)
      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Logical Reasoning, Number Series, Coding-Decoding and Relations',
        'తార్కిక తర్కం, సంఖ్యా శ్రేణులు, కోడింగ్-డీకోడింగ్ మరియు సంబంధాలు', 1),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Analogy, Classification, Odd One Out and Logical Grouping',
        'సాదృశ్యం, వర్గీకరణ, భిన్నమైన అంశాన్ని గుర్తించడం మరియు తార్కిక సమూహీకరణ', 2),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Direction Sense, Ranking, Order and Sequence Problems',
        'దిశా జ్ఞానం, ర్యాంకింగ్, క్రమం మరియు శ్రేణి సమస్యలు', 3),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Seating Arrangement, Puzzle Test and Logical Arrangements',
        'కూర్చునే అమరికలు, పజిల్ పరీక్ష మరియు తార్కిక అమరికలు', 4),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Data Interpretation, Data Analysis and Data Sufficiency',
        'డేటా విశ్లేషణ, డేటా విశ్లేషణాత్మక పరిశీలన మరియు డేటా సమృద్ధి', 5),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Clocks, Calendars, Cubes, Dice and Non-Verbal Reasoning',
        'గడియారాలు, క్యాలెండర్లు, ఘనాలు, పాచికలు మరియు మౌఖికేతర తార్కికత', 6),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Mental Ability',
        'Quantitative Aptitude, Arithmetic Reasoning and Numerical Ability',
        'పరిమాణాత్మక సామర్థ్యం, అంకగణిత తార్కికత మరియు సంఖ్యా సామర్థ్యం', 7),

      -- Language Ability (5 topics) — now with Telugu translations
      ('APPSC_GROUP_3', v_g3_paper1_id, 'Language Ability',
        'Vocabulary, Synonyms, Antonyms and One-Word Substitutions',
        'పదజాలం, పర్యాయపదాలు, వ్యతిరేక పదాలు మరియు ఏకపద ప్రత్యామ్నాయాలు', 1),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Language Ability',
        'Grammar, Parts of Speech and Error Detection',
        'వ్యాకరణం, పదభేదాలు మరియు దోషాల గుర్తింపు', 2),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Language Ability',
        'Tenses, Voice, Narration and Sentence Improvement',
        'కాలాలు, వాక్యరూప మార్పు, వాక్యనిరూపణ మరియు వాక్య మెరుగుదల', 3),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Language Ability',
        'Idioms, Phrases, Fill in the Blanks, Usage and Sentence Completion',
        'సామెతలు, పదబంధాలు, ఖాళీల పూరణ, సరైన వినియోగం మరియు వాక్య పూర్తి', 4),

      ('APPSC_GROUP_3', v_g3_paper1_id, 'Language Ability',
        'Reading Comprehension, Para Jumbles and Passage-Based Reasoning',
        'పఠన అవగాహన, పేరా జంబుల్స్ మరియు ప్యాసేజ్ ఆధారిత తార్కికత', 5)

    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;

    -- Update Language Ability Telugu translations (were NULL in previous migration)
    UPDATE public.exam_topics SET topic_te = 'పదజాలం, పర్యాయపదాలు, వ్యతిరేక పదాలు మరియు ఏకపద ప్రత్యామ్నాయాలు'
      WHERE exam_id = 'APPSC_GROUP_3' AND paper_id = v_g3_paper1_id
        AND subject_name = 'Language Ability'
        AND topic_en = 'Vocabulary, Synonyms, Antonyms and One-Word Substitutions'
        AND topic_te IS NULL;

    UPDATE public.exam_topics SET topic_te = 'వ్యాకరణం, పదభేదాలు మరియు దోషాల గుర్తింపు'
      WHERE exam_id = 'APPSC_GROUP_3' AND paper_id = v_g3_paper1_id
        AND subject_name = 'Language Ability'
        AND topic_en = 'Grammar, Parts of Speech and Error Detection'
        AND topic_te IS NULL;

    UPDATE public.exam_topics SET topic_te = 'కాలాలు, వాక్యరూప మార్పు, వాక్యనిరూపణ మరియు వాక్య మెరుగుదల'
      WHERE exam_id = 'APPSC_GROUP_3' AND paper_id = v_g3_paper1_id
        AND subject_name = 'Language Ability'
        AND topic_en = 'Tenses, Voice, Narration and Sentence Improvement'
        AND topic_te IS NULL;

    UPDATE public.exam_topics SET topic_te = 'సామెతలు, పదబంధాలు, ఖాళీల పూరణ, సరైన వినియోగం మరియు వాక్య పూర్తి'
      WHERE exam_id = 'APPSC_GROUP_3' AND paper_id = v_g3_paper1_id
        AND subject_name = 'Language Ability'
        AND topic_en = 'Idioms, Phrases, Fill in the Blanks, Usage and Sentence Completion'
        AND topic_te IS NULL;

    UPDATE public.exam_topics SET topic_te = 'పఠన అవగాహన, పేరా జంబుల్స్ మరియు ప్యాసేజ్ ఆధారిత తార్కికత'
      WHERE exam_id = 'APPSC_GROUP_3' AND paper_id = v_g3_paper1_id
        AND subject_name = 'Language Ability'
        AND topic_en = 'Reading Comprehension, Para Jumbles and Passage-Based Reasoning'
        AND topic_te IS NULL;

  END IF;

  -- ── APPSC_GROUP_3 — Paper 2: Contemporary Problems and Development of Rural Society ──

  IF v_g3_paper2_id IS NOT NULL THEN

    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES

      -- Rural Health and Sanitation (4 topics)
      ('APPSC_GROUP_3', v_g3_paper2_id, 'Rural Health and Sanitation',
        'Rural Health Infrastructure, Public Health and Healthcare Delivery in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో గ్రామీణ ఆరోగ్య మౌలిక సదుపాయాలు, ప్రజారోగ్యం మరియు ఆరోగ్య సేవల అందజేత', 1),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Rural Health and Sanitation',
        'Rural Sanitation, Drinking Water, Hygiene and Public Health Awareness in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో గ్రామీణ పారిశుద్ధ్యం, తాగునీరు, పరిశుభ్రత మరియు ప్రజారోగ్య అవగాహన', 2),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Rural Health and Sanitation',
        'Village Development, Rural Infrastructure and Rural Livelihoods in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో గ్రామాభివృద్ధి, గ్రామీణ మౌలిక సదుపాయాలు మరియు గ్రామీణ జీవనోపాధులు', 3),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Rural Health and Sanitation',
        'Women, Children, Nutrition, Social Welfare and Human Development in Rural Andhra Pradesh',
        'గ్రామీణ ఆంధ్రప్రదేశ్లో మహిళలు, పిల్లలు, పోషకాహారం, సామాజిక సంక్షేమం మరియు మానవ అభివృద్ధి', 4),

      -- Social Tensions and Contemporary Problems (5 topics)
      ('APPSC_GROUP_3', v_g3_paper2_id, 'Social Tensions and Contemporary Problems',
        'Social Tensions, Social Conflicts and Social Change in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో సామాజిక ఉద్రిక్తతలు, సామాజిక సంఘర్షణలు మరియు సామాజిక మార్పు', 1),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Social Tensions and Contemporary Problems',
        'Problems of Deprived Groups, Social Justice and Inclusive Development in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో వెనుకబడిన వర్గాల సమస్యలు, సామాజిక న్యాయం మరియు సమగ్ర అభివృద్ధి', 2),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Social Tensions and Contemporary Problems',
        'Multi-Lingual Society, Cultural Diversity, Migration and Social Integration in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో బహుభాషా సమాజం, సాంస్కృతిక వైవిధ్యం, వలసలు మరియు సామాజిక సమైక్యత', 3),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Social Tensions and Contemporary Problems',
        'Unemployment, Youth Issues, Student Unrest and Human Resource Development in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో నిరుద్యోగం, యువత సమస్యలు, విద్యార్థుల అసంతృప్తి మరియు మానవ వనరుల అభివృద్ధి', 4),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Social Tensions and Contemporary Problems',
        'Environment, Development, Globalization, Technology and Contemporary Challenges in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో పర్యావరణం, అభివృద్ధి, ప్రపంచీకరణ, సాంకేతికత మరియు సమకాలీన సవాళ్లు', 5),

      -- Indian Democracy and Democratic Institutions (5 topics)
      ('APPSC_GROUP_3', v_g3_paper2_id, 'Indian Democracy and Democratic Institutions',
        'Indian Constitution, Democratic Values and Constitutional Foundations',
        'భారత రాజ్యాంగం, ప్రజాస్వామ్య విలువలు మరియు రాజ్యాంగ పునాదులు', 1),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Indian Democracy and Democratic Institutions',
        'Union Government, Parliament, Executive and Judiciary',
        'కేంద్ర ప్రభుత్వం, పార్లమెంట్, కార్యనిర్వాహక వ్యవస్థ మరియు న్యాయవ్యవస్థ', 2),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Indian Democracy and Democratic Institutions',
        'State Government, Andhra Pradesh Governance and Democratic Administration',
        'రాష్ట్ర ప్రభుత్వం, ఆంధ్రప్రదేశ్ పరిపాలన మరియు ప్రజాస్వామ్య పాలన', 3),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Indian Democracy and Democratic Institutions',
        'Local Self Government, Panchayati Raj and Decentralized Governance in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో స్థానిక స్వపరిపాలన, పంచాయతీ రాజ్ మరియు వికేంద్రీకృత పాలన', 4),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'Indian Democracy and Democratic Institutions',
        'Elections, Political Parties, Electoral Reforms, Rights-Based Governance and Citizen Participation',
        'ఎన్నికలు, రాజకీయ పార్టీలు, ఎన్నికల సంస్కరణలు, హక్కుల ఆధారిత పాలన మరియు పౌరుల భాగస్వామ్యం', 5),

      -- General Science and Panchayati Raj (4 topics — 2 new ones added)
      ('APPSC_GROUP_3', v_g3_paper2_id, 'General Science and Panchayati Raj',
        'General Science and Everyday Science with Special Reference to Rural Andhra Pradesh',
        'గ్రామీణ ఆంధ్రప్రదేశ్కు ప్రత్యేక సూచనతో సాధారణ విజ్ఞానం మరియు దైనందిన విజ్ఞానం', 1),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'General Science and Panchayati Raj',
        'Panchayati Raj System, Rural Local Governance and Decentralized Administration in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో పంచాయతీ రాజ్ వ్యవస్థ, గ్రామీణ స్థానిక పాలన మరియు వికేంద్రీకృత పరిపాలన', 2),

      -- NEW: 2 topics that were missing from the previous migration
      ('APPSC_GROUP_3', v_g3_paper2_id, 'General Science and Panchayati Raj',
        'Cooperative Institutions, Cooperative Movement and Rural Economy in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో సహకార సంస్థలు, సహకార ఉద్యమం మరియు గ్రామీణ ఆర్థిక వ్యవస్థ', 3),

      ('APPSC_GROUP_3', v_g3_paper2_id, 'General Science and Panchayati Raj',
        'Rural Development, Agricultural Technology, Environmental Science and Sustainable Development in Andhra Pradesh',
        'ఆంధ్రప్రదేశ్లో గ్రామీణ అభివృద్ధి, వ్యవసాయ సాంకేతికత, పర్యావరణ శాస్త్రం మరియు సుస్థిర అభివృద్ధి', 4)

    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;

  END IF;

  -- ── APPSC_GROUP_4 — Paper 1: General Studies & Mental Ability ─────────────

  IF v_g4_paper1_id IS NOT NULL THEN

    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES

      -- General Studies (9 topics)
      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Current Affairs',
        'సమకాలీన వ్యవహారాలు', 1),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'General Science & Technology',
        'సాధారణ విజ్ఞాన శాస్త్రం మరియు సాంకేతిక విజ్ఞానం', 2),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Indian History, National Movement & AP Role',
        'భారత చరిత్ర, జాతీయోద్యమం మరియు ఆంధ్రప్రదేశ్ పాత్ర', 3),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Indian Polity & Governance',
        'భారత రాజ్యాంగ వ్యవస్థ మరియు పాలన', 4),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Indian Economy & Andhra Pradesh Economy',
        'భారత ఆర్థిక వ్యవస్థ మరియు ఆంధ్రప్రదేశ్ ఆర్థిక వ్యవస్థ', 5),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Indian & Andhra Pradesh Geography',
        'భారత మరియు ఆంధ్రప్రదేశ్ భూగోళ శాస్త్రం', 6),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Disaster Management & GIS Applications',
        'విపత్తు నిర్వహణ మరియు GIS అనువర్తనాలు', 7),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Sustainable Development & Environmental Protection',
        'సుస్థిర అభివృద్ధి మరియు పర్యావరణ పరిరక్షణ', 8),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'General Studies',
        'Andhra Pradesh Reorganisation & Post-Bifurcation Issues',
        'ఆంధ్రప్రదేశ్ పునర్వ్యవస్థీకరణ మరియు విభజన అనంతర సమస్యలు', 9),

      -- Mental Ability (5 topics)
      ('APPSC_GROUP_4', v_g4_paper1_id, 'Mental Ability',
        'Logical & Analytical Reasoning',
        'తార్కిక మరియు విశ్లేషణాత్మక తార్కిక సామర్థ్యం', 1),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'Mental Ability',
        'Data Organization & Classification',
        'డేటా వ్యవస్థీకరణ మరియు వర్గీకరణ', 2),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'Mental Ability',
        'Data Visualization & Graphical Representation',
        'డేటా దృశ్యమానీకరణ మరియు గ్రాఫికల్ ప్రాతినిధ్యం', 3),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'Mental Ability',
        'Statistical Measures & Data Analysis',
        'గణాంక ప్రమాణాలు మరియు డేటా విశ్లేషణ', 4),

      ('APPSC_GROUP_4', v_g4_paper1_id, 'Mental Ability',
        'Data Interpretation & Analysis',
        'డేటా విశ్లేషణ మరియు అర్థవ్యాఖ్యానం', 5)

    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;

  END IF;

  -- ── APPSC_GROUP_4 — Paper 2: General English and General Telugu ───────────

  IF v_g4_paper2_id IS NOT NULL THEN

    INSERT INTO public.exam_topics (exam_id, paper_id, subject_name, topic_en, topic_te, display_order) VALUES

      -- General English (3 topics)
      ('APPSC_GROUP_4', v_g4_paper2_id, 'General English',
        'Reading Comprehension & Vocabulary',
        NULL, 1),

      ('APPSC_GROUP_4', v_g4_paper2_id, 'General English',
        'Grammar & Punctuation',
        NULL, 2),

      ('APPSC_GROUP_4', v_g4_paper2_id, 'General English',
        'Idioms, Phrases & Sentence Arrangement',
        NULL, 3),

      -- General Telugu (3 topics)
      ('APPSC_GROUP_4', v_g4_paper2_id, 'General Telugu',
        'Synonyms and Antonyms',
        'పర్యాయపదాలు మరియు వ్యతిరేక పదాలు', 1),

      ('APPSC_GROUP_4', v_g4_paper2_id, 'General Telugu',
        'Telugu Grammar and Meanings',
        'తెలుగు వ్యాకరణం మరియు అర్థాలు', 2),

      ('APPSC_GROUP_4', v_g4_paper2_id, 'General Telugu',
        'Telugu Idioms and Proverbs',
        'తెలుగు జాతీయాలు మరియు సామెతలు', 3)

    ON CONFLICT (exam_id, paper_id, subject_name, topic_en) DO NOTHING;

  END IF;

  RAISE NOTICE 'Topic seeding complete.';
  RAISE NOTICE '  Group 3 Paper 1 ID: %', v_g3_paper1_id;
  RAISE NOTICE '  Group 3 Paper 2 ID: %', v_g3_paper2_id;
  RAISE NOTICE '  Group 4 Paper 1 ID: %', v_g4_paper1_id;
  RAISE NOTICE '  Group 4 Paper 2 ID: %', v_g4_paper2_id;

END $$;
