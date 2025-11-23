# E2E Test Execution Plan

## Chain of Thought: Testing Strategy

### 1. **What needs to be tested?**
   - ✅ Job creation flow (admin)
   - ✅ Job assignment (admin → tech)
   - ✅ All 7 gates completion (tech)
   - ✅ Gate validation rules (room consistency, timestamps, photo requirements)
   - ✅ Error handling (unauthorized, validation, network)
   - ✅ Form validation
   - ✅ Authentication flows

### 2. **Why Playwright?**
   - Full browser automation (realistic user interactions)
   - Can test both UI and API endpoints
   - Built-in retry and error handling
   - Screenshot/video on failure
   - Parallel test execution
   - Cross-browser testing support

### 3. **Test Organization**
   - **Helpers**: Reusable functions (auth, jobs, gates)
   - **Spec Files**: Organized by feature/workflow
   - **Isolation**: Each test can run independently
   - **Cleanup**: Tests create their own data (idempotent)

### 4. **Test Execution Flow**

```
┌─────────────────────────────────────┐
│ 1. Setup Test Environment          │
│    - Verify test users exist       │
│    - Start dev server (auto)       │
│    - Install browsers              │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 2. Job Creation Tests               │
│    - Create job                    │
│    - Validate form                  │
│    - Verify gates created          │
│    - Assign to tech                │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 3. Full Workflow Tests              │
│    - Login as admin                 │
│    - Create & assign job            │
│    - Login as tech                  │
│    - Complete all 7 gates           │
│    - Verify job status              │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 4. Validation Tests                 │
│    - Room consistency               │
│    - Photo requirements             │
│    - Timestamp order                │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 5. Error Scenario Tests             │
│    - Unauthorized access            │
│    - Invalid inputs                 │
│    - Network errors                 │
└─────────────────────────────────────┘
```

## Execution Steps

### Step 1: Verify Prerequisites

```bash
# 1. Check test users exist in Supabase
#    - admin@legacyfield.com (or TEST_ADMIN_EMAIL)
#    - tech@legacyfield.com (or TEST_TECH_EMAIL)

# 2. Verify dev server can start
cd apps/web
npm run dev
# Should start on http://localhost:8765

# 3. Install Playwright browsers
npx playwright install chromium
```

### Step 2: Run Tests

```bash
# Run all tests
npm run test:e2e

# Or run specific suite
npx playwright test e2e/job-creation.spec.ts
npx playwright test e2e/full-workflow.spec.ts
npx playwright test e2e/validation.spec.ts
npx playwright test e2e/error-scenarios.spec.ts
```

### Step 3: Review Results

```bash
# View HTML report
npx playwright show-report

# Check test results
# - Screenshots in test-results/
# - Videos (if enabled)
# - Traces (on retry)
```

## Expected Test Results

### Success Criteria

1. **Job Creation** ✅
   - All 4 tests pass
   - Jobs created successfully
   - Gates initialized correctly

2. **Full Workflow** ✅
   - Job created and assigned
   - All 7 gates completed
   - Job status updated

3. **Validation** ✅
   - Room consistency blocks invalid scope
   - Photo requirements enforced
   - Timestamp validation works

4. **Error Scenarios** ✅
   - Unauthorized redirects work
   - Form validation prevents invalid submissions
   - Error messages displayed

### Known Limitations

1. **Photo Uploads**: Tests use exception flow (requires file system setup)
2. **Real Photo Testing**: Would need test image files and file upload mocking
3. **Concurrent Tests**: May create duplicate jobs (use unique timestamps)
4. **Database Cleanup**: Tests don't clean up created jobs (manual cleanup may be needed)

## Troubleshooting

### Issue: Tests timeout
**Solution**: 
- Verify dev server is running
- Check BASE_URL in config
- Increase timeout in playwright.config.ts

### Issue: Authentication fails
**Solution**:
- Verify test users exist
- Check credentials in helpers/auth.ts
- Verify Supabase connection

### Issue: Element not found
**Solution**:
- UI may have changed - update selectors
- Use Playwright Inspector: `npx playwright codegen`
- Check page.waitForLoadState() calls

### Issue: Tests create duplicate data
**Solution**:
- Tests use timestamps for uniqueness
- Consider test database isolation
- Add cleanup scripts if needed

## Next Steps

1. **Run initial test suite** to verify setup
2. **Fix any failing tests** based on actual UI structure
3. **Add photo upload testing** with test image files
4. **Add performance tests** for critical paths
5. **Set up CI/CD** integration

## Success Metrics

- ✅ All test files created
- ✅ Helper functions implemented
- ✅ Test coverage for critical paths
- ✅ Documentation complete
- ⏳ Tests ready to run (pending execution)

