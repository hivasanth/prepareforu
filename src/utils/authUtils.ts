import type { UserProfile, UserRole } from '../types/auth.types';
import { logError } from './logger';

/**
 * Standardized Role Hierarchy
 * Defines which roles are inherently authorized for specific access levels.
 */
export const ROLE_ACCESS: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'sub_admin', 'user'],
  sub_admin: ['sub_admin', 'user'],
  user: ['user']
};

/**
 * Authoritative check for admin role.
 */
export function isAdmin(user: UserProfile | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Authoritative check for sub-admin role.
 */
export function isSubAdmin(user: UserProfile | null | undefined): boolean {
  return user?.role === 'sub_admin';
}

/**
 * Checks if the user has any administrative privileges (Admin or Sub-Admin).
 */
export function hasAdminPrivileges(user: UserProfile | null | undefined): boolean {
  return isAdmin(user) || isSubAdmin(user);
}

interface AccessContext {
  user: UserProfile | null | undefined;
  allowedRoles: UserRole[];
  operation: string;
  requestId?: string;
  resourceOwnerId?: string; // Critical for sub-admin isolation
}

/**
 * Centralized Service-Layer Security Guard.
 * Validates role-based access and resource-level ownership.
 * Throws 'UNAUTHORIZED_ACCESS' on failure.
 */
export function ensureRole(ctx: AccessContext) {
  const { user, allowedRoles, resourceOwnerId } = ctx;

  // 1. Basic Role Check
  if (!user || !allowedRoles.includes(user.role)) {
    return handleAccessDenied(ctx, 'unauthorized_role');
  }

  // 2. Sub-Admin Resource Isolation Check
  // Sub-admins can only access data where they are the owner OR the linked educator.
  if (user.role === 'sub_admin' && resourceOwnerId) {
    const isUserMatch = user.id === resourceOwnerId;
    const isSubAdminMatch = user.sub_admin_id === resourceOwnerId;
    const isEducatorMatch = user.educator_id === resourceOwnerId;
    
    if (!isUserMatch && !isSubAdminMatch && !isEducatorMatch) {
       return handleAccessDenied(ctx, 'unauthorized_resource_scope');
    }
  }

  // 3. Student Resource Isolation Check
  if (user.role === 'user' && resourceOwnerId) {
    // A student can see exams from their sub_admin_id (Table ID) OR educator_id (User ID)
    const isSubAdminMatch = user.sub_admin_id === resourceOwnerId;
    const isEducatorMatch = user.educator_id === resourceOwnerId;

    if (!isSubAdminMatch && !isEducatorMatch) {
       return handleAccessDenied(ctx, `unauthorized_educator_scope (has: ${user.educator_id || 'none'}, requested: ${resourceOwnerId})`);
    }
  }

  // Admin bypasses all further checks (inherent global access)
  if (user.role === 'admin') return;
}

function handleAccessDenied(ctx: AccessContext, reason: string) {
  const { user, allowedRoles, operation, requestId } = ctx;
  
  logError('security.access.denied', {
    event: 'security.access.denied',
    severity: 'high',
    reason,
    role: user?.role || 'anonymous',
    required_roles: allowedRoles,
    operation,
    requestId,
    ts: new Date().toISOString()
  });

  // Sanitize errors sent to the frontend to prevent PII and internal context leakage
  throw new Error('UNAUTHORIZED_ACCESS');
}
