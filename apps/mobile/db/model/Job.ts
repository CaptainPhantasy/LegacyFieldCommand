import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Job extends Model {
  static table = 'jobs';
  static associations = {
    job_gates: { type: 'has_many', foreignKey: 'job_id' },
    job_photos: { type: 'has_many', foreignKey: 'job_id' },
  } as const;

  @field('title') title!: string;
  @field('account_id') accountId!: string | null;
  @field('status') status!: string;
  @field('address_line_1') addressLine1!: string | null;
  @field('city') city!: string | null;
  @field('state') state!: string | null;
  @field('zip_code') zipCode!: string | null;
  @field('lead_tech_id') leadTechId!: string | null;
  @field('estimator_id') estimatorId!: string | null;
  @date('created_at') createdAt!: number;
  @date('updated_at') updatedAt!: number;

  @children('job_gates') gates;
  @children('job_photos') photos;
}

