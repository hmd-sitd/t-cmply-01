// src/app/api/workflow/preprocessing_pipeline/route.ts
// Proxy route to forward preprocessing requests to AgenticRAG backend
// This fixes CORS issues by making server-to-server calls

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_AGENTIC_RAG_URL || 'http://localhost:8002';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Preprocessing pipeline request received');
    
    // Get the request body
    const body = await request.json();
    console.log('📦 Request payload:', JSON.stringify(body, null, 2));

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/workflow/preprocessing_pipeline`;
    console.log('📤 Forwarding to backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📊 Backend response status:', response.status);

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
    console.log('✅ Preprocessing pipeline started');
    console.log('📋 Workflow ID:', result.workflow_id);
    console.log('📊 Tasks:', result.tasks?.length || 0);
    
    // Log each task for debugging
    if (result.tasks) {
      result.tasks.forEach((task: any, index: number) => {
        console.log(`   Task ${index + 1}: ${task.step_name} (${task.task_id})`);
      });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Preprocessing pipeline error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to start preprocessing pipeline',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}