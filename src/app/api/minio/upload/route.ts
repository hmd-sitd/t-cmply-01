// src/app/api/minio/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Minio from 'minio';

// Initialize MinIO client with consistent configuration
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9002,
  useSSL: false,
  accessKey: process.env.NEXT_PUBLIC_MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.NEXT_PUBLIC_MINIO_ROOT_PASSWORD || 'minioadmin',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string;
    
    if (!file || !clientId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'File, Client ID, and Project ID are required' },
        { status: 400 }
      );
    }

    // Sanitize bucket name (must be lowercase, alphanumeric with hyphens)
    const bucketName = clientId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 63);
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${projectId}/${timestamp}_${sanitizedFileName}`;
    
    console.log(`📤 Uploading file: ${bucketName}/${objectName}`);
    console.log(`📁 File size: ${file.size} bytes`);
    
    try {
      // Check if bucket exists
      let bucketExists = false;
      try {
        bucketExists = await minioClient.bucketExists(bucketName);
        console.log(`🪣 Bucket "${bucketName}" exists: ${bucketExists}`);
      } catch (checkError: any) {
        console.log(`⚠️ Error checking bucket existence: ${checkError.message}`);
        bucketExists = false;
      }
      
      if (!bucketExists) {
        console.log(`🪣 Creating bucket: ${bucketName}`);
        try {
          await minioClient.makeBucket(bucketName, 'us-east-1');
          console.log(`✅ Bucket created successfully`);
        } catch (createError: any) {
          // Ignore error if bucket already exists
          if (createError.code !== 'BucketAlreadyOwnedByYou') {
            console.error(`❌ Failed to create bucket: ${createError.message}`);
            throw createError;
          }
          console.log(`ℹ️ Bucket already exists (race condition)`);
        }
      }
      
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`📊 Buffer size: ${buffer.length} bytes`);
      
      // Upload to MinIO with metadata
      const metadata = {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Original-Name': file.name,
        'X-Upload-Date': new Date().toISOString(),
        'X-Project-Id': projectId,
        'X-Client-Id': clientId
      };
      
      await minioClient.putObject(
        bucketName,
        objectName,
        buffer,
        buffer.length,
        metadata
      );
      
      console.log(`✅ File uploaded successfully: ${bucketName}/${objectName}`);
      
      // Verify the upload by checking if object exists
      try {
        const stat = await minioClient.statObject(bucketName, objectName);
        console.log(`✅ Upload verified - Size: ${stat.size} bytes`);
      } catch (verifyError) {
        console.error(`⚠️ Could not verify upload: ${verifyError}`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        objectName,
        bucketName,
        size: buffer.length,
        metadata
      });
      
    } catch (minioError: any) {
      console.error('❌ MinIO Error:', minioError);
      console.error('Error details:', {
        code: minioError.code,
        message: minioError.message,
        stack: minioError.stack
      });
      
      if (minioError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot connect to MinIO storage service. Please ensure MinIO is running on port 9002.' 
          },
          { status: 503 }
        );
      }
      
      if (minioError.code === 'NoSuchBucket') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bucket does not exist and could not be created.' 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: minioError.message || 'Failed to upload to MinIO',
          details: minioError.code 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ General Error uploading file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process upload request',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test connection
export async function GET(request: NextRequest) {
  try {
    const buckets = await minioClient.listBuckets();
    return NextResponse.json({
      success: true,
      message: 'MinIO connection successful',
      bucketsCount: buckets.length,
      endpoint: 'localhost:9002'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      endpoint: 'localhost:9002'
    }, { status: 500 });
  }
}