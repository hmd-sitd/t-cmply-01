// src/hooks/useAdminStats.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalProjects: number;
  totalRoles: number;
  totalPermissions: number;
  vectorStats?: {
    total_objects: number;
    total_vectors: number;
    collection_name: string;
    dimension: number;
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalFiles: 0,
    totalProjects: 0,
    totalRoles: 0,
    totalPermissions: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get users count
      const usersResponse = await apiService.getAllUsers();
      
      // Get documents count - wrap in try-catch since the table might not exist
      let documentsCount = 0;
      try {
        const docsResponse = await apiService.listDocuments();
        documentsCount = docsResponse.data.count || 0;
      } catch (err) {
        console.warn('Could not load documents count:', err);
        // This is expected if the files table doesn't exist yet
        documentsCount = 0;
      }

      // Get roles count - wrap in try-catch
      let rolesCount = 0;
      try {
        const rolesResponse = await apiService.getAllRoles();
        rolesCount = rolesResponse.data?.length || 0;
      } catch (err) {
        console.warn('Could not load roles count:', err);
        rolesCount = 0;
      }

      // Get projects count - wrap in try-catch
      let projectsCount = 0;
      try {
        const projectsResponse = await apiService.getProjects();
        projectsCount = projectsResponse.data?.length || 0;
      } catch (err) {
        console.warn('Could not load projects count:', err);
        projectsCount = 0;
      }

      setStats({
        totalUsers: usersResponse.data?.count || 0,
        activeUsers: usersResponse.data?.users?.filter((u: any) => u.is_active).length || 0,
        totalFiles: documentsCount,
        totalProjects: projectsCount,
        totalRoles: rolesCount,
        totalPermissions: 0, // TODO: Add API endpoint for permissions count
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setError(error.message || 'Failed to load statistics');
      
      // Set default stats on error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalFiles: 0,
        totalProjects: 0,
        totalRoles: 0,
        totalPermissions: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    error,
    loadStats,
  };
}