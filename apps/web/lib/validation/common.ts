/**
 * Common validation patterns and utilities
 */

import { z } from 'zod';

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  direction: z.enum(['forward', 'backward']).optional(),
});

/**
 * Sort parameters
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

/**
 * User role validation
 */
export const userRoleSchema = z.enum([
  'field_tech',
  'lead_tech',
  'estimator',
  'admin',
  'owner',
  'program_admin',
]);

/**
 * Job status validation
 */
export const jobStatusSchema = z.enum([
  'lead',
  'inspection_scheduled',
  'job_created',
  'active_work',
  'ready_to_invoice',
  'paid',
  'closed',
]);

