// UsersTab.tsx - REVERTED TO OLD STYLE + FIXED ROLE DISPLAY
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import type { User, Role } from '../../types';

interface AdminUser extends User {
  roles: Role[];
}

interface UsersTabProps {
  onError: (error: string) => void;
}

export default function UsersTab({ onError }: UsersTabProps) {
  const { theme } = useTheme();
  const {
    users,
    isLoading,
    error,
    totalCount,
    hasPermission,
    loadUsers,
    updateUserStatus,
    deleteUser,
    assignUserRole,
    removeUserRole,
    resetUserPassword,
    clearError
  } = useAdminUsers();

  const {
    roles,
    loadRoles
  } = useAdminRoles();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<AdminUser | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadUsers(currentPage * pageSize, pageSize, searchTerm, statusFilter);
    loadRoles();
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError(error);
      clearError();
    }
  }, [error, onError, clearError]);

  // Permission check
  if (!hasPermission) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        backgroundColor: theme.colors.backgroundLight,
        borderRadius: '12px',
        border: `1px solid ${theme.colors.grayLight}`,
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ 
          color: theme.colors.textDark,
          marginBottom: '8px',
          fontSize: '18px'
        }}>
          Access Denied
        </h3>
        <p style={{ color: theme.colors.textMedium }}>
          You don't have permission to manage users. Admin access required.
        </p>
      </div>
    );
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleStatusFilter = (status: boolean | undefined) => {
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    const success = await updateUserStatus(userId, !currentStatus);
    if (!success) {
      onError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    const success = await deleteUser(userId);
    if (!success) {
      onError('Failed to delete user');
    }
  };

const handleAssignRole = async (userId: number, roleId: number) => {
  console.log('UsersTab: Starting role assignment', { userId, roleId });
  
  try {
    const success = await assignUserRole(userId, roleId);
    console.log('UsersTab: Assignment result', success);
    
    if (success) {
      console.log('UsersTab: Assignment successful');
      setRoleAssignmentUser(null);
    } else {
      console.error('UsersTab: Assignment failed');
      onError('Failed to assign role');
    }
  } catch (error) {
    console.error('UsersTab: Assignment exception', error);
    onError('Failed to assign role');
  }
};

  const handleRemoveRole = async (userId: number, roleId: number) => {
    const success = await removeUserRole(userId, roleId);
    if (!success) {
      onError('Failed to remove role');
    }
  };

  const handleResetPassword = async (userId: number, userEmail: string) => {
    if (!confirm(`Reset password for user "${userEmail}"? A new password will be generated.`)) {
      return;
    }

    const resetToken = await resetUserPassword(userId);
    if (resetToken) {
      alert(`Password reset successful. Reset token: ${resetToken}`);
    } else {
      onError('Failed to reset password');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // FIXED: Enhanced role display that includes user_type
  const getRoleDisplay = (user: AdminUser) => {
    const displayRoles = [];
    
    // Add implicit roles based on user_type
    if (user.user_type === 'super_admin') {
      displayRoles.push({
        id: 'system-super-admin',
        name: 'Super Administrator',
        is_active: true,
        isSystemRole: true
      });
    } else if (user.user_type === 'admin') {
      displayRoles.push({
        id: 'system-org-admin', 
        name: 'Organization Administrator',
        is_active: true,
        isSystemRole: true
      });
    }
    
    // Add explicitly assigned roles
    const assignedRoles = (user.roles || []).filter(role => role.is_active);
    displayRoles.push(...assignedRoles);
    
    if (displayRoles.length === 0) {
      return <span style={{ color: theme.colors.textLight }}>No roles</span>;
    }

    return displayRoles.map((role, index) => (
      <span
        key={role.id || `role-${index}`}
        style={{
          backgroundColor: theme.colors.primary,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          marginRight: '4px',
          display: 'inline-block'
        }}
      >
        {role.name}
      </span>
    ));
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ 
            color: theme.colors.textDark,
            margin: 0,
            fontSize: '24px',
            fontWeight: '600'
          }}>
            User Management
          </h2>
          <p style={{ 
            color: theme.colors.textMedium,
            margin: '4px 0 0 0',
            fontSize: '14px'
          }}>
            Manage user accounts, roles, and permissions ({totalCount} total users)
          </p>
        </div>

        <button
          onClick={() => loadUsers(currentPage * pageSize, pageSize, searchTerm, statusFilter)}
          disabled={isLoading}
          style={{
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: `1px solid ${theme.colors.grayLight}`,
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: theme.colors.backgroundLight
          }}
        />

        <select
          value={statusFilter === undefined ? 'all' : statusFilter.toString()}
          onChange={(e) => {
            const value = e.target.value;
            handleStatusFilter(value === 'all' ? undefined : value === 'true');
          }}
          style={{
            padding: '12px 16px',
            border: `1px solid ${theme.colors.grayLight}`,
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: theme.colors.backgroundLight,
            minWidth: '120px'
          }}
        >
          <option value="all">All Users</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: `1px solid ${theme.colors.grayLight}`,
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: theme.colors.textMedium
          }}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: theme.colors.textMedium
          }}>
            {searchTerm || statusFilter !== undefined ? 'No users match your search criteria.' : 'No users found.'}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px 100px 140px 120px',
              gap: '16px',
              padding: '16px',
              backgroundColor: theme.colors.backgroundLight,
              borderBottom: `1px solid ${theme.colors.grayLight}`,
              fontSize: '12px',
              fontWeight: '600',
              color: theme.colors.textMedium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div>User</div>
              <div>Roles</div>
              <div>Status</div>
              <div>Joined</div>
              <div>Last Updated</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 120px 100px 140px 120px',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: `1px solid ${theme.colors.grayLight}`,
                  alignItems: 'center'
                }}
              >
                {/* User Info */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        color: theme.colors.textDark,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {user.email}
                      </div>
                      <div style={{
                        color: theme.colors.textLight,
                        fontSize: '12px'
                      }}>
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roles */}
                <div>
                  {getRoleDisplay(user as AdminUser)}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: user.is_active 
                      ? `${theme.colors.success}20` 
                      : `${theme.colors.error}20`,
                    color: user.is_active 
                      ? theme.colors.success 
                      : theme.colors.error
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Joined Date */}
                <div style={{
                  color: theme.colors.textMedium,
                  fontSize: '13px'
                }}>
                  {formatDate(user.created_at)}
                </div>

                {/* Last Updated */}
                <div style={{
                  color: theme.colors.textMedium,
                  fontSize: '13px'
                }}>
                  {formatDate(user.updated_at)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setRoleAssignmentUser(user as AdminUser)}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.grayLight}`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: theme.colors.textMedium
                    }}
                    title="Manage Roles"
                  >
                    Roles
                  </button>
                  
                  <button
                    onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${user.is_active ? theme.colors.error : theme.colors.success}`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: user.is_active ? theme.colors.error : theme.colors.success
                    }}
                    title={user.is_active ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '24px'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || isLoading}
            style={{
              backgroundColor: 'white',
              border: `1px solid ${theme.colors.grayLight}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: (currentPage === 0 || isLoading) ? 'not-allowed' : 'pointer',
              opacity: (currentPage === 0 || isLoading) ? 0.5 : 1
            }}
          >
            Previous
          </button>
          
          <span style={{
            color: theme.colors.textMedium,
            fontSize: '14px'
          }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1 || isLoading}
            style={{
              backgroundColor: 'white',
              border: `1px solid ${theme.colors.grayLight}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: (currentPage === totalPages - 1 || isLoading) ? 'not-allowed' : 'pointer',
              opacity: (currentPage === totalPages - 1 || isLoading) ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleAssignmentUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: theme.colors.textDark,
                margin: 0,
                fontSize: '18px'
              }}>
                Manage Roles for {roleAssignmentUser.email}
              </h3>
              <button
                onClick={() => setRoleAssignmentUser(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: theme.colors.textMedium,
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Current Roles */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: theme.colors.textDark,
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Current Roles:
              </h4>
              {roleAssignmentUser.roles.length === 0 ? (
                <p style={{
                  color: theme.colors.textMedium,
                  fontSize: '14px',
                  margin: 0
                }}>
                  No roles assigned
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {roleAssignmentUser.roles.map(role => (
                    <div
                      key={role.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: theme.colors.backgroundLight,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${theme.colors.grayLight}`
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        color: theme.colors.textDark
                      }}>
                        {role.name}
                      </span>
                      <button
                        onClick={() => handleRemoveRole(roleAssignmentUser.id, role.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: theme.colors.error,
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title="Remove role"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Roles */}
            <div>
              <h4 style={{
                color: theme.colors.textDark,
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Available Roles:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roles
                  .filter(role => role.is_active && !roleAssignmentUser.roles.find(ur => ur.id === role.id))
                  .map(role => (
                    <div
                      key={role.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: `1px solid ${theme.colors.grayLight}`,
                        borderRadius: '8px',
                        backgroundColor: theme.colors.backgroundLight
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: theme.colors.textDark
                        }}>
                          {role.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.textMedium
                        }}>
                          {role.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignRole(roleAssignmentUser.id, role.id)}
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  ))
                }
                {roles.filter(role => role.is_active && !roleAssignmentUser.roles.find(ur => ur.id === role.id)).length === 0 && (
                  <p style={{
                    color: theme.colors.textMedium,
                    fontSize: '14px',
                    margin: 0,
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    No additional roles available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}