# Phase 2 Agent Instructions - Waves 2-3

## Deployment: 4 Agents in Parallel

### Agent 2.1: Alerts Management UI
**Goal**: Build complete alerts management interface
**Files to Create**:
- `/app/alerts/page.tsx` - Alerts list page
- `/app/alerts/rules/page.tsx` - Alert rules configuration
- `/app/alerts/[alertId]/page.tsx` - Alert detail page
- `/components/alerts/AlertsList.tsx` - Alerts list component
- `/components/alerts/AlertRules.tsx` - Rules configuration component
- `/components/alerts/AlertDetail.tsx` - Alert detail component
- `/hooks/useAlerts.ts` - React Query hooks

**API Endpoints**:
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts/[alertId]` - Get alert
- `POST /api/alerts/[alertId]/acknowledge` - Acknowledge alert
- `GET /api/alerts/rules` - List rules
- `POST /api/alerts/rules` - Create rule

**Patterns to Follow**:
- Use UsersList.tsx as template for list component
- Use PolicyDetail.tsx as template for detail component
- Follow glass design system
- Add navigation links

### Agent 2.2: Monitoring Dashboard UI
**Goal**: Build monitoring and compliance dashboard
**Files to Create**:
- `/app/monitoring/page.tsx` - Monitoring dashboard
- `/app/monitoring/compliance/page.tsx` - Compliance view
- `/app/monitoring/gates/page.tsx` - Missing gates view
- `/app/monitoring/jobs/page.tsx` - Stale jobs view
- `/components/monitoring/MonitoringDashboard.tsx` - Main dashboard
- `/components/monitoring/ComplianceView.tsx` - Compliance component
- `/hooks/useMonitoring.ts` - React Query hooks

**API Endpoints**:
- `GET /api/monitoring/dashboard` - Dashboard metrics
- `GET /api/monitoring/compliance` - Compliance data
- `GET /api/monitoring/gates/missing` - Missing gates
- `GET /api/monitoring/jobs/stale` - Stale jobs

### Agent 3.1: Estimates UI
**Goal**: Build estimates generation and management
**Files to Create**:
- `/app/estimates/page.tsx` - Estimates list
- `/app/estimates/generate/page.tsx` - Generate estimate
- `/app/estimates/[estimateId]/page.tsx` - Estimate detail
- `/components/estimates/EstimatesList.tsx` - List component
- `/components/estimates/GenerateEstimateForm.tsx` - Generate form
- `/components/estimates/EstimateDetail.tsx` - Detail component
- `/hooks/useEstimates.ts` - React Query hooks

**API Endpoints**:
- `GET /api/estimates` - List estimates
- `POST /api/estimates/generate` - Generate estimate
- `GET /api/estimates/[estimateId]` - Get estimate
- `GET /api/estimates/[estimateId]/line-items` - Get line items
- `POST /api/estimates/[estimateId]/apply-coverage` - Apply coverage
- `GET /api/estimates/[estimateId]/export` - Export estimate

### Agent 3.2: Communications UI
**Goal**: Build communications management interface
**Files to Create**:
- `/app/communications/page.tsx` - Communications hub
- `/app/communications/email/page.tsx` - Email interface
- `/app/communications/templates/page.tsx` - Email templates
- `/app/communications/history/[jobId]/page.tsx` - Communication history
- `/components/communications/EmailForm.tsx` - Send email form
- `/components/communications/TemplatesList.tsx` - Templates list
- `/components/communications/HistoryView.tsx` - History component
- `/hooks/useCommunications.ts` - React Query hooks

**API Endpoints**:
- `GET /api/communications/email/templates` - List templates
- `POST /api/communications/email/send` - Send email
- `GET /api/communications/history/[jobId]` - Get history
- `POST /api/communications/voice/transcribe` - Transcribe voice

## Success Criteria
- ✅ All pages created and functional
- ✅ Navigation links added
- ✅ Role-based access implemented
- ✅ Error handling
- ✅ Loading states
- ✅ Follows existing patterns

## Coordination
- Update shared-docs/ui-build-progress.md when complete
- Follow patterns from Wave 1
- Use shared component library
- Test incrementally

