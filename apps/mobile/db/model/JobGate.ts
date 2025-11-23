import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class JobGate extends Model {
  static table = 'job_gates';
  static associations = {
    jobs: { type: 'belongs_to', key: 'job_id' },
  } as const;

  @relation('jobs', 'job_id') job;

  @field('stage_name') stageName!: string;
  @field('status') status!: string;
  @date('completed_at') completedAt!: number | null;
  @field('completed_by') completedBy!: string | null;
  @field('requires_exception') requiresException!: boolean;
  @field('exception_reason') exceptionReason!: string | null;
  @date('created_at') createdAt!: number;
}

