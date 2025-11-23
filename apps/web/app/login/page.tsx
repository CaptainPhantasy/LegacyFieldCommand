import { login, signup } from "./actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type LoginPageProps = {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] flex items-center justify-center px-6 py-16">
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-md px-8 py-10"
        style={{ maxWidth: "480px" }}
      >
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Legacy Field Command
          </h1>
          <p className="mt-2 text-base text-[var(--text-secondary)]">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div
            className="mb-6 rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--danger-light)",
              background: "var(--danger-light)",
              color: "var(--danger)",
            }}
            role="alert"
          >
            {decodeURIComponent(error)}
          </div>
        )}

        <form className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email-address"
                className="text-sm font-medium text-[var(--text-secondary)] text-left"
              >
                Email address
              </Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="h-12 text-base"
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                title="Please enter a valid email address"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[var(--text-secondary)] text-left"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="h-12 text-base"
                title="Password must be at least 8 characters"
              />
              <p className="text-xs text-[var(--text-tertiary)]">
                At least 8 characters. Use a passphrase if you can.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-[var(--text-secondary)] text-left"
              >
                Full name <span className="text-[var(--text-tertiary)]">(for sign up)</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jane Doe"
                className="h-12 text-base"
              />
              <p className="text-xs text-[var(--text-tertiary)]">
                Optional. We&apos;ll use this when you create a new account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button formAction={login} className="w-full">
              Sign in
            </Button>
            <Button
              formAction={signup}
              variant="outline"
              className="w-full"
            >
              Create a new account
            </Button>
            <p className="text-xs text-center text-[var(--text-tertiary)] pt-1">
              By continuing, you agree to the workspace policies configured by your organization.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

