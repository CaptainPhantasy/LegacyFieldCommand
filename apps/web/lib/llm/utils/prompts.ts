/**
 * Prompt Templates
 * 
 * Reusable prompt templates for different use cases
 */

export interface PromptOptions {
  [key: string]: string | number | boolean | unknown
}

/**
 * Build a prompt from a template
 */
export function buildPrompt(
  template: string,
  options: PromptOptions
): string {
  let prompt = template

  // Replace placeholders like {{key}} with values
  Object.entries(options).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    prompt = prompt.replace(regex, String(value))
  })

  return prompt
}

/**
 * Estimate Generation Prompt
 */
export const ESTIMATE_GENERATION_PROMPT = `You are an expert restoration estimator. Analyze the following job data and generate a detailed estimate.

Job Information:
- Title: {{jobTitle}}
- Loss Type: {{lossType}}
- Affected Rooms: {{rooms}}
- Damage Description: {{damageDescription}}
- Photos: {{photoCount}} photos available
- Scope Notes: {{scopeNotes}}
- Measurements: {{measurements}}

Policy Coverage:
- Deductible: ${'$'}{{deductible}}
- Coverage Limits: {{coverageLimits}}
- Exclusions: {{exclusions}}

Generate line items with:
1. Internal code
2. Xactimate code mapping (if applicable)
3. Description
4. Quantity (from measurements/photos)
5. Unit cost
6. Total cost
7. Coverage bucket (insurance/customer-pay/non-covered)

Return as JSON array of line items with this structure:
[
  {
    "code": "DEM-001",
    "xactimate_code": "DMO001",
    "description": "Description here",
    "category": "Category",
    "room": "Room name",
    "quantity": 100,
    "unit_cost": 2.50,
    "coverage_bucket": "insurance"
  }
]`

/**
 * Photo Analysis Prompt
 */
export const PHOTO_ANALYSIS_PROMPT = `Analyze this restoration damage photo and extract structured information.

Return JSON with:
{
  "damageType": "water|fire|mold|storm|structural",
  "severity": "mild|moderate|severe",
  "room": "kitchen|living room|bedroom|bathroom|basement|attic|exterior|other",
  "affectedMaterials": ["drywall", "flooring", "cabinets"],
  "photoType": "wide_shot|close_up|context|equipment",
  "equipmentVisible": ["air_movers", "dehumidifiers"],
  "compliance": {
    "meetsRequirements": true|false,
    "missing": ["wide_shot", "close_up"]
  },
  "confidence": 0.0-1.0
}`

/**
 * Policy Parsing Prompt
 */
export const POLICY_PARSING_PROMPT = `Extract structured data from this insurance policy document.

Return JSON with:
{
  "policyNumber": "string",
  "carrier": "string",
  "effectiveDate": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "deductible": 1000,
  "coverageLimits": {
    "dwelling": 500000,
    "personalProperty": 250000,
    "liability": 300000,
    "lossOfUse": 100000
  },
  "exclusions": ["flood", "earthquake"],
  "sublimits": {
    "mold": 10000
  },
  "confidence": 0.0-1.0
}`

/**
 * Voice Command Processing Prompt
 */
export const VOICE_COMMAND_PROMPT = `You are a voice assistant for field technicians. Process this voice command and determine the intent.

Current Context:
- Job: {{jobTitle}} ({{jobId}})
- Current Gate: {{gateName}} ({{gateId}})
- User Role: {{userRole}}

User Command: {{command}}

Determine the intent and return JSON:
{
  "intent": "show_jobs|open_gate|complete_gate|take_photo|log_exception|get_requirements|next_gate|unknown",
  "action": "action_description",
  "data": {
    "gateId": "uuid",
    "jobId": "uuid",
    "reason": "string"
  },
  "response": "Natural language response for the user",
  "confidence": 0.0-1.0
}`

/**
 * Voice Interpretation Prompt
 */
export const VOICE_INTERPRETATION_PROMPT = `Extract structured data from this voice transcription.

Transcription: {{transcription}}

Job Context:
- Job ID: {{jobId}}
- Loss Type: {{lossType}}

Return JSON:
{
  "intent": "damage_description|customer_notes|quote_elements|action_items",
  "entities": {
    "damageTypes": ["water", "flooring"],
    "rooms": ["kitchen", "living room"],
    "severity": "mild|moderate|severe"
  },
  "extractedData": {
    "customerNotes": "string",
    "damageDescription": "string",
    "quoteElements": [],
    "actionItems": []
  },
  "confidence": 0.0-1.0
}`

/**
 * Report Generation Prompt
 */
export const REPORT_GENERATION_PROMPT = `Generate a professional restoration report narrative based on this job data.

Job Information:
{{jobData}}

Generate:
1. Executive Summary (2-3 paragraphs)
2. Damage Assessment (detailed)
3. Work Performed (chronological)
4. Recommendations (next steps)

Write in professional, clear language suitable for insurance adjusters and customers.`

/**
 * Email Template Prompt
 */
export const EMAIL_TEMPLATE_PROMPT = `Generate a personalized email based on this context.

Job: {{jobTitle}}
Customer: {{customerName}}
Status: {{jobStatus}}
Message Type: {{messageType}}

Generate a professional, empathetic email. Tone: {{tone}} (professional|empathetic|urgent)`

