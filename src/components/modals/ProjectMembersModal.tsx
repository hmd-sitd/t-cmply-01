// src/components/modals/ProjectMembersModal.tsx - UPDATED WITH RBAC
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface User {
  id: number;
  email: string;
  user_type: string;
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  scope?: string;
}

interface ProjectMember {
  id: number;
  user_id: number;
  project_id: string;
  role_id: number | null;
  can_upload_files: boolean;
  can_delete_files: boolean;
  can_edit_project: boolean;
  is_active: boolean;
  joined_at: string;
  user: User;
  role: Role | null;
  user_name: string;
  role_name: string;
}

interface ProjectMembersModalProps {
  project: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onMembersUpdated?: () => void;
}

export default function ProjectMembersModal({ project, onClose, onMembersUpdated }: ProjectMembersModalProps) {
  const { theme } = useTheme();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canAssignRoles, setCanAssignRoles] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadMembers();
    checkPermissions();
  }, [project.id]);

  useEffect(() => {
    if (showAddMembersModal) {
      loadAvailableUsers();
    }
  }, [showAddMembersModal]);

  const checkPermissions = async () => {
    try {
      // Check if current user can assign roles
      const canAssign = await apiService.checkUserPermission('role:assign');
      setCanAssignRoles(canAssign);
      
      // Get user's permissions for reference
      const permissions = await apiService.getCurrentUserPermissions();
      setUserPermissions(permissions);
      
      // Load assignable roles if user can assign them
      if (canAssign) {
        loadAssignableRoles();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanAssignRoles(false);
    }
  };

  const loadAssignableRoles = async () => {
    try {
      const response = await apiService.getAssignableRoles();
      if (response.success) {
        setAssignableRoles(response.data.roles);
      }
    } catch (error: any) {
      console.error('Error loading assignable roles:', error);
      setAssignableRoles([]);
    }
  };

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getProjectMembers(project.id);
      if (response.success) {
        setMembers(response.data.members);
      }
    } catch (error: any) {
      console.error('Error loading members:', error);
      setError('Failed to load project members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await apiService.getAvailableUsersForProject(project.id);
      if (response.success) {
        setAvailableUsers(response.data.users);
      }
    } catch (error: any) {
      console.error('Error loading available users:', error);
      setError('Failed to load available users');
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsAddingMembers(true);
      setError(null);

      // Get default role (Project Member) if available
      const defaultRole = assignableRoles.find(role => role.name === 'Project Member');

      await apiService.addProjectMemberBatch({
        project_id: project.id,
        user_ids: selectedUsers,
        role_id: defaultRole?.id,
        can_upload_files: false,
        can_delete_files: false,
        can_edit_project: false
      });

      setSelectedUsers([]);
      setShowAddMembersModal(false);
      await loadMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error('Error adding members:', error);
      setError(error.message || 'Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: number, userId: number) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      setError(null);
      await apiService.removeProjectMember(project.id, userId);
      await loadMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error('Error removing member:', error);
      setError(error.message || 'Failed to remove member');
    }
  };

  const handleUpdateMemberPermissions = async (member: ProjectMember, updates: any) => {
    try {
      setError(null);
      await apiService.updateProjectMemberPermissions(project.id, member.user_id, updates);
      await loadMembers();
      setEditingMember(null);
      onMembersUpdated?.();
    } catch (error: any) {
      console.error('Error updating member permissions:', error);
      setError(error.message || 'Failed to update member permissions');
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatUserName = (email: string) => {
    return email.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || email;
  };

  return (
    <>
      {/* Main Members Modal */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.modalOverlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: theme.colors.modalBackground,
          borderRadius: '12px',
          padding: '32px',
          width: '700px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: theme.colors.textDark,
                margin: '0 0 4px 0'
              }}>
                {project.name} Members
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.colors.textMedium,
                margin: 0
              }}>
                Manage project members and their permissions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddMembersModal(true)}
                style={{
                  backgroundColor: theme.colors.buttonPrimary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add Members
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.textMedium,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Permission Notice */}
          {!canAssignRoles && (
            <div style={{
              backgroundColor: theme.colors.infoLight,
              border: `1px solid ${theme.colors.info}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: theme.colors.info,
              fontSize: '14px'
            }}>
              <strong>Note:</strong> You can manage project permissions but cannot assign roles. Contact an administrator for role assignment capabilities.
            </div>
          )}

          {/* Members List */}
          <div style={{
            flex: 1,
            overflow: 'auto'
          }}>
            {isLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.colors.textMedium
              }}>
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.colors.textMedium
              }}>
                <p>No members found in this project.</p>
                <button
                  onClick={() => setShowAddMembersModal(true)}
                  style={{
                    backgroundColor: theme.colors.buttonPrimary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '16px'
                  }}
                >
                  Add First Member
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '16px',
                      backgroundColor: theme.colors.backgroundAlt,
                      borderRadius: '8px',
                      border: `1px solid ${theme.colors.inputBorder}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: theme.colors.buttonPrimary,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {member.user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '500',
                              color: theme.colors.textDark
                            }}>
                              {formatUserName(member.user.email)}
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: theme.colors.textMedium
                            }}>
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                        
                        {/* Role and Permissions */}
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            backgroundColor: theme.colors.buttonSecondary,
                            color: theme.colors.textDark,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {member.role_name}
                          </span>
                          
                          {member.can_upload_files && (
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              Can Upload
                            </span>
                          )}
                          
                          {member.can_delete_files && (
                            <span style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              Can Delete
                            </span>
                          )}
                          
                          {member.can_edit_project && (
                            <span style={{
                              backgroundColor: '#dbeafe',
                              color: '#1d4ed8',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              Can Edit Project
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingMember(member)}
                          style={{
                            backgroundColor: 'transparent',
                            color: theme.colors.buttonPrimary,
                            border: `1px solid ${theme.colors.buttonPrimary}`,
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#dc2626',
                            border: '1px solid #dc2626',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.colors.inputBorder}`,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.buttonSecondary,
                color: theme.colors.textDark,
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.modalOverlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: theme.colors.modalBackground,
            borderRadius: '12px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.textDark,
                margin: 0
              }}>
                Add Members to Project
              </h3>
              <button
                onClick={() => setShowAddMembersModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.textMedium,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              marginBottom: '16px'
            }}>
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textDark
                }}
              />
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {filteredUsers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: theme.colors.textMedium
                }}>
                  {availableUsers.length === 0 ? 
                    'No available users to add' : 
                    'No users match your search'
                  }
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: selectedUsers.includes(user.id) 
                          ? theme.colors.backgroundAlt 
                          : 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedUsers.includes(user.id) 
                          ? `1px solid ${theme.colors.buttonPrimary}` 
                          : '1px solid transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: theme.colors.buttonPrimary
                        }}
                      />
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: theme.colors.buttonPrimary,
                        borderRadius: '50%',
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
                          fontSize: '14px',
                          fontWeight: '500',
                          color: theme.colors.textDark
                        }}>
                          {formatUserName(user.email)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.textMedium
                        }}>
                          {user.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddMembersModal(false)}
                disabled={isAddingMembers}
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.textMedium,
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isAddingMembers ? 'not-allowed' : 'pointer',
                  opacity: isAddingMembers ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0 || isAddingMembers}
                style={{
                  backgroundColor: theme.colors.buttonPrimary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedUsers.length === 0 || isAddingMembers ? 'not-allowed' : 'pointer',
                  opacity: selectedUsers.length === 0 || isAddingMembers ? 0.6 : 1
                }}
              >
                {isAddingMembers ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Permissions Modal */}
      {editingMember && (
        <EditMemberPermissionsModal
          member={editingMember}
          assignableRoles={assignableRoles}
          canAssignRoles={canAssignRoles}
          onClose={() => setEditingMember(null)}
          onSave={(updates) => handleUpdateMemberPermissions(editingMember, updates)}
        />
      )}
    </>
  );
}

// Enhanced Edit Member Permissions Modal Component
interface EditMemberPermissionsModalProps {
  member: ProjectMember;
  assignableRoles: Role[];
  canAssignRoles: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
}

function EditMemberPermissionsModal({ 
  member, 
  assignableRoles, 
  canAssignRoles, 
  onClose, 
  onSave 
}: EditMemberPermissionsModalProps) {
  const { theme } = useTheme();
  const [roleId, setRoleId] = useState(member.role_id);
  const [canUploadFiles, setCanUploadFiles] = useState(member.can_upload_files);
  const [canDeleteFiles, setCanDeleteFiles] = useState(member.can_delete_files);
  const [canEditProject, setCanEditProject] = useState(member.can_edit_project);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        can_upload_files: canUploadFiles,
        can_delete_files: canDeleteFiles,
        can_edit_project: canEditProject
      };

      // Only include role_id if user can assign roles
      if (canAssignRoles) {
        updates.role_id = roleId;
      }

      await onSave(updates);
    } finally {
      setIsSaving(false);
    }
  };

  const formatUserName = (email: string) => {
    return email.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || email;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.modalOverlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200
    }}>
      <div style={{
        backgroundColor: theme.colors.modalBackground,
        borderRadius: '12px',
        padding: '32px',
        width: '420px',
        maxWidth: '90vw'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.textDark,
              margin: '0 0 4px 0'
            }}>
              Edit Member Permissions
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.textMedium,
              margin: 0
            }}>
              {formatUserName(member.user.email)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.textMedium,
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Role Selection - Only show if user can assign roles */}
          {canAssignRoles ? (
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textDark,
                marginBottom: '8px'
              }}>
                Role {assignableRoles.length > 0 && `(${assignableRoles.length} available)`}
              </label>
              <select
                value={roleId || ''}
                onChange={(e) => setRoleId(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textDark
                }}
              >
                <option value="">No specific role</option>
                {assignableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.scope && `(${role.scope})`}
                  </option>
                ))}
              </select>
              {assignableRoles.length === 0 && (
                <p style={{
                  fontSize: '12px',
                  color: theme.colors.textMedium,
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  No assignable roles available for your permission level.
                </p>
              )}
            </div>
          ) : (
            <div style={{
              padding: '12px',
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: '6px',
              border: `1px solid ${theme.colors.inputBorder}`
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textMedium,
                marginBottom: '4px'
              }}>
                Current Role: {member.role_name}
              </div>
              <p style={{
                fontSize: '12px',
                color: theme.colors.textMedium,
                margin: 0
              }}>
                You do not have permission to assign or modify roles. Contact your administrator for role assignment capabilities.
              </p>
            </div>
          )}

          {/* Project-Level Permissions */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.colors.textDark,
              marginBottom: '12px'
            }}>
              Project Permissions
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={canUploadFiles}
                  onChange={(e) => setCanUploadFiles(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: theme.colors.buttonPrimary
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color: theme.colors.textDark
                }}>
                  Upload Documents
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={canDeleteFiles}
                  onChange={(e) => setCanDeleteFiles(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: theme.colors.buttonPrimary
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color: theme.colors.textDark
                }}>
                  Delete Documents
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={canEditProject}
                  onChange={(e) => setCanEditProject(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: theme.colors.buttonPrimary
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color: theme.colors.textDark
                }}>
                  Edit project info
                </span>
              </label>
            </div>
          </div>

          {/* Permission Info */}
          <div style={{
            padding: '12px',
            backgroundColor: theme.colors.infoLight,
            borderRadius: '6px',
            fontSize: '12px',
            color: theme.colors.info,
          }}>
            <strong>Note:</strong> Project permissions are granular settings that work alongside role-based permissions. 
            {canAssignRoles ? 
              ' Role assignments require specific permissions in the system.' : 
              ' Role changes require additional permissions.'
            }
          </div>
        </div>

        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.textMedium,
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: theme.colors.buttonPrimary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}