import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anwltpsdedfvkbscyylk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud2x0cHNkZWRmdmtic2N5eWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MTgwMiwiZXhwIjoyMDc5MTY3ODAyfQ.H7xF9yonUAj2Gkj0y8fPSAicFkU--efKXxpOAAO8c9c';

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

