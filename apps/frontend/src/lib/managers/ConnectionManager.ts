import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { YDocManager } from './YDocManager';

// Minimal type for awareness to avoid pulling full types for now
type AwarenessLike = {
  setLocalState: (state: Record<string, unknown> | null) => void;
};

/**
 * ConnectionManager
 *  - Manages the Yjs WebsocketProvider and awareness for a specific note
 *  - Each instance is tied to a specific noteId
 */
export class ConnectionManager {
  public provider: WebsocketProvider | null = null;
  public awareness: AwarenessLike | null = null;

  /**
   * ID of the note that this provider is connected to.
   */
  private readonly noteId: string;

  /**
   * Reference to the YDocManager instance for this note
   */
  private readonly yDocManager: YDocManager;

  constructor(noteId: string, yDocManager: YDocManager) {
    this.noteId = noteId;
    this.yDocManager = yDocManager;
  }

  public connect(): void {
    // If we're already connected, nothing to do.
    if (this.provider) {
      return;
    }

    const ydoc = this.yDocManager.getYDoc();

    // WebSocket endpoint for Yjs – can be overridden via env.
    // We rely on y-websocket default behavior, which uses
    // `${serverUrl}/${roomName}` as the doc path.
    // Default to the Render backend WebSocket endpoint in production.
    const wsUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      'wss://mynoteapp-g3wt.onrender.com/yjs';

    // Use note-specific room name so each note gets its own doc
    const roomName = `note-${this.noteId}`;

    const provider = new WebsocketProvider(wsUrl, roomName, ydoc as Y.Doc);
    this.provider = provider;
    this.awareness = provider.awareness as AwarenessLike;
  }

  public disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.awareness = null;
    }
  }

  public getNoteId(): string {
    return this.noteId;
  }
}

/**
 * Factory for managing ConnectionManager instances
 * Provides get-or-create semantics and cleanup
 */
class ConnectionManagerFactory {
  private instances = new Map<string, ConnectionManager>();

  /**
   * Get or create a ConnectionManager for a specific note
   */
  getOrCreate(noteId: string, yDocManager: YDocManager): ConnectionManager {
    if (!this.instances.has(noteId)) {
      this.instances.set(noteId, new ConnectionManager(noteId, yDocManager));
    }
    return this.instances.get(noteId)!;
  }

  /**
   * Get an existing ConnectionManager for a note, or null if it doesn't exist
   */
  get(noteId: string): ConnectionManager | null {
    return this.instances.get(noteId) || null;
    }

  /**
   * Check if a ConnectionManager exists for a note
   */
  has(noteId: string): boolean {
    return this.instances.has(noteId);
  }

  /**
   * Disconnect and remove a ConnectionManager instance
   */
  destroy(noteId: string): void {
    const instance = this.instances.get(noteId);
    if (instance) {
      instance.disconnect();
      this.instances.delete(noteId);
    }
  }

  /**
   * Disconnect and remove all ConnectionManager instances
   */
  destroyAll(): void {
    for (const instance of this.instances.values()) {
      instance.disconnect();
    }
    this.instances.clear();
  }

  /**
   * Get all active note IDs
   */
  getActiveNoteIds(): string[] {
    return Array.from(this.instances.keys());
  }
}

export const connectionManagerFactory = new ConnectionManagerFactory();
