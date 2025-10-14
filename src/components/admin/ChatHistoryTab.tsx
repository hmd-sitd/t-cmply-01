"use client"

import React, { useState, useEffect } from 'react';
import { currentTheme } from '../../config/themes';
import { apiService } from '../../services/api';

interface ChatHistoryTabProps {
  onError: (error: string) => void;
}

interface ChatThread {
  id: string;
  title: string;
  project_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
  message_count: number;
  last_message_at?: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model_name?: string;
  tokens_used?: number;
}

export default function ChatHistoryTab({ onError }: ChatHistoryTabProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalThreads, setTotalThreads] = useState(0);

  useEffect(() => {
    loadChatThreads();
  }, []);

  const loadChatThreads = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getChatThreads(undefined, 0, 50);
      if (response.success) {
        setThreads(response.data.conversations || []);
        setTotalThreads(response.data.total_count || 0);
      } else {
        throw new Error(response.message || 'Failed to load chat threads');
      }
    } catch (error: any) {
      console.error('Failed to load chat threads:', error.message);
      onError(`Failed to load chat threads: ${error.message}`);
      setThreads([]);
      setTotalThreads(0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await apiService.getChatThread(threadId);
      if (response.success) {
        setMessages(response.data.messages || []);
      } else {
        throw new Error(response.message || 'Failed to load messages');
      }
    } catch (error: any) {
      console.error('Failed to load thread messages:', error.message);
      onError(`Failed to load messages: ${error.message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setSelectedThread(thread);
    loadThreadMessages(thread.id);
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this conversation thread? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteChatThread(threadId);
      if (response.success) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (selectedThread?.id === threadId) {
          setSelectedThread(null);
          setMessages([]);
        }
        setTotalThreads(prev => prev - 1);
      } else {
        throw new Error(response.message || 'Failed to delete thread');
      }
    } catch (error: any) {
      onError(`Failed to delete thread: ${error.message}`);
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 200px)", gap: "24px" }}>
      {/* Threads List */}
      <div style={{
        width: "400px",
        backgroundColor: currentTheme.colors.surface,
        borderRadius: "8px",
        border: `1px solid ${currentTheme.colors.grayLight}`,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: `1px solid ${currentTheme.colors.grayLight}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: currentTheme.colors.textDark,
              margin: "0",
            }}>
              Chat Threads ({totalThreads})
            </h3>
            <button
              onClick={loadChatThreads}
              disabled={isLoading}
              style={{
                padding: "6px 12px",
                backgroundColor: currentTheme.colors.buttonPrimary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isLoading ? "⟳" : "↻"} Refresh
            </button>
          </div>
          
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 32px 8px 12px",
                border: `1px solid ${currentTheme.colors.inputBorder}`,
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: currentTheme.colors.inputBackground,
                color: currentTheme.colors.textDark,
              }}
            />
            <SearchIcon />
          </div>
        </div>

        {/* Threads List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {isLoading ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                border: `3px solid ${currentTheme.colors.grayLight}`,
                borderTop: `3px solid ${currentTheme.colors.primary}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: currentTheme.colors.textMedium,
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                backgroundColor: currentTheme.colors.backgroundAlt,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <MessageIcon />
              </div>
              <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>
                {searchTerm ? 'No matching conversations' : 'No chat history yet'}
              </div>
              <div style={{ fontSize: "14px" }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Conversations will appear here as users chat with the AI'}
              </div>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThread?.id === thread.id}
                onSelect={() => handleThreadSelect(thread)}
                onDelete={() => handleDeleteThread(thread.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div style={{
        flex: 1,
        backgroundColor: currentTheme.colors.surface,
        borderRadius: "8px",
        border: `1px solid ${currentTheme.colors.grayLight}`,
        display: "flex",
        flexDirection: "column",
      }}>
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div style={{
              padding: "20px",
              borderBottom: `1px solid ${currentTheme.colors.grayLight}`,
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: currentTheme.colors.textDark,
                margin: "0 0 8px 0",
              }}>
                {selectedThread.title}
              </h3>
              <div style={{
                display: "flex",
                gap: "16px",
                fontSize: "14px",
                color: currentTheme.colors.textMedium,
              }}>
                <span>{selectedThread.message_count} messages</span>
                <span>User ID: {selectedThread.user_id}</span>
                <span>Created: {new Date(selectedThread.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {isLoadingMessages ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    border: `3px solid ${currentTheme.colors.grayLight}`,
                    borderTop: `3px solid ${currentTheme.colors.primary}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px",
                  color: currentTheme.colors.textMedium,
                }}>
                  No messages in this thread
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {messages.map(message => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            textAlign: "center",
            color: currentTheme.colors.textMedium,
          }}>
            <div>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: currentTheme.colors.backgroundAlt,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <MessageIcon size={32} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: "8px" }}>
                Select a conversation
              </div>
              <div style={{ fontSize: "14px" }}>
                Choose a thread from the list to view its messages
              </div>
            </div>
          </div>
        )}
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

interface ThreadItemProps {
  thread: ChatThread;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ThreadItem({ thread, isSelected, onSelect, onDelete }: ThreadItemProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? `${currentTheme.colors.primary}20` : "transparent",
        border: isSelected ? `1px solid ${currentTheme.colors.primary}` : "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: "4px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "8px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "500",
            color: currentTheme.colors.textDark,
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {thread.title}
          </div>
          <div style={{
            fontSize: "12px",
            color: currentTheme.colors.textMedium,
            marginBottom: "4px",
          }}>
            {thread.message_count} messages • {thread.total_tokens || 0} tokens • User {thread.user_id}
          </div>
          <div style={{
            fontSize: "11px",
            color: currentTheme.colors.textLight,
          }}>
            {thread.last_message_at 
              ? `Last: ${new Date(thread.last_message_at).toLocaleDateString()}`
              : `Created: ${new Date(thread.created_at).toLocaleDateString()}`
            }
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: currentTheme.colors.error,
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            transition: "background-color 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${currentTheme.colors.error}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Delete thread"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: ChatMessage;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      maxWidth: "100%",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "12px 16px",
        borderRadius: "16px",
        backgroundColor: isUser ? currentTheme.colors.primary : currentTheme.colors.backgroundAlt,
        color: isUser ? "white" : currentTheme.colors.textDark,
        border: isUser ? "none" : `1px solid ${currentTheme.colors.grayLight}`,
      }}>
        <div style={{
          fontSize: "12px",
          fontWeight: "500",
          marginBottom: "4px",
          opacity: 0.8,
        }}>
          {isUser ? "User" : "AI Assistant"}
          {message.model_name && (
            <span style={{ marginLeft: "8px", fontWeight: "400" }}>
              ({message.model_name})
            </span>
          )}
        </div>
        <div style={{
          fontSize: "14px",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
        }}>
          {message.content}
        </div>
        {message.tokens_used && (
          <div style={{
            fontSize: "11px",
            marginTop: "4px",
            opacity: 0.7,
          }}>
            {message.tokens_used} tokens
          </div>
        )}
      </div>
      <div style={{
        fontSize: "11px",
        color: currentTheme.colors.textLight,
        marginTop: "4px",
      }}>
        {new Date(message.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

// Icons
const SearchIcon = () => (
  <svg style={{
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "16px",
    height: "16px",
    color: currentTheme.colors.textMedium,
  }}
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const MessageIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);