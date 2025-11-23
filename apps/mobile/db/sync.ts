import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { supabase } from '../lib/supabase';

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const timestamp = lastPulledAt ? new Date(lastPulledAt).toISOString() : new Date(0).toISOString();
      
      // Fetch changed Jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .gt('updated_at', timestamp);
        
      if (jobsError) throw new Error(jobsError.message);
      
      // Fetch changed Gates
      const { data: gates, error: gatesError } = await supabase
        .from('job_gates')
        .select('*')
        .gt('updated_at', timestamp);
        
      if (gatesError) throw new Error(gatesError.message);
      
      // Fetch changed Photos
      const { data: photos, error: photosError } = await supabase
        .from('job_photos')
        .select('*')
        .gt('updated_at', timestamp);

      if (photosError) throw new Error(photosError.message);

      // For first sync (lastPulledAt is null), all records are "created"
      // For subsequent syncs, use updated_at to determine created vs updated
      const isFirstSync = !lastPulledAt;
      
      return {
        changes: {
          jobs: {
            created: isFirstSync 
              ? jobs 
              : jobs.filter(j => new Date(j.updated_at || j.created_at).getTime() > lastPulledAt),
            updated: isFirstSync 
              ? [] 
              : jobs.filter(j => new Date(j.updated_at || j.created_at).getTime() <= lastPulledAt && new Date(j.updated_at || j.created_at).getTime() > (lastPulledAt - 86400000)), // Updated in last 24h
            deleted: [],
          },
          job_gates: {
            created: isFirstSync 
              ? gates 
              : gates.filter(g => new Date(g.updated_at || g.created_at).getTime() > lastPulledAt),
            updated: isFirstSync 
              ? [] 
              : gates.filter(g => new Date(g.updated_at || g.created_at).getTime() <= lastPulledAt && new Date(g.updated_at || g.created_at).getTime() > (lastPulledAt - 86400000)),
            deleted: [],
          },
          job_photos: {
             created: isFirstSync 
               ? photos 
               : photos.filter(p => new Date(p.updated_at || p.created_at).getTime() > lastPulledAt),
             updated: isFirstSync 
               ? [] 
               : photos.filter(p => new Date(p.updated_at || p.created_at).getTime() <= lastPulledAt && new Date(p.updated_at || p.created_at).getTime() > (lastPulledAt - 86400000)),
             deleted: [],
          }
        },
        timestamp: Date.now(),
      };
    },
    pushChanges: async ({ changes }) => {
        // Simplified Push: Just Insert/Update
        // Note: Real production apps need conflict resolution and batching
        
        const jobs = (changes as any).jobs || { created: [], updated: [], deleted: [] };
        const job_gates = (changes as any).job_gates || { created: [], updated: [], deleted: [] };
        const job_photos = (changes as any).job_photos || { created: [], updated: [], deleted: [] };
        
        // 1. Push Jobs
        if (jobs.created.length > 0) {
            await supabase.from('jobs').insert(jobs.created);
        }
        if (jobs.updated.length > 0) {
            for (const job of jobs.updated) {
                await supabase.from('jobs').update(job).eq('id', job.id);
            }
        }
        
        // 2. Push Gates
        if (job_gates.created.length > 0) {
            await supabase.from('job_gates').insert(job_gates.created);
        }
        if (job_gates.updated.length > 0) {
             for (const gate of job_gates.updated) {
                await supabase.from('job_gates').update(gate).eq('id', gate.id);
            }
        }
        
        // 3. Push Photos
        if (job_photos.created.length > 0) {
             await supabase.from('job_photos').insert(job_photos.created);
        }
        // Photos rarely update, but if they do:
        if (job_photos.updated.length > 0) {
             for (const photo of job_photos.updated) {
                await supabase.from('job_photos').update(photo).eq('id', photo.id);
            }
        }
    },
  });
}

