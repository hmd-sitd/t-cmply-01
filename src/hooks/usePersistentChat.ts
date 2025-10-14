// src/hooks/usePersistentChat.ts - FIXED VERSION
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { apiService } from '../services/api'
import type { ChatSettings } from '../types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  threadId?: string
}

export interface ChatThread {
  id: string
  title: string
  messages: ChatMessage[]
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export function usePersistentChat(projectId: string, isAuthenticated: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load thread messages function - defined before it's used
  const loadThreadMessages = useCallback(async (threadId: string) => {
    try {
      const { data: messageData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (!error && messageData) {
        const formattedMessages: ChatMessage[] = messageData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          threadId: msg.thread_id,
        }))
        
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Load threads from backend when authenticated
  const loadThreads = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const { data: threadData, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false })

      if (!error && threadData) {
        const formattedThreads: ChatThread[] = threadData.map(thread => ({
          id: thread.id,
          title: thread.title || 'Untitled Chat',
          messages: [],
          archived: thread.archived || false,
          createdAt: new Date(thread.created_at),
          updatedAt: new Date(thread.updated_at || thread.created_at),
        }))
        
        setThreads(formattedThreads)
        
        // Load messages for current thread if exists
        if (currentThreadId) {
          await loadThreadMessages(currentThreadId)
        }
      }
    } catch (error) {
      console.error('Error loading threads:', error)
    }
  }, [isAuthenticated, currentThreadId, loadThreadMessages])

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        // isAuthenticated is passed as parameter, so we don't need to set it here
      } catch (err) {
        console.warn('Auth check failed:', err)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadThreads()
      } else if (event === 'SIGNED_OUT') {
        setThreads([])
        setCurrentThreadId(undefined)
        setMessages([])
      }
    })

    return () => subscription.unsubscribe()
  }, [loadThreads])

  // Load threads when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadThreads()
    }
  }, [isAuthenticated, loadThreads])

  const createNewThread = async () => {
    if (!isAuthenticated) {
      const newThread: ChatThread = {
        id: `local-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setThreads([newThread, ...threads])
      setCurrentThreadId(newThread.id)
      setMessages([])
      return newThread.id
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single()

      if (!userData) return

      const threadId = `thread-${Date.now()}`
      
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .insert({
          id: threadId,
          user_id: userData.id,
          project_id: projectId, // Use passed projectId
          title: 'New Chat',
        })
        .select()
        .single()

      if (!error && thread) {
        const newThread: ChatThread = {
          id: thread.id,
          title: thread.title || 'New Chat',
          messages: [],
          archived: false,
          createdAt: new Date(thread.created_at),
          updatedAt: new Date(thread.created_at),
        }
        
        setThreads([newThread, ...threads])
        setCurrentThreadId(thread.id)
        setMessages([])
        return thread.id
      }
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  const selectThread = (threadId: string) => {
    setCurrentThreadId(threadId)
    
    // Load messages for this thread
    const thread = threads.find(t => t.id === threadId)
    if (thread) {
      if (isAuthenticated && !threadId.startsWith('local-')) {
        loadThreadMessages(threadId)
      } else {
        setMessages(thread.messages || [])
      }
    }
  }

 // Fix for chat message handling issues
// Apply these changes to resolve the second message problem

// 1. Fix in usePersistentChat.ts - Update the sendChatMessage function
const sendChatMessage = async (content: string, settings?: ChatSettings) => {
  // Prevent multiple simultaneous requests
  if (isLoading) {
    console.warn('⚠️ Chat is already processing a message, ignoring new request');
    return;
  }

  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date(),
    threadId: currentThreadId,
  }

  setMessages(prev => [...prev, userMessage])

  // Clean up any existing abort controller before creating new one
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  // Create new abort controller for this request
  abortControllerRef.current = new AbortController()

  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
    threadId: currentThreadId,
  }

  setMessages(prev => [...prev, assistantMessage])
  setIsLoading(true)

  try {
    // Save user message to backend if authenticated
    if (isAuthenticated && currentThreadId && !currentThreadId.startsWith('local-')) {
      await saveMessageToBackend(userMessage)
    }

    console.log('🚀 Sending chat message with project_id:', projectId);

    // Send to backend chat endpoint using the webhook API
    const response = await apiService.sendChatMessage({
      message: content,
      project_id: projectId,
      thread_id: currentThreadId,
      model_name: settings?.model_name,
      model_provider: settings?.model_provider,
      temperature: settings?.temperature,
      max_tokens: settings?.max_tokens,
    })

    console.log('📡 API Response received:', {
      success: response?.success,
      hasStream: !!response?.stream,
      hasData: !!response?.data
    });

    if (response?.success && response?.stream) {
      const reader = response.stream.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      try {
        while (true) {
          // Check if we've been aborted
          if (abortControllerRef.current?.signal.aborted) {
            console.log('📛 Chat request was aborted');
            break;
          }

          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          accumulatedText += chunk

          // Update the streaming message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedText }
                : msg
            )
          )
        }
      } finally {
        reader.releaseLock();
      }

      // Finalize the message
      const finalMessage: ChatMessage = {
        ...assistantMessage,
        content: accumulatedText,
        isStreaming: false,
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id ? finalMessage : msg
        )
      )

      // Save assistant message to backend if authenticated
      if (isAuthenticated && currentThreadId && !currentThreadId.startsWith('local-')) {
        await saveMessageToBackend(finalMessage)
      }

      console.log('✅ Chat message completed successfully');
    } else if (response?.data?.content) {
      // Handle non-streaming response
      const content = response.data.content;
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content, isStreaming: false }
            : msg
        )
      )

      // Save assistant message to backend if authenticated
      if (isAuthenticated && currentThreadId && !currentThreadId.startsWith('local-')) {
        const finalMessage = { ...assistantMessage, content, isStreaming: false };
        await saveMessageToBackend(finalMessage);
      }

      console.log('✅ Non-streaming chat message completed');
    } else {
      throw new Error(response?.error || 'Failed to get response from API');
    }

  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('❌ Chat error:', error)
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Error: ${error.message || 'Failed to get response'}`, isStreaming: false }
            : msg
        )
      )
    } else {
      console.log('📛 Chat request was aborted by user');
      // Remove the assistant message if aborted
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    }
  } finally {
    setIsLoading(false)
    // Clean up abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
  }
}

  const saveMessageToBackend = async (message: ChatMessage) => {
    if (!currentThreadId || currentThreadId.startsWith('local-')) return

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        thread_id: currentThreadId,
        role: message.role,
        content: message.content,
        created_at: message.timestamp.toISOString(),
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const clearChat = () => {
    setMessages([])
    if (currentThreadId) {
      setThreads(prev =>
        prev.map(thread =>
          thread.id === currentThreadId
            ? { ...thread, messages: [], updatedAt: new Date() }
            : thread
        )
      )
    }
  }

  const deleteThread = async (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId))
    
    if (currentThreadId === threadId) {
      setCurrentThreadId(undefined)
      setMessages([])
    }

    if (isAuthenticated && !threadId.startsWith('local-')) {
      try {
        await supabase.from('chat_threads').delete().eq('id', threadId)
      } catch (error) {
        console.error('Error deleting thread:', error)
      }
    }
  }

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  return {
    messages,
    threads,
    currentThreadId,
    activeThreadId: currentThreadId,  // Alias for compatibility
    activeMessages: messages,         // Alias for compatibility
    isAuthenticated,
    isLoading,
    sendChatMessage,
    clearChat,
    createNewThread,
    selectThread,
    deleteThread,
    stopStreaming,
    loadThreads,
  }
}