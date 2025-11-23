import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware'

/**
 * POST /api/communications/voice/transcribe
 * Transcribe audio to text
 * 
 * Body: FormData with:
 * - file: File (audio file - mp3, wav, m4a, etc.)
 * - jobId?: string (optional context)
 * 
 * Note: In production, this would integrate with a speech-to-text service
 * (OpenAI Whisper, AssemblyAI, Google Speech-to-Text, AWS Transcribe, etc.)
 * For MVP, we'll create a stub that can be replaced with real transcription.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth(request)
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string | null

    if (!file) {
      throw new ApiError('Audio file is required', 400)
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
      throw new ApiError('Invalid audio file type. Supported: mp3, wav, m4a, webm', 400)
    }

    // Validate file size (max 25MB for audio)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      throw new ApiError('File size exceeds 25MB limit', 400)
    }

    // Verify job exists if jobId provided
    if (jobId) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new ApiError('Job not found', 404)
      }
    }

    // Upload audio to storage
    const timestamp = Date.now()
    const fileName = `voice_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const storagePath = `voice/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new ApiError(`Failed to upload audio: ${uploadError.message}`, 500)
    }

    // TODO: Integrate with transcription service
    // For now, we'll create a stub that returns mock transcription
    // In production, this would:
    // 1. Call transcription service (OpenAI Whisper API, AssemblyAI, etc.)
    // 2. Get transcription result
    // 3. Store transcription

    const mockTranscription = {
      text: 'This is a mock transcription. Replace with real transcription service integration.',
      confidence: 0.95,
      language: 'en',
      duration: 10.5, // seconds
      provider: 'stub', // Will be 'openai-whisper', 'assemblyai', etc. in production
    }

    // Save communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert({
        job_id: jobId || null,
        type: 'voice',
        direction: 'inbound',
        voice_audio_path: storagePath,
        voice_transcription: mockTranscription.text,
        metadata: {
          transcription: mockTranscription,
          fileSize: file.size,
          fileType: file.type,
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (commError) {
      // Clean up uploaded file
      await supabase.storage.from('voice-recordings').remove([storagePath])
      throw new ApiError(commError.message, 500)
    }

    return successResponse({
      communication,
      transcription: mockTranscription,
      message: 'Audio transcribed successfully (stub implementation). Replace with real transcription service.',
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

