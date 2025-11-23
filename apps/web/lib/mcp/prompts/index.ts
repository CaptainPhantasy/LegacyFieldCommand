/**
 * MCP Prompts Registry
 * 
 * Exposes prompt templates via MCP protocol
 */

import type { Prompt } from '@modelcontextprotocol/sdk/types.js'
import {
  ESTIMATE_GENERATION_PROMPT,
  PHOTO_ANALYSIS_PROMPT,
  POLICY_PARSING_PROMPT,
  VOICE_COMMAND_PROMPT,
  VOICE_INTERPRETATION_PROMPT,
  REPORT_GENERATION_PROMPT,
  EMAIL_TEMPLATE_PROMPT,
} from '../../llm/utils/prompts'

/**
 * All available prompts
 */
export const allPrompts: Prompt[] = [
  {
    name: 'estimate_generation',
    description: 'Prompt template for generating estimates from job data',
    arguments: [
      {
        name: 'jobTitle',
        description: 'Job title',
        required: true,
      },
      {
        name: 'lossType',
        description: 'Type of loss (water, fire, etc.)',
        required: true,
      },
      {
        name: 'rooms',
        description: 'Affected rooms',
        required: false,
      },
      {
        name: 'damageDescription',
        description: 'Description of damage',
        required: false,
      },
      {
        name: 'photoCount',
        description: 'Number of photos available',
        required: false,
      },
      {
        name: 'scopeNotes',
        description: 'Scope notes',
        required: false,
      },
      {
        name: 'measurements',
        description: 'Measurements data',
        required: false,
      },
      {
        name: 'deductible',
        description: 'Policy deductible',
        required: false,
      },
      {
        name: 'coverageLimits',
        description: 'Coverage limits',
        required: false,
      },
      {
        name: 'exclusions',
        description: 'Policy exclusions',
        required: false,
      },
    ],
  },
  {
    name: 'photo_analysis',
    description: 'Prompt template for analyzing damage photos',
    arguments: [],
  },
  {
    name: 'policy_parsing',
    description: 'Prompt template for parsing insurance policy documents',
    arguments: [],
  },
  {
    name: 'voice_command',
    description: 'Prompt template for processing voice commands',
    arguments: [
      {
        name: 'jobTitle',
        description: 'Current job title',
        required: false,
      },
      {
        name: 'jobId',
        description: 'Current job ID',
        required: false,
      },
      {
        name: 'gateName',
        description: 'Current gate name',
        required: false,
      },
      {
        name: 'gateId',
        description: 'Current gate ID',
        required: false,
      },
      {
        name: 'userRole',
        description: 'User role',
        required: false,
      },
      {
        name: 'command',
        description: 'Voice command text',
        required: true,
      },
    ],
  },
  {
    name: 'voice_interpretation',
    description: 'Prompt template for interpreting voice transcriptions',
    arguments: [
      {
        name: 'transcription',
        description: 'Transcribed voice text',
        required: true,
      },
      {
        name: 'jobId',
        description: 'Job ID for context',
        required: false,
      },
      {
        name: 'lossType',
        description: 'Loss type',
        required: false,
      },
    ],
  },
  {
    name: 'report_generation',
    description: 'Prompt template for generating report narratives',
    arguments: [
      {
        name: 'jobData',
        description: 'Job data JSON',
        required: true,
      },
    ],
  },
  {
    name: 'email_template',
    description: 'Prompt template for generating email content',
    arguments: [
      {
        name: 'jobTitle',
        description: 'Job title',
        required: true,
      },
      {
        name: 'customerName',
        description: 'Customer name',
        required: true,
      },
      {
        name: 'jobStatus',
        description: 'Current job status',
        required: true,
      },
      {
        name: 'messageType',
        description: 'Type of message',
        required: true,
      },
      {
        name: 'tone',
        description: 'Email tone (professional|empathetic|urgent)',
        required: false,
      },
    ],
  },
]

/**
 * Get prompt by name
 */
export function getPrompt(name: string): Prompt | undefined {
  return allPrompts.find((prompt) => prompt.name === name)
}

/**
 * Get prompt template text by name
 */
export function getPromptTemplate(name: string): string {
  switch (name) {
    case 'estimate_generation':
      return ESTIMATE_GENERATION_PROMPT
    case 'photo_analysis':
      return PHOTO_ANALYSIS_PROMPT
    case 'policy_parsing':
      return POLICY_PARSING_PROMPT
    case 'voice_command':
      return VOICE_COMMAND_PROMPT
    case 'voice_interpretation':
      return VOICE_INTERPRETATION_PROMPT
    case 'report_generation':
      return REPORT_GENERATION_PROMPT
    case 'email_template':
      return EMAIL_TEMPLATE_PROMPT
    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

/**
 * List all available prompts
 */
export function listPrompts(): Prompt[] {
  return allPrompts
}

