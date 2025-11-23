import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { checkRateLimit } from './lib/api/rate-limit'

export async function middleware(request: NextRequest) {
  // Update session first
  const response = await updateSession(request)

  // Apply CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:8765',
      'http://localhost:3000',
    ].filter(Boolean) as string[]

    // Add CORS headers if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400') // 24 hours

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers })
      }
    }

    // Apply rate limiting to API routes
    const identifier = 
      request.headers.get('x-user-id') || 
      request.ip || 
      'anonymous'

    // Determine rate limit type based on endpoint
    let rateLimitType: 'api' | 'upload' | 'auth' = 'api'
    if (request.nextUrl.pathname.includes('/upload') || request.nextUrl.pathname.includes('/photos')) {
      rateLimitType = 'upload'
    } else if (request.nextUrl.pathname.includes('/auth') || request.nextUrl.pathname.includes('/login')) {
      rateLimitType = 'auth'
    }

    const rateLimitResult = await checkRateLimit(identifier, rateLimitType)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    // Return 429 if rate limit exceeded
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: true,
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

