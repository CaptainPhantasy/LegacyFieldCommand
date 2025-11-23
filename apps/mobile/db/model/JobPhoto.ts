import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class JobPhoto extends Model {
  static table = 'job_photos';
  static associations = {
    jobs: { type: 'belongs_to', key: 'job_id' },
    job_gates: { type: 'belongs_to', key: 'gate_id' },
  } as const;

  @relation('jobs', 'job_id') job;
  @relation('job_gates', 'gate_id') gate;

  @field('taken_by') takenBy!: string | null;
  @field('storage_path') storagePath!: string;
  @field('metadata') metadata!: string; // JSON string
  @field('is_ppe') isPpe!: boolean;
  @date('created_at') createdAt!: number;
}

