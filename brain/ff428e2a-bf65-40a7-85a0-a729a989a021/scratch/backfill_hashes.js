const { createClient } = require('@supabase/supabase-client');
const crypto = require('crypto');

// Normalization function (must match app side exactly)
const normalize = (str) =>
  str?.toString().trim().toLowerCase().replace(/\s+/g, ' ') || '';

async function generateQuestionHash(question) {
  const baseString = [
    normalize(question.question_text),
    normalize(question.option_a),
    normalize(question.option_b),
    normalize(question.option_c),
    normalize(question.option_d),
    normalize(question.correct_option),
    normalize(question.exam_id),
  ].join('|');

  return crypto.createHash('sha256').update(baseString).digest('hex');
}

// Config - replace with actual env vars if needed, but I'll hardcode for this one-off
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function backfill() {
  console.log('Starting backfill...');
  
  while (true) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, exam_id')
      .is('content_hash', null)
      .limit(100);

    if (error) {
      console.error('Error fetching questions:', error);
      break;
    }

    if (!questions || questions.length === 0) {
      console.log('Backfill complete!');
      break;
    }

    console.log(`Processing batch of ${questions.length}...`);

    for (const q of questions) {
      const hash = await generateQuestionHash(q);
      const { error: updateError } = await supabase
        .from('questions')
        .update({ content_hash: hash })
        .eq('id', q.id);

      if (updateError) {
        console.error(`Error updating question ${q.id}:`, updateError);
      }
    }
  }
}

backfill();
