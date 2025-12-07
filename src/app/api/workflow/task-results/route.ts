// src/app/api/workflow/task-results/route.ts - FIXED for Next.js 15
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_AGENTIC_RAG_URL || 'http://localhost:8002';

// GET endpoint to retrieve task results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required as query parameter (?taskId=...)' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching task results for:', taskId);

    const response = await fetch(`${BACKEND_URL}/api/workflow/task-results/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            status: 'NOT_FOUND',
            message: 'Task results not found or still processing' 
          },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Task results retrieved');

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Task results error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to retrieve task results'
      },
      { status: 500 }
    );
  }
}

// POST endpoint if needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📤 Posting task results:', body);

    const response = await fetch(`${BACKEND_URL}/api/workflow/task-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ POST task results error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to post task results'
      },
      { status: 500 }
    );
  }
}