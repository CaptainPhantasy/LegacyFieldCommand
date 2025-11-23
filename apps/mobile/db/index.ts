import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import Job from './model/Job';
import JobGate from './model/JobGate';
import JobPhoto from './model/JobPhoto';

const adapter = new SQLiteAdapter({
  schema,
  // migrations, // We'll add migrations later when we change schema
  jsi: true, // Faster adapter
  onSetUpError: error => {
    console.error("Database failed to load", error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    Job,
    JobGate,
    JobPhoto,
  ],
});

