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

For query parameters:
```typescript
import { validateQuery } from '@/lib/validation/validator';

const querySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const { data, error } = validateQuery(request, querySchema);
  if (error) return errorResponse(error);
  // Use validated query params
}
```

For path parameters:
```typescript
import { validateParams } from '@/lib/validation/validator';

const paramsSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const { data, error } = validateParams({ jobId }, paramsSchema);
  if (error) return errorResponse(error);
  // Use validated params
}
```

## Error Handling Pattern

All errors should use sanitized error handler:

```typescript
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';

try {
  // ... operation
} catch (error) {
  const sanitized = sanitizeError(error, 'GET /api/endpoint');
  return errorResponse(createApiErrorFromSanitized(sanitized));
}
```

## Rate Limiting

Rate limiting is handled in middleware automatically. No action needed in routes.

## CORS

CORS is handled in middleware automatically. No action needed in routes.

## Pagination Pattern

Use offset-based pagination for list endpoints:

```typescript
import { validateQuery } from '@/lib/validation/validator';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const { data } = validateQuery(request, listQuerySchema);
  const { limit = 50, offset = 0 } = data || {};
  
  const { data: items, error, count } = await supabase
    .from('table')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return NextResponse.json({
    success: true,
    data: {
      items: items || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
  });
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

Recommended cache durations:
- List endpoints: 60 seconds (1 minute)
- Detail endpoints: 60 seconds (1 minute)
- Dashboard/metrics: 300 seconds (5 minutes)
- Static data: 3600 seconds (1 hour)

## File Upload Pattern

For file uploads, use FormData and validate file type/size:

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('File is required', 400, 'VALIDATION_ERROR');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new ApiError('File must be an image', 400, 'VALIDATION_ERROR');
    }

    // Validate file size (max 10MB for images, 50MB for PDFs)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new ApiError('File size must be less than 10MB', 400, 'VALIDATION_ERROR');
    }

    // Generate storage path
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const storagePath = `folder/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-name')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new ApiError(`Upload failed: ${uploadError.message}`, 500, 'UPLOAD_ERROR');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bucket-name')
      .getPublicUrl(storagePath);

    // Update database record
    const { data: updated, error } = await supabase
      .from('table')
      .update({ image_storage_path: storagePath })
      .eq('id', id)
      .select()
      .single();

    return successResponse({
      ...updated,
      storage_url: urlData.publicUrl,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/endpoint/upload');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}
```

## Sync Pattern

For integration/sync endpoints, use the sync service:

```typescript
import { syncJobToBoard, syncBoardToJob } from '@/lib/integration/sync-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { jobId } = await params;

    // Validate optional body
    const validationResult = await validateRequest(request, z.object({
      board_id: z.string().uuid().optional(),
      force: z.boolean().optional(),
    }));

    // Verify access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Perform sync
    const syncResult = await syncJobToBoard(
      jobId,
      validationResult.data?.board_id || null,
      supabase,
      user.id
    );

    if (!syncResult.success) {
      throw new ApiError(
        syncResult.error || 'Sync failed',
        500,
        'SYNC_ERROR'
      );
    }

    // Return synced entity
    return successResponse({
      board_item_id: syncResult.board_item_id,
      synced_at: syncResult.synced_at,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/sync');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}
```

## Access Control Pattern

Always verify access via job/board relationships:

```typescript
// For job-related resources
const { data: job } = await supabase
  .from('jobs')
  .select('id, lead_tech_id')
  .eq('id', job_id)
  .single();

if (!job) {
  throw new ApiError('Job not found', 404, 'NOT_FOUND');
}

if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
  throw new ApiError('Forbidden', 403, 'FORBIDDEN');
}

// For board-related resources
const { data: board } = await supabase
  .from('boards')
  .select('id, account_id')
  .eq('id', board_id)
  .single();

if (!board) {
  throw new ApiError('Board not found', 404, 'NOT_FOUND');
}
```

## Response Format

All endpoints should return consistent response format:

Success:
```typescript
{
  success: true,
  data: { ... }
}
```

Error:
```typescript
{
  error: true,
  message: string,
  code: string,
  statusCode: number
}
```

## Conflict Handling

For resources with unique constraints, check before creating:

```typescript
// Check for existing resource
const { data: existing } = await supabase
  .from('table')
  .select('id')
  .eq('unique_field', value)
  .single();

if (existing) {
  throw new ApiError('Resource already exists', 409, 'CONFLICT');
}
```

## Position/Ordering Pattern

For resources with position/ordering:

```typescript
// Get max position if not provided
let position = data.position;
if (position === undefined) {
  const { data: maxItem } = await supabase
    .from('table')
    .select('position')
    .eq('parent_id', parentId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  position = maxItem ? (maxItem.position as number) + 1 : 0;
}
```

## Date Validation

For date fields, use string date format:

```typescript
const schema = z.object({
  date_field: z.string().date('Invalid date'),
  // or for optional dates
  optional_date: z.string().date().optional(),
});
```

## UUID Validation

Always validate UUIDs in path and query parameters:

```typescript
const schema = z.object({
  id: z.string().uuid('Invalid ID'),
});
```

## Optional Request Bodies

For endpoints with optional request bodies:

```typescript
const optionalBodySchema = z.object({
  field: z.string().optional(),
}).optional();

// Validate only if body exists
let bodyData = null;
try {
  const body = await request.json();
  bodyData = optionalBodySchema.parse(body);
} catch {
  // Body is optional, continue
}
```

## Batch Operations

For batch operations, process items individually and return results:

```typescript
const results = [];
for (const item of items) {
  try {
    const { data, error } = await supabase
      .from('table')
      .insert(item)
      .select()
      .single();
    
    results.push({ success: true, data });
  } catch (error) {
    results.push({ success: false, error: error.message });
  }
}

return successResponse({ results });
```
