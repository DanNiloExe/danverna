
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qfjmmsuqrgshyrbgrqcw.supabase.co';

const SUPABASE_KEY = 'sb_publishable_fTFf6wtAHmBGzXlNDRcICA_ntHE3a8K';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
