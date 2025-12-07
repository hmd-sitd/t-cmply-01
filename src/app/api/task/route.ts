// src/app/api/task/route.ts - FIXED for Next.js 15
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_AGENTIC_RAG_URL || 'http://localhost:8002';

// POST endpoint to create/submit tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📤 Submitting task to backend:', body);

    const response = await fetch(`${BACKEND_URL}/api/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
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
    console.log('✅ Task submitted:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Task submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit task'
      },
      { status: 500 }
    );
  }
}

// GET endpoint (if needed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('❌ Task GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get task'
      },
      { status: 500 }
    );
  }
}