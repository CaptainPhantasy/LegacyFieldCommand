# User Roles and Privilege Levels

## Role Hierarchy (Lowest to Highest)

### 1. `field_tech` - Field Technician
**Privileges:**
- View assigned jobs
- Complete job gates (Arrival, Intake, Photos, Moisture/Equipment, Scope, Sign-offs, Departure)
- Upload photos
- Add moisture readings
- Log equipment
- View own job details
- Access field dashboard (`/field`)

**Restrictions:**
- Cannot create jobs
- Cannot view other users' jobs (unless assigned)
- Cannot access admin features
- Cannot manage users, policies, or system settings

---

### 2. `lead_tech` - Lead Technician
**Privileges:**
- All `field_tech` privileges
- Can be assigned as lead technician on jobs
- May have additional job management capabilities

**Restrictions:**
- Still cannot access admin features
- Cannot manage users or system settings

---

### 3. `estimator` - Estimator
**Privileges:**
- All `field_tech` privileges
- Create and manage estimates
- View all jobs (for estimation purposes)
- Access estimates dashboard
- Generate estimates from job data
- Apply coverage from policies
- Export estimates

**Restrictions:**
- Cannot manage users
- Cannot access admin dashboard
- Cannot modify system settings

---

### 4. `admin` - Administrator
**Privileges:**
- All `estimator` privileges
- **User Management:**
  - Create, view, edit, and delete users
  - Assign roles to users
  - View all users
- **Policy Management:**
  - Upload policies
  - Parse policies (with OCR)
  - Link policies to jobs
  - View all policies
- **System Administration:**
  - Access admin dashboard (`/admin/dashboard`)
  - View system metrics
  - Manage alerts
  - Access monitoring dashboard
- **Full Job Access:**
  - View all jobs (regardless of assignment)
  - Create jobs
  - Assign jobs to technicians
- **Content & Data:**
  - Access all measurements
  - View all communications
  - Manage templates

**Restrictions:**
- Cannot delete the system
- Some super-admin features may be restricted (if any exist)

---

### 5. `program_admin` - Program Administrator
**Privileges:**
- All `admin` privileges
- **Program-Level Management:**
  - Manage job templates
  - Configure program-specific settings
  - May have multi-tenant capabilities (future)

**Use Case:** For managing specific programs or accounts within a multi-tenant system.

---

### 6. `owner` - Owner (GOD TIER) ⭐
**Privileges:**
- **ALL PRIVILEGES** - No restrictions
- Everything `admin` can do, plus:
  - Ultimate system authority
  - Can manage all users including other admins
  - Full access to all data and features
  - System configuration access
  - Billing/account management (if applicable)
  - Can delete/restore critical data
  - Override any restrictions

**This is the highest privilege level** - reserved for system owners/founders.

---

## Role Access Matrix

| Feature | field_tech | lead_tech | estimator | admin | program_admin | owner |
|---------|-----------|-----------|----------|-------|---------------|-------|
| View Own Jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complete Gates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Estimates | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View All Jobs | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Policies | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Templates | ❌ | ❌ | ❌ | ⚠️ | ✅ | ✅ |

✅ = Full Access | ⚠️ = Limited Access | ❌ = No Access

---

## API Endpoint Access

### Admin-Only Endpoints (require `admin`, `owner`, or `program_admin`)
- `/api/admin/*` - All admin endpoints
- `/api/admin/users/*` - User management
- `/api/admin/policies/*` - Policy management
- `/api/admin/dashboard` - Dashboard metrics

### Estimator+ Endpoints (require `estimator`, `admin`, `owner`, or `program_admin`)
- `/api/estimates/*` - Estimate management
- `/api/communications/*` - Communications (some endpoints)

### All Authenticated Users
- `/api/jobs/*` - Job access (filtered by RLS)
- `/api/alerts/*` - Alerts (filtered by RLS)
- `/api/field/*` - Field operations

---

## RLS (Row Level Security) Policies

The database uses RLS policies that check roles:

```sql
-- Example: Admin-only access
WHERE profiles.role IN ('admin', 'owner', 'estimator')

-- Example: Owner-only access
WHERE profiles.role IN ('admin', 'owner')

-- Example: Full access for owner
WHERE profiles.role = 'owner' OR ...
```

---

## Setting Up Your Owner Account

1. **Create auth user in Supabase Dashboard** (already done)
2. **Run the SQL migration** to create/update your profile:

```sql
-- See: supabase/migrations/setup_owner_account.sql
```

3. **Verify your role:**
```sql
SELECT id, email, role FROM public.profiles 
WHERE id = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';
```

4. **Login to the application** - You'll have full access to all features!

---

## Notes

- **Role changes take effect immediately** - No restart needed
- **RLS policies enforce access** - Even if UI shows a feature, RLS will block unauthorized access
- **Owner role is the highest** - Use it for your personal account
- **Admin role is for staff** - Use for trusted team members who need admin access
- **Estimator role** - For users who need to create estimates but not manage users
- **Field tech role** - Default for new users, most restricted

