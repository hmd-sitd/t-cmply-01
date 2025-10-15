// src/components/tabs/ProjectsTab.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import ProjectMembersModal from '../modals/ProjectMembersModal';
import FileUploadWithProcessing from '../FileUploadWithProcessing';
import { useNotification } from '../Notification';

interface ProjectsTabProps {
  onError: (error: string) => void;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
  description?: string;
  fileCount: number;
  memberCount: number;
  created_at: string;
  updated_at: string;
  owner_id: number;
  client?: {
    id: string;
    name: string;
    organization_name: string;
  };
}

interface ProjectFile {
  id: string;
  name: string;
  file_name: string;
  type: string;
  size: number;
  upload_date: string;
  uploaded_by: string;
  uploader_name?: string;
}

interface ProjectMember {
  id: string;
  user_id: number;
  project_id: string;
  role_id?: number;
  can_upload_files: boolean;
  added_at: string;
  user: {
    id: number;
    email: string;
    user_type: string;
  };
  role?: {
    id: number;
    name: string;
  };
  user_name?: string;
}

interface Client {
  id: string;
  name: string;
  organization_name: string;
}

export default function ProjectsTab({ onError }: ProjectsTabProps) {
  const { theme } = useTheme();
  const { showNotification, NotificationContainer } = useNotification();
  
  // Main states
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<string>('');
  const [userClientId, setUserClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  // Create project form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, selectedClient]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const userInfo = await apiService.getCurrentUserType();
      setUserType(userInfo?.user_type || '');
      setUserClientId(userInfo?.client_id || '');

      // Load projects
      const projectsResponse = await apiService.getProjectsWithDetails();
      if (projectsResponse.success) {
        setProjects(projectsResponse.data.projects);
      }

      // Load clients for super admin
      if (userInfo?.user_type === 'super_admin') {
        const clientsResponse = await apiService.getAllClients();
        if (clientsResponse.success) {
          setClients(clientsResponse.data.clients);
        }
      }
    } catch (error) {
      onError('Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedClient) {
      filtered = filtered.filter(project => project.client_id === selectedClient);
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showNotification('error', 'Project name is required');
      return;
    }

    const clientId = userType === 'super_admin' 
      ? (newProjectClientId || clients[0]?.id) 
      : userClientId;

    if (!clientId) {
      showNotification('error', 'Organization is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiService.createProjectWithStorage({
        name: newProjectName,
        client_id: clientId,
        description: newProjectDescription,
      });

      if (response.success) {
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectClientId('');
        await loadInitialData();
        showNotification('success', 'Project created with storage folder');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiService.deleteProject(projectId);
      if (response.success) {
        await loadInitialData();
        showNotification('success', 'Project deleted successfully');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to delete project');
    }
  };

  const loadProjectFiles = async (projectId: string) => {
    try {
      setFilesLoading(true);
      const response = await apiService.getProjectFiles(projectId);
      if (response.success) {
        const mappedFiles = response.data.files.map(file => ({
          id: file.id,
          name: file.file_name || file.name,
          file_name: file.file_name || file.name,
          type: file.type,
          size: file.size || file.file_size || 0,
          upload_date: file.upload_date || new Date(file.created_at).toISOString().split('T')[0],
          uploaded_by: file.uploaded_by || file.uploader?.email || '',
          uploader_name: file.uploader_name || file.uploader?.email?.split('@')[0] || 'Unknown',
        }));
        setProjectFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setFilesLoading(false);
    }
  };

  const loadProjectMembers = async (projectId: string) => {
    try {
      setMembersLoading(true);
      const response = await apiService.getProjectMembers(projectId);
      if (response.success) {
        const mappedMembers = response.data.members.map(member => ({
          ...member,
          user_name: member.user?.email || 'Unknown',
        }));
        setProjectMembers(mappedMembers);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleViewFiles = async (project: Project) => {
    setSelectedProject(project);
    setShowFilesModal(true);
    await loadProjectFiles(project.id);
  };

  const handleViewMembers = async (project: Project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    await loadProjectMembers(project.id);
  };

  const handleUploadClick = (project: Project) => {
    setSelectedProjectForUpload(project);
    setShowUploadModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

  const ProjectCard = ({ project }: { project: Project }) => (
    <div style={{
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.inputBorder}`,
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      transition: 'box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.textDark,
          margin: 0,
          maxWidth: '60%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {project.name}
        </h3>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Upload Button */}
          <button
            onClick={() => handleUploadClick(project)}
            title="Upload files"
            style={{
              padding: '6px 12px',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            📤 Upload
          </button>
          
          {/* Files Button */}
          <button
            onClick={() => handleViewFiles(project)}
            title="View files"
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            📁 Files ({project.fileCount || 0})
          </button>
          
          {/* Members Button */}
          <button
            onClick={() => handleViewMembers(project)}
            title="View members"
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: theme.colors.textMedium,
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.textMedium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.inputBorder;
            }}
          >
            👥 Members ({project.memberCount || 0})
          </button>

          {/* Delete Button (for admins) */}
          {(userType === 'super_admin' || userType === 'admin') && (
            <button
              onClick={() => handleDeleteProject(project.id, project.name)}
              title="Delete project"
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: theme.colors.error,
                border: `1px solid ${theme.colors.error}`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Project Description */}
      {project.description && (
        <p style={{
          fontSize: '14px',
          color: theme.colors.textMedium,
          marginBottom: '12px',
          lineHeight: '1.5',
          maxHeight: '42px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {project.description}
        </p>
      )}

      {/* Project Metadata */}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: theme.colors.textLight,
        borderTop: `1px solid ${theme.colors.grayLight}`,
        paddingTop: '12px',
        marginTop: '12px',
      }}>
        <span>
          <strong>Organization:</strong> {project.client?.name || project.client_id}
        </span>
        <span>
          <strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '400px' }}>
      <NotificationContainer />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: theme.colors.textDark
        }}>
          Projects
        </h2>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: theme.colors.buttonPrimary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>+</span>
          Create Project
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.inputBorder}`,
            backgroundColor: 'white',
            fontSize: '14px'
          }}
        />

        {userType === 'super_admin' && clients.length > 0 && (
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.inputBorder}`,
              backgroundColor: 'white',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">All Organizations</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name || client.organization_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '16px',
          color: theme.colors.textMedium
        }}>
          Loading projects...
        </div>
      ) : currentProjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: theme.colors.textMedium,
          backgroundColor: theme.colors.backgroundAlt,
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            {searchTerm || selectedClient ? 'No projects found' : 'No projects yet'}
          </div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            {searchTerm || selectedClient 
              ? 'Try adjusting your search criteria' 
              : 'Create your first project to get started'}
          </div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {currentProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '32px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === 1 ? theme.colors.grayLight : 'white',
                  color: currentPage === 1 ? theme.colors.textLight : theme.colors.textDark,
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>

              <div style={{
                display: 'flex',
                gap: '4px'
              }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: currentPage === page ? theme.colors.primary : 'white',
                      color: currentPage === page ? 'white' : theme.colors.textDark,
                      border: `1px solid ${currentPage === page ? theme.colors.primary : theme.colors.inputBorder}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      minWidth: '40px'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === totalPages ? theme.colors.grayLight : 'white',
                  color: currentPage === totalPages ? theme.colors.textLight : theme.colors.textDark,
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: theme.colors.textDark,
              marginBottom: '24px'
            }}>
              Create New Project
            </h3>

            {userType === 'super_admin' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.textDark,
                  marginBottom: '8px'
                }}>
                  Organization
                </label>
                <select
                  value={newProjectClientId}
                  onChange={(e) => setNewProjectClientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.inputBorder}`,
                    backgroundColor: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select organization</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name || client.organization_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textDark,
                marginBottom: '8px'
              }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.inputBorder}`,
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textDark,
                marginBottom: '8px'
              }}>
                Description (Optional)
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.inputBorder}`,
                  backgroundColor: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setNewProjectClientId('');
                }}
                disabled={isCreating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: theme.colors.textMedium,
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !newProjectName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.colors.buttonPrimary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCreating || !newProjectName.trim() ? 'not-allowed' : 'pointer',
                  opacity: isCreating || !newProjectName.trim() ? 0.6 : 1
                }}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedProject && (
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
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
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
                color: theme.colors.textDark
              }}>
                Files in {selectedProject.name}
              </h3>
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedProject(null);
                  setProjectFiles([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme.colors.textMedium
                }}
              >
                ×
              </button>
            </div>

            {filesLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.colors.textMedium
              }}>
                Loading files...
              </div>
            ) : projectFiles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: theme.colors.backgroundAlt,
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', color: theme.colors.textMedium }}>
                  No files uploaded yet
                </div>
                <button
                  onClick={() => {
                    setShowFilesModal(false);
                    handleUploadClick(selectedProject);
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Upload Files
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {projectFiles.map(file => (
                  <div key={file.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: theme.colors.backgroundAlt,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.grayLight}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.colors.textDark,
                        marginBottom: '4px'
                      }}>
                        {file.file_name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.textLight
                      }}>
                        {formatFileSize(file.size)} • {file.type} • Uploaded {file.upload_date} by {file.uploader_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedProject && (
        <ProjectMembersModal
          project={selectedProject}
          members={projectMembers}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedProject(null);
            setProjectMembers([]);
          }}
          onUpdate={async () => {
            if (selectedProject) {
              await loadProjectMembers(selectedProject.id);
            }
          }}
          isLoading={membersLoading}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedProjectForUpload && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.textDark,
              }}>
                Upload Files to {selectedProjectForUpload.name}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedProjectForUpload(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme.colors.textMedium,
                }}
              >
                ×
              </button>
            </div>

            {/* File Upload Component */}
            <FileUploadWithProcessing
              projectId={selectedProjectForUpload.id}
              clientId={selectedProjectForUpload.client_id}
              projectName={selectedProjectForUpload.name}
              onUploadComplete={() => {
                setShowUploadModal(false);
                setSelectedProjectForUpload(null);
                loadInitialData();
                showNotification('success', 'Files uploaded and processed successfully!');
              }}
              onError={(error) => {
                showNotification('error', error);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}