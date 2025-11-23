# Legacy Field Command - Complete UX Workflow Documentation

## Chain of Thought: User Experience Flow Analysis

This document provides a comprehensive breakdown of every screen, workflow, data flow, and user interaction in the Legacy Field Command application. Use this as a blueprint for rebuilding the frontend.

---

## 1. APPLICATION ENTRY & AUTHENTICATION

### 1.1 Initial Landing / Root Route (`/`)

**Purpose:** Entry point that routes users based on authentication and role

**Flow:**
1. User navigates to root URL
2. System checks authentication status
3. If not authenticated → Redirect to `/login`
4. If authenticated → Check user role from `profiles` table
5. Route based on role:
   - `field_tech` → `/field` (Field Tech Dashboard)
   - `admin`, `owner`, `estimator` → `/` (Admin Dashboard)

**Data Required:**
- User session from Supabase Auth
- User profile with `role` field

**UI Elements:**
- No visible UI (immediate redirect)
- Loading state during authentication check

---

### 1.2 Login/Signup Screen (`/login`)

**Purpose:** User authentication and account creation

**Layout:**
- Centered modal/card on dark background
- Glass morphism design (semi-transparent card with blur)
- Title: "Legacy Field Command"
- Subtitle: "Sign in to your account"

**Form Fields:**
1. **Email Address** (input)
   - Type: email
   - Required: Yes
   - Validation: Email format pattern
   - Placeholder: "Email address"

2. **Password** (input)
   - Type: password
   - Required: Yes
   - Min length: 8 characters
   - Placeholder: "Password (min. 8 characters)"

3. **Full Name** (input) - Signup only
   - Type: text
   - Required: No (optional)
   - Placeholder: "Full Name (for Sign Up)"
   - Only visible/used during signup

**Actions:**
- **Sign in** button (primary, blue background)
  - Action: `login()` server action
  - Validates email format
  - Validates password length
  - Authenticates via Supabase
  - On success: Redirects to `/` (which routes based on role)
  - On error: Shows error message

- **Sign up** button (secondary, outline style)
  - Action: `signup()` server action
  - Creates new user in Supabase Auth
  - Auto-creates profile with default role `field_tech`
  - Stores `full_name` in user metadata
  - On success: Redirects to `/` (which routes based on role)
  - On error: Shows error message

**Error Handling:**
- Email format validation
- Password length validation
- Supabase auth errors displayed to user
- Error messages shown in banner/alert format

**Design Notes:**
- Dark theme with high contrast text
- Input fields have dark backgrounds in dark mode
- Buttons have proper touch targets (min 44px height)
- Responsive design for mobile/tablet

---

## 2. ROLE-BASED DASHBOARDS

### 2.1 Admin Dashboard (`/` - for admin/owner/estimator roles)

**Purpose:** Central hub for managing jobs, assignments, and monitoring field activity

**Header Section:**
- Title: "Admin Dashboard"
- Subtitle: "Monitor jobs, assignments, and field activity"
- User email display (top right)
- Sign Out link (red text, top right)

**Main Content:**

**Section 1: Active Jobs**
- Heading: "Active Jobs"
- Description: "Create, assign, and track restoration jobs in real time"
- **Action Button:** "+ New Job" (primary blue button, links to `/jobs/new`)

**Section 2: Jobs List**
- Glass card container
- List of all jobs in system
- Each job card displays:
  - **Job Title** (accent color, clickable)
  - **Status Badge** (green background, white text)
    - Possible values: `lead`, `inspection_scheduled`, `job_created`, `active_work`, `ready_to_invoice`, `paid`, `closed`
  - **Assigned Tech** (shows full_name from profiles table, or "Unassigned")
  - **Created Date** (formatted: "Jan 15, 2024")
- Empty state: "No jobs found. Create one to get started."

**Data Source:**
- Query: `jobs` table with join to `profiles` on `lead_tech_id`
- Ordered by creation date (newest first)

**Navigation:**
- Click job title → Navigate to job detail (future feature)
- Click "+ New Job" → Navigate to `/jobs/new`

---

### 2.2 Field Tech Dashboard (`/field`)

**Purpose:** Field technician's view of assigned jobs

**Header Section:**
- Title: "My Jobs" (large, 4xl font)
- User email display (top right)
- Sign Out link (red text, top right)
- Sticky header with glass effect

**Main Content:**

**Section: Assigned Jobs**
- Heading: "Assigned Jobs"
- List of jobs where `lead_tech_id` matches current user
- Each job card displays:
  - **Job Title** (accent blue color, large font)
  - **Location** (address_line_1)
  - **Created Date** (formatted: "Jan 15, 2024")
  - **Status Badge** (green background, white text, rounded pill)
- Cards are clickable links to `/field/jobs/[id]`
- Hover effect: slight shadow and translate up
- Empty state: "No jobs assigned to you yet."

**Data Source:**
- Query: `jobs` table filtered by `lead_tech_id = current_user.id`
- Ordered by `created_at` descending

**Navigation:**
- Click job card → Navigate to `/field/jobs/[id]` (Job Detail with Gates)

---

## 3. JOB MANAGEMENT

### 3.1 Create New Job (`/jobs/new`)

**Purpose:** Admin creates new restoration job and assigns to field tech

**Access:** Admin/Owner/Estimator roles only

**Header Section:**
- Back link: "← Back to Dashboard" (accent color)
- Title: "Create New Job"
- Subtitle: "Add a new restoration job and assign it to a field tech"

**Form (Glass Card):**

**Field 1: Job Title**
- Label: "Job Title *"
- Type: text input
- Required: Yes
- Placeholder: "e.g. Smith Residence - Water Loss"
- Name: `title`

**Field 2: Address**
- Label: "Address *"
- Type: text input
- Required: Yes
- Placeholder: "123 Main St, City, State ZIP"
- Name: `address`
- Stored in: `address_line_1`

**Field 3: Assign Lead Tech**
- Label: "Assign Lead Tech"
- Type: select dropdown
- Required: No (can be unassigned)
- Options:
  - "Unassigned" (value: "unassigned")
  - List of all users with `role = 'field_tech'` from profiles table
  - Display: `full_name` or `id` if no name
- Name: `leadTechId`
- Stored in: `jobs.lead_tech_id`

**Actions:**
- **Cancel** button (outline style) → Links back to `/`
- **Create Job** button (primary blue) → Submits form

**Form Submission:**
- Server action: `createJob()`
- Creates job in `jobs` table with:
  - `title`
  - `address_line_1`
  - `lead_tech_id` (null if "unassigned")
  - `status: 'lead'`
- Auto-creates 7 gates in `job_gates` table:
  1. Arrival (status: 'pending')
  2. Intake (status: 'pending')
  3. Photos (status: 'pending')
  4. Moisture/Equipment (status: 'pending')
  5. Scope (status: 'pending')
  6. Sign-offs (status: 'pending')
  7. Departure (status: 'pending')
- On success: Redirects to `/` (Admin Dashboard)
- On error: Shows error message

---

### 3.2 Job Detail / Visit Workflow (`/field/jobs/[id]`)

**Purpose:** Field tech views job details and accesses gate workflow

**Access Control:**
- Only accessible if `job.lead_tech_id === current_user.id`
- If not assigned → Redirect to `/field`

**Header Section:**
- Back link: "← Back to Jobs" (accent color)
- Title: Job title (from `jobs.title`)
- Subtitle: Address (from `jobs.address_line_1` or "No address")
- Status: Job status (from `jobs.status`)

**Main Content:**

**Section: Visit Workflow**
- Heading: "Visit Workflow"
- List of 7 gates in order:
  1. Arrival
  2. Intake
  3. Photos
  4. Moisture/Equipment
  5. Scope
  6. Sign-offs
  7. Departure

**Gate Card Display:**
Each gate is a clickable card showing:
- **Status Badge** (left side):
  - "Complete" (if `status = 'complete'`)
  - "In progress" (if `status = 'in_progress'`)
  - "Skipped" (if `status = 'skipped'`)
  - "Pending" (if `status = 'pending'`)
- **Gate Name** (e.g., "Arrival", "Intake")
- **Open Button** (right side, ghost variant)
- **Exception Banner** (if `requires_exception = true`):
  - Yellow background box
  - Text: "**Exception:** [exception_reason]"

**Gate Card Interaction:**
- Click anywhere on card → Navigate to `/field/gates/[gateId]`
- Hover effect: Border changes to accent color

**Data Source:**
- Query: `job_gates` table filtered by `job_id`
- Ordered by creation order (matches gate sequence)

**Navigation:**
- Click gate card → Navigate to gate detail page
- Back link → Returns to `/field` (Field Tech Dashboard)

---

## 4. GATE WORKFLOW SYSTEM

### Overview: Gate System Architecture

**Purpose:** Guided workflow ensuring field techs complete all required steps in order

**Key Features:**
- **Sequential Gates:** Must complete in order (or log exception)
- **Data Persistence:** All form data auto-saves as draft every 2.5 seconds
- **Exception Handling:** Any gate can be skipped with reason
- **Validation:** Each gate validates required data before completion
- **Status Tracking:** Gates have status: `pending`, `in_progress`, `complete`, `skipped`

**Gate States:**
- **Pending:** Not started
- **In Progress:** User has opened gate, data being entered
- **Complete:** All requirements met, gate finished
- **Skipped:** Exception logged, gate bypassed

**Autosave Indicator:**
- Shows "Saving..." while draft is being saved
- Shows "✓ Draft saved" when save completes
- Shows "⚠ Save failed - will retry" on error
- Only visible for gates that aren't complete/skipped

---

### 4.1 Gate Detail Page (`/field/gates/[id]`)

**Purpose:** Individual gate screen where field tech completes gate requirements

**Access Control:**
- Only accessible if `job.lead_tech_id === current_user.id`
- If not assigned → Error message

**Header Section:**
- Back link: "← Back to Job" (accent color, links to `/field/jobs/[jobId]`)
- Title: "[Gate Name] Gate" (e.g., "Arrival Gate")
- Subtitle: "Complete the [gate name] workflow."

**Data Loading:**
- Loads gate data from `job_gates` table
- Loads job data from `jobs` table
- Loads existing photos (if applicable)
- **Restores form state from `gate.metadata`** (data persistence)
- Handles both JSON string and object metadata formats

**Banner System:**
- Success banner (green border): Shows success messages
- Error banner (red border): Shows validation/error messages
- Appears at top of main content area

**Main Content:**
- Gate-specific form (see individual gate sections below)
- Rendered by `renderGateContent()` function based on `gate.stage_name`

**Action Buttons (Bottom):**
- **Complete Gate** button (primary, full width)
  - Enabled only if `canComplete()` returns true
  - Disabled during completion process
  - Shows "Completing..." when processing
  - Action: `handleComplete()` function
    - Validates user authentication
    - Verifies job assignment
    - Runs gate-specific validation
    - Executes gate-specific completion logic
    - Updates gate status to 'complete'
    - Sets `completed_at` timestamp
    - Sets `completed_by` to user ID
    - On success: Shows success banner, redirects to `/field/jobs/[jobId]` after 1 second

- **Log Exception** button (outline, full width)
  - Opens exception modal
  - Allows skipping gate with reason

**Exception Modal:**
- Title: "Log Exception - [Gate Name] Gate"
- Textarea for exception reason (required, 4 rows)
- Placeholder: "Enter exception reason..."
- Actions:
  - Cancel (closes modal)
  - "Log Exception" (destructive variant, red)
- On submit:
  - Updates gate: `status = 'skipped'`, `requires_exception = true`, `exception_reason = [reason]`, `completed_at = now()`
  - Redirects to `/field/jobs/[jobId]`

**Special Routing:**
- Photos gate automatically redirects to `/field/gates/photos/[id]` (dedicated photos screen)

---

### 4.2 Gate 1: ARRIVAL Gate

**Purpose:** Verify tech arrived on-site, establish baseline

**Required Elements:**
- Arrival photo (exterior of property/unit)
- Timestamp (auto-captured on completion)

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Arrival photo (exterior of property/unit)"
  - "Timestamp (auto-captured)"

**Section 2: Photo Capture**
- Glass card
- Heading: "Arrival Photo"
- **PhotoCapture Component:**
  - Primary button: "Take Arrival Photo" (blue, camera icon)
    - Opens device camera
    - Accepts: `image/*`
    - Capture mode: `environment` (rear camera)
  - Secondary button: "Choose from Library" (glass style)
    - Opens file picker
    - Accepts: `image/*`
  - Required indicator: "* This photo is required" (if not exception)
- Success message: "Photo captured: [filename]" (green text, shown when photo selected)

**Form State:**
- `arrivalPhoto`: File object (null if not captured)

**Validation:**
- Must have `arrivalPhoto` OR `gate.requires_exception = true`
- Error: "Arrival photo is required. Take a photo or log an exception."

**Completion Logic:**
- If photo exists:
  - Upload to Supabase Storage: `jobs/[jobId]/photos/arrival_[jobId]_[timestamp].jpg`
  - Create record in `job_photos` table:
    - `job_id`: Job ID
    - `gate_id`: Gate ID
    - `storage_path`: File path
    - `metadata`: `{ type: 'arrival', stage: 'Arrival' }`
    - `is_ppe`: false
  - Retry logic: 3 attempts with exponential backoff
  - Error handling: User-friendly messages for network, RLS, file size errors

**Blocking:** Cannot proceed to Intake gate without completion or exception

**Exception Allowed:** Yes
- Reasons: "Unable to access property", "Wrong address", etc.

---

### 4.3 Gate 2: INTAKE Gate

**Purpose:** Initial customer contact, loss type identification

**Required Elements:**
- Customer contact info (name OR phone) OR confirmation unavailable
- Loss type selection
- At least one affected area with damage type

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Customer contact info or confirmation unavailable"
  - "Loss type selection"
  - "At least one affected area with damage type"

**Section 2: Intake Form**
- Glass card with form fields

**Field 1: Customer Name**
- Label: "Customer Name"
- Type: text input
- State: `intakeData.customerName`
- Not required (can use phone instead)

**Field 2: Customer Phone**
- Label: "Customer Phone"
- Type: tel input
- State: `intakeData.customerPhone`
- Not required (can use name instead)

**Field 3: Loss Type**
- Label: "Loss Type *"
- Type: select dropdown
- Required: Yes
- Options:
  - "Select..." (empty)
  - "Water"
  - "Fire"
  - "Mold"
  - "Storm"
  - "Other"
- State: `intakeData.lossType`

**Field 4: Affected Areas**
- Label: "Affected Areas *"
- Type: Multi-select checkboxes
- Required: At least one area must be selected
- Room options (checkboxes):
  - Kitchen
  - Living Room
  - Bedroom
  - Bathroom
  - Basement
  - Attic
  - Exterior
  - Other
- State: `intakeData.affectedAreas` (Array of `{ room: string, damageType: string }`)

**Field 5: Damage Type per Selected Room**
- For each room in `affectedAreas`, shows:
  - Label: "[Room Name] - Damage Type *"
  - Type: select dropdown
  - Required: Yes (must select for each room)
  - Options:
    - "Select..." (empty)
    - "Visible water"
    - "Smoke damage"
    - "Structural"
    - "Flooring"
    - "Drywall"
    - "Cabinets"
    - "HVAC"
    - "Other"
  - State: `intakeData.affectedAreas[index].damageType`

**Field 6: Customer Signature**
- Type: checkbox
- Label: "Customer signature/acknowledgment obtained"
- State: `intakeData.customerSignature` (boolean)

**Form State Structure:**
```typescript
{
  customerName: string
  customerPhone: string
  lossType: string
  affectedAreas: Array<{
    room: string
    damageType: string
  }>
  customerSignature: boolean
}
```

**Data Persistence:**
- Auto-saves to `gate.metadata` every 2.5 seconds
- Restores from `gate.metadata` on page load
- Backward compatible with old format (single `damageType` → converts to `affectedAreas`)

**Validation:**
- Must have (`customerName` OR `customerPhone`) OR exception
- Must have `lossType` OR exception
- Must have at least one `affectedArea` with `damageType` OR exception
- Error messages:
  - "Customer contact info is required or log an exception."
  - "Loss type is required or log an exception."
  - "At least one affected area is required or log an exception."

**Completion Logic:**
- Saves `intakeData` to `gate.metadata`
- Updates gate status to 'complete'

**Blocking:** Cannot proceed to Photos gate without completion

**Exception Allowed:** Yes
- Reasons: "Customer not present, left notice", etc.

---

### 4.4 Gate 3: PHOTOS Gate

**Purpose:** Comprehensive visual documentation

**Special Routing:** Automatically redirects to dedicated Photos page: `/field/gates/photos/[id]`

**Required Elements:**
- At least ONE room documented with photos
- Each documented room must have ALL 3 photo types:
  1. Wide room shot
  2. Close-up of damage
  3. Context/equipment photo

**UI Layout (Photos Gate Page):**

**Header Section:**
- Back link: "← Back to Job"
- Title: "Photos Gate"
- Subtitle: "Document rooms with photos"

**Section 1: Requirements**
- Glass card
- Heading: "Required per room:"
- Bullet list:
  - "Wide room shot"
  - "Close-up of damage"
  - "Context/equipment photo"

**Section 2: Room Selection**
- Heading: "Select Room to Document"
- Grid/list of room cards:
  - Kitchen
  - Living Room
  - Bedroom
  - Bathroom
  - Basement
  - Attic
  - Exterior
  - Other
- Each room card shows:
  - Room name
  - Progress indicator (e.g., "2/3 photos")
  - Checkmark if complete (all 3 photos taken)
  - Visual highlight if selected
- Click room → Selects room for photo capture

**Section 3: Photo Capture Flow**
- Only shown when room is selected
- Shows current photo type needed:
  - "Wide room shot" (first)
  - "Close-up of damage" (second)
  - "Context/equipment photo" (third)
- **PhotoCapture Component:**
  - Primary: "Take [Photo Type] Photo" (blue button)
  - Secondary: "Choose from Library" (glass button)
- Progress indicator showing which photo type is next
- After each photo:
  - Uploads immediately to Supabase Storage
  - Creates record in `job_photos` table with metadata:
    - `room`: Selected room name
    - `type`: Photo type (Wide room shot, Close-up of damage, Context/equipment photo)
  - Updates progress tracking
  - Auto-advances to next photo type
  - Shows success message when room complete

**Section 4: Photo Progress Summary**
- Heading: "Photo Progress:"
- List showing each room:
  - Room name
  - Checkmarks/X for each photo type
  - "Complete" indicator if all 3 photos taken

**Validation:**
- At least one room must have all 3 photo types
- Error: "You must document at least one room with all 3 required photos..."

**Completion Logic:**
- Validates at least one complete room
- Updates gate status to 'complete'
- Redirects to job detail page

**Blocking:** Cannot proceed to Moisture/Equipment gate without at least one room documented

**Exception Allowed:** Yes
- Reasons: "No access to room", "Customer declined photos"

---

### 4.5 Gate 4: MOISTURE/EQUIPMENT Gate

**Purpose:** Technical measurements and equipment deployment

**Required Elements:**
- Moisture readings OR "No moisture detected" confirmation
- Equipment deployed list OR exception
- Equipment placement photos (if equipment deployed)

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Moisture readings or 'No moisture detected'"
  - "Equipment deployed list or exception"
  - "Equipment placement photos (if equipment deployed)"

**Section 2: Moisture/Equipment Form**
- Glass card

**Field 1: Moisture Readings**
- Label: "Moisture Readings"
- Type: textarea (3 rows)
- Placeholder: "Enter moisture readings or 'No moisture detected'"
- State: `moistureData.readings`
- Not strictly required (can log exception)

**Field 2: Equipment Deployed**
- Label: "Equipment Deployed *"
- Type: Multi-select checkboxes
- Required: At least one selection OR exception
- Options:
  - Air movers
  - Dehumidifiers
  - HEPA filters
  - None
- State: `moistureData.equipment` (Array of strings)

**Field 3: Equipment Photos** (Conditional)
- Only shown if equipment selected AND "None" not selected
- Label: "Equipment Photos"
- **PhotoCapture Component:**
  - Can capture multiple photos
  - Each photo uploaded immediately
- State: `moistureData.equipmentPhotos` (Array of File objects)
- Display: "[X] photo(s) captured" (green text)

**Form State Structure:**
```typescript
{
  readings: string
  equipment: string[]  // Array of equipment types
  equipmentPhotos: File[]  // Files (not saved in metadata)
}
```

**Data Persistence:**
- Auto-saves `readings` and `equipment` to `gate.metadata`
- Photos uploaded immediately (not stored in metadata)

**Validation:**
- Must have at least one equipment type selected OR exception
- Error: "Equipment status is required or log an exception."

**Completion Logic:**
- Uploads all equipment photos to storage
- Saves `readings` and `equipment` to `gate.metadata`
- Updates gate status to 'complete'

**Blocking:** Cannot proceed to Scope gate without completion

**Exception Allowed:** Yes
- Reasons: "No equipment needed", "Equipment unavailable"

---

### 4.6 Gate 5: SCOPE Gate

**Purpose:** Detailed damage assessment for estimating

**Required Elements:**
- Affected rooms list (must match rooms with photos)
- Damage type per room
- Measurements OR "Visual estimate only" flag
- Scope notes (recommended)

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Affected rooms list (must match rooms with photos)"
  - "Damage type per room"
  - "Measurements or 'Visual estimate only'"
  - "Scope notes"

**Section 2: Scope Form**
- Glass card

**Field 1: Affected Rooms**
- Label: "Affected Rooms *"
- Type: Multi-select checkboxes
- Required: At least one room OR exception
- Room options:
  - Kitchen
  - Living Room
  - Bedroom
  - Bathroom
  - Basement
  - Attic
  - Exterior
  - Other
- State: `scopeData.rooms` (Array of strings)

**Field 2: Damage Type per Room**
- For each selected room, shows:
  - Label: "[Room Name] - Damage Type"
  - Type: select dropdown
  - Options: Same as Intake gate damage types
  - State: `scopeData.damageTypes[room]` (Record<string, string>)

**Field 3: Measurements**
- Label: "Measurements"
- Type: textarea (3 rows)
- Placeholder: "Enter measurements or 'Visual estimate only'"
- State: `scopeData.measurements`
- Required: Must have measurements OR "Visual estimate only" text OR exception

**Field 4: Scope Notes**
- Label: "Scope Notes"
- Type: textarea (4 rows)
- Placeholder: "What needs repair, what needs replacement"
- State: `scopeData.notes`
- Recommended but not required

**Form State Structure:**
```typescript
{
  rooms: string[]  // Array of room names
  damageTypes: Record<string, string>  // { [room]: damageType }
  measurements: string
  notes: string
}
```

**Data Persistence:**
- Auto-saves to `gate.metadata` every 2.5 seconds
- Restores from `gate.metadata` on page load

**Validation:**
- Must have at least one room OR exception
- Must have measurements OR "Visual estimate only" OR exception
- Cross-gate validation: Rooms must match Photos gate rooms (warning, not blocking)
- Error: "At least one affected room is required or log an exception."
- Error: "Measurements are required, or mark as 'Visual estimate only'."

**Completion Logic:**
- Saves `scopeData` to `gate.metadata`
- Runs room consistency check with Photos gate
- Updates gate status to 'complete'

**Blocking:** Cannot proceed to Sign-offs gate without completion

**Exception Allowed:** Yes
- Reasons: "Scope deferred to estimator", "Customer declined full scope"

---

### 4.7 Gate 6: SIGN-OFFS Gate

**Purpose:** Customer approval and authorization

**Required Elements:**
- Work authorization signature OR exception reason
- Insurance claim number OR "Customer pay" flag
- Next steps acknowledgment

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Work authorization signature or exception"
  - "Insurance claim number or 'Customer pay'"
  - "Next steps acknowledgment"

**Section 2: Sign-offs Form**
- Glass card

**Field 1: Work Authorization Signature**
- Type: checkbox
- Label: "Work authorization signature obtained"
- State: `signoffData.signature` (boolean)
- Not strictly required (can use claim number or customer pay)

**Field 2: Insurance Claim Number**
- Label: "Insurance Claim Number"
- Type: text input
- State: `signoffData.claimNumber`
- Not strictly required (can use signature or customer pay)

**Field 3: Customer Pay**
- Type: checkbox
- Label: "Customer pay (no insurance)"
- State: `signoffData.customerPay` (boolean)
- Not strictly required (can use signature or claim number)

**Field 4: Next Steps**
- Label: "Next Steps *"
- Type: select dropdown
- Required: Yes
- Options:
  - "Select..." (empty)
  - "Wait for adjuster"
  - "Proceed with work"
  - "Quote pending"
- State: `signoffData.nextSteps`

**Form State Structure:**
```typescript
{
  signature: boolean
  claimNumber: string
  customerPay: boolean
  nextSteps: string
}
```

**Data Persistence:**
- Auto-saves to `gate.metadata` every 2.5 seconds
- Restores from `gate.metadata` on page load

**Validation:**
- Must have (`signature` OR `claimNumber` OR `customerPay`) AND `nextSteps` OR exception
- Error: "Work authorization is required or log an exception."

**Completion Logic:**
- Saves `signoffData` to `gate.metadata`
- Updates gate status to 'complete'

**Blocking:** Cannot proceed to Departure gate without completion

**Exception Allowed:** Yes
- Reasons: "Customer unavailable, left documentation"

---

### 4.8 Gate 7: DEPARTURE Gate

**Purpose:** Final confirmation, equipment status, handoff

**Required Elements:**
- Departure timestamp (auto-captured on completion)
- Equipment status
- Job status update

**UI Layout:**

**Section 1: Requirements List**
- Glass card
- Heading: "Required"
- Bullet list:
  - "Departure timestamp (auto-captured)"
  - "Equipment status"
  - "Job status update"

**Section 2: Departure Form**
- Glass card

**Field 1: Equipment Status**
- Label: "Equipment Status *"
- Type: select dropdown
- Required: Yes
- Options:
  - "Select..." (empty)
  - "All removed"
  - "Left on-site"
  - "Customer pickup scheduled"
- State: `departureData.equipmentStatus`

**Field 2: Final Notes**
- Label: "Final Notes"
- Type: textarea (3 rows)
- Optional
- State: `departureData.notes`

**Field 3: Job Status**
- Label: "Job Status *"
- Type: select dropdown
- Required: Yes
- Options:
  - "Select..." (empty)
  - "Ready for estimate"
  - "Needs follow-up"
  - "Complete"
- State: `departureData.jobStatus`

**Form State Structure:**
```typescript
{
  equipmentStatus: string
  notes: string
  jobStatus: string
}
```

**Data Persistence:**
- Auto-saves to `gate.metadata` every 2.5 seconds
- Restores from `gate.metadata` on page load

**Validation:**
- Must have `equipmentStatus` OR exception
- Must have `jobStatus` OR exception
- Timestamp validation: Arrival timestamp must be before Departure timestamp
- Error: "Equipment status is required."
- Error: "Job status is required."

**Completion Logic:**
- Saves `departureData` to `gate.metadata`
- Updates gate status to 'complete'
- **Updates job status** in `jobs` table:
  - Converts `jobStatus` to lowercase with underscores
  - Maps to job status enum values
- Validates timestamp order (arrival before departure)

**Blocking:** Job cannot be marked "Visit Complete" without this gate

**Exception Allowed:** No (must complete)

---

## 5. DATA PERSISTENCE & AUTOSAVE

### 5.1 Autosave System

**Purpose:** Prevent data loss when user navigates away or closes browser

**How It Works:**
1. User makes any change to form fields
2. Debounce timer starts (2.5 seconds)
3. If user makes another change, timer resets
4. After 2.5 seconds of no changes, `saveDraft()` function executes
5. Current form state saved to `gate.metadata` in database
6. Gate status remains unchanged (not marked complete)

**What Gets Saved:**
- **Intake Gate:** `intakeData` (customer info, loss type, affected areas, signature)
- **Moisture/Equipment Gate:** `readings` and `equipment` (photos uploaded immediately, not in draft)
- **Scope Gate:** `scopeData` (rooms, damage types, measurements, notes)
- **Sign-offs Gate:** `signoffData` (signature, claim number, customer pay, next steps)
- **Departure Gate:** `departureData` (equipment status, notes, job status)
- **Arrival Gate:** No autosave (photo uploaded immediately)

**Visual Indicator:**
- Small text in top-right of gate page
- States:
  - "Saving..." (while saving)
  - "✓ Draft saved" (success, shows for 2 seconds)
  - "⚠ Save failed - will retry" (error, shows for 3 seconds)
  - Hidden when idle or gate is complete/skipped

**Error Handling:**
- Errors logged to console
- User sees error indicator
- System will retry on next change
- Doesn't block user from continuing

---

### 5.2 Data Restoration

**Purpose:** Restore form state when user returns to gate

**How It Works:**
1. When gate page loads, `loadData()` function executes
2. Fetches gate data including `metadata` field
3. `restoreGateState()` function parses metadata
4. Form state restored based on gate type
5. UI populates with saved data

**Metadata Format:**
- Can be JSON string or object
- `parseMetadata()` handles both formats
- Backward compatible with old data structures

**Backward Compatibility:**
- Old Intake format: `{ damageType: string }` → Converts to `{ affectedAreas: [{ room: 'Other', damageType }] }`
- Ensures existing gates still work

---

## 6. PHOTO UPLOAD SYSTEM

### 6.1 PhotoCapture Component

**Purpose:** Reusable component for capturing/selecting photos

**Features:**
- Two input methods:
  1. **Camera Capture:** Opens device camera (rear camera preferred)
  2. **Library Selection:** Opens file picker from device storage
- Preview display after selection
- File validation (image types only)
- Max file size: 10MB (validated before upload)

**UI:**
- Primary button: "Take [Label] Photo" (blue, camera icon)
- Secondary button: "Choose from Library" (glass style)
- Required indicator: "* This photo is required" (if `required` prop)
- Preview: Shows selected image thumbnail

**Props:**
- `onPhotoTaken: (file: File) => void` - Callback when photo selected
- `label?: string` - Button label text
- `required?: boolean` - Shows required indicator

---

### 6.2 Photo Upload Process

**Upload Flow:**
1. User selects/captures photo
2. File validated (type, size)
3. Upload to Supabase Storage:
   - Path: `jobs/[jobId]/photos/[filename]`
   - Filename format: `[type]_[jobId]_[timestamp].jpg`
   - Content type: `image/jpeg`
4. Create record in `job_photos` table:
   - `job_id`: Job ID
   - `gate_id`: Gate ID
   - `storage_path`: File path in storage
   - `metadata`: JSON with room, type, etc.
   - `is_ppe`: Boolean (false for most, true for PPE photos)
5. Retry logic: 3 attempts with exponential backoff
6. Success: Photo available immediately
7. Error: User-friendly message displayed

**Error Messages:**
- Network errors: "Network connection failed. Please check your internet and try again."
- RLS errors: "Permission denied. Please contact support if this issue persists."
- File size: "File too large. Please use a smaller image (max 10MB)."
- Generic: "Upload failed: [specific error message]"

**Retry Logic:**
- 3 attempts maximum
- Exponential backoff: 1s, 2s, 3s delays
- Final error message includes attempt count

---

## 7. VALIDATION SYSTEM

### 7.1 Gate Validation

**Purpose:** Ensure all required data present before gate completion

**Validation Functions:**
- `validateGate()` - Main validation function
- `validateArrivalGate()` - Arrival-specific
- `validatePhotosGate()` - Photos-specific
- `validateScopeGate()` - Scope-specific
- `validateRoomConsistency()` - Cross-gate (Photos vs Scope)
- `validateTimestampOrder()` - Cross-gate (Arrival vs Departure)

**Validation Results:**
```typescript
{
  isValid: boolean
  errors: string[]  // Blocking errors
  warnings: string[]  // Non-blocking warnings
}
```

**When Validation Runs:**
- Before gate completion
- Shows errors in banner if validation fails
- Blocks completion until errors resolved

**Exception Handling:**
- If `gate.requires_exception = true`, validation is bypassed
- Exception gates can always complete

---

### 7.2 Cross-Gate Validation

**Room Consistency Check:**
- Compares rooms in Photos gate vs Scope gate
- Error if Scope lists room without Photos
- Warning if Photos exist for room not in Scope

**Timestamp Validation:**
- Arrival timestamp must be before Departure timestamp
- System-enforced, cannot complete Departure if Arrival is after

---

## 8. EXCEPTION SYSTEM

### 8.1 Exception Workflow

**Purpose:** Allow gates to be skipped when requirements cannot be met

**When to Use:**
- Cannot access property
- Customer unavailable
- Equipment unavailable
- Customer declined photos
- Any scenario where gate requirements cannot be met

**Exception Process:**
1. User clicks "Log Exception" button
2. Modal opens with textarea
3. User enters reason (required, minimum 1 character)
4. User clicks "Log Exception" (red button)
5. Gate updated:
   - `status = 'skipped'`
   - `requires_exception = true`
   - `exception_reason = [user input]`
   - `completed_at = now()`
   - `completed_by = user.id`
6. Redirect to job detail page
7. Exception displayed on gate card (yellow banner)

**Exception Display:**
- Yellow background box on gate card
- Text: "**Exception:** [exception_reason]"
- Visible on job detail page

**Exception Frequency Tracking:**
- System tracks number of exceptions per job
- If > 2 exceptions → Flagged for supervisor review (future feature)

---

## 9. NAVIGATION FLOW DIAGRAM

```
ROOT (/)
  ├─ Not Authenticated → /login
  ├─ Authenticated + field_tech → /field
  └─ Authenticated + admin/owner/estimator → / (Admin Dashboard)

/login
  ├─ Sign In → / (routes based on role)
  └─ Sign Up → / (routes based on role)

/ (Admin Dashboard)
  ├─ Click Job → (Future: Job Detail)
  └─ Click "+ New Job" → /jobs/new

/jobs/new
  ├─ Cancel → /
  └─ Create Job → / (Admin Dashboard)

/field (Field Tech Dashboard)
  └─ Click Job Card → /field/jobs/[id]

/field/jobs/[id] (Job Detail)
  ├─ Click Gate Card → /field/gates/[gateId]
  └─ Back → /field

/field/gates/[id] (Gate Detail)
  ├─ Photos Gate → Auto-redirects to /field/gates/photos/[id]
  ├─ Complete Gate → /field/jobs/[id]
  ├─ Log Exception → /field/jobs/[id]
  └─ Back → /field/jobs/[id]

/field/gates/photos/[id] (Photos Gate)
  ├─ Complete Gate → /field/jobs/[id]
  └─ Back → /field/jobs/[id]
```

---

## 10. USER ROLES & PERMISSIONS

### 10.1 Role Types

**field_tech:**
- Access: `/field` dashboard only
- Can view: Jobs assigned to them (`lead_tech_id = user.id`)
- Can complete: Gates for assigned jobs
- Cannot: Create jobs, view all jobs, assign jobs

**admin:**
- Access: Admin dashboard (`/`)
- Can view: All jobs
- Can create: New jobs
- Can assign: Jobs to field techs
- Can view: All gates and photos

**owner:**
- Same as admin
- Future: Additional permissions for billing/accounting

**estimator:**
- Same as admin
- Future: Additional permissions for estimate creation

**lead_tech:**
- Currently same as field_tech
- Future: May have additional permissions

**program_admin:**
- Future role for program-specific management

---

## 11. DESIGN SYSTEM

### 11.1 Color Scheme

**Light Mode:**
- Background: `#f5f5f7` (light gray)
- Text Primary: `#000000` (black)
- Text Secondary: `#1d1d1f` (dark gray)
- Accent: `#007aff` (Apple Blue)
- Success: `#34c759` (green)
- Error: `#ff3b30` (red)
- Warning: `#ff9500` (orange)

**Dark Mode:**
- Background: `#000000` (black)
- Text Primary: `#ffffff` (white)
- Text Secondary: `#f5f5f7` (very light gray)
- Accent: `#0a84ff` (bright blue)
- Glass Background: `rgba(28, 28, 30, 0.95)` (semi-transparent dark)
- Input Background: `rgba(44, 44, 46, 0.9)` (dark with opacity)

**CSS Variables:**
- All colors defined as CSS variables in `globals.css`
- Automatically switches based on `prefers-color-scheme`
- High contrast ratios for accessibility

---

### 11.2 Glass Morphism Design

**Glass Card Style:**
- Background: Semi-transparent with blur
- Border: Subtle white border
- Shadow: Soft shadow for depth
- Border radius: 1rem (16px)
- Backdrop filter: 20px blur

**Usage:**
- All cards use `.glass-basic` class
- Header uses glass effect with border-bottom
- Forms use `.card-glass` variant

---

### 11.3 Typography

**Font Stack:**
- System fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`

**Sizes:**
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

**Headings:**
- h1: 3xl, semibold
- h2: 2xl, semibold
- h3: xl, semibold

---

### 11.4 Component Library

**Button:**
- Variants: default, outline, subtle, ghost, destructive
- Sizes: default (h-11), sm, lg, icon
- Min height: 44px (touch target)
- Rounded: full (pill shape)

**Input:**
- Height: 44px (h-11)
- Border: Glass border style
- Background: Adapts to light/dark mode
- Focus: Accent color ring

**Select:**
- Same styling as Input
- Dropdown with options

**Textarea:**
- Same styling as Input
- Multi-line text input

**Checkbox:**
- Custom styled
- Accent color when checked

**Modal:**
- Overlay with glass card
- Title, content, actions
- Close on overlay click or cancel

**PhotoCapture:**
- Primary button (blue, camera icon)
- Secondary button (glass style)
- Preview display
- Required indicator

---

## 12. DATA MODELS

### 12.1 Database Tables

**profiles:**
- `id` (uuid, references auth.users)
- `email` (text)
- `full_name` (text, nullable)
- `role` (user_role enum)
- `created_at`, `updated_at`

**jobs:**
- `id` (uuid, primary key)
- `title` (text)
- `address_line_1` (text)
- `lead_tech_id` (uuid, references profiles, nullable)
- `status` (job_status enum)
- `created_at`, `updated_at`

**job_gates:**
- `id` (uuid, primary key)
- `job_id` (uuid, references jobs)
- `stage_name` (text): 'Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'
- `status` (text): 'pending', 'in_progress', 'complete', 'skipped'
- `metadata` (jsonb): Gate-specific form data
- `requires_exception` (boolean)
- `exception_reason` (text, nullable)
- `completed_at` (timestamptz, nullable)
- `completed_by` (uuid, references profiles, nullable)
- `created_at`, `updated_at`

**job_photos:**
- `id` (uuid, primary key)
- `job_id` (uuid, references jobs)
- `gate_id` (uuid, references job_gates)
- `storage_path` (text): Path in Supabase Storage
- `metadata` (jsonb): Photo metadata (room, type, etc.)
- `is_ppe` (boolean)
- `created_at`, `updated_at`

---

## 13. COMPLETE USER JOURNEY EXAMPLES

### 13.1 Field Tech Complete Visit Journey

**Step 1: Login**
- Navigate to `/login`
- Enter email/password
- Click "Sign in"
- Redirected to `/field` (Field Tech Dashboard)

**Step 2: View Assigned Jobs**
- See list of jobs assigned to them
- Click on job card
- Navigate to `/field/jobs/[id]`

**Step 3: Start Visit Workflow**
- See 7 gates listed
- All gates show "Pending" status
- Click "Arrival" gate card
- Navigate to `/field/gates/[arrivalGateId]`

**Step 4: Complete Arrival Gate**
- See requirements list
- Click "Take Arrival Photo"
- Capture photo with device camera
- Photo preview appears
- Click "Complete Gate"
- Gate marked complete
- Redirected to job detail page
- Arrival gate now shows "Complete" badge

**Step 5: Complete Intake Gate**
- Click "Intake" gate card
- Navigate to intake gate page
- Form data auto-restores if previously started
- Enter customer name and phone
- Select loss type: "Water"
- Check boxes for affected rooms: "Kitchen", "Living Room"
- For each room, select damage type: "Visible water"
- Check "Customer signature obtained"
- Form auto-saves every 2.5 seconds (shows "✓ Draft saved")
- Click "Complete Gate"
- Gate marked complete
- Redirected to job detail page

**Step 6: Complete Photos Gate**
- Click "Photos" gate card
- Auto-redirected to `/field/gates/photos/[photosGateId]`
- See room selection grid
- Click "Kitchen" room card
- See prompt: "Take Wide room shot"
- Click "Take Wide room shot Photo"
- Capture photo
- Photo uploads immediately
- Auto-advances to "Close-up of damage"
- Capture second photo
- Auto-advances to "Context/equipment photo"
- Capture third photo
- Kitchen shows "Complete" (all 3 photos)
- Can select another room or complete gate
- Click "Complete Gate"
- Gate marked complete
- Redirected to job detail page

**Step 7: Complete Remaining Gates**
- Repeat process for Moisture/Equipment, Scope, Sign-offs, Departure
- Each gate follows same pattern:
  - Open gate
  - Fill form (auto-saves)
  - Complete gate
  - Return to job detail

**Step 8: Visit Complete**
- All 7 gates show "Complete" status
- Job status updated to final status from Departure gate
- Visit workflow finished

---

### 13.2 Admin Create and Assign Job Journey

**Step 1: Login as Admin**
- Navigate to `/login`
- Enter admin credentials
- Redirected to `/` (Admin Dashboard)

**Step 2: Create New Job**
- Click "+ New Job" button
- Navigate to `/jobs/new`
- Fill form:
  - Title: "Smith Residence - Water Loss"
  - Address: "123 Main St, Anytown, ST 12345"
  - Assign Lead Tech: Select "John Doe" from dropdown
- Click "Create Job"
- 7 gates auto-created
- Redirected to Admin Dashboard
- New job appears in list

**Step 3: Monitor Progress**
- View job in list
- See assigned tech name
- See job status
- (Future: Click to view gate progress)

---

### 13.3 Exception Scenario Journey

**Step 1: Field Tech Encounters Issue**
- Field tech opens "Intake" gate
- Customer not present
- Cannot complete required fields

**Step 2: Log Exception**
- Click "Log Exception" button
- Modal opens
- Enter reason: "Customer not present, left notice on door"
- Click "Log Exception"
- Gate marked as "Skipped"
- Exception reason saved
- Redirected to job detail
- Gate card shows yellow exception banner

**Step 3: Continue Workflow**
- Can proceed to next gate
- Exception logged for audit trail
- Supervisor can review later

---

## 14. TECHNICAL IMPLEMENTATION NOTES

### 14.1 State Management

**Client-Side State:**
- React `useState` hooks for form data
- Separate state for each gate type
- State restored from `gate.metadata` on load
- State auto-saved to `gate.metadata` periodically

**Server-Side State:**
- Supabase database as source of truth
- Real-time updates via Supabase client
- Server actions for mutations

---

### 14.2 Photo Storage

**Storage Bucket:**
- Bucket name: `job-photos`
- Path structure: `jobs/[jobId]/photos/[filename]`
- File naming: `[type]_[jobId]_[timestamp].jpg`
- Content type: `image/jpeg`

**Photo Records:**
- Stored in `job_photos` table
- Linked to job and gate
- Metadata stored as JSONB
- Includes room, type, stage information

---

### 14.3 Error Handling

**User-Facing Errors:**
- Displayed in banner component
- Red border for errors
- Green border for success
- Auto-dismiss after timeout (for success)

**Technical Errors:**
- Logged to console
- User-friendly messages displayed
- Retry logic for network operations
- Graceful degradation

---

## 15. FUTURE ENHANCEMENTS (Not Yet Implemented)

**Planned Features:**
- Voice command integration
- Offline mode with sync
- GPS/location tracking
- Policy document upload
- Estimate generation
- Email communications
- Advanced reporting
- Mobile app (consolidated to web)

---

## SUMMARY

This document provides a complete blueprint of the Legacy Field Command UX workflow. Every screen, form field, data flow, validation rule, and user interaction is documented. Use this as your reference when rebuilding the frontend in Replit.

**Key Takeaways:**
1. **Role-based routing** determines initial experience
2. **7 sequential gates** guide field techs through visit workflow
3. **Autosave** prevents data loss
4. **Exception system** allows flexibility when requirements can't be met
5. **Glass morphism design** with dark/light mode support
6. **Photo upload** with retry logic and error handling
7. **Cross-gate validation** ensures data consistency
8. **Real-time persistence** via Supabase

The application is designed to be "dummy-proof" with minimal free text, heavy use of picklists, and clear validation messages at every step.

