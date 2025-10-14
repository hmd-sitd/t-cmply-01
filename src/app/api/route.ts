import { NextRequest, NextResponse } from 'next/server'

// Point proxy to AgenticRAG/processing backend (fix CORS by proxying via Next.js)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8002'

async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const url = `${BACKEND_URL}/${path}`
    
    console.log(`📄 Proxying ${request.method} request to: ${url}`)

    let body: ArrayBuffer | FormData | string | undefined = undefined
    
    if (request.method !== 'GET') {
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        body = await request.formData()
      } else if (contentType.includes('application/json')) {
        body = await request.text()
      } else {
        body = await request.arrayBuffer()
      }
    }

    const forwardHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        forwardHeaders[key] = value
      }
    })

    const response = await fetch(url, {
      method: request.method,
      headers: forwardHeaders,
      body: body,
    })

    console.log(`✅ Backend responded with status: ${response.status}`)

    // Handle streaming responses (for chat)
    if (response.headers.get('content-type')?.includes('text/plain') && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE }