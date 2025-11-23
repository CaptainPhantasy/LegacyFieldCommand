# iOS Simulator Testing Guide

## Prerequisites

- Xcode installed
- iOS Simulator available
- Development server running (or ngrok tunnel)

## Quick Start

### 1. Start Development Server

```bash
cd apps/web
npm run dev
```

Or use ngrok tunnel for external access:

```bash
npm run tunnel
# Note the ngrok URL (e.g., https://abc123.ngrok.io)
```

### 2. Launch iPhone 14 Simulator

```bash
# Run the automated script
./scripts/test-ios-simulator.sh

# Or manually:
# 1. Find simulator UDID
xcrun simctl list devices | grep "iPhone 14"

# 2. Boot simulator
xcrun simctl boot <UDID>

# 3. Open Simulator app
open -a Simulator

# 4. Open Safari with your app URL
xcrun simctl openurl <UDID> http://localhost:8765
# Or if using ngrok:
xcrun simctl openurl <UDID> https://your-ngrok-url.ngrok.io
```

## Testing Checklist

### ✅ Basic Functionality

- [ ] **Login/Signup**
  - Login with test credentials
  - Sign up new user
  - Verify role-based routing works

- [ ] **Job Management**
  - Admin: Create new job
  - Admin: Assign job to field tech
  - Field Tech: View assigned jobs
  - Field Tech: Navigate to job detail

### ✅ Gate Workflow

- [ ] **Arrival Gate**
  - Take arrival photo (camera or library)
  - Verify photo preview appears
  - Complete gate
  - Verify gate status updates

- [ ] **Intake Gate**
  - Fill customer name and phone
  - Select loss type
  - Select affected areas (multiple rooms)
  - Select damage type for each room
  - Check customer signature
  - **Test autosave**: Wait 2.5 seconds, verify "✓ Draft saved" appears
  - Complete gate

- [ ] **Photos Gate**
  - Select room (e.g., Kitchen)
  - Take wide room shot
  - Take close-up of damage
  - Take context/equipment photo
  - Verify room shows "Complete"
  - Select another room and repeat
  - Complete gate

- [ ] **Moisture/Equipment Gate**
  - Enter moisture readings
  - Select equipment deployed
  - Take equipment photos (if equipment selected)
  - Complete gate

- [ ] **Scope Gate**
  - Select affected rooms
  - Select damage type for each room
  - Enter measurements
  - Enter scope notes
  - Complete gate

- [ ] **Sign-offs Gate**
  - Check work authorization signature
  - Enter insurance claim number (or check customer pay)
  - Select next steps
  - Complete gate

- [ ] **Departure Gate**
  - Select equipment status
  - Enter final notes
  - Select job status
  - Complete gate

### ✅ Data Persistence Testing

**Critical Test**: Verify data persists when browser is closed

1. **Navigate to Intake Gate**
   - Fill in all form fields:
     - Customer name: "John Doe"
     - Customer phone: "555-1234"
     - Loss type: "Water"
     - Select "Kitchen" and "Living Room" as affected areas
     - Select damage types for each room
     - Check customer signature

2. **Wait for Autosave**
   - Watch for "Saving..." indicator
   - Should change to "✓ Draft saved" after 2.5 seconds

3. **Close Safari Completely**
   - Swipe up from bottom (or Cmd+Q)
   - Force quit Safari if needed

4. **Reopen Safari**
   - Open Safari in simulator
   - Navigate back to the same gate URL
   - Login again if needed

5. **Verify Data Persisted**
   - All form fields should be filled
   - Selected checkboxes should be checked
   - Dropdowns should show selected values
   - **Expected**: All data should be restored

6. **Repeat for Other Gates**
   - Test Moisture/Equipment gate
   - Test Scope gate
   - Test Sign-offs gate
   - Test Departure gate

### ✅ Exception Logging

- [ ] Navigate to any gate
- [ ] Click "Log Exception"
- [ ] Verify modal opens
- [ ] Enter exception reason
- [ ] Submit exception
- [ ] Verify gate marked as "Skipped"
- [ ] Verify exception reason displayed on job detail page

### ✅ Error Handling

- [ ] **Network Errors**
  - Turn off WiFi/network
  - Try to complete a gate
  - Verify error message appears
  - Turn network back on
  - Verify retry works

- [ ] **Photo Upload Errors**
  - Try uploading very large photo (>10MB)
  - Verify error message
  - Try uploading with network off
  - Verify retry logic works

- [ ] **Validation Errors**
  - Try completing gate without required fields
  - Verify validation messages appear
  - Fill required fields
  - Verify gate can complete

### ✅ Mobile-Specific Testing

- [ ] **Touch Targets**
  - Verify all buttons are at least 44px tall
  - Verify buttons are easy to tap
  - Test on different screen sizes

- [ ] **Camera Access**
  - Grant camera permissions when prompted
  - Test camera capture works
  - Test library selection works

- [ ] **Keyboard**
  - Test keyboard appears for text inputs
  - Test keyboard dismisses properly
  - Test form submission with keyboard

- [ ] **Scrolling**
  - Test long forms scroll properly
  - Test modal scrolling
  - Test photo preview scrolling

- [ ] **Orientation**
  - Rotate device (if supported)
  - Verify layout adapts
  - Verify forms still work

### ✅ Accessibility Testing

- [ ] **VoiceOver** (if available)
  - Enable VoiceOver in Settings
  - Navigate through app
  - Verify all elements are announced
  - Verify buttons have labels

- [ ] **Keyboard Navigation**
  - Tab through form fields
  - Verify focus indicators visible
  - Test Enter key submits forms
  - Test Escape key closes modals

- [ ] **Color Contrast**
  - Verify text is readable
  - Verify buttons have good contrast
  - Test in both light and dark mode

## Common Issues & Solutions

### Issue: Simulator won't boot
**Solution**: 
```bash
xcrun simctl shutdown all
xcrun simctl boot <UDID>
```

### Issue: Safari won't open URL
**Solution**: 
- Check server is running: `curl http://localhost:8765`
- Use ngrok if testing from different network
- Try opening URL manually in Safari

### Issue: Camera not working
**Solution**:
- Grant camera permissions in Settings > Safari
- Use library selection as fallback
- Test on real device if simulator camera doesn't work

### Issue: Data not persisting
**Solution**:
- Check browser console for errors
- Verify autosave indicator shows "✓ Draft saved"
- Check network tab for failed requests
- Verify Supabase connection

### Issue: Forms not submitting
**Solution**:
- Check for validation errors
- Verify all required fields filled
- Check network connection
- Look for error messages in banner

## Test Results Template

```
Date: ___________
Tester: ___________
Device: iPhone 14 Simulator
iOS Version: ___________
Safari Version: ___________

### Test Results

✅ Login/Signup: PASS / FAIL
✅ Job Creation: PASS / FAIL
✅ Arrival Gate: PASS / FAIL
✅ Intake Gate: PASS / FAIL
✅ Photos Gate: PASS / FAIL
✅ Moisture/Equipment Gate: PASS / FAIL
✅ Scope Gate: PASS / FAIL
✅ Sign-offs Gate: PASS / FAIL
✅ Departure Gate: PASS / FAIL
✅ Data Persistence: PASS / FAIL
✅ Exception Logging: PASS / FAIL
✅ Error Handling: PASS / FAIL
✅ Mobile UX: PASS / FAIL
✅ Accessibility: PASS / FAIL

### Bugs Found

1. [Bug description]
   - Steps to reproduce:
   - Expected:
   - Actual:
   - Severity: Critical / High / Medium / Low

### Notes

[Additional observations, suggestions, etc.]
```

## Automated Testing Scripts

### Test Data Persistence
```bash
./scripts/test-data-persistence.sh
```

### Full iOS Test Suite
```bash
./scripts/test-ios-simulator.sh
```

## Next Steps After Testing

1. **Document all bugs found**
2. **Prioritize bugs by severity**
3. **Fix bugs systematically**
4. **Re-test after fixes**
5. **Update test results**

