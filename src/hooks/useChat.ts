// src/hooks/useChat.ts
import { useState, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import type { ChatMessage, ChatSettings } from '../types';

interface UseChatProps {
  chatSettings: ChatSettings;
  isBackendConnected: boolean;
  isAuthenticated: boolean;
  onThreadCreated?: (threadId: string) => void;
}

export function useChat({ 
  chatSettings, 
  isBackendConnected, 
  isAuthenticated,
  onThreadCreated 
}: UseChatProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const threadId = useRef<string | undefined>(undefined);

  // Set thread ID from external source (e.g., persistent chat)
  const setThreadId = useCallback((newThreadId: string | undefined) => {
    threadId.current = newThreadId;
  }, []);

  // Load historical messages (when switching threads) - convert timestamp format
const loadHistoricalMessages = useCallback((messages: ChatMessage[]) => {
  console.log('Loading historical messages:', messages.length);
  
  // Ensure timestamps are in the correct format for the UI and debug role issues
  const convertedMessages = messages.map((msg, index) => {
    console.log(`Message ${index}:`, {
      role: msg.role,
      roleType: typeof msg.role,
      timestamp: msg.timestamp,
      timestampType: typeof msg.timestamp,
      content: msg.content?.substring(0, 50) + '...'
    });
    
    // Ensure role is properly mapped
    let role: "user" | "assistant" = "assistant";
    if (typeof msg.role === "string") {
      const roleStr = msg.role.trim().toLowerCase();
      if (roleStr === "user" || roleStr === "human") {
        role = "user";
      } else {
        role = "assistant";
      }
    }
    
    // Ensure timestamp is a Date object
    let timestamp: Date;
    if (msg.timestamp instanceof Date) {
      timestamp = msg.timestamp;
    } else if (typeof msg.timestamp === "string") {
      timestamp = new Date(msg.timestamp);
      // Check if the date is valid
      if (isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp for message:', msg.timestamp);
        timestamp = new Date(); // Fallback to current time
      }
    } else {
      console.warn('Unknown timestamp format:', msg.timestamp);
      timestamp = new Date(); // Fallback to current time
    }
    
    const convertedMessage = {
      ...msg,
      role,
      timestamp
    };
    
    console.log(`Converted message ${index}:`, {
      role: convertedMessage.role,
      timestamp: convertedMessage.timestamp,
      timestampValid: !isNaN(convertedMessage.timestamp.getTime())
    });
    
    return convertedMessage;
  });
  
  // SORT CONVERTED MESSAGES BY TIMESTAMP
  const sortedMessages = convertedMessages.sort((a, b) => {
    const timeA = a.timestamp.getTime();
    const timeB = b.timestamp.getTime();
    return timeA - timeB; // Ascending order (oldest first)
  });
  
  console.log('All converted and sorted messages:', sortedMessages);
  setChatMessages(sortedMessages); // Use sorted messages
}, []);

  // Clear chat (for new conversations)
  const clearChat = useCallback(() => {
    setChatMessages([]);
    threadId.current = undefined;
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    if (!isBackendConnected) {
      throw new Error("Backend is not connected. Please ensure the AI Assistant API is running at http://localhost:8003");
    }

    if (!isAuthenticated) {
      throw new Error("Please sign in to use the chat feature.");
    }

    if (!chatSettings.model_name || chatSettings.model_name === "Select model") {
      throw new Error("Please select an AI model in Settings before sending a message.");
    }

    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(), // Use Date object for UI consistency
    };

    const assistantChatMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(), // Use Date object for UI consistency
      isStreaming: true,
    };

    setChatMessages((prev) => [...prev, userChatMessage, assistantChatMessage]);
    setIsLoading(true);

    try {
      console.log("Sending message with model:", chatSettings.model_name);
      
      const stream = await apiService.sendChatMessage({
        message: userMessage,
        thread_id: threadId.current,
        project_id: "default",
        model_name: chatSettings.model_name,
        model_provider: chatSettings.model_provider,
        temperature: chatSettings.temperature,
        max_tokens: chatSettings.max_tokens,
        system_prompt: chatSettings.system_prompt,
        memory_max_tokens: chatSettings.memory_max_tokens,
        memory_window_size: chatSettings.memory_window_size,
        fact_extraction_interval: chatSettings.fact_extraction_interval,
        fact_extraction_context: chatSettings.fact_extraction_context,
      });

      if (!stream) {
        throw new Error("No response stream received");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let response = "";
      let hasReceivedData = false;
      let streamTimeout: NodeJS.Timeout | null = null;

      const updateChatMessage = (content: string, isStreaming = true) => {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantChatMessage.id
              ? { ...msg, content, isStreaming }
              : msg
          )
        );
      };

      // Set up a timeout to handle potential stream issues
      streamTimeout = setTimeout(() => {
        if (!hasReceivedData) {
          console.warn("Stream timeout - no data received");
          updateChatMessage("Sorry, there was a problem processing your request. Please try again.", false);
          setIsLoading(false);
        }
      }, 30000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("Stream completed");
            break;
          }

          hasReceivedData = true;
          if (streamTimeout) {
            clearTimeout(streamTimeout);
            streamTimeout = null;
          }

          const chunk = decoder.decode(value, { stream: true });
          response += chunk;
          
          updateChatMessage(response, true);
        }
      } finally {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        reader.releaseLock();
      }

      // Mark streaming as complete
      updateChatMessage(response, false);

      // If this was a new thread, notify parent component
      if (!threadId.current && onThreadCreated) {
        // Generate a temporary thread ID that will be replaced by the real one
        const tempThreadId = `thread-${Date.now()}`;
        threadId.current = tempThreadId;
        onThreadCreated(tempThreadId);
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantChatMessage.id
            ? {
                ...msg,
                content: `Error: ${error.message}`,
                isStreaming: false
              }
            : msg
        )
      );
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    chatSettings,
    isBackendConnected,
    isAuthenticated,
    onThreadCreated
  ]);

  return {
    chatMessages,
    isLoading,
    sendMessage,
    clearChat,
    loadHistoricalMessages,
    setThreadId,
  };
}