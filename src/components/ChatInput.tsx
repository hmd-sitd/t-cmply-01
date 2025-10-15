// src/components/ChatInput.tsx - SIMPLIFIED: Disabled until project selected
"use client"

import React, { useRef, useState, useCallback } from 'react';
import type { ChatSettings } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
}

interface ChatInputProps {
  isLoading: boolean;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  chatSettings: ChatSettings;
  onSendMessage: (message: string) => Promise<void>;
  onOpenSettings: () => void;
  selectedProject?: Project | null;
  onOpenSources?: () => void;
}

export default function ChatInput({
  isLoading,
  isAuthenticated,
  isBackendConnected,
  chatSettings,
  onSendMessage,
  onOpenSettings,
  selectedProject,
  onOpenSources
}: ChatInputProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

// Fixed handleSubmit function for ChatInput.tsx
// Replace your existing handleSubmit with this version

const handleSubmit = useCallback(async (e?: React.FormEvent) => {
  // Prevent form submission if called from form event
  if (e) {
    e.preventDefault();
  }

  const userMessage = message.trim();
  
  // Enhanced validation with detailed logging
  if (!userMessage) {
    console.log('🚫 Submit blocked: Empty message');
    return;
  }
  
  if (isSending) {
    console.log('🚫 Submit blocked: Already sending (isSending:', isSending, ')');
    return;
  }
  
  if (isLoading) {
    console.log('🚫 Submit blocked: Parent loading state (isLoading:', isLoading, ')');
    return;
  }
  
  if (!selectedProject) {
    console.log('🚫 Submit blocked: No project selected');
    return;
  }

  console.log('🚀 ChatInput: Starting message send for project:', selectedProject.name);
  console.log('📝 Message content:', userMessage);
  console.log('🔧 Loading states:', { isSending, isLoading });
  
  setIsSending(true);
  
  try {
    // Clear the input immediately for better UX
    setMessage("");
    if (messageInputRef.current) {
      messageInputRef.current.value = "";
      messageInputRef.current.style.height = "24px";
    }

    console.log('📞 ChatInput: Calling onSendMessage...');
    await onSendMessage(userMessage);
    console.log('✅ ChatInput: Message sent successfully');
    
    // Focus back to input after successful send
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  } catch (error) {
    console.error("❌ ChatInput: Send message error:", error);
    
    // Restore message on error
    setMessage(userMessage);
    if (messageInputRef.current) {
      messageInputRef.current.value = userMessage;
    }
  } finally {
    setIsSending(false);
    console.log('🏁 ChatInput: Send operation completed');
  }
}, [message, isSending, isLoading, onSendMessage, selectedProject]);

// Also update your handleKeyPress to pass the event
const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(); // No need to pass event here
  }
}, [handleSubmit]);

// Update your canSendMessage condition to include both loading states
const canSendMessage = isAuthenticated && 
                      isBackendConnected && 
                      chatSettings.model_name && 
                      message.trim() && 
                      !isSending &&
                      !isLoading &&  // Add this line
                      selectedProject;

  // Input is enabled only when project is selected
  const isInputEnabled = isAuthenticated && selectedProject;

  const getPlaceholderText = () => {
    if (!isAuthenticated) {
      return "Please sign in to start chatting...";
    }
    if (!isBackendConnected) {
      return "Connecting to backend...";
    }
    if (!chatSettings.model_name) {
      return "Please configure a model in settings...";
    }
    if (!selectedProject) {
      return "Select a project from sources to start chatting...";
    }
    if (isSending) {
      return "Sending your message...";
    }
    return `Ask about ${selectedProject.name}...`;
  };
  // Add this missing handleInputChange function to your ChatInput.tsx
// Place it right after your handleKeyPress function

const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  // Only allow typing if project is selected
  if (!selectedProject) return;
  
  const value = e.target.value;
  setMessage(value);
  
  // Auto-resize textarea
  if (messageInputRef.current) {
    messageInputRef.current.style.height = "auto";
    messageInputRef.current.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }
}, [selectedProject]);
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.grayLight}`,
        padding: "20px 40px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.surface,
            border: `2px solid ${theme.colors.inputBorder}`,
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            transition: "border-color 0.2s",
          }}
          onFocus={() => {
            const container = document.querySelector("[data-chat-input-container]") as HTMLElement;
            if (container) container.style.borderColor = theme.colors.inputBorderFocus;
          }}
          onBlur={() => {
            const container = document.querySelector("[data-chat-input-container]") as HTMLElement;
            if (container) container.style.borderColor = theme.colors.inputBorder;
          }}
          data-chat-input-container
        >
          {/* Show project context only when selected */}
          {selectedProject && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
              border: `1px solid ${theme.colors.primary}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: theme.colors.primary
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13,2 13,9 20,9"/>
                </svg>
                <span>Context: <strong>{selectedProject.name}</strong></span>
              </div>
              {onOpenSources && (
                <button
                  onClick={onOpenSources}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.colors.primary,
                    cursor: 'pointer',
                    fontSize: '11px',
                    textDecoration: 'underline',
                    padding: '2px 4px'
                  }}
                >
                  Change
                </button>
              )}
            </div>
          )}

          {/* Textarea - Disabled until project selected */}
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            disabled={!isInputEnabled}
            style={{
              width: "100%",
              minHeight: "24px",
              maxHeight: "200px",
              padding: "0",
              border: "none",
              fontSize: "16px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              color: isInputEnabled ? theme.colors.textDark : theme.colors.textMedium,
              backgroundColor: "transparent",
              overflow: "hidden",
              opacity: isInputEnabled ? 1 : 0.5,
              cursor: isInputEnabled ? "text" : "not-allowed",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Sources Button */}
              {isAuthenticated && onOpenSources && (
                <button
                  onClick={onOpenSources}
                  style={{
                    padding: "8px 16px",
                    border: selectedProject 
                      ? `1px solid ${theme.colors.primary}` 
                      : `2px solid ${theme.colors.primary}`,
                    borderRadius: "8px",
                    backgroundColor: selectedProject 
                      ? theme.colors.primary 
                      : 'white',
                    fontSize: "13px",
                    fontWeight: "600",
                    color: selectedProject 
                      ? "white" 
                      : theme.colors.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  title={selectedProject ? `Selected: ${selectedProject.name}` : "Select project sources for context"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13,2 13,9 20,9"/>
                  </svg>
                  <span>
                    {selectedProject ? selectedProject.name : "Select Sources"}
                  </span>
                </button>
              )}

              {/* Loading indicator */}
              {isSending && (
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textMedium,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      border: `2px solid ${theme.colors.grayLight}`,
                      borderTop: `2px solid ${theme.colors.primary}`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  AI is thinking...
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: canSendMessage ? theme.colors.buttonPrimary : theme.colors.textLight,
                border: "none",
                borderRadius: "10px",
                cursor: canSendMessage ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                opacity: canSendMessage ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (canSendMessage) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (canSendMessage) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* DXC-CDG Disclaimer */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '11px',
          color: '#585151ff',
          opacity: 1
        }}>
          You're interacting with AI by DXC-CDG, check for possible mistakes.
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}