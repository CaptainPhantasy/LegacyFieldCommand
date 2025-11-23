'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate email format
  if (!isValidEmail(email)) {
    redirect(`/login?error=${encodeURIComponent('Invalid email address format')}`)
    return
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    console.error('Login error:', error);
    redirect(`/login?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // Validate email format
  if (!isValidEmail(email)) {
    redirect(`/login?error=${encodeURIComponent('Invalid email address format')}`)
    return
  }

  // Validate password strength (matches Supabase recommended minimum)
  if (!password || password.length < 8) {
    redirect(`/login?error=${encodeURIComponent('Password must be at least 8 characters')}`)
    return
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
        data: {
            full_name: fullName || email.split('@')[0], // Use email prefix if no name provided
        }
    }
  })

  if (error) {
    console.error('Signup error:', error);
    redirect(`/login?error=${encodeURIComponent(error.message || 'Could not create user')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

