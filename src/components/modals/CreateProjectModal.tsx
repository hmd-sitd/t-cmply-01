// src/components/modals/CreateProjectModal.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import { apiService } from '../../services/api';

interface User {
  id: number;
  email: string;
  user_type: string;
}

interface ProjectMember {
  userId: number;
  email: string;
  canUploadFiles: boolean;
  permissions: string[];
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [description, setDescription] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiService.getOrganizationUsers();
      if (response.success) {
        const regularUsers = response.data.users.filter(u => u.user_type === 'user');
        setAvailableUsers(regularUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users from your organization');
    }
  };

  useEffect(() => {
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setProjectSlug(slug);
  }, [projectName]);

  const handleUserSelect = (user: User, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMembers([
        ...selectedMembers,
        {
          userId: user.id,
          email: user.email,
          canUploadFiles: false,
          permissions: []
        }
      ]);
    } else {
      setSelectedMembers(selectedMembers.filter(m => m.userId !== user.id));
    }
  };

  const handleToggleUploadPermission = (userId: number) => {
    setSelectedMembers(
      selectedMembers.map(m =>
        m.userId === userId ? { ...m, canUploadFiles: !m.canUploadFiles } : m
      )
    );
  };

  const handlePermissionChange = (userId: number, permission: string) => {
    setSelectedMembers(
      selectedMembers.map(m => {
        if (m.userId === userId) {
          const updatedPermissions = m.permissions.includes(permission)
            ? m.permissions.filter(p => p !== permission)
            : [...m.permissions, permission];
          
          // If "Upload Documents" is selected, also set canUploadFiles to true
          const canUpload = permission === 'upload_documents' 
            ? updatedPermissions.includes('upload_documents')
            : m.canUploadFiles;
            
          return { ...m, permissions: updatedPermissions, canUploadFiles: canUpload };
        }
        return m;
      })
    );
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    if (!projectSlug.trim()) {
      setError("Project slug is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const projectResponse = await apiService.createProject({
        name: projectName,
        slug: projectSlug,
        description: description || undefined,
      });

      if (!projectResponse.success) {
        throw new Error(projectResponse.message || "Failed to create project");
      }

      const projectId = projectResponse.data.project.id;

      for (const member of selectedMembers) {
        try {
          await apiService.addProjectMember({
            project_id: projectId,
            user_id: member.userId,
            can_upload_files: member.canUploadFiles,
          });
        } catch (memberError) {
          console.error(`Failed to add member ${member.email}:`, memberError);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const isUserSelected = (userId: number) => {
    return selectedMembers.some(m => m.userId === userId);
  };

  const getSelectedMember = (userId: number) => {
    return selectedMembers.find(m => m.userId === userId);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: currentTheme.colors.modalOverlay,
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
          backgroundColor: currentTheme.colors.modalBackground,
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
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
            Create New Project
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              color: currentTheme.colors.textMedium,
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#FEE",
            border: `1px solid ${currentTheme.colors.error}`,
            borderRadius: "8px",
            marginBottom: "20px",
            color: currentTheme.colors.error,
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {/* Project Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            Project Name *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Marketing Campaign 2024"
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "#FFFFFF",
              color: currentTheme.colors.textDark,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Project Slug */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            Project Slug *
          </label>
          <input
            type="text"
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
            placeholder="marketing-campaign-2024"
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "#FFFFFF",
              color: currentTheme.colors.textDark,
              boxSizing: "border-box",
            }}
          />
          <p style={{
            fontSize: "12px",
            color: currentTheme.colors.textLight,
            marginTop: "4px",
          }}>
            Auto-generated from project name. Use lowercase letters, numbers, and hyphens.
          </p>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "8px",
          }}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this project..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "#FFFFFF",
              color: currentTheme.colors.textDark,
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Members Section */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "12px",
            display: "block",
          }}>
            Project Members
          </label>

          {/* Available Users List */}
          {availableUsers.length > 0 ? (
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              overflow: "hidden",
              marginBottom: "16px",
            }}>
              {availableUsers.map((user) => {
                const isSelected = isUserSelected(user.id);
                const member = getSelectedMember(user.id);
                
                return (
                  <div
                    key={user.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {/* User Selection Checkbox */}
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      flex: 1,
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleUserSelect(user, e.target.checked)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: currentTheme.colors.primary,
                        }}
                      />
                      <span style={{
                        fontSize: "14px",
                        color: currentTheme.colors.textDark,
                        fontWeight: "500",
                      }}>
                        {user.email}
                      </span>
                    </label>

                    {/* Permissions for Selected Users */}
                    {isSelected && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Upload Documents Checkbox */}
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: currentTheme.colors.textMedium,
                        }}>
                          <input
                            type="checkbox"
                            checked={member?.canUploadFiles || false}
                            onChange={() => handleToggleUploadPermission(user.id)}
                            style={{
                              width: "14px",
                              height: "14px",
                              cursor: "pointer",
                              accentColor: currentTheme.colors.primary,
                            }}
                          />
                          Upload Documents
                        </label>

                        {/* Permissions Dropdown */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handlePermissionChange(user.id, e.target.value);
                              e.target.value = ""; // Reset selection
                            }
                          }}
                          style={{
                            padding: "4px 8px",
                            border: `1px solid ${currentTheme.colors.inputBorder}`,
                            borderRadius: "4px",
                            fontSize: "12px",
                            backgroundColor: "#FFFFFF",
                            color: currentTheme.colors.textDark,
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Add Permission...</option>
                          <option value="upload_documents">Upload Documents</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: "24px",
              textAlign: "center",
              backgroundColor: currentTheme.colors.backgroundAlt,
              borderRadius: "8px",
              fontSize: "14px",
              color: currentTheme.colors.textMedium,
            }}>
              No users available in your organization. Contact your administrator to add users.
            </div>
          )}

          {/* Selected Members Summary */}
          {selectedMembers.length > 0 && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: currentTheme.colors.backgroundAlt,
              borderRadius: "6px",
              fontSize: "13px",
              color: currentTheme.colors.textMedium,
            }}>
              <strong>{selectedMembers.length}</strong> member{selectedMembers.length !== 1 ? 's' : ''} selected
              {selectedMembers.filter(m => m.canUploadFiles).length > 0 && (
                <span> • <strong>{selectedMembers.filter(m => m.canUploadFiles).length}</strong> with upload permissions</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          paddingTop: "24px",
          borderTop: `1px solid ${currentTheme.colors.grayLight}`,
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: currentTheme.colors.textMedium,
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            disabled={isLoading || !projectName.trim() || !projectSlug.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: currentTheme.colors.buttonPrimary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading || !projectName.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !projectName.trim() ? 0.6 : 1,
            }}
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}