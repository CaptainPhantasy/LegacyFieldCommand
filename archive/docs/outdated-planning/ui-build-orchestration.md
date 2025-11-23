# UI Build Orchestration Plan

## Goal
Build complete UI for all ~85% of features that currently only exist as API endpoints, optimized for human end users.

## Current State Analysis

### What Exists
- ✅ 100+ API endpoints (fully functional)
- ✅ Database schema (complete)
- ✅ RLS policies (secure)
- ✅ ~15 UI pages/components
- ✅ Basic navigation structure

### What's Missing
- ❌ UI for 85% of features
- ❌ Navigation to most features
- ❌ User-friendly interfaces
- ❌ Role-based access in UI
- ❌ Workflow completion

## Feature Categories & Dependencies

### Wave 1: Core Admin Features (High Priority, Independent)
**Dependencies**: None
**Agents Needed**: 3

1. **Admin User Management UI**
   - List users page
   - Create user form
   - Edit user form
   - User detail page
   - Role management

2. **Admin Policy Management UI**
   - Policy list page
   - Upload policy form
   - Policy detail/viewer
   - Link policy to job
   - Coverage summary display

3. **Admin Dashboard Metrics UI**
   - Metrics dashboard page
   - Charts/graphs for statistics
   - Real-time updates

### Wave 2: Alerts & Monitoring (High Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

4. **Alerts Management UI**
   - Alert rules configuration
   - Alert list/inbox
   - Alert detail/acknowledge
   - Alert filtering

5. **Monitoring Dashboard UI**
   - Compliance dashboard
   - Missing gates view
   - Stale jobs view
   - Monitoring metrics

### Wave 3: Estimates & Communications (High Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

6. **Estimates UI**
   - Generate estimate form
   - Estimate detail/viewer
   - Line items management
   - Apply coverage
   - Export estimates

7. **Communications UI**
   - Email templates management
   - Send email form
   - Communication history
   - Voice transcription interface

### Wave 4: Templates & Measurements (Medium Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

8. **Templates UI**
   - Template list
   - Create/edit template
   - Apply template to job

9. **Measurements UI**
   - Upload 3D measurements
   - View measurements
   - Link measurements to jobs

### Wave 5: Content & Advanced Hydro (Medium Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

10. **Content Management UI**
    - Box tracking interface
    - Content items management

11. **Advanced Hydro UI**
    - Floor plans management
    - Rooms management
    - Moisture maps interface
    - Drying logs view

### Wave 6: Automations & Dashboards (Medium Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

12. **Automations UI**
    - Automation rules builder
    - Rule list/management
    - Execution history

13. **Custom Dashboards UI**
    - Dashboard builder
    - Dashboard list
    - Dashboard viewer

### Wave 7: Integrations & Sync (Low Priority, Independent)
**Dependencies**: None
**Agents Needed**: 2

14. **Integrations UI**
    - Integration status
    - Export interfaces (Xactimate, CoreLogic)
    - Webhook management

15. **Job-Board Sync UI**
    - Sync buttons/actions
    - Sync status display
    - Board item linking

### Wave 8: Navigation & Polish (Final Wave, Depends on All)
**Dependencies**: All previous waves
**Agents Needed**: 1

16. **Navigation & Integration**
    - Add navigation links to all new pages
    - Update main dashboard with feature cards
    - Role-based navigation
    - Breadcrumbs
    - Quick actions

## Success Criteria

### Per Agent
- ✅ UI component/page created
- ✅ Navigation link added
- ✅ Role-based access implemented
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Follows existing design patterns

### Overall
- ✅ All API endpoints have UI
- ✅ All features accessible via navigation
- ✅ Role-based access working
- ✅ No broken links
- ✅ Consistent UX across all features

## Technical Patterns

### File Structure
```
apps/web/app/
├── admin/
│   ├── users/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx (create)
│   │   └── [userId]/page.tsx (detail/edit)
│   ├── policies/
│   │   ├── page.tsx (list)
│   │   ├── upload/page.tsx
│   │   └── [policyId]/page.tsx (detail)
│   └── dashboard/page.tsx (metrics)
├── alerts/
│   ├── page.tsx (list)
│   ├── rules/page.tsx
│   └── [alertId]/page.tsx
├── monitoring/
│   ├── page.tsx (dashboard)
│   ├── compliance/page.tsx
│   └── gates/page.tsx
├── estimates/
│   ├── page.tsx (list)
│   ├── generate/page.tsx
│   └── [estimateId]/page.tsx
├── communications/
│   ├── email/page.tsx
│   ├── templates/page.tsx
│   └── history/[jobId]/page.tsx
└── ... (similar for all features)
```

### Component Patterns
- Use existing UI components (`@/components/ui/*`)
- Follow glass design system
- Use React Query hooks
- Server components for data fetching
- Client components for interactivity

### Navigation Patterns
- Add to main dashboard as feature cards
- Add to header navigation
- Add breadcrumbs
- Add quick actions where appropriate

## Agent Instructions

Each agent should:
1. Create the UI page/component
2. Add navigation link
3. Implement role-based access
4. Add error handling
5. Add loading states
6. Test the feature
7. Document any issues

## Coordination

- All agents share this document
- Update progress as you complete tasks
- Note any dependencies discovered
- Report blockers immediately

