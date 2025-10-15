"use client"

import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { usePersistentChat } from '../hooks/usePersistentChat';
import { apiService } from '../services/api';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onNewChat: () => void;
  chatMessages: ChatMessage[]; // Keep for backward compatibility
  onOpenSettings: () => void;
  projectId?: string;
  onChatHistoryLoaded?: (threads: any[]) => void;
  onActiveThreadChanged?: (threadId: string | null, messages: ChatMessage[]) => void;
  onSendMessageToPersistentChat?: (message: string) => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onNewChat,
  chatMessages,
  onOpenSettings,
  projectId = "default",
  onChatHistoryLoaded,
  onActiveThreadChanged,
  onSendMessageToPersistentChat
}: SidebarProps) {
  const { theme } = useTheme();
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Authentication state management
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = apiService.isAuthenticated();
      setIsAuthenticated(authStatus);
      return authStatus;
    };
    
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const {
    threads,
    activeThreadId,
    activeMessages,
    isLoading,
    error,
    loadThreads,
    selectThread,
    createNewThread,
    deleteThread,
    renameThread,
    sendMessage
  } = usePersistentChat(projectId, isAuthenticated);

  // Notify parent component when chat history loads
  useEffect(() => {
    if (onChatHistoryLoaded) {
      onChatHistoryLoaded(threads);
    }
  }, [threads, onChatHistoryLoaded]);

  // Notify parent when active thread changes
  useEffect(() => {
    if (onActiveThreadChanged) {
      onActiveThreadChanged(activeThreadId, activeMessages);
    }
  }, [activeThreadId, activeMessages, onActiveThreadChanged]);

  useEffect(() => {
    if (onSendMessageToPersistentChat) {
      (window as any).persistentChatSendMessage = (message: string) => {
        const storedSettings = localStorage.getItem('chatSettings');
        const chatSettings = storedSettings ? JSON.parse(storedSettings) : {
          model_name: 'moonshotai/kimi-k2-instruct',
          model_provider: 'groq',
          temperature: 0.7,
          max_tokens: 1000
        };
        
        return sendMessage(message, chatSettings);
      };
    }
  }, [sendMessage, onSendMessageToPersistentChat]);

  // Show threads only when authenticated, otherwise show current messages as fallback
  const displayThreads = isAuthenticated && threads.length > 0 ? threads : generateThreadsFromMessages(chatMessages);

  function generateThreadsFromMessages(messages: ChatMessage[]) {
    if (messages.length === 0) return [];
    
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return [];

    return [{
      id: 'current',
      title: userMessages[0]?.content?.substring(0, 30) + '...' || 'New Chat',
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50) + '...' || '',
      timestamp: 'Now',
      messageCount: messages.length,
      isActive: true
    }];
  }

  const handleChatClick = (chatId: string) => {
    if (chatId === 'current') {
      return; // Current session, no action needed
    }
    
    selectThread(chatId).catch(error => {
      console.error('Failed to select thread:', error);
    });
  };

  const handleNewChatClick = async () => {
    if (isAuthenticated) {
      try {
        await createNewThread();
      } catch (error) {
        console.error('Failed to create new thread:', error);
      }
    }
    onNewChat();
  };

  const handleDeleteClick = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (chatId === 'current') return; // Cannot delete current session
    
    if (window.confirm('Delete this conversation? This action cannot be undone.')) {
      try {
        await deleteThread(chatId);
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    if (chatId === 'current') return; // Cannot edit current session
    
    setEditingChat(chatId);
    setEditTitle(currentTitle);
  };

  const handleTitleSubmit = async () => {
    if (editingChat && editTitle.trim()) {
      try {
        await renameThread(editingChat, editTitle.trim());
      } catch (error) {
        console.error('Failed to rename thread:', error);
      }
    }
    setEditingChat(null);
    setEditTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditingChat(null);
      setEditTitle('');
    }
  };

  const handleRefreshClick = async () => {
    if (isAuthenticated && !isLoading) {
      try {
        await loadThreads();
      } catch (error) {
        console.error('Failed to refresh threads:', error);
      }
    }
  };

  return (
    <>
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: rgba(255, 255, 255, 0.4);
        }

        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        /* Smooth scrolling */
        .custom-scrollbar {
          scroll-behavior: smooth;
        }

        /* Animation for refresh button */
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Fade in animation for chat items */
        .chat-item {
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: collapsed ? "60px" : "240px",
          backgroundColor: theme.colors.sidebar,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: collapsed ? "20px 8px" : "20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {theme.logo.imageUrl && (
                <img 
                  src={theme.logo.imageUrl} 
                  alt={theme.companyName}
                  style={{
                    height: "24px",
                    width: "auto"
                  }}
                />
              )}
              {!theme.logo.useImageOnly && (
                <h1
                  style={{
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: 0,
                  }}
                >
                  {theme.companyName}
                </h1>
              )}
            </div>
          )}
          <button
            onClick={() => onToggleCollapse(!collapsed)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: collapsed ? "8px" : "20px 20px 0 20px" }}>
          <button
            onClick={handleNewChatClick}
            disabled={isAuthenticated && isLoading}
            style={{
              width: "100%",
              padding: collapsed ? "8px" : "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              cursor: isAuthenticated && isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? "0" : "8px",
              transition: "background-color 0.2s",
              opacity: isAuthenticated && isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }
            }}
          >
            <span style={{ fontSize: "16px" }}>+</span>
            {!collapsed && <span>{isAuthenticated && isLoading ? "Creating..." : "New Chat"}</span>}
          </button>
        </div>

        {/* Refresh Button - Only show when authenticated */}
        {isAuthenticated && (
          <div style={{ padding: collapsed ? "8px" : "20px 20px 0 20px" }}>
            <button
              onClick={handleRefreshClick}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: collapsed ? "8px" : "12px 16px",
                backgroundColor: "#4a5568",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: collapsed ? "0" : "14px",
                fontWeight: "500",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? "0" : "8px",
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#2d3748";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#4a5568";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              title={collapsed ? "Refresh Chat History" : undefined}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: isLoading ? "spin 1s linear infinite" : "none",
                  transformOrigin: "center",
                }}
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              {!collapsed && (
                <span>{isLoading ? "Refreshing..." : "Refresh History"}</span>
              )}
            </button>
          </div>
        )}

        {/* Status Indicator */}
        {!collapsed && (
          <div style={{
            padding: "8px 20px",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.6)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>
              {isAuthenticated ? 
                (displayThreads.length > 0 ? `${displayThreads.length} conversations` : 'Ready to chat') :
                'Sign in for history'
              }
            </span>
            {error && (
              <span style={{ color: '#ff6b6b' }} title={error}>
                ⚠️ Error
              </span>
            )}
          </div>
        )}

        {/* Chat History */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!collapsed && (
            <div
              style={{
                padding: "20px 20px 12px 20px",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "12px",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              CONVERSATIONS ({displayThreads.length})
            </div>
          )}

          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: collapsed ? "8px" : "0 20px",
              // Add smooth padding transition
              paddingRight: collapsed ? "8px" : "16px", // Slightly less padding to accommodate scrollbar
            }}
          >
            {/* Error display */}
            {error && !collapsed && (
              <div
                style={{
                  padding: "8px 12px",
                  marginBottom: "12px",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "#fecaca",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !collapsed && (
              <div
                style={{
                  padding: "12px",
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "12px",
                }}
              >
                Loading conversations...
              </div>
            )}

            {/* Authentication prompt */}
            {!isAuthenticated && !collapsed ? (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "13px",
                }}
              >
                <div style={{ marginBottom: "8px", fontSize: "24px" }}>🔒</div>
                <div>Sign in to save your chat history</div>
                <div style={{ fontSize: "11px", marginTop: "4px" }}>
                  You can still chat without signing in
                </div>
              </div>
            ) : displayThreads.length === 0 && !isLoading && !collapsed ? (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "13px",
                }}
              >
                <div style={{ marginBottom: "8px", fontSize: "24px" }}>💬</div>
                <div>No conversations yet</div>
                <div style={{ fontSize: "11px", marginTop: "4px" }}>
                  Start a new chat to begin
                </div>
              </div>
            ) : (
              displayThreads.map((thread, index) => (
                <div
                  key={thread.id}
                  className="chat-item"
                  onClick={() => handleChatClick(thread.id)}
                  onMouseEnter={() => setHoveredChat(thread.id)}
                  onMouseLeave={() => setHoveredChat(null)}
                  style={{
                    padding: collapsed ? "8px" : "12px",
                    marginBottom: "4px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor:
                      thread.isActive || activeThreadId === thread.id
                        ? "rgba(255, 255, 255, 0.15)"
                        : hoveredChat === thread.id
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                    border:
                      thread.isActive || activeThreadId === thread.id
                        ? "1px solid rgba(255, 255, 255, 0.3)"
                        : "1px solid transparent",
                    transition: "all 0.2s",
                    position: "relative",
                    // Add slight delay for animation
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {collapsed ? (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {thread.title.substring(0, 1).toUpperCase()}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        {editingChat === thread.id ? (
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            style={{
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              color: "white",
                              fontSize: "13px",
                              width: "100%",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "500",
                                color: "white",
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {thread.title}
                            </div>

                            {/* Action buttons - Only for authenticated threads */}
                            {isAuthenticated && thread.id !== 'current' && (hoveredChat === thread.id || thread.isActive) && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "4px",
                                  opacity: hoveredChat === thread.id ? 1 : 0.7,
                                }}
                              >
                                <button
                                  onClick={(e) => handleDeleteClick(e, thread.id)}
                                  style={{
                                    padding: "2px 4px",
                                    background: "rgba(239, 68, 68, 0.2)",
                                    border: "none",
                                    borderRadius: "3px",
                                    color: "#fca5a5",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                    opacity: 0.7,
                                    transition: "opacity 0.2s",
                                  }}
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {thread.lastMessage && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.6)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "2px",
                          }}
                        >
                          {thread.lastMessage}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "10px",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        <span>{thread.timestamp}</span>
                        <span>{thread.messageCount} messages</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings Button */}
        <div style={{ padding: collapsed ? "8px" : "20px" }}>
          <button
            onClick={onOpenSettings}
            style={{
              width: "100%",
              padding: collapsed ? "8px" : "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? "0" : "8px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <span>⚙️</span>
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
    </>
  );
}