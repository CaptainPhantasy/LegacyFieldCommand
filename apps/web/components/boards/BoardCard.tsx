/**
 * Board Card Component
 * Displays a board in a card format
 */

'use client';

import Link from 'next/link';
import { Board } from '@/hooks/useBoards';

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const boardTypeLabels: Record<string, string> = {
    sales_leads: 'Sales/Leads',
    estimates: 'Estimates',
    bdm_accounts: 'BDM/Accounts',
    field: 'Field',
    mitigation_ar: 'Mitigation AR',
    shop_equipment: 'Shop/Equipment',
    commissions: 'Commissions',
    active_jobs: 'Active Jobs',
  };

  const boardTypeColors: Record<string, string> = {
    sales_leads: 'bg-blue-500',
    estimates: 'bg-green-500',
    bdm_accounts: 'bg-purple-500',
    field: 'bg-orange-500',
    mitigation_ar: 'bg-red-500',
    shop_equipment: 'bg-yellow-500',
    commissions: 'bg-indigo-500',
    active_jobs: 'bg-teal-500',
  };

  const color = board.color || boardTypeColors[board.board_type] || 'bg-gray-500';
  const label = boardTypeLabels[board.board_type] || board.board_type;

  return (
    <Link
      href={`/boards/${board.id}`}
      className="block p-6 rounded-xl border border-border-subtle bg-elevated hover:bg-hover-subtle transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {board.icon && (
              <span className="text-2xl">{board.icon}</span>
            )}
            <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {board.name}
            </h3>
          </div>
          
          {board.description && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {board.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} text-white`}
            >
              {label}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

