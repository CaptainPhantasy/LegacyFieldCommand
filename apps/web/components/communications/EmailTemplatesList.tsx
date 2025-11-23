/**
 * Email Templates List Component
 */

'use client';

import { useEmailTemplates } from '@/hooks/useCommunications';
import Link from 'next/link';

export function EmailTemplatesList() {
  const { data: templates, isLoading, error } = useEmailTemplates();

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        Loading templates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading templates. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-basic card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Variables
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!templates || templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No templates found.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-b transition-colors hover:bg-[var(--hover-bg-subtle)]"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {template.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {template.subject}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          background: template.is_active ? 'var(--success)' : 'var(--accent)',
                          color: '#ffffff',
                        }}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {template.variables?.length > 0 ? template.variables.join(', ') : 'None'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/communications/templates/${template.id}`}
                        className="text-sm font-medium transition-colors hover:opacity-80"
                        style={{ color: 'var(--accent)' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

