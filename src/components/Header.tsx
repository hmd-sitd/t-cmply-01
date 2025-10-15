// src/components/Header.tsx
"use client"

import React from 'react';
import UserProfile from './UserProfile';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  activeTab: "chat" | "workspace" | "admin";
  setActiveTab: (tab: "chat" | "workspace" | "admin") => void;
  isBackendConnected: boolean;
  connectionError: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onAuthModalOpen: () => void;
  onLogout: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  isBackendConnected,
  connectionError,
  isAuthenticated,
  isAdmin,
  onAuthModalOpen,
  onLogout
}: HeaderProps) {
  const { theme } = useTheme();
  
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.grayLight}`,
      }}
    >
      {/* Tab Toggle */}
      <div
        style={{
          display: "flex",
          backgroundColor: theme.colors.backgroundAlt,
          borderRadius: "25px",
          padding: "4px",
        }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            padding: "8px 24px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "chat" ? theme.colors.tabActive : "transparent",
            color: activeTab === "chat" ? "white" : theme.colors.tabInactive,
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "chat") {
              e.currentTarget.style.color = theme.colors.tabInactiveHover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "chat") {
              e.currentTarget.style.color = theme.colors.tabInactive;
            }
          }}
        >
          Chat
        </button>

        {/* NEW: Workspace Tab */}
        <button
          onClick={() => setActiveTab("workspace")}
          style={{
            padding: "8px 24px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "workspace" ? theme.colors.tabActive : "transparent",
            color: activeTab === "workspace" ? "white" : theme.colors.tabInactive,
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "workspace") {
              e.currentTarget.style.color = theme.colors.tabInactiveHover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "workspace") {
              e.currentTarget.style.color = theme.colors.tabInactive;
            }
          }}
        >
          Projects
        </button>
        
        {/* Admin Tab - Only show if user has admin permissions */}
        {isAuthenticated && isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            style={{
              padding: "8px 24px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: activeTab === "admin" ? theme.colors.tabActive : "transparent",
              color: activeTab === "admin" ? "white" : theme.colors.tabInactive,
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "admin") {
                e.currentTarget.style.color = theme.colors.tabInactiveHover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "admin") {
                e.currentTarget.style.color = theme.colors.tabInactive;
              }
            }}
          >
            Admin
          </button>
        )}
      </div>

      {/* Right Side with Connection Status and Authentication */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Backend Connection Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            backgroundColor: isBackendConnected ? `${theme.colors.success}20` : `${theme.colors.error}30`,
            border: `1px solid ${isBackendConnected ? theme.colors.success : theme.colors.error}`,
            borderRadius: "6px",
            fontSize: "12px",
            color: theme.colors.textDark,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isBackendConnected ? theme.colors.success : theme.colors.error,
            }}
          />
          {isBackendConnected ? "Connected" : connectionError || "Disconnected"}
        </div>

        {/* Authentication Section */}
        {isAuthenticated ? (
          <UserProfile onLogout={onLogout} />
        ) : (
          <button
            onClick={onAuthModalOpen}
            style={{
              padding: "8px 16px",
              backgroundColor: theme.colors.buttonPrimary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}