import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip auth check for routes that don't need it
  const pathname = request.nextUrl.pathname
  const skipAuthPaths = [
    '/login',
    '/api/auth',
    '/_next',
    '/favicon.ico',
  ]
  
  // Check if this path should skip auth
  if (skipAuthPaths.some(path => pathname.startsWith(path))) {
    return response
  }

  // Check if there's a session cookie before making auth request
  // Supabase SSR uses cookies like: sb-<project-ref>-auth-token
  // This reduces unnecessary auth calls for unauthenticated requests
  const allCookies = request.cookies.getAll()
  const hasSessionCookie = allCookies.some(c => 
    c.name.includes('sb-') && c.name.includes('auth-token')
  )

  // Only call getUser if there's a potential session
  // This significantly reduces auth requests for public routes
  if (!hasSessionCookie && !pathname.startsWith('/api/')) {
    // For non-API routes without session, skip auth check
    // API routes still need auth verification
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Only refresh session if there's a potential session
  // This is still needed for token refresh, but we've reduced unnecessary calls
  await supabase.auth.getUser()

  return response
}

