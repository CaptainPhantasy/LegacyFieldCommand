import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from root or apps/web/.env.local
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'test@legacyfield.com',
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('User created successfully:', data.user?.email);
}

createTestUser();

