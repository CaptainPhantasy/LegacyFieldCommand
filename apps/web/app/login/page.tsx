import { login, signup } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center py-12 px-4">
      <div className="glass-basic card-glass w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Legacy Field Command
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-address" className="sr-only">Email address</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                title="Please enter a valid email address"
              />
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="Password (min. 8 characters)"
                title="Password must be at least 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="fullName" className="sr-only">Full Name (Signup only)</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Full Name (for Sign Up)"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button formAction={login} className="w-full" style={{ background: 'var(--accent)', color: '#ffffff' }}>
              Sign in
            </Button>
            <Button
              formAction={signup}
              variant="outline"
              className="w-full"
            >
              Sign up
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

