# Field App API Reference

## Routes
- `GET /field` - Field dashboard (jobs assigned to tech)
- `GET /field/jobs/[id]` - Job detail with gates
- `GET /field/gates/[id]` - Individual gate screen
- `POST /field/gates/[id]/complete` - Complete a gate
- `POST /field/gates/[id]/exception` - Log exception for gate
- `POST /field/photos/upload` - Upload photo

## Data Models
```typescript
interface Job {
  id: string
  title: string
  address_line_1: string
  status: string
  lead_tech_id: string
}

interface JobGate {
  id: string
  job_id: string
  stage_name: string
  status: 'pending' | 'in_progress' | 'complete' | 'skipped'
  requires_exception: boolean
  exception_reason?: string
}

interface JobPhoto {
  id: string
  job_id: string
  gate_id: string
  storage_path: string
  metadata: string (JSON)
  is_ppe: boolean
}
```

## Gate Order
1. Arrival
2. Intake
3. Photos
4. Moisture/Equipment
5. Scope
6. Sign-offs
7. Departure

