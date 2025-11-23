#!/usr/bin/env node

/**
 * ============================================================================
 * QUICK GRANT GOD ADMIN - IMMORTAL ACCESS (YOUR ACCOUNT)
 * ============================================================================
 * 
 * This is a quick version that uses your specific user ID.
 * No prompts, just run it and confirm.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// YOUR USER INFORMATION
const YOUR_USER_ID = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';
const YOUR_EMAIL = 'douglastalley1977@gmail.com';
const YOUR_NAME = 'Douglas Talley';

async function grantGodAdminQuick() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       QUICK GRANT GOD ADMIN (OWNER) - IMMORTAL ACCESS         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`👤 User: ${YOUR_EMAIL}`);
  console.log(`🆔 ID: ${YOUR_USER_ID}\n`);

  // Check current profile
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', YOUR_USER_ID)
    .single();

  if (currentProfile) {
    console.log(`📊 Current role: ${currentProfile.role}`);
  }

  console.log('\n🚀 Granting GOD ADMIN (OWNER) role...\n');

  // Upsert profile with owner role
  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: YOUR_USER_ID,
      email: YOUR_EMAIL,
      full_name: YOUR_NAME,
      role: 'owner', // GOD TIER - highest privilege
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating profile:', updateError.message);
    process.exit(1);
  }

  // Verify the update
  const { data: verifyProfile, error: verifyError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', YOUR_USER_ID)
    .single();

  if (verifyError) {
    console.error('❌ Error verifying profile:', verifyError.message);
    process.exit(1);
  }

  if (verifyProfile.role !== 'owner') {
    console.error('❌ Verification failed: Role is not "owner"');
    console.error(`   Current role: ${verifyProfile.role}`);
    process.exit(1);
  }

  // Success!
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ SUCCESS! ✅                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log('🎉 You have been granted GOD ADMIN (OWNER) role!');
  console.log('\n📋 Your Profile:');
  console.log(`   Email: ${verifyProfile.email}`);
  console.log(`   Name: ${verifyProfile.full_name || 'Not set'}`);
  console.log(`   Role: ${verifyProfile.role} ⭐ (GOD TIER)`);
  console.log(`   User ID: ${verifyProfile.id}`);
  console.log(`   Updated: ${verifyProfile.updated_at}`);
  console.log('\n🔐 You now have IMMORTAL access to everything!\n');
}

// Run the script
grantGodAdminQuick().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

