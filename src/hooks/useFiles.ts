// src/hooks/useFiles.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { Document, UploadState } from '../types';

interface UseFilesProps {
  isBackendConnected: boolean;
  isAuthenticated: boolean;
}

export function useFiles({ isBackendConnected, isAuthenticated }: UseFilesProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    success: false,
    error: null,
    fileName: ''
  });

  const loadDocuments = useCallback(async () => {
    if (!isBackendConnected || !isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.listDocuments("default");
      console.log("Backend response:", response);
      if (response.success) {
        console.log("Documents:", response.data.documents);
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isBackendConnected, isAuthenticated]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !isBackendConnected) return;

    setUploadState({
      isUploading: true,
      success: false,
      error: null,
      fileName: files.length === 1 ? files[0].name : `${files.length} files`
    });

    try {
      for (const file of files) {
        await apiService.processDocument({
          file,
          project_id: "default",
          chunk_size: 1000,
          chunk_overlap: 200,
          enable_chunking: true,
        });
      }

      await loadDocuments();

      setUploadState({
        isUploading: false,
        success: true,
        error: null,
        fileName: files.length === 1 ? files[0].name : `${files.length} files`
      });

      // Auto-hide success after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);

    } catch (error: any) {
      console.error("Upload error:", error);

      setUploadState({
        isUploading: false,
        success: false,
        error: error.message || "Failed to upload files. Please try again.",
        fileName: ''
      });

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, error: null }));
      }, 5000);
    } finally {
      event.target.value = "";
    }
  }, [isBackendConnected, loadDocuments]);

  const deleteDocument = useCallback(async (document: Document) => {
    try {
      console.log("🗑️ FRONTEND DELETE ANALYSIS:");
      console.log("=".repeat(60));
      console.log("🎯 Backend connected:", isBackendConnected);
      console.log("📄 Document to delete:");
      console.log(JSON.stringify(document, null, 2));
      
      const documentFields = {
        object_name: document.object_name,
        filename: document.filename,
        name: document.name,
        key: document.key,
        path: document.path,
      };

      const validFields = Object.entries(documentFields)
        .filter(([key, value]) => value != null && value !== "" && value !== undefined)
        .map(([key, value]) => ({ field: key, value: String(value) }));

      if (validFields.length === 0) {
        throw new Error("Cannot delete: no valid object identifier found in document data");
      }

      const { value: objectName } = validFields[0];
      console.log(`🎯 Using object name: "${objectName}"`);

      const response = await apiService.deleteDocument("default", objectName);

      if (response && response.success) {
        console.log("📄 Delete successful, reloading documents...");
        await loadDocuments();

        setUploadState({
          isUploading: false,
          success: true,
          error: null,
          fileName: "Document deleted successfully!"
        });

        setTimeout(() => {
          setUploadState(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        throw new Error(response?.message || "Unknown error");
      }

    } catch (error: any) {
      console.error("💀 Delete operation failed:", error);
      
      let errorMessage = "Failed to delete document.\n\n";
      const message = error?.message || String(error);
      
      if (message.includes("404")) {
        errorMessage += "File not found (404). The file may have already been deleted.";
      } else if (message.includes("403")) {
        errorMessage += "Permission denied (403). The server refused to delete this file.";
      } else if (message.includes("500")) {
        errorMessage += "Server error (500). There's an issue with the backend server.";
      } else if (message.includes("Failed to fetch")) {
        errorMessage += "Network error. Cannot reach the backend server.";
      } else {
        errorMessage += `Error: ${message}`;
      }

      setUploadState({
        isUploading: false,
        success: false,
        error: errorMessage,
        fileName: ''
      });

      setTimeout(() => {
        setUploadState(prev => ({ ...prev, error: null }));
      }, 5000);
    }
  }, [isBackendConnected, loadDocuments]);

  return {
    documents,
    uploadState,
    isLoading, // Add this return value
    loadDocuments,
    handleFileUpload,
    deleteDocument
  };
}