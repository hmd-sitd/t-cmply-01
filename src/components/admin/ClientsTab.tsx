// src/components/admin/ClientsTab.tsx - FIXED VERSION
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAdminClients } from '../../hooks/useAdminClients';
import { apiService } from '../../services/api';

interface ClientsTabProps {
  onError: (error: string) => void;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export default function ClientsTab({ onError }: ClientsTabProps) {
  const { theme } = useTheme();
  const {
    clients,
    isLoading,
    error,
    totalCount,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  } = useAdminClients();

  // State for unassigned users (potential admins)
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Success/Error notification state
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    admin_user_id: '',
    contact_email: '',
    user_limit: 10,
    project_limit: 5,
    storage_limit_gb: 5,
  });

  // Function to show notifications
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Load data
  useEffect(() => {
    loadClients(currentPage * pageSize, pageSize, searchTerm, statusFilter);
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    if (error) {
      showNotification('error', error);
      clearError();
    }
  }, [error, clearError]);

  // Load unassigned users for admin dropdown
  const loadUnassignedUsers = async () => {
    setLoadingUnassigned(true);
    try {
      const response = await apiService.getUnassignedUsers();
      if (response.success) {
        setUnassignedUsers(response.data.users);
        console.log('Loaded unassigned users:', response.data.users);
      } else {
        console.warn('Failed to load unassigned users:', response.message);
        setUnassignedUsers([]);
      }
    } catch (error: any) {
      console.error('Error loading unassigned users:', error);
      setUnassignedUsers([]);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  // Load unassigned users when modal opens
  useEffect(() => {
    if (showCreateModal || editingClient) {
      loadUnassignedUsers();
    }
  }, [showCreateModal, editingClient]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const handleCreateClient = async () => {
    // Validation
    if (!formData.name || !formData.slug) {
      showNotification('error', 'Organization name and slug are required');
      return;
    }

    try {
      // Parse admin user ID if selected
      const adminUserId = formData.admin_user_id ? parseInt(formData.admin_user_id) : undefined;

      // Use the enhanced function that creates both organization and MinIO bucket
      const response = await apiService.createOrganizationWithStorage({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        admin_user_id: adminUserId,
        contact_email: formData.contact_email,
        user_limit: formData.user_limit,
        project_limit: formData.project_limit,
        storage_limit_gb: formData.storage_limit_gb,
      });

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        loadClients(currentPage * pageSize, pageSize, searchTerm, statusFilter);
        loadUnassignedUsers();
        showNotification('success', `${response.message} Storage bucket created.`);
      } else {
        showNotification('error', response.message || 'Failed to create organization');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create organization');
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    const success = await updateClient(editingClient.id, formData);
    if (success) {
      setEditingClient(null);
      resetForm();
      loadClients(currentPage * pageSize, pageSize, searchTerm, statusFilter);
      showNotification('success', 'Organization updated successfully!');
    }
  };

  const handleDeleteClient = async (client: any) => {
    if (!confirm(`Are you sure you want to delete "${client.name}"? This will delete all associated data.`)) {
      return;
    }

    const success = await deleteClient(client.id);
    if (success) {
      loadClients(currentPage * pageSize, pageSize, searchTerm, statusFilter);
      showNotification('success', `Organization "${client.name}" deleted successfully!`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      admin_user_id: '',
      contact_email: '',
      user_limit: 10,
      project_limit: 5,
      storage_limit_gb: 5,
    });
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      slug: client.slug,
      description: client.description || '',
      admin_user_id: client.admin_user_id?.toString() || '',
      contact_email: client.contact_email || '',
      user_limit: client.user_limit,
      project_limit: client.project_limit,
      storage_limit_gb: client.storage_limit_gb,
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Success/Error Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? theme.colors.success : theme.colors.error,
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 9999,
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
          {notification.message}
          <button
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: theme.colors.textDark,
            marginBottom: '4px',
          }}>
            Organizations
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme.colors.textMedium,
          }}>
            Manage organizations and assign unassigned users as organization admins.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          + Create Organization
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            border: `1px solid ${theme.colors.grayLight}`,
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <select
          value={statusFilter === undefined ? 'all' : statusFilter ? 'active' : 'inactive'}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value === 'all' ? undefined : value === 'active');
          }}
          style={{
            padding: '10px 16px',
            border: `1px solid ${theme.colors.grayLight}`,
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              backgroundColor: theme.colors.backgroundAlt,
              borderBottom: `1px solid ${theme.colors.grayLight}`,
            }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }}>
                Organization
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }}>
                Admin / Contact
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }}>
                Limits
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: theme.colors.textMedium }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMedium }}>
                  Loading organizations...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMedium }}>
                  No organizations found
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: `1px solid ${theme.colors.grayLight}` }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: theme.colors.textDark, marginBottom: '2px' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.colors.textMedium }}>
                      {client.slug}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {client.admin_email || client.contact_email ? (
                      <div>
                        {client.admin_email && (
                          <div style={{ fontSize: '14px', color: theme.colors.textDark, fontWeight: '500' }}>
                            Admin: {client.admin_email}
                          </div>
                        )}
                        {client.contact_email && client.contact_email !== client.admin_email && (
                          <div style={{ fontSize: '12px', color: theme.colors.textMedium }}>
                            Contact: {client.contact_email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '14px', color: theme.colors.textLight }}>No admin assigned</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: theme.colors.textMedium }}>
                    {client.user_limit} users / {client.project_limit} projects / {client.storage_limit_gb}GB
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: client.is_active ? '#10b98120' : '#ef444420',
                      color: client.is_active ? '#059669' : '#dc2626',
                    }}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(client)}
                      style={{
                        padding: '6px 12px',
                        marginRight: '8px',
                        backgroundColor: 'transparent',
                        color: theme.colors.primary,
                        border: `1px solid ${theme.colors.primary}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: theme.colors.error,
                        border: `1px solid ${theme.colors.error}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        fontSize: '14px',
        color: theme.colors.textMedium,
      }}>
        <div>
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} organizations
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: `1px solid ${theme.colors.grayLight}`,
              borderRadius: '6px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={(currentPage + 1) * pageSize >= totalCount}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: `1px solid ${theme.colors.grayLight}`,
              borderRadius: '6px',
              cursor: (currentPage + 1) * pageSize >= totalCount ? 'not-allowed' : 'pointer',
              opacity: (currentPage + 1) * pageSize >= totalCount ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingClient) && (
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
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: theme.colors.modalBackground,
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '650px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '8px',
              color: theme.colors.textDark,
            }}>
              {editingClient ? 'Edit Organization' : 'Create New Organization'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.textMedium,
              marginBottom: '24px',
            }}>
              {editingClient ? 
                'Update organization details' : 
                'Create organization and optionally assign an unassigned user as admin.'
              }
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.textDark,
                }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ACME Corporation"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: theme.colors.textDark,
                    backgroundColor: theme.colors.inputBackground,
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.textDark,
                }}>
                  Slug (URL-friendly identifier) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="acme-corporation"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: theme.colors.textDark,
                    backgroundColor: theme.colors.inputBackground,
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.textDark,
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Organization description..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    color: theme.colors.textDark,
                    backgroundColor: theme.colors.inputBackground,
                  }}
                />
              </div>

              {/* Admin Assignment - Only show for create, not edit */}
              {!editingClient && (
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.textDark,
                  }}>
                    Assign Admin User (Optional)
                  </label>
                  <select
                    value={formData.admin_user_id}
                    onChange={(e) => setFormData({ ...formData, admin_user_id: e.target.value })}
                    disabled={loadingUnassigned}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: theme.colors.textDark,
                      backgroundColor: theme.colors.inputBackground,
                      cursor: loadingUnassigned ? 'wait' : 'pointer',
                    }}
                  >
                    <option value="">No admin assigned</option>
                    {unassignedUsers.map(user => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.email} ({user.user_type})
                      </option>
                    ))}
                  </select>
                  {loadingUnassigned && (
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.textMedium,
                      marginTop: '4px',
                    }}>
                      Loading unassigned users...
                    </p>
                  )}
                  <p style={{
                    fontSize: '12px',
                    color: theme.colors.textMedium,
                    marginTop: '4px',
                  }}>
                    Only users without organization assignment are shown. Selected user will be assigned as admin.
                  </p>
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.textDark,
                }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@acme.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: theme.colors.textDark,
                    backgroundColor: theme.colors.inputBackground,
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: theme.colors.textMedium,
                  marginTop: '4px',
                }}>
                  This will be used as the main contact email for the organization.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.textDark,
                  }}>
                    User Limit
                  </label>
                  <input
                    type="number"
                    value={formData.user_limit}
                    onChange={(e) => setFormData({ ...formData, user_limit: parseInt(e.target.value) || 10 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: theme.colors.textDark,
                      backgroundColor: theme.colors.inputBackground,
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.textDark,
                  }}>
                    Project Limit
                  </label>
                  <input
                    type="number"
                    value={formData.project_limit}
                    onChange={(e) => setFormData({ ...formData, project_limit: parseInt(e.target.value) || 5 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: theme.colors.textDark,
                      backgroundColor: theme.colors.inputBackground,
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.textDark,
                  }}>
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.storage_limit_gb}
                    onChange={(e) => setFormData({ ...formData, storage_limit_gb: parseInt(e.target.value) || 5 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: theme.colors.textDark,
                      backgroundColor: theme.colors.inputBackground,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingClient(null);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'white',
                    color: theme.colors.textDark,
                    border: `1px solid ${theme.colors.grayLight}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={editingClient ? handleUpdateClient : handleCreateClient}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}