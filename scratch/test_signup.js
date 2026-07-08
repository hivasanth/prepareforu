import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbjhlfwqmcyatblsrhxn.supabase.co';
const supabaseKey = 'sb_publishable_AQ69S4tbFMyj3yXQVVal2g_xtTsyyJK'; // from .env

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Probing check_user_exists RPC...');
  const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', { p_email: 'vasanth_test123@gmail.com' });
  console.log('check_user_exists result:', { exists, checkError });

  console.log('Attempting signUp...');
  try {
    const res = await supabase.auth.signUp({
      email: 'vasanth_test123@gmail.com',
      password: 'Password123!',
      options: {
        captchaToken: '1x00000000000000000000AA',
        data: {
          full_name: 'Test Nonexistent',
          exam_selection: 'NEET'
        }
      }
    });
    console.log('signUp completed:', res);
  } catch (err) {
    console.error('signUp threw exception:', err);
  }
}

run();
