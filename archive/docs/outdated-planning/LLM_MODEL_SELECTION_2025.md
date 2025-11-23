# LLM Model Selection Guide - November 2025
## Latest Models & Optimizations

**Last Updated:** November 22, 2025

---

## Anthropic Claude Models (Latest)

### Claude Haiku 4.5 (October 2025) - **COST-EFFECTIVE CHAMPION** ⭐

- **Best For:** High-volume tasks, real-time applications, coding, agent tasks
- **Strengths:**
  - **Matches Sonnet 4 performance** in coding and agent tasks
  - **1/3 the cost** of Sonnet 4
  - **2x faster** than Sonnet 4
  - 73.3% on SWE-bench (top coding model globally)
  - Near-frontier performance
- **Use Cases:**
  - Voice command processing (fast, cost-effective)
  - High-volume text processing
  - Coding assistance
  - Agent workflows
  - Real-time chat/assistants
  - Cost-sensitive applications
- **API Model Name:** `claude-haiku-4-20251015`
- **Context Window:** 200K tokens
- **Cost:** $1/1M input tokens, $5/1M output tokens (1/3 of Sonnet 4!)
- **Speed:** 2x faster than Sonnet 4

**Recommendation:** Use Haiku 4.5 as the **default** for most tasks, upgrade to Sonnet 4/Opus 4 only when needed.

---

### Claude 4 Series (May 2025)

#### Claude Sonnet 4
- **Best For:** Everyday tasks, coding, instruction following
- **Strengths:**
  - Improved coding abilities
  - Better adherence to instructions
  - Efficient for high-volume use
  - Cost-effective
- **Use Cases:**
  - Voice command processing
  - Policy document parsing
  - Report writing
  - Email template generation
  - General text processing
- **API Model Name:** `claude-sonnet-4-20250514` (or latest)
- **Context Window:** 200K tokens
- **Cost:** ~$0.003/1K input, ~$0.015/1K output

#### Claude Opus 4
- **Best For:** Complex, long-horizon tasks, agent workflows
- **Strengths:**
  - Thousands of reasoning steps
  - Extended focus without losing context
  - Complex reasoning tasks
  - Agent workflows
- **Use Cases:**
  - Complex estimate generation
  - Multi-step analysis
  - Advanced compliance checking
  - Complex automation rules
- **API Model Name:** `claude-opus-4-20250514` (or latest)
- **Context Window:** 200K tokens
- **Cost:** Higher than Sonnet (premium pricing)

### Claude 3.7 Sonnet (February 2025)
- **Best For:** Hybrid reasoning (fast vs. deep)
- **Strengths:**
  - Toggle between rapid and deep reasoning
  - Visible scratchpad (transparency)
  - Step-by-step reasoning
- **Use Cases:**
  - When you need reasoning transparency
  - Complex problem-solving
- **API Model Name:** `claude-3-7-sonnet-20250224`
- **Note:** Claude 4 Sonnet is newer and generally better

### Claude 3.5 Sonnet (June 2024)
- **Status:** Still available, but Claude 4 Sonnet is recommended
- **Use:** Fallback or if Claude 4 not available
- **API Model Name:** `claude-3-5-sonnet-20241022`

---

## OpenAI GPT Models (Latest)

### GPT-5 (August 2025) - **RECOMMENDED FOR COMPLEX TASKS**

- **Best For:** Complex reasoning, PhD-level tasks
- **Strengths:**
  - Dynamic router (quick vs. deep reasoning)
  - PhD-level performance across domains
  - Mathematics, coding, healthcare, multimodal
  - State-of-the-art reasoning
- **Use Cases:**
  - Complex estimate generation
  - Advanced photo analysis
  - Complex compliance checking
  - Multi-step reasoning tasks
- **API Model Name:** `gpt-5` (or `gpt-5-turbo`)
- **Context Window:** 128K+ tokens
- **Cost:** Premium pricing (most expensive)
- **Note:** May not be available in all regions yet

### GPT-4.5 / Orion (February 2025)

- **Best For:** Accuracy-critical tasks
- **Strengths:**
  - Reduced inaccuracies
  - High accuracy
  - "Giant, expensive model" (per Sam Altman)
- **Use Cases:**
  - Policy document parsing (accuracy critical)
  - Estimate generation (accuracy critical)
  - Compliance checking
- **API Model Name:** `gpt-4.5` or `gpt-4.5-turbo`
- **Cost:** High (premium model)

### GPT-4o (May 2024) - **RECOMMENDED FOR MULTIMODAL**

- **Best For:** Multimodal tasks (text + images + audio)
- **Strengths:**
  - Multimodal processing
  - Vision capabilities
  - Audio processing
  - State-of-the-art in voice, multilingual, vision
- **Use Cases:**
  - Photo analysis (damage assessment)
  - Vision tasks
  - Content description from images
  - Scope enhancement from photos
- **API Model Name:** `gpt-4o` or `gpt-4o-2024-08-06`
- **Vision Model:** `gpt-4o` (includes vision)
- **Context Window:** 128K tokens
- **Cost:** ~$0.005/1K input, ~$0.015/1K output

### o3 Series (2025)

- **o3-mini** (January 2025)
- **o3-pro** (June 2025)
- **Best For:** Mathematical and scientific reasoning
- **Strengths:**
  - Enhanced reasoning skills
  - Mathematical problem-solving
  - Scientific tasks
- **Use Cases:**
  - Complex calculations
  - Scientific analysis
  - Mathematical reasoning
- **Note:** May be overkill for most restoration tasks

---

## Updated Model Recommendations by Use Case

### Voice Command Processing
**Primary:** Claude Haiku 4.5 ⭐
- **2x faster** than Sonnet 4 (critical for real-time voice)
- **1/3 the cost** (perfect for high-volume voice commands)
- Matches Sonnet 4 performance in instruction following
- Ideal for real-time applications

**Alternative:** Claude Sonnet 4 (if more complex reasoning needed)

---

### Voice Interpretation (Transcription → Structured Data)
**Primary:** GPT-5 or GPT-4.5
- Superior structured output
- Complex reasoning for extraction
- High accuracy

**Alternative:** Claude Opus 4 (if GPT-5 unavailable)

---

### Photo Analysis & Damage Assessment
**Primary:** GPT-4o
- Best-in-class vision capabilities
- Multimodal understanding
- Damage assessment from images

**Alternative:** GPT-5 (if vision support available)

---

### Policy Document Parsing
**Primary:** Claude Haiku 4.5 + OCR ⭐
- Excellent document understanding (matches Sonnet 4)
- Long context window (200K)
- **1/3 the cost** (perfect for document processing)
- Fast processing

**Alternative:** Claude Sonnet 4 (if complex reasoning needed)

---

### Estimate Generation
**Primary:** GPT-5 or GPT-4.5
- Complex reasoning required
- Code mapping accuracy
- Multi-step analysis

**Alternative:** Claude Opus 4 (if GPT-5 unavailable)

---

### Report Writing
**Primary:** Claude Sonnet 4
- Excellent writing quality
- Professional tone
- Long context for full reports
- Cost-effective

**Alternative:** Claude Opus 4 (for complex reports)

---

### Email Template Generation
**Primary:** Claude Haiku 4.5 ⭐
- Matches Sonnet 4 writing quality
- Tone control
- Personalization
- **1/3 the cost** (perfect for high-volume emails)
- Fast generation

**Alternative:** Claude Sonnet 4 (if complex personalization needed)

---

### Alert & Automation Rule Generation
**Primary:** GPT-5 or Claude Opus 4
- Complex logic generation
- Pattern recognition
- Code-like reasoning

---

### Content Description Generation
**Primary:** GPT-4o
- Vision capabilities
- Image understanding
- Description generation

---

### Scope Enhancement
**Primary:** GPT-4o (vision) + GPT-5 (reasoning)
- Vision for photo analysis
- Reasoning for scope generation

---

## Updated Model Selection Matrix

| Use Case | Primary Model | Alternative | Reasoning |
|----------|--------------|-------------|-----------|
| Voice Commands | **Claude Haiku 4.5** ⭐ | Claude Sonnet 4 | 2x faster, 1/3 cost, matches Sonnet 4 performance |
| Voice Interpretation | GPT-5 | Claude Opus 4 | Superior structured extraction, reasoning |
| Photo Analysis | GPT-4o | GPT-5 | Best vision capabilities |
| Policy Parsing | **Claude Haiku 4.5** ⭐ | Claude Sonnet 4 | 1/3 cost, matches Sonnet 4, fast |
| Estimate Generation | GPT-5 | GPT-4.5 / Claude Opus 4 | Complex reasoning, accuracy |
| Report Writing | Claude Sonnet 4 | Claude Opus 4 | Writing quality, cost-effective |
| Email Templates | **Claude Haiku 4.5** ⭐ | Claude Sonnet 4 | 1/3 cost, fast, matches quality |
| Alert Rules | GPT-5 | Claude Opus 4 | Logic generation |
| Automation Rules | GPT-5 | Claude Opus 4 | Pattern recognition |
| Content Descriptions | GPT-4o | GPT-5 | Vision capabilities |
| Scope Enhancement | GPT-4o + GPT-5 | Claude Opus 4 | Vision + reasoning |

---

## Implementation Strategy

### Phase 1: Start with Proven Models
- **Claude Sonnet 4** - For most text tasks
- **GPT-4o** - For vision tasks
- **GPT-5** - For complex reasoning (if available)

### Phase 2: Optimize Based on Results
- Test Claude Opus 4 for complex tasks
- Test GPT-4.5 for accuracy-critical tasks
- Monitor costs and performance

### Fallback Strategy
- If GPT-5 unavailable → Use GPT-4.5 or Claude Opus 4
- If Claude Sonnet 4 unavailable → Use Claude 3.7 Sonnet
- If GPT-4o unavailable → Use GPT-4o-mini or Claude with vision

---

## API Model Names (Latest)

### Anthropic
```typescript
'claude-haiku-4-20251015'    // Claude Haiku 4.5 (RECOMMENDED - cost-effective)
'claude-sonnet-4-20250514'  // Claude Sonnet 4
'claude-opus-4-20250514'    // Claude Opus 4
'claude-3-7-sonnet-20250224' // Claude 3.7 Sonnet
'claude-3-5-sonnet-20241022' // Claude 3.5 Sonnet (fallback)
```

### OpenAI
```typescript
'gpt-5'                      // GPT-5 (latest)
'gpt-5-turbo'                // GPT-5 Turbo
'gpt-4.5'                    // GPT-4.5 / Orion
'gpt-4.5-turbo'              // GPT-4.5 Turbo
'gpt-4o'                     // GPT-4o (multimodal)
'gpt-4o-2024-08-06'          // GPT-4o (specific version)
'o3-pro'                     // o3-pro (reasoning)
'o3-mini'                    // o3-mini (reasoning)
```

---

## Cost Considerations (November 2025)

### Anthropic
- **Claude Haiku 4.5:** $0.001/1K input, $0.005/1K output ⭐ **BEST VALUE**
- **Claude Sonnet 4:** ~$0.003/1K input, ~$0.015/1K output
- **Claude Opus 4:** Higher pricing (premium)
- **Claude 3.7 Sonnet:** Similar to Sonnet 4

**Haiku 4.5 is 1/3 the cost of Sonnet 4 with matching performance!**

### OpenAI
- **GPT-5:** Premium pricing (most expensive)
- **GPT-4.5:** High pricing
- **GPT-4o:** ~$0.005/1K input, ~$0.015/1K output
- **o3 series:** Premium pricing

**Recommendation:** Start with **Claude Haiku 4.5** (default) + GPT-4o (vision) for maximum cost-effectiveness. Upgrade to Claude Sonnet 4/Opus 4 or GPT-5 only for complex reasoning tasks.

---

## Next Steps

1. ✅ **Update model clients** to use latest model names
2. ✅ **Test Claude Sonnet 4** for text tasks
3. ✅ **Test GPT-4o** for vision tasks
4. ✅ **Test GPT-5** for complex reasoning (if available)
5. ✅ **Monitor performance** and adjust model selection

---

**End of Updated Model Selection Guide**

