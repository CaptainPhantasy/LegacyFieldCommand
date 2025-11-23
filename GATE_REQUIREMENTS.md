# Chain of Thought: Field Agent Gate Requirements

## Gate Flow Analysis

### 1. ARRIVAL Gate
**Purpose:** Verify tech arrived on-site, establish baseline
**Required:**
- [ ] Arrival timestamp (auto-captured)
- [ ] Arrival photo (exterior of property/unit)
- [ ] Location/GPS confirmation (optional but recommended)
**Exception Allowed:** Yes (with reason: "Unable to access property", "Wrong address", etc.)
**Blocking:** Cannot proceed to Intake without completion or exception

### 2. INTAKE Gate
**Purpose:** Initial customer contact, loss type identification
**Required:**
- [ ] Customer contact info (name, phone) OR confirmation customer unavailable
- [ ] Loss type selection (Water, Fire, Mold, Storm, Other)
- [ ] Initial damage description (picklist: "Visible water", "Smoke damage", "Structural", etc.)
- [ ] Customer signature/acknowledgment OR exception reason
**Exception Allowed:** Yes (e.g., "Customer not present, left notice")
**Blocking:** Cannot proceed to Photos without completion

### 3. PHOTOS Gate
**Purpose:** Comprehensive visual documentation
**Required:**
- [ ] At least ONE room documented with photos
- [ ] Each photo must have:
  - Room selection (Kitchen, Living Room, Bedroom, Bathroom, Basement, Attic, Exterior, Other)
  - Photo type (Wide shot, Close-up damage, Equipment, PPE, Other)
  - Affected area description (picklist: "North wall", "Floor", "Ceiling", "Cabinets", etc.)
- [ ] Minimum 3 photos per documented room (wide, close-up, context)
- [ ] At least ONE PPE photo if PPE required for job type
**Exception Allowed:** Yes (with detailed reason: "No access to room", "Customer declined photos")
**Blocking:** Cannot proceed to Moisture/Equipment without at least one room documented

### 4. MOISTURE/EQUIPMENT Gate
**Purpose:** Technical measurements and equipment deployment
**Required:**
- [ ] Moisture readings (at least one reading per affected room) OR "No moisture detected" confirmation
- [ ] Equipment deployed list (Air movers, Dehumidifiers, HEPA filters, None) OR exception
- [ ] Equipment placement photos (if equipment deployed)
**Exception Allowed:** Yes (e.g., "No equipment needed", "Equipment unavailable")
**Blocking:** Cannot proceed to Scope without completion

### 5. SCOPE Gate
**Purpose:** Detailed damage assessment for estimating
**Required:**
- [ ] Affected rooms list (must match rooms with photos)
- [ ] Damage type per room (picklist: "Drywall", "Flooring", "Cabinets", "HVAC", etc.)
- [ ] Measurements (sqft affected, linear ft, etc.) OR "Visual estimate only" flag
- [ ] Scope notes (structured: "What needs repair", "What needs replacement")
**Exception Allowed:** Yes (e.g., "Scope deferred to estimator", "Customer declined full scope")
**Blocking:** Cannot proceed to Sign-offs without completion

### 6. SIGN-OFFS Gate
**Purpose:** Customer approval and authorization
**Required:**
- [ ] Work authorization signature OR exception reason
- [ ] Insurance claim number (if applicable) OR "Customer pay" flag
- [ ] Next steps acknowledgment (picklist: "Wait for adjuster", "Proceed with work", "Quote pending")
**Exception Allowed:** Yes (e.g., "Customer unavailable, left documentation")
**Blocking:** Cannot proceed to Departure without completion

### 7. DEPARTURE Gate
**Purpose:** Final confirmation, equipment status, handoff
**Required:**
- [ ] Departure timestamp (auto-captured)
- [ ] Equipment status (All removed, Left on-site, Customer pickup scheduled)
- [ ] Final notes (optional but recommended)
- [ ] Job status update (Ready for estimate, Needs follow-up, Complete)
**Exception Allowed:** No (must complete)
**Blocking:** Job cannot be marked "Visit Complete" without this gate

## Anti-Fudging Rules

1. **Photo-Gate Mismatch:** If Photos gate marked complete but < 3 photos per room → Force exception or block
2. **Room Consistency:** If Scope lists "Kitchen" but no Kitchen photos → Alert and require exception
3. **Timestamp Validation:** Arrival must be before Departure (system enforced)
4. **User Accountability:** Every gate completion logs: user_id, timestamp, location (if available)
5. **Exception Frequency:** If > 2 exceptions in one visit → Auto-flag for supervisor review

## UI Requirements

- **Visual Progress:** Show gate checklist with checkmarks/X/Exception icons
- **Context-Aware Prompts:** After selecting "Kitchen" → Auto-show Kitchen-specific checklist
- **Minimal Free Text:** Use picklists, buttons, templates wherever possible
- **Offline-First:** All gates must work offline, sync when online
- **Clear Blocking:** If gate incomplete, show WHY (missing photos, missing data, etc.)

