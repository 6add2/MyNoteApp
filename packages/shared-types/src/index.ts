// ============================================
// User Types
// ============================================

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date | string;
  lastLogin: Date | string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultWorkspace?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  message?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Workspace Types
// ============================================

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date | string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultView: 'grid' | 'list';
  color: string;
}

// ============================================
// Note Types
// ============================================

export interface Note {
  _id: string;
  title: string;
  ownerId: string;
  workspaceId: string;
  isPublic: boolean;
  metadata: NoteMetadata;
  permissions: NotePermission[];
}

export interface NoteMetadata {
  createdAt: Date | string;
  updatedAt: Date | string;
  tags: string[];
  lastEditedBy?: string;
}

export interface NotePermission {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

// ============================================
// Frame Types (PPT Mode)
// ============================================

export interface Frame {
  id: string;
  type: 'text' | 'image' | 'graph' | 'video' | 'table' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content?: string;
  url?: string;
  locked: boolean;
  createdAt: Date | string;
}

export type FrameType = Frame['type'];

// ============================================
// Stroke Types (Handwriting Mode)
// ============================================

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  color: string;
  width: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
}

// ============================================
// Collaboration Types
// ============================================

export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  selectedFrameId?: string;
  currentMode?: EditingMode;
}

export type EditingMode = 'word' | 'ppt' | 'handwrite';

// ============================================
// Session Types
// ============================================

export interface Session {
  _id: string;
  userId: string;
  noteId: string;
  socketId: string;
  joinedAt: Date | string;
  lastActivity: Date | string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
