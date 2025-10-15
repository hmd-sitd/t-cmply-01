"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { useAdminStats } from '../hooks/useAdminStats';
import { apiService } from '../services/api';
import SystemStats from './admin/SystemStats';
import UsersTab from './admin/UsersTab';
import RolesTab from './admin/RolesTab';
import ProjectsTab from './admin/ProjectsTab';
import ChatHistoryTab from './admin/ChatHistoryTab';
import ClientsTab from './admin/ClientsTab';
import UserAssignmentTab from './admin/UserAssignmentTab';

interface AdminViewProps {
  onExitAdmin: () => void;
}

export default function AdminView({ onExitAdmin }: AdminViewProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");

  // UPDATED: Get authentication status and pass to useAdminPermissions
  const isAuthenticated = apiService.isAuthenticated();
  const { isAdmin, isLoading: permissionsLoading } = useAdminPermissions(isAuthenticated);
  const { stats, isLoading: statsLoading, loadStats } = useAdminStats();

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, loadStats]);
  
  useEffect(() => {
    const loadUserType = async () => {
      const userInfo = await apiService.getCurrentUserType();
      setUserType(userInfo?.user_type || "");
    };
    loadUserType();
  }, []);
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  // UPDATED: Only show roles tab for super_admin
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon, disabled: false },
    ...(userType === 'super_admin' ? [
      { id: "clients", label: "Organizations", icon: BuildingIcon, disabled: false },
      { id: "user-assignment", label: "User Assignment", icon: UserAssignIcon, disabled: false },
      { id: "roles", label: "Roles & Permissions", icon: DatabaseIcon, disabled: false }, // ONLY for super_admin
    ] : []),
    { id: "users", label: "Users", icon: UsersIcon, disabled: false },
    { id: "projects", label: "Projects", icon: FolderIcon, disabled: false },
    { id: "chats", label: "Chat History", icon: MessageSquareIcon, disabled: false },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <SystemStats 
            stats={stats} 
            isLoading={statsLoading} 
            onRefresh={loadStats} 
          />
        );
      case "clients":
        return <ClientsTab onError={handleError} />;
      case "user-assignment":
        return <UserAssignmentTab onError={handleError} />;
      case "users":
        return <UsersTab onError={handleError} />;
      case "roles":
        // UPDATED: Only allow super_admin access
        if (userType !== 'super_admin') {
          return (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: theme.colors.surface,
              borderRadius: "8px",
              border: `1px solid ${theme.colors.grayLight}`,
            }}>
              <div style={{
                fontSize: "18px",
                fontWeight: "500",
                color: theme.colors.error,
                marginBottom: "8px",
              }}>
                Access Denied
              </div>
              <div style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
              }}>
                Only Super Administrators can manage roles and permissions
              </div>
            </div>
          );
        }
        return <RolesTab onError={handleError} />;
      case "projects":
        return <ProjectsTab onError={handleError} />;
      case "chats":
        return <ChatHistoryTab onError={handleError} />;
      default:
        return (
          <SystemStats 
            stats={stats} 
            isLoading={statsLoading} 
            onRefresh={loadStats} 
          />
        );
    }
  };

  // Loading state
  if (permissionsLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: `4px solid ${theme.colors.grayLight}`,
            borderTop: `4px solid ${theme.colors.primary}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ color: theme.colors.textMedium }}>
            Loading admin panel...
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

  // Access denied
  if (!isAdmin) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px"
      }}>
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "500px",
          border: `1px solid ${theme.colors.grayLight}`,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: `${theme.colors.error}20`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <h2 style={{ 
            color: theme.colors.textDark, 
            marginBottom: "16px",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            Access Denied
          </h2>
          <p style={{ 
            color: theme.colors.textMedium,
            marginBottom: "24px",
            fontSize: "16px",
            lineHeight: "1.5"
          }}>
            You need administrator permissions to access this section. Please contact your system administrator if you believe this is an error.
          </p>
          <button
            onClick={onExitAdmin}
            style={{
              padding: "12px 24px",
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
            }}
          >
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: "256px",
        backgroundColor: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.grayLight}`,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        position: "fixed",
        height: "100vh",
        zIndex: 1000,
      }}>
        <div style={{ padding: "24px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            {theme.logo.loginImageUrl ? (
              <img 
                src={theme.logo.loginImageUrl}
                alt={`${theme.companyName} Logo`}
                style={{
                  height: "32px",
                  maxWidth: "140px",
                  objectFit: "contain"
                }}
              />
            ) : (
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                <span style={{ color: theme.colors.primary }}>{theme.logo.text}</span>
                <span style={{ color: theme.colors.textDark, marginLeft: "4px" }}>{theme.logo.subText}</span>
              </div>
            )}
          </div>
          
          <div style={{ 
            color: theme.colors.primary, 
            fontWeight: "600", 
            marginBottom: "32px",
            fontSize: "16px"
          }}>
            Admin Panel
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  disabled={item.disabled}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    backgroundColor: isActive ? theme.colors.primary : "transparent",
                    color: isActive ? "white" : item.disabled ? theme.colors.textLight : theme.colors.textMedium,
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                    width: "100%",
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !item.disabled) {
                      e.currentTarget.style.backgroundColor = theme.colors.backgroundAlt;
                      e.currentTarget.style.color = theme.colors.textDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !item.disabled) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = theme.colors.textMedium;
                    }
                  }}
                >
                  <IconComponent />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit Admin Button */}
        <div style={{ marginTop: "auto", padding: "24px" }}>
          <button
            onClick={onExitAdmin}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              backgroundColor: "transparent",
              color: theme.colors.textMedium,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "left",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.backgroundAlt;
              e.currentTarget.style.color = theme.colors.textDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = theme.colors.textMedium;
            }}
          >
            <LogOutIcon />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: "256px",
        padding: "32px", 
        maxWidth: "calc(100vw - 256px)", 
        overflow: "hidden" 
      }}>
        {/* Error Display */}
        {error && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: `${theme.colors.error}20`,
            border: `1px solid ${theme.colors.error}`,
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
            color: theme.colors.error,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "slideDown 0.3s ease-out",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                backgroundColor: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
          {getTabContent()}
        </div>
        
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// Icons (same as before...)
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const UserAssignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01"/>
    <path d="M16 6h.01"/>
    <path d="M12 6h.01"/>
    <path d="M12 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 10h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 10h.01"/>
    <path d="M8 14h.01"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);