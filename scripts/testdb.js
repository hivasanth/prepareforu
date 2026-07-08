import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('exam_papers').select('exam_id');
  const distinct = [...new Set(data.map(d => d.exam_id))];
  console.log('Distinct exams in Papers:', distinct);
}
check();
