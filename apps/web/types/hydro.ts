/**
 * Hydro/Drying System type definitions
 * Centralized types for chambers, readings, moisture points, and equipment
 */

export interface Chamber {
  id: string;
  job_id: string;
  name: string;
  description?: string;
  chamber_type: 'standard' | 'containment' | 'negative_pressure' | string;
  status: 'active' | 'completed' | 'archived' | string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PsychrometricReading {
  id: string;
  chamber_id: string;
  room_id?: string;
  reading_date: string;
  reading_time?: string;
  location: 'exterior' | 'unaffected' | 'affected' | 'hvac';
  ambient_temp_f?: number;
  relative_humidity?: number;
  grains_per_pound?: number;
  notes?: string;
  taken_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MoisturePoint {
  id: string;
  chamber_id: string;
  room_id?: string;
  floor_plan_id?: string;
  x_position?: number;
  y_position?: number;
  material_type?: string;
  moisture_reading?: number;
  reading_unit: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentLog {
  id: string;
  job_id: string;
  chamber_id?: string;
  room_id?: string;
  equipment_type: string;
  equipment_name?: string;
  asset_id?: string;
  quantity: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Response types
export interface ChambersResponse {
  chambers: Chamber[];
}

export interface ReadingsResponse {
  readings: PsychrometricReading[];
}

export interface MoisturePointsResponse {
  moisture_points: MoisturePoint[];
}

export interface EquipmentResponse {
  equipment: EquipmentLog[];
}

