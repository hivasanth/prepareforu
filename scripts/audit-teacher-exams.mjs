import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('C:/Users/Vasanth/Desktop/PrepareForU/.env', 'utf8');
const envMap = {};
env.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim();
    if (k && !k.startsWith('#')) envMap[k] = v;
  }
});

const supabase = createClient(
  envMap.VITE_SUPABASE_URL,
  envMap.VITE_SUPABASE_ANON_KEY
);

// Use a "schema probe" approach: insert a dummy row with a clearly invalid value,
// then drop it. We can detect the set of NOT NULL columns from the error message.
// But cleaner: query information_schema if RLS allows it via a SECURITY DEFINER function.
// We don't have such a function exposed, so use a different approach:
// Use a test query that returns 0 rows but forces an error on a non-existent column to
// confirm column types from the error message.

async function main() {
  // 1. Try to insert a row with all fields possible -> we'll get a "violates not-null" 
  // back, listing required columns.
  const ins = await supabase.from('teacher_exams').insert({}).select('*');
  console.log('teacher_exams insert empty ->', JSON.stringify(ins.error || ins.data, null, 2));
  const ins2 = await supabase.from('teacher_exam_questions').insert({}).select('*');
  console.log('teacher_exam_questions insert empty ->', JSON.stringify(ins2.error || ins2.data, null, 2));
  const ins3 = await supabase.from('attempts').insert({}).select('*');
  console.log('attempts insert empty ->', JSON.stringify(ins3.error || ins3.data, null, 2));

  // 2. Probe a column
  const c = await supabase.from('teacher_exams').select('nonexistent_xyz').limit(1);
  console.log('bad col probe ->', JSON.stringify(c.error || c.data, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
