"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import type { User, Role } from '../../types';

interface AdminUser extends User {
  roles: Role[];
}

interface UserModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (userId: number, updates: Partial<User>) => Promise<boolean>;
  onResetPassword: (userId: number) => Promise<string | null>;
}

export default function UserModal({
  isOpen,
  user,
  onClose,
  onSave,
  onResetPassword
}: UserModalProps) {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsActive(user.is_active);
    }
    setResetToken(null);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const success = await onSave(user.id, { is_active: isActive });
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await onResetPassword(user.id);
      setResetToken(token);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: 0,
          }}>
            Edit User
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: currentTheme.colors.textMedium,
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* User Info */}
        <div style={{
          padding: "20px",
          backgroundColor: currentTheme.colors.backgroundAlt,
          borderRadius: "8px",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: currentTheme.colors.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <div style={{
                fontSize: "18px",
                fontWeight: "600",
                color: currentTheme.colors.textDark,
                marginBottom: "4px",
              }}>
                {user.email}
              </div>
              <div style={{
                fontSize: "14px",
                color: currentTheme.colors.textMedium,
              }}>
                ID: {user.id} • Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <div style={{
              fontSize: "14px",
              fontWeight: "500",
              color: currentTheme.colors.textMedium,
              marginBottom: "8px",
            }}>
              Current Roles
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              {user.roles && user.roles.length > 0 ? (
                user.roles.map(role => (
                  <div
                    key={role.id}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: `${currentTheme.colors.primary}20`,
                      color: currentTheme.colors.primary,
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {role.name}
                  </div>
                ))
              ) : (
                <span style={{
                  fontSize: "14px",
                  color: currentTheme.colors.textMedium,
                  fontStyle: "italic",
                }}>
                  No roles assigned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            fontSize: "16px",
            color: currentTheme.colors.textDark,
          }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: currentTheme.colors.primary,
              }}
            />
            User is active
          </label>
          <div style={{
            fontSize: "14px",
            color: currentTheme.colors.textMedium,
            marginTop: "4px",
            marginLeft: "30px",
          }}>
            Inactive users cannot log in or access the system
          </div>
        </div>

        {/* Password Reset Section */}
        <div style={{
          padding: "20px",
          backgroundColor: currentTheme.colors.backgroundAlt,
          borderRadius: "8px",
          marginBottom: "32px",
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: "0 0 12px 0",
          }}>
            Password Reset
          </h3>
          <p style={{
            fontSize: "14px",
            color: currentTheme.colors.textMedium,
            margin: "0 0 16px 0",
          }}>
            Generate a password reset token for this user. They can use this token to set a new password.
          </p>
          
          {resetToken && (
            <div style={{
              padding: "12px",
              backgroundColor: `${currentTheme.colors.success}20`,
              border: `1px solid ${currentTheme.colors.success}`,
              borderRadius: "6px",
              marginBottom: "16px",
            }}>
              <div style={{
                fontSize: "12px",
                color: currentTheme.colors.success,
                fontWeight: "500",
                marginBottom: "4px",
              }}>
                Reset Token Generated
              </div>
              <div style={{
                fontSize: "14px",
                color: currentTheme.colors.textDark,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}>
                {resetToken}
              </div>
            </div>
          )}
          
          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: currentTheme.colors.buttonSecondary,
              color: currentTheme.colors.primary,
              border: `1px solid ${currentTheme.colors.primary}`,
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Generating..." : "Generate Reset Token"}
          </button>
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: currentTheme.colors.textMedium,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              backgroundColor: isLoading ? currentTheme.colors.textLight : currentTheme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
                