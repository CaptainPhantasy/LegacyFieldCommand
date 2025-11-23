/**
 * Board-related type definitions
 * Centralized types for boards, groups, columns, views, and items
 */

export interface Board {
  id: string;
  name: string;
  description?: string;
  board_type: 'sales_leads' | 'estimates' | 'bdm_accounts' | 'field' | 'mitigation_ar' | 'shop_equipment' | 'commissions' | 'active_jobs' | string;
  account_id?: string;
  icon?: string;
  color?: string;
  is_template?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Group {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color?: string;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  column_type: 'text' | 'long_text' | 'numbers' | 'status' | 'date' | 'people' | 'tags' | 'timeline' | 'link' | 'file' | 'checkbox' | 'rating' | 'formula' | 'dependency' | string;
  position: number;
  width?: number;
  settings?: Record<string, unknown>;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface View {
  id: string;
  board_id: string;
  name: string;
  view_type: 'table' | 'kanban' | 'calendar' | 'timeline' | 'chart' | 'gantt' | string;
  settings?: Record<string, unknown>;
  is_default: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ColumnValue {
  id: string;
  column_id: string;
  item_id?: string;
  value?: unknown;
  text_value?: string;
  numeric_value?: number;
  columns?: {
    id: string;
    title: string;
    column_type: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  board_id: string;
  group_id?: string;
  name: string;
  position: number;
  is_archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  column_values?: ColumnValue[];
  group?: {
    id: string;
    name: string;
    color?: string;
  };
}

// Response types
export interface BoardsResponse {
  boards: Board[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

export interface BoardDetailResponse {
  board: Board;
  groups: Group[];
  columns: Column[];
  items: Item[];
  views: View[];
}

export interface BoardsFilters {
  account_id?: string;
  board_type?: string;
  limit?: number;
  offset?: number;
}

export interface ItemsResponse {
  items: Item[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

export interface ItemsFilters {
  board_id: string;
  group_id?: string;
  limit?: number;
  offset?: number;
}

