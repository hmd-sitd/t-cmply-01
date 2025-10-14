// src/components/ProjectFilesView.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../config/themes';
import { apiService } from '../services/api';

interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: number;
  uploaded_at: string;
  status: string;
}

interface ProjectFilesViewProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
  onFileUpload?: (files: FileList) => Promise<void>;
}

export default function ProjectFilesView({
  projectId,
  projectName,
  onBack,
  onFileUpload
}: ProjectFilesViewProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [canUpload, setCanUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const filesPerPage = 10; // Increased from 3 to 10 for better UX

  useEffect(() => {
    loadFiles();
    checkUploadPermission();
  }, [projectId]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getProjectFiles(projectId);
      if (response.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUploadPermission = async () => {
    try {
      const hasPermission = await apiService.canUploadToProject(projectId);
      setCanUpload(hasPermission);
    } catch (error) {
      console.error('Error checking upload permission:', error);
      setCanUpload(true); // Default to true if check fails
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (!onFileUpload) {
      alert('Upload handler not configured');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading ${selectedFiles.length} file(s)...`);
    
    try {
      await onFileUpload(selectedFiles);
      setUploadProgress("Upload complete!");
      
      // Reload files after successful upload
      await loadFiles();
      
      // Clear the file input
      e.target.value = '';
      
      setTimeout(() => {
        setUploadProgress("");
      }, 3000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => {
        setUploadProgress("");
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const response = await apiService.deleteProjectFile(fileId);
      if (response.success) {
        await loadFiles();
      } else {
        alert(`Failed to delete file: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error.message || 'Unknown error'}`);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('word') || type.includes('docx') || type.endsWith('.docx') || type.endsWith('.doc')) return <WordIcon />;
    if (type.includes('excel') || type.includes('xlsx') || type.endsWith('.xlsx') || type.endsWith('.xls')) return <ExcelIcon />;
    if (type.includes('pdf') || type.endsWith('.pdf')) return <PdfIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getFileType = (fileType: string) => {
    if (!fileType) return 'File';
    
    // If it's a MIME type
    if (fileType.includes('/')) {
      const parts = fileType.split('/');
      return parts[1]?.toUpperCase() || parts[0]?.toUpperCase() || 'File';
    }
    
    // If it's just an extension
    if (fileType.startsWith('.')) {
      return fileType.substring(1).toUpperCase();
    }
    
    return fileType.toUpperCase();
  };

  // Filter files by type
  const filteredByType = files.filter(file => {
    if (activeTab === 'all') return true;
    const lowerType = (file.file_type || '').toLowerCase();
    const fileName = (file.file_name || '').toLowerCase();
    
    if (activeTab === 'word') {
      return lowerType.includes('word') || lowerType.includes('docx') || 
             fileName.endsWith('.docx') || fileName.endsWith('.doc');
    }
    if (activeTab === 'excel') {
      return lowerType.includes('excel') || lowerType.includes('xlsx') || 
             fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    }
    if (activeTab === 'pdf') {
      return lowerType.includes('pdf') || fileName.endsWith('.pdf');
    }
    return false;
  });

  // Filter by search
  const filteredFiles = filteredByType.filter(file =>
    (file.file_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const tabs = ['all'];

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: currentTheme.colors.background,
    }}>
      {/* Header with Back Button */}
      <div style={{
        padding: "32px 40px",
        borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: currentTheme.colors.textMedium,
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "16px",
            padding: 0,
          }}
        >
          <BackArrowIcon />
          Back to Projects
        </button>

        <h1 style={{
          fontSize: "32px",
          fontWeight: "600",
          color: currentTheme.colors.textDark,
          margin: "0 0 8px 0",
        }}>
          {projectName}
        </h1>
        <p style={{
          fontSize: "16px",
          color: currentTheme.colors.textMedium,
          margin: 0,
        }}>
          Project ID: {projectId}
        </p>
      </div>

      {/* Search and Upload */}
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
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
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

        {uploadProgress && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: isUploading ? currentTheme.colors.primaryLight : 
                           uploadProgress.includes('failed') ? '#fee' : '#efe',
            color: isUploading ? currentTheme.colors.primary : 
                  uploadProgress.includes('failed') ? '#c00' : '#060',
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}>
            {uploadProgress}
          </div>
        )}

        {canUpload && (
          <label style={{
            padding: "12px 24px",
            backgroundColor: isUploading ? currentTheme.colors.grayLight : currentTheme.colors.buttonPrimary,
            color: isUploading ? currentTheme.colors.textMedium : "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: isUploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            opacity: isUploading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isUploading) {
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isUploading) {
              e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary;
            }
          }}>
            <UploadIcon />
            {isUploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md"
            />
          </label>
        )}
      </div>

      {/* File Type Tabs */}
      <div style={{
        padding: "0 40px",
        borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
        display: "flex",
        gap: "32px",
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => !isLoading && setActiveTab(tab)}
            disabled={isLoading}
            style={{
              padding: "16px 0",
              background: "none",
              border: "none",
              fontSize: "14px",
              fontWeight: "500",
              color: activeTab === tab ? currentTheme.colors.primary : currentTheme.colors.textMedium,
              cursor: isLoading ? "not-allowed" : "pointer",
              borderBottom: activeTab === tab ? `2px solid ${currentTheme.colors.primary}` : "2px solid transparent",
              textTransform: "capitalize",
              transition: "color 0.2s",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab && !isLoading) {
                e.currentTarget.style.color = currentTheme.colors.textDark;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab && !isLoading) {
                e.currentTarget.style.color = currentTheme.colors.textMedium;
              }
            }}
          >
            {tab === "all" ? "All Files" : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Files Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            color: currentTheme.colors.textMedium,
          }}>
            Loading files...
          </div>
        ) : (
          <div style={{ padding: "32px 40px" }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 120px",
              gap: "16px",
              padding: "16px 0",
              borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
              fontSize: "12px",
              fontWeight: "600",
              color: currentTheme.colors.textMedium,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <div>File Name</div>
              <div>Type</div>
              <div>Upload Date</div>
              <div>Upload By</div>
              <div>Size</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            {currentFiles.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: currentTheme.colors.textMedium,
              }}>
                {searchTerm ? "No files found matching your search" : "No files in this project yet"}
                {!searchTerm && canUpload && (
                  <div style={{ marginTop: "16px" }}>
                    Click the Upload button above to add files
                  </div>
                )}
              </div>
            ) : (
              currentFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 120px",
                    gap: "16px",
                    padding: "20px 0",
                    borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
                    alignItems: "center",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    overflow: "hidden",
                  }}>
                    {getFileIcon(file.file_type || file.file_name)}
                    <span style={{
                      fontSize: "14px",
                      color: currentTheme.colors.textDark,
                      fontWeight: "500",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={file.file_name}>
                      {file.file_name}
                    </span>
                  </div>

                  <div style={{
                    fontSize: "14px",
                    color: currentTheme.colors.textMedium,
                    textTransform: "uppercase",
                  }}>
                    {getFileType(file.file_type || file.file_name)}
                  </div>

                  <div style={{
                    fontSize: "14px",
                    color: currentTheme.colors.textMedium,
                  }}>
                    {formatDate(file.uploaded_at)}
                  </div>

                  <div style={{
                    fontSize: "14px",
                    color: currentTheme.colors.textMedium,
                  }}>
                    Me
                  </div>

                  <div style={{
                    fontSize: "14px",
                    color: currentTheme.colors.textMedium,
                  }}>
                    {formatFileSize(file.file_size)}
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}>
                    <button
                      title="View"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: currentTheme.colors.textMedium,
                      }}
                      onClick={() => alert('View functionality coming soon')}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      title="Download"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: currentTheme.colors.textMedium,
                      }}
                      onClick={() => alert('Download functionality coming soon')}
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.file_name)}
                      title="Delete"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: currentTheme.colors.error,
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
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
                  Showing {indexOfFirstFile + 1}-{Math.min(indexOfLastFile, filteredFiles.length)} of {filteredFiles.length} files
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
                    ‹ Previous
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
        )}
      </div>
    </div>
  );
}

// Icons remain the same...
const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

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

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const WordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#2B579A" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">W</text>
  </svg>
);

const ExcelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#217346" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">X</text>
  </svg>
);

const PdfIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#F40F02" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">PDF</text>
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={currentTheme.colors.textMedium} strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);