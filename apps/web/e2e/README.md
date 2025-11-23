# E2E Test Suite

Comprehensive end-to-end tests for Legacy Field Command using Playwright.

## Setup

### Prerequisites

1. **Test Users**: Ensure you have test users in your Supabase database:
   - Admin user: `admin@legacyfield.com` (or set `TEST_ADMIN_EMAIL`)
   - Field tech user: `tech@legacyfield.com` (or set `TEST_TECH_EMAIL`)
   - Both should have password: `testpassword123` (or set via env vars)

2. **Environment Variables** (optional):
   ```bash
   export TEST_ADMIN_EMAIL=admin@legacyfield.com
   export TEST_ADMIN_PASSWORD=testpassword123
   export TEST_TECH_EMAIL=tech@legacyfield.com
   export TEST_TECH_PASSWORD=testpassword123
   export BASE_URL=http://localhost:8765
   ```

### Installation

```bash
# Install dependencies (already done)
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test e2e/job-creation.spec.ts
```

### Run specific test
```bash
npx playwright test -g "Admin can create a new job"
```

## Test Structure

### Test Files

1. **`job-creation.spec.ts`** - Job creation flow
   - Admin can create jobs
   - Form validation
   - Default gates creation
   - Job assignment

2. **`full-workflow.spec.ts`** - Complete job lifecycle
   - Admin creates and assigns job
   - Field tech completes all 7 gates
   - Job status updates

3. **`validation.spec.ts`** - Gate validation rules
   - Room consistency (Scope ↔ Photos)
   - Photo requirements (3 per room)
   - Timestamp validation (Arrival → Departure)

4. **`error-scenarios.spec.ts`** - Error handling
   - Unauthorized access
   - Invalid submissions
   - Network errors

### Helper Functions

Located in `e2e/helpers/`:

- **`auth.ts`** - Authentication helpers
  - `loginAs(page, user)` - Login as specific user
  - `logout(page)` - Logout current user
  - `isLoggedIn(page)` - Check login status

- **`jobs.ts`** - Job operations
  - `createJob(page, jobData)` - Create new job
  - `findJobByTitle(page, title)` - Find job by title
  - `assignJobToTech(page, jobId, techId)` - Assign job

- **`gates.ts`** - Gate operations
  - `navigateToGate(page, jobId, gateId)` - Navigate to gate
  - `completeArrivalGate(page)` - Complete Arrival gate
  - `completeIntakeGate(page)` - Complete Intake gate
  - ... (one for each gate type)

## Test Coverage

### ✅ Covered

- Job creation and assignment
- All 7 gates completion flow
- Validation rules (room consistency, timestamps)
- Error handling (unauthorized, validation)
- Form validation

### ⚠️ Partially Covered

- Photo uploads (requires file system setup)
- Exception logging (uses exception flow for testing)
- Network error recovery (basic test exists)

### ❌ Not Covered (Future)

- Voice command API
- Mobile app flows
- Offline sync
- Performance testing
- Load testing

## Debugging Tests

### View test report
```bash
npx playwright show-report
```

### Debug in VS Code
1. Install "Playwright Test for VSCode" extension
2. Set breakpoints in test files
3. Run "Debug Test" from test file

### Screenshots and Videos
- Screenshots: Saved on failure in `test-results/`
- Videos: Saved on failure (if enabled in config)
- Traces: Saved on retry (if enabled in config)

## Troubleshooting

### Tests fail with "Timeout"
- Check that dev server is running on port 8765
- Verify test users exist in database
- Check network connectivity

### Tests fail with "Element not found"
- UI structure may have changed
- Update selectors in test files
- Use Playwright's codegen: `npx playwright codegen http://localhost:8765`

### Authentication fails
- Verify test user credentials
- Check Supabase connection
- Ensure RLS policies allow test users

## CI/CD Integration

To run in CI:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci
- name: Install Playwright
  run: npx playwright install --with-deps
- name: Run tests
  run: npm run test:e2e
```

## Notes

- Tests use real Supabase database (configure test environment)
- Tests create real jobs (consider cleanup)
- Some tests use exceptions to bypass photo requirements
- Tests are designed to be idempotent where possible

