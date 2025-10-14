// src/types/index.ts - COMPLETE UPDATED VERSION

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSettings {
  model_name: string;
  model_provider: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  memory_max_tokens: number;
  memory_window_size: number;
  fact_extraction_interval: number;
  fact_extraction_context: number;
}

export interface Document {
  object_name: string;
  display_name?: string; 
  filename?: string;
  size: number;
  content_type: string;
  last_modified?: string;
  upload_timestamp?: number; 
  name?: string;
  key?: string;
  path?: string;
  file_size?: number;
  lastModified?: string;
  modified?: string;
}

export interface UploadState {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  fileName: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// AUTH TYPES - ADDED
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface ChatRequest {
  message: string;
  thread_id: string;
  project_id: string;
  model?: string;
  model_name?: string;
  model_provider?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  memory_max_tokens?: number;
  memory_window_size?: number;
  fact_extraction_interval?: number;
  fact_extraction_context?: number;
}

export interface SearchResult {
  content: string;
  metadata: {
    filename: string;
    project_id: string;
    chunk_id: string;
  };
  score: number;
}

export interface ModelConfig {
  current: {
    model_name: string;
    model_provider: string;
    temperature: number;
    max_tokens: number;
  };
  defaults: {
    model_name: string;
    model_provider: string;
    system_prompt: string;
    memory_max_tokens: number;
    fact_extraction_interval: number;
    fact_extraction_context: number;
  };
  available_models: string[];
  available_providers: string[];
}

export interface RBACResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  scope: 'system' | 'client' | 'project';
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
  user_count: number;
  permission_count: number;
  client_id?: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: 'system' | 'client' | 'project';
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  expires_at?: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by: number;
  role: Role;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  expires_at?: string;
  is_active: boolean;
  granted_at: string;
  granted_by: number;
  permission: Permission;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  scope: 'system' | 'client' | 'project';
  permission_ids: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreatePermissionRequest {
  name: string;
  description: string;
  resource: string;
  action: string;
  is_active?: boolean;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
}

export interface BulkRoleAssignRequest {
  user_id: number;
  role_ids: number[];
  assigned_by: number;
}

export interface BulkPermissionAssignRequest {
  role_id: number;
  permission_ids: number[];
  granted_by: number;
}

// CHAT HISTORY TYPES
export interface ChatThread {
  id: string;
  title: string;
  project_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
  message_count: number;
  last_message_at?: string;
}

export interface ChatMessageRecord {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model_name?: string;
  tokens_used?: number;
  metadata?: Record<string, any>;
}

export interface CreateThreadRequest {
  project_id: string;
  title?: string;
}

export interface UpdateThreadRequest {
  title?: string;
  archived?: boolean;
}

export interface ChatAnalytics {
  total_messages: number;
  total_threads: number;
  tokens_used: number;
  models_used: Record<string, number>;
  daily_usage: Array<{
    date: string;
    message_count: number;
    tokens_used: number;
  }>;
}

declare global {
  interface Window {
    persistentChatSendMessage?: (message: string) => Promise<void>;
  }
}

// ADMIN TYPES
export interface AdminUser extends User {
  roles: Role[];
}

export interface SystemHealth {
  system_status: string;
  total_users: number;
  active_users: number;
  total_roles: number;
  total_permissions: number;
  last_updated: string;
}

export interface RoleAnalytics {
  role_name: string;
  user_count: number;
  permission_count: number;
}

export interface PermissionAnalytics {
  permission_name: string;
  role_count: number;
  resource: string;
  action: string;
}

// PERMISSION CHECK TYPES
export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface AdminPermissions {
  isAdmin: boolean;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}