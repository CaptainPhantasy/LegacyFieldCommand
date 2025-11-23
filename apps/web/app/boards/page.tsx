/**
 * Boards List Page
 * Displays all boards with filtering and creation
 */

import { BoardList } from '@/components/boards/BoardList';

export default function BoardsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <BoardList />
    </div>
  );
}

