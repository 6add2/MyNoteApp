import { WordHandler, type FormattingState } from '../handlers/WordHandler';
import { PPTHandler } from '../handlers/PPTHandler';
import { HandwriteHandler } from '../handlers/HandwriteHandler';
import { writable, type Writable } from 'svelte/store';
import { SyncController } from './SyncController';

// Re-export FormattingState type
export type { FormattingState };

// Formatting state store (shared by WordHandler)
export const formattingState: Writable<FormattingState> = writable<FormattingState>({
  isBold: false,
  isItalic: false,
  isUnderline: false,
  heading: 'p',
});

/**
 * Callbacks for PageController operations
 */
export interface PageCallbacks {
  onUnsavedChange?: () => void;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onCommandPalette?: () => void;
}

/**
 * Callbacks for Yjs observer setup
 */
export interface YjsObserverCallbacks {
  onInitialContent?: (content: string) => void;
  onContentChange?: (content: string) => void;
}

/**
 * Represents a single page instance with its handlers and state
 */
export interface PageInstance {
  id: string;
  noteId: string | null; // The note ID this page is associated with
  // Handlers for this page
  handlers: {
    word: WordHandler;
    ppt: PPTHandler;
    handwrite: HandwriteHandler;
  };
  // Mode for this page
  currentMode: 'word' | 'ppt' | 'handwrite';
  // Element references
  pptContainer: HTMLElement | null;
  canvasElement: HTMLCanvasElement | null;
  // Setup flags
  pptSetup: boolean;
  canvasSetup: boolean;
  // Callbacks
  pptCallbacks: PageCallbacks | null;
  canvasCallbacks: PageCallbacks | null;
  // Handwrite state
  penColor: string;
  penSize: number;
  isEraser: boolean;
  // Yjs cleanup
  unsubscribe: (() => void) | null;
}

/**
 * PageController
 * Central controller for managing all pages and their handlers (word, ppt, handwrite)
 * Supports multiple pages - one controller manages all pages
 */
export class PageController {
  // Pages management
  private pages: Map<string, PageInstance> = new Map();
  private activePageId: string | null = null;
  
  // Mode store for active page (for reactivity)
  private _currentMode = writable<'word' | 'ppt' | 'handwrite'>('word');
  
  // Selection change handler (global, for active page)
  private selectionChangeHandler: (() => void) | null = null;

  /**
   * Resolve a page instance and its id, falling back to the active page when pageId is not provided.
   * Returns null when there is no suitable page.
   */
  private getPageWithId(pageId?: string): { page: PageInstance; id: string } | null {
    const targetPageId = pageId || this.activePageId;
    if (!targetPageId) return null;
    const page = this.pages.get(targetPageId);
    if (!page) return null;
    return { page, id: targetPageId };
  }

  constructor() {
    // Create default page on initialization
    this.createPage('default-page');
  }

  /**
   * Create a new page instance
   * If page already exists, returns existing page
   */
  public createPage(pageId: string): PageInstance {
    // Return existing page if it already exists
    const existingPage = this.pages.get(pageId);
    if (existingPage) {
      return existingPage;
    }
    
    const page: PageInstance = {
      id: pageId,
      noteId: null,
      handlers: {
        word: new WordHandler(formattingState),
        ppt: new PPTHandler(),
        handwrite: new HandwriteHandler()
      },
      currentMode: 'word',
      pptContainer: null,
      canvasElement: null,
      pptSetup: false,
      canvasSetup: false,
      pptCallbacks: null,
      canvasCallbacks: null,
      penColor: '#6ee7b7',
      penSize: 3,
      isEraser: false,
      unsubscribe: null
    };
    
    this.pages.set(pageId, page);
    
    // Set as active if no active page
    if (!this.activePageId) {
      this.activePageId = pageId;
      this._currentMode.set('word');
    }
    
    return page;
  }

  /**
   * Get page instance
   */
  public getPage(pageId: string): PageInstance | undefined {
    return this.pages.get(pageId);
  }

  /**
   * Get active page
   */
  public getActivePage(): PageInstance | undefined {
    if (!this.activePageId) return undefined;
    return this.pages.get(this.activePageId);
  }

  /**
   * Set active page
   */
  public setActivePage(pageId: string): void {
    if (this.pages.has(pageId)) {
      this.activePageId = pageId;
      const page = this.pages.get(pageId);
      if (page) {
        this._currentMode.set(page.currentMode);
      }
    }
  }

  /**
   * Remove page
   */
  public removePage(pageId: string): void {
    const page = this.pages.get(pageId);
    if (page) {
      // Cleanup handlers
      page.handlers.handwrite.cleanup();
      page.handlers.ppt.cleanup();
      
      // Cleanup Yjs
      if (page.unsubscribe) {
        page.unsubscribe();
      }
    }
    
    this.pages.delete(pageId);
    
    // Switch to first available page if active page was removed
    if (this.activePageId === pageId) {
      const firstPageId = Array.from(this.pages.keys())[0];
      this.activePageId = firstPageId || null;
      if (this.activePageId) {
        const newActivePage = this.pages.get(this.activePageId);
        if (newActivePage) {
          this._currentMode.set(newActivePage.currentMode);
        }
      }
    }
  }

  /**
   * Get current mode (for active page) - for backward compatibility
   */
  public get currentMode(): 'word' | 'ppt' | 'handwrite' {
    const activePage = this.getActivePage();
    return activePage?.currentMode || 'word';
  }

  /**
   * Subscribe to mode changes (for active page)
   */
  public subscribeMode(callback: (mode: 'word' | 'ppt' | 'handwrite') => void) {
    return this._currentMode.subscribe(callback);
  }

  /**
   * Set mode for a specific page (or active page if pageId not provided)
   */
  public setMode(mode: 'word' | 'ppt' | 'handwrite', pageId?: string): void {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return;
    const { page, id: targetPageId } = resolved;
    
    const previousMode = page.currentMode;
    page.currentMode = mode;
    
    // Update store if this is the active page
    if (targetPageId === this.activePageId) {
      this._currentMode.set(mode);
    }
    
    // Re-setup canvas when switching to handwrite mode
    if (mode === 'handwrite' && page.canvasElement && page.canvasCallbacks) {
      if (previousMode !== 'handwrite') {
        page.canvasSetup = false;
      }
      if (!page.canvasSetup) {
        this.setupHandwriteCanvasForPage(page);
      }
    }
    
    // Re-setup PPT container when switching to PPT mode
    if (mode === 'ppt' && page.pptContainer && page.pptCallbacks) {
      if (previousMode !== 'ppt') {
        page.pptSetup = false;
      }
      if (!page.pptSetup) {
        this.setupPPTCanvasForPage(page);
      }
    }
  }

  /**
   * Get handlers for active page (for backward compatibility)
   */
  public get wordHandler(): WordHandler {
    const activePage = this.getActivePage();
    if (!activePage) {
      throw new Error('No active page');
    }
    return activePage.handlers.word;
  }

  public get pptHandler(): PPTHandler {
    const activePage = this.getActivePage();
    if (!activePage) {
      throw new Error('No active page');
    }
    return activePage.handlers.ppt;
  }

  public get handwriteHandler(): HandwriteHandler {
    const activePage = this.getActivePage();
    if (!activePage) {
      throw new Error('No active page');
    }
    return activePage.handlers.handwrite;
  }

  /**
   * Get handlers for specific page
   */
  public getHandlers(pageId: string): PageInstance['handlers'] | undefined {
    const page = this.pages.get(pageId);
    return page?.handlers;
  }

  /**
   * Get handwrite state for active page (for backward compatibility)
   */
  public get penColor(): string {
    const activePage = this.getActivePage();
    return activePage?.penColor || '#6ee7b7';
  }

  public set penColor(value: string) {
    const activePage = this.getActivePage();
    if (activePage) {
      activePage.penColor = value;
    }
  }

  public get penSize(): number {
    const activePage = this.getActivePage();
    return activePage?.penSize || 3;
  }

  public set penSize(value: number) {
    const activePage = this.getActivePage();
    if (activePage) {
      activePage.penSize = value;
    }
  }

  public get isEraser(): boolean {
    const activePage = this.getActivePage();
    return activePage?.isEraser || false;
  }

  public set isEraser(value: boolean) {
    const activePage = this.getActivePage();
    if (activePage) {
      activePage.isEraser = value;
    }
  }

  /**
   * Set PPT container for a specific page (or active page if pageId not provided)
   */
  public setPPTContainer(
    element: HTMLElement | null, 
    callbacks?: PageCallbacks,
    pageId?: string
  ): void {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return;
    const { page } = resolved;
    
    const elementChanged = page.pptContainer !== element;
    
    if (elementChanged) {
      page.pptContainer = element;
      page.pptCallbacks = callbacks || null;
    } else if (callbacks) {
      page.pptCallbacks = callbacks;
    }
    
    if (element && (!page.pptSetup || elementChanged) && callbacks) {
      if (elementChanged) {
        page.pptSetup = false;
      }
      this.setupPPTCanvasForPage(page);
    }
  }

  /**
   * Set Canvas element for a specific page (or active page if pageId not provided)
   */
  public setCanvasElement(
    element: HTMLCanvasElement | null,
    callbacks?: PageCallbacks,
    pageId?: string
  ): void {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return;
    const { page } = resolved;
    
    const elementChanged = page.canvasElement !== element;
    
    if (elementChanged) {
      page.canvasElement = element;
      page.canvasCallbacks = callbacks || null;
    } else if (callbacks) {
      page.canvasCallbacks = callbacks;
    }
    
    if (element && (!page.canvasSetup || elementChanged) && callbacks) {
      if (elementChanged) {
        page.canvasSetup = false;
      }
      this.setupHandwriteCanvasForPage(page);
    }
  }

  /**
   * Setup PPT canvas for a specific page
   */
  private setupPPTCanvasForPage(page: PageInstance): void {
    if (!page.pptContainer || !page.pptCallbacks) {
      return;
    }
    requestAnimationFrame(() => {
      if (!page.pptContainer || !page.pptCallbacks) return;

      // Setup PPT container using page's handlers
      page.handlers.ppt.setupCanvas(
        page.pptContainer,
        {
        onUnsavedChange: page.pptCallbacks.onUnsavedChange || (() => {})
        },
        (frames) => {
          if (!page.noteId) return;
          SyncController.syncContent(page.noteId, frames, 'ppt');
        }
      );
      page.pptSetup = true;

      // Setup debug indicators
      if (typeof window !== 'undefined') {
        const updateDebugFocus = () => {
          const activeEl = document.activeElement;
          const debugFocus = document.getElementById('debug-focus');
          if (debugFocus) {
            if (activeEl && activeEl.hasAttribute('data-frame-id')) {
              debugFocus.textContent = `Frame ${activeEl.getAttribute('data-frame-id')}`;
            } else if (activeEl && (activeEl as HTMLElement).isContentEditable) {
              debugFocus.textContent = 'ContentEditable';
            } else {
              debugFocus.textContent = activeEl?.tagName || 'None';
            }
          }
        };

        document.addEventListener('focusin', updateDebugFocus);
        document.addEventListener('focusout', updateDebugFocus);

        const debugKey = document.getElementById('debug-key');
        const debugInput = document.getElementById('debug-input');

        document.addEventListener('keydown', (e) => {
          if (debugKey && e.target && (e.target as HTMLElement).isContentEditable) {
            debugKey.textContent = e.key;
          }
        });

        document.addEventListener('input', (e) => {
          if (debugInput && e.target) {
            const target = e.target as HTMLElement;
            if (target.isContentEditable) {
              debugInput.textContent = `${target.innerText?.length || 0} chars`;
            }
          }
        });
      }
    });
  }

  /**
   * Setup handwrite canvas for a specific page
   */
  private setupHandwriteCanvasForPage(page: PageInstance): void {
    if (!page.canvasElement || !page.canvasCallbacks) {
      return;
    }
    requestAnimationFrame(() => {
      if (!page.canvasElement || !page.canvasCallbacks) return;

      // Setup canvas using page's handlers
      page.handlers.handwrite.setupCanvas(
        page.canvasElement,
        {
        onUnsavedChange: page.canvasCallbacks.onUnsavedChange || (() => {})
        },
        (strokes) => {
          if (!page.noteId) return;
          SyncController.syncContent(page.noteId, strokes, 'handwrite');
        }
      );
      page.canvasSetup = true;
    });
  }

  /**
   * Get current handler for a specific page (or active page if pageId not provided)
   */
  public getCurrentHandler(pageId?: string): WordHandler | PPTHandler | HandwriteHandler {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) {
      throw new Error('No active page');
    }
    const { page } = resolved;
    
    switch (page.currentMode) {
      case 'word':
        return page.handlers.word;
      case 'ppt':
        return page.handlers.ppt;
      case 'handwrite':
        return page.handlers.handwrite;
    }
  }

  /**
   * Handle editor input for a specific page (or active page if pageId not provided)
   */
  public handleEditorInput(
    event: Event,
    callbacks: PageCallbacks,
    pageId?: string
  ): void {
    const handler = this.getCurrentHandler(pageId);
    
    handler.handleInput(event, {
      onContentChange: (content) => {
        if (typeof content === 'string' && callbacks.onContentChange) {
          callbacks.onContentChange(content);
        }
      },
      onUnsavedChange: callbacks.onUnsavedChange || (() => {})
    });
  }

  /**
   * Handle keyboard events for a specific page (or active page if pageId not provided)
   */
  public handleKeyDown(
    event: KeyboardEvent,
    callbacks: PageCallbacks,
    pageId?: string
  ): void {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return;
    const { page, id: targetPageId } = resolved;
    
    const target = event.target as HTMLElement;
    const currentMode = page.currentMode;
    
    // If target is body, check if we should focus a PPT textArea instead
    if (target && target.tagName === 'BODY' && currentMode === 'ppt') {
      const selectedFrame = document.querySelector('[data-frame-id]') as HTMLElement;
      if (selectedFrame) {
        const textArea = selectedFrame.querySelector('[contenteditable="true"]') as HTMLElement;
        if (textArea) {
          textArea.focus();
          return;
        }
      }
    }

    if (target && (target.isContentEditable || target.contentEditable === 'true')) {
      const isArrowKey =
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight';

      // For contentEditable elements, skip handling普通输入，
      // 但允许 Delete、Enter 和方向键继续传给各自的 handler。
      if (
        !(event.ctrlKey || event.metaKey) &&
        event.key !== 'Delete' &&
        event.key !== 'Enter' &&
        !isArrowKey
      ) {
        return;
      }
      
      // Only handle Save shortcut (Ctrl+S) globally
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (callbacks.onSave) {
          callbacks.onSave();
        }
        return;
      }
      
      // For Enter, Delete, Arrow keys and other特殊按键，继续交给 handler
    }
    const handler = this.getCurrentHandler(targetPageId);

    handler.handleKeyDown(event, {
      onSave: callbacks.onSave || (() => {}),
      onToggleBold: callbacks.onToggleBold || (() => {}),
      onToggleItalic: callbacks.onToggleItalic || (() => {}),
      onToggleUnderline: callbacks.onToggleUnderline || (() => {}),
      onCommandPalette: callbacks.onCommandPalette || (() => {})
    });
  }

  /**
   * Initialize sync callbacks for a specific page (or active page if pageId not provided)
   * Note: This method now requires noteId to properly set up sync callbacks
   */
  public initializeSyncCallbacks(pageId: string, noteId: string): void {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return;
    const { page } = resolved;

    // Store noteId in page instance
    page.noteId = noteId;

    // Set up sync callbacks with noteId
    page.handlers.word.setSyncCallback((html: string) => {
      SyncController.syncContent(noteId, html, 'word');
    });
    
    page.handlers.ppt.setSyncCallback((frames) => {
      SyncController.syncContent(noteId, frames, 'ppt');
    });
  }

  /**
   * Setup Yjs observers for a specific page (or active page if pageId not provided)
   * Returns unsubscribe function
   */
  public async setupYjsObservers(
    noteId: string,
    callbacks: YjsObserverCallbacks,
    pageId?: string
  ): Promise<(() => void) | null> {
    const resolved = this.getPageWithId(pageId);
    if (!resolved) return null;
    const { page: pageInstance } = resolved;
    
    // Cleanup previous connection if exists
    if (pageInstance.unsubscribe) {
      pageInstance.unsubscribe();
      pageInstance.unsubscribe = null;
    }
    
    // Reset handler state before joining (clears strokes from previous note)
    pageInstance.handlers.handwrite.reset();

    // Yjs: connect to collaborative document for this note
    const result = await SyncController.joinNote(noteId, 'word', {
      onInitialContent: (content) => {
        if (typeof content === 'string' && callbacks.onInitialContent) {
          callbacks.onInitialContent(content);
        }
      },
      onContentChange: (content) => {
        if (typeof content === 'string' && callbacks.onContentChange) {
          callbacks.onContentChange(content);
        }
      }
    });

    // Store noteId in page instance
    pageInstance.noteId = noteId;

    // Set up separate observer for handwrite content
    const { yStrokes, yFrames } = SyncController.getYjsInstances(noteId);
    let handwriteObserver: ((event: any) => void) | null = null;
    let pptObserver: ((event: any) => void) | null = null;

    if (yStrokes) {
      // Load initial handwrite content
      if (yStrokes.length > 0) {
        const initialStrokes = yStrokes.toArray() as any[];
        pageInstance.handlers.handwrite.redrawCanvas(initialStrokes);
      }

      // Observe handwrite changes (only remote changes, not local)
      handwriteObserver = (event: any) => {
        if (!yStrokes) return;
        const origin = event.transaction?.origin;
        if (origin !== 'local-handwrite-update') {
          const strokes = yStrokes.toArray() as any[];
          pageInstance.handlers.handwrite.redrawCanvas(strokes);
        }
      };
      yStrokes.observe(handwriteObserver);
    }

    // Set up separate observer for PPT content
    if (yFrames) {
      // Load initial PPT content
      if (yFrames.length > 0) {
        const initialFrames = yFrames.toArray() as any[];
        pageInstance.handlers.ppt.redrawFrames(initialFrames);
      }

      // Observe PPT changes (only remote changes, not local)
      pptObserver = (event: any) => {
        if (!yFrames) return;
        const origin = event.transaction?.origin;
        if (origin !== 'local-ppt-update') {
          const frames = yFrames.toArray() as any[];
          pageInstance.handlers.ppt.redrawFrames(frames);
        }
      };
      yFrames.observe(pptObserver);
    }

    // Create combined unsubscribe function
    const unsubscribe = () => {
      result.unsubscribe();
      if (yStrokes && handwriteObserver) {
        yStrokes.unobserve(handwriteObserver);
      }
      if (yFrames && pptObserver) {
        yFrames.unobserve(pptObserver);
      }
    };
    
    // Store unsubscribe function in page instance
    pageInstance.unsubscribe = unsubscribe;
    
    return unsubscribe;
  }

  /**
   * Setup selection change listener (for active page)
   */
  public setupSelectionChangeListener(): void {
    if (typeof window === 'undefined') return;

    this.selectionChangeHandler = () => {
      const activePage = this.getActivePage();
      if (activePage && activePage.currentMode === 'word') {
        activePage.handlers.word.updateFormattingState();
      }
    };

    document.addEventListener('selectionchange', this.selectionChangeHandler);
  }

  /**
   * Cleanup all pages
   */
  public cleanup(): void {
    // Cleanup all pages
    for (const page of this.pages.values()) {
      page.handlers.handwrite.reset();
      page.handlers.ppt.reset();
      
      if (page.unsubscribe) {
        page.unsubscribe();
      }
      
      page.handlers.handwrite.cleanup();
      page.handlers.ppt.cleanup();
    }
    
    SyncController.leaveNote();
    
    // Remove selection change listener
    if (this.selectionChangeHandler && typeof window !== 'undefined') {
      document.removeEventListener('selectionchange', this.selectionChangeHandler);
      this.selectionChangeHandler = null;
    }
    
    // Clear all pages
    this.pages.clear();
    this.activePageId = null;
  }

  /**
   * Get all page IDs
   */
  public getAllPageIds(): string[] {
    return Array.from(this.pages.keys());
  }

  /**
   * Get page count
   */
  public getPageCount(): number {
    return this.pages.size;
  }

  /**
   * Get active page ID
   */
  public getActivePageId(): string | null {
    return this.activePageId;
  }
}

// Singleton instance
export const page = new PageController();
