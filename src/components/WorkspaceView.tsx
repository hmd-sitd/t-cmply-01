// src/components/WorkspaceView.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../config/themes';
import { apiService } from '../services/api';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ProjectFilesView from './ProjectFilesView';

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  client_id: string;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  fileCount?: number;
}

interface WorkspaceViewProps {
  onSelectProject: (projectId: string, projectName: string) => void;
}

export default function WorkspaceView({ onSelectProject }: WorkspaceViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 9;
  
  // Track which project's files are being viewed
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
    loadUserType();
  }, []);

  const loadUserType = async () => {
    try {
      const userInfo = await apiService.getCurrentUserType();
      setUserType(userInfo?.user_type || "");
    } catch (error) {
      console.error('Error loading user type:', error);
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.success) {
        // Load file count for each project
        const projectsWithCounts = await Promise.all(
          response.data.projects.map(async (project) => {
            try {
              const filesResponse = await apiService.getProjectFiles(project.id);
              return {
                ...project,
                fileCount: filesResponse.success ? filesResponse.data.files.length : 0
              };
            } catch {
              return { ...project, fileCount: 0 };
            }
          })
        );
        setProjects(projectsWithCounts);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing project files
  const handleViewProjectFiles = (project: Project) => {
    console.log('📁 Opening files view for project:', project.name);
    setViewingProject(project);
  };

  // Handle going back to project list
  const handleBackToProjects = () => {
    setViewingProject(null);
    loadProjects(); // Refresh project list to update file counts
  };

  // If viewing a specific project's files, show the files view
  if (viewingProject) {
    return (
      <ProjectFilesView
        projectId={viewingProject.id}
        projectName={viewingProject.name}
        onBack={handleBackToProjects}
        onFileUpload={async (files: FileList) => {
          // Get the client ID for this project
          const userInfo = await apiService.getCurrentUserType();
          const clientId = viewingProject.client_id || userInfo?.client_id || 'htest';
          
          console.log('📤 Uploading files to project:', viewingProject.id);
          console.log('🏢 Client ID:', clientId);
          console.log('📁 Number of files:', files.length);
          
          // Upload each file
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`📄 Uploading file ${i + 1}/${files.length}: ${file.name}`);
            
            try {
              const response = await apiService.uploadAndProcessFile(
                viewingProject.id,
                clientId,
                file,
                (progress, status) => {
                  console.log(`Progress: ${progress}% - ${status}`);
                }
              );
              
              if (response.success) {
                console.log(`✅ File uploaded successfully: ${file.name}`);
              } else {
                console.error(`❌ Failed to upload ${file.name}:`, response.error);
                alert(`Failed to upload ${file.name}: ${response.error}`);
              }
            } catch (error) {
              console.error(`❌ Error uploading ${file.name}:`, error);
              alert(`Error uploading ${file.name}`);
            }
          }
          
          console.log('✅ All files processed');
          // The ProjectFilesView will reload the file list automatically
        }}
      />
    );
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const canCreateProject = userType === 'super_admin' || userType === 'admin';

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: currentTheme.colors.background,
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 40px",
        borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "600",
          color: currentTheme.colors.textDark,
          margin: "0 0 8px 0",
        }}>
          Workspace
        </h1>
        <p style={{
          fontSize: "16px",
          color: currentTheme.colors.textMedium,
          margin: 0,
        }}>
          Manage your projects and documents
        </p>
      </div>

      {/* Search and Create Project */}
      <div style={{
        padding: "24px 40px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              backgroundColor: currentTheme.colors.inputBackground,
              color: currentTheme.colors.textDark,
            }}
          />
        </div>

        {canCreateProject && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: currentTheme.colors.buttonPrimary,
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
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary;
            }}
          >
            <PlusIcon />
            New Project
          </button>
        )}
      </div>

      {/* Projects Section */}
      <div style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: 0,
          }}>
            Your Projects
          </h2>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            color: currentTheme.colors.textMedium,
          }}>
            Loading projects...
          </div>
        ) : currentProjects.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: currentTheme.colors.surface,
            borderRadius: "12px",
            border: `1px solid ${currentTheme.colors.grayLight}`,
          }}>
            <div style={{
              fontSize: "18px",
              fontWeight: "500",
              color: currentTheme.colors.textDark,
              marginBottom: "8px",
            }}>
              {searchTerm ? "No projects found" : "No projects yet"}
            </div>
            <div style={{
              fontSize: "14px",
              color: currentTheme.colors.textMedium,
            }}>
              {canCreateProject && !searchTerm && "Create your first project to get started"}
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px",
          }}>
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewFiles={() => handleViewProjectFiles(project)}
                onSelectForChat={() => onSelectProject(project.id, project.name)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: `1px solid ${currentTheme.colors.grayLight}`,
          }}>
            <div style={{
              fontSize: "14px",
              color: currentTheme.colors.textMedium,
            }}>
              Showing {indexOfFirstProject + 1}-{Math.min(indexOfLastProject, filteredProjects.length)} of {filteredProjects.length} projects
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "transparent",
                  color: currentTheme.colors.textMedium,
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                ‹ Back
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: currentPage === page ? currentTheme.colors.primary : "transparent",
                    color: currentPage === page ? "white" : currentTheme.colors.textMedium,
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    minWidth: "36px",
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "transparent",
                  color: currentTheme.colors.textMedium,
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onViewFiles, onSelectForChat }: {
  project: Project;
  onViewFiles: () => void;
  onSelectForChat: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{
      backgroundColor: currentTheme.colors.surface,
      border: `1px solid ${currentTheme.colors.grayLight}`,
      borderRadius: "12px",
      padding: "24px",
      transition: "all 0.2s",
      display: "flex",
      flexDirection: "column",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
      e.currentTarget.style.borderColor = currentTheme.colors.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = currentTheme.colors.grayLight;
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: "0 0 8px 0",
          }}>
            {project.name}
          </h3>
          {project.description && (
            <p style={{
              fontSize: "13px",
              color: currentTheme.colors.textMedium,
              margin: "0 0 8px 0",
              lineHeight: "1.4"
            }}>
              {project.description}
            </p>
          )}
          <p style={{
            fontSize: "12px",
            color: currentTheme.colors.textLight,
            margin: 0,
          }}>
            Updated {formatDate(project.updated_at || project.created_at)}
          </p>
        </div>

        <div style={{
          padding: "4px 12px",
          backgroundColor: `${currentTheme.colors.primary}20`,
          color: currentTheme.colors.primary,
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "500",
        }}>
          {project.fileCount || 0} files
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginTop: "12px",
      }}>
        {/* View Files Button - Primary action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewFiles();
          }}
          style={{
            flex: 1,
            padding: "10px 16px",
            backgroundColor: currentTheme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover || '#6d28d9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13,2 13,9 20,9" />
          </svg>
          View Files
        </button>

        {/* Chat Button - Secondary action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectForChat();
          }}
          style={{
            padding: "10px 16px",
            backgroundColor: "transparent",
            color: currentTheme.colors.primary,
            border: `1px solid ${currentTheme.colors.primary}`,
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Chat with this project's documents"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Icons
const SearchIcon = () => (
  <svg
    style={{
      position: "absolute",
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "16px",
      height: "16px",
      color: currentTheme.colors.textMedium,
    }}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);