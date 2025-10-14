// src/app/page.tsx - UPDATED WITH PROJECT-REQUIRED CHAT INTEGRATION
"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import AuthModal from "../components/AuthModal"
import SettingsModal from "../components/SettingsModal"
import Sidebar from "../components/Sidebar"
import ChatView from "../components/ChatView"
import FilesView from "../components/FilesView"
import AdminView from "../components/AdminView"
import SuperAdminView from "../components/SuperAdminView"
import WorkspaceView from "../components/WorkspaceView"
import ProjectFilesView from "../components/ProjectFilesView"
import Header from "../components/Header"
import { useChatSettings } from "../hooks/useChatSettings"
import { useBackendConnection } from "../hooks/useBackendConnection"
import { usePersistentChat } from "../hooks/usePersistentChat"
import { useFiles } from "../hooks/useFiles"
import { useAdminPermissions } from "../hooks/useAdminPermissions"
import { useAuth } from "../hooks/useAuth"
import { apiService } from "../services/api"
import type { ChatSettings } from "../types"
import ErrorBoundary from "../components/ErrorBoundary"
import type { ChatMessage } from "../types"
import type { ChatMessage as PersistentChatMessage } from "../hooks/usePersistentChat"

declare global {
  interface Window {
    persistentChatSendMessage?: (message: string) => Promise<void>;
  }
}

export default function AIAssistant() {
  // Core state
  const [activeTab, setActiveTab] = useState<"chat" | "workspace" | "files" | "admin">("chat")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [threadTitle, setThreadTitle] = useState<string>("New Chat");
  
  // Super admin routing state
  const [userType, setUserType] = useState<string | null>(null);
  const [userTypeLoading, setUserTypeLoading] = useState(false);
  
  // Project state - ENHANCED FOR CHAT INTEGRATION
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  
  // Chat state - ENHANCED
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Hooks
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { chatSettings, saveSettings } = useChatSettings()
  const { isBackendConnected, connectionError, checkBackendConnection } = useBackendConnection()
  const { isAdmin } = useAdminPermissions(isAuthenticated)
  
  // Chat hooks - using selectedProjectId as project context
  const { 
    threads,
    activeThreadId,
    activeMessages,
    isLoading: chatLoading, 
    sendChatMessage: originalSendChatMessage, 
    createNewThread,
    selectThread,
    loadThreads,
  } = usePersistentChat(selectedProjectId || "default", isAuthenticated)
  
  // Files hook - only initialize if authenticated
  const { 
    documents, 
    loadDocuments, 
    handleFileUpload, 
    deleteDocument,
    uploadState,
    isLoading: filesLoading
  } = useFiles({ 
    isBackendConnected, 
    isAuthenticated 
  })

  // Check user type for routing
  const checkUserType = useCallback(async () => {
    console.log('🔍 checkUserType called, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      try {
        setUserTypeLoading(true);
        console.log('🔍 Calling getCurrentUserType API...');
        const userInfo = await apiService.getCurrentUserType();
        console.log('🔍 API response:', userInfo);
        const detectedUserType = userInfo?.user_type || null;
        console.log('🔍 Detected user type:', detectedUserType);
        setUserType(detectedUserType);
        
        // Log the routing decision
        if (detectedUserType === 'super_admin') {
          console.log('🔥 ROUTING TO SUPER ADMIN INTERFACE');
        } else {
          console.log('📱 ROUTING TO REGULAR INTERFACE, userType:', detectedUserType);
        }
      } catch (error) {
        console.error('❌ Error checking user type:', error);
        setUserType(null);
      } finally {
        setUserTypeLoading(false);
      }
    } else {
      console.log('❌ Not authenticated, clearing user type');
      setUserType(null);
      setUserTypeLoading(false);
    }
  }, [isAuthenticated]);

  // Message conversion helper
  const convertMessages = useCallback((persistentMessages: PersistentChatMessage[]): ChatMessage[] => {
    if (!persistentMessages || !Array.isArray(persistentMessages)) {
      return [];
    }
    return persistentMessages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  }, []);

  // Memoize chat messages to prevent unnecessary re-renders
  const memoizedChatMessages = useMemo(() => {
    return chatMessages.length > 0 ? chatMessages : convertMessages(activeMessages);
  }, [chatMessages, activeMessages, convertMessages]);

  // ENHANCED: Project-aware chat message handler
// Fix for page.tsx - Replace your existing sendChatMessage function

const sendChatMessage = useCallback(async (message: string, settings: ChatSettings) => {
  // Prevent multiple simultaneous requests
  if (isChatLoading) {
    console.warn('⚠️ Chat is already processing, ignoring request');
    return;
  }

  // CRITICAL: Check if project is selected before sending
  if (!selectedProjectId || !selectedProject) {
    console.error('❌ Cannot send message: No project selected');
    throw new Error('Please select a project from sources before sending a message');
  }

  console.log('🎯 Main Page: Sending chat message with project context:', {
    project: selectedProjectName,
    projectId: selectedProjectId,
    message: message.substring(0, 50) + '...',
    settings: settings.model_name
  });

  setIsChatLoading(true);

  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: message,
    timestamp: new Date(),
    threadId: currentThreadId,
  };

  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
    threadId: currentThreadId,
  };

  // Add messages to local state immediately
  setChatMessages(prev => [...prev, userMessage, assistantMessage]);

  try {
    console.log('🚀 Main Page: Sending chat message');
    console.log('📋 Using project:', { id: selectedProjectId, name: selectedProjectName });

    // Send to backend with project context
    const response = await apiService.sendChatMessage({
      message,
      project_id: selectedProjectId, // 🎯 PASS THE SELECTED PROJECT
      client_id: user?.user_metadata?.client_id,
      session_id: currentThreadId,
      model_name: settings.model_name,
      model_provider: settings.model_provider,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
    });

    console.log('📡 Main Page: API Response:', {
      success: response?.success,
      hasStream: !!response?.stream,
      hasData: !!response?.data,
      error: response?.error
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to send message');
    }

    if (response?.stream) {
      const reader = response.stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedText += chunk;

          // Update the streaming message
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedText }
                : msg
            )
          );
        }

        // Finalize the message
        setChatMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: accumulatedText, isStreaming: false }
              : msg
          )
        );

        console.log('✅ Main Page: Chat message completed successfully');
        console.log('📝 Project context used:', selectedProjectName);
        
      } finally {
        reader.releaseLock();
      }
    } else {
      // Handle non-streaming response
      const content = response?.data?.content || 'No response received';
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content, isStreaming: false }
            : msg
        )
      );
    }
  } catch (error: any) {
    console.error('❌ Main Page: Chat message failed:', error);
    
    // Update the assistant message with error instead of removing it
    setChatMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: `Error: ${error.message || 'Failed to send message'}`, isStreaming: false }
          : msg
      )
    );
    
    throw error;
  } finally {
    setIsChatLoading(false);
  }
}, [selectedProjectId, selectedProjectName, selectedProject, currentThreadId, user, apiService]);

// Also update your validateChatRequirements function to include the loading check:
const validateChatRequirements = useCallback((): { canChat: boolean; reason?: string } => {
  if (isChatLoading) {
    return { canChat: false, reason: 'Please wait for the current message to complete' };
  }
  
  if (!isAuthenticated) {
    return { canChat: false, reason: 'Please sign in to chat' };
  }
  
  if (!isBackendConnected) {
    return { canChat: false, reason: 'Backend connection required' };
  }
  
  if (!chatSettings.model_name) {
    return { canChat: false, reason: 'Please select a model in settings' };
  }
  
  if (!selectedProjectId) {
    return { canChat: false, reason: 'Please select a project from sources' };
  }
  
  return { canChat: true };
}, [isChatLoading, isAuthenticated, isBackendConnected, chatSettings.model_name, selectedProjectId]);

  // Check user type when authentication status changes
  useEffect(() => {
    if (isAuthenticated && !userType && !userTypeLoading) {
      console.log('🔄 Authentication detected, checking user type...');
      const timeoutId = setTimeout(() => {
        checkUserType();
      }, 100);
      return () => clearTimeout(timeoutId);
    } else if (!isAuthenticated) {
      console.log('❌ Not authenticated, clearing user type');
      setUserType(null);
      setUserTypeLoading(false);
    } else if (isAuthenticated && userType) {
      console.log('✅ Already authenticated with user type:', userType);
    }
  }, [isAuthenticated, userType, userTypeLoading, checkUserType]);

  // Clear chat messages when project changes
  useEffect(() => {
    // Only clear if we actually have a different project
    if (selectedProjectId) {
      console.log('Project changed, clearing chat messages for:', selectedProjectName);
      setChatMessages([]);
    }
  }, [selectedProjectId]); // Only depend on selectedProjectId, not selectedProjectName

  // Backend connection check
  useEffect(() => {
    if (isMounted) {
      console.log('Checking backend connection...');
      checkBackendConnection();
    }
  }, [isMounted]); 

  // Auto-open auth modal if not authenticated and not loading
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !authModalOpen) {
      setAuthModalOpen(true);
    }
  }, [authLoading, isAuthenticated, authModalOpen]);

  // Load documents only when files tab is active and authenticated
  const handleLoadDocuments = useCallback(() => {
    if (isAuthenticated && activeTab === "files") {
      console.log('Loading documents for files tab...');
      loadDocuments();
    }
  }, [isAuthenticated, activeTab, loadDocuments]);

  // Chat handlers
  const handleNewChat = useCallback(async () => {
    console.log('🔄 Starting new chat');
    setChatMessages([]);
    setCurrentThreadId(undefined);
    setThreadTitle("New Chat");
    
    if (isAuthenticated) {
      try {
        await createNewThread();
      } catch (error) {
        console.warn('Failed to create new thread:', error);
      }
    }
  }, [createNewThread, isAuthenticated]);

  const handleThreadSelect = useCallback((threadId: string | null, messages: ChatMessage[]) => {
    // Prevent loops by checking if we're already on this thread
    if (threadId === currentThreadId) {
      return;
    }
    
    if (threadId) {
      setCurrentThreadId(threadId);
      selectThread(threadId);
      
      // Only update messages if they're different
      setChatMessages(prevMessages => {
        // Simple check to avoid unnecessary updates
        if (prevMessages.length !== messages.length) {
          return messages;
        }
        return prevMessages;
      });
      
      if (messages.length > 0) {
        const title = `Chat from ${new Date(messages[0].timestamp).toLocaleDateString()}`;
        setThreadTitle(title);
      }
    } else {
      setCurrentThreadId(undefined);
      setThreadTitle("New Chat");
      setChatMessages([]);
    }
  }, [selectThread, currentThreadId]);

  const handleSendMessage = useCallback(async (message: string) => {
    return sendChatMessage(message, chatSettings);
  }, [sendChatMessage, chatSettings]);

  const handlePersistentChatMessage = useCallback(async (message: string) => {
    try {
      await sendChatMessage(message, chatSettings);
    } catch (error) {
      console.error('Error sending message from persistent chat:', error);
    }
  }, [sendChatMessage, chatSettings]);

  // Global chat message handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.persistentChatSendMessage = handlePersistentChatMessage;
      return () => {
        delete window.persistentChatSendMessage;
      };
    }
  }, [handlePersistentChatMessage]);

  // Auth handlers
  const handleAuthSuccess = useCallback(() => {
    console.log('Authentication success triggered')
    setAuthModalOpen(false)
    if (!userType) {
      console.log('🔄 Rechecking user type after auth success')
      checkUserType();
    } else {
      console.log('✅ User type already set:', userType, '- skipping recheck')
    }
  }, [checkUserType, userType])

  const handleLogout = useCallback(async () => {
    try {
      console.log('Page logout handler called');
      
      // Reset user type state
      setUserType(null);
      setUserTypeLoading(false);
      
      // Reset other state
      setActiveTab("chat");
      setCurrentThreadId(undefined);
      setThreadTitle("New Chat");
      setSelectedProjectId(null);
      setSelectedProjectName("");
      setSelectedProject(null);
      setChatMessages([]);
      console.log('Page state reset complete');
    } catch (error) {
      console.error('Error resetting page state:', error);
    }
  }, []);

  // Super admin logout handler
  const handleSuperAdminLogout = useCallback(async () => {
    try {
      await apiService.logout();
      handleLogout();
    } catch (error) {
      console.error('Super admin logout error:', error);
      handleLogout();
    }
  }, [handleLogout]);

  // Settings handlers
  const handleOpenSettings = useCallback(() => {
    setSettingsModalOpen(true)
  }, [])

  const handleSaveSettings = useCallback((settings: ChatSettings) => {
    saveSettings(settings)
    setSettingsModalOpen(false)
  }, [saveSettings])

  // Admin handlers
  const handleExitAdmin = useCallback(() => {
    setActiveTab("chat")
  }, [])

  // ENHANCED: Project handlers with chat integration
  const handleSelectProject = useCallback((projectId: string, projectName: string) => {
    console.log('🎯 Project selected:', { projectId, projectName });
    
    // Handle clearing selection
    if (!projectId || !projectName) {
      setSelectedProjectId(null);
      setSelectedProjectName("");
      setSelectedProject(null);
      setChatMessages([]);
      return;
    }
    
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setSelectedProject({ id: projectId, name: projectName });
    
    // Clear existing chat messages when switching projects
    setChatMessages([]);
    
    // Switch to chat tab when project is selected
    setActiveTab("chat");
  }, []);

  const handleBackToWorkspace = useCallback(() => {
    console.log('🔄 Returning to workspace overview');
    setSelectedProjectId(null);
    setSelectedProjectName("");
    setSelectedProject(null);
    setChatMessages([]);
  }, []);

  const handleProjectFileUpload = useCallback(async (files: FileList) => {
    if (!selectedProjectId) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await apiService.uploadFile({
          project_id: selectedProjectId,
          filename: file.name,
          file_size: file.size,
          content_type: file.type,
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
  }, [selectedProjectId]);

  // Loading state
  if (authLoading || userTypeLoading) {
    console.log('Loading state:', { authLoading, userTypeLoading, isAuthenticated, userType });
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#5F249F',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Loading... {authLoading ? 'Auth' : ''} {userTypeLoading ? 'UserType' : ''}
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Route super admins to dedicated interface
  if (isAuthenticated && userType === 'super_admin' && !userTypeLoading) {
    console.log('RENDERING SUPER ADMIN VIEW');
    return (
      <ErrorBoundary>
        <SuperAdminView onLogout={handleSuperAdminLogout} />
      </ErrorBoundary>
    );
  }

  // Regular users and organization admins get the standard interface
  console.log('RENDERING REGULAR INTERFACE for user type:', userType);
  return (
    <ErrorBoundary>
      <div style={{ 
        display: "flex", 
        height: "100vh", 
        backgroundColor: "#f9fafb",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          onNewChat={handleNewChat}
          chatMessages={memoizedChatMessages}
          onOpenSettings={handleOpenSettings}
          projectId={selectedProjectId || "default"}
          onChatHistoryLoaded={(threads) => console.log('Chat history loaded:', threads.length)}
          onActiveThreadChanged={handleThreadSelect}
          onSendMessageToPersistentChat={handlePersistentChatMessage}
        />

        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          marginLeft: sidebarCollapsed ? "60px" : "280px",
          transition: "margin-left 0.3s ease"
        }}>
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isBackendConnected={isBackendConnected}
            connectionError={connectionError}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            onAuthModalOpen={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          <div style={{ flex: 1, overflow: "hidden" }}>
            {activeTab === "chat" && (
              <ChatView
                chatMessages={chatMessages.length > 0 ? chatMessages : convertMessages(activeMessages)}
                isLoading={isChatLoading || chatLoading}
                isAuthenticated={isAuthenticated}
                isBackendConnected={isBackendConnected}
                chatSettings={chatSettings}
                onSendMessage={handleSendMessage}
                onOpenSettings={handleOpenSettings}
                selectedProject={selectedProject}
                onSelectProject={handleSelectProject}
              />
            )}

            {activeTab === "workspace" && (
              selectedProjectId ? (
                <ProjectFilesView
                  projectId={selectedProjectId}
                  projectName={selectedProjectName}
                  onBack={handleBackToWorkspace}
                  onFileUpload={handleProjectFileUpload}
                />
              ) : (
                <WorkspaceView
                  onSelectProject={handleSelectProject}
                />
              )
            )}

            {activeTab === "files" && (
              <FilesView
                documents={documents}
                onFileUpload={handleFileUpload}
                onDeleteDocument={deleteDocument}
                uploadState={uploadState}
                isLoading={filesLoading}
                isAuthenticated={isAuthenticated}
                onLoadDocuments={handleLoadDocuments}
              />
            )}

            {activeTab === "admin" && (
              <AdminView onExitAdmin={handleExitAdmin} />
            )}
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          currentSettings={chatSettings}
          onSave={handleSaveSettings}
        />
      </div>
    </ErrorBoundary>
  )
}