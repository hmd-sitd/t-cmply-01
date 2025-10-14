"use client"

import React, { useState } from 'react';
import FileTable from './FileTable';
import DeleteModal from './DeleteModal';
import NotificationPopup from './NotificationPopup';
import { currentTheme } from '../config/themes';
import type { Document, UploadState } from '../types';

interface FilesViewProps {
  documents: Document[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteDocument: (document: Document) => Promise<void>;
  onRefresh: () => void;
  uploadState: UploadState;
  isBackendConnected: boolean;
  isLoading: boolean; // Add loading state prop
  isAdmin: boolean; // Add admin prop
}

export default function FilesView({
  documents,
  onFileUpload,
  onDeleteDocument,
  onRefresh,
  uploadState,
  isBackendConnected,
  isLoading,
  isAdmin
}: FilesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFileTab, setActiveFileTab] = useState<"all" | "recent" | "shared">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete) {
      await onDeleteDocument(documentToDelete);
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const filename = doc.display_name || doc.filename || doc.object_name?.split("/").pop() || "";
    return filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "600",
            color: currentTheme.colors.textDark,
            margin: "0",
          }}
        >
          My Files
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              style={{
                padding: "8px 40px 8px 16px",
                border: `1px solid ${currentTheme.colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "14px",
                width: "250px",
                outline: "none",
                backgroundColor: isLoading ? currentTheme.colors.backgroundAlt : currentTheme.colors.inputBackground,
                color: currentTheme.colors.textDark,
                transition: "border-color 0.2s, box-shadow 0.2s",
                opacity: isLoading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                if (!isLoading) {
                  e.target.style.borderColor = currentTheme.colors.inputBorderFocus;
                  e.target.style.boxShadow = `0 0 0 3px ${currentTheme.colors.primary}20`;
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = currentTheme.colors.inputBorder;
                e.target.style.boxShadow = "none";
              }}
            />
            <svg
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: currentTheme.colors.textMedium,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Upload Button - Only show for admin users */}
          {isAdmin && (
            <label
              style={{
                padding: "8px 16px",
                backgroundColor: isBackendConnected && !isLoading ? currentTheme.colors.buttonPrimary : currentTheme.colors.textLight,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isBackendConnected && !isLoading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                opacity: isBackendConnected && !isLoading ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (isBackendConnected && !isLoading) {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (isBackendConnected && !isLoading) {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: currentTheme.colors.buttonPrimary,
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                +
              </span>
              {isLoading ? "Loading..." : "Upload File"}
              <input 
                type="file" 
                multiple 
                onChange={onFileUpload} 
                style={{ display: "none" }} 
                disabled={!isBackendConnected || isLoading}
              />
            </label>
          )}
        </div>
      </div>

      {/* File Tabs */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginBottom: "24px",
          borderBottom: `1px solid ${currentTheme.colors.bagr}`,
        }}
      >
        {(["all", "recent", "shared"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => !isLoading && setActiveFileTab(tab)}
            disabled={isLoading}
            style={{
              padding: "12px 0",
              border: "none",
              backgroundColor: "transparent",
              fontSize: "14px",
              fontWeight: "500",
              color: activeFileTab === tab ? currentTheme.colors.primary : currentTheme.colors.textMedium,
              cursor: isLoading ? "not-allowed" : "pointer",
              borderBottom: activeFileTab === tab ? `2px solid ${currentTheme.colors.primary}` : "2px solid transparent",
              textTransform: "capitalize",
              transition: "color 0.2s",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (activeFileTab !== tab && !isLoading) {
                e.currentTarget.style.color = currentTheme.colors.textDark;
              }
            }}
            onMouseLeave={(e) => {
              if (activeFileTab !== tab && !isLoading) {
                e.currentTarget.style.color = currentTheme.colors.textMedium;
              }
            }}
          >
            {tab === "all" ? "All Files" : tab}
          </button>
        ))}
      </div>

      {/* Files Table with Loading State */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            backgroundColor: currentTheme.colors.surface,
            borderRadius: "8px",
            border: `1px solid ${currentTheme.colors.bagr}`,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: `4px solid ${currentTheme.colors.grayLight}`,
              borderTop: `4px solid ${currentTheme.colors.primary}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "16px",
            }}
          />
          <div
            style={{
              fontSize: "16px",
              color: currentTheme.colors.textMedium,
              fontWeight: "500",
            }}
          >
            Loading documents...
          </div>
          <div
            style={{
              fontSize: "14px",
              color: currentTheme.colors.textLight,
              marginTop: "8px",
            }}
          >
            Please wait while we fetch your files
          </div>

          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <FileTable
          documents={filteredDocuments}
          onDeleteDocument={handleDeleteClick}
          isBackendConnected={isBackendConnected}
          onFileUpload={onFileUpload}
          isAdmin={isAdmin}
        />
      )}

      {/* Table Footer */}
      {documents.length > 0 && !isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: currentTheme.colors.backgroundAlt,
            borderTop: `1px solid ${currentTheme.colors.grayLight}`,
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: currentTheme.colors.textMedium,
            }}
          >
            Showing {filteredDocuments.length} of {documents.length} files
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              padding: "6px 12px",
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: "6px",
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.textMedium,
              fontSize: "12px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
                e.currentTarget.style.borderColor = currentTheme.colors.inputBorderFocus;
                e.currentTarget.style.color = currentTheme.colors.textDark;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = currentTheme.colors.surface;
                e.currentTarget.style.borderColor = currentTheme.colors.inputBorder;
                e.currentTarget.style.color = currentTheme.colors.textMedium;
              }
            }}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={confirmDelete}
        documentName={
          documentToDelete?.filename ||
          documentToDelete?.name ||
          documentToDelete?.object_name?.split("/").pop() ||
          "this file"
        }
      />

      {/* Upload Notifications */}
      <NotificationPopup uploadState={uploadState} />
    </div>
  );
}