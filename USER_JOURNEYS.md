# User Journeys: Daily Workflows

## Overview

This document outlines the complete daily user journeys for both **Field Technicians** and **Company Administrators** from first touch to last touch.

---

## 🔧 FIELD TECHNICIAN - Daily Journey

### **First Touch: Morning Start (7:00 AM - 8:00 AM)**

#### 1. **Login & Authentication**
- Opens app on mobile device/tablet
- Navigates to login page (`/login`)
- Enters email and password
- System authenticates via Supabase
- **Auto-redirect**: Based on role (`field_tech`) → `/field` dashboard

#### 2. **Field Dashboard Review** (`/field`)
- **View assigned jobs** for the day
  - Job list shows: Title, Address, Status, Progress (gates completed)
  - Jobs sorted by: Priority/urgency or arrival time
  - Visual indicators: New jobs, in-progress, needs attention
- **Check job details** (tap job card)
  - View job address, customer info, special instructions
  - See gate completion status (7 gates: Arrival → Departure)
  - Check if job is ready to start or needs follow-up

#### 3. **Route Planning**
- Review all assigned jobs for the day
- Plan route based on locations
- Check job priorities (urgent, scheduled, follow-up)
- Note any special requirements or equipment needed

---

### **Mid-Morning: First Job Site (8:30 AM - 10:00 AM)**

#### 4. **Navigate to Job Site**
- Tap job from dashboard → Opens job detail page (`/field/jobs/[id]`)
- View full job information:
  - Customer contact info
  - Property address with map link
  - Job status and notes
  - All 7 gates with completion status
- Use GPS/navigation to arrive at site

#### 5. **Arrival Gate** (`/field/gates/[id]` - Arrival)
- **Auto-capture**: Arrival timestamp
- **Required actions**:
  - Take arrival photo (exterior of property)
  - Confirm location/GPS
  - Review job details and special instructions
- **Exception option**: If unable to access property
- **Complete gate** → Unlocks Intake gate
- System logs: User ID, timestamp, location

#### 6. **Intake Gate** (`/field/gates/[id]` - Intake)
- **Customer contact**:
  - Collect/verify customer name and phone
  - Or mark "Customer unavailable"
- **Loss information**:
  - Select loss type (Water, Fire, Mold, Storm, Other)
  - Select initial damage description (picklist)
- **Customer acknowledgment**:
  - Get customer signature OR log exception reason
- **Complete gate** → Unlocks Photos gate

#### 7. **Photos Gate** (`/field/gates/photos/[id]`)
- **Document affected rooms**:
  - Select room (Kitchen, Living Room, Bedroom, etc.)
  - For each room, take minimum 3 photos:
    - Wide room shot
    - Close-up of damage
    - Context/equipment photo
  - Tag each photo with room and photo type
- **PPE photo** (if required for job type)
- **Exception option**: If room inaccessible or customer declined
- **Complete gate** → Unlocks Moisture/Equipment gate
- System validates: Minimum 3 photos per documented room

---

### **Mid-Day: Technical Work (10:00 AM - 2:00 PM)**

#### 8. **Moisture/Equipment Gate** (`/field/gates/[id]` - Moisture/Equipment)
- **Moisture readings**:
  - Take moisture readings per affected room
  - Or confirm "No moisture detected"
- **Equipment deployment**:
  - Document equipment placed (Air movers, Dehumidifiers, HEPA filters)
  - Take photos of equipment placement
  - Or mark "No equipment needed"
- **Complete gate** → Unlocks Scope gate

#### 9. **Scope Gate** (`/field/gates/[id]` - Scope)
- **Affected rooms list**:
  - Must match rooms documented in Photos gate
  - System validates room consistency
- **Damage assessment per room**:
  - Select damage type (Drywall, Flooring, Cabinets, HVAC, etc.)
  - Enter measurements (sqft, linear ft) OR mark "Visual estimate only"
  - Add scope notes (what needs repair vs. replacement)
- **Exception option**: If scope deferred to estimator
- **Complete gate** → Unlocks Sign-offs gate

#### 10. **Sign-offs Gate** (`/field/gates/[id]` - Sign-offs)
- **Work authorization**:
  - Get customer signature OR log exception
- **Insurance/claim info**:
  - Enter insurance claim number (if applicable)
  - Or mark "Customer pay"
- **Next steps**:
  - Select next step (Wait for adjuster, Proceed with work, Quote pending)
- **Complete gate** → Unlocks Departure gate

---

### **Afternoon: Job Completion (2:00 PM - 4:00 PM)**

#### 11. **Departure Gate** (`/field/gates/[id]` - Departure)
- **Auto-capture**: Departure timestamp
- **Equipment status**:
  - Mark: All removed, Left on-site, Customer pickup scheduled
- **Final notes**:
  - Add any final observations or customer feedback
- **Job status update**:
  - Set: Ready for estimate, Needs follow-up, Complete
- **Complete gate** → Job visit marked complete
- System validates: Arrival timestamp < Departure timestamp

#### 12. **Job Summary Review**
- Review all completed gates
- Verify all required documentation captured
- Check for any alerts or missing items
- Mark job as complete or flag for follow-up

---

### **Late Afternoon: Additional Jobs (4:00 PM - 6:00 PM)**

#### 13. **Repeat Process for Additional Jobs**
- Return to field dashboard
- Select next assigned job
- Repeat gates 4-11 for each additional job
- Manage multiple jobs throughout the day

#### 14. **Exception Handling**
- If job requires exception (customer unavailable, access issues):
  - Log exception with detailed reason
  - System flags if > 2 exceptions in one visit
  - Job marked for supervisor review if needed

---

### **Last Touch: End of Day (6:00 PM - 7:00 PM)**

#### 15. **End-of-Day Review**
- Return to field dashboard (`/field`)
- Review all jobs worked today:
  - Completed jobs
  - In-progress jobs (gates partially complete)
  - Jobs needing follow-up
- Check for any alerts or notifications

#### 16. **Data Sync**
- System auto-syncs all data to cloud
- Verify all photos uploaded
- Confirm all gate completions saved
- Check for any sync errors

#### 17. **Logout**
- Sign out from application
- Close app
- End of day

---

## 👔 COMPANY ADMINISTRATOR - Daily Journey

### **First Touch: Morning Start (8:00 AM - 9:00 AM)**

#### 1. **Login & Authentication**
- Opens web app on desktop/laptop
- Navigates to login page (`/login`)
- Enters admin credentials
- System authenticates via Supabase
- **Auto-redirect**: Based on role (`admin/owner/estimator`) → Admin Dashboard (`/`)

#### 2. **Admin Dashboard Overview** (`/`)
- **Dashboard metrics**:
  - Total jobs by status (Lead, Active, Ready to Invoice, etc.)
  - Jobs assigned vs. unassigned
  - Gate completion statistics
  - User counts by role
  - Recent activity (last 7 days)
- **Quick actions**:
  - Create new job
  - View unassigned jobs
  - Check alerts/notifications

#### 3. **Daily Planning**
- Review overnight job submissions
- Check for urgent jobs needing assignment
- Review field tech availability
- Plan job assignments for the day

---

### **Morning: Job Management (9:00 AM - 12:00 PM)**

#### 4. **Create New Jobs** (`/jobs/new`)
- **Job creation form**:
  - Enter job title
  - Customer information
  - Property address (address_line_1)
  - Job status (default: "lead")
  - Special instructions/notes
- **System auto-creates**:
  - 7 default gates (Arrival → Departure)
  - Job record in database
- **Save job** → Returns to dashboard

#### 5. **Job Assignment**
- View job list on dashboard
- Select unassigned job
- **Assign to field tech**:
  - Select from list of available field techs
  - Assign as lead tech
  - Job appears on tech's dashboard
- **Bulk assignment** (if multiple jobs):
  - Assign multiple jobs to techs
  - Balance workload across team

#### 6. **Monitor Active Jobs**
- View all active jobs:
  - Jobs in progress
  - Jobs with completed gates
  - Jobs needing attention
- **Check job details**:
  - View gate completion status
  - Review photos uploaded
  - Check for exceptions or alerts
  - Monitor field tech progress

#### 7. **User Management** (`/api/admin/users`)
- **View all users**:
  - List of all field techs, admins, estimators
  - User roles and permissions
  - User activity status
- **Create new users**:
  - Add new field tech
  - Set user role
  - Assign initial permissions
- **Update user info**:
  - Change roles
  - Update contact information
  - Reset passwords if needed

---

### **Mid-Day: Policy & Documentation (12:00 PM - 2:00 PM)**

#### 8. **Policy Management** (`/api/admin/policies`)
- **Upload policy PDFs**:
  - Upload insurance policy documents
  - Link policies to jobs
  - Parse policy data (OCR/extraction)
- **Policy coverage**:
  - Review coverage details
  - Check deductibles and limits
  - Link policies to estimates

#### 9. **Template Management** (`/api/templates`)
- **Create job templates**:
  - Define standard gate requirements
  - Set default workflows
  - Create reusable job structures
- **Apply templates**:
  - Apply templates to new jobs
  - Standardize job workflows

---

### **Afternoon: Estimates & Communications (2:00 PM - 5:00 PM)**

#### 10. **Estimate Generation** (`/api/estimates/generate`)
- **Review completed jobs**:
  - Jobs with all gates complete
  - Jobs ready for estimate
- **Generate estimates**:
  - Use AI-assisted estimate generation
  - Apply policy coverage
  - Review line items
  - Adjust estimates as needed
- **Export estimates**:
  - Export to Xactimate format
  - Export to CoreLogic/NextGen format
  - Send to insurance adjusters

#### 11. **Communications Management** (`/api/communications`)
- **Email templates**:
  - Create/edit email templates
  - Send templated emails to customers
  - Track email history per job
- **Voice transcriptions**:
  - Review voice notes from field techs
  - Process voice commands
  - Interpret voice data into structured info

#### 12. **Alerts & Monitoring** (`/api/alerts`, `/api/monitoring`)
- **Review alerts**:
  - Stale jobs (no activity)
  - Missing gate artifacts
  - Compliance issues
  - Exception flags
- **Acknowledge alerts**:
  - Review and resolve alerts
  - Take corrective action
  - Update job status

---

### **Late Afternoon: Reporting & Analysis (5:00 PM - 6:00 PM)**

#### 13. **Dashboard Analytics**
- Review daily metrics:
  - Jobs completed today
  - Field tech productivity
  - Gate completion rates
  - Exception frequency
- **Compliance reporting**:
  - Check compliance status
  - Review missing documentation
  - Identify training needs

#### 14. **Job Status Updates**
- Update job statuses:
  - Move jobs through workflow stages
  - Mark jobs as "Ready to Invoice"
  - Close completed jobs
- **Follow-up management**:
  - Flag jobs needing follow-up
  - Schedule return visits
  - Assign follow-up tasks

---

### **Last Touch: End of Day (6:00 PM - 7:00 PM)**

#### 15. **End-of-Day Review**
- **Final dashboard check**:
  - Review all active jobs
  - Check for unresolved alerts
  - Verify all assignments complete
- **Tomorrow's planning**:
  - Preview jobs scheduled for tomorrow
  - Check field tech availability
  - Plan assignments

#### 16. **Data Verification**
- Verify all data synced correctly
- Check for any data inconsistencies
- Review system health
- Check storage usage

#### 17. **Logout**
- Sign out from application
- Close browser
- End of day

---

## Key Differences: Field Tech vs. Administrator

### **Field Technician Focus:**
- ✅ **Execution**: Complete gates on-site
- ✅ **Documentation**: Capture photos, measurements, customer info
- ✅ **Mobile-first**: Works on mobile device in the field
- ✅ **Sequential**: Follows gate order (Arrival → Departure)
- ✅ **Real-time**: Updates job status as work progresses

### **Administrator Focus:**
- ✅ **Management**: Create jobs, assign techs, monitor progress
- ✅ **Analysis**: Review metrics, compliance, productivity
- ✅ **Desktop-first**: Works on desktop/laptop in office
- ✅ **Parallel**: Manages multiple jobs and techs simultaneously
- ✅ **Strategic**: Plans workflows, templates, estimates

---

## Common Touchpoints

### **Both Roles:**
- Login/authentication
- Dashboard view (role-specific)
- Job detail review
- Photo viewing
- Status updates
- Logout

### **Data Flow:**
- **Field Tech** → Creates gate data, photos, measurements
- **Administrator** → Reviews, assigns, generates estimates
- **System** → Syncs data, validates, alerts, reports

---

## Exception Scenarios

### **Field Tech Exceptions:**
- Customer unavailable → Log exception, continue
- Property inaccessible → Log exception, reschedule
- Equipment unavailable → Log exception, note in gate
- > 2 exceptions → Auto-flag for admin review

### **Administrator Exceptions:**
- Unassigned jobs → Assign to available tech
- Stale jobs → Alert, reassign, or close
- Missing documentation → Alert tech, request completion
- Compliance issues → Review, correct, train

---

## Success Metrics

### **Field Technician:**
- Jobs completed per day
- Gates completed accurately
- Photos/documentation quality
- Exception rate
- On-time completion

### **Administrator:**
- Jobs assigned efficiently
- Estimates generated timely
- Compliance rate
- Team productivity
- Customer satisfaction

---

*This document provides a high-level overview of daily workflows. For detailed technical specifications, see `UX_WORKFLOW_DOCUMENTATION.md`.*

