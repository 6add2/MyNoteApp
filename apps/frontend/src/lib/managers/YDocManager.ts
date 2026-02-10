import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Frame, Stroke } from '../../shared-types';

/**
 * YDocManager
 *  - Manages the Y.Doc instance for a specific note
 *  - Provides named shared types for different modes
 *  - yRichText: main document body for Word mode
 *  - yFrames: frame data for PPT mode
 *  - yStrokes: stroke data for Handwrite mode
 */
export class YDocManager {
  private readonly noteId: string;
  private ydoc: Y.Doc;
  public yRichText: Y.Text;
  public yWordState: Y.Map<any>; // stores html & future formatting meta
  public yFrames: Y.Array<Frame>;
  public yStrokes: Y.Array<Stroke>;

  // Placeholders for future phases (media / metadata)
  public yMedia: Map<string, unknown> = new Map();
  public yMeta: Map<string, unknown> = new Map();

  constructor(noteId: string) {
    this.noteId = noteId;
    // Initialize the Y.Doc for this specific note
    this.ydoc = new Y.Doc();
    this.yRichText = this.ydoc.getText('richText');
    this.yWordState = this.ydoc.getMap('wordState');
    this.yFrames = this.ydoc.getArray<Frame>('frames');
    this.yStrokes = this.ydoc.getArray<Stroke>('strokes');
    
  }

  public getNoteId(): string {
    return this.noteId;
  }

  public getYDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get all Yjs document instances for this note
   */
  public getYjsInstances(): {
    ydoc: Y.Doc;
    yRichText: Y.Text;
    yWordState: Y.Map<any>;
    yFrames: Y.Array<Frame>;
    yStrokes: Y.Array<Stroke>;
  } {
    return {
      ydoc: this.ydoc,
      yRichText: this.yRichText,
      yWordState: this.yWordState,
      yFrames: this.yFrames,
      yStrokes: this.yStrokes,
    };
    }

  public updateMeta(key: string, value: unknown): void {
    this.yMeta.set(key, value);
    // In later phases, we can sync this via a Y.Map in the document
  }

  /**
   * Cleanup and destroy this YDocManager instance
   */
  public destroy(): void {
      this.ydoc.destroy();
  }
}

/**
 * PageStructureManager
 * Manages the global page structure (page note IDs and backgrounds)
 * This is shared across all pages and synced via the main note's room
 */
class PageStructureManager {
  private pageStructureDoc: Y.Doc | null = null;
  private pageStructureProvider: WebsocketProvider | null = null;
  private mainNoteId: string | null = null;
  
  public yPageNoteIds: Y.Array<string> | null = null;
  public yPageBackgrounds: Y.Map<string> | null = null;
  public pageNoteIds: string[] = [];

  /**
   * Initialize page structure synchronization for the main note.
   * This should be called once when the first page is loaded.
   */
  initialize(mainNoteId: string): void {
    // If already initialized for this main note, do nothing
    if (this.mainNoteId === mainNoteId && this.pageStructureDoc) {
      return;
    }

    // Clean up previous page structure doc if switching main notes
    if (this.pageStructureDoc && this.mainNoteId !== mainNoteId) {
      if (this.pageStructureProvider) {
        this.pageStructureProvider.destroy();
        this.pageStructureProvider = null;
      }
      this.pageStructureDoc.destroy();
    }

    // Create new doc for page structure
    this.pageStructureDoc = new Y.Doc();
    this.yPageNoteIds = this.pageStructureDoc.getArray<string>('pageNoteIds');
    this.yPageBackgrounds = this.pageStructureDoc.getMap<string>('pageBackgrounds');
    this.mainNoteId = mainNoteId;

    // Connect to the main note's room for page structure
    // Default to the Render backend WebSocket endpoint; can be overridden via VITE_WS_URL.
    const wsUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      'wss://mynoteapp-g3wt.onrender.com/yjs';
    const roomName = `note-${mainNoteId}`;
    
    this.pageStructureProvider = new WebsocketProvider(wsUrl, roomName, this.pageStructureDoc);
    
    // Wait for connection to be established and sync initial state
    this.pageStructureProvider.on('status', (event: { status: string }) => {
      if (event.status === 'connected') {
        // Update local cache from Yjs after connection
        if (this.yPageNoteIds && this.yPageNoteIds.length > 0) {
          this.pageNoteIds = this.yPageNoteIds.toArray();
        }
      }
    });
    
  }

  /**
   * Set the array of page note IDs and sync to Yjs.
   */
  setPageNoteIds(noteIds: string[]): void {
    if (!this.yPageNoteIds || !this.pageStructureDoc) {
      this.pageNoteIds = [...noteIds];
      return;
    }

    // Get current Yjs array state
    const currentYjsIds = this.yPageNoteIds.toArray();
    
    // Find IDs that need to be added (in noteIds but not in currentYjsIds)
    const idsToAdd = noteIds.filter(id => !currentYjsIds.includes(id));
    
    // Find IDs that need to be removed (in currentYjsIds but not in noteIds)
    const idsToRemove: number[] = [];
    if (noteIds.length < currentYjsIds.length) {
      for (let i = currentYjsIds.length - 1; i >= 0; i--) {
        if (!noteIds.includes(currentYjsIds[i])) {
          idsToRemove.push(i);
        }
      }
    }

    // Update Yjs array incrementally
    this.pageStructureDoc.transact(() => {
      for (const index of idsToRemove) {
        this.yPageNoteIds!.delete(index, 1);
      }
      if (idsToAdd.length > 0) {
        this.yPageNoteIds!.push(idsToAdd);
      }
    }, 'local-page-structure-update');

    this.pageNoteIds = [...noteIds];
  }

  getPageNoteIds(): string[] {
    return [...this.pageNoteIds];
  }

  observePageNoteIds(
    callback: (noteIds: string[], event: Y.YArrayEvent<string>, addedIds: string[]) => void
  ): (() => void) | null {
    if (!this.yPageNoteIds) {
      return null;
    }

    const observer = (event: Y.YArrayEvent<string>) => {
      const origin = event.transaction.origin;
      if (origin !== 'local-page-structure-update') {
        const noteIds = this.yPageNoteIds!.toArray();
        this.pageNoteIds = [...noteIds];
        
        const addedIds: string[] = [];
        event.changes.delta.forEach((delta) => {
          if (delta.insert && Array.isArray(delta.insert)) {
            addedIds.push(...delta.insert.filter((id): id is string => typeof id === 'string'));
          }
        });
        
        callback(noteIds, event, addedIds);
      }
    };

    this.yPageNoteIds.observe(observer);
    return () => {
      if (this.yPageNoteIds) {
        this.yPageNoteIds.unobserve(observer);
      }
    };
  }

  setPageBackground(pageIndex: number, backgroundUrl: string): void {
    if (!this.yPageBackgrounds || !this.pageStructureDoc) {
      return;
    }

    this.pageStructureDoc.transact(() => {
      this.yPageBackgrounds!.set(pageIndex.toString(), backgroundUrl);
    }, 'local-background-update');

  }

  getPageBackground(pageIndex: number): string | undefined {
    if (!this.yPageBackgrounds) {
      return undefined;
    }
    return this.yPageBackgrounds.get(pageIndex.toString());
  }

  observePageBackgrounds(
    callback: (pageIndex: number, backgroundUrl: string | undefined, event: Y.YMapEvent<string>) => void
  ): (() => void) | null {
    if (!this.yPageBackgrounds) {
      return null;
    }

    const observer = (event: Y.YMapEvent<string>) => {
      const origin = event.transaction.origin;
      if (origin !== 'local-background-update') {
        event.changes.keys.forEach((_change, key) => {
          const pageIndex = parseInt(key, 10);
          if (!isNaN(pageIndex)) {
            const backgroundUrl = this.yPageBackgrounds!.get(key);
            callback(pageIndex, backgroundUrl, event);
          }
        });
      }
    };

    this.yPageBackgrounds.observe(observer);
    return () => {
      if (this.yPageBackgrounds) {
        this.yPageBackgrounds.unobserve(observer);
      }
    };
  }

  destroy(): void {
    if (this.pageStructureProvider) {
      this.pageStructureProvider.destroy();
      this.pageStructureProvider = null;
    }
    if (this.pageStructureDoc) {
      this.pageStructureDoc.destroy();
      this.pageStructureDoc = null;
    }
    this.yPageNoteIds = null;
    this.yPageBackgrounds = null;
    this.mainNoteId = null;
    this.pageNoteIds = [];
  }
}

/**
 * Factory for managing YDocManager instances
 */
class YDocManagerFactory {
  private instances = new Map<string, YDocManager>();
  private pageStructureManager = new PageStructureManager();

  /**
   * Get or create a YDocManager for a specific note
   */
  getOrCreate(noteId: string): YDocManager {
    if (!this.instances.has(noteId)) {
      this.instances.set(noteId, new YDocManager(noteId));
    }
    return this.instances.get(noteId)!;
  }

  /**
   * Get an existing YDocManager for a note, or null if it doesn't exist
   */
  get(noteId: string): YDocManager | null {
    return this.instances.get(noteId) || null;
  }

  /**
   * Check if a YDocManager exists for a note
   */
  has(noteId: string): boolean {
    return this.instances.has(noteId);
  }

  /**
   * Remove and destroy a YDocManager instance
   */
  destroy(noteId: string): void {
    const instance = this.instances.get(noteId);
    if (instance) {
      instance.destroy();
      this.instances.delete(noteId);
    }
  }

  /**
   * Remove and destroy all YDocManager instances
   */
  destroyAll(): void {
    for (const instance of this.instances.values()) {
      instance.destroy();
    }
    this.instances.clear();
  }

  /**
   * Get all active note IDs
   */
  getActiveNoteIds(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Get the page structure manager (singleton)
   */
  getPageStructureManager(): PageStructureManager {
    return this.pageStructureManager;
  }
}

export const yDocManagerFactory = new YDocManagerFactory();
