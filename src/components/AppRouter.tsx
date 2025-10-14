// src/components/AppRouter.tsx - ROUTING LOGIC FOR SUPER ADMIN SEPARATION
"use client"

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import SuperAdminView from './SuperAdminView';
import AdminView from './AdminView';
// Import your regular chat application component
// import ChatApplication from './ChatApplication'; // Your main chat app

interface AppRouterProps {
  // Add any props your chat application needs
}

export default function AppRouter(props: AppRouterProps) {
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUserTypeAndAuth();
  }, []);

  const checkUserTypeAndAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const userInfo = await apiService.getCurrentUserType();
      
      if (userInfo) {
        setIsAuthenticated(true);
        setUserType(userInfo.user_type);
        console.log('User type detected:', userInfo.user_type);
      } else {
        setIsAuthenticated(false);
        setUserType(null);
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      setIsAuthenticated(false);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    // Redirect to login or refresh page
    window.location.href = '/login';
  };

  const handleExitAdmin = () => {
    // For regular admins, allow them to go back to chat
    // For super admin, this shouldn't be available
    console.log('Exiting admin panel...');
    // You can implement navigation back to chat here
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            Loading application...
          </span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // You can return a login component or redirect
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            color: '#111827', 
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Authentication Required
          </h2>
          <p style={{ 
            color: '#6b7280',
            marginBottom: '24px',
            fontSize: '16px'
          }}>
            Please login to access the application.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Route based on user type
  switch (userType) {
    case 'super_admin':
      // Super admin gets dedicated admin interface
      return <SuperAdminView onLogout={handleLogout} />;
      
    case 'admin':
      // Regular admin gets admin panel with option to exit to chat
      return <AdminView onExitAdmin={handleExitAdmin} />;
      
    case 'user':
    default:
      // Regular users get the chat application
      // Replace this with your actual chat application component
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa'
        }}>
          <h2>Chat Application</h2>
          <p>Regular user interface would go here</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
          {/* Replace with: <ChatApplication {...props} /> */}
        </div>
      );
  }
}

// Optional: Create a hook for user type checking
export const useUserType = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const userInfo = await apiService.getCurrentUserType();
        setUserType(userInfo?.user_type || null);
      } catch (error) {
        console.error('Error checking user type:', error);
        setUserType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserType();
  }, []);

  return { userType, isLoading };
};