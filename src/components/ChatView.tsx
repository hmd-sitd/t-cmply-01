// src/components/ChatView.tsx - FIXED: Remove infinite loop by using parent state
"use client"

import React, { useRef, useEffect, useMemo, useState } from 'react';
import ChatInput from './ChatInput';
import SelectSourcesModal from './modals/SelectSourcesModal';
import type { ChatMessage, ChatSettings } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
}

interface ChatViewProps {
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  chatSettings: ChatSettings;
  onSendMessage: (message: string) => Promise<void>;
  onOpenSettings: () => void;
  selectedProject?: Project | null;
  onSelectProject?: (projectId: string, projectName: string) => void;
}

export default function ChatView({
  chatMessages,
  isLoading,
  isAuthenticated,
  isBackendConnected,
  chatSettings,
  onSendMessage,
  onOpenSettings,
  selectedProject,
  onSelectProject
}: ChatViewProps) {
  const { theme } = useTheme();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  // Helper function to determine if a message is from a user
  const isUserMessage = (role: string): boolean => {
    if (typeof role === "string") {
      const roleStr = role.trim().toLowerCase();
      return roleStr === "user" || roleStr === "human";
    }
    return false;
  };

  // Sort messages with proper null/undefined handling
  const sortedChatMessages = useMemo(() => {
    if (!chatMessages || !Array.isArray(chatMessages)) {
      console.warn('ChatView received invalid chatMessages:', chatMessages);
      return [];
    }

    return [...chatMessages].sort((a, b) => {
      let timeA: number;
      let timeB: number;
      
      if (a.timestamp instanceof Date) {
        timeA = a.timestamp.getTime();
      } else {
        timeA = new Date(a.timestamp).getTime();
      }
      
      if (b.timestamp instanceof Date) {
        timeB = b.timestamp.getTime();
      } else {
        timeB = new Date(b.timestamp).getTime();
      }
      
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
      
      if (a.role === 'user' && b.role === 'assistant') {
        return -1;
      }
      if (a.role === 'assistant' && b.role === 'user') {
        return 1;
      }
      
      return a.id.localeCompare(b.id);
    });
  }, [chatMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [sortedChatMessages]);

  const formatTime = (timestamp: string | Date) => {
    try {
      let date: Date;
      
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'Unknown time';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Invalid time';
      }
      
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      console.warn('Error formatting timestamp:', timestamp, error);
      return 'Unknown time';
    }
  };

  // Modal handlers
  const openSourcesModal = () => setShowSourcesModal(true);
  const closeSourcesModal = () => setShowSourcesModal(false);
  
  const handleSelectProject = (project: Project) => {
    if (onSelectProject) {
      onSelectProject(project.id, project.name);
    }
    closeSourcesModal();
  };

  const clearSelection = () => {
    if (onSelectProject) {
      onSelectProject('', ''); // Clear selection
    }
  };

  // Enhanced onSendMessage that includes project context
  const handleSendMessage = async (message: string) => {
    // CRITICAL: Check if project is selected before sending
    if (!selectedProject) {
      console.error('❌ Cannot send message: No project selected');
      return;
    }

    console.log('🎯 ChatView: Sending message with project context:', {
      project: selectedProject.name,
      projectId: selectedProject.id,
      message: message.substring(0, 50) + '...'
    });

    try {
      await onSendMessage(message);
      console.log('✅ ChatView: Message sent successfully with project context');
    } catch (error) {
      console.error('❌ ChatView: Failed to send message:', error);
      throw error;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "calc(100vh - 140px)",
      }}
    >
      {/* Chat Header with Sources */}
      <div style={{
        padding: "16px 40px",
        borderBottom: `1px solid ${theme.colors.grayLight}`,
        backgroundColor: theme.colors.surface,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "600",
            color: theme.colors.textDark,
            margin: 0
          }}>
            AI Assistant
          </h2>
          {selectedProject && (
            <p style={{
              fontSize: "14px",
              color: theme.colors.textMedium,
              margin: "4px 0 0 0"
            }}>
              Context: {selectedProject.name}
            </p>
          )}
        </div>
        
        {/* Sources Button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={openSourcesModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: selectedProject ? theme.colors.primary : theme.colors.backgroundAlt,
              color: selectedProject ? 'white' : theme.colors.textDark,
              border: selectedProject ? 'none' : `1px solid ${theme.colors.grayLight}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13,2 13,9 20,9"/>
            </svg>
            {selectedProject ? selectedProject.name : 'Select Sources'}
          </button>
          
          {selectedProject && (
            <button
              onClick={clearSelection}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                color: theme.colors.textMedium,
                border: `1px solid ${theme.colors.grayLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Clear selection"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 40px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {sortedChatMessages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "600",
                color: theme.colors.textDark,
                margin: "0 0 8px 0",
              }}
            >
              Hi, I'm your AI assistant.
            </h1>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "600",
                color: theme.colors.textDark,
                margin: "0 0 16px 0",
              }}
            >
              How can I help you today?
            </h2>
            
            {!selectedProject ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px"
              }}>
                <p
                  style={{
                    fontSize: "16px",
                    color: theme.colors.textMedium,
                    maxWidth: "600px",
                    lineHeight: "1.6",
                    marginBottom: "8px"
                  }}
                >
                  {!isAuthenticated
                    ? "Please sign in to start chatting with the AI assistant."
                    : !isBackendConnected
                    ? "Connecting to AI services..."
                    : "Select a project to start chatting about its documents and files!"}
                </p>
                
                {isAuthenticated && isBackendConnected && (
                  <button
                    onClick={openSourcesModal}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13,2 13,9 20,9"/>
                    </svg>
                    Select Project Sources
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                padding: '16px 24px',
                backgroundColor: theme.colors.backgroundAlt,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.grayLight}`,
                maxWidth: '600px'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: theme.colors.textDark,
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  Ready to chat about: {selectedProject.name}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: theme.colors.textMedium,
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Ask questions about the documents and files in this project.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Project Context Banner */}
            {selectedProject && sortedChatMessages.length > 0 && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: theme.colors.backgroundAlt,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.grayLight}`,
                marginTop: '20px'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.textMedium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13,2 13,9 20,9"/>
                  </svg>
                  <span>
                    Chatting about: <strong>{selectedProject.name}</strong>
                  </span>
                </div>
              </div>
            )}
            
            {sortedChatMessages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUserMessage(chatMessage.role) ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    backgroundColor: isUserMessage(chatMessage.role) ? theme.colors.primary : theme.colors.backgroundAlt,
                    color: isUserMessage(chatMessage.role) ? "white" : theme.colors.textDark,
                    border: isUserMessage(chatMessage.role) ? "none" : `1px solid ${theme.colors.grayLight}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      opacity: 0.8,
                    }}
                  >
                    {isUserMessage(chatMessage.role) ? "You" : "AI Assistant"}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {chatMessage.content}
                    {chatMessage.isStreaming && (
                      <span
                        style={{
                          animation: "blink 1s infinite",
                          marginLeft: "4px",
                        }}
                      >
                        |
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textLight,
                    marginTop: "4px",
                    marginBottom: "8px",
                  }}
                >
                  {formatTime(chatMessage.timestamp)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
        isBackendConnected={isBackendConnected}
        chatSettings={chatSettings}
        onSendMessage={handleSendMessage}
        onOpenSettings={onOpenSettings}
        selectedProject={selectedProject}
        onOpenSources={openSourcesModal}
      />

      {/* Select Sources Modal */}
      {showSourcesModal && (
        <SelectSourcesModal
          onClose={closeSourcesModal}
          onConfirm={handleSelectProject}
        />
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}