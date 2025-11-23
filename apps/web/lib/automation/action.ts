/**
 * Automation Action Executor
 * Executes automation actions
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type AutomationActionType =
  | 'update_column'
  | 'move_to_group'
  | 'create_item'
  | 'send_notification'
  | 'change_status'
  | 'assign_person'
  | 'add_tag'
  | 'create_subitem';

export interface Action {
  type: AutomationActionType;
  config: Record<string, unknown>;
}

/**
 * Execute a single action
 */
export async function executeAction(
  action: Action,
  itemId: string,
  boardId: string,
  supabase: SupabaseClient,
  userId?: string
): Promise<void> {
  switch (action.type) {
    case 'update_column':
      await executeUpdateColumn(action, itemId, supabase);
      break;

    case 'move_to_group':
      await executeMoveToGroup(action, itemId, supabase);
      break;

    case 'create_item':
      await executeCreateItem(action, boardId, supabase, userId);
      break;

    case 'change_status':
      await executeChangeStatus(action, itemId, supabase);
      break;

    case 'assign_person':
      await executeAssignPerson(action, itemId, supabase);
      break;

    case 'add_tag':
      await executeAddTag(action, itemId, supabase);
      break;

    case 'create_subitem':
      await executeCreateSubitem(action, itemId, supabase);
      break;

    case 'send_notification':
      // Notification system would be implemented separately
      console.log('Notification action:', action.config);
      break;

    default:
      console.warn('Unknown action type:', action.type);
  }
}

/**
 * Execute multiple actions
 */
export async function executeActions(
  actions: Action[],
  itemId: string,
  boardId: string,
  supabase: SupabaseClient,
  userId?: string
): Promise<void> {
  for (const action of actions) {
    try {
      await executeAction(action, itemId, boardId, supabase, userId);
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      // Continue with other actions even if one fails
    }
  }
}

/**
 * Update column value
 */
async function executeUpdateColumn(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const columnId = action.config.column_id as string;
  const value = action.config.value;

  if (!columnId) {
    throw new Error('Column ID required for update_column action');
  }

  const updateData: Record<string, unknown> = {
    value,
  };

  if (typeof value === 'string') {
    updateData.text_value = value;
  } else if (typeof value === 'number') {
    updateData.numeric_value = value;
  }

  const { error } = await supabase
    .from('column_values')
    .upsert({
      item_id: itemId,
      column_id: columnId,
      ...updateData,
    }, {
      onConflict: 'item_id,column_id',
    });

  if (error) {
    throw new Error(`Failed to update column: ${error.message}`);
  }
}

/**
 * Move item to group
 */
async function executeMoveToGroup(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const groupId = action.config.group_id as string;

  if (!groupId) {
    throw new Error('Group ID required for move_to_group action');
  }

  const { error } = await supabase
    .from('items')
    .update({ group_id: groupId })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to move item to group: ${error.message}`);
  }
}

/**
 * Create new item
 */
async function executeCreateItem(
  action: Action,
  boardId: string,
  supabase: SupabaseClient,
  userId?: string
): Promise<void> {
  const itemName = action.config.name as string;
  const groupId = action.config.group_id as string | undefined;

  if (!itemName) {
    throw new Error('Item name required for create_item action');
  }

  // Get max position
  const { data: lastItem } = await supabase
    .from('items')
    .select('position')
    .eq('board_id', boardId)
    .eq('group_id', groupId || null)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastItem ? lastItem.position + 1 : 0;

  const { error } = await supabase
    .from('items')
    .insert({
      board_id: boardId,
      group_id: groupId || null,
      name: itemName,
      position,
      created_by: userId || null,
    });

  if (error) {
    throw new Error(`Failed to create item: ${error.message}`);
  }
}

/**
 * Change status (update status column)
 */
async function executeChangeStatus(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const statusValue = action.config.status as string;
  const statusColumnId = action.config.status_column_id as string;

  if (!statusValue || !statusColumnId) {
    throw new Error('Status value and status column ID required');
  }

  await executeUpdateColumn(
    {
      type: 'update_column',
      config: {
        column_id: statusColumnId,
        value: statusValue,
      },
    },
    itemId,
    supabase
  );
}

/**
 * Assign person (update people column)
 */
async function executeAssignPerson(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const personId = action.config.person_id as string;
  const peopleColumnId = action.config.people_column_id as string;

  if (!personId || !peopleColumnId) {
    throw new Error('Person ID and people column ID required');
  }

  // Get current people value
  const { data: currentValue } = await supabase
    .from('column_values')
    .select('value')
    .eq('item_id', itemId)
    .eq('column_id', peopleColumnId)
    .single();

  const currentPeople = Array.isArray(currentValue?.value)
    ? (currentValue.value as string[])
    : currentValue?.value
    ? [currentValue.value as string]
    : [];

  if (!currentPeople.includes(personId)) {
    const updatedPeople = [...currentPeople, personId];

    const { error } = await supabase
      .from('column_values')
      .upsert({
        item_id: itemId,
        column_id: peopleColumnId,
        value: updatedPeople,
        text_value: updatedPeople.join(', '),
      }, {
        onConflict: 'item_id,column_id',
      });

    if (error) {
      throw new Error(`Failed to assign person: ${error.message}`);
    }
  }
}

/**
 * Add tag (update tags column)
 */
async function executeAddTag(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const tag = action.config.tag as string;
  const tagsColumnId = action.config.tags_column_id as string;

  if (!tag || !tagsColumnId) {
    throw new Error('Tag and tags column ID required');
  }

  // Get current tags value
  const { data: currentValue } = await supabase
    .from('column_values')
    .select('value')
    .eq('item_id', itemId)
    .eq('column_id', tagsColumnId)
    .single();

  const currentTags = Array.isArray(currentValue?.value)
    ? (currentValue.value as string[])
    : currentValue?.value
    ? [currentValue.value as string]
    : [];

  if (!currentTags.includes(tag)) {
    const updatedTags = [...currentTags, tag];

    const { error } = await supabase
      .from('column_values')
      .upsert({
        item_id: itemId,
        column_id: tagsColumnId,
        value: updatedTags,
        text_value: updatedTags.join(', '),
      }, {
        onConflict: 'item_id,column_id',
      });

    if (error) {
      throw new Error(`Failed to add tag: ${error.message}`);
    }
  }
}

/**
 * Create subitem
 */
async function executeCreateSubitem(
  action: Action,
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  const subitemName = action.config.name as string;

  if (!subitemName) {
    throw new Error('Subitem name required');
  }

  // Get max position
  const { data: lastSubitem } = await supabase
    .from('subitems')
    .select('position')
    .eq('item_id', itemId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastSubitem ? lastSubitem.position + 1 : 0;

  const { error } = await supabase
    .from('subitems')
    .insert({
      item_id: itemId,
      name: subitemName,
      position,
      is_completed: false,
    });

  if (error) {
    throw new Error(`Failed to create subitem: ${error.message}`);
  }
}

