// src/services/minioService.ts
class MinIOService {
  /**
   * Create a bucket for an organization when it's created
   * Now uses Next.js API route to avoid CORS issues
   */
  async createOrganizationBucket(clientId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/minio/create-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Bucket created/exists for organization: ${data.bucketName}`);
        return true;
      }

      console.error(`Failed to create bucket: ${data.error}`);
      return false;
    } catch (error) {
      console.error('Error creating organization bucket:', error);
      return false;
    }
  }

  /**
   * Create a folder structure for a project within the organization bucket
   * Now uses Next.js API route
   */
  async createProjectFolder(clientId: string, projectId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/minio/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, projectId }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Project folder created: ${data.folderPath}`);
        return true;
      }

      console.error(`Failed to create project folder: ${data.error}`);
      return false;
    } catch (error) {
      console.error('Error creating project folder:', error);
      return false;
    }
  }

  /**
   * Upload a file to MinIO for a specific project
   * Uses Next.js API route for server-side upload
   */
  async uploadFile(
    clientId: string, 
    projectId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; objectName?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('projectId', projectId);

      // For progress tracking, we'll simulate it since fetch doesn't support upload progress
      if (onProgress) {
        onProgress(30); // Start
      }

      const response = await fetch('/api/minio/upload', {
        method: 'POST',
        body: formData,
      });

      if (onProgress) {
        onProgress(70); // Almost done
      }

      const data = await response.json();

      if (onProgress) {
        onProgress(100); // Complete
      }

      if (data.success) {
        console.log(`✅ File uploaded: ${data.objectName}`);
        return { success: true, objectName: data.objectName };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get a direct URL for file access
   * Note: This requires the bucket to be public or have appropriate policies
   */
  getFileUrl(clientId: string, objectName: string): string {
    const bucketName = this.sanitizeBucketName(clientId);
    const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost:9002';
    return `http://${minioEndpoint}/${bucketName}/${objectName}`;
  }

  /**
   * Delete a file from MinIO
   * You'll need to create an API route for this if needed
   */
  async deleteFile(clientId: string, objectName: string): Promise<boolean> {
    try {
      // TODO: Implement delete API route if needed
      console.warn('Delete file not yet implemented via API route');
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Check if a bucket exists
   * You'll need to create an API route for this if needed
   */
  async bucketExists(clientId: string): Promise<boolean> {
    try {
      // For now, we'll assume the bucket exists after creation
      // You can implement a check API route if needed
      return true;
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      return false;
    }
  }

  // Helper methods
  private sanitizeBucketName(name: string): string {
    // MinIO bucket naming rules: lowercase, alphanumeric, hyphens
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 63);
  }
}

export const minioService = new MinIOService();