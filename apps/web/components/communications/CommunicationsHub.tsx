/**
 * Communications Hub Component
 */

'use client';

import Link from 'next/link';

export function CommunicationsHub() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/communications/email"
          className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Send Email
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Send emails using templates or custom content
          </p>
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Send Email →
          </span>
        </Link>

        <Link
          href="/communications/templates"
          className="glass-basic card-glass p-6 hover:bg-[var(--hover-bg-subtle)] transition-colors rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Email Templates
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Manage email templates for common communications
          </p>
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Manage Templates →
          </span>
        </Link>

        <div className="glass-basic card-glass p-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Communication History
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View history from job detail pages
          </p>
        </div>
      </div>
    </div>
  );
}

