// src/components/FileUploadWithProcessing.tsx
"use client"

import React, { useState, useRef } from 'react';
import { currentTheme } from '../config/themes';
import { apiService } from '../services/api';

interface FileUploadWithProcessingProps {
  projectId: string;
  clientId: string;
  projectName: string;
  onUploadComplete?: () => void;
  onError?: (error: string) => void;
}

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  statusMessage: string;
  currentFile?: string;
}

export default function FileUploadWithProcessing({
  projectId,
  clientId,
  projectName,
  onUploadComplete,
  onError
}: FileUploadWithProcessingProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    statusMessage: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      onError?.('Please select files to upload');
      return;
    }

    setUploadStatus({
      isUploading: true,
      progress: 0,
      statusMessage: 'Starting upload...'
    });

    try {
      // Process files one by one
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        setUploadStatus(prev => ({
          ...prev,
          currentFile: file.name,
          statusMessage: `Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}`
        }));

        await apiService.uploadAndProcessFile(
          projectId,
          clientId,
          file,
          (progress, status) => {
            setUploadStatus(prev => ({
              ...prev,
              progress,
              statusMessage: status
            }));
          }
        );
      }

      setUploadStatus({
        isUploading: false,
        progress: 100,
        statusMessage: 'All files processed successfully!'
      });

      // Reset after success
      setTimeout(() => {
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadStatus({
          isUploading: false,
          progress: 0,
          statusMessage: ''
        });
        onUploadComplete?.();
      }, 2000);

    } catch (error: any) {
      setUploadStatus({
        isUploading: false,
        progress: 0,
        statusMessage: `Error: ${error.message}`
      });
      onError?.(error.message || 'Upload failed');
    }
  };

  return (
    <>
      {/* Main Upload Section */}
      <div style={{
        padding: '24px',
        backgroundColor: currentTheme.colors.surface,
        borderRadius: '12px',
        border: `1px solid ${currentTheme.colors.inputBorder}`,
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: currentTheme.colors.textDark,
          marginBottom: '16px'
        }}>
          Upload Documents
        </h3>

        <div style={{
          border: `2px dashed ${currentTheme.colors.inputBorder}`,
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: currentTheme.colors.backgroundAlt,
          marginBottom: '16px'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx,.md"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload-input"
          />
          
          <label htmlFor="file-upload-input" style={{
            cursor: 'pointer',
            display: 'inline-block'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: currentTheme.colors.primary
            }}>
              📁
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: currentTheme.colors.textDark,
              marginBottom: '8px'
            }}>
              Click to select files or drag and drop
            </div>
            <div style={{
              fontSize: '14px',
              color: currentTheme.colors.textMedium
            }}>
              Supported formats: PDF, TXT, DOC, DOCX, MD
            </div>
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles && selectedFiles.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: currentTheme.colors.backgroundAlt,
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: currentTheme.colors.textDark,
              marginBottom: '8px'
            }}>
              Selected files ({selectedFiles.length}):
            </div>
            {Array.from(selectedFiles).map((file, index) => (
              <div key={index} style={{
                fontSize: '13px',
                color: currentTheme.colors.textMedium,
                padding: '4px 0'
              }}>
                • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || uploadStatus.isUploading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: selectedFiles && !uploadStatus.isUploading 
              ? currentTheme.colors.buttonPrimary 
              : currentTheme.colors.inputBorder,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedFiles && !uploadStatus.isUploading ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          {uploadStatus.isUploading ? 'Processing...' : 'Upload and Process Files'}
        </button>
      </div>

      {/* Loading Overlay */}
      {uploadStatus.isUploading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Loading Icon */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto',
                border: '4px solid #e5e7eb',
                borderTop: `4px solid ${currentTheme.colors.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>

            {/* Current File */}
            {uploadStatus.currentFile && (
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: currentTheme.colors.textDark
              }}>
                {uploadStatus.currentFile}
              </div>
            )}

            {/* Status Message */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '14px',
              color: currentTheme.colors.textMedium
            }}>
              {uploadStatus.statusMessage}
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadStatus.progress}%`,
                height: '100%',
                backgroundColor: currentTheme.colors.primary,
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>

            {/* Progress Percentage */}
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: currentTheme.colors.primary
            }}>
              {Math.round(uploadStatus.progress)}%
            </div>

            {/* Processing Steps */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: currentTheme.colors.backgroundAlt,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '12px',
                color: currentTheme.colors.textMedium,
                marginBottom: '8px'
              }}>
                Processing Pipeline:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '11px',
                color: currentTheme.colors.textLight
              }}>
                <div>✓ File Upload</div>
                <div>✓ Document Parsing</div>
                <div>✓ Text Chunking</div>
                <div>✓ Embedding Generation</div>
                <div>✓ Vector Storage</div>
                <div>✓ Index Mapping</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}