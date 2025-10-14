"use client"

import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, documentName }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          transform: "scale(1)",
          animation: "modalSlideIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#fef2f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 4px 0",
              }}
            >
              Delete File
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
              }}
            >
              This action cannot be undone
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "#374151",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          Are you sure you want to delete <strong>{documentName}</strong>? 
          This will permanently remove the file from your storage.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
              e.currentTarget.style.borderColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
              e.currentTarget.style.borderColor = "#ef4444";
            }}
          >
            Delete File
          </button>
        </div>

        <style jsx>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}