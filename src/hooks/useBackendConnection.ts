// src/hooks/useBackendConnection.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export function useBackendConnection() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const checkBackendConnection = useCallback(async () => {
    try {
      const connected = await apiService.checkConnection();
      setIsBackendConnected(connected);
      setConnectionError(connected ? null : "Backend is not available at http://localhost:8003");
      console.log("Backend connection status:", connected);
    } catch (error) {
      console.error("Connection check failed:", error);
      setIsBackendConnected(false);
      setConnectionError("Failed to connect to backend");
    }
  }, []);

  return {
    isBackendConnected,
    connectionError,
    checkBackendConnection
  };
}