<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount, onDestroy, tick } from 'svelte';
  import { currentUser } from '../../stores/authStore';
  import type { NoteMetadata } from '../../shared-types';
  import { page, formattingState } from '$lib/controllers/PageController';
  import EditorContainer from '$lib/components/EditorContainer.svelte';
  import { pagesStore, type PageState } from '../../stores/pagesStore';
  import { applyPdfBackgrounds } from '$lib/services/pdfBackgroundService';
  import { SyncController } from '$lib/controllers/SyncController';
  
  // Export params from router
  export let params: { id?: string } = {};
  
  // UI State
  let isLoading = true;
  let isSaving = false;
  let error: string | null = null;
  let sidebarCollapsed = true;
  let showShareModal = false;
  let shareUrl = '';
  const textColorOptions = ['#000000', '#ffffff', '#6ee7b7', '#3b82f6', '#f87171', '#fbbf24', '#a78bfa', '#9ca3af'];
  const highlightColorOptions = ['#fff59d', '#fef3c7', '#fde68a', '#fbcfe8', '#bfdbfe', '#c7d2fe', '#bbf7d0'];
  let showTextPalette = false;
  let showHighlightPalette = false;
  let textPalettePos = { top: 0, left: 0 };
  let highlightPalettePos = { top: 0, left: 0 };
  let textTriggerEl: HTMLButtonElement | null = null;
  let highlightTriggerEl: HTMLButtonElement | null = null;
  let selectedPptTool: 'text' | 'image' | 'shape' | null = null;

  // PDF upload input (used for background generation)
  let debugPdfInput: HTMLInputElement | null = null;

  // Base page size for scaling (used to keep text size relative to page)
  const BASE_PAGE_WIDTH = 1280;
  const BASE_PAGE_HEIGHT = 720;

  // Pages array (each page is a separate note)
  let pages: PageState[] = [
    {
      note: null,
      editorContent: '',
      hasUnsavedChanges: false,
      currentMode: 'word',
      formattingStateValue: { isBold: false, isItalic: false, isUnderline: false, heading: 'p' },
      pptContainer: null,
      canvasElement: null,
      pageId: null,
      pageElement: null,
      unsubscribe: null,
      backgroundUrl: null,
      penColor: '#6ee7b7',
      isOverflowing: false,
      penSize: 3,
      isEraser: false
    }
  ];
  
  // Active page index (0 = page 1, 1 = page 2)
  let activePageIndex = 0;

  // ResizeObservers per page element for scaling
  const pageResizeObservers = new Map<HTMLElement, ResizeObserver>();

  // EditorContainer component refs for calling checkOverflow on non-active pages
  let editorContainerRefs: ({ 
    checkOverflowForPage: () => Promise<void>;
    waitForOverflowQueueCompletion: () => Promise<void>;
  } | null)[] = [];

  // Active note convenience reference
  let activeNote: NoteMetadata | null = null;

  const unsubscribePagesStore = pagesStore.subscribe(($state) => {
    pages = $state.pages;
    activePageIndex = $state.activePageIndex;
  });

  // 键盘箭头跨页：监听来自 WordHandler 的全局事件，复用与滚动相同的激活页逻辑，
  // 再显式聚焦目标页的编辑器并设置光标位置。
  async function handlePageArrowNav(event: Event) {
    const e = event as CustomEvent<{ direction: 'prev' | 'next' }>;
    const dir = e.detail?.direction;
    if (!dir) return;

    const currentIndex = activePageIndex;
    const targetIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    // 使用 pagesStore 的统一方法切换激活页（含 PageController + Yjs）
    pagesStore.setActivePageWithSync(targetIndex);

    // 等待 Svelte 更新 DOM
    await tick();

    const targetPageState = pages[targetIndex];
    if (!targetPageState || !targetPageState.pageId) return;

    // 获取该页的 word handler，并先让它聚焦 editor（内部会把光标放到末尾）
    const handlers = page.getHandlers(targetPageState.pageId);
    if (!handlers || !handlers.word) return;
    handlers.word.focusEditor();

    // 再根据方向，把光标挪到“页首”或“页尾”的合适位置
    const activePageContainer = document.querySelector('.page-container.active');
    const wordEditor = activePageContainer
      ? (activePageContainer.querySelector('.word-editor') as HTMLDivElement | null)
      : (document.querySelector('.word-editor.active') as HTMLDivElement | null);

    if (!wordEditor) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();

    if (dir === 'next') {
      // 下页：光标到本页开头
      range.setStart(wordEditor, 0);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // 上页：将光标放到“最后一个文本节点”的末尾，再调用调整逻辑，确保停在 ⏎ 之前
      const walker = document.createTreeWalker(wordEditor, NodeFilter.SHOW_TEXT, null);
      let lastText: Text | null = null;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        lastText = node as Text;
      }

      if (lastText) {
        range.setStart(lastText, lastText.textContent?.length || 0);
        range.collapse(true);
      } else {
        // 没有文本节点，退回原逻辑
        range.selectNodeContents(wordEditor);
        range.collapse(false);
      }

      selection.removeAllRanges();
      selection.addRange(range);

      // 调用 WordHandler 的光标调整逻辑，确保光标在换页符 ⏎ 之前，而不是之后
      const targetHandlers = page.getHandlers(targetPageState.pageId);
      if (targetHandlers && targetHandlers.word) {
        targetHandlers.word.adjustCursorPosition();
      }
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('page-arrow-nav', handlePageArrowNav as EventListener);
    }
  });

  onDestroy(() => {
    unsubscribePagesStore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('page-arrow-nav', handlePageArrowNav as EventListener);
    }
  });

  $: activeNote = pages[activePageIndex]?.note ?? null;
  
  // Formatting state subscriptions
  formattingState.subscribe(state => {
    pages[activePageIndex] = { ...pages[activePageIndex], formattingStateValue: state };
    pages = pages;
  });
  
  // Mode subscriptions
  page.subscribeMode(mode => {
    pages[activePageIndex] = { ...pages[activePageIndex], currentMode: mode };
    pages = pages;
    // Clear PPT tool selection when mode changes
    if (mode !== 'ppt') {
      selectedPptTool = null;
      const pageId = pages[activePageIndex]?.pageId;
      if (pageId) {
        const handler = page.getHandlers(pageId);
        if (handler) {
          handler.ppt.setSelectedTool(null);
        }
      }
    }
  });

  // Setup elements when they become available - use loop for all pages
  $: {
    for (let i = 0; i < pages.length; i++) {
      const pageState = pages[i];
      if (pageState.pageElement) {
        updatePageScale(pageState);
        // Attach resize observer once per element to update scale on size changes
        if (!pageResizeObservers.has(pageState.pageElement)) {
          const observer = new ResizeObserver(() => updatePageScale(pageState));
          observer.observe(pageState.pageElement);
          pageResizeObservers.set(pageState.pageElement, observer);
        }
      }
      if (pageState.pptContainer && pageState.currentMode && pageState.pageId) {
        page.setPPTContainer(pageState.pptContainer, {
          onUnsavedChange: () => { pagesStore.markUnsaved(i); }
        }, pageState.pageId);
      }
      
      if (pageState.canvasElement && pageState.currentMode && pageState.pageId) {
        page.setCanvasElement(pageState.canvasElement, {
          onUnsavedChange: () => { pagesStore.markUnsaved(i); }
        }, pageState.pageId);
      }
    }
  }

  // Active page detection based on visible area
  function detectActivePage() {
    if (pages.length === 0) return;
    pagesStore.detectActivePage(window.innerWidth, window.innerHeight);
    updateAllPageScales();
  }

  function updatePageScale(pageState: PageState) {
    const el = pageState.pageElement;
    if (!el) return;
    const width = el.clientWidth || BASE_PAGE_WIDTH;
    const height = el.clientHeight || BASE_PAGE_HEIGHT;
    el.style.setProperty('--page-scale', (width / BASE_PAGE_WIDTH).toString());
    el.style.setProperty('--page-scale-y', (height / BASE_PAGE_HEIGHT).toString());

    // Force PPT and handwrite handlers to refresh with new scale
    if (pageState.pageId) {
      const handlers = page.getHandlers(pageState.pageId);
      handlers?.ppt.refresh();
      handlers?.handwrite.refresh();
    }
  }

  function updateAllPageScales() {
    for (const pageState of pages) {
      if (pageState.pageElement) {
        updatePageScale(pageState);
      }
    }
  }

  // Update scales immediately on viewport resize
  let globalResizeUnsub: (() => void) | null = null;
  if (typeof window !== 'undefined') {
    const handler = () => updateAllPageScales();
    window.addEventListener('resize', handler);
    globalResizeUnsub = () => window.removeEventListener('resize', handler);
  }

  // Setup scroll listener for active page detection
  let scrollListener: (() => void) | null = null;

  // Switch to next page and connect Yjs sync
  async function switchToNextPage() {
    if (!params.id) return;
    
    const nextPageIndex = activePageIndex + 1;
    if (nextPageIndex >= pages.length) {
      // If there's no next page, create a new one
      await addNewPage();
      return;
    }
    
    // Switch to the next page
    pagesStore.setActivePageIndex(nextPageIndex);
    
    // Wait for active page index to update
    await tick();
    
    // Connect Yjs sync to the next page - this switches sync from current page to next page
    await pagesStore.connectToPage(nextPageIndex, params.id);
    
    // Ensure the page is in word mode
    const nextPageState = pages[nextPageIndex];
    if (nextPageState && nextPageState.pageId) {
      pagesStore.setMode(nextPageIndex, 'word');
      page.setActivePage(nextPageState.pageId);
      
      // Focus the editor after a short delay to ensure DOM is ready
      setTimeout(() => {
        const handler = page.getHandlers(nextPageState.pageId!);
        if (handler && handler.word) {
          handler.word.focusEditor();
          
          // Move cursor to the start of the page
          const activePageContainer = document.querySelector('.page-container.active');
          const wordEditor = activePageContainer
            ? (activePageContainer.querySelector('.word-editor') as HTMLDivElement | null)
            : (document.querySelector('.word-editor.active') as HTMLDivElement | null);
          
          if (wordEditor) {
            const range = document.createRange();
            const selection = window.getSelection();
            
            if (selection && wordEditor.childNodes.length > 0) {
              // Move cursor to the start of the first child node
              range.setStart(wordEditor, 0);
              range.collapse(true); // Collapse to start
              selection.removeAllRanges();
              selection.addRange(range);
            } else if (selection) {
              // If editor is empty, set cursor at the start
              range.setStart(wordEditor, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 150);
    }
  }

  // Add a new page via store and focus the editor
  async function addNewPage() {
    if (!params.id) return;
    
    // Get current page count before adding
    const currentPageCount = pages.length;
    
    // Add the new page
    await pagesStore.addPage(params.id);
    
    // Wait for Svelte to update the reactive state
    await tick();
    
    // Switch to the new page (it will be at index currentPageCount)
    const newPageIndex = currentPageCount;
    
    pagesStore.setActivePageIndex(newPageIndex);
    
    // Wait for active page index to update
    await tick();
    
    // Connect Yjs sync to the new page - this switches sync from old page to new page
    await pagesStore.connectToPage(newPageIndex, params.id);
    
    // Ensure the page is in word mode
    const newPageState = pages[newPageIndex];
    if (newPageState && newPageState.pageId) {
      pagesStore.setMode(newPageIndex, 'word');
      page.setActivePage(newPageState.pageId);
      
      // Focus the editor after a short delay to ensure DOM is ready
      setTimeout(() => {
        const handler = page.getHandlers(newPageState.pageId!);
        if (handler && handler.word) {
          handler.word.focusEditor();
        }
      }, 150);
    }
  }

  // Connect to a page for overflow handling without switching active page
  // This allows both the original page and the overflow target page to sync simultaneously
  async function connectToPageForOverflow(targetPageIndex: number, rootNoteId: string) {
    if (!params.id) return;
    
    // Connect to target page WITHOUT:
    // - Changing activePageIndex (keep user on original page)
    // - Calling page.setActivePage() (don't change focus)
    // - Focusing the editor (user stays on original page)
    
    // Use keepExistingConnections option to maintain sync on original page
    await pagesStore.connectToPage(targetPageIndex, rootNoteId, {
      keepExistingConnections: true
    });
    
    // Set mode but don't change active page or focus
    const targetPageState = pages[targetPageIndex];
    if (targetPageState && targetPageState.pageId) {
      pagesStore.setMode(targetPageIndex, 'word');
      // DON'T call: page.setActivePage()
      // DON'T call: pagesStore.setActivePageIndex()
      // DON'T focus the editor
    }
  }

  // Main handler for add page button - checks if current page is last page
  async function addPage() {
    const isLastPage = activePageIndex === pages.length - 1;
    
    if (isLastPage) {
      // If on last page, create a new page
      await addNewPage();
    } else {
      // If not on last page, just switch to next page
      await switchToNextPage();
    }
  }

  // Switch to previous page and connect Yjs sync
  async function switchToBeforePage() {
    if (!params.id) return;
    
    const prevPageIndex = activePageIndex - 1;
    if (prevPageIndex < 0) {
      // Already on first page, nothing to do
      return;
    }
    
    // Switch to the previous page
    pagesStore.setActivePageIndex(prevPageIndex);
    
    // Wait for active page index to update
    await tick();
    
    // Connect Yjs sync to the previous page
    await pagesStore.connectToPage(prevPageIndex, params.id);
    
    // Ensure the page is in word mode
    const prevPageState = pages[prevPageIndex];
    if (prevPageState && prevPageState.pageId) {
      pagesStore.setMode(prevPageIndex, 'word');
      page.setActivePage(prevPageState.pageId);
      
      // Focus the editor after a short delay to ensure DOM is ready
      setTimeout(() => {
        const handler = page.getHandlers(prevPageState.pageId!);
        if (handler && handler.word) {
          handler.word.focusEditor();
          
          // Move cursor to the end of the page
          const activePageContainer = document.querySelector('.page-container.active');
          const wordEditor = activePageContainer
            ? (activePageContainer.querySelector('.word-editor') as HTMLDivElement | null)
            : (document.querySelector('.word-editor.active') as HTMLDivElement | null);
          
          if (wordEditor) {
            const range = document.createRange();
            const selection = window.getSelection();
            
            if (selection && wordEditor.childNodes.length > 0) {
              // Move cursor to the end of the last child node
              const lastChild = wordEditor.childNodes[wordEditor.childNodes.length - 1];
              range.setStartAfter(lastChild);
              range.collapse(false); // Collapse to end
              selection.removeAllRanges();
              selection.addRange(range);
            } else if (selection) {
              // If editor is empty, set cursor at the start
              range.setStart(wordEditor, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 150);
    }
  }

  // Delete an empty page (only if it's empty and not the only page)
  async function deleteEmptyPage() {
    if (!params.id) return;
    
    const currentPageState = pages[activePageIndex];
    if (!currentPageState) return;
    
    // Check if page is empty (no content or only whitespace)
    const isPageEmpty = !currentPageState.editorContent || 
                       currentPageState.editorContent.trim() === '' ||
                       currentPageState.editorContent.replace(/<[^>]*>/g, '').trim() === '';
    
    // Check if it's not the only page
    const isNotOnlyPage = pages.length > 1;
    
    if (isPageEmpty && isNotOnlyPage) {
      const pageIndexToDelete = activePageIndex;
      
      // If deleting the last page, switch to previous page first
      if (pageIndexToDelete === pages.length - 1) {
        await switchToBeforePage();
        await tick();
      } else {
        // If deleting a middle page, switch to next page first
        await switchToNextPage();
        await tick();
      }
      
      // Now delete the page
      await pagesStore.deletePage(pageIndexToDelete);
      
      // Wait for state to update
      await tick();
      
      // Ensure we're on a valid page (reactive state will update automatically)
      if (activePageIndex >= pages.length) {
        pagesStore.setActivePageIndex(pages.length - 1);
      }
    }
  }

  // Main handler for delete page button
  async function deletePage() {
    // Don't do anything if on first page
    if (activePageIndex === 0) return;
    
    const currentPageState = pages[activePageIndex];
    if (!currentPageState) return;
    
    // Check if page is empty (no content or only whitespace)
    const isPageEmpty = !currentPageState.editorContent || 
                       currentPageState.editorContent.trim() === '' ||
                       currentPageState.editorContent.replace(/<[^>]*>/g, '').trim() === '';
    
    // Check if it's not the only page
    const isNotOnlyPage = pages.length > 1;
    
    if (isPageEmpty && isNotOnlyPage) {
      // If page is empty and not the only page, delete it
      await deleteEmptyPage();
    } else {
      // Otherwise, switch to previous page
      await switchToBeforePage();
    }
  }
  
  // Move content from the next page to the current page
  // targetPageIndex: The page index that needs content from the next page
  // availableSpace: The vertical space available in the target page
  // Returns: HTML content to add to the target page, or null if no content to move
  async function moveContentFromNextPage(targetPageIndex: number, availableSpace: number): Promise<string | null> {
    // Get the next page index
    const nextPageIndex = targetPageIndex + 1;
    
    // Check if next page exists
    if (nextPageIndex >= pages.length) {
      return null;
    }
    
    // Get the next page state
    const nextPageState = pages[nextPageIndex];
    if (!nextPageState) {
      return null;
    }
    
    // Find the next page container and word editor
    const pageContainers = document.querySelectorAll('.page-container');
    const nextPageContainer = pageContainers[nextPageIndex] as HTMLElement | null;
    const wordEditor = nextPageContainer
      ? (nextPageContainer.querySelector('.word-editor') as HTMLDivElement | null)
      : null;
    
    if (!wordEditor) {
      return null;
    }
    
    // Get all block-level children from the next page
    const blockElements = Array.from(wordEditor.children).filter(
      (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)
    ) as HTMLElement[];
    
    if (blockElements.length === 0) {
      return null;
    }
    
    // Force a synchronous reflow to ensure accurate measurements
    void wordEditor.offsetHeight;
    
    // Calculate how many lines can fit in the available space
    // Accumulate heights from top until we exceed availableSpace
    let accumulatedHeight = 0;
    let lastFittingIndex = -1;
    
    for (let i = 0; i < blockElements.length; i++) {
      const element = blockElements[i];
      const elementHeight = element.offsetHeight;
      
      // Check if adding this element would exceed available space
      if (accumulatedHeight + elementHeight > availableSpace) {
        break;
      }
      
      accumulatedHeight += elementHeight;
      lastFittingIndex = i;
    }
    
    // If no elements fit, return null
    if (lastFittingIndex < 0) {
      return null;
    }
    
    // Collect HTML of all elements that fit (from 0 to lastFittingIndex)
    let contentToMove = '';
    for (let i = 0; i <= lastFittingIndex; i++) {
      contentToMove += blockElements[i].outerHTML;
    }
    
    // Remove the moved elements from the next page (in reverse order to avoid index shifting)
    for (let i = lastFittingIndex; i >= 0; i--) {
      wordEditor.removeChild(blockElements[i]);
    }
    
    // Update the next page's content state
    const remainingContent = wordEditor.innerHTML;
    
    // Get the next page's note ID explicitly to avoid sync conflicts
    const nextPageNoteId = nextPageIndex === 0 ? params.id : nextPageState.note?.id;
    
    // Sync page content directly without triggering input handlers
    // Pass explicit note ID to prevent conflicts during cascading overflows
    if (nextPageNoteId) {
      syncPageContent(nextPageIndex, remainingContent, nextPageNoteId);
    }
    
    // Wait for DOM to update
    await tick();
    
    // CRITICAL FIX: Ensure EditorContainer's editorContent prop is updated
    // This is needed because the reactive statement skips updates for inactive pages
    // We need to ensure state is in sync before checking underflow
    const nextPageEditorContainer = editorContainerRefs[nextPageIndex];
    if (nextPageEditorContainer) {
      // Force update by triggering reactivity
      pages[nextPageIndex] = {
        ...pages[nextPageIndex],
        editorContent: remainingContent
      };
      pages = pages;
      await tick();
      
      // Force another reflow to ensure DOM is fully updated
      if (wordEditor) {
        void wordEditor.offsetHeight;
      }
    }
    
    // CRITICAL FIX: Trigger underflow check on the next page (source page)
    // After removing content from page 2, page 2 should check if it needs to pull from page 3
    if (nextPageEditorContainer && typeof nextPageEditorContainer.checkOverflowForPage === 'function') {
      try {
        // Wait for DOM to update after content removal
        await tick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Force a reflow to ensure DOM measurements are accurate
        if (wordEditor) {
          void wordEditor.offsetHeight;
        }
        
        // Trigger underflow check on the next page
        // This will queue an underflow check which will pull content from page 3 if needed
        await nextPageEditorContainer.checkOverflowForPage();
        
        // Wait for the underflow queue to complete
        if (typeof nextPageEditorContainer.waitForOverflowQueueCompletion === 'function') {
          await nextPageEditorContainer.waitForOverflowQueueCompletion();
        }
      } catch (err) {
        // Error checking underflow on next page
        console.error(`Error triggering underflow check on page ${nextPageIndex}:`, err);
      }
    }
    
    return contentToMove;
  }
  
  // Move content to the next/new page
  // This function keeps the user on the original page while syncing both pages
  // sourcePageIndex: The page index where overflow occurred (not necessarily the active page)
  async function moveContentToNextPage(content: string, sourcePageIndex: number, cursorInfo?: { offset: number } | null) {
    if (!params.id) return;
    
    // If no content to move, return early
    if (!content || content.trim() === '') {
      return;
    }
    
    // Prevent detectActivePage from running during overflow handling
    // This ensures the user's active page doesn't change and editor doesn't get disabled
    pagesStore.setHandlingOverflow(true);
    
    try {
    // Use sourcePageIndex instead of activePageIndex to correctly identify the overflowing page
    const currentPageIndex = sourcePageIndex;
    const isLastPage = currentPageIndex === pages.length - 1;
    let targetPageIndex: number;
    
    if (isLastPage) {
      // If on last page, create a new page but DON'T switch to it
      // Get current page count before adding
      const currentPageCount = pages.length;
      
      // Add the new page
      await pagesStore.addPage(params.id);
      
      // Wait for Svelte to update the reactive state
      await tick();
      
      // The new page will be at index currentPageCount
      targetPageIndex = currentPageCount;
    } else {
      // If not on last page, use the next page index
      targetPageIndex = currentPageIndex + 1;
    }
    
    // Connect to target page WITHOUT switching active page
    // This allows both original page and target page to sync simultaneously
    await connectToPageForOverflow(targetPageIndex, params.id);
      
      // Wait for DOM and state to update
      await tick();
      await new Promise(resolve => setTimeout(resolve, 100));
      
    // Get the target page state
    const targetPageState = pages[targetPageIndex];
      
    // Add content to the beginning of the target page
    if (targetPageState) {
      const currentContent = targetPageState.editorContent || '';
      
      // Get the target page's note ID explicitly to avoid sync conflicts
      const targetNoteId = targetPageIndex === 0 ? params.id : targetPageState.note?.id;
      
      // CRITICAL FIX: Wait for target page's overflow processing to complete
      // before adding content, to ensure the overflow check can process the new content
      const editorContainer = editorContainerRefs[targetPageIndex];
      if (editorContainer && typeof editorContainer.waitForOverflowQueueCompletion === 'function') {
        try {
          await editorContainer.waitForOverflowQueueCompletion();
        } catch (err) {
          // Error waiting for queue completion, continue anyway
        }
      }
      
      const newContent = content + currentContent;
      
      // Update state first
      pages[targetPageIndex] = {
        ...targetPageState,
        editorContent: newContent
      };
      pages = pages;
      
      // Wait for Svelte reactivity to propagate
      await tick();
      
      // Find the target page container (not necessarily active)
      const pageContainers = document.querySelectorAll('.page-container');
      const targetPageContainer = pageContainers[targetPageIndex] as HTMLElement | null;
      const wordEditor = targetPageContainer
        ? (targetPageContainer.querySelector('.word-editor') as HTMLDivElement | null)
        : null;
        
      if (wordEditor) {
        // Update DOM directly to ensure immediate visibility
        wordEditor.innerHTML = newContent;
        
        // Force a reflow to ensure DOM measurements are accurate
        void wordEditor.offsetHeight;
        
        // Sync page content directly without triggering input handlers
        // Pass explicit note ID to prevent conflicts during cascading overflows
        if (targetNoteId) {
          syncPageContent(targetPageIndex, newContent, targetNoteId);
        }
        
        // Wait for EditorContainer component to be fully mounted and state synced
        await tick();
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // CRITICAL: Ensure EditorContainer's editorContent prop is updated
        // This is needed because the reactive statement skips updates for inactive pages
        // We need to ensure state is in sync before checking overflow
        if (editorContainer) {
          // Force update by triggering reactivity
          pages[targetPageIndex] = {
            ...pages[targetPageIndex],
            editorContent: newContent
          };
          pages = pages;
          await tick();
          
          // Force another reflow to ensure DOM is fully updated
          void wordEditor.offsetHeight;
        }
        
        // Check for overflow on the target page after content is added
        // This handles the case where adding content to page 2 causes it to overflow
        // and needs to move content to page 3
        if (editorContainer && typeof editorContainer.checkOverflowForPage === 'function') {
          try {
            // 关键：等待目标页面的溢出检查和处理完成
            await editorContainer.checkOverflowForPage();
            
            // 等待目标页面的溢出队列处理完成
            // 这确保了由移动引起的溢出在移动下一行之前被解决
            if (typeof editorContainer.waitForOverflowQueueCompletion === 'function') {
              await editorContainer.waitForOverflowQueueCompletion();
            }
          } catch (err) {
            // Error checking overflow on target page
          }
        }
        
        // CRITICAL FIX: Restore cursor on next page if cursor was in overflow content
        if (cursorInfo && cursorInfo.offset !== undefined && cursorInfo.offset !== null) {
          // CRITICAL FIX: If cursor is in overflow content, switch to the target page
          // so the cursor can be restored and the user can see it
          if (targetPageIndex !== activePageIndex) {
            pagesStore.setActivePageWithSync(targetPageIndex);
            // Wait for page switch to complete
            await tick();
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Wait for DOM to be fully updated
          await tick();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Find the target page's editor
          const targetPageContainers = document.querySelectorAll('.page-container');
          const targetPageContainer = targetPageContainers[targetPageIndex] as HTMLElement | null;
          const targetWordEditor = targetPageContainer
            ? (targetPageContainer.querySelector('.word-editor') as HTMLDivElement | null)
            : null;
          
          // Now restore cursor (target page should be active after switch above)
          if (targetWordEditor) {
            const selection = window.getSelection();
            if (selection) {
              // Calculate the length of moved content to determine cursor position
              const movedContentLength = (() => {
                // Create a temporary div to measure moved content length
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                return (tempDiv.textContent || '').length;
              })();
              
              // Clamp cursor offset to valid range within moved content
              const targetCursorOffset = Math.min(cursorInfo.offset, movedContentLength);
              
              // Find text node at the cursor offset within the moved content
              const walker = document.createTreeWalker(
                targetWordEditor,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let currentOffset = 0;
              let textNode: Text | null;
              let targetNode: Text | null = null;
              let targetOffset = 0;
              let lastNodeInMovedContent: Text | null = null;
              
              // Only count characters in the moved content (first part of editor)
              while (textNode = walker.nextNode() as Text | null) {
                const textLength = textNode.textContent?.length || 0;
                
                // Only consider text within the moved content
                if (currentOffset + textLength <= movedContentLength) {
                  // Track the last node we've seen within moved content
                  lastNodeInMovedContent = textNode;
                  
                  if (currentOffset + textLength >= targetCursorOffset) {
                    targetNode = textNode;
                    targetOffset = targetCursorOffset - currentOffset;
                    break;
                  }
                  currentOffset += textLength;
                } else {
                  // We've reached content beyond the moved content
                  // If we haven't found the target yet, use the last node of moved content
                  if (!targetNode && currentOffset < targetCursorOffset && lastNodeInMovedContent) {
                    targetNode = lastNodeInMovedContent;
                    targetOffset = lastNodeInMovedContent.textContent?.length || 0;
                  }
                  break;
                }
              }
              
              // If we've gone through all nodes but haven't found target (cursor at end of moved content)
              if (!targetNode && lastNodeInMovedContent) {
                targetNode = lastNodeInMovedContent;
                targetOffset = lastNodeInMovedContent.textContent?.length || 0;
              }
              
              // If we didn't find a node, use the first text node or end of first element
              if (!targetNode) {
                const firstChild = targetWordEditor.firstElementChild;
                if (firstChild) {
                  const firstTextWalker = document.createTreeWalker(
                    firstChild,
                    NodeFilter.SHOW_TEXT,
                    null
                  );
                  const firstTextNode = firstTextWalker.nextNode() as Text | null;
                  if (firstTextNode) {
                    targetNode = firstTextNode;
                    targetOffset = Math.min(targetCursorOffset, firstTextNode.textContent?.length || 0);
                  } else {
                    // No text node found, place at start of first element
                    const range = document.createRange();
                    range.selectNodeContents(firstChild);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    targetWordEditor.focus();
                    return;
                  }
                }
              }
              
              if (targetNode) {
                const finalOffset = Math.min(targetOffset, targetNode.textContent?.length || 0);
                const range = document.createRange();
                range.setStart(targetNode, finalOffset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                targetWordEditor.focus();
              }
            }
          }
        }
      }
    }
    } finally {
      // Re-enable detectActivePage after overflow handling is complete
      // Use a small delay to ensure all DOM updates are settled
      setTimeout(() => {
        pagesStore.setHandlingOverflow(false);
      }, 300);
    }
  }

  // Computed property to determine if current page is last page
  $: isLastPage = activePageIndex === pages.length - 1;

  onMount(() => {
    (async () => {
      if (params.id) {
        await pagesStore.initFirstPage(params.id, {
          onLoadingChange: (loading) => { isLoading = loading; },
          onError: (err) => { error = err; }
        });
      }
    })();

    // Setup autosave
    const autosaveInterval = setInterval(() => {
      for (let i = 0; i < pages.length; i++) {
        const pageState = pages[i];
        if (pageState.hasUnsavedChanges && pageState.note && pageState.pageId) {
          void saveNote(i);
        }
      }
    }, 30000); // Autosave every 30 seconds
    
    // Setup scroll listener for active page detection
    scrollListener = () => {
      detectActivePage();
    };
    window.addEventListener('scroll', scrollListener, true);
    window.addEventListener('resize', scrollListener);
    
    // Initial detection
    setTimeout(detectActivePage, 100);

    return () => {
      clearInterval(autosaveInterval);
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener, true);
        window.removeEventListener('resize', scrollListener);
      }
      if (globalResizeUnsub) {
        globalResizeUnsub();
      }
      // Cleanup resize observers
      pageResizeObservers.forEach((observer, el) => {
        observer.unobserve(el);
        observer.disconnect();
      });
      pageResizeObservers.clear();
      pagesStore.cleanup();
      unsubscribePagesStore();
    };
  });
  
  async function saveNote(pageIndex: number) {
    await pagesStore.savePage(pageIndex, params.id, {
      setIsSaving: (saving) => {
        isSaving = saving;
      }
    });
  }
  
  async function shareNote() {
    const result = await pagesStore.sharePage(activePageIndex, params.id);
    if (result.success && result.shareUrl) {
      shareUrl = result.shareUrl;
      showShareModal = true;
    }
  }
  
  function goBack() {
    push('/workplace');
  }

  function handleTitleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    pagesStore.setTitle(activePageIndex, target.value);
  }
  
  function handleEditorInput(pageIndex: number, event: Event) {
    const pageState = pages[pageIndex];
    if (!pageState.pageId) return;
    // bind:editorContent automatically updates pages[pageIndex].editorContent
    // Just trigger sync and mark as unsaved
    page.handleEditorInput(event, {
      onContentChange: (_content) => {
        // Content is already updated via bind:editorContent
        // Just trigger reactivity to ensure sync
        pages = pages;
      },
      onUnsavedChange: () => { 
        pages[pageIndex] = { ...pages[pageIndex], hasUnsavedChanges: true };
        pages = pages;
      }
    }, pageState.pageId);
  }
  
  // Sync page content directly to Yjs without triggering input handlers
  // targetNoteId: Optional explicit note ID to use for syncing (prevents conflicts during cascading overflows)
  function syncPageContent(pageIndex: number, content: string, targetNoteId?: string): void {
    const pageState = pages[pageIndex];
    if (!pageState.pageId) return;
    
    // Use provided targetNoteId, or calculate from pageIndex
    // This ensures we use the correct note ID even during cascading overflows
    let noteId: string | undefined;
    if (targetNoteId) {
      noteId = targetNoteId;
    } else {
      // Get the correct note ID for this page
      // Page 0 uses root note ID, other pages use their own note ID
      noteId = pageIndex === 0 ? params.id : pageState.note?.id;
    }
    
    if (!noteId) return;
    
    // Update the page content state
    pages[pageIndex] = {
      ...pageState,
      editorContent: content,
      hasUnsavedChanges: true
    };
    pages = pages;
    
    // Sync to Yjs directly using the correct note ID
    SyncController.syncContent(noteId, content, pageState.currentMode);
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    const activePageState = pages[activePageIndex];
    if (!activePageState.pageId) return;
    
    page.handleKeyDown(event, {
      onSave: () => saveNote(activePageIndex),
      onToggleBold: () => {
        const handler = page.getCurrentHandler(activePageState.pageId!);
        if (handler === page.wordHandler || 'toggleBold' in handler) {
          (handler as any).toggleBold();
        }
      },
      onToggleItalic: () => {
        const handler = page.getCurrentHandler(activePageState.pageId!);
        if (handler === page.wordHandler || 'toggleItalic' in handler) {
          (handler as any).toggleItalic();
        }
      },
      onToggleUnderline: () => {
        const handler = page.getCurrentHandler(activePageState.pageId!);
        if (handler === page.wordHandler || 'toggleUnderline' in handler) {
          (handler as any).toggleUnderline();
        }
      },
      onCommandPalette: () => {
        // Show command palette
      }
    }, activePageState.pageId);
  }
  
  function setMode(pageIndex: number, mode: 'word' | 'ppt' | 'handwrite') {
    pagesStore.setMode(pageIndex, mode);
  }
  
  function handleHeadingChange(newHeading: string) {
    const heading = newHeading as 'p' | 'h1' | 'h2' | 'h3';
    const activePageState = pages[activePageIndex];
    activePageState.formattingStateValue.heading = heading;
    if (activePageState.pageId) {
      const handler = page.getHandlers(activePageState.pageId);
      if (handler) handler.word.setHeading(heading);
    }
  }

  // Trigger hidden file input
  function triggerPdfUpload() {
    debugPdfInput?.click();
  }

  // Handle file selection and apply backgrounds via pdfBackgroundService
  async function handlePdfFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input || !input.files || !input.files[0] || !params.id) return;

    const file = input.files[0];

    await applyPdfBackgrounds(params.id, file, pagesStore, () => pages);

    // Clear input so selecting the same file again still fires change
    input.value = '';
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="edit-container" class:sidebar-collapsed={sidebarCollapsed}>
  <!-- Mini Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <button class="back-btn" on:click={goBack} title="Back to workspace">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 4L4 10l6 6M4 10h12"/>
        </svg>
      </button>
      <button class="sidebar-toggle" on:click={() => sidebarCollapsed = !sidebarCollapsed}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 5h14M3 10h14M3 15h14"/>
        </svg>
      </button>
    </div>
    
    {#if !sidebarCollapsed}
      <nav class="sidebar-nav">
        <button class="nav-item" on:click={goBack}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4h12v2H4V4zm0 5h12v2H4V9zm0 5h12v2H4v-2z"/>
          </svg>
          <span>All Notes</span>
        </button>
      </nav>
      
      <div class="sidebar-footer">
        <div class="profile">
          <div class="avatar">
            <span>{$currentUser?.name?.charAt(0) || '?'}</span>
          </div>
          <span class="profile-name">{$currentUser?.name || 'User'}</span>
        </div>
      </div>
    {/if}
  </aside>
  
  <!-- Main Editor Area -->
  <main class="main-area">
    <!-- Top Toolbar -->
    <header class="toolbar">
      <div class="toolbar-left">
        <!-- Note Title (for active page) -->
        {#if activeNote}
          <input 
            type="text" 
            class="note-title-input"
            value={activeNote.title}
            placeholder="Untitled"
            on:input={handleTitleInput}
          />
        {:else}
          <span class="note-title-input">Loading...</span>
        {/if}
        
        {#if isSaving}
          <span class="save-status">Saving...</span>
        {:else if pages[activePageIndex].hasUnsavedChanges}
          <span class="save-status unsaved">Unsaved changes</span>
        {:else}
          <span class="save-status saved">Saved</span>
        {/if}
      </div>
      
      <!-- Universal Actions -->
      <div class="toolbar-right">
        <button class="toolbar-btn" on:click={() => {
          const activePageState = pages[activePageIndex];
          if (activePageState.pageId) {
            page.getCurrentHandler(activePageState.pageId).undo();
          }
        }} title="Undo (Ctrl+Z)">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 10c0-3.31 2.69-6 6-6 2.21 0 4.14 1.2 5.18 2.98l-2.35.67C12.14 6.64 11.14 6 10 6 7.79 6 6 7.79 6 10s1.79 4 4 4c1.57 0 2.93-.9 3.59-2.21l1.86.53C14.45 14.54 12.38 16 10 16c-3.31 0-6-2.69-6-6z"/>
            <path d="M4 6v4h4"/>
          </svg>
        </button>
        <button class="toolbar-btn" on:click={() => {
          const activePageState = pages[activePageIndex];
          if (activePageState.pageId) {
            page.getCurrentHandler(activePageState.pageId).redo();
          }
        }} title="Redo (Ctrl+Shift+Z)">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style="transform: scaleX(-1)">
            <path d="M4 10c0-3.31 2.69-6 6-6 2.21 0 4.14 1.2 5.18 2.98l-2.35.67C12.14 6.64 11.14 6 10 6 7.79 6 6 7.79 6 10s1.79 4 4 4c1.57 0 2.93-.9 3.59-2.21l1.86.53C14.45 14.54 12.38 16 10 16c-3.31 0-6-2.69-6-6z"/>
            <path d="M4 6v4h4"/>
          </svg>
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button class="toolbar-btn" on:click={() => saveNote(activePageIndex)} title="Save (Ctrl+S)">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3v14h14V6l-3-3H3zm10 0v4H5V3h8zm-3 11a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
        </button>
        
        <button class="toolbar-btn share-btn" on:click={shareNote} title="Share">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.83-2L8.17 8a3 3 0 100 4l4 2a3 3 0 102.83-2l-4-2a3.07 3.07 0 000-2l4-2A3 3 0 0015 8z"/>
          </svg>
          Share
        </button>
        <!-- PDF upload for page backgrounds -->
        <input
          type="file"
          accept="application/pdf"
          bind:this={debugPdfInput}
          style="display: none"
          on:change={handlePdfFileChange}
        />
        <button class="toolbar-btn" on:click={triggerPdfUpload} title="Upload PDF as backgrounds">
          PDF
        </button>
      </div>
    </header>
    
    <!-- Mode-Specific Toolbar (for active page) -->
    <div class="mode-toolbar">
      {#if pages[activePageIndex].currentMode === 'word'}
        <!-- Word Mode Toolbar -->
        {@const activePageState = pages[activePageIndex]}
        {@const activeFormatting = activePageState.formattingStateValue}
        {@const currentPageId = activePageState.pageId}
        <div class="toolbar-group">
          <select class="heading-select" value={activeFormatting.heading} on:change={(e) => {
            const target = e.target;
            if (target && target instanceof HTMLSelectElement) {
              handleHeadingChange(target.value);
            }
          }}>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>
        
        <div class="toolbar-divider"></div>

        <div class="toolbar-group selection-size-group">
          <label class="font-size-label" for={`selection-size-${activePageIndex}`}>Selection</label>
          <select
            id={`selection-size-${activePageIndex}`}
            class="heading-select"
            on:change={(e) => {
              const target = e.target;
              if (target && target instanceof HTMLSelectElement) {
                const size = parseFloat(target.value);
                if (currentPageId) {
                  const handler = page.getHandlers(currentPageId);
                  if (handler) handler.word.applyFontSize(size);
                }
              }
            }}
          >
            <option value="0.75">0.75x</option>
            <option value="1">1.00x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5" selected>1.50x</option>
            <option value="2">2.00x</option>
            <option value="2.5">2.50x</option>
          </select>
        </div>
        
        <div class="toolbar-divider"></div>

        <div class="toolbar-group selection-color-group">
          <label class="font-size-label">Text</label>
          <button
            class="selection-color-trigger"
            aria-haspopup="true"
            aria-expanded={showTextPalette}
            bind:this={textTriggerEl}
            on:click={() => {
              showTextPalette = !showTextPalette;
              showHighlightPalette = false;
              if (textTriggerEl) {
                const rect = textTriggerEl.getBoundingClientRect();
                textPalettePos = { top: rect.bottom + 8, left: rect.left };
              }
            }}
            title="Text color"
          >
            <span class="color-preview" style={`background:${textColorOptions[0]};`}></span>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 7l5 6 5-6H5z"/>
            </svg>
          </button>
          {#if showTextPalette}
            <div class="color-popover" role="menu" style={`top:${textPalettePos.top}px; left:${textPalettePos.left}px;`}>
              {#each textColorOptions as color}
                <button
                  class="color-swatch"
                  style={`background:${color};`}
                  aria-label={`Text color ${color}`}
                  on:click={() => {
                    if (currentPageId) {
                      const handler = page.getHandlers(currentPageId);
                      if (handler) handler.word.applyFontColor(color);
                    }
                    showTextPalette = false;
                  }}
                ></button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="toolbar-group selection-color-group">
          <label class="font-size-label">Highlight</label>
          <button
            class="selection-color-trigger"
            aria-haspopup="true"
            aria-expanded={showHighlightPalette}
            bind:this={highlightTriggerEl}
            on:click={() => {
              showHighlightPalette = !showHighlightPalette;
              showTextPalette = false;
              if (highlightTriggerEl) {
                const rect = highlightTriggerEl.getBoundingClientRect();
                highlightPalettePos = { top: rect.bottom + 8, left: rect.left };
              }
            }}
            title="Highlight color"
          >
            <span class="color-preview" style={`background:${highlightColorOptions[0]};`}></span>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 7l5 6 5-6H5z"/>
            </svg>
          </button>
          {#if showHighlightPalette}
            <div class="color-popover" role="menu" style={`top:${highlightPalettePos.top}px; left:${highlightPalettePos.left}px;`}>
              {#each highlightColorOptions as color}
                <button
                  class="color-swatch"
                  style={`background:${color};`}
                  aria-label={`Highlight color ${color}`}
                  on:click={() => {
                    if (currentPageId) {
                      const handler = page.getHandlers(currentPageId);
                      if (handler) handler.word.applyFontBackground(color);
                    }
                    showHighlightPalette = false;
                  }}
                ></button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button 
            class="toolbar-btn" 
            class:active={activeFormatting.isBold}
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) handler.word.toggleBold();
              }
            }}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button 
            class="toolbar-btn"
            class:active={activeFormatting.isItalic}
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) handler.word.toggleItalic();
              }
            }}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button 
            class="toolbar-btn"
            class:active={activeFormatting.isUnderline}
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) handler.word.toggleUnderline();
              }
            }}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button class="toolbar-btn" on:click={() => {
            if (currentPageId) {
              const handler = page.getHandlers(currentPageId);
              if (handler) handler.word.insertList('ul');
            }
          }} title="Bullet List">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 5a1 1 0 110-2 1 1 0 010 2zm3-1h10v2H7V4zm-3 6a1 1 0 110-2 1 1 0 010 2zm3-1h10v2H7V9zm-3 6a1 1 0 110-2 1 1 0 010 2zm3-1h10v2H7v-2z"/>
            </svg>
          </button>
          <button class="toolbar-btn" on:click={() => {
            if (currentPageId) {
              const handler = page.getHandlers(currentPageId);
              if (handler) handler.word.insertList('ol');
            }
          }} title="Numbered List">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4h1v3H4V5.5H3V4h1zm-.5 6.5h1.5v.5H4v1h1V12H3v-3h1.5v.5H4v1zm.5 5v-.5H3v1h1v.5H3v1h2v-3H4v1zM7 4h10v2H7V4zm0 5h10v2H7V9zm0 5h10v2H7v-2z"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Insert Image">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm0 2v8l3-3 2 2 4-4 3 3V5H4zm2 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Insert Table">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h14v14H3V3zm2 2v4h4V5H5zm6 0v4h4V5h-4zm-6 6v4h4v-4H5zm6 0v4h4v-4h-4z"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Insert Code">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.5 11l-2.5-1 2.5-1-2.5-1 2.5-1v5zM15.5 11l2.5-1-2.5-1 2.5-1-2.5-1v5zM7 16l2-12h2l-2 12H7z"/>
            </svg>
          </button>
        </div>
        
      {:else if pages[activePageIndex].currentMode === 'ppt'}
        <!-- PPT Mode Toolbar -->
        {@const activePageState = pages[activePageIndex]}
        {@const currentPageId = activePageState.pageId}
        <div class="toolbar-group">
          <button 
            class="toolbar-btn"
            class:active={selectedPptTool === 'text'}
            title="Add Text Frame (Click to select tool, then click on page to create)"
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) {
                  // Toggle tool selection
                  if (selectedPptTool === 'text') {
                    selectedPptTool = null;
                    handler.ppt.setSelectedTool(null);
                  } else {
                    selectedPptTool = 'text';
                    handler.ppt.setSelectedTool('text');
                  }
                }
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4h12v12H4V4zm2 2v8h8V6H6z"/>
            </svg>
            Text
          </button>
          <button 
            class="toolbar-btn"
            class:active={selectedPptTool === 'image'}
            title="Add Image (Click to select tool, then click on page to create)"
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) {
                  // Toggle tool selection
                  if (selectedPptTool === 'image') {
                    selectedPptTool = null;
                    handler.ppt.setSelectedTool(null);
                  } else {
                    selectedPptTool = 'image';
                    handler.ppt.setSelectedTool('image');
                  }
                }
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/>
            </svg>
            Image
          </button>
          <button 
            class="toolbar-btn"
            class:active={selectedPptTool === 'shape'}
            title="Add Shape (Click to select tool, then click on page to create)"
            on:click={() => {
              if (currentPageId) {
                const handler = page.getHandlers(currentPageId);
                if (handler) {
                  // Toggle tool selection
                  if (selectedPptTool === 'shape') {
                    selectedPptTool = null;
                    handler.ppt.setSelectedTool(null);
                  } else {
                    selectedPptTool = 'shape';
                    handler.ppt.setSelectedTool('shape');
                  }
                }
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="6"/>
            </svg>
            Shape
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Align Left">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Align Center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Align Right">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4h14v2H3V4zm4 4h10v2H7V8zm-4 4h14v2H3v-2zm4 4h10v2H7v-2z"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Group">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 4h6v6H2V4zm10 0h6v6h-6V4zM2 12h6v6H2v-6zm10 0h6v6h-6v-6z"/>
            </svg>
          </button>
          <button class="toolbar-btn" title="Bring Forward">↑</button>
          <button class="toolbar-btn" title="Send Backward">↓</button>
        </div>
        
      {:else if pages[activePageIndex].currentMode === 'handwrite'}
        <!-- Handwrite Mode Toolbar -->
        {@const activePageState = pages[activePageIndex]}
        {@const currentPageId = activePageState.pageId}
        {@const isEraser = activePageState.isEraser || false}
        {@const penColor = activePageState.penColor || '#6ee7b7'}
        {@const penSize = activePageState.penSize || 3}
        <div class="toolbar-group">
          <button 
            class="toolbar-btn pen-btn"
            class:active={!isEraser}
            on:click={() => {
              if (currentPageId) {
                const pageInstance = page.getPage(currentPageId);
                if (pageInstance) {
                  pageInstance.isEraser = false;
                  pageInstance.handlers.handwrite.setEraserMode(false);
                  pagesStore.setHandwriteEraser(activePageIndex, false);
                }
              }
            }}
            title="Pen"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.5.5.5-3.5 8.672-8.328z"/>
            </svg>
          </button>
          <button 
            class="toolbar-btn"
            class:active={isEraser}
            on:click={() => {
              if (currentPageId) {
                const pageInstance = page.getPage(currentPageId);
                if (pageInstance) {
                  pageInstance.isEraser = true;
                  pageInstance.handlers.handwrite.setEraserMode(true);
                  pagesStore.setHandwriteEraser(activePageIndex, true);
                }
              }
            }}
            title="Eraser"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.5 3.5l8 8-5 5H3v-4.5l5.5-8.5z"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group colors">
          {#each ['#6ee7b7', '#3b82f6', '#f87171', '#fbbf24', '#a78bfa', '#fff'] as color}
            <button 
              class="color-btn"
              class:active={penColor === color}
              style="background-color: {color}"
              on:click={() => {
                if (currentPageId) {
                  const pageInstance = page.getPage(currentPageId);
                  if (pageInstance) {
                    pageInstance.penColor = color;
                    pageInstance.handlers.handwrite.setPenColor(color);
                    pagesStore.setHandwritePenColor(activePageIndex, color);
                  }
                }
              }}
              title="Pen Color"
            ></button>
          {/each}
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <label class="pen-size-label" for={`pen-size-slider-${activePageIndex}`}>Size</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={penSize}
            class="pen-size-slider"
            id={`pen-size-slider-${activePageIndex}`}
            on:input={(e) => {
              const target = e.target;
              if (target && target instanceof HTMLInputElement) {
                if (currentPageId) {
                  const pageInstance = page.getPage(currentPageId);
                  if (pageInstance) {
                    const size = parseInt(target.value);
                    pageInstance.penSize = size;
                    pageInstance.handlers.handwrite.setPenSize(size);
                    pagesStore.setHandwritePenSize(activePageIndex, size);
                  }
                }
              }
            }}
          />
          <span class="pen-size-value">{penSize}</span>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <button 
          class="toolbar-btn ocr-btn" 
          title="Convert to Text (OCR)"
          on:click={async () => {
            try {
              if (currentPageId) {
                const pageInstance = page.getPage(currentPageId);
                if (pageInstance) {
                  const text = await pageInstance.handlers.handwrite.triggerOCR();
                  if (text) {
                    // Switch to Word mode and insert text
                    setMode(activePageIndex, 'word');
                    pages[activePageIndex] = { ...pages[activePageIndex], editorContent: text };
                    pages = pages;
                  }
                }
              }
            } catch (error) {
              // OCR failed
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3h14v3h-2V5H5v10h10v-1h2v3H3V3zm10 5h4v2h-4V8zm0 3h4v2h-4v-2z"/>
          </svg>
          OCR
        </button>
      {/if}
    </div>
    
    <!-- Editor Content Area - Two Pages -->
    <div class="editor-area">
      {#if isLoading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading notes...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 12a1 1 0 110-2 1 1 0 010 2zm1-4H9V6h2v4z"/>
          </svg>
          <h3>{error}</h3>
          <button on:click={goBack}>Go Back</button>
        </div>
      {:else}
        {#each pages as pageState, pageIndex}
          <div
            class="page-container"
            class:active={activePageIndex === pageIndex}
            class:has-background={!!pageState.backgroundUrl}
            class:overflowing={pageState.isOverflowing}
            bind:this={pageState.pageElement}
            style={pageState.backgroundUrl
              ? `
                background-image: url('${pageState.backgroundUrl}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center top;
              `
              : ''}
          >
            <EditorContainer
              bind:this={editorContainerRefs[pageIndex]}
              pageIndex={pageIndex}
              currentMode={pageState.currentMode}
              bind:editorContent={pages[pageIndex].editorContent}
              onInput={(e) => handleEditorInput(pageIndex, e)}
              bind:canvasElement={pageState.canvasElement}
              bind:pptContainer={pageState.pptContainer}
              bind:isOverflowing={pages[pageIndex].isOverflowing}
              onAddPage={addPage}
              onMoveContentToNextPage={moveContentToNextPage}
              onMoveContentFromNextPage={moveContentFromNextPage}
              onSyncContent={(idx, content, noteId) => syncPageContent(idx, content, noteId)}
              isActive={activePageIndex === pageIndex}
            />
          </div>
        {/each}
      {/if}
    </div>
  </main>
  
  <!-- Add/Delete Page Buttons (Bottom Left) -->
  <div class="page-control-buttons">
    <button 
      class="add-page-btn"
      on:click={addPage}
      title={isLastPage ? "Add New Page" : "Go to Next Page"}
    >
      {#if isLastPage}
        <!-- Icon for adding new page (plus) -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4v16m8-8H4"/>
        </svg>
      {:else}
        <!-- Icon for going to next page (arrow right) -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      {/if}
    </button>
    <button 
      class="delete-page-btn"
      class:disabled={activePageIndex === 0}
      on:click={deletePage}
      disabled={activePageIndex === 0}
      title={(() => {
        if (activePageIndex === 0) return "Already on first page";
        const currentPageState = pages[activePageIndex];
        const isPageEmpty = !currentPageState?.editorContent || 
                           currentPageState.editorContent.trim() === '' ||
                           currentPageState.editorContent.replace(/<[^>]*>/g, '').trim() === '';
        const isNotOnlyPage = pages.length > 1;
        if (isPageEmpty && isNotOnlyPage) {
          return "Delete Empty Page";
        } else {
          return "Go to Previous Page";
        }
      })()}
    >
      {#if activePageIndex === 0}
        <!-- Icon for going to previous page (arrow left) - disabled state -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
        </svg>
      {:else}
        {@const currentPageState = pages[activePageIndex]}
        {@const isPageEmpty = !currentPageState?.editorContent || 
                             currentPageState.editorContent.trim() === '' ||
                             currentPageState.editorContent.replace(/<[^>]*>/g, '').trim() === ''}
        {@const isNotOnlyPage = pages.length > 1}
        {#if isPageEmpty && isNotOnlyPage}
          <!-- Icon for deleting page (trash) -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        {:else}
          <!-- Icon for going to previous page (arrow left) -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
          </svg>
        {/if}
      {/if}
    </button>
  </div>
  
  <!-- Mode Selector (Bottom Right) -->
  <div class="mode-selector">
    <button 
      class="mode-btn"
      class:active={pages[activePageIndex].currentMode === 'word'}
      on:click={() => setMode(activePageIndex, 'word')}
      title="Word Mode"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h10v2H4v-2z"/>
      </svg>
    </button>
    <button 
      class="mode-btn"
      class:active={pages[activePageIndex].currentMode === 'ppt'}
      on:click={() => setMode(activePageIndex, 'ppt')}
      title="Presentation Mode"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm1 10h10v2H7v-2z"/>
      </svg>
    </button>
    <button 
      class="mode-btn"
      class:active={pages[activePageIndex].currentMode === 'handwrite'}
      on:click={() => setMode(activePageIndex, 'handwrite')}
      title="Handwrite Mode"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.586 4.586a2 2 0 112.828 2.828l-10 10-4 1 1-4 10.172-9.828z"/>
      </svg>
    </button>
  </div>
</div>

<!-- Share Modal -->
{#if showShareModal}
  <div class="modal-overlay" on:click={() => showShareModal = false} on:keypress={() => {}}>
    <div class="modal" on:click|stopPropagation on:keypress|stopPropagation>
      <div class="modal-header">
        <h2>Share Note</h2>
        <button class="modal-close" on:click={() => showShareModal = false}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="share-message">Your note is now public! Share this link:</p>
        <div class="share-url-box">
          <input type="text" readonly value={shareUrl} />
          <button class="copy-btn" on:click={async () => {
            await navigator.clipboard.writeText(shareUrl);
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 2a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H8zm0 2h6v10H8V4zM4 6a2 2 0 00-2 2v8a2 2 0 002 2h6v-2H4V8h2V6H4z"/>
            </svg>
            Copy
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .edit-container {
    display: flex;
    min-height: 100vh;
    background: #0a0a0a;
    --sidebar-width: 240px;
  }

  .edit-container.sidebar-collapsed {
    --sidebar-width: 56px;
  }
  
  /* Sidebar */
  .sidebar {
    width: 240px;
    background: #111;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    z-index: 30;
    transition: width 0.2s ease;
  }
  
  .sidebar-collapsed .sidebar {
    width: 56px;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .back-btn,
  .sidebar-toggle {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .back-btn:hover,
  .sidebar-toggle:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 0.75rem;
    overflow-y: auto;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #888;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: #111;
  }
  
  .profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #0f0f0f;
    font-size: 0.875rem;
  }
  
  .profile-name {
    font-size: 0.875rem;
    color: #e8e8e8;
  }
  
  :global(:root) {
    --top-toolbar-height: 64px;
    --mode-toolbar-height: 56px;
  }

  /* Main Area */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  /* Top Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    min-height: var(--top-toolbar-height);
    background: #0f0f0f;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: sticky;
    top: 0;
    z-index: 20;
  }
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  
  .note-title-input {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    background: transparent;
    border: none;
    padding: 0.25rem 0;
    min-width: 200px;
    max-width: 400px;
  }
  
  .note-title-input:focus {
    outline: none;
  }
  
  .note-title-input::placeholder {
    color: #555;
  }
  
  .save-status {
    font-size: 0.75rem;
    color: #555;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
  }
  
  .save-status.unsaved {
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
  }
  
  .save-status.saved {
    color: #6ee7b7;
    background: rgba(110, 231, 183, 0.1);
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #888;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .toolbar-btn.active {
    background: rgba(110, 231, 183, 0.1);
    color: #6ee7b7;
  }
  
  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 0.25rem;
  }
  
  .share-btn {
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    color: #0f0f0f;
    font-weight: 600;
  }
  
  .share-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(110, 231, 183, 0.2);
  }
  
  /* Mode Toolbar */
  .mode-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.5rem;
    min-height: var(--mode-toolbar-height);
    background: #111;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    overflow: visible; /* allow popovers to escape */
    position: sticky;
    top: var(--top-toolbar-height);
    z-index: 15;
  }
  
  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .heading-select {
    padding: 0.375rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #e8e8e8;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .heading-select:focus {
    outline: none;
    border-color: #6ee7b7;
  }

  /* Dropdown panel styling (options) */
  .heading-select option {
    background: #0f1115;
    color: #e8e8e8;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    margin: 4px;
  }

  .heading-select option:hover,
  .heading-select option:focus {
    background: #1b222c;
    color: #6ee7b7;
  }
  
  /* Color buttons */
  .color-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .color-btn:hover {
    transform: scale(1.1);
  }
  
  .color-btn.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  
  .pen-size-label {
    font-size: 0.75rem;
    color: #888;
    margin-right: 0.5rem;
  }
  
  .pen-size-slider {
    width: 80px;
    accent-color: #6ee7b7;
  }
  
  .pen-size-value {
    font-size: 0.75rem;
    color: #888;
    min-width: 20px;
    text-align: center;
  }

  .font-size-label {
    font-size: 0.75rem;
    color: #888;
  }

  .selection-size-group {
    gap: 0.35rem;
  }

  .selection-color-group {
    gap: 0.35rem;
    align-items: center;
    position: relative; /* anchor popover */
  }

  .selection-color-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.6rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: #e8e8e8;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .selection-color-trigger:hover {
    border-color: rgba(110, 231, 183, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  .color-preview {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
  }

  .color-popover {
    position: fixed;
    top: calc(100% + 0.35rem);
    left: 0;
    margin-top: 0;
    padding: 0.5rem;
    background: #0f1115;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.35rem;
    z-index: 30;
  }

  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease, border-color 0.1s ease;
  }

  .color-swatch:hover,
  .color-swatch:focus {
    transform: scale(1.05);
    border-color: rgba(110, 231, 183, 0.8);
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.15);
    outline: none;
  }
  
  .ocr-btn {
    background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
    color: #fff;
    font-weight: 500;
  }
  
  /* Editor Area */
  .editor-area {
    flex: 1;
    min-height: calc(100vh - var(--top-toolbar-height) - var(--mode-toolbar-height));
    overflow: visible;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  /* Page Container */
  .page-container {
    width: 60%;
    aspect-ratio: 297 / 210; /* A4 横向纸张比例 */
    margin: 0 auto;
    padding: 0;
    --page-scale: 1;
    --page-scale-y: 1;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    box-sizing: border-box;
  }

  /* 当有 PDF 背景时，尺寸由图片比例控制 */
  .page-container.has-background {
    width: 60%;
    min-height: 0;
    box-sizing: border-box;
    background-color: transparent;
    border: none;
    padding: 0;
  }
  
  .page-container.active {
    border-color: rgba(110, 231, 183, 0.5);
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.1);
  }
  
  .page-container.overflowing {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
  
  .page-container.overflowing.active {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .page-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #888;
  }
  
  .page-container.active .page-label {
    color: #6ee7b7;
  }
  
  .active-indicator {
    font-size: 0.75rem;
    color: #6ee7b7;
    background: rgba(110, 231, 183, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(110, 231, 183, 0.2);
    border-top-color: #6ee7b7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-state svg {
    color: #f87171;
    margin-bottom: 1rem;
  }
  
  .error-state h3 {
    color: #e8e8e8;
    margin-bottom: 1rem;
  }
  
  .error-state button {
    padding: 0.5rem 1.5rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-weight: 600;
    cursor: pointer;
  }
  
  /* Editor container styles moved to EditorContainer.svelte component */
  
  /* Add/Delete Page Buttons */
  .page-control-buttons {
    position: fixed;
    left: calc(var(--sidebar-width) + 0.5rem);
    bottom: 2rem;
    z-index: 10;
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .add-page-btn,
  .delete-page-btn {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    color: #0f0f0f;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(110, 231, 183, 0.3);
  }
  
  .add-page-btn {
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
  }
  
  .add-page-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(110, 231, 183, 0.4);
  }
  
  .add-page-btn:active {
    transform: scale(0.95);
  }
  
  .delete-page-btn {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  }
  
  .delete-page-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(248, 113, 113, 0.4);
  }
  
  .delete-page-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  .delete-page-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }
  
  /* Mode Selector */
  .mode-selector {
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    display: flex;
    gap: 0.5rem;
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  
  .mode-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .mode-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .mode-btn.active {
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    color: #0f0f0f;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 100;
  }
  
  .modal {
    width: 100%;
    max-width: 440px;
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .modal-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
  }
  
  .modal-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .share-message {
    color: #888;
    margin-bottom: 1rem;
  }
  
  .share-url-box {
    display: flex;
    gap: 0.5rem;
  }
  
  .share-url-box input {
    flex: 1;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e8e8e8;
    font-size: 0.875rem;
  }
  
  .copy-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .copy-btn:hover {
    transform: translateY(-1px);
  }
</style>
