// Create this file as src/hooks/useAdminRoles.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { Role } from '../types';

interface UseAdminRolesState {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

export function useAdminRoles() {
  const [state, setState] = useState<UseAdminRolesState>({
    roles: [],
    isLoading: false,
    error: null,
    totalCount: 0,
  });

  const loadRoles = useCallback(async (skip: number = 0, limit: number = 100) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getRoles(skip, limit);
      if (response.success) {
        setState(prev => ({
          ...prev,
          roles: response.data.roles,
          totalCount: response.data.count,
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

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadRoles,
    clearError,
  };
}