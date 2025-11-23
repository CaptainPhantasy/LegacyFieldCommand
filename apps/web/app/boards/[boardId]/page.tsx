/**
 * Board Detail Page
 * Displays a board with its views
 */

import { BoardView } from '@/components/boards/BoardView';

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <BoardView boardId={boardId} />
    </div>
  );
}

