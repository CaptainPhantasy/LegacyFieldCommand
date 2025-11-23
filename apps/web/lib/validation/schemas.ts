/**
 * Zod schemas for API request validation
 */

import { z } from 'zod';
import { uuidSchema, emailSchema, userRoleSchema, jobStatusSchema } from './common';

/**
 * Create Job Schema
 */
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  address_line_1: z.string().min(1).max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, 'State must be 2 characters').optional(),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code format').optional(),
  lead_tech_id: uuidSchema.optional(),
  estimator_id: uuidSchema.optional(),
  status: jobStatusSchema.optional(),
  account_id: uuidSchema.optional(),
});

/**
 * Update Job Schema
 */
export const updateJobSchema = createJobSchema.partial();

/**
 * Assign Job Schema
 */
export const assignJobSchema = z.object({
  lead_tech_id: uuidSchema.optional(),
  estimator_id: uuidSchema.optional(),
});

/**
 * Create User Schema
 */
export const createUserSchema = z.object({
  email: emailSchema,
  full_name: z.string().min(1).max(200).optional(),
  role: userRoleSchema,
});

/**
 * Update User Schema
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  full_name: z.string().min(1).max(200).optional(),
  role: userRoleSchema.optional(),
});

/**
 * File Upload Schema (for validation in API)
 */
export const fileUploadSchema = z.object({
  jobId: uuidSchema,
  gateId: uuidSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Photo Upload Schema
 */
export const photoUploadSchema = fileUploadSchema.extend({
  room: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * Policy Upload Schema
 */
export const policyUploadSchema = z.object({
  jobId: uuidSchema,
  policyNumber: z.string().min(1).max(100).optional(),
  carrier: z.string().max(200).optional(),
});

/**
 * Gate Completion Schema
 */
export const completeGateSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
  exception_reason: z.string().min(1).max(1000).optional(),
});

/**
 * Create Estimate Schema
 */
export const createEstimateSchema = z.object({
  jobId: uuidSchema,
  totalAmount: z.number().positive().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).optional(),
});

/**
 * Send Email Schema
 */
export const sendEmailSchema = z.object({
  to: z.array(emailSchema).min(1),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  templateId: uuidSchema.optional(),
  jobId: uuidSchema.optional(),
});

/**
 * Create Alert Schema
 */
export const createAlertSchema = z.object({
  jobId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  type: z.enum(['warning', 'error', 'info']),
  message: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

