// src/components/Header.tsx
"use client"

import React from 'react';
import UserProfile from './UserProfile';
import { currentTheme } from '../config/themes';

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
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        backgroundColor: currentTheme.colors.surface,
        borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
      }}
    >
      {/* Tab Toggle */}
      <div
        style={{
          display: "flex",
          backgroundColor: currentTheme.colors.backgroundAlt,
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
            backgroundColor: activeTab === "chat" ? currentTheme.colors.tabActive : "transparent",
            color: activeTab === "chat" ? "white" : currentTheme.colors.tabInactive,
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "chat") {
              e.currentTarget.style.color = currentTheme.colors.tabInactiveHover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "chat") {
              e.currentTarget.style.color = currentTheme.colors.tabInactive;
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
            backgroundColor: activeTab === "workspace" ? currentTheme.colors.tabActive : "transparent",
            color: activeTab === "workspace" ? "white" : currentTheme.colors.tabInactive,
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "workspace") {
              e.currentTarget.style.color = currentTheme.colors.tabInactiveHover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "workspace") {
              e.currentTarget.style.color = currentTheme.colors.tabInactive;
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
              backgroundColor: activeTab === "admin" ? currentTheme.colors.tabActive : "transparent",
              color: activeTab === "admin" ? "white" : currentTheme.colors.tabInactive,
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "admin") {
                e.currentTarget.style.color = currentTheme.colors.tabInactiveHover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "admin") {
                e.currentTarget.style.color = currentTheme.colors.tabInactive;
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
            backgroundColor: isBackendConnected ? `${currentTheme.colors.success}20` : `${currentTheme.colors.error}30`,
            border: `1px solid ${isBackendConnected ? currentTheme.colors.success : currentTheme.colors.error}`,
            borderRadius: "6px",
            fontSize: "12px",
            color: currentTheme.colors.textDark,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isBackendConnected ? currentTheme.colors.success : currentTheme.colors.error,
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
              backgroundColor: currentTheme.colors.buttonPrimary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary;
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