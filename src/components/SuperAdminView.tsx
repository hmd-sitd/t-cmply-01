// src/components/SuperAdminView.tsx - FIXED LOGOUT REDIRECT
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { apiService } from '../services/api';
import SystemStats from './admin/SystemStats';
import UsersTab from './admin/UsersTab';
import RolesTab from './admin/RolesTab';
import ProjectsTab from './admin/ProjectsTab';
import ChatHistoryTab from './admin/ChatHistoryTab';
import ClientsTab from './admin/ClientsTab';
import UserAssignmentTab from './admin/UserAssignmentTab';

interface SuperAdminViewProps {
  onLogout: () => void;
}

export default function SuperAdminView({ onLogout }: SuperAdminViewProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { stats, isLoading: statsLoading, loadStats } = useAdminStats();

  useEffect(() => {
    loadStats();
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const info = await apiService.getCurrentUserType();
      setUserInfo(info);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await apiService.logout();
        onLogout(); // Call the parent logout handler
      } catch (error) {
        console.error('Logout error:', error);
        onLogout(); // Force logout even on error
      }
    }
  };

  const menuItems = [
    { id: "dashboard", label: "System Overview", icon: DashboardIcon },
    { id: "clients", label: "Organizations", icon: BuildingIcon },
    { id: "user-assignment", label: "User Assignment", icon: UserAssignIcon },
    { id: "users", label: "User Management", icon: UsersIcon },
    { id: "roles", label: "Roles & Permissions", icon: DatabaseIcon },
    { id: "projects", label: "Projects", icon: FolderIcon },
    { id: "chats", label: "Chat History", icon: MessageSquareIcon },
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

  return (
    <>
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: theme.colors.background,
        display: "flex",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: "280px",
          backgroundColor: theme.colors.sidebar,
          borderRight: `1px solid ${theme.colors.grayLight}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          position: "fixed",
          height: "100vh",
          zIndex: 1000,
        }}>
          {/* Header with Logo */}
          <div style={{ 
            padding: "24px",
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              marginBottom: "16px"
            }}>
              {theme.logo.loginImageUrl ? (
                <img 
                  src={theme.logo.loginImageUrl}
                  alt={`${theme.companyName} Logo`}
                  style={{
                    height: "32px",
                    maxWidth: "140px",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)"
                  }}
                />
              ) : (
                <div style={{ 
                  fontSize: "20px", 
                  fontWeight: "bold",
                  color: "white"
                }}>
                  <span>{theme.logo.text}</span>
                  <span style={{ marginLeft: "4px" }}>{theme.logo.subText}</span>
                </div>
              )}
            </div>
            
            <div style={{ 
              color: "white", 
              fontWeight: "600", 
              fontSize: "18px",
              marginBottom: "8px"
            }}>
              Super Admin Panel
            </div>
          </div>

          {/* Navigation Menu */}
          <div style={{ 
            flex: 1, 
            padding: "16px",
            display: "flex",
            flexDirection: "column"
          }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      color: isActive ? "white" : "rgba(255, 255, 255, 0.7)",
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
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
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
        </div>

        {/* Main Content Area */}
        <div style={{ 
          flex: 1, 
          marginLeft: "280px",
          display: "flex",
          flexDirection: "column",
          maxWidth: "calc(100vw - 280px)", 
          overflow: "hidden"
        }}>
          {/* Top Header with User Profile */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 32px",
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.grayLight}`,
            position: "relative"
          }}>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: theme.colors.textDark,
              margin: 0
            }}>
              {menuItems.find(item => item.id === activeTab)?.label || "Super Admin Panel"}
            </h1>
            
            {/* User Profile in Top Right */}
            {userInfo && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    border: `1px solid ${theme.colors.grayLight}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: theme.colors.textDark,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.inputBorderFocus;
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.grayLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}>
                    {userInfo.email[0].toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>
                      {userInfo.email.split('@')[0]}
                    </span>
                    <span style={{ fontSize: '12px', color: theme.colors.textMedium }}>
                      Super Admin
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    backgroundColor: "white",
                    border: `1px solid ${theme.colors.grayLight}`,
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    minWidth: "220px",
                    zIndex: 1002,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${theme.colors.grayLight}`,
                      backgroundColor: theme.colors.backgroundAlt,
                    }}>
                      <div style={{ fontSize: '12px', color: theme.colors.textMedium, marginBottom: '4px' }}>
                        Signed in as
                      </div>
                      <div style={{ fontWeight: '600', color: theme.colors.textDark, fontSize: '14px' }}>
                        {userInfo.email}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.colors.textMedium, marginTop: '2px' }}>
                        Super Administrator
                      </div>
                    </div>
                    
                    <div style={{ borderTop: `1px solid ${theme.colors.grayLight}`, padding: '8px 0' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: theme.colors.error,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${theme.colors.error}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOutIcon />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div style={{ 
            flex: 1, 
            padding: "32px", 
            overflow: "auto"
          }}>
            {/* Global Error Display */}
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
          </div>
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1001
            }}
            onClick={() => setShowUserMenu(false)}
          />
        )}
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
    </>
  );
}

// Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);