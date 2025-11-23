# Type System Refactoring - Swarm Coordination

## Overview
Centralizing all types, eliminating type safety bypasses, and ensuring build passes with zero type errors.

## Current State
- **Types scattered**: hooks, components, lib files
- **Type conflicts**: Job interface defined in 2 places (`types/gates.ts` and `hooks/useJobs.ts`)
- **Type safety bypasses**: 68 files with `any`, `unknown[]`, `as any`
- **Missing types**: View, Group, Column interfaces not properly centralized
- **Build status**: TBD (will verify after Phase 1)

## Wave Execution Plan

### Wave 1: Blocker Removal (Sequential - MUST COMPLETE FIRST)
**Status**: 🔄 In Progress
**Agents**: Single agent (sequential dependencies)

1. Fix Job type conflict in `types/gates.ts`
2. Update `hooks/useJobs.ts` to use centralized types
3. Verify build passes

### Wave 2: Create Type Files (Parallel)
**Status**: ⏳ Pending Wave 1
**Agents**: 3 parallel agents

- Agent 2.1: Create `types/boards.ts`
- Agent 2.2: Create `types/hydro.ts`
- Agent 2.3: Create `types/jobs.ts`

### Wave 3: Migrate Types from Hooks (Parallel)
**Status**: ⏳ Pending Wave 2
**Agents**: 4 parallel agents

- Agent 3.1: Update `hooks/useBoards.ts`
- Agent 3.2: Update `hooks/useItems.ts`
- Agent 3.3: Update `hooks/useHydro.ts`
- Agent 3.4: Update `hooks/useJobs.ts` (final cleanup)

### Wave 4: Fix Component Type Usage (Parallel)
**Status**: ⏳ Pending Wave 3
**Agents**: 3 parallel agents

- Agent 4.1: Fix Board Components
- Agent 4.2: Fix Field/Job Components
- Agent 4.3: Fix Hydro Components

### Wave 5: Fix Remaining Type Issues (Parallel)
**Status**: ⏳ Pending Wave 4
**Agents**: 2 parallel agents

- Agent 5.1: Fix Integration/Reports Types
- Agent 5.2: Fix API Route Types

### Wave 6: Verification & Testing (Sequential - FINAL)
**Status**: ⏳ Pending Wave 5
**Agents**: Single agent

1. Build verification
2. Type check verification
3. Lint verification
4. Integration tests

## Shared Type Definitions

### Job Type Variants (from Phase 1)
- `Job` - Base interface
- `JobWithProfile extends Job` - With profile relation
- `JobWithGates extends Job` - With gates array
- `JobFull extends JobWithProfile & { gates?: JobGate[] }` - Full job with all relations

### Type Guards
- `isJobWithGates(job: Job): job is JobWithGates`
- `isJobWithProfile(job: Job): job is JobWithProfile`

## Success Criteria
- ✅ Build passes: `npm run build` exits with code 0
- ✅ Type check passes: `npx tsc --noEmit` exits with code 0
- ✅ Zero `any` types in hooks/components
- ✅ Zero `unknown[]` in return types
- ✅ All types centralized in `types/` directory
- ✅ All imports resolve correctly

## Progress Tracking
- [ ] Wave 1: Blocker Removal
- [ ] Wave 2: Create Type Files
- [ ] Wave 3: Migrate Types from Hooks
- [ ] Wave 4: Fix Component Type Usage
- [ ] Wave 5: Fix Remaining Type Issues
- [ ] Wave 6: Verification & Testing

## Notes
- Path alias: `@/*` maps to `./*` (from tsconfig.json)
- All types should be exported from centralized `types/` directory
- Use type variants and index signatures for API flexibility

