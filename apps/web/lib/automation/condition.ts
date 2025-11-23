/**
 * Automation Condition Evaluator
 * Evaluates conditions to determine if automation should execute
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export interface Condition {
  column_id?: string;
  operator: ConditionOperator;
  value?: unknown;
  logic?: 'AND' | 'OR';
}

/**
 * Evaluate a single condition
 */
export async function evaluateCondition(
  condition: Condition,
  itemId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  if (!condition.column_id) {
    // Condition without column (e.g., date-based)
    return evaluateValueCondition(condition.operator, null, condition.value);
  }

  // Get column value for item
  const { data: columnValue } = await supabase
    .from('column_values')
    .select('value, text_value, numeric_value')
    .eq('item_id', itemId)
    .eq('column_id', condition.column_id)
    .single();

  const actualValue = columnValue?.value || columnValue?.text_value || columnValue?.numeric_value;

  return evaluateValueCondition(condition.operator, actualValue, condition.value);
}

/**
 * Evaluate condition based on operator
 */
function evaluateValueCondition(
  operator: ConditionOperator,
  actualValue: unknown,
  expectedValue?: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return actualValue === expectedValue || String(actualValue) === String(expectedValue);

    case 'not_equals':
      return actualValue !== expectedValue && String(actualValue) !== String(expectedValue);

    case 'contains':
      if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
        return actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      }
      return false;

    case 'greater_than':
      const numActual = typeof actualValue === 'number' ? actualValue : parseFloat(String(actualValue));
      const numExpected = typeof expectedValue === 'number' ? expectedValue : parseFloat(String(expectedValue));
      return !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;

    case 'less_than':
      const numActual2 = typeof actualValue === 'number' ? actualValue : parseFloat(String(actualValue));
      const numExpected2 = typeof expectedValue === 'number' ? expectedValue : parseFloat(String(expectedValue));
      return !isNaN(numActual2) && !isNaN(numExpected2) && numActual2 < numExpected2;

    case 'is_empty':
      return actualValue === null || actualValue === undefined || actualValue === '' || 
             (Array.isArray(actualValue) && actualValue.length === 0);

    case 'is_not_empty':
      return actualValue !== null && actualValue !== undefined && actualValue !== '' &&
             (!Array.isArray(actualValue) || actualValue.length > 0);

    default:
      return false;
  }
}

/**
 * Evaluate multiple conditions with AND/OR logic
 */
export async function evaluateConditions(
  conditions: Condition[],
  itemId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  if (conditions.length === 0) {
    return true; // No conditions means always true
  }

  // Group conditions by logic operator
  const conditionGroups: Condition[][] = [];
  let currentGroup: Condition[] = [];
  let currentLogic: 'AND' | 'OR' = 'AND';

  for (const condition of conditions) {
    if (condition.logic && condition.logic !== currentLogic && currentGroup.length > 0) {
      conditionGroups.push([...currentGroup]);
      currentGroup = [];
      currentLogic = condition.logic;
    }
    currentGroup.push(condition);
  }
  if (currentGroup.length > 0) {
    conditionGroups.push(currentGroup);
  }

  // Evaluate groups
  const groupResults = await Promise.all(
    conditionGroups.map(async (group) => {
      const results = await Promise.all(
        group.map((condition) => evaluateCondition(condition, itemId, supabase))
      );
      // Within a group, use AND logic (all must be true)
      return results.every((result) => result === true);
    })
  );

  // Between groups, use OR logic if any group has OR logic
  const hasOrLogic = conditions.some((c) => c.logic === 'OR');
  if (hasOrLogic) {
    return groupResults.some((result) => result === true);
  }

  // Default to AND logic (all groups must be true)
  return groupResults.every((result) => result === true);
}

