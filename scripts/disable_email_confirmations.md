# Disable Email Confirmations in Supabase

## Quick Steps

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/auth/url-configuration
   - Or navigate: Settings → Auth → Email Auth

2. **Find "Enable email confirmations"**
   - It's a checkbox/toggle

3. **Uncheck it** (disable)

4. **Save** changes

5. **Verify**:
   - Try creating a new user
   - Should NOT receive confirmation email
   - Should be able to login immediately

## Why This Fixes Bounces

- Supabase won't send confirmation emails
- No emails = no bounces
- Users can login immediately after signup
- Perfect for development/testing

## For Production

When ready for production:
1. Re-enable email confirmations
2. Set up custom SMTP provider (SendGrid, Mailgun, etc.)
3. Use real email addresses only
4. Monitor bounce rates

