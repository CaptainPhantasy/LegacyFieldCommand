/**
 * React Query hooks for advanced hydro features
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface FloorPlan {
  id: string;
  job_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  job_id: string;
  name: string;
  floor_plan_id: string | null;
  room_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoistureMap {
  id: string;
  floor_plan_id: string;
  chamber_id: string | null;
  map_data: any;
  created_at: string;
}

export interface DryingLog {
  id: string;
  chamber_id: string;
  log_date: string;
  temperature: number | null;
  relative_humidity: number | null;
  gpp: number | null;
  notes: string | null;
  created_at: string;
}

async function fetchFloorPlans(jobId: string): Promise<FloorPlan[]> {
  const response = await fetch(`/api/hydro/floor-plans?jobId=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch floor plans');
  const data = await response.json();
  return data.data.floorPlans || [];
}

async function fetchRooms(jobId: string): Promise<Room[]> {
  const response = await fetch(`/api/hydro/rooms?jobId=${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch rooms');
  const data = await response.json();
  return data.data.rooms || [];
}

async function fetchMoistureMaps(floorPlanId: string): Promise<MoistureMap[]> {
  const response = await fetch(`/api/hydro/moisture-maps?floorPlanId=${floorPlanId}`);
  if (!response.ok) throw new Error('Failed to fetch moisture maps');
  const data = await response.json();
  return data.data.maps || [];
}

async function fetchDryingLogs(chamberId: string): Promise<DryingLog[]> {
  const response = await fetch(`/api/hydro/drying-logs?chamberId=${chamberId}`);
  if (!response.ok) throw new Error('Failed to fetch drying logs');
  const data = await response.json();
  return data.data.logs || [];
}

export function useFloorPlans(jobId: string) {
  return useQuery({
    queryKey: ['hydro', 'floor-plans', jobId],
    queryFn: () => fetchFloorPlans(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRooms(jobId: string) {
  return useQuery({
    queryKey: ['hydro', 'rooms', jobId],
    queryFn: () => fetchRooms(jobId),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMoistureMaps(floorPlanId: string) {
  return useQuery({
    queryKey: ['hydro', 'moisture-maps', floorPlanId],
    queryFn: () => fetchMoistureMaps(floorPlanId),
    enabled: !!floorPlanId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDryingLogs(chamberId: string) {
  return useQuery({
    queryKey: ['hydro', 'drying-logs', chamberId],
    queryFn: () => fetchDryingLogs(chamberId),
    enabled: !!chamberId,
    staleTime: 1 * 60 * 1000,
  });
}

