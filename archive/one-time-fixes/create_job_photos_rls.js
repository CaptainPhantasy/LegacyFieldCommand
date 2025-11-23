import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://anwltpsdedfvkbscyylk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud2x0cHNkZWRmdmtic2N5eWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MTgwMiwiZXhwIjoyMDc5MTY3ODAyfQ.H7xF9yonUAj2Gkj0y8fPSAicFkU--efKXxpOAAO8c9c';

async function createRLSPolicies() {
  const policies = [
    {
      name: 'Techs insert photos for assigned jobs',
      sql: `create policy if not exists "Techs insert photos for assigned jobs"
        on job_photos for insert
        with check (
          exists (
            select 1 from jobs
            where jobs.id = job_photos.job_id
            and jobs.lead_tech_id = auth.uid()
          )
        );`
    },
    {
      name: 'Techs view photos for assigned jobs',
      sql: `create policy if not exists "Techs view photos for assigned jobs"
        on job_photos for select
        using (
          exists (
            select 1 from jobs
            where jobs.id = job_photos.job_id
            and jobs.lead_tech_id = auth.uid()
          )
        );`
    },
    {
      name: 'Admins view all photos',
      sql: `create policy if not exists "Admins view all photos"
        on job_photos for select
        using (
          exists (
            select 1 from profiles
            where profiles.id = auth.uid() 
            and profiles.role in ('admin', 'owner', 'estimator')
          )
        );`
    }
  ];

  for (const policy of policies) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql: policy.sql })
      });
      
      if (response.ok) {
        console.log(`✅ ${policy.name}`);
      } else {
        const text = await response.text();
        console.log(`❌ ${policy.name}:`, text);
      }
    } catch (error) {
      console.log(`❌ ${policy.name}:`, error.message);
    }
  }
}

// Use Supabase client to run SQL directly
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSQL(sql) {
  // Try using postgrest-js or direct SQL
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) throw error;
    return data;
  } catch (e) {
    // Fallback: use REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    return await response.json();
  }
}

// Actually, let's just use the Management API or tell user to run SQL
console.log('Run this SQL in Supabase SQL Editor:');
console.log('\n' + policies.map(p => p.sql).join('\n\n'));

