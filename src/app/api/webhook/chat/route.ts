// src/app/api/webhook/chat/route.ts - UPDATED FOR NAIVE RAG INFERENCE
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Verify backend URL is set
if (!process.env.NEXT_PUBLIC_AGENTIC_RAG_URL) {
  console.error('❌ NEXT_PUBLIC_AGENTIC_RAG_URL environment variable is not set!');
}

const BACKEND_URL = process.env.NEXT_PUBLIC_AGENTIC_RAG_URL || 'http://localhost:8002'
console.log('🌐 Using backend URL:', BACKEND_URL);

// Interface for the backend request
interface ChatRequest {
  input: {
    workflow_id: string
    client_id: string
    project_id: string
    session_id: string
    input_text: string
    top_k?: number
    limit?: number
  }
}

// Interface for the backend response
interface TaskInfo {
  step_name: string
  pipeline_key: string
  task_id: string
  queue: string
  status: string
}

interface ChatResponse {
  workflow_id: string
  tasks: TaskInfo[]
}

// Interface for task result
interface TaskResult {
  task_id: string
  result: {
    workflow_id: string
    action: string
    response: {
      message_id: string
      role: string
      content: string
    }
    version: string
    webhook_response: boolean
  }
}

// Poll for task completion with exponential backoff
async function pollTaskResult(taskId: string, maxAttempts: number = 60): Promise<TaskResult | null> {
  console.log(`🔄 Starting to poll task: ${taskId}`)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Exponential backoff: start with 2s, max 10s
    const pollInterval = Math.min(2000 + (attempt * 500), 10000)
    
    try {
      console.log(`📡 Task poll attempt ${attempt + 1}/${maxAttempts}`)
      
      const response = await fetch(`${BACKEND_URL}/api/results/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`📥 Task result received:`, result)

        // Check if we have a valid response with content
        let content = result?.result?.response?.content || result?.result?.content
        
        // Handle different content formats
        if (typeof content === 'string') {
          // Remove wrapping quotes if present
          if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1)
          }
        }

        if (content && content.trim().length > 0) {
          console.log('✅ Task completed with content:', content.substring(0, 100) + '...')
          return result
        } else {
          console.log(`⚠️ Task ${attempt + 1}: No content yet, result keys:`, Object.keys(result))
        }
      } else if (response.status === 404) {
        console.log(`⏳ Task ${attempt + 1}: Not ready`)
      } else {
        console.error(`❌ Task ${attempt + 1}: Error ${response.status}`)
        if (attempt >= maxAttempts - 3) break
      }
    } catch (error) {
      console.error(`❌ Task ${attempt + 1}: Network error:`, error)
      if (attempt >= maxAttempts - 3) break
    }

    // Wait before next poll
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  console.warn('⏰ Task polling timeout for:', taskId)
  return null
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Chat webhook endpoint is active',
    backend_url: BACKEND_URL 
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Webhook: Received chat request')
    
    const body = await request.json()
    const { message, project_id, client_id, session_id, settings } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: message' 
        },
        { status: 400 }
      )
    }

    // Get the authorization header to extract the user session
    const authHeader = request.headers.get('authorization')
    let actualClientId = client_id || 'default_client'
    let actualProjectId = project_id || 'default'

    // Try to get user context from Supabase if we have auth info
    if (authHeader) {
      try {
        // Extract the JWT token from authorization header
        const token = authHeader.replace('Bearer ', '')
        
        // Get user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (user && !error) {
          console.log('🔐 Authenticated user:', user.email)
          // Use user ID as client_id if not provided
          if (actualClientId === 'default_client') {
            actualClientId = user.id
          }
        }
      } catch (authError) {
        console.warn('⚠️ Could not extract user context:', authError)
        // Continue with defaults
      }
    }

    // If we still don't have a real client_id, try from the request body
    if (actualClientId === 'default_client' && client_id) {
      actualClientId = client_id
    }

    // Prepare request payload for backend - using naive_rag_inference template
    const chatRequest: ChatRequest = {
      input: {
        workflow_id: `inference_${Date.now()}`,
        client_id: actualClientId,
        project_id: actualProjectId,
        session_id: session_id || `sess_${Date.now()}`,
        input_text: message,
        top_k: settings?.top_k || 5,
        limit: settings?.limit || 10
      }
    }

    console.log('📤 Sending request to backend:', {
      url: `${BACKEND_URL}/api/chat/naive_rag_inference`,
      payload: chatRequest
    })

    // Send request to backend using the new endpoint
    const response = await fetch(`${BACKEND_URL}/api/chat/naive_rag_inference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest)
    })

    if (!response.ok) {
      console.error('❌ Backend request failed:', response.status, await response.text())
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend request failed with status ${response.status}` 
        },
        { status: response.status }
      )
    }

    const chatResponse: ChatResponse = await response.json()
    console.log('✅ Backend response received:', chatResponse)

    // Find the save_llm_message task (this is where the final response will be)
    let finalTask = chatResponse.tasks.find(task => task.step_name === 'save_llm_message')
    
    if (!finalTask) {
      console.warn('⚠️ No save_llm_message task found, falling back to last task')
      finalTask = chatResponse.tasks[chatResponse.tasks.length - 1]
    }

    if (!finalTask) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No tasks found in backend response' 
        },
        { status: 500 }
      )
    }

    console.log('🎯 Monitoring task:', finalTask.task_id, '(', finalTask.step_name, ')')

    // Poll for task completion - focusing on the save_llm_message task
    let result = await pollTaskResult(finalTask.task_id)

    // If we don't have a result, return a default response
    if (!result) {
      result = {
        task_id: finalTask.task_id,
        result: {
          workflow_id: chatResponse.workflow_id,
          action: 'timeout',
          response: {
            message_id: 'timeout',
            role: 'assistant',
            content: "I'm processing your request. Please try again in a moment."
          },
          version: '1.0',
          webhook_response: false
        }
      }
    }

    // Extract the content from the result
    let content = result?.result?.response?.content || result?.result?.content || "I apologize, but I'm having trouble processing your request right now."
    
    // Clean up content if it's wrapped in quotes
    if (typeof content === 'string') {
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1)
      }
    }

    console.log('✅ Webhook: Returning response with content length:', content.length)

    return NextResponse.json({
      success: true,
      message: content,
      task_id: finalTask.task_id,
      workflow_id: chatResponse.workflow_id,
      step_name: finalTask.step_name
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}