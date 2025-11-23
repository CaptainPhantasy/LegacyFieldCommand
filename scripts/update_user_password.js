import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserPassword() {
  // First, get the user by email
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === 'test@legacyfield.com');
  
  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Found user:', user.id, user.email);

  // Update the user's password
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      password: 'TestPass123!',
      email_confirm: true
    }
  );

  if (error) {
    console.error('Error updating user:', error);
    return;
  }

  console.log('User password updated successfully');
}

updateUserPassword();

