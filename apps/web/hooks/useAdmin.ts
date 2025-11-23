/**
 * React Query hooks for admin features
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// User types
export type UserRole = 'field_tech' | 'lead_tech' | 'estimator' | 'admin' | 'owner' | 'program_admin';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardMetrics {
  summary: {
    totalJobs: number;
    assignedJobs: number;
    unassignedJobs: number;
    totalUsers: number;
    totalGates: number;
  };
  jobsByStatus: Record<string, number>;
  gateStats: Record<string, number>;
  userCounts: Record<string, number>;
  recentActivity: {
    jobsCreated: Array<{ id: string; title: string; created_at: string }>;
  };
}

/**
 * Fetch users
 */
async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}): Promise<UsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.role) searchParams.set('role', params.role);
  if (params?.search) searchParams.set('search', params.search);

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch single user
 */
async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/admin/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Fetch dashboard metrics
 */
async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch('/api/admin/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch users list
 */
export function useUsers(params?: {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch single user
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to create user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      full_name?: string;
      role?: UserRole;
    }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', variables.userId] });
    },
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', variables.userId] });
    },
  });
}

