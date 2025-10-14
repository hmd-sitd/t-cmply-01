// src/app/api/webhook/task/[taskId]/route.ts - COMPLETE UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_AGENTIC_RAG_URL || 'http://localhost:8002'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Checking status for task: ${taskId}`)

    const response = await fetch(`${BACKEND_URL}/api/results/${taskId}`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Task result:', result)
      
      // ENHANCED: Content extraction for task results - handle your backend format
      let extractedContent = null
      
      // Check nested response structures first
      if (result.result?.response?.content) {
        extractedContent = result.result.response.content
      } else if (result.response?.content) {
        extractedContent = result.response.content
      } else if (result.content) {
        extractedContent = result.content
      } else if (result.result?.content) {
        extractedContent = result.result.content
      }
      // NEW: Check for direct response field (your specific backend format)
      else if (result.response) {
        extractedContent = result.response
      } else if (result.result?.response) {
        extractedContent = result.result.response
      }
      
      // Handle JSON string responses (remove extra quotes)
      if (extractedContent && typeof extractedContent === 'string') {
        // Remove surrounding quotes if present
        if (extractedContent.startsWith('"') && extractedContent.endsWith('"')) {
          extractedContent = extractedContent.slice(1, -1)
        }
      }
      
      if (extractedContent) {
        console.log('📝 Found content in task result:', extractedContent.substring(0, 100) + '...')
      }
      
      return NextResponse.json({
        success: true,
        data: result,
        extracted_content: extractedContent // Add this for easier access
      })
    } else if (response.status === 404) {
      return NextResponse.json({
        success: false,
        error: 'Task not found or not completed yet',
        status: 'PENDING'
      }, { status: 404 })
    } else {
      const errorText = await response.text()
      console.error('❌ Backend error:', response.status, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

  } catch (error: any) {
    console.error('❌ Task status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}