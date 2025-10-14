// src/hooks/useAdminClients.ts - COMPLETE FIXED VERSION
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

interface ClientState {
  clients: any[];
  availableAdmins: any[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

export function useAdminClients() {
  const [state, setState] = useState<ClientState>({
    clients: [],
    availableAdmins: [],
    isLoading: false,
    error: null,
    totalCount: 0,
  });

  const loadClients = useCallback(async (
    skip: number = 0, 
    limit: number = 100, 
    search?: string, 
    isActive?: boolean
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getAllClients();
      if (response.success) {
        let filteredClients = response.data.clients;
        
        // Apply search filter
        if (search) {
          filteredClients = filteredClients.filter(client => 
            client.name.toLowerCase().includes(search.toLowerCase()) ||
            client.slug.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        // Apply status filter
        if (isActive !== undefined) {
          filteredClients = filteredClients.filter(client => 
            client.is_active === isActive
          );
        }
        
        // Apply pagination
        const total = filteredClients.length;
        const paginatedClients = filteredClients.slice(skip, skip + limit);
        
        setState(prev => ({
          ...prev,
          clients: paginatedClients,
          totalCount: total,
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Failed to load clients');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load clients';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, []);

  const loadAvailableAdmins = useCallback(async () => {
    try {
      const response = await apiService.getUnassignedUsers();
      if (response.success) {
        setState(prev => ({
          ...prev,
          availableAdmins: response.data.users,
        }));
      }
    } catch (error) {
      console.error('Error loading available admins:', error);
    }
  }, []);

  const createClient = useCallback(async (clientData: {
    name: string;
    slug: string;
    description?: string;
    admin_email: string;
    contact_email?: string;
    user_limit?: number;
    project_limit?: number;
    storage_limit_gb?: number;
  }) => {
    try {
      console.log('Creating organization with data:', clientData);
      
      const response = await apiService.createOrganization(clientData);
      if (response.success) {
        setState(prev => ({
          ...prev,
          clients: [response.data.client, ...prev.clients],
          totalCount: prev.totalCount + 1,
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to create organization');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      console.error('Create client error:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const updateClient = useCallback(async (
    clientId: string, 
    updates: any
  ) => {
    try {
      const response = await apiService.updateClient(clientId, updates);
      if (response.success) {
        setState(prev => ({
          ...prev,
          clients: prev.clients.map(client =>
            client.id === clientId ? response.data.client : client
          ),
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to update client');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update client';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const response = await apiService.deleteClient(clientId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          clients: prev.clients.filter(client => client.id !== clientId),
          totalCount: prev.totalCount - 1,
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete client');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadClients,
    loadAvailableAdmins,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  };
}