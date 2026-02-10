import { authStore } from '../../stores/authStore';
import { getBaseTitle, notesStore } from '../../stores/notesStore';
import type { NoteMetadata } from '../../shared-types';
import { connectionManagerFactory } from '../managers/ConnectionManager';
import { yDocManagerFactory } from '../managers/YDocManager';
import { WordSyncHandler } from '../handlers/WordSyncHandler';
import { PPTSyncHandler } from '../handlers/PPTSyncHandler';
import { HandwriteSyncHandler } from '../handlers/HandwriteSyncHandler';
import * as Y from 'yjs';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Upload/static 文件所在的基础地址（去掉 /api 前缀）
const UPLOAD_BASE = API_BASE.replace(/\/api\/?$/i, '');

function getAuthHeader(): HeadersInit {
  let token: string | null = null;
  authStore.subscribe((s) => (token = s.accessToken))();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * SyncController
 * Handles all synchronization operations for notes:
 * - HTTP API sync (metadata CRUD)
 * - Yjs WebSocket sync (real-time collaborative content)
 */
export class SyncController {
  // Mode sync handlers - now per-note, stored in a map
  private static syncHandlers = new Map<string, {
    word: WordSyncHandler;
    ppt: PPTSyncHandler;
    handwrite: HandwriteSyncHandler;
  }>();

  /**
   * Small helper to perform a JSON HTTP request and throw on non-OK responses.
   * Callers remain responsible for setting headers (auth, content-type, etc.).
   */
  private static async requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  }

  // Lazy initialization of sync handlers per note
  private static getSyncHandlers(noteId: string): {
    word: WordSyncHandler;
    ppt: PPTSyncHandler;
    handwrite: HandwriteSyncHandler;
  } {
    if (!this.syncHandlers.has(noteId)) {
      const yDocManager = yDocManagerFactory.getOrCreate(noteId);
      this.syncHandlers.set(noteId, {
        word: new WordSyncHandler(yDocManager),
        ppt: new PPTSyncHandler(yDocManager),
        handwrite: new HandwriteSyncHandler(yDocManager),
      });
    }
    return this.syncHandlers.get(noteId)!;
  }

  private static getSyncHandler(noteId: string, mode: 'word' | 'ppt' | 'handwrite'): WordSyncHandler | PPTSyncHandler | HandwriteSyncHandler {
    const handlers = this.getSyncHandlers(noteId);
    switch (mode) {
      case 'word':
        return handlers.word;
      case 'ppt':
        return handlers.ppt;
      case 'handwrite':
        return handlers.handwrite;
    }
  }
  /**
   * Fetch all notes for the current user
   */
  public static async fetchNotes(): Promise<NoteMetadata[]> {
    try {
      const data = await this.requestJson<{ notes: any[] }>(`${API_BASE}/notes`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const notes = (data.notes || []).map(this.transformNote);
      notesStore.set(notes);
      return notes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Upload a PDF and get background URLs for each page
   */
  public static async uploadPdfBackgrounds(
    noteId: string,
    file: File
  ): Promise<{ pageIndex: number; url: string }[] | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/notes/${noteId}/pdf-backgrounds`, {
        method: 'POST',
        headers: {
          // 只加认证头，不手动设置 Content-Type，浏览器会自动带 multipart 边界
          ...getAuthHeader(),
        } as HeadersInit,
        body: formData,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rawPages = (data.pages as { pageIndex: number; url: string }[]) || [];

      // Ensure URLs are fully qualified so the browser loads from the backend host (e.g. :3000)
      return rawPages.map((p) => ({
        pageIndex: p.pageIndex,
        url: p.url.startsWith('http') ? p.url : `${UPLOAD_BASE}${p.url}`,
      }));
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new note
   */
  public static async createNote(title: string = 'Untitled'): Promise<NoteMetadata | null> {
    try {
      const data = await this.requestJson<{ note: any }>(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ title }),
      });
      const note = this.transformNote(data.note);
      
      notesStore.update((notes) => [note, ...notes]);
      return note;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a single note by ID
   */
  public static async getNote(id: string): Promise<NoteMetadata | null> {
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch note');
      }

      const data = await response.json();
      return this.transformNote(data.note);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a note
   */
  public static async updateNote(
    id: string,
    updates: Partial<Pick<NoteMetadata, 'title' | 'tags' | 'isPublic' | 'backgroundUrl'>>
  ): Promise<NoteMetadata | null> {
    try {
      const data = await this.requestJson<{ note: any }>(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updates),
      });
      const note = this.transformNote(data.note);
      
      notesStore.update((notes) =>
        notes.map((n) => (n.id === id ? note : n))
      );
      
      return note;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a note
   * @param id - The note ID to delete
   * @param deleteRelatedPages - If true (default), deletes all related page notes. 
   *                            If false, only deletes the specific note.
   *                            Use false when deleting a single page from edit view.
   */
  public static async deleteNote(id: string, deleteRelatedPages: boolean = true): Promise<boolean> {
    try {
      // First, get the note to check if it's a main note or Page 2 note
      const note = await this.getNote(id);
      if (!note) {
        return false;
      }
      
      const baseTitle = getBaseTitle(note.title);
      
      // Delete the note
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      // Delete all pages belonging to this note (based on title grouping)
      // Only if deleteRelatedPages is true (default behavior for workspace)
      if (deleteRelatedPages && baseTitle) {
        let relatedNotes: NoteMetadata[] = [];
        notesStore.subscribe((state) => {
          relatedNotes = state.notes.filter(
            (n) => n.id !== id && getBaseTitle(n.title) === baseTitle
          );
        })();

        for (const pageNote of relatedNotes) {
          try {
            await fetch(`${API_BASE}/notes/${pageNote.id}`, {
              method: 'DELETE',
              headers: {
                ...getAuthHeader(),
              },
            });
          } catch (error) {
            // Continue even if a child page deletion fails
          }
        }
      }

      // Remove the deleted note from store
      notesStore.removeNote(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Share a note (make it public) - returns share URL
   */
  public static async shareNote(
    id: string,
    isPublic: boolean = true
  ): Promise<{ success: boolean; shareUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/notes/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to share note' };
      }

      notesStore.update((notes) =>
        notes.map((n) => (n.id === id ? { ...n, isPublic } : n))
      );
      
      const shareUrl = `${window.location.origin}/#/edit/${id}`;
      return { success: true, shareUrl };
    } catch (error) {
      return { success: false, error: 'Failed to share note' };
    }
  }

  /**
   * Get note snapshot (Yjs document state)
   */
  public static async getSnapshot(id: string): Promise<string | null> {
    try {
      const data = await this.requestJson<{ snapshot: string }>(`${API_BASE}/notes/${id}/snapshot`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return data.snapshot;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load a note by ID (with loading/error state management)
   */
  public static async loadNote(
    id: string,
    callbacks: {
      onLoading?: (isLoading: boolean) => void;
      onError?: (error: string | null) => void;
      onSuccess?: (note: NoteMetadata) => void;
    } = {}
  ): Promise<NoteMetadata | null> {
    const { onLoading, onError, onSuccess } = callbacks;
    
    onLoading?.(true);
    onError?.(null);

    try {
      const note = await this.getNote(id);
      
      if (!note) {
        onError?.('Note not found');
        onLoading?.(false);
        return null;
      }

      onSuccess?.(note);
      onLoading?.(false);
      return note;
    } catch (err) {
      const error = 'Failed to connect to server';
      onError?.(error);
      onLoading?.(false);
      return null;
    }
  }

  /**
   * Save note metadata (title, tags, isPublic)
   */
  public static async saveNote(
    id: string,
    note: Partial<Pick<NoteMetadata, 'title' | 'tags' | 'isPublic' | 'backgroundUrl'>>,
    callbacks: {
      onSaving?: (isSaving: boolean) => void;
      onSaved?: () => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<boolean> {
    const { onSaving, onSaved, onError } = callbacks;
    
    onSaving?.(true);

    try {
      const updatedNote = await this.updateNote(id, note);
      
      if (!updatedNote) {
        onError?.('Failed to save note');
        onSaving?.(false);
        return false;
      }

      onSaved?.();
      onSaving?.(false);
      return true;
    } catch (err) {
      onError?.('Failed to save note');
      onSaving?.(false);
      return false;
    }
  }

  // ========== Yjs Collaboration Sync Methods ==========

  /**
   * Join a collaborative editing session for a specific note.
   * Orchestrates Yjs document initialization and WebSocket connection.
   * Sets up observer for remote changes.
   */
  public static joinNote(
    noteId: string,
    mode: 'word' | 'ppt' | 'handwrite',
    callbacks?: {
      onContentChange?: (content: unknown) => void;
      onInitialContent?: (content: unknown) => void;
    }
  ): { unsubscribe: () => void } {
    // Get or create YDocManager for this note
    const yDocManager = yDocManagerFactory.getOrCreate(noteId);
    
    // Get or create ConnectionManager for this note and connect
    const connectionManager = connectionManagerFactory.getOrCreate(noteId, yDocManager);
    connectionManager.connect();

    // Get appropriate sync handler and set up observer
    const handler = this.getSyncHandler(noteId, mode);
    return handler.syncFromYjs(callbacks);
  }

  /**
   * Leave a collaborative editing session for a specific note.
   */
  public static leaveNote(noteId?: string): void {
    if (noteId) {
      // Leave specific note
      const connectionManager = connectionManagerFactory.get(noteId);
      if (connectionManager) {
    connectionManager.disconnect();
      }
    } else {
      // Leave all notes (for backward compatibility)
      connectionManagerFactory.destroyAll();
    }
  }

  /**
   * Get Yjs document and all shared type instances for a specific note
   */
  public static getYjsInstances(noteId: string): {
    ydoc: Y.Doc;
    yRichText: Y.Text;
    yFrames: Y.Array<import('../../shared-types').Frame>;
    yStrokes: Y.Array<import('../../shared-types').Stroke>;
    yPageNoteIds: Y.Array<string> | null;
  } {
    const yDocManager = yDocManagerFactory.getOrCreate(noteId);
    const pageStructureManager = yDocManagerFactory.getPageStructureManager();
    const instances = yDocManager.getYjsInstances();
    return {
      ...instances,
      yPageNoteIds: pageStructureManager.yPageNoteIds,
    };
  }

  /**
   * Sync content changes to Yjs (delegates to mode-specific handler)
   */
  public static syncContentToYjs(
    noteId: string,
    content: unknown,
    currentMode: 'word' | 'ppt' | 'handwrite',
    isApplyingRemoteUpdate: boolean
  ): void {
    const handler = this.getSyncHandler(noteId, currentMode);
    handler.syncToYjs(content, isApplyingRemoteUpdate);
  }

  /**
   * Sync content to Yjs (public wrapper for handlers to call)
   * Note: This method now requires noteId. Consider updating callers to use syncContentToYjs directly.
   */
  public static syncContent(noteId: string, content: unknown, mode: 'word' | 'ppt' | 'handwrite'): void {
    this.syncContentToYjs(noteId, content, mode, false);
  }

  /**
   * Transform backend note to frontend NoteMetadata format
   */
  private static transformNote(backendNote: any): NoteMetadata {
    return {
      id: backendNote._id || backendNote.id,
      title: backendNote.title || 'Untitled',
      ownerId: backendNote.ownerId,
      isPublic: backendNote.isPublic || false,
      createdAt: new Date(backendNote.metadata?.createdAt || backendNote.createdAt),
      updatedAt: new Date(backendNote.metadata?.updatedAt || backendNote.updatedAt),
      tags: backendNote.metadata?.tags || backendNote.tags || [],
      workspaceId: backendNote.workspaceId || 'default',
      backgroundUrl: backendNote.metadata?.backgroundUrl,
    };
  }
}

