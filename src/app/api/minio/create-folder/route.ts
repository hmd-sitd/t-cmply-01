import { NextRequest, NextResponse } from 'next/server';
import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9002,  // ← CHANGED FROM 9000 to 9002
  useSSL: false,
  accessKey: process.env.NEXT_PUBLIC_MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.NEXT_PUBLIC_MINIO_ROOT_PASSWORD || 'minioadmin',
});

export async function POST(request: NextRequest) {
  try {
    const { clientId, projectId } = await request.json();
    
    if (!clientId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Client ID and Project ID are required' },
        { status: 400 }
      );
    }

    const bucketName = clientId.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 63);
    const folderPath = `${projectId}/.keep`;
    
    console.log(`📁 Creating project folder: ${bucketName}/${projectId}/`);
    
    try {
      // Check if bucket exists first
      const bucketExists = await minioClient.bucketExists(bucketName);
      
      if (!bucketExists) {
        console.log(`🪣 Bucket doesn't exist, creating: ${bucketName}`);
        await minioClient.makeBucket(bucketName, 'us-east-1');
      }
      
      // Create an empty object to represent the folder
      await minioClient.putObject(
        bucketName,
        folderPath,
        Buffer.from(''),
        0,
        { 'Content-Type': 'application/octet-stream' }
      );
      
      console.log(`✅ Project folder created: ${bucketName}/${projectId}/`);
      
      return NextResponse.json({
        success: true,
        message: `Project folder ${projectId} created successfully`,
        folderPath: `${projectId}/`
      });
    } catch (minioError: any) {
      console.error('MinIO Error:', minioError);
      
      if (minioError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { success: false, error: 'Cannot connect to MinIO storage service' },
          { status: 503 }
        );
      }
      
      throw minioError;
    }
  } catch (error: any) {
    console.error('❌ Error creating project folder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project folder' },
      { status: 500 }
    );
  }
}