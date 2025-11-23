/**
 * React Query hooks for hydro/drying system
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Chamber {
  id: string;
  job_id: string;
  name: string;
  description?: string;
  chamber_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PsychrometricReading {
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
}

interface MoisturePoint {
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
}

interface EquipmentLog {
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
}

/**
 * Fetch chambers for a job
 */
async function fetchChambers(jobId: string): Promise<{ chambers: Chamber[] }> {
  const response = await fetch(`/api/hydro/chambers?job_id=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch chambers');
  const data = await response.json();
  return data.data;
}

/**
 * Create chamber
 */
async function createChamber(chamberData: Partial<Chamber>): Promise<Chamber> {
  const response = await fetch('/api/hydro/chambers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chamberData),
  });
  if (!response.ok) throw new Error('Failed to create chamber');
  const data = await response.json();
  return data.data;
}

/**
 * Fetch psychrometric readings
 */
async function fetchReadings(chamberId: string): Promise<{ readings: PsychrometricReading[] }> {
  const response = await fetch(`/api/hydro/psychrometrics?chamber_id=${chamberId}&limit=20`);
  if (!response.ok) throw new Error('Failed to fetch readings');
  const data = await response.json();
  return data.data;
}

/**
 * Create psychrometric reading
 */
async function createReading(readingData: Partial<PsychrometricReading>): Promise<PsychrometricReading> {
  const response = await fetch('/api/hydro/psychrometrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readingData),
  });
  if (!response.ok) throw new Error('Failed to create reading');
  const data = await response.json();
  return data.data;
}

/**
 * Fetch moisture points
 */
async function fetchMoisturePoints(chamberId: string): Promise<{ moisture_points: MoisturePoint[] }> {
  const response = await fetch(`/api/hydro/moisture?chamber_id=${chamberId}&limit=100`);
  if (!response.ok) throw new Error('Failed to fetch moisture points');
  const data = await response.json();
  return data.data;
}

/**
 * Create moisture point
 */
async function createMoisturePoint(pointData: Partial<MoisturePoint>): Promise<MoisturePoint> {
  const response = await fetch('/api/hydro/moisture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pointData),
  });
  if (!response.ok) throw new Error('Failed to create moisture point');
  const data = await response.json();
  return data.data;
}

/**
 * Fetch equipment logs
 */
async function fetchEquipment(jobId: string): Promise<{ equipment: EquipmentLog[] }> {
  const response = await fetch(`/api/hydro/equipment?job_id=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch equipment');
  const data = await response.json();
  return data.data;
}

/**
 * Create equipment log
 */
async function createEquipmentLog(equipmentData: Partial<EquipmentLog>): Promise<EquipmentLog> {
  const response = await fetch('/api/hydro/equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData),
  });
  if (!response.ok) throw new Error('Failed to create equipment log');
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch chambers
 */
export function useChambers(jobId: string) {
  return useQuery({
    queryKey: ['hydro', 'chambers', jobId],
    queryFn: () => fetchChambers(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create chamber
 */
export function useCreateChamber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChamber,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hydro', 'chambers', variables.job_id] });
    },
  });
}

/**
 * Hook to fetch readings
 */
export function useReadings(chamberId: string) {
  return useQuery({
    queryKey: ['hydro', 'readings', chamberId],
    queryFn: () => fetchReadings(chamberId),
    enabled: !!chamberId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to create reading
 */
export function useCreateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReading,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hydro', 'readings', variables.chamber_id] });
    },
  });
}

/**
 * Hook to fetch moisture points
 */
export function useMoisturePoints(chamberId: string) {
  return useQuery({
    queryKey: ['hydro', 'moisture', chamberId],
    queryFn: () => fetchMoisturePoints(chamberId),
    enabled: !!chamberId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to create moisture point
 */
export function useCreateMoisturePoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMoisturePoint,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hydro', 'moisture', variables.chamber_id] });
    },
  });
}

/**
 * Hook to fetch equipment
 */
export function useEquipment(jobId: string) {
  return useQuery({
    queryKey: ['hydro', 'equipment', jobId],
    queryFn: () => fetchEquipment(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create equipment log
 */
export function useCreateEquipmentLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEquipmentLog,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hydro', 'equipment', variables.job_id] });
    },
  });
}

