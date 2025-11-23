# Stub Services That Need Real Implementation

## Overview

The UI components are **fully functional**, but some backend services use stub implementations that need to be replaced with real services. The UI is complete and ready - you just need to integrate the actual services.

## Services Requiring Integration

### 1. Policy OCR/Extraction
**Location**: `apps/web/app/api/admin/policies/parse/route.ts`
**Current**: Stub that returns mock extracted data
**Needs**: Real OCR service integration
**Options**:
- AWS Textract
- Google Cloud Vision API
- Azure Form Recognizer
- OpenAI Vision API

**UI Status**: ✅ Complete - `PolicyDetail.tsx` has full UI, just needs real OCR

---

### 2. Email Sending
**Location**: `apps/web/app/api/communications/email/send/route.ts`
**Current**: Stub that logs email and saves to database
**Needs**: Real email service integration
**Options**:
- SendGrid
- Mailgun
- AWS SES
- Resend

**UI Status**: ✅ Complete - `SendEmailForm.tsx` has full UI, just needs real email service

---

### 3. Estimate Generation (AI)
**Location**: `apps/web/app/api/estimates/generate/route.ts`
**Current**: Stub that generates basic mock line items
**Needs**: Real AI/LLM integration
**Options**:
- OpenAI GPT-4
- Anthropic Claude
- Custom ML model

**UI Status**: ✅ Complete - `GenerateEstimateForm.tsx` has full UI, just needs real AI

---

### 4. Voice Transcription (Not in UI yet)
**Location**: `apps/web/app/api/communications/voice/transcribe/route.ts`
**Current**: Stub that returns mock transcription
**Needs**: Real transcription service
**Options**:
- OpenAI Whisper
- AssemblyAI
- Google Speech-to-Text
- AWS Transcribe

**UI Status**: ⚠️ Not built in UI yet - endpoint exists but no UI component

---

### 5. Voice Interpretation (Not in UI yet)
**Location**: `apps/web/app/api/communications/voice/interpret/route.ts`
**Current**: Stub that returns mock structured data
**Needs**: Real AI/LLM integration
**Options**:
- OpenAI GPT-4
- Anthropic Claude

**UI Status**: ⚠️ Not built in UI yet - endpoint exists but no UI component

---

## What's Fully Functional (No Stubs)

These features are **100% complete** with no stub implementations:

1. ✅ **User Management** - Full CRUD, no stubs
2. ✅ **Alerts** - Full functionality, no stubs
3. ✅ **Monitoring Dashboard** - Full functionality, no stubs
4. ✅ **Estimates List/Detail** - Full functionality (only generation uses stub)
5. ✅ **Communications Templates** - Full functionality
6. ✅ **Templates List** - Full functionality
7. ✅ **Measurements Upload** - Full functionality
8. ✅ **Policies List/Upload/Detail** - Full functionality (only parsing uses stub)
9. ✅ **Job Management** - Full functionality
10. ✅ **Work Boards** - Full functionality

## Action Items

### Immediate (UI Complete, Just Needs Service Integration)
1. Replace policy OCR stub with real OCR service
2. Replace email sending stub with real email service
3. Replace estimate generation stub with real AI service

### Future (No UI Built Yet)
4. Build voice transcription UI component
5. Build voice interpretation UI component

## Integration Guide

Each stub service follows this pattern:
1. UI component calls API endpoint
2. API endpoint currently has stub implementation
3. Replace stub with real service call
4. UI will work automatically (no changes needed)

The UI is designed to handle both stub and real service responses, so integration is straightforward.

