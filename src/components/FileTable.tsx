"use client"

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Document } from '../types';
import { formatFileSize, formatDate, getFileTypeFromName, getFileTypeColor } from '../utils/formatters';

interface FileTableProps {
  documents: Document[];
  onDeleteDocument: (document: Document) => void;
  isBackendConnected: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isAdmin: boolean;
}

export default function FileTable({
  documents,
  onDeleteDocument,
  isBackendConnected,
  onFileUpload,
  isAdmin
}: FileTableProps) {
  const { theme } = useTheme();
  
  if (documents.length === 0) {
    return (
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${theme.colors.grayLight}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "32px", color: theme.colors.textMedium }}>📁</div>
          </div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: theme.colors.textDark,
              marginBottom: "8px",
            }}
          >
            No files uploaded yet
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: theme.colors.textMedium,
              marginBottom: "24px",
            }}
          >
            {isAdmin 
              ? "Upload your first file to get started. Supported formats: PDF, DOC, DOCX, TXT, MD, HTML"
              : "No files have been uploaded yet. Contact an administrator to upload files."
            }
          </p>
          {isAdmin && (
            <label
              style={{
                padding: "12px 24px",
                backgroundColor: isBackendConnected ? theme.colors.buttonPrimary : theme.colors.textLight,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isBackendConnected ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                opacity: isBackendConnected ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (isBackendConnected) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (isBackendConnected) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              + Upload Your First File
              <input
                type="file"
                multiple
                onChange={onFileUpload}
                style={{ display: "none" }}
                disabled={!isBackendConnected}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${theme.colors.grayLight}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "1fr 200px 100px 80px" : "1fr 200px 100px",
          padding: "16px 24px",
          backgroundColor: theme.colors.backgroundAlt,
          borderBottom: `1px solid ${theme.colors.grayLight}`,
          fontSize: "14px",
          fontWeight: "500",
          color: theme.colors.textMedium,
        }}
      >
        <div>Name</div>
        <div>Date Modified</div>
        <div>Size</div>
        {isAdmin && <div>Actions</div>}
      </div>
        
      {documents.map((document, index) => {
        const filename = document.display_name || 
                        document.filename || 
                        document.name || 
                        (document.object_name?.split("/").pop()) ||
                        "Unknown file";
        
        const objectName = document.object_name || document.key || document.path || "";
        const size = document.size || document.file_size || 0;
        const lastModified = document.last_modified || 
                            document.lastModified || 
                            document.modified || 
                            new Date().toISOString();
        return (
          <div
            key={objectName || index}
            style={{
              display: "grid",
              gridTemplateColumns: isAdmin ? "1fr 200px 100px 80px" : "1fr 200px 100px",
              padding: "16px 24px",
              borderBottom: index < documents.length - 1 ? `1px solid ${theme.colors.backgroundAlt}` : "none",
              alignItems: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.backgroundAlt;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: getFileTypeColor(filename),
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {getFileTypeFromName(filename)}
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: theme.colors.textDark,
                }}
              >
                {filename}
              </span>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
              }}
            >
              {formatDate(lastModified)}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: theme.colors.textMedium,
              }}
            >
              {formatFileSize(size)}
            </div>
            {isAdmin && (
              <div>
                <button
                  onClick={() => onDeleteDocument(document)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: theme.colors.error,
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.error}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Delete document"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{ display: "block", color: theme.colors.error }}
                  >
                    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}