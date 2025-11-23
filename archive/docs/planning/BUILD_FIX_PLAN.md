# Build Fix Plan

## Analysis of Current Build Errors

### Error 1: Board Type Not Exported
- **File**: `components/boards/BoardCard.tsx`
- **Issue**: `Board` interface is defined in `hooks/useBoards.ts` but not exported
- **Fix**: Export the `Board` interface from `hooks/useBoards.ts`

### Error 2: Missing State Reset
- **File**: `app/field/gates/[id]/page.tsx`
- **Issue**: `setEquipmentPhotoFiles([])` not called when loading metadata
- **Fix**: Add the missing state reset call

## Execution Plan

1. Export `Board` type from `hooks/useBoards.ts`
2. Add missing `setEquipmentPhotoFiles([])` call in metadata loading
3. Run build to verify all errors are resolved
4. If additional errors appear, document and fix systematically

## Success Criteria
- Build completes without TypeScript errors
- All type imports resolve correctly
- No runtime type errors

