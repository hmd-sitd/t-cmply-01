"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface UnassignedUser {
  id: number;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface UserAssignmentTabProps {
  onError: (message: string) => void;
}

export default function UserAssignmentTab({ onError }: UserAssignmentTabProps) {
  const { theme } = useTheme();
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, orgsResponse] = await Promise.all([
        apiService.getUnassignedUsers(),
        apiService.getAllClients()
      ]);

      if (usersResponse.success) {
        setUnassignedUsers(usersResponse.data.users);
      }

      if (orgsResponse.success) {
        setOrganizations(orgsResponse.data.clients.filter(org => org.is_active));
      }
    } catch (error: any) {
      onError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUser = async (userId: number) => {
    const selectedOrgId = selectedAssignments[userId];
    if (!selectedOrgId) {
      onError('Please select an organization');
      return;
    }

    setAssigningUserId(userId);
    try {
      const response = await apiService.assignUserToOrganization({
        user_id: userId,
        client_id: selectedOrgId,
      });

      if (response.success) {
        // Remove user from unassigned list
        setUnassignedUsers(prev => prev.filter(user => user.id !== userId));
        setSelectedAssignments(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error: any) {
      onError(error.message || 'Failed to assign user');
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleAssignmentChange = (userId: number, organizationId: string) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [userId]: organizationId
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: theme.colors.textMedium,
      }}>
        Loading unassigned users...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <h2 style={{
          fontSize: "24px",
          fontWeight: "600",
          color: theme.colors.textDark,
          margin: 0,
        }}>
          User Assignment
        </h2>
        <button
          onClick={loadData}
          disabled={isLoading}
          style={{
            padding: "8px 16px",
            backgroundColor: theme.colors.buttonSecondary,
            color: theme.colors.textDark,
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: "6px",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {unassignedUsers.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "48px 24px",
          backgroundColor: theme.colors.backgroundAlt,
          borderRadius: "8px",
          color: theme.colors.textMedium,
        }}>
          <div style={{ fontSize: "18px", marginBottom: "8px" }}>
            No unassigned users found
          </div>
          <div style={{ fontSize: "14px" }}>
            All users are assigned to organizations
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: `1px solid ${theme.colors.inputBorder}`,
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 200px 180px 120px",
            gap: "16px",
            padding: "16px 24px",
            backgroundColor: theme.colors.backgroundAlt,
            borderBottom: `1px solid ${theme.colors.inputBorder}`,
            fontSize: "14px",
            fontWeight: "600",
            color: theme.colors.textDark,
          }}>
            <div>Email</div>
            <div>User Type</div>
            <div>Assign to Organization</div>
            <div>Created</div>
            <div>Action</div>
          </div>

          {unassignedUsers.map((user) => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 200px 180px 120px",
                gap: "16px",
                padding: "16px 24px",
                borderBottom: `1px solid ${theme.colors.grayLight}`,
                alignItems: "center",
              }}
            >
              <div style={{
                fontSize: "14px",
                color: theme.colors.textDark,
                fontWeight: "500",
              }}>
                {user.email}
              </div>

              <div>
                <span style={{
                  padding: "4px 8px",
                  backgroundColor: user.user_type === 'admin' ? 
                    "#fef3c7" : 
                    "#d1fae5",
                  color: user.user_type === 'admin' ? 
                    "#f59e0b" : 
                    theme.colors.success,
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500",
                  textTransform: "capitalize",
                }}>
                  {user.user_type}
                </span>
              </div>

              <div>
                <select
                  value={selectedAssignments[user.id] || ''}
                  onChange={(e) => handleAssignmentChange(user.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${theme.colors.inputBorder}`,
                    borderRadius: "4px",
                    fontSize: "13px",
                    backgroundColor: "#FFFFFF",
                    color: theme.colors.textDark,
                  }}
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                fontSize: "13px",
                color: theme.colors.textMedium,
              }}>
                {formatDate(user.created_at)}
              </div>

              <div>
                <button
                  onClick={() => handleAssignUser(user.id)}
                  disabled={
                    !selectedAssignments[user.id] || 
                    assigningUserId === user.id
                  }
                  style={{
                    padding: "6px 12px",
                    backgroundColor: theme.colors.buttonPrimary,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: 
                      (!selectedAssignments[user.id] || assigningUserId === user.id) ? 
                      "not-allowed" : "pointer",
                    opacity: 
                      (!selectedAssignments[user.id] || assigningUserId === user.id) ? 
                      0.6 : 1,
                  }}
                >
                  {assigningUserId === user.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: "16px",
        padding: "12px 16px",
        backgroundColor: "#dbeafe",
        borderRadius: "6px",
        fontSize: "13px",
        color: theme.colors.info,
      }}>
        <strong>Note:</strong> Users without organization assignment cannot access projects or be added as project members. 
        Assign them to organizations to enable project participation.
      </div>
    </div>
  );
}