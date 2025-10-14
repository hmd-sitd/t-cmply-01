import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { Role, Permission, RBACResponse } from '../types';

interface UseAdminRBACState {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminRBAC() {
  const [state, setState] = useState<UseAdminRBACState>({
    roles: [],
    permissions: [],
    isLoading: false,
    error: null,
  });

  // Role Management
  const loadRoles = useCallback(async (skip: number = 0, limit: number = 100) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getRoles(skip, limit);
      if (response.success) {
        setState(prev => ({
          ...prev,
          roles: response.data.roles,
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Failed to load roles');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load roles',
        isLoading: false,
      }));
    }
  }, []);

  const createRole = useCallback(async (name: string, description: string, isActive: boolean = true) => {
    try {
      const response = await apiService.createRole({ name, description, is_active: isActive });
      if (response.success) {
        setState(prev => ({
          ...prev,
          roles: [...prev.roles, response.data.role],
        }));
        return response.data.role;
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create role',
      }));
      return null;
    }
  }, []);

  const updateRole = useCallback(async (roleId: number, name?: string, description?: string, isActive?: boolean) => {
    try {
      const response = await apiService.updateRole(roleId, { name, description, is_active: isActive });
      if (response.success) {
        setState(prev => ({
          ...prev,
          roles: prev.roles.map(role =>
            role.id === roleId ? response.data.role : role
          ),
        }));
        return response.data.role;
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update role',
      }));
      return null;
    }
  }, []);

  const deleteRole = useCallback(async (roleId: number) => {
    try {
      const response = await apiService.deleteRole(roleId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          roles: prev.roles.filter(role => role.id !== roleId),
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete role',
      }));
      return false;
    }
  }, []);

  // Permission Management
  const loadPermissions = useCallback(async (skip: number = 0, limit: number = 100, resource?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getPermissions(skip, limit, resource);
      if (response.success) {
        setState(prev => ({
          ...prev,
          permissions: response.data.permissions,
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Failed to load permissions');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load permissions',
        isLoading: false,
      }));
    }
  }, []);

  const createPermission = useCallback(async (name: string, description: string, resource: string, action: string, isActive: boolean = true) => {
    try {
      const response = await apiService.createPermission({ name, description, resource, action, is_active: isActive });
      if (response.success) {
        setState(prev => ({
          ...prev,
          permissions: [...prev.permissions, response.data.permission],
        }));
        return response.data.permission;
      } else {
        throw new Error(response.message || 'Failed to create permission');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create permission',
      }));
      return null;
    }
  }, []);

  const assignRolePermission = useCallback(async (roleId: number, permissionId: number) => {
    try {
      const response = await apiService.assignRolePermission(roleId, permissionId);
      if (response.success) {
        // Reload roles to get updated permission counts
        await loadRoles();
        return true;
      } else {
        throw new Error(response.message || 'Failed to assign permission');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to assign permission',
      }));
      return false;
    }
  }, [loadRoles]);

  const removeRolePermission = useCallback(async (roleId: number, permissionId: number) => {
    try {
      const response = await apiService.removeRolePermission(roleId, permissionId);
      if (response.success) {
        // Reload roles to get updated permission counts
        await loadRoles();
        return true;
      } else {
        throw new Error(response.message || 'Failed to remove permission');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove permission',
      }));
      return false;
    }
  }, [loadRoles]);

  return {
    ...state,
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    loadPermissions,
    createPermission,
    assignRolePermission,
    removeRolePermission,
  };
}