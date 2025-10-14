// src/components/admin/CompleteAdminView.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useAdminStats } from '../../hooks/useAdminStats';
import SystemStats from './SystemStats';
import UsersTab from './UsersTab';
import RolesTab from './RolesTab';
import ProjectsTab from './ProjectsTab';
import ChatHistoryTab from './ChatHistoryTab';
import { apiService } from '../../services/api';

interface AdminViewProps {
  onExitAdmin: () => void;
}

export default function CompleteAdminView({ onExitAdmin }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
    const isAuthenticated = apiService.isAuthenticated();
  
  const { isAdmin } = useAdminPermissions(isAuthenticated);
  const { stats, isLoading, loadStats } = useAdminStats();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon },
    { id: "users", label: "Users", icon: UsersIcon },
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
            isLoading={isLoading} 
            onRefresh={loadStats} 
          />
        );
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
            isLoading={isLoading} 
            onRefresh={loadStats} 
          />
        );
    }
  };

  if (!isAdmin) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: currentTheme.colors.surface,
        borderRadius: "8px",
        margin: "20px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: `${currentTheme.colors.error}20`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={currentTheme.colors.error} strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <h2 style={{ 
            color: currentTheme.colors.textDark, 
            marginBottom: "16px",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            Access Denied
          </h2>
          <p style={{ 
            color: currentTheme.colors.textMedium,
            marginBottom: "24px",
            fontSize: "16px"
          }}>
            You need admin permissions to access this section.
          </p>
          <button
            onClick={onExitAdmin}
            style={{
              padding: "12px 24px",
              backgroundColor: currentTheme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
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
        backgroundColor: currentTheme.colors.surface,
        borderRight: `1px solid ${currentTheme.colors.grayLight}`,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}>
        <div style={{ padding: "24px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              <span style={{ color: currentTheme.colors.primary }}>{currentTheme.logo.text}</span>
              <span style={{ color: currentTheme.colors.textDark, marginLeft: "4px" }}>{currentTheme.logo.subText}</span>
            </div>
          </div>
          <div style={{ 
            color: currentTheme.colors.primary, 
            fontWeight: "500", 
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
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    backgroundColor: isActive ? currentTheme.colors.primary : "transparent",
                    color: isActive ? "white" : currentTheme.colors.textMedium,
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
                      e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
                      e.currentTarget.style.color = currentTheme.colors.textDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = currentTheme.colors.textMedium;
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
              color: currentTheme.colors.textMedium,
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
              e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
              e.currentTarget.style.color = currentTheme.colors.textDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = currentTheme.colors.textMedium;
            }}
          >
            <LogOutIcon />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "32px", maxWidth: "100%", overflow: "hidden" }}>
        {/* Error Display */}
        {error && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: `${currentTheme.colors.error}20`,
            border: `1px solid ${currentTheme.colors.error}`,
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
            color: currentTheme.colors.error,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {getTabContent()}
      </div>
    </div>
  );
}

// Icons
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

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);