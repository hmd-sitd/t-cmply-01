// src/hooks/useAdminPermissions.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface AdminPermissions {
  isAdmin: boolean;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminPermissions(isAuthenticated: boolean) {
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions>({
    isAdmin: false,
    permissions: [],
    isLoading: true,
    error: null,
  });

  const checkAdminPermissions = useCallback(async () => {
    // If not authenticated, set as non-admin
    if (!isAuthenticated) {
      setAdminPermissions({
        isAdmin: false,
        permissions: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setAdminPermissions(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user has admin access using the API
      const isAdmin = await apiService.checkAdminAccess();
      
      // Get all user permissions
      const permissions = await apiService.getCurrentUserPermissions();

      setAdminPermissions({
        isAdmin,
        permissions,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('Failed to check admin permissions:', error);
      
      // On error, default to non-admin for security
      setAdminPermissions({
        isAdmin: false,
        permissions: [],
        isLoading: false,
        error: error.message || 'Failed to check permissions',
      });
    }
  }, [isAuthenticated]);

  // Check permissions on mount and when authentication changes
  useEffect(() => {
    checkAdminPermissions();
  }, [checkAdminPermissions, isAuthenticated]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    const permissionString = `${resource}:${action}`;
    return adminPermissions.permissions.includes(permissionString);
  }, [adminPermissions.permissions]);

  const hasAnyPermission = useCallback((permissionChecks: Array<{ resource: string; action: string }>): boolean => {
    return permissionChecks.some(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionChecks: Array<{ resource: string; action: string }>): boolean => {
    return permissionChecks.every(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  return {
    ...adminPermissions,
    checkAdminPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Common permission shortcuts
    canManageUsers: hasPermission('user', 'admin'),
    canReadDocuments: hasPermission('document', 'read'),
    canWriteDocuments: hasPermission('document', 'write'),
    canDeleteDocuments: hasPermission('document', 'delete'),
    canProcessDocuments: hasPermission('document', 'process'),
    canUseChat: hasPermission('chat', 'create'),
    canReadVectorStats: hasPermission('vector', 'read'),
    canReadModelConfig: hasPermission('llm', 'read'),
  };
}