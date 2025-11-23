/**
 * Request validation middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { errorResponse } from '@/lib/api/middleware';

/**
 * Validation result
 */
export interface ValidationResult<T> {
  data?: T;
  error?: NextResponse;
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    let body: unknown;

    // Try to parse JSON body
    try {
      body = await request.json();
    } catch (e) {
      return {
        error: errorResponse(
          new Error('Invalid JSON in request body'),
          400,
          'INVALID_JSON'
        ),
      };
    }

    // Validate against schema
    const data = schema.parse(body);

    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors into user-friendly messages
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path ? `${path}: ` : ''}${err.message}`;
      });

      return {
        error: NextResponse.json(
          {
            error: true,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      error: errorResponse(
        error instanceof Error ? error : new Error('Validation error'),
        400,
        'VALIDATION_ERROR'
      ),
    };
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = schema.parse(params);

    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path ? `${path}: ` : ''}${err.message}`;
      });

      return {
        error: NextResponse.json(
          {
            error: true,
            message: 'Query parameter validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      error: errorResponse(
        error instanceof Error ? error : new Error('Validation error'),
        400,
        'VALIDATION_ERROR'
      ),
    };
  }
}

/**
 * Validate path parameters (from route segments)
 */
export function validateParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    // Convert params to plain object
    const plainParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        plainParams[key] = value[0];
      } else if (value !== undefined) {
        plainParams[key] = value;
      }
    }

    const data = schema.parse(plainParams);

    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path ? `${path}: ` : ''}${err.message}`;
      });

      return {
        error: NextResponse.json(
          {
            error: true,
            message: 'Path parameter validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      error: errorResponse(
        error instanceof Error ? error : new Error('Validation error'),
        400,
        'VALIDATION_ERROR'
      ),
    };
  }
}

