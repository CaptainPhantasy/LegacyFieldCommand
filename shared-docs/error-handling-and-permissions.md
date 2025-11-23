# Error Handling and Permission Denials

## Overview

The application has a comprehensive error handling system that provides **gentle, user-friendly error messages** based on user roles and privilege levels.

## Error Handling Architecture

### 1. **API-Level Error Handling**

**Location**: `lib/api/middleware.ts`, `lib/api/error-handler.ts`, `lib/api/error-messages.ts`

**Features**:
- Standardized `ApiError` class with status codes
- User-friendly error messages mapped to error codes
- Sanitized error responses (detailed errors logged server-side, generic messages sent to client)
- Role-specific error codes:
  - `FORBIDDEN_ADMIN_REQUIRED` - Admin privileges needed
  - `FORBIDDEN_ESTIMATOR_REQUIRED` - Estimator privileges needed
  - `FORBIDDEN_OWNER_REQUIRED` - Owner privileges needed

**Example**:
```typescript
// API endpoint throws role-specific error
throw new ApiError(
  'This action requires administrator privileges...',
  403,
  'FORBIDDEN_ADMIN_REQUIRED'
)
```

### 2. **Permission Utilities**

**Location**: `lib/permissions.ts`

**Features**:
- `getPermissionDenialMessage()` - Generates user-friendly denial messages
- `hasRole()` - Check if user has required role
- `isAdmin()` - Check admin privileges
- `getRoleDisplayName()` - Human-readable role names

**Example**:
```typescript
const denial = getPermissionDenialMessage('field_tech', 'admin')
// Returns: {
//   message: "Access Denied: This feature requires Administrator privileges...",
//   suggestion: "This feature requires administrator access. Please contact..."
// }
```

### 3. **UI Components**

#### PermissionDenied Component
**Location**: `components/errors/PermissionDenied.tsx`

**Features**:
- Beautiful, user-friendly permission denial page
- Shows current role vs required role
- Provides suggestions based on user's role
- Action buttons (Go Back, Manage Users for admins)

**Usage**:
```tsx
<PermissionDenied
  userRole="field_tech"
  requiredRole={['admin', 'owner']}
  featureName="User Management"
/>
```

#### ApiErrorDisplay Component
**Location**: `components/errors/ApiErrorDisplay.tsx`

**Features**:
- Displays API errors in a user-friendly format
- Handles permission errors with role-specific messages
- Dismissible error alerts
- Color-coded by error type

**Usage**:
```tsx
<ApiErrorDisplay
  error={apiError}
  userRole={user.role}
  onDismiss={() => setError(null)}
/>
```

### 4. **Page-Level Protection**

**Pattern**: All protected pages check roles and redirect to `/unauthorized` with context

**Example**:
```typescript
if (profile?.role !== 'admin' && profile?.role !== 'owner') {
  return redirect(`/unauthorized?requiredRole=admin,owner&feature=User Management`)
}
```

## Error Message Examples

### Field Tech Trying to Access Admin Feature

**Message**:
> "Access Denied: This feature requires Administrator or Owner privileges. Your current role is Field Technician."

**Suggestion**:
> "This feature requires administrator access. Please contact your administrator if you need access."

### Estimator Trying to Access Owner-Only Feature

**Message**:
> "Access Denied: This feature requires Owner privileges. Your current role is Estimator."

**Suggestion**:
> "This action requires owner privileges. Only system owners can perform this action."

### Unauthorized (Not Logged In)

**Message**:
> "Authentication Required: You must be logged in to perform this action."

## Error Flow

1. **User Action** → User tries to access protected feature
2. **Page Check** → Server component checks role
3. **Redirect** → If unauthorized, redirect to `/unauthorized` with context
4. **Display** → `PermissionDenied` component shows friendly message
5. **API Call** → If API is called, returns 403 with role-specific error
6. **UI Display** → `ApiErrorDisplay` shows error in component

## Best Practices

### ✅ DO:
- Always check roles at page level (server component)
- Use `PermissionDenied` component for page-level denials
- Use `ApiErrorDisplay` for API errors
- Provide role-specific suggestions
- Redirect to `/unauthorized` with context

### ❌ DON'T:
- Show technical error messages to users
- Use generic "Access Denied" without context
- Redirect silently to home page
- Expose internal error details

## Implementation Status

✅ **Complete**:
- API error handling with role-specific messages
- Permission utilities
- PermissionDenied component
- ApiErrorDisplay component
- Unauthorized page
- Admin pages redirect with context

⏳ **In Progress**:
- Updating all protected pages to use new redirect pattern
- Adding ApiErrorDisplay to all API-consuming components

## Testing

To test permission denials:

1. **As Field Tech**:
   - Try accessing `/admin/users` → Should see permission denied page
   - Try accessing `/admin/policies` → Should see permission denied page

2. **As Estimator**:
   - Try accessing owner-only features → Should see appropriate message

3. **API Calls**:
   - Make API call without proper role → Should see error in UI component

