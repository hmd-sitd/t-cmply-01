// src/hooks/useWebhookChat.ts - COMPLETE UPDATED VERSION with Enhanced Content Extraction
import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface WebhookChatRequest {
  message: string
  project_id?: string
  client_id?: string
  session_id?: string
  domain_id?: string
  settings?: {
    max_tokens?: number
    temperature?: number
    context_window?: number
    graph_depth?: number
  }
}

interface WebhookChatResponse {
  success: boolean
  message?: string
  error?: string
  workflow_id?: string
  task_id?: string
  data?: any
}

export function useWebhookChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Enhanced content extraction function
  const extractChatContent = useCallback((result: any): string | null => {
    console.log('🔍 Extracting content from webhook response...')
    
    // Comprehensive list of possible content paths for YOUR backend format
    const contentPaths = [
      // Your specific backend format - response field contains the content directly
      'data.result.response',
      'data.response', 
      'result.response',
      'response',
      
      // Standard nested response structures
      'data.result.result.response.content',
      'data.result.response.content',
      'data.result.content',
      'data.response.content',
      'data.content',
      
      // Direct message fields
      'data.message',
      'message',
      
      // Alternative nested structures
      'result.result.response.content',
      'result.response.content',
      'result.content',
      
      // Webhook response fields
      'data.result.result.response.message',
      'data.result.response.message',
      'data.result.message',
      
      // Task result patterns
      'data.task_result.content',
      'data.task_result.response.content',
      'data.task_result.result.content',
      
      // Extracted content (from task polling)
      'data.extracted_content',
      'extracted_content',
      
      // Raw content patterns
      'content',
      'response.content',
      'response.message'
    ]

    for (const path of contentPaths) {
      let content = getNestedValue(result, path)
      
      if (content && typeof content === 'string') {
        // Handle JSON string responses (remove extra quotes)
        if (content.startsWith('"') && content.endsWith('"')) {
          content = content.slice(1, -1)
        }
        
        if (content.trim().length > 0) {
          console.log(`✅ Found content at path: ${path}`)
          console.log(`📝 Content preview: ${content.substring(0, 100)}...`)
          return content.trim()
        }
      }
    }

    console.log('❌ No content found in response structure')
    return null
  }, [])

  // Helper function to safely get nested values
  const getNestedValue = useCallback((obj: any, path: string): any => {
    if (!obj || !path) return null
    
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null
      }, obj)
    } catch (error) {
      return null
    }
  }, [])

  // Helper function to log available paths for debugging
  const logAvailablePaths = useCallback((obj: any, prefix: string = '', maxDepth: number = 3): void => {
    if (maxDepth <= 0 || !obj || typeof obj !== 'object') return
    
    Object.keys(obj).forEach(key => {
      const currentPath = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        console.log(`📁 ${currentPath}: [object]`)
        logAvailablePaths(value, currentPath, maxDepth - 1)
      } else if (Array.isArray(value)) {
        console.log(`📋 ${currentPath}: [array with ${value.length} items]`)
      } else {
        const preview = typeof value === 'string' && value.length > 50 
          ? `${value.substring(0, 50)}...` 
          : value
        console.log(`📄 ${currentPath}: ${typeof value} = ${preview}`)
      }
    })
  }, [])

  // Main send message function
  const sendMessage = useCallback(async (request: WebhookChatRequest): Promise<WebhookChatResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Get client_id from user metadata or use default
      const client_id = request.client_id || 
                       user?.user_metadata?.client_id || 
                       'default_client'

      const payload = {
        message: request.message,
        project_id: request.project_id || 'default',
        client_id,
        session_id: request.session_id || `sess_${Date.now()}`,
        domain_id: request.domain_id || 'default',
        settings: request.settings || {}
      }

      console.log('🚀 Sending webhook chat request:', payload)

      const response = await fetch('/api/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('📥 Webhook result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Request failed')
      }

      // ENHANCED: Try to extract content using comprehensive approach
      let chatContent = extractChatContent(result)

      // If no content found, try polling the task if we have a task_id
      if (!chatContent && result.data?.task_id) {
        console.log('🔄 No immediate content, trying task polling...')
        
        try {
          // Wait a bit for the task to potentially complete
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const taskResult = await checkTaskStatus(result.data.task_id)
          if (taskResult?.extracted_content) {
            chatContent = taskResult.extracted_content
            console.log('✅ Got content from task polling')
          } else if (taskResult?.data) {
            // Try extracting from task data
            chatContent = extractChatContent({ data: taskResult.data })
            if (chatContent) {
              console.log('✅ Got content from task data extraction')
            }
          }
        } catch (pollError) {
          console.warn('⚠️ Task polling failed:', pollError)
        }
      }

      // If still no content, log the structure and provide fallback
      if (!chatContent) {
        console.log('⚠️ No content found in response structure:')
        logAvailablePaths(result)
        chatContent = "I received your message but couldn't extract the response content. The task may still be processing. Please try again."
      }

      return {
        success: true,
        message: chatContent,
        workflow_id: result.data?.workflow_id,
        task_id: result.data?.task_id,
        data: result.data
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Webhook chat error:', err)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, extractChatContent, logAvailablePaths])

  // Enhanced task status check
  const checkTaskStatus = useCallback(async (taskId: string) => {
    try {
      console.log(`🔍 Checking status for task: ${taskId}`)
      
      const response = await fetch(`/api/webhook/task/${taskId}`)
      if (response.ok) {
        const result = await response.json()
        console.log('📊 Task status result:', result)
        return result
      } else if (response.status === 404) {
        console.log('⏳ Task not ready yet')
        return { status: 'PENDING', message: 'Task not ready yet' }
      } else {
        console.error('❌ Task status error:', response.status)
        return { status: 'ERROR', error: `HTTP ${response.status}` }
      }
    } catch (error) {
      console.error('❌ Task status check error:', error)
      return { status: 'ERROR', error: error.message }
    }
  }, [])

  // Poll task until completion (useful for delayed responses)
  const pollTaskUntilComplete = useCallback(async (
    taskId: string, 
    maxAttempts: number = 10, 
    intervalMs: number = 3000
  ): Promise<any> => {
    console.log(`🔄 Starting to poll task ${taskId}`)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📡 Poll attempt ${attempt}/${maxAttempts}`)
      
      const result = await checkTaskStatus(taskId)
      
      // Check if we have content
      if (result.extracted_content || result.data?.extracted_content) {
        console.log('✅ Task completed with content!')
        return result
      }
      
      // Try extracting content from the task result
      if (result.data) {
        const extractedFromTask = extractChatContent({ data: result.data })
        if (extractedFromTask) {
          console.log('✅ Extracted content from task data!')
          return { ...result, extracted_content: extractedFromTask }
        }
      }
      
      // Check if task failed
      if (result.status === 'ERROR' || result.status === 'FAILED') {
        console.log('❌ Task failed')
        throw new Error(`Task failed: ${result.error || 'Unknown error'}`)
      }
      
      // Wait before next attempt (except on last attempt)
      if (attempt < maxAttempts) {
        console.log(`⏱️ Waiting ${intervalMs}ms before next poll...`)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }
    
    console.warn('⏰ Task polling timeout')
    return null
  }, [checkTaskStatus, extractChatContent])

  // Test function for debugging
  const testWebhook = useCallback(async (testMessage: string = "Hello test") => {
    console.log('🧪 Testing webhook with message:', testMessage)
    
    try {
      const result = await sendMessage({
        message: testMessage,
        project_id: 'debug',
        client_id: 'debug_client',
        session_id: `debug_${Date.now()}`,
        domain_id: 'debug',
        settings: {
          max_tokens: 100,
          temperature: 0.7
        }
      })
      
      console.log('🧪 Test result:', result)
      return result
    } catch (error) {
      console.error('🧪 Test failed:', error)
      return { success: false, error: error.message }
    }
  }, [sendMessage])

  return {
    sendMessage,
    checkTaskStatus,
    pollTaskUntilComplete,
    testWebhook,
    isLoading,
    error
  }
}