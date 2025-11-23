import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'jobs',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'account_id', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'address_line_1', type: 'string', isOptional: true },
        { name: 'city', type: 'string', isOptional: true },
        { name: 'state', type: 'string', isOptional: true },
        { name: 'zip_code', type: 'string', isOptional: true },
        { name: 'lead_tech_id', type: 'string', isOptional: true },
        { name: 'estimator_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'job_gates',
      columns: [
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'stage_name', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'completed_by', type: 'string', isOptional: true },
        { name: 'requires_exception', type: 'boolean' },
        { name: 'exception_reason', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'job_photos',
      columns: [
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'gate_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'taken_by', type: 'string', isOptional: true },
        { name: 'storage_path', type: 'string' },
        { name: 'metadata', type: 'string', isOptional: true },
        { name: 'is_ppe', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});

