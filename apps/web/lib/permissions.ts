/**
 * Permission utilities for role-based access control
 * Provides user-friendly error messages based on user roles
 */

import type { AuthenticatedUser } from './api/middleware'

export type UserRole = 'field_tech' | 'lead_tech' | 'estimator' | 'admin' | 'owner' | 'program_admin'

export interface PermissionDenial {
  message: string
  requiredRole: UserRole | UserRole[]
  userRole: UserRole
  suggestion?: string
}

/**
 * Get user-friendly permission denial message
 */
export function getPermissionDenialMessage(
  userRole: UserRole,
  requiredRoles: UserRole | UserRole[]
): PermissionDenial {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  const roleNames: Record<UserRole, string> = {
    field_tech: 'Field Technician',
    lead_tech: 'Lead Technician',
    estimator: 'Estimator',
    admin: 'Administrator',
    owner: 'Owner',
    program_admin: 'Program Administrator',
  }

  const userRoleName = roleNames[userRole]
  const requiredRoleNames = required.map((r) => roleNames[r]).join(' or ')

  // Determine suggestion based on user's current role
  let suggestion: string | undefined

  if (userRole === 'field_tech') {
    if (required.includes('admin') || required.includes('owner')) {
      suggestion = 'This feature requires administrator access. Please contact your administrator if you need access.'
    } else if (required.includes('estimator')) {
      suggestion = 'This feature requires estimator access. Please contact your administrator to upgrade your account.'
    } else if (required.includes('lead_tech')) {
      suggestion = 'This feature requires lead technician access. Please contact your administrator to upgrade your account.'
    }
  } else if (userRole === 'lead_tech') {
    if (required.includes('admin') || required.includes('owner')) {
      suggestion = 'This feature requires administrator access. Please contact your administrator if you need access.'
    } else if (required.includes('estimator')) {
      suggestion = 'This feature requires estimator access. Please contact your administrator to upgrade your account.'
    }
  } else if (userRole === 'estimator') {
    if (required.includes('admin') || required.includes('owner')) {
      suggestion = 'This feature requires administrator access. Please contact your administrator if you need access.'
    }
  }

  return {
    message: `Access Denied: This feature requires ${requiredRoleNames} privileges. Your current role is ${userRoleName}.`,
    requiredRole: requiredRoles,
    userRole,
    suggestion,
  }
}

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return required.includes(userRole)
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(userRole: UserRole): boolean {
  return ['admin', 'owner', 'program_admin'].includes(userRole)
}

/**
 * Check if user has estimator or higher privileges
 */
export function isEstimatorOrHigher(userRole: UserRole): boolean {
  return ['estimator', 'admin', 'owner', 'program_admin'].includes(userRole)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    field_tech: 'Field Technician',
    lead_tech: 'Lead Technician',
    estimator: 'Estimator',
    admin: 'Administrator',
    owner: 'Owner',
    program_admin: 'Program Administrator',
  }
  return names[role]
}

/**
 * Get role hierarchy level (lower number = more privileges)
 */
export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    owner: 1,
    program_admin: 2,
    admin: 3,
    estimator: 4,
    lead_tech: 5,
    field_tech: 6,
  }
  return levels[role]
}

