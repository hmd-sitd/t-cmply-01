// ================================================================================
// FILE 1: src/app/api/minio/create-bucket/route.ts
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import * as Minio from 'minio';

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9002,  // ← CHANGED FROM 9000 to 9002
  useSSL: false,
  accessKey: process.env.NEXT_PUBLIC_MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.NEXT_PUBLIC_MINIO_ROOT_PASSWORD || 'minioadmin',
});

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Sanitize bucket name
    const bucketName = clientId.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 63);
    
    console.log(`🪣 Attempting to create bucket: ${bucketName}`);
    
    try {
      // Check if bucket already exists
      const bucketExists = await minioClient.bucketExists(bucketName);
      
      if (!bucketExists) {
        // Create the bucket
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ Bucket created: ${bucketName}`);
        
        // Set bucket policy to allow read/write for authenticated users
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: [
                's3:GetBucketLocation',
                's3:ListBucket',
                's3:ListBucketMultipartUploads'
              ],
              Resource: [`arn:aws:s3:::${bucketName}`]
            },
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: [
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
                's3:ListMultipartUploadParts',
                's3:AbortMultipartUpload'
              ],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
          ]
        };
        
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        
        return NextResponse.json({
          success: true,
          message: `Bucket ${bucketName} created successfully`,
          bucketName
        });
      } else {
        console.log(`ℹ️ Bucket already exists: ${bucketName}`);
        return NextResponse.json({
          success: true,
          message: `Bucket ${bucketName} already exists`,
          bucketName
        });
      }
    } catch (minioError: any) {
      console.error('MinIO Error details:', minioError);
      
      // Check if it's a connection error
      if (minioError.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to MinIO. Please ensure:');
        console.error('   1. MinIO is running on localhost:9000');
        console.error('   2. Docker containers are started');
        console.error('   3. MinIO credentials are correct');
        
        return NextResponse.json(
          { success: false, error: 'Cannot connect to MinIO storage service' },
          { status: 503 }
        );
      }
      
      throw minioError;
    }
  } catch (error: any) {
    console.error('❌ Error creating bucket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bucket' },
      { status: 500 }
    );
  }
}