import { writable, get } from 'svelte/store';
import type { NoteMetadata } from '../shared-types';
import { page, type FormattingState } from '$lib/controllers/PageController';
import { SyncController } from '$lib/controllers/SyncController';
import { yDocManagerFactory } from '$lib/managers/YDocManager';
import { connectionManagerFactory } from '$lib/managers/ConnectionManager';

export type PageState = {
  note: NoteMetadata | null;
  editorContent: string;
  hasUnsavedChanges: boolean;
  currentMode: 'word' | 'ppt' | 'handwrite';
  formattingStateValue: FormattingState;
  pptContainer: HTMLElement | null;
  canvasElement: HTMLCanvasElement | null;
  pageId: string | null;
  pageElement: HTMLElement | null;
  unsubscribe: (() => void) | null;
  backgroundUrl?: string | null;
  penColor: string;
  penSize: number;
  isEraser: boolean;
  isOverflowing?: boolean;
};

type PagesStoreState = {
  pages: PageState[];
  activePageIndex: number;
  pageStructureReady: boolean;
};

const createInitialPage = (): PageState => ({
  note: null,
  editorContent: '',
  hasUnsavedChanges: false,
  currentMode: 'word',
  formattingStateValue: {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    heading: 'p'
  },
  pptContainer: null,
  canvasElement: null,
  pageId: null,
  pageElement: null,
  unsubscribe: null,
  backgroundUrl: null,
  penColor: '#6ee7b7',
  penSize: 3,
  isEraser: false,
  isOverflowing: false
});

const initialState: PagesStoreState = {
  pages: [createInitialPage()],
  activePageIndex: 0,
  pageStructureReady: false
};

// Global-ish refs for this store instance
let pageStructureUnsubscribe: (() => void) | null = null;
let pageBackgroundsUnsubscribe: (() => void) | null = null;
let rootNoteIdValue: string | null = null;
let isHandlingOverflow = false; // Flag to prevent detectActivePage from running during overflow handling

function createPagesStore() {
  const { subscribe, update, set } = writable<PagesStoreState>(initialState);

  function setPages(updater: (pages: PageState[]) => PageState[]) {
    update((state) => ({
      ...state,
      pages: updater(state.pages)
    }));
  }

  function updatePageAt(
    index: number,
    updater: (page: PageState) => PageState
  ) {
    setPages((pages) => {
      if (!pages[index]) return pages;
      const copy = [...pages];
      copy[index] = updater(copy[index]);
      return copy;
    });
  }

  function setActivePageIndex(index: number) {
    update((state) => ({
      ...state,
      activePageIndex: index
    }));
  }

  function setPageStructureReady() {
    update((state) => ({ ...state, pageStructureReady: true }));
  }

  function setPageElement(index: number, el: HTMLElement | null) {
    updatePageAt(index, (page) => ({ ...page, pageElement: el }));
  }

  function setContainers(
    index: number,
    opts: { pptContainer?: HTMLElement | null; canvasElement?: HTMLCanvasElement | null }
  ) {
    updatePageAt(index, (page) => ({
      ...page,
      pptContainer: opts.pptContainer ?? page.pptContainer,
      canvasElement: opts.canvasElement ?? page.canvasElement
    }));
  }

  function markUnsaved(index: number) {
    updatePageAt(index, (page) => ({ ...page, hasUnsavedChanges: true }));
  }

  function setTitle(index: number, title: string) {
    updatePageAt(index, (page) => {
      if (!page.note) return page;
      return {
        ...page,
        note: { ...page.note, title },
        hasUnsavedChanges: true
      };
    });
  }

  async function savePage(
    pageIndex: number,
    rootNoteId: string | undefined,
    hooks: { setIsSaving: (v: boolean) => void }
  ) {
    const state = get({ subscribe });
    const pageState = state.pages[pageIndex];
    const noteId = pageIndex === 0 ? rootNoteId : pageState?.note?.id;

    if (!pageState?.note || !noteId) return;

    await SyncController.saveNote(
      noteId,
      {
        title: pageState.note.title,
        tags: pageState.note.tags,
        isPublic: pageState.note.isPublic
      },
      {
        onSaving: (saving) => {
          hooks.setIsSaving(saving);
        },
        onSaved: () => {
          updatePageAt(pageIndex, (page) => ({
            ...page,
            hasUnsavedChanges: false
          }));
        },
        onError: (err) => {
          // Error loading note
        }
      }
    );

    // Persist Yjs content snapshot as part of autosave.
    // This makes note content survive server cold starts / restarts.
    void SyncController.saveSnapshot(noteId);
  }

  async function sharePage(
    pageIndex: number,
    rootNoteId: string | undefined
  ): Promise<{ success: boolean; shareUrl?: string; error?: string }> {
    const state = get({ subscribe });
    const pageState = state.pages[pageIndex];
    const noteId = pageIndex === 0 ? rootNoteId : pageState?.note?.id;

    if (!pageState?.note || !noteId) {
      return { success: false, error: 'No note to share' };
    }

    const result = await SyncController.shareNote(noteId, true);
    if (result.success) {
      updatePageAt(pageIndex, (page) => {
        if (!page.note) return page;
        return {
          ...page,
          note: { ...page.note, isPublic: true }
        };
      });
    }

    return result;
  }

  function setHandwritePenColor(index: number, color: string) {
    updatePageAt(index, (page) => ({ ...page, penColor: color }));
  }

  function setHandwritePenSize(index: number, size: number) {
    updatePageAt(index, (page) => ({ ...page, penSize: size }));
  }

  function setHandwriteEraser(index: number, isEraser: boolean) {
    updatePageAt(index, (page) => ({ ...page, isEraser }));
  }

  function setMode(
    pageIndex: number,
    mode: 'word' | 'ppt' | 'handwrite'
  ) {
    updatePageAt(pageIndex, (page) => ({ ...page, currentMode: mode }));

    const state = get({ subscribe });
    const pageState = state.pages[pageIndex];
    if (pageState.pageId) {
      page.setMode(mode, pageState.pageId);
      page.setActivePage(pageState.pageId);
    }
  }

  /**
   * 切换激活页，并保持与 PageController / Yjs 同步。
   * 供滚动检测和键盘导航复用，避免重复实现。
   */
  function setActivePageWithSync(newActiveIndex: number) {
    const state = get({ subscribe });
    if (newActiveIndex < 0 || newActiveIndex >= state.pages.length) return;

    const activePageState = state.pages[newActiveIndex];
    setActivePageIndex(newActiveIndex);

    if (activePageState.pageId) {
      page.setActivePage(activePageState.pageId);
      page.setMode(activePageState.currentMode, activePageState.pageId);

      // 确保 Yjs 连接也跟随当前激活页
      if (activePageState.note && rootNoteIdValue) {
        void connectToPage(newActiveIndex, rootNoteIdValue);
      }
    }
  }

  /**
   * 通过方向（上一页/下一页）切换激活页，供键盘箭头导航使用。
   */
  function goToAdjacentPage(direction: 'prev' | 'next') {
    const state = get({ subscribe });
    const current = state.activePageIndex;
    const target = direction === 'prev' ? current - 1 : current + 1;
    if (target < 0 || target >= state.pages.length) return;
    setActivePageWithSync(target);
  }

  async function addPage(rootNoteId: string) {
    const state = get({ subscribe });
    const first = state.pages[0];
    if (!first?.note) {
      return;
    }

    const baseTitle = first.note.title.replace(/ - Page \d+$/, '');
    const pageNumber = state.pages.length + 1;
    const newPageTitle = `${baseTitle} - Page ${pageNumber}`;

    const newNote = await SyncController.createNote(newPageTitle);
    if (!newNote) {
      return;
    }

    const newPageState: PageState = {
      ...createInitialPage(),
      note: newNote,
      pageId: newNote.id
    };

    setPages((pages) => [...pages, newPageState]);

    page.createPage(newPageState.pageId!);
    page.initializeSyncCallbacks(newPageState.pageId!, newNote.id);

    // Push updated page IDs to Yjs from the device that actually added the page
    const pageStructureManager = yDocManagerFactory.getPageStructureManager();
    const allNoteIds = get({ subscribe }).pages
      .map((p) => p.note?.id || p.pageId || '')
      .filter(Boolean);
    pageStructureManager.setPageNoteIds(allNoteIds);

  }

  async function deletePage(pageIndex: number) {
    const state = get({ subscribe });
    if (state.pages.length <= 1) {
      return;
    }

    const pageState = state.pages[pageIndex];
    if (!pageState?.note?.id) {
      return;
    }

    // Delete the note from the backend (only this specific page, not related pages)
    const deleted = await SyncController.deleteNote(pageState.note.id, false);
    if (!deleted) {
      return;
    }

    // Remove the page from the local state
    setPages((pages) => {
      const newPages = [...pages];
      newPages.splice(pageIndex, 1);
      return newPages;
    });

    // Clean up page controller
    if (pageState.pageId) {
      page.removePage(pageState.pageId);
    }

    // Update Yjs with new page IDs
    const pageStructureManager = yDocManagerFactory.getPageStructureManager();
    const allNoteIds = get({ subscribe }).pages
      .map((p) => p.note?.id || p.pageId || '')
      .filter(Boolean);
    pageStructureManager.setPageNoteIds(allNoteIds);

    // Adjust active page index if needed
    const newState = get({ subscribe });
    if (newState.activePageIndex >= newState.pages.length) {
      setActivePageIndex(newState.pages.length - 1);
    }

  }

  async function maybeAddRemotePage(noteId: string) {
    try {
      let existingNote: NoteMetadata | null = null;

      await SyncController.loadNote(noteId, {
        onError: (err) => {
          // Failed to load existing page note
        },
        onSuccess: (note) => {
          existingNote = note;
        }
      });

      if (!existingNote) return;

      const state = get({ subscribe });
      const currentIds = state.pages
        .map((p) => p.note?.id || p.pageId || '')
        .filter(Boolean);

      if (currentIds.includes(noteId)) return;

      const pageStructureManager = yDocManagerFactory.getPageStructureManager();
      const pageIndex = get({ subscribe }).pages.length;
      
      // Check if there's a background URL in Yjs for this page
      const yjsBackgroundUrl = pageStructureManager.getPageBackground(pageIndex);

      const newPageState: PageState = {
        ...createInitialPage(),
        note: existingNote,
        pageId: existingNote.id,
        backgroundUrl: (yjsBackgroundUrl as string | null | undefined) || existingNote.backgroundUrl || null
      };

      setPages((pages) => [...pages, newPageState]);

      page.createPage(newPageState.pageId!);
      page.initializeSyncCallbacks(newPageState.pageId!, noteId);

    } catch (error) {
      // Error loading page note
    }
  }

  async function initFirstPage(
    rootNoteId: string,
    opts: {
      onLoadingChange: (loading: boolean) => void;
      onError: (err: string | null) => void;
    }
  ) {
    rootNoteIdValue = rootNoteId;
    const pageStructureManager = yDocManagerFactory.getPageStructureManager();

    opts.onLoadingChange(true);

    update((state) => {
      const pages = [...state.pages];
      pages[0] = { ...pages[0], pageId: rootNoteId };
      return { ...state, pages, activePageIndex: 0 };
    });

    page.createPage(rootNoteId);
    page.setActivePage(rootNoteId);

    let loadedNote: NoteMetadata | null = null;

    await SyncController.loadNote(rootNoteId, {
      onLoading: (loading) => opts.onLoadingChange(loading),
      onError: (err) => opts.onError(err),
      onSuccess: (note) => {
        loadedNote = note;
        setPages((pages) => {
          const copy = [...pages];
          copy[0] = { ...copy[0], note, backgroundUrl: note.backgroundUrl || null };
          return copy;
        });
        pageStructureManager.initialize(rootNoteId);
      }
    });

    if (loadedNote && loadedNote.id) {
      page.initializeSyncCallbacks(rootNoteId, rootNoteId);
      await connectToPage(0, rootNoteId);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { yPageNoteIds } = SyncController.getYjsInstances(rootNoteId);
    if (yPageNoteIds && yPageNoteIds.length > 0) {
      const existingNoteIds = yPageNoteIds.toArray() as string[];
      for (const noteId of existingNoteIds) {
        await maybeAddRemotePage(noteId);
      }
    }

    pageStructureUnsubscribe = pageStructureManager.observePageNoteIds(
      async (remoteNoteIds, event, addedIds) => {

        const localNoteIds = get({ subscribe }).pages
          .map((p) => p.note?.id || p.pageId || '')
          .filter(Boolean);

        for (const newNoteId of addedIds) {
          if (!newNoteId || localNoteIds.includes(newNoteId)) {
            continue;
          }
          await maybeAddRemotePage(newNoteId);
        }
      }
    );

    // Subscribe to page background changes via Yjs
      pageBackgroundsUnsubscribe = pageStructureManager.observePageBackgrounds(
      (pageIndex, backgroundUrl) => {
        setPages((pages) => {
          const copy = [...pages];
          if (copy[pageIndex]) {
            copy[pageIndex] = { ...copy[pageIndex], backgroundUrl: backgroundUrl || null };
          }
          return copy;
        });
      }
    );

    // Load initial backgrounds from Yjs
    const yPageBackgrounds = pageStructureManager.yPageBackgrounds;
    if (yPageBackgrounds) {
      yPageBackgrounds.forEach((backgroundUrl, key) => {
        const pageIndex = parseInt(key, 10);
        if (!isNaN(pageIndex) && backgroundUrl) {
          setPages((pages) => {
            const copy = [...pages];
            if (copy[pageIndex]) {
              copy[pageIndex] = { ...copy[pageIndex], backgroundUrl };
            }
            return copy;
          });
        }
      });
    }

    setPageStructureReady();
    page.setupSelectionChangeListener();
    opts.onLoadingChange(false);

    const finalState = get({ subscribe });
    // Initialization complete
  }

  async function connectToPage(
    pageIndex: number,
    rootNoteId: string,
    options?: { keepExistingConnections?: boolean }
  ) {
    const state = get({ subscribe });
    const pages = state.pages;
    const pageState = pages[pageIndex];
    const keepExistingConnections = options?.keepExistingConnections ?? false;


    const noteId = pageIndex === 0 ? rootNoteId : pageState.note?.id;

    if (!pageState.pageId || !pageState.note || !noteId) {
      return;
    }

    // If keepExistingConnections is true, only unsubscribe the target page if it's already connected
    // Otherwise, unsubscribe all pages
    if (keepExistingConnections) {
      // Only unsubscribe the target page if it has an existing subscription
      if (pageState.unsubscribe) {
        pageState.unsubscribe();
        setPages((pages) => {
          const copy = [...pages];
          if (copy[pageIndex]) {
            copy[pageIndex] = { ...copy[pageIndex], unsubscribe: undefined };
          }
          return copy;
        });
      }
    } else {
      // Unsubscribe all pages
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].unsubscribe) {
        pages[i].unsubscribe!();
      }
    }
      // Disconnect all connections
    SyncController.leaveNote();
    await new Promise((resolve) => setTimeout(resolve, 150));
    }

      if (pageIndex === 1 && pageState.pageId !== pageState.note.id) {
        const oldPageId = pageState.pageId;
        pageState.pageId = pageState.note.id;
        page.removePage(oldPageId);
        page.createPage(pageState.pageId);
      }

      const targetNoteId = noteId;
      const targetPageId = pageState.pageId;

    page.initializeSyncCallbacks(targetPageId, targetNoteId);

      const unsubscribeFn = await page.setupYjsObservers(
        targetNoteId,
        {
          onInitialContent: (content) => {
            if (typeof content !== 'string') return;

            const current = get({ subscribe });
            const idx = current.pages.findIndex(
              (p) => p.note?.id === targetNoteId
            );
            if (idx < 0) return;

            setPages((pages) => {
              const copy = [...pages];
              if (!copy[idx]) return pages;
              copy[idx] = { ...copy[idx], editorContent: content };
              return copy;
            });
          },
          onContentChange: (content) => {
            if (typeof content !== 'string') return;

            const current = get({ subscribe });
            const idx = current.pages.findIndex(
              (p) => p.note?.id === targetNoteId
            );
            if (idx < 0) return;

            setPages((pages) => {
              const copy = [...pages];
              if (!copy[idx]) return pages;
              copy[idx] = { ...copy[idx], editorContent: content };
              return copy;
            });
          }
        },
        targetPageId
      );

      setPages((pages) => {
        const copy = [...pages];
        if (!copy[pageIndex]) return pages;
        copy[pageIndex] = { ...copy[pageIndex], unsubscribe: unsubscribeFn || null };
        return copy;
      });

  }

  function detectActivePage(viewportWidth: number, viewportHeight: number) {
    // Don't change active page during overflow handling to prevent interrupting user editing
    if (isHandlingOverflow) return;
    
    const state = get({ subscribe });
    if (state.pages.length === 0) return;

    const visibleAreas = state.pages.map((pageState) => {
      if (!pageState.pageElement) return 0;
      const rect = pageState.pageElement.getBoundingClientRect();
      return (
        Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)) *
        Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0))
      );
    });

    let maxArea = 0;
    let newActiveIndex = 0;
    for (let i = 0; i < visibleAreas.length; i++) {
      if (visibleAreas[i] > maxArea) {
        maxArea = visibleAreas[i];
        newActiveIndex = i;
      }
    }

    if (newActiveIndex !== state.activePageIndex) {
      setActivePageWithSync(newActiveIndex);
    }
  }

  function setHandlingOverflow(value: boolean) {
    isHandlingOverflow = value;
  }

  function cleanup() {
    const state = get({ subscribe });

    if (pageStructureUnsubscribe) {
      pageStructureUnsubscribe();
      pageStructureUnsubscribe = null;
    }

    if (pageBackgroundsUnsubscribe) {
      pageBackgroundsUnsubscribe();
      pageBackgroundsUnsubscribe = null;
    }

    for (const p of state.pages) {
      if (p.unsubscribe) {
        p.unsubscribe();
      }
      if (p.pageId) {
        page.removePage(p.pageId);
      }
    }

    // Cleanup all connections and managers
    connectionManagerFactory.destroyAll();
    yDocManagerFactory.destroyAll();
    set(initialState);
    isHandlingOverflow = false; // Reset flag on cleanup
  }

  return {
    subscribe,
    setPages,
    setActivePageIndex,
    setPageStructureReady,
    setPageElement,
    setContainers,
    markUnsaved,
    setTitle,
    savePage,
    sharePage,
    setHandwritePenColor,
    setHandwritePenSize,
    setHandwriteEraser,
    setMode,
    addPage,
    deletePage,
    initFirstPage,
    connectToPage,
    detectActivePage,
    setHandlingOverflow,
    cleanup,
    setActivePageWithSync,
    goToAdjacentPage
  };
}

export const pagesStore = createPagesStore();


