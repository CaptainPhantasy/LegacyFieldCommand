# LLM API Keys Setup Guide

## Required API Keys

For the LLM implementation, you'll need the following API keys:

### 1. OpenAI API Key (Required)
**Purpose:** GPT-4o, GPT-4 Vision for:
- Estimate generation
- Photo analysis
- Voice interpretation
- Scope enhancement
- Content descriptions
- Compliance QA

**How to Get:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important:** Save it immediately - you won't see it again!

**Cost:** Pay-as-you-go
- GPT-4o: ~$0.005 per 1K input tokens, ~$0.015 per 1K output tokens
- GPT-4 Vision: ~$0.01 per image + token costs

**Add to .env.local:**
```bash
OPENAI_API_KEY=sk-your-key-here
```

---

### 2. Anthropic API Key (Required)
**Purpose:** Claude 3.5 Sonnet for:
- Voice command processing
- Policy document parsing
- Report writing
- Email template generation
- Document understanding

**How to Get:**
1. Go to https://console.anthropic.com/
2. Sign in or create account
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

**Cost:** Pay-as-you-go
- Claude 3.5 Sonnet: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens

**Add to .env.local:**
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

### 3. AWS Credentials (Optional - For Phase 2+)
**Purpose:** AWS Textract for policy document OCR

**When Needed:** Phase 2 (Policy parsing enhancement)

**How to Get:**
1. Go to https://aws.amazon.com/
2. Create AWS account (if needed)
3. Navigate to IAM → Users → Create user
4. Attach policy: `AmazonTextractFullAccess`
5. Create access key (Access Key ID + Secret Access Key)

**Cost:** Pay-per-page
- Textract: ~$1.50 per 1,000 pages

**Add to .env.local:**
```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1  # or your preferred region
```

**Note:** Can be added later when implementing policy parsing enhancement.

---

## Complete .env.local Template

Add these to your `apps/web/.env.local` file:

```bash
# Existing Supabase keys (keep these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM API Keys (NEW - Add these)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# AWS Credentials (Optional - Add later for policy OCR)
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1

# LLM Feature Flags (Optional - Control LLM features)
LLM_ENABLED=true
LLM_OPENAI_ENABLED=true
LLM_ANTHROPIC_ENABLED=true

# Cost Control (Optional - Set limits)
LLM_MAX_TOKENS=4000
LLM_TEMPERATURE=0.7
```

---

## Environment Variable Usage

The LLM implementation will use these environment variables:

### Required (Phase 1)
- `OPENAI_API_KEY` - For GPT-4o and GPT-4 Vision
- `ANTHROPIC_API_KEY` - For Claude 3.5 Sonnet

### Optional (Phase 2+)
- `AWS_ACCESS_KEY_ID` - For Textract OCR
- `AWS_SECRET_ACCESS_KEY` - For Textract OCR
- `AWS_REGION` - AWS region for Textract

### Feature Flags (Optional)
- `LLM_ENABLED` - Master switch (default: `true`)
- `LLM_OPENAI_ENABLED` - Enable/disable OpenAI (default: `true`)
- `LLM_ANTHROPIC_ENABLED` - Enable/disable Anthropic (default: `true`)

### Cost Control (Optional)
- `LLM_MAX_TOKENS` - Max tokens per request (default: `4000`)
- `LLM_TEMPERATURE` - Model temperature (default: `0.7`)

---

## Security Best Practices

1. **Never commit .env.local to git**
   - Already in `.gitignore` (should be)
   - Use `.env.example` for templates

2. **Rotate keys if exposed**
   - If keys are ever committed, rotate immediately
   - Both OpenAI and Anthropic allow key rotation

3. **Use separate keys for production**
   - Different keys for dev/staging/prod
   - Monitor usage per environment

4. **Set usage limits**
   - OpenAI: Set spending limits in dashboard
   - Anthropic: Set usage limits in console
   - Monitor costs regularly

---

## Cost Estimation

### Development/Testing (Low Volume)
- **OpenAI:** ~$10-50/month (testing, development)
- **Anthropic:** ~$5-25/month (testing, development)
- **Total:** ~$15-75/month for development

### Production (100 jobs/month)
- **OpenAI:** ~$50-100/month
- **Anthropic:** ~$25-50/month
- **AWS Textract:** ~$5-10/month (if used)
- **Total:** ~$80-160/month for production

**Note:** Costs scale with usage. Monitor and adjust as needed.

---

## Testing the Keys

Once you add the keys, we'll create a test endpoint to verify they work:

```typescript
// Test endpoint: /api/llm/test
// Will test both OpenAI and Anthropic connections
```

---

## Next Steps

1. ✅ **Get OpenAI API key** - https://platform.openai.com/api-keys
2. ✅ **Get Anthropic API key** - https://console.anthropic.com/
3. ✅ **Add to .env.local** - Use template above
4. ✅ **Test keys** - We'll create test endpoint
5. ✅ **Start implementation** - Begin Phase 1

---

## Support Links

- **OpenAI:** https://platform.openai.com/docs
- **Anthropic:** https://docs.anthropic.com/
- **AWS Textract:** https://docs.aws.amazon.com/textract/

---

**Ready to proceed once keys are added!**

