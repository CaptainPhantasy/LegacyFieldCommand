# API Standards & Patterns

## Validation Pattern

All API routes should use Zod validation:

```typescript
import { validateRequest } from '@/lib/validation/validator';
import { createJobSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, createJobSchema);
  if (error) return errorResponse(error);
  
  // Use validated data
  const { title, address_line_1, ... } = data;
}
```

## Error Handling Pattern

All errors should use sanitized error handler:

```typescript
import { sanitizeError } from '@/lib/api/error-handler';

try {
  // ... operation
} catch (error) {
  const { userMessage, errorCode } = sanitizeError(error, 'context');
  return errorResponse(new ApiError(userMessage, 500, errorCode));
}
```

## Rate Limiting

Rate limiting is handled in middleware automatically. No action needed in routes.

## CORS

CORS is handled in middleware automatically. No action needed in routes.

## Pagination Pattern

Use cursor-based pagination:

```typescript
import { parseCursorPagination } from '@/lib/api/pagination';

export async function GET(request: NextRequest) {
  const { cursor, limit, direction } = parseCursorPagination(request);
  
  let query = supabase
    .from('table')
    .select('*')
    .order('created_at', { ascending: direction === 'backward' })
    .limit(limit + 1);
  
  if (cursor) {
    query = query[direction === 'forward' ? 'gt' : 'lt']('created_at', cursor);
  }
  
  const { data, error } = await query;
  // ... handle response
}
```

## Cache Headers

Add cache headers to GET endpoints:

```typescript
import { getCacheHeaders } from '@/lib/api/cache-headers';

export async function GET(request: NextRequest) {
  const data = await fetchData();
  return NextResponse.json(data, {
    headers: getCacheHeaders(300), // 5 minutes
  });
}
```

