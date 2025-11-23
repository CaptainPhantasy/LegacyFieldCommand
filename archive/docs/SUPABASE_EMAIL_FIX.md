# Fix Supabase Email Bounce Issue

## Problem
Supabase is detecting high bounce rates from transactional emails (signup confirmations, password resets). This can lead to email sending restrictions.

## Root Causes

1. **Email Confirmations Enabled** - Supabase sends confirmation emails on signup
2. **Invalid Test Emails** - Development/testing with fake email addresses
3. **E2E Tests** - Automated tests creating users with invalid emails
4. **No Email Validation** - Application not validating email format before signup

## Immediate Fixes

### Option 1: Disable Email Confirmations (Recommended for Development)

1. Go to Supabase Dashboard:
   - https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/auth/url-configuration
   - Or: Settings → Auth → Email Auth

2. **Uncheck** "Enable email confirmations"
   - This prevents Supabase from sending confirmation emails
   - Users can login immediately after signup

3. **Save** changes

### Option 2: Use Valid Test Email Addresses

If you need email confirmations enabled:

1. **Use real email addresses** for testing:
   - Use your own email addresses
   - Use services like Mailinator, 10minutemail, or similar
   - Use a dedicated test email domain

2. **Update test scripts** to use valid emails:
   ```javascript
   // Instead of: test@legacyfield.com
   // Use: your-real-email@gmail.com
   ```

### Option 3: Set Up Custom SMTP (Production)

For production, use a custom SMTP provider:

1. Go to: https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/settings/auth
2. Scroll to "SMTP Settings"
3. Configure:
   - **SendGrid** (recommended)
   - **Mailgun**
   - **AWS SES**
   - **Postmark**
   - Or your own SMTP server

4. Benefits:
   - Better deliverability
   - Higher sending limits
   - Better analytics
   - More control

## Code Changes Needed

### 1. Add Email and Password Validation

Update `apps/web/app/login/actions.ts` to validate emails and passwords:

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!isValidEmail(email)) {
    redirect(`/login?error=${encodeURIComponent('Invalid email address')}`)
    return
  }
  
  // Validate password (8 characters minimum, matches Supabase)
  if (!password || password.length < 8) {
    redirect(`/login?error=${encodeURIComponent('Password must be at least 8 characters')}`)
    return
  }
  
  // ... rest of signup logic
}
```

### 2. Update E2E Tests

Update `e2e/helpers/auth.ts` to use valid test emails or disable email sending:

```typescript
// Option A: Use valid test emails
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'your-real-email@gmail.com',
    // ...
  },
  // ...
}

// Option B: Disable email confirmations in Supabase (recommended)
// Then any email format works for testing
```

### 3. Add Email Validation in UI

Add client-side validation in `apps/web/app/login/page.tsx`:

```typescript
// Add email validation before form submission
const emailInput = page.locator('input[name="email"]')
await emailInput.fill(email)
await emailInput.blur() // Triggers validation

// Check for validation error
const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
```

## Recommended Setup for Development

1. **Disable email confirmations** (easiest)
2. **Use simple test emails** like `test@test.com` (won't send emails)
3. **Manually confirm users** in Supabase Dashboard if needed

## Recommended Setup for Production

1. **Enable email confirmations**
2. **Set up custom SMTP** (SendGrid recommended)
3. **Add email validation** in application
4. **Use real email addresses** only
5. **Monitor bounce rates** in SMTP provider dashboard

## Verification Steps

1. **Check Supabase Dashboard**:
   - Go to: Settings → Auth → Email Auth
   - Verify "Enable email confirmations" is unchecked (for dev)

2. **Test Signup**:
   - Create a new user via signup form
   - Should NOT receive confirmation email
   - Should be able to login immediately

3. **Monitor Bounce Rate**:
   - Check Supabase dashboard for bounce metrics
   - Should decrease after disabling confirmations

## Long-term Solution

For production:
- Set up custom SMTP provider
- Implement proper email validation
- Use email verification service
- Monitor and maintain email list hygiene

## Quick Fix Command

If you have Supabase CLI:

```bash
# Disable email confirmations via CLI (if available)
supabase auth settings update --disable-email-confirmations
```

Or use the Dashboard (easier).

