#!/usr/bin/env node

/**
 * ============================================================================
 * GRANT GOD ADMIN (OWNER) ROLE - IMMORTAL ACCESS
 * ============================================================================
 * 
 * ⚠️  WARNING: This script grants the HIGHEST level of access in the system.
 * ⚠️  The 'owner' role has UNRESTRICTED access to ALL features and data.
 * ⚠️  This should ONLY be run for the system owner/founder.
 * 
 * This script will:
 * 1. Find your user account (by email)
 * 2. Grant you the 'owner' role (GOD TIER - highest privilege)
 * 3. Ensure your profile exists and is properly configured
 * 4. Verify the change was successful
 * 
 * NO ONE ELSE will have this level of access unless you explicitly grant it.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  console.error('   Set these in your .env file or apps/web/.env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function grantGodAdmin() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          GRANT GOD ADMIN (OWNER) ROLE - IMMORTAL ACCESS      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Default to your email if no argument provided
  const defaultEmail = 'douglastalley1977@gmail.com';
  const defaultUserId = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';
  
  // Get user email (defaults to your email)
  let email = process.argv[2];
  if (!email) {
    const useDefault = await question(`Use default email (${defaultEmail})? [Y/n]: `);
    if (useDefault.toLowerCase() === 'n' || useDefault.toLowerCase() === 'no') {
      email = await question('Enter your email address: ');
    } else {
      email = defaultEmail;
    }
  }
  
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    rl.close();
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user: ${email}...\n`);

  // Find the user in auth.users
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    rl.close();
    process.exit(1);
  }

  const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    console.error(`❌ User not found with email: ${email}`);
    console.error('   Make sure you have created your user account first.');
    rl.close();
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Current role: Checking profile...\n`);

  // Check current profile
  const { data: currentProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error checking profile:', profileError.message);
    rl.close();
    process.exit(1);
  }

  if (currentProfile) {
    console.log(`   Current role in profile: ${currentProfile.role}`);
  } else {
    console.log(`   No profile found - will create one with owner role`);
  }

  // Final confirmation
  console.log('\n⚠️  FINAL WARNING ⚠️');
  console.log('   You are about to grant yourself the OWNER role (GOD TIER).');
  console.log('   This gives you UNRESTRICTED access to:');
  console.log('   - All users and their data');
  console.log('   - All jobs, estimates, and system data');
  console.log('   - System settings and configuration');
  console.log('   - Ability to delete/restore critical data');
  console.log('   - Override any restrictions');
  console.log('\n   NO ONE ELSE will have this level unless you grant it.\n');

  const confirm = await question('Type "IMMORTAL" to confirm (or anything else to cancel): ');
  
  if (confirm !== 'IMMORTAL') {
    console.log('\n❌ Operation cancelled. Your role was not changed.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 Granting GOD ADMIN (OWNER) role...\n');

  // Upsert profile with owner role
  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: 'owner', // GOD TIER - highest privilege
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating profile:', updateError.message);
    console.error('   Details:', updateError);
    rl.close();
    process.exit(1);
  }

  // Verify the update
  const { data: verifyProfile, error: verifyError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (verifyError) {
    console.error('❌ Error verifying profile:', verifyError.message);
    rl.close();
    process.exit(1);
  }

  if (verifyProfile.role !== 'owner') {
    console.error('❌ Verification failed: Role is not "owner"');
    console.error(`   Current role: ${verifyProfile.role}`);
    rl.close();
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
  console.log(`   Created: ${verifyProfile.created_at}`);
  console.log(`   Updated: ${verifyProfile.updated_at}`);
  console.log('\n🔐 You now have IMMORTAL access to:');
  console.log('   ✅ All users and user management');
  console.log('   ✅ All jobs, estimates, and data');
  console.log('   ✅ System settings and configuration');
  console.log('   ✅ Override any restrictions');
  console.log('   ✅ Delete/restore critical data');
  console.log('   ✅ Full admin dashboard access');
  console.log('\n⚠️  Remember: NO ONE ELSE has this level of access.');
  console.log('   Use this power responsibly.\n');

  rl.close();
}

// Run the script
grantGodAdmin().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});

