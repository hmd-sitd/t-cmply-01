"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import type { User, Role } from '../../types';

interface AdminUser extends User {
  roles: Role[];
}

interface RoleAssignmentModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  availableRoles: Role[];
  onClose: () => void;
  onAssignRole: (userId: number, roleId: number) => Promise<boolean>;
  onRemoveRole: (userId: number, roleId: number) => Promise<boolean>;
}

export default function RoleAssignmentModal({
  isOpen,
  user,
  availableRoles,
  onClose,
  onAssignRole,
  onRemoveRole
}: RoleAssignmentModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user && user.roles) {
      setSelectedRoles(user.roles.map(role => role.id));
    }
  }, [user]);

  const filteredRoles = availableRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleToggle = async (roleId: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const isCurrentlyAssigned = selectedRoles.includes(roleId);
      let success = false;

      if (isCurrentlyAssigned) {
        success = await onRemoveRole(user.id, roleId);
        if (success) {
          setSelectedRoles(prev => prev.filter(id => id !== roleId));
        }
      } else {
        success = await onAssignRole(user.id, roleId);
        if (success) {
          setSelectedRoles(prev => [...prev, roleId]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleById = (roleId: number) => {
    return availableRoles.find(role => role.id === roleId);
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
          maxWidth: "600px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
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
          <div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: currentTheme.colors.textDark,
              margin: "0 0 4px 0",
            }}>
              Manage User Roles
            </h2>
            <p style={{
              fontSize: "16px",
              color: currentTheme.colors.textMedium,
              margin: 0,
            }}>
              {user.email}
            </p>
          </div>
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

        {/* Current Roles Summary */}
        <div style={{
          padding: "16px",
          backgroundColor: currentTheme.colors.backgroundAlt,
          borderRadius: "8px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textMedium,
            marginBottom: "8px",
          }}>
            Current Roles ({selectedRoles.length})
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}>
            {selectedRoles.length > 0 ? (
              selectedRoles.map(roleId => {
                const role = getRoleById(roleId);
                return role ? (
                  <div
                    key={role.id}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: `${currentTheme.colors.primary}20`,
                      color: currentTheme.colors.primary,
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {role.name}
                    <button
                      onClick={() => handleRoleToggle(role.id)}
                      disabled={isLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: currentTheme.colors.primary,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        padding: "0 2px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })
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

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 16px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              backgroundColor: currentTheme.colors.inputBackground,
              color: currentTheme.colors.textDark,
            }}
          />
          <svg
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: currentTheme.colors.textMedium,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Available Roles */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          border: `1px solid ${currentTheme.colors.grayLight}`,
          borderRadius: "8px",
          marginBottom: "24px",
        }}>
          {filteredRoles.length === 0 ? (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: currentTheme.colors.textMedium,
            }}>
              {searchTerm ? `No roles found matching "${searchTerm}"` : 'No roles available'}
            </div>
          ) : (
            filteredRoles.map((role, index) => {
              const isAssigned = selectedRoles.includes(role.id);
              return (
                <div
                  key={role.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px",
                    borderBottom: index < filteredRoles.length - 1 
                      ? `1px solid ${currentTheme.colors.backgroundAlt}` 
                      : "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => handleRoleToggle(role.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => {}} // Handled by parent click
                    disabled={isLoading}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: currentTheme.colors.primary,
                      marginRight: "12px",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: currentTheme.colors.textDark,
                      marginBottom: "4px",
                    }}>
                      {role.name}
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: currentTheme.colors.textMedium,
                      marginBottom: "4px",
                    }}>
                      {role.description}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: currentTheme.colors.textLight,
                      display: "flex",
                      gap: "16px",
                    }}>
                      <span>{role.user_count} users</span>
                      <span>{role.permission_count} permissions</span>
                      <span className={role.is_active ? 'active' : 'inactive'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}