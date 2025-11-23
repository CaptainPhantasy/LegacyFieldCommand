/**
 * Integration Sync Service
 * Handles bidirectional sync between Jobs and Board Items
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SyncResult {
  success: boolean;
  board_item_id?: string;
  job_id?: string;
  synced_at: string;
  error?: string;
}

export interface SyncState {
  is_syncing: boolean;
  last_sync_direction: 'job_to_board' | 'board_to_job' | null;
  last_sync_at: string | null;
}

/**
 * Sync job to board item
 * Creates or updates board item based on job data
 */
export async function syncJobToBoard(
  jobId: string,
  boardId: string | null,
  supabase: SupabaseClient,
  userId: string
): Promise<SyncResult> {
  try {
    // Get job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return {
        success: false,
        synced_at: new Date().toISOString(),
        error: 'Job not found',
      };
    }

    // Find or create target board
    let targetBoardId = boardId;
    if (!targetBoardId) {
      // Find "Active Jobs" board
      const { data: activeJobsBoard } = await supabase
        .from('boards')
        .select('id')
        .eq('board_type', 'active_jobs')
        .eq('account_id', job.account_id)
        .single();

      if (!activeJobsBoard) {
        // Create "Active Jobs" board if it doesn't exist
        const { data: newBoard, error: boardError } = await supabase
          .from('boards')
          .insert({
            account_id: job.account_id,
            name: 'Active Jobs',
            board_type: 'active_jobs',
            created_by: userId,
          })
          .select('id')
          .single();

        if (boardError || !newBoard) {
          return {
            success: false,
            synced_at: new Date().toISOString(),
            error: 'Failed to create board',
          };
        }
        targetBoardId = newBoard.id;
      } else {
        targetBoardId = activeJobsBoard.id;
      }
    }

    // Check if board item already exists (by job_id in link column)
    const { data: existingItem } = await supabase
      .from('items')
      .select(`
        id,
        column_values!inner (
          column_id,
          columns!inner (
            id,
            column_type
          )
        )
      `)
      .eq('board_id', targetBoardId)
      .eq('column_values.columns.column_type', 'link')
      .single();

    // Get or create required columns
    if (!targetBoardId) {
      throw new Error('Target board ID is required');
    }
    const columns = await getOrCreateColumns(targetBoardId, supabase, userId);

    // Create or update board item
    let itemId: string;
    if (existingItem) {
      itemId = existingItem.id;
      // Update item name
      await supabase
        .from('items')
        .update({ name: job.title })
        .eq('id', itemId);
    } else {
      // Create new item
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({
          board_id: targetBoardId,
          name: job.title,
          created_by: userId,
        })
        .select('id')
        .single();

      if (itemError || !newItem) {
        return {
          success: false,
          synced_at: new Date().toISOString(),
          error: 'Failed to create board item',
        };
      }
      itemId = newItem.id;
    }

    // Update column values
    await updateColumnValues(itemId, job, columns, supabase);

    return {
      success: true,
      board_item_id: itemId,
      synced_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      synced_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync board item to job
 * Updates job based on board item column values
 */
export async function syncBoardToJob(
  itemId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<SyncResult> {
  try {
    // Get board item with column values
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        column_values (
          id,
          column_id,
          value,
          text_value,
          numeric_value,
          columns:column_id (
            id,
            title,
            column_type,
            settings
          )
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return {
        success: false,
        synced_at: new Date().toISOString(),
        error: 'Board item not found',
      };
    }

    // Find job_id from link column
    const linkColumn = item.column_values?.find(
      (cv: any) => cv.columns?.column_type === 'link'
    );
    const jobId = linkColumn?.value as string | undefined;

    if (!jobId) {
      return {
        success: false,
        synced_at: new Date().toISOString(),
        error: 'No linked job found',
      };
    }

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return {
        success: false,
        synced_at: new Date().toISOString(),
        error: 'Job not found',
      };
    }

    // Map column values to job fields
    const updates: Record<string, unknown> = {};

    for (const cv of item.column_values || []) {
      const column = cv.columns;
      if (!column) continue;

      switch (column.column_type) {
        case 'status':
          if (cv.value) {
            updates.status = cv.value;
          }
          break;

        case 'people':
          // Get first person from people column
          const peopleValue = Array.isArray(cv.value) ? cv.value[0] : cv.value;
          if (peopleValue) {
            updates.lead_tech_id = peopleValue;
          }
          break;

        case 'date':
          // Update updated_at if date column changed
          if (cv.value) {
            updates.updated_at = new Date().toISOString();
          }
          break;
      }
    }

    // Update job
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      if (updateError) {
        return {
          success: false,
          synced_at: new Date().toISOString(),
          error: updateError.message,
        };
      }
    }

    return {
      success: true,
      job_id: jobId,
      synced_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      synced_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get or create required columns for job sync
 */
async function getOrCreateColumns(
  boardId: string,
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, string>> {
  const columnTypes = ['status', 'people', 'link', 'text', 'date'];
  const columnTitles = {
    status: 'Status',
    people: 'Assigned To',
    link: 'Job Link',
    text: 'Address',
    date: 'Updated',
  };

  const columns: Record<string, string> = {};

  for (const type of columnTypes) {
    // Check if column exists
    const { data: existingColumn } = await supabase
      .from('columns')
      .select('id')
      .eq('board_id', boardId)
      .eq('column_type', type)
      .single();

    if (existingColumn) {
      columns[type] = existingColumn.id;
    } else {
      // Create column
      const { data: newColumn, error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          title: columnTitles[type as keyof typeof columnTitles],
          column_type: type,
          position: columnTypes.indexOf(type),
          created_by: userId,
        })
        .select('id')
        .single();

      if (!error && newColumn) {
        columns[type] = newColumn.id;
      }
    }
  }

  return columns;
}

/**
 * Update column values for board item
 */
async function updateColumnValues(
  itemId: string,
  job: any,
  columns: Record<string, string>,
  supabase: SupabaseClient
): Promise<void> {
  const updates: Array<{
    item_id: string;
    column_id: string;
    value: unknown;
    text_value?: string | null;
    numeric_value?: number | null;
  }> = [];

  // Status column
  if (columns.status) {
    updates.push({
      item_id: itemId,
      column_id: columns.status,
      value: job.status,
      text_value: job.status,
    });
  }

  // People column
  if (columns.people && job.lead_tech_id) {
    updates.push({
      item_id: itemId,
      column_id: columns.people,
      value: [job.lead_tech_id],
      text_value: job.lead_tech_id,
    });
  }

  // Link column (job_id)
  if (columns.link) {
    updates.push({
      item_id: itemId,
      column_id: columns.link,
      value: job.id,
      text_value: job.id,
    });
  }

  // Text column (address)
  if (columns.text && job.address_line_1) {
    updates.push({
      item_id: itemId,
      column_id: columns.text,
      value: job.address_line_1,
      text_value: job.address_line_1,
    });
  }

  // Date column (updated_at)
  if (columns.date) {
    updates.push({
      item_id: itemId,
      column_id: columns.date,
      value: job.updated_at || job.created_at,
      text_value: job.updated_at || job.created_at,
    });
  }

  // Upsert all column values
  if (updates.length > 0) {
    await supabase
      .from('column_values')
      .upsert(updates, {
        onConflict: 'item_id,column_id',
      });
  }
}

