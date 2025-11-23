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

async function createFieldTech() {
  // Check if user exists
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.users.find(u => u.email === 'tech@legacyfield.com');
  
  if (existingUser) {
    // Update role
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'field_tech' })
      .eq('id', existingUser.id);
    console.log('Updated existing user to field_tech');
    return;
  }

  // Create new user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'tech@legacyfield.com',
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Field Tech User'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  // Update profile role
  await supabaseAdmin
    .from('profiles')
    .update({ role: 'field_tech' })
    .eq('id', data.user.id);

  console.log('Field tech user created:', data.user.email);
}

createFieldTech();

