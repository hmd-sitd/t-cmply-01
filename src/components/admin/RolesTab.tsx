"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import { apiService } from '../../services/api';
import type { Role, Permission } from '../../types';

interface RolesTabProps {
  onError: (error: string) => void;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

export default function RolesTab({ onError }: RolesTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userType, setUserType] = useState<string>("");

  useEffect(() => {
    checkSuperAdminAndLoad();
  }, []);

  const checkSuperAdminAndLoad = async () => {
    try {
      const userInfo = await apiService.getCurrentUserType();
      setUserType(userInfo?.user_type || "");
      
      if (userInfo?.user_type === 'super_admin') {
        await Promise.all([loadRoles(), loadPermissions()]);
      }
    } catch (error: any) {
      onError(error.message || 'Failed to verify permissions');
    }
  };

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getRoles();
      if (response.success) {
        setRoles(response.data.roles);
      } else {
        throw new Error(response.message || 'Failed to load roles');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await apiService.getAllPermissions();
      if (response.success) {
        setPermissions(response.data.permissions);
      } else {
        throw new Error(response.message || 'Failed to load permissions');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to load permissions');
    }
  };

  const handleCreateRole = async (name: string, description: string, selectedPermissions: number[]) => {
    try {
      const response = await apiService.createRole({
        name,
        description,
        scope: 'client', // Default scope
        permission_ids: selectedPermissions,
      });
      
      if (response.success) {
        setIsCreateModalOpen(false);
        await loadRoles(); // Reload roles
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      try {
        const response = await apiService.deleteRole(role.id);
        if (response.success) {
          await loadRoles(); // Reload roles
        } else {
          throw new Error(response.message || 'Failed to delete role');
        }
      } catch (error: any) {
        onError(error.message || 'Failed to delete role');
      }
    }
  };

  // Check if user is super admin
  if (userType !== 'super_admin') {
    return (
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        backgroundColor: currentTheme.colors.surface,
        borderRadius: "8px",
        border: `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <div style={{
          fontSize: "18px",
          fontWeight: "500",
          color: currentTheme.colors.error,
          marginBottom: "8px",
        }}>
          Access Denied
        </div>
        <div style={{
          fontSize: "14px",
          color: currentTheme.colors.textMedium,
        }}>
          Only Super Administrators can manage roles and permissions
        </div>
      </div>
    );
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && roles.length === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        backgroundColor: currentTheme.colors.surface,
        borderRadius: "8px",
        border: `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${currentTheme.colors.grayLight}`,
          borderTop: `4px solid ${currentTheme.colors.primary}`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
      }}>
        <div>
          <h2 style={{
            fontSize: "28px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: "0 0 8px 0",
          }}>
            Roles & Permissions
          </h2>
          <p style={{
            fontSize: "16px",
            color: currentTheme.colors.textMedium,
            margin: 0,
          }}>
            Create and manage system roles with specific permissions
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: "12px 20px",
            backgroundColor: currentTheme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.primaryDark;
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <PlusIcon />
          Create Role
        </button>
      </div>

      {/* Search and Stats */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px",
      }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
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

        <div style={{
          display: "flex",
          gap: "24px",
          fontSize: "14px",
          color: currentTheme.colors.textMedium,
        }}>
          <span>{roles.length} total roles</span>
          <span>{roles.filter(r => r.is_active).length} active</span>
        </div>
      </div>

      {/* Roles Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "24px",
      }}>
        {filteredRoles.map(role => (
          <div
            key={role.id}
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.grayLight}`,
              borderRadius: "12px",
              padding: "24px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.borderColor = currentTheme.colors.inputBorderFocus;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = currentTheme.colors.grayLight;
            }}
          >
            {/* Role Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: currentTheme.colors.textDark,
                    margin: 0,
                  }}>
                    {role.name}
                  </h3>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: role.is_active ? currentTheme.colors.success : currentTheme.colors.error,
                  }} />
                </div>
                <p style={{
                  fontSize: "14px",
                  color: currentTheme.colors.textMedium,
                  margin: "0 0 12px 0",
                  lineHeight: "1.4",
                }}>
                  {role.description}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                <button
                  onClick={() => setEditingRole(role)}
                  style={{
                    padding: "6px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: currentTheme.colors.textMedium,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
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
                  <EditIcon />
                </button>

                <button
                  onClick={() => handleDeleteRole(role)}
                  style={{
                    padding: "6px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: currentTheme.colors.error,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${currentTheme.colors.error}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* Role Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              padding: "16px",
              backgroundColor: currentTheme.colors.backgroundAlt,
              borderRadius: "8px",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: currentTheme.colors.textDark,
                  marginBottom: "4px",
                }}>
                  {role.user_count}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: currentTheme.colors.textMedium,
                  fontWeight: "500",
                }}>
                  Users
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: currentTheme.colors.textDark,
                  marginBottom: "4px",
                }}>
                  {role.permission_count}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: currentTheme.colors.textMedium,
                  fontWeight: "500",
                }}>
                  Permissions
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: role.is_active ? currentTheme.colors.success : currentTheme.colors.error,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {role.is_active ? "Active" : "Inactive"}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: currentTheme.colors.textMedium,
                }}>
                  Status
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div style={{
              marginTop: "16px",
              padding: "12px 0 0 0",
              borderTop: `1px solid ${currentTheme.colors.backgroundAlt}`,
              fontSize: "12px",
              color: currentTheme.colors.textLight,
              textAlign: "center",
            }}>
              Created {new Date(role.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          backgroundColor: currentTheme.colors.surface,
          borderRadius: "8px",
          border: `1px solid ${currentTheme.colors.grayLight}`,
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            {searchTerm ? `No roles found matching "${searchTerm}"` : 'No roles created yet'}
          </div>
          <div style={{
            fontSize: "14px",
            color: currentTheme.colors.textMedium,
            marginBottom: "24px",
          }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first role to get started'}
          </div>
          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: "12px 24px",
                backgroundColor: currentTheme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <PlusIcon />
              Create First Role
            </button>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateRole}
        permissions={permissions}
      />
    </div>
  );
}

// Create Role Modal Component with Permission Selection
interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, selectedPermissions: number[]) => Promise<void>;
  permissions: Permission[];
}

function CreateRoleModal({ isOpen, onClose, onSave, permissions }: CreateRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSave(name.trim(), description.trim(), selectedPermissions);
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    onClose();
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const scope = permission.scope || 'project';
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isOpen) return null;

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
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontSize: "24px",
          fontWeight: "600",
          color: currentTheme.colors.textDark,
          margin: "0 0 24px 0",
        }}>
          Create New Role
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            Role Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Project Manager, Content Editor"
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none",
              backgroundColor: currentTheme.colors.inputBackground,
              color: currentTheme.colors.textDark,
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this role"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none",
              backgroundColor: currentTheme.colors.inputBackground,
              color: currentTheme.colors.textDark,
            }}
          />
        </div>

        {/* Permissions Section */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "16px",
          }}>
            Permissions ({selectedPermissions.length} selected)
          </label>

          <div style={{
            border: `1px solid ${currentTheme.colors.inputBorder}`,
            borderRadius: "8px",
            maxHeight: "300px",
            overflow: "auto",
          }}>
            {Object.entries(groupedPermissions).map(([scope, scopePermissions]) => (
              <div key={scope}>
                {/* Scope Header */}
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: currentTheme.colors.backgroundAlt,
                  borderBottom: `1px solid ${currentTheme.colors.inputBorder}`,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: currentTheme.colors.textDark,
                  textTransform: "capitalize",
                }}>
                  {scope} Permissions
                </div>

                {/* Permissions List */}
                {scopePermissions.map((permission, index) => (
                  <div
                    key={permission.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: index < scopePermissions.length - 1 
                        ? `1px solid ${currentTheme.colors.grayLight}` 
                        : "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => togglePermission(permission.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Toggle Switch */}
                    <div style={{
                      width: "50px",
                      height: "28px",
                      backgroundColor: selectedPermissions.includes(permission.id) 
                        ? currentTheme.colors.primary 
                        : "#E5E7EB",
                      borderRadius: "14px",
                      position: "relative",
                      marginRight: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: selectedPermissions.includes(permission.id) 
                        ? `2px solid ${currentTheme.colors.primary}` 
                        : "2px solid #D1D5DB",
                      boxShadow: selectedPermissions.includes(permission.id) 
                        ? `0 0 0 3px ${currentTheme.colors.primary}20` 
                        : "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}>
                      <div style={{
                        width: "22px",
                        height: "22px",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "1px",
                        left: selectedPermissions.includes(permission.id) ? "25px" : "1px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                      }} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: currentTheme.colors.textDark,
                        marginBottom: "2px",
                      }}>
                        {permission.name}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: currentTheme.colors.textMedium,
                      }}>
                        {permission.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}>
          <button
            type="button"
            onClick={handleClose}
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
            type="submit"
            disabled={!name.trim() || isLoading}
            style={{
              padding: "12px 24px",
              backgroundColor: isLoading || !name.trim() 
                ? currentTheme.colors.textLight 
                : currentTheme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading || !name.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isLoading ? "Creating..." : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
}