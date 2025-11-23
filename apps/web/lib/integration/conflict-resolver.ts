/**
 * Conflict Resolution for Job ↔ Board Sync
 * Prevents circular updates and handles conflicts
 */

export interface SyncConflict {
  entity_type: 'job' | 'board_item';
  entity_id: string;
  field: string;
  local_value: unknown;
  remote_value: unknown;
  last_updated: {
    local: string;
    remote: string;
  };
}

export type ConflictResolution = 'local_wins' | 'remote_wins' | 'manual';

/**
 * Detect sync conflicts
 */
export function detectConflict(
  localValue: unknown,
  remoteValue: unknown,
  localTimestamp: string,
  remoteTimestamp: string
): boolean {
  // If values are different and both were updated
  if (localValue !== remoteValue && localTimestamp && remoteTimestamp) {
    return true;
  }
  return false;
}

/**
 * Resolve conflict using last-write-wins strategy
 */
export function resolveConflictLastWriteWins(
  localTimestamp: string,
  remoteTimestamp: string
): 'local' | 'remote' {
  const localTime = new Date(localTimestamp).getTime();
  const remoteTime = new Date(remoteTimestamp).getTime();
  return localTime > remoteTime ? 'local' : 'remote';
}

/**
 * Check if sync should proceed (prevent circular updates)
 */
export function shouldSync(
  lastSyncDirection: 'job_to_board' | 'board_to_job' | null,
  currentDirection: 'job_to_board' | 'board_to_job',
  lastSyncAt: string | null,
  debounceMs: number = 1000
): boolean {
  // If syncing in same direction, debounce
  if (lastSyncDirection === currentDirection && lastSyncAt) {
    const timeSinceLastSync = Date.now() - new Date(lastSyncAt).getTime();
    if (timeSinceLastSync < debounceMs) {
      return false; // Too soon, skip sync
    }
  }

  // If syncing in opposite direction immediately after, skip to prevent loop
  if (
    lastSyncDirection &&
    lastSyncDirection !== currentDirection &&
    lastSyncAt
  ) {
    const timeSinceLastSync = Date.now() - new Date(lastSyncAt).getTime();
    if (timeSinceLastSync < debounceMs * 2) {
      return false; // Prevent circular update
    }
  }

  return true;
}

