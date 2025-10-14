// src/components/NotificationPopup.tsx
"use client"

import React from 'react';
import type { UploadState } from '../types';

interface NotificationPopupProps {
  uploadState: UploadState;
}

export default function NotificationPopup({ uploadState }: NotificationPopupProps) {
  const { isUploading, success, error, fileName } = uploadState;

  if (!isUploading && !success && !error) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "white",
        border: `1px solid ${error ? "#fee2e2" : isUploading ? "#dbeafe" : "#d1fae5"}`,
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        zIndex: 2001,
        minWidth: "300px",
        maxWidth: "450px",
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: error ? "flex-start" : "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: error ? "#fee2e2" : isUploading ? "#dbeafe" : "#dcfce7",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {error ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : isUploading ? (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #bfdbfe",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: error ? "#b91c1c" : isUploading ? "#1e40af" : "#065f46",
              margin: "0 0 4px 0",
            }}
          >
            {error ? "Operation Failed" : isUploading ? "Upload in Progress..." : "Upload Successful!"}
          </h4>
          <p
            style={{
              fontSize: "12px",
              color: error ? "#ef4444" : isUploading ? "#3b82f6" : "#047857",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {error || (isUploading ? `Processing ${fileName}...` : `${fileName} uploaded and processed successfully`)}
          </p>
        </div>
        <button
          onClick={() => {
            // This would be handled by the parent component's uploadState management
          }}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}