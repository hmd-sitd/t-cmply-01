// src/components/modals/SelectSourcesModal.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
}

interface ProjectFile {
  id: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  status: string;
}

interface SelectSourcesModalProps {
  onClose: () => void;
  onConfirm: (selectedProject: Project) => void;
}

export default function SelectSourcesModal({ onClose, onConfirm }: SelectSourcesModalProps) {
  const { theme } = useTheme();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectFiles, setSelectedProjectFiles] = useState<ProjectFile[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get projects where user is a collaborator
      const response = await apiService.getMyProjects();
      if (response.success) {
        setUserProjects(response.data.projects);
      }
    } catch (error: any) {
      console.error('Error loading user projects:', error);
      setError('Failed to load your projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectFiles = async (projectId: string) => {
    try {
      const response = await apiService.getProjectFiles(projectId);
      if (response.success) {
        setSelectedProjectFiles(response.data.files);
      }
    } catch (error: any) {
      console.error('Error loading project files:', error);
      setSelectedProjectFiles([]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    loadProjectFiles(projectId);
    
    // Auto-expand the selected project
    setExpandedProjects(new Set([projectId]));
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
      // Load files when expanding
      if (projectId === selectedProjectId) {
        loadProjectFiles(projectId);
      }
    }
    setExpandedProjects(newExpanded);
  };

  const handleConfirm = () => {
    if (selectedProjectId) {
      const selectedProject = userProjects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        onConfirm(selectedProject);
      }
    }
  };

  const filteredProjects = userProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (contentType: string) => {
    const type = contentType?.toLowerCase() || '';
    
    if (type.includes('pdf')) {
      return (
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#DC4C64',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          PDF
        </div>
      );
    } else if (type.includes('word') || type.includes('document')) {
      return (
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#2B579A',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          W
        </div>
      );
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return (
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#207245',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          X
        </div>
      );
    } else {
      return (
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#666',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          📄
        </div>
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
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
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Select Sources
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '16px'
        }}>
          <div style={{
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Search projects or files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <svg
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
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

        {/* Projects List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          {isLoading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Loading your projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              {userProjects.length === 0 
                ? "You're not a collaborator in any projects yet."
                : "No projects match your search."
              }
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} style={{
                borderBottom: '1px solid #f3f4f6'
              }}>
                {/* Project Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: selectedProjectId === project.id ? '#f3f4f6' : 'transparent'
                }}>
                  {/* Radio Button */}
                  <input
                    type="radio"
                    name="selectedProject"
                    checked={selectedProjectId === project.id}
                    onChange={() => handleProjectSelect(project.id)}
                    style={{
                      marginRight: '12px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#7c3aed'
                    }}
                  />

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleProjectExpansion(project.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      marginRight: '8px',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: expandedProjects.has(project.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>

                  {/* Project Icon */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#7c3aed',
                    borderRadius: '4px',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13,2 13,9 20,9"/>
                    </svg>
                  </div>

                  {/* Project Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937',
                      marginBottom: '2px'
                    }}>
                      {project.name}
                    </div>
                    {project.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {project.description}
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {selectedProjectId === project.id && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#7c3aed',
                      borderRadius: '50%',
                      marginLeft: '8px'
                    }} />
                  )}
                </div>

                {/* Files List (when expanded) */}
                {expandedProjects.has(project.id) && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    {selectedProjectId === project.id && selectedProjectFiles.length > 0 ? (
                      selectedProjectFiles.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 16px 8px 60px',
                            fontSize: '13px',
                            color: '#6b7280',
                            borderBottom: '1px solid #f3f4f6'
                          }}
                        >
                          {getFileIcon(file.content_type)}
                          <span style={{ marginLeft: '8px', flex: 1 }}>
                            {file.original_filename}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {formatFileSize(file.file_size)}
                          </span>
                        </div>
                      ))
                    ) : selectedProjectId === project.id ? (
                      <div style={{
                        padding: '16px 60px',
                        fontSize: '13px',
                        color: '#9ca3af',
                        textAlign: 'center'
                      }}>
                        No files in this project
                      </div>
                    ) : (
                      <div style={{
                        padding: '16px 60px',
                        fontSize: '13px',
                        color: '#9ca3af',
                        textAlign: 'center'
                      }}>
                        Select this project to view files
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProjectId}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedProjectId ? '#7c3aed' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: selectedProjectId ? 'pointer' : 'not-allowed'
            }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}