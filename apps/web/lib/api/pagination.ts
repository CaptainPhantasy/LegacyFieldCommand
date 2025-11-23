/**
 * Cursor-based pagination utilities
 * Replaces offset-based pagination for better performance at scale
 */

import { NextRequest } from 'next/server';

/**
 * Cursor pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string; // ISO timestamp or UUID
  limit?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Parse cursor pagination from request
 */
export function parseCursorPagination(request: NextRequest): {
  cursor?: string;
  limit: number;
  direction: 'forward' | 'backward';
} {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const direction = searchParams.get('direction') === 'backward' ? 'backward' : 'forward';

  return { cursor, limit, direction };
}

/**
 * Cursor pagination result
 */
export interface CursorPaginationResult<T> {
  items: T[];
  pagination: {
    cursor: string | null;
    limit: number;
    hasMore: boolean;
    direction: 'forward' | 'backward';
  };
}

/**
 * Create cursor from item (using created_at timestamp or id)
 */
export function createCursor(item: { created_at: string; id: string }): string {
  // Use ISO timestamp as cursor for better performance
  return item.created_at;
}

/**
 * Create cursor from timestamp
 */
export function createCursorFromTimestamp(timestamp: string): string {
  return timestamp;
}

/**
 * Parse cursor to timestamp
 */
export function parseCursor(cursor: string): Date {
  return new Date(cursor);
}

/**
 * Build pagination response
 */
export function buildCursorPaginationResponse<T extends { created_at: string; id: string }>(
  items: T[],
  limit: number,
  direction: 'forward' | 'backward'
): CursorPaginationResult<T> {
  // Check if we have more items (fetched limit + 1)
  const hasMore = items.length > limit;
  const paginatedItems = hasMore ? items.slice(0, limit) : items;

  // Get cursor from last item
  const cursor = paginatedItems.length > 0
    ? createCursor(paginatedItems[paginatedItems.length - 1])
    : null;

  return {
    items: paginatedItems,
    pagination: {
      cursor,
      limit,
      hasMore,
      direction,
    },
  };
}

