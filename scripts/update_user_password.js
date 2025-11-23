import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anwltpsdedfvkbscyylk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud2x0cHNkZWRmdmtic2N5eWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MTgwMiwiZXhwIjoyMDc5MTY3ODAyfQ.H7xF9yonUAj2Gkj0y8fPSAicFkU--efKXxpOAAO8c9c';

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

