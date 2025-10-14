// Updated useAdminUsers hook for hooks/useAdminUsers.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { User, Role, ApiResponse } from '../types';

interface AdminUser extends User {
  roles: Role[];
}

interface UseAdminUsersState {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasPermission: boolean;
}

export function useAdminUsers() {
  const [state, setState] = useState<UseAdminUsersState>({
    users: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    hasPermission: true, // Assume true initially
  });

  const loadUsers = useCallback(async (skip: number = 0, limit: number = 50, search?: string, isActive?: boolean) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First check if user has admin permissions
      const hasAdminAccess = await apiService.checkAdminAccess();
      
      if (!hasAdminAccess) {
        setState(prev => ({
          ...prev,
          error: 'Access denied. Admin permissions required.',
          hasPermission: false,
          isLoading: false,
        }));
        return;
      }

      // Load users from the new endpoint
      const response = await apiService.getAllUsers(skip, limit, search, isActive);
      
      if (response.success) {
        console.log('Users loaded successfully:', response.data);
        
        setState(prev => ({
          ...prev,
          users: response.data.users,
          totalCount: response.data.count,
          hasPermission: true,
          isLoading: false,
          error: null,
        }));
      } else {
        throw new Error(response.message || 'Failed to load users');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      console.error('Load users error:', errorMessage);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        hasPermission: !errorMessage.includes('Access denied'),
        isLoading: false,
      }));
    }
  }, []);

  const updateUserStatus = useCallback(async (userId: number, isActive: boolean) => {
    try {
      const response = await apiService.updateUserStatus(userId, isActive);
      if (response.success) {
        setState(prev => ({
          ...prev,
          users: prev.users.map(user =>
            user.id === userId ? { ...user, is_active: isActive } : user
          ),
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          users: prev.users.filter(user => user.id !== userId),
          totalCount: prev.totalCount - 1,
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

// Add this to your useAdminUsers hook or replace the existing assignUserRole function

const assignUserRole = useCallback(async (userId: number, roleId: number) => {
  try {
    console.log('useAdminUsers: Assigning role', { userId, roleId });
    
    const response = await apiService.assignRoleToUser(userId, roleId);
    console.log('useAdminUsers: Assignment response', response);
    
    if (response.success) {
      // Reload users to get updated role assignments
      await loadUsers();
      return true;
    } else {
      console.error('useAdminUsers: Assignment failed', response.message);
      setState(prev => ({
        ...prev,
        error: response.message || 'Failed to assign role',
      }));
      return false;
    }
  } catch (error: any) {
    console.error('useAdminUsers: Assignment error', error);
    setState(prev => ({
      ...prev,
      error: error.message || 'Failed to assign role',
    }));
    return false;
  }
}, [loadUsers]);

  const removeUserRole = useCallback(async (userId: number, roleId: number) => {
    try {
      const response = await apiService.removeUserRole(userId, roleId);
      if (response.success) {
        // Reload users to get updated role assignments
        await loadUsers();
        return true;
      } else {
        throw new Error(response.message || 'Failed to remove role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, [loadUsers]);

  const resetUserPassword = useCallback(async (userId: number) => {
    try {
      const response = await apiService.resetUserPassword(userId);
      if (response.success) {
        return response.data.reset_token || null;
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const refreshUsers = useCallback(() => {
    // Refresh with current filters/pagination - you might want to store these in state
    return loadUsers();
  }, [loadUsers]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadUsers,
    updateUserStatus,
    deleteUser,
    assignUserRole,
    removeUserRole,
    resetUserPassword,
    refreshUsers,
    clearError,
  };
}