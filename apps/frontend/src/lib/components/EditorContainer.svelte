<script lang="ts">
  import { tick } from 'svelte';
  import { WordHandler } from '../handlers/WordHandler';
  
  export let currentMode: 'word' | 'ppt' | 'handwrite' = 'word';
  export let editorContent: string = '';
  export let onInput: (event: Event) => void;
  export let canvasElement: HTMLCanvasElement | null = null;
  export let pptContainer: HTMLElement | null = null;
  export let isOverflowing: boolean = false;
  export let onAddPage: (() => Promise<void>) | null = null;
  export let onMoveContentToNextPage: ((content: string, sourcePageIndex: number, cursorInfo?: { offset: number } | null) => Promise<void>) | null = null;
  export let onMoveContentFromNextPage: ((targetPageIndex: number, availableSpace: number) => Promise<string | null>) | null = null;
  export let onSyncContent: ((pageIndex: number, content: string, targetNoteId?: string) => void) | null = null;
  export let isActive: boolean = false;
  export let pageIndex: number = -1; // Page index for this EditorContainer instance
  
  let wordEditorElement: HTMLDivElement | null = null;
  let boundContent = editorContent;
  let isUserInput = false;
  let isProcessing = false; // Flag to disable input during remove and add page operations
  
  // Queue to store overflow and underflow items for background processing
  type OverflowQueueItem = {
    content: string;
    sourcePageIndex: number;
    type: 'overflow' | 'underflow';
    savedCursor?: { offset: number } | null;
    cursorInOverflow?: boolean; // Flag to indicate cursor needs restoration on next page
  };
  
  // Create overflow queue manager
  type OverflowQueueManager = {
    updateWordflow: () => Promise<void>;
    moveContentToNextPage: () => Promise<void>;
    addToQueue: (item: OverflowQueueItem) => Promise<void>;
    waitForQueueCompletion: (timeoutMs?: number) => Promise<void>;
  };
  
  function createWordflowQueueManager(
    pageIndex: number,
    onMoveContentToNextPage: ((content: string, sourcePageIndex: number) => Promise<void>) | null,
    onMoveContentFromNextPage: ((targetPageIndex: number, availableSpace: number) => Promise<string | null>) | null,
    getEditorElement: () => HTMLDivElement | null,
    getIsProcessing: () => boolean,
    setIsProcessing: (value: boolean) => void,
    getCurrentMode: () => 'word' | 'ppt' | 'handwrite',
    getIsActive: () => boolean,
    setIsOverflowing: (value: boolean) => void,
    setEditorContent: (value: string) => void,
    onSyncContent: ((pageIndex: number, content: string, targetNoteId?: string) => void) | null,
    saveCursorPosition: () => { offset: number } | null,
    restoreCursorPosition: (saved: { offset: number } | null) => void
  ): OverflowQueueManager {
    let overflowContent: string = ''; // Concatenated overflow content (newest prepended)
    let overflowCursorInfo: { offset: number } | null = null; // Cursor info for overflow content
    let needsUnderflowCheck: boolean = false; // Flag for underflow check requests
    let isProcessingQueue = false;
    let queueProcessingPromise: Promise<void> | null = null;
    let moveFromNextPageSavedCursor: { offset: number } | null = null;
    let updateWordflowSavedCursor: { offset: number } | null = null;
    
    // Forward declaration - function will be defined below
    async function moveContentFromNextPage(savedCursorFromCaller: { offset: number } | null): Promise<void> {
      if (isProcessingQueue || !needsUnderflowCheck) {
        return;
      }
      
      isProcessingQueue = true;
      needsUnderflowCheck = false; // Clear flag immediately
      
      queueProcessingPromise = (async () => {
        try {
          const editor = getEditorElement();
          if (!editor || !onMoveContentFromNextPage || getCurrentMode() !== 'word' || getIsProcessing()) {
            return;
          }
          
          // Use the cursor position provided by the caller (e.g. updateWordflow)
          moveFromNextPageSavedCursor = savedCursorFromCaller;
          if(getIsActive()) {
            disableEditor();
          }
          
          // Normalize editor content: ensure 1 line = 1 div before measuring underflow
          WordHandler.splitAllMultiLineDivsStatic(editor);
          // Persist normalized HTML so inactive pages don't revert on re-render
          const normalizedHtml = editor.innerHTML;
          setEditorContent(normalizedHtml);
          if (onSyncContent) {
            onSyncContent(pageIndex, normalizedHtml);
          }
          
          // Calculate available space
          const computedStyle = window.getComputedStyle(editor);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const clientHeight = editor.clientHeight;
          const maxAllowedHeight = clientHeight - paddingTop*1.5 - paddingBottom*1.5;
          
          // Get all block-level children
          const blockElements = Array.from(editor.children).filter(
            (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)
          ) as HTMLElement[];
          
          if (blockElements.length === 0) {
            return;
          }
          
          // Force a synchronous reflow to ensure accurate measurements
          void editor.offsetHeight;
          
          // Calculate the total height of all block elements
          let totalContentHeight = 0;
          for (const element of blockElements) {
            totalContentHeight += element.offsetHeight;
          }
          
          // Calculate the vertical space left in the editor
          const availableSpace = maxAllowedHeight - totalContentHeight;
          
          // Only proceed if there's significant available space (more than 5px to avoid unnecessary calls)
          if (availableSpace > 5 && onMoveContentFromNextPage) {
            setIsProcessing(true);
            try {
              const contentToAdd = await onMoveContentFromNextPage(pageIndex, availableSpace);
              
              if (contentToAdd) {
                // CRITICAL FIX: Update DOM directly first, then update state
                // This ensures content appears even for inactive pages
                editor.innerHTML = editor.innerHTML + contentToAdd;
                
                // Then update the prop to sync state
                setEditorContent(editor.innerHTML);
                
                // Wait for Svelte to update the DOM before proceeding
                await tick();
                
                // Force a reflow to ensure accurate measurements for subsequent calculations
                void editor.offsetHeight;
                
                // Sync content
                if (onSyncContent) {
                  const currentContent = editor.innerHTML;
                  onSyncContent(pageIndex, currentContent);
                }
                
                // Wait for another frame to ensure DOM is fully updated
                await new Promise(resolve => requestAnimationFrame(() => {
                  requestAnimationFrame(resolve);
                }));
                
                // Restore cursor position after DOM updates (only for active pages)
                // restoreCursorPosition already checks isActive internally, but we check here too for clarity
                const cursorToRestore = moveFromNextPageSavedCursor;
                if(getIsActive()){
                  enableEditor();
                }

                if (cursorToRestore && getIsActive()) {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      restoreCursorPosition(cursorToRestore);
                    });
                  });
                }
                
                // After adding content, check for overflow (cascading)
                // This ensures that if adding content causes overflow, it's handled
                // Note: We don't pass savedCursor to handleOverflow here since we already restored it
                await handleOverflow(editor, null);
              }
            } catch (err) {
              console.error(`[WordflowQueueManager] Error updating editorContent in moveContentFromNextPage (page ${pageIndex}):`, err);
            } finally {
              setIsProcessing(false);
            }
          }
        } catch (err) {
          console.error(`[WordflowQueueManager] Error in moveContentFromNextPage (page ${pageIndex}):`, err);
        }
      })();
      
      await queueProcessingPromise;
      queueProcessingPromise = null;
      isProcessingQueue = false;
      
      // Check if more underflow checks are needed
      if (needsUnderflowCheck) {
        // Subsequent underflow checks won't have an original saved cursor;
        // they will just adjust content without moving the caret.
        await moveContentFromNextPage(null);
      }
    }
    
    async function addToQueue(item: OverflowQueueItem): Promise<void> {
      if (item.type === 'overflow' && item.content && item.content.trim() !== '') {
        // Prepend new content to head (newest first)
        overflowContent = item.content + overflowContent;
        // Store cursor info if cursor is in overflow content
        if (item.cursorInOverflow && item.savedCursor) {
          overflowCursorInfo = item.savedCursor;
        }
      } else if (item.type === 'underflow') {
        // For underflow, mark that check is needed
        needsUnderflowCheck = true;
      }
      
      // If queue is processing, don't start new processing (prevents conflicts)
      // The queue will process this when current batch completes
      if (isProcessingQueue) {
        return;
      }
      
      // Start processing
      try {
        if (item.type === 'underflow') {
          await moveContentFromNextPage(item.savedCursor ?? null);
        } else {
          await moveContentToNextPage();
        }
      } catch (err) {
        console.error(`[WordflowQueueManager] Error in queue processing (page ${pageIndex}):`, err);
      }
    }
    
    async function moveContentToNextPage(): Promise<void> {
      if (isProcessingQueue || !overflowContent) {
        return;
      }
      
      isProcessingQueue = true;
      
      // Store current state in temporary variables and clear immediately
      // This prevents race condition where new content arrives during async processing
      const contentToMove = overflowContent;
      const cursorInfo = overflowCursorInfo; // Store cursor info if present
      overflowContent = ''; // Clear immediately before async call
      overflowCursorInfo = null; // Clear cursor info
      
      // 创建处理 Promise，以便外部可以等待
      queueProcessingPromise = (async () => {
        try {
          // Process all content at once
          // CRITICAL FIX: Pass cursor info to moveContentToNextPage callback
          if (contentToMove && onMoveContentToNextPage) {
            await onMoveContentToNextPage(contentToMove, pageIndex, cursorInfo);
          }
        } catch (err) {
          console.error(`[WordflowQueueManager] Error moving content from page ${pageIndex}:`, err);
          // Restore content if move failed to prevent data loss
          if (contentToMove) {
            overflowContent = contentToMove + overflowContent; // Restore to queue
            if (cursorInfo) {
              overflowCursorInfo = cursorInfo; // Restore cursor info
            }
          }
        }
      })();
      
      await queueProcessingPromise;
      queueProcessingPromise = null;
      isProcessingQueue = false;
      
      // CRITICAL FIX: Check if more content was added while processing
      // If so, continue processing the queue
      if (overflowContent) {
        // Recursively process remaining content
        await moveContentToNextPage();
      }
    }
    
    async function waitForQueueCompletion(timeoutMs: number = 10000): Promise<void> {
      // 等待当前队列处理完成
      const startTime = Date.now();
      while (isProcessingQueue && queueProcessingPromise) {
        if (Date.now() - startTime > timeoutMs) {
          console.error(`[WordflowQueueManager] Queue completion timeout after ${timeoutMs}ms (page ${pageIndex})`);
          // Reset state to prevent permanent lock
          isProcessingQueue = false;
          queueProcessingPromise = null;
          break;
        }
        await queueProcessingPromise;
      }
    }
    
    async function handleOverflow(editor: HTMLDivElement, savedCursor: { offset: number } | null): Promise<void> {
      // Ensure multi-line divs are split into single-line divs before measuring overflow
      if (getCurrentMode() === 'word') {
        WordHandler.splitAllMultiLineDivsStatic(editor);
      }
      
      // Get computed padding values
      const computedStyle = window.getComputedStyle(editor);
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      
      // Get the content area dimensions
      const clientHeight = editor.clientHeight;
      const maxAllowedHeight = clientHeight - paddingTop*1.5 - paddingBottom*1.5;
      
      // Get all block-level children
      const blockElements = Array.from(editor.children).filter(
        (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)
      ) as HTMLElement[];
      
      if (blockElements.length === 0) {
        setIsOverflowing(false);
        return;
      }
      
      // Force a synchronous reflow to ensure accurate measurements
      void editor.offsetHeight;
      
      // Find the first element that causes overflow by accumulating heights from top
      let accumulatedHeight = 0;
      let firstOverflowIndex = -1;
      
      for (let i = 0; i < blockElements.length; i++) {
        const element = blockElements[i];
        accumulatedHeight += element.offsetHeight;
        
        // Check if this element causes overflow (with 1px tolerance for rounding)
        if (accumulatedHeight > maxAllowedHeight) {
          firstOverflowIndex = i;
          break;
        }
      }
      
      // Check if there's any overflow
      const hasOverflow = firstOverflowIndex >= 0;
      setIsOverflowing(hasOverflow);
      
      // If not overflowing or already processing, nothing to do for overflow handling
      if (!hasOverflow || getIsProcessing() || getCurrentMode() !== 'word') {
        return;
      }
      
      // Start removal process
      setIsProcessing(true); // Flag to prevent input during DOM manipulation
      
      // CRITICAL FIX: Check if cursor is within overflow content BEFORE removal
      let cursorInOverflow = false;
      let cursorOffsetInOverflow = 0;
      let totalContentBeforeOverflow = 0;
      
      if (savedCursor) {
        // Calculate total character count before overflow content
        for (let i = 0; i < firstOverflowIndex; i++) {
          totalContentBeforeOverflow += (blockElements[i].textContent || '').length;
        }
        
        // Check if cursor is within overflow content
        if (savedCursor.offset >= totalContentBeforeOverflow) {
          cursorInOverflow = true;
          cursorOffsetInOverflow = savedCursor.offset - totalContentBeforeOverflow;
        }
      }
      
      // Collect all content from the first overflowing element to the end
      let aggregatedContentToMove = '';
      const elementsToRemove: HTMLElement[] = []; // Track elements for rollback
      
      // Collect HTML of all elements from firstOverflowIndex to the end
      for (let i = firstOverflowIndex; i < blockElements.length; i++) {
        aggregatedContentToMove += blockElements[i].outerHTML;
        elementsToRemove.push(blockElements[i]); // Store reference for rollback
      }
      
      // Remove all overflowing elements from the editor (in reverse order to avoid index shifting)
      for (let i = blockElements.length - 1; i >= firstOverflowIndex; i--) {
        editor.removeChild(blockElements[i]);
      }
      
      // Try to update editorContent - if this fails, rollback DOM changes
      try {
        setEditorContent(editor.innerHTML);
      } catch (err) {
        console.error(`[WordflowQueueManager] Error updating editorContent (page ${pageIndex}):`, err);
        // Rollback: restore removed elements
        try {
          // Restore elements in original order
          const lastElement = editor.lastElementChild;
          elementsToRemove.forEach((element) => {
            if (lastElement) {
              editor.insertBefore(element, lastElement.nextSibling);
            } else {
              editor.appendChild(element);
            }
          });
          console.warn(`[WordflowQueueManager] Rolled back DOM changes after setEditorContent failure`);
          setIsProcessing(false);
          return; // Exit early, don't proceed with queue
        } catch (rollbackErr) {
          console.error(`[WordflowQueueManager] Failed to rollback DOM changes:`, rollbackErr);
          // Content is lost - log critical error
          console.error(`[WordflowQueueManager] CRITICAL: Content loss detected on page ${pageIndex}`);
        }
      }
      
      // Re-measure to confirm no overflow remains
      void editor.offsetHeight;
      const remainingBlockElements = Array.from(editor.children).filter(
        (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)
      ) as HTMLElement[];
      
      let remainingHeight = 0;
      for (const element of remainingBlockElements) {
        remainingHeight += element.offsetHeight;
      }
      
      // Update overflow status
      const stillOverflowing = remainingHeight > maxAllowedHeight;
      setIsOverflowing(stillOverflowing);
      
      // Only sync if no overflow exists - ensures other devices receive content without overflow
      if (!stillOverflowing) {
        // Use direct sync instead of triggering input events to avoid conflicts
        if (onSyncContent) {
          const currentContent = editor.innerHTML;
          onSyncContent(pageIndex, currentContent);
        }
        /*else {
          // Fallback to input event if onSyncContent is not provided
        const inputEvent = new Event('input', { bubbles: true });
        editor.dispatchEvent(inputEvent);
        onInput(inputEvent);
        }*/
      }
      // Mark removal as complete - allow user input now that DOM operations are done
      // Content movement to next page will happen in background
      
      // CRITICAL FIX: Only restore cursor on current page if it's NOT in overflow content
      if (savedCursor && !cursorInOverflow) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreCursorPosition(savedCursor);
          });
        });
      }
      
      setIsProcessing(false);
      
      // Always add to queue (overflow type)
      // CRITICAL FIX: Pass cursor information if cursor is in overflow content
      const queueItem = {
        content: aggregatedContentToMove,
        sourcePageIndex: pageIndex,
        type: 'overflow' as const,
        savedCursor: cursorInOverflow ? { offset: cursorOffsetInOverflow } : null,
        cursorInOverflow: cursorInOverflow // Add flag to indicate cursor needs to be restored on next page
      };
      await addToQueue(queueItem).catch((err) => {
          console.error(`[WordflowQueueManager] Error adding overflow content to queue (page ${pageIndex}):`, err);
          // Content already removed from DOM, but queue failed - critical!
          // Try to restore content to DOM
          if (aggregatedContentToMove && editor) {
            try {
              editor.innerHTML += aggregatedContentToMove;
              console.warn(`[WordflowQueueManager] Restored content to DOM after queue failure`);
            } catch (restoreErr) {
              console.error(`[WordflowQueueManager] Failed to restore content after queue failure:`, restoreErr);
            }
          }
        });
      
      // Restore cursor position after DOM updates
      // Use double requestAnimationFrame to ensure Svelte has finished updating bind:innerHTML
    }
    
    async function updateWordflow(): Promise<void> {
      const editor = getEditorElement();
      if (!editor) {
        return;
      }
      
      // Save cursor position BEFORE any DOM manipulation (including splitting)
      // This ensures we capture the position in the original DOM structure
      updateWordflowSavedCursor = saveCursorPosition();
      
      // Split multi-line divs into single-line divs before checking overflow
      // This ensures accurate overflow detection (1 div = 1 line)
      if (getCurrentMode() === 'word') {
        try {
          disableEditor();
          const didSplit = WordHandler.splitAllMultiLineDivsStatic(editor);

          // Persist normalized HTML so inactive pages don't revert on re-render
          if (didSplit) {
            const normalizedHtml = editor.innerHTML;
            setEditorContent(normalizedHtml);
            if (onSyncContent) {
              onSyncContent(pageIndex, normalizedHtml);
            }
          }

          // Restore cursor if we had saved one
          if (updateWordflowSavedCursor && didSplit) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreCursorPosition(updateWordflowSavedCursor);
                enableEditor();
              });
            });
          } else {
            enableEditor();
          }
        } catch (error) {
          // Error splitting multi-line divs
        }
      }
      
      // Check for underflow first (pull content from next page if there's space)
      // Calculate if underflow exists, then queue the check
      const computedStyle = window.getComputedStyle(editor);
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const clientHeight = editor.clientHeight;
      const maxAllowedHeight = clientHeight - paddingTop*1.5 - paddingBottom*1.5;
      
      // Get all block-level children
      const blockElements = Array.from(editor.children).filter(
        (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)
      ) as HTMLElement[];
      
      if (blockElements.length > 0 && onMoveContentFromNextPage) {
        // Force a synchronous reflow to ensure accurate measurements
        void editor.offsetHeight;
        
        // Calculate the total height of all block elements
        let totalContentHeight = 0;
        for (const element of blockElements) {
          totalContentHeight += element.offsetHeight;
        }
        
        // Calculate the vertical space left in the editor
        const availableSpace = maxAllowedHeight - totalContentHeight;
        
        // If significant space available, queue underflow check
        if (availableSpace > 5) {
          await addToQueue({
            content: '',
            sourcePageIndex: pageIndex,
            type: 'underflow',
            savedCursor: updateWordflowSavedCursor,
          });
        }
      }
      
      // Then handle overflow detection and processing
      await handleOverflow(editor, updateWordflowSavedCursor);
    }
    
    return {
      updateWordflow,
      moveContentToNextPage,
      addToQueue,
      waitForQueueCompletion
    };
  }
  
  // Initialize overflow queue manager
  let overflowQueueManager: OverflowQueueManager | null = null;
  
  // Initialize manager when component is ready
  $: if (wordEditorElement && pageIndex >= 0 && onMoveContentToNextPage !== undefined) {
    if (!overflowQueueManager) {
      overflowQueueManager = createWordflowQueueManager(
        pageIndex,
        onMoveContentToNextPage,
        onMoveContentFromNextPage,
        () => wordEditorElement,
        () => isProcessing,
        (value) => { isProcessing = value; },
        () => currentMode,
        () => isActive,
        (value) => { isOverflowing = value; },
        (value) => { editorContent = value; },
        onSyncContent,
        saveCursorPosition,
        restoreCursorPosition
      );
    }
  }
  
  // Keep boundContent in sync with editorContent (including remote Yjs updates)
  // for all modes. Suppress updates only during local user input to avoid jitter.
  // IMPORTANT: Don't trigger DOM reset for inactive pages to prevent cursor loss
  $: if (wordEditorElement && editorContent !== undefined && editorContent !== boundContent && !isUserInput) {
    // If page is not active, don't trigger DOM reset to prevent cursor loss
    // The content will sync when the page becomes active again
    if (!isActive) {
      // Don't update boundContent for inactive pages to prevent DOM reset
      // This prevents cursor loss when Yjs updates arrive for inactive pages
    } else {
    boundContent = editorContent;
    }
  }
  
  // Update editor enabled/disabled state based on mode and active state
  // Note: isProcessing no longer disables editor to prevent cursor loss
  // Input is still blocked when isProcessing is true (via handleInput)
  $: if (wordEditorElement) {
    if (!isActive) {
      disableEditor();
    } else if (currentMode === 'word') {
      enableEditor();
    } else {
      disableEditor();
    }
  }
  

  // Save cursor position - saves absolute character offset from start of editor
  function saveCursorPosition(): { offset: number } | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !wordEditorElement) {
      return null;
    }
    
    const range = selection.getRangeAt(0);
    
    // Only save cursor if the selection is actually within this page's editor
    if (!wordEditorElement.contains(range.startContainer)) {
      return null;
    }
    
    try {
      // Calculate absolute offset: count all characters from start of editor to cursor
      const beforeRange = document.createRange();
      beforeRange.setStart(wordEditorElement, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const offset = beforeRange.toString().length;
      const saved = { offset };
      return saved;
    } catch (error) {
      return null;
    }
  }
  
  // Restore cursor position - finds text node at absolute offset
  function restoreCursorPosition(saved: { offset: number } | null): void {
    if (!saved || !wordEditorElement) {
      return;
    }
    
    // CRITICAL: Only restore cursor if page is active to prevent stealing focus from active page
    if (!isActive) {
      return;
    }
    
    try {
      const selection = window.getSelection();
      if (!selection) return;
      
      // Get total character count in current editor
      const totalLength = (wordEditorElement.textContent || '').length;

      // Clamp offset to valid range (in case content was removed)
      const targetOffset = Math.min(saved.offset, totalLength);
      
      // Find the text node and offset for this character position
      const result = findTextNodeAtOffset(wordEditorElement, targetOffset);
      
      if (result) {
        const range = document.createRange();
        range.setStart(result.node, result.offset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        if (wordEditorElement.contentEditable === 'true') {
          wordEditorElement.focus();
          requestAnimationFrame(() => {
            if (wordEditorElement) {
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                range.setStart(result.node, result.offset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                // After restoring, if cursor is right after a page break symbol,
                // move it to the start of the next line/block.
                const pageBreakSymbol = '⏎';
                const container = range.startContainer;
                const offset = range.startOffset;

                if (container.nodeType === Node.TEXT_NODE) {
                  const textNode = container as Text;
                  const text = textNode.textContent || '';

                  if (offset > 0 && text[offset - 1] === pageBreakSymbol) {
                    // Try to move to the start of the next block/line
                    const currentBlock = getContainingBlockElementFromNode(textNode);
                    if (currentBlock) {
                      let nextBlock: HTMLElement | null = currentBlock.nextElementSibling as HTMLElement | null;

                      // Skip non-block siblings
                      while (nextBlock && !isBlockLevelElement(nextBlock)) {
                        nextBlock = nextBlock.nextElementSibling as HTMLElement | null;
                      }

                      if (nextBlock) {
                        const nextRange = document.createRange();
                        const walker = document.createTreeWalker(
                          nextBlock,
                          NodeFilter.SHOW_TEXT,
                          null
                        );
                        const firstTextNode = walker.nextNode() as Text | null;

                        if (firstTextNode) {
                          nextRange.setStart(firstTextNode, 0);
                        } else {
                          nextRange.selectNodeContents(nextBlock);
                          nextRange.collapse(true);
                        }

                        selection.removeAllRanges();
                        selection.addRange(nextRange);
                      }
                    }
                  }
                }
              }
            }
          });
        }
      } else {
        // Fallback: place at end of editor
        const range = document.createRange();
        range.selectNodeContents(wordEditorElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        if (wordEditorElement.contentEditable === 'true') {
          wordEditorElement.focus();
        }
      }
    } catch (err) {
      // Could not restore cursor position
    }
  }
  
  // Helper: Find text node and offset at a given character offset in the editor
  function findTextNodeAtOffset(
    root: HTMLElement, 
    targetOffset: number
  ): { node: Text; offset: number } | null {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentOffset = 0;
    let textNode: Text | null;
    
    while (textNode = walker.nextNode() as Text | null) {
      const textLength = textNode.textContent?.length || 0;
      
      if (currentOffset + textLength >= targetOffset) {
        // Found the text node containing the target offset
        const offsetInNode = targetOffset - currentOffset;
        return {
          node: textNode,
          offset: Math.min(offsetInNode, textLength)
        };
      }
      
      currentOffset += textLength;
    }
    
    // If we didn't find it (shouldn't happen if offset is clamped), return the last text node
    const lastTextNode = getLastTextNode(root);
    if (lastTextNode) {
      return {
        node: lastTextNode,
        offset: lastTextNode.textContent?.length || 0
      };
    }
    
    return null;
  }

  // Helper: determine if an element should be treated as a block-level element for cursor movement
  function isBlockLevelElement(node: Node | null): boolean {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const tagName = (node as HTMLElement).tagName;
    return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(tagName);
  }

  // Helper: get the containing block element for a given node
  function getContainingBlockElementFromNode(node: Node | null): HTMLElement | null {
    if (!node) return null;
    let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    while (current) {
      if (isBlockLevelElement(current)) {
        return current as HTMLElement;
      }
      current = current.parentElement;
    }
    return null;
  }
  
  // Helper to find the last text node in an element
  function getLastTextNode(element: HTMLElement): Text | null {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let lastTextNode: Text | null = null;
    let node: Node | null;
    while (node = walker.nextNode()) {
      lastTextNode = node as Text;
    }
    
    return lastTextNode;
  }
  
  // Export updateWordflow so it can be called externally (e.g., after programmatic content addition)
  export async function checkOverflowForPage(): Promise<void> {
    if (!overflowQueueManager) {
      return;
    }
    
    await overflowQueueManager.updateWordflow();
  }
  
  // Export function to wait for queue completion
  export async function waitForOverflowQueueCompletion(): Promise<void> {
    if (overflowQueueManager) {
      await overflowQueueManager.waitForQueueCompletion();
    }
  }
  function handleMouseDown(_event: MouseEvent) {
    // Only handle mousedown in word mode
    if (currentMode !== 'word' || !wordEditorElement) {
      return;
    }

    // Use setTimeout to run after the browser sets the cursor position
    setTimeout(() => {
      // Create a temporary WordHandler instance to use adjustCursorPosition
      // We use a dummy formatting state since we only need the cursor adjustment
      const dummyState = { set: () => {}, subscribe: () => () => {} } as any;
      const handler = new WordHandler(dummyState);
      handler.adjustCursorPosition();
    }, 0);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Only handle arrow keys in word mode
    if (currentMode !== 'word' || !wordEditorElement || !isActive) {
      return;
    }

    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isArrowKey) {
      return;
    }

    // Use setTimeout to run after the browser's default arrow key behavior completes
    setTimeout(() => {
      // Create a temporary WordHandler instance to use adjustCursorPosition
      // We use a dummy formatting state since we only need the cursor adjustment
      const dummyState = { set: () => {}, subscribe: () => () => {} } as any;
      const handler = new WordHandler(dummyState);
      if (event.key === 'ArrowRight') {
        handler.moveCursorRightAcrossPageBreak();
      } else {
        handler.adjustCursorPosition();
      }
    }, 0);
  }

  // Determine if cursor is effectively at the visual start of a block
  function isAtVisualBlockStart(block: HTMLElement, range: Range): boolean {
    if (!block.firstChild) return true;

    // If the first child is a <br>, treat cursor before/inside it as at start
    if (block.firstChild.nodeType === Node.ELEMENT_NODE && (block.firstChild as HTMLElement).tagName === 'BR') {
      if (range.startContainer === block && range.startOffset === 0) return true;
      if (range.startContainer === block.firstChild) return true;
    }

    // Check text from block start to cursor; ignore whitespace and zero-width chars
    const probe = document.createRange();
    probe.setStart(block, 0);
    probe.setEnd(range.startContainer, range.startOffset);
    const preceding = probe.toString();
    return preceding.replace(/[\u200B\s]/g, '') === '';
  }

  // Use beforeinput to intercept Backspace before the browser merges blocks
  function handleBeforeInput(event: InputEvent) {
    if (
      event.inputType !== 'deleteContentBackward' ||
      currentMode !== 'word' ||
      !wordEditorElement ||
      !isActive
    ) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    const block = getContainingBlockElementFromNode(range.startContainer);
    if (!block) return;

    // Determine if cursor is effectively at block start (ignore whitespace/ZWSP/<br>)
    const atBlockStart = isAtVisualBlockStart(block, range);

    if (!atBlockStart) return;

    const prevBlock = block.previousElementSibling as HTMLElement | null;
    if (!prevBlock) return;

    const lastText = getLastTextNode(prevBlock);

    if (!lastText || !/⏎\s*$/.test(lastText.textContent || '')) return;

    // Prevent browser merging, remove trailing page-break, and reposition cursor
    event.preventDefault();

    lastText.textContent = (lastText.textContent || '').replace(/⏎\s*$/, '');
    if (!lastText.textContent) {
      lastText.parentNode?.removeChild(lastText);
    }

    const target = getLastTextNode(prevBlock) || prevBlock;
    const length =
      target.nodeType === Node.TEXT_NODE
        ? (target as Text).textContent?.length ?? 0
        : target.childNodes.length;

    const newRange = document.createRange();
    newRange.setStart(target, length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Sync after manual DOM change
    const inputEvent = new Event('input', { bubbles: true });
    wordEditorElement.dispatchEvent(inputEvent);
  }

  function handlePaste(event: ClipboardEvent) {
    // Only handle paste in word mode
    if (currentMode !== 'word' || !wordEditorElement || !isActive || isProcessing) {
      return;
    }

    event.preventDefault();
    
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    
    // Get HTML from clipboard
    const html = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');
    
    if (!html && !plainText) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // If we have HTML, parse it
    if (html) {
      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Check if the pasted content contains block elements
      const blockElements = Array.from(tempDiv.children).filter(
        (el) => ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(el.tagName)
      );
      
      // If we have block elements, insert them directly at editor root level
      if (blockElements.length > 0) {
        // IMPORTANT: Capture cursor position BEFORE any DOM manipulation
        // This is needed because deleteContents() can invalidate the range
        let cursorNode = range.startContainer;
        let cursorOffset = range.startOffset;
        
        // Find where to insert - always at editor root level
        // If cursor is inside a block, insert after that block
        let container: Node | null = cursorNode;
        if (container.nodeType === Node.TEXT_NODE) {
          container = container.parentElement;
        }
        
        // Find the closest block element that's a direct child of editor
        let targetBlock: HTMLElement | null = null;
        while (container && container !== wordEditorElement) {
          if (container.nodeType === Node.ELEMENT_NODE) {
            const tagName = (container as HTMLElement).tagName;
            if (['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(tagName)) {
              // Check if it's a direct child of editor
              if (container.parentNode === wordEditorElement) {
                targetBlock = container as HTMLElement;
                break;
              }
            }
          }
          container = container.parentElement;
        }
        
        // Determine insertion point
        let insertBefore: Node | null = null;
        if (targetBlock) {
          // Cursor is inside a block - split the block at cursor position
          try {
            // Create ranges for before and after cursor
            // We extract content directly - this will naturally handle any selection within the block
            const beforeRange = document.createRange();
            beforeRange.setStart(targetBlock, 0);
            beforeRange.setEnd(cursorNode, cursorOffset);
            
            // Extract before content first (this removes it from targetBlock)
            const beforeContent = beforeRange.extractContents();
            
            // Now extract after content - after extracting before, targetBlock contains only after content
            const afterRange2 = document.createRange();
            afterRange2.selectNodeContents(targetBlock);
            const afterContent = afterRange2.extractContents();
            
            // If there's a selection outside targetBlock, delete it now
            // (selections within targetBlock are already handled by extraction)
            if (!range.collapsed) {
              // Check if selection extends outside targetBlock
              const selectionStart = range.startContainer;
              const selectionEnd = range.endContainer;
              let startInBlock = false;
              let endInBlock = false;
              
              let node: Node | null = selectionStart;
              while (node && node !== wordEditorElement) {
                if (node === targetBlock) {
                  startInBlock = true;
                  break;
                }
                node = node.parentNode;
              }
              
              node = selectionEnd;
              while (node && node !== wordEditorElement) {
                if (node === targetBlock) {
                  endInBlock = true;
                  break;
                }
                node = node.parentNode;
              }
              
              // If selection extends outside targetBlock, delete the external part
              if (!startInBlock || !endInBlock) {
                range.deleteContents();
              }
            }
            
            // Create divs for before and after parts
            const beforeDiv = document.createElement(targetBlock.tagName.toLowerCase() as any);
            const hasBeforeContent = beforeContent.childNodes.length > 0;
            if (hasBeforeContent) {
              beforeDiv.appendChild(beforeContent);
            }
            // Copy any attributes from original block (except style which we remove)
            Array.from(targetBlock.attributes).forEach(attr => {
              if (attr.name !== 'style') {
                beforeDiv.setAttribute(attr.name, attr.value);
              }
            });
            
            const afterDiv = document.createElement(targetBlock.tagName.toLowerCase() as any);
            const hasAfterContent = afterContent.childNodes.length > 0;
            if (hasAfterContent) {
              afterDiv.appendChild(afterContent);
            }
            // Copy any attributes from original block (except style which we remove)
            Array.from(targetBlock.attributes).forEach(attr => {
              if (attr.name !== 'style') {
                afterDiv.setAttribute(attr.name, attr.value);
              }
            });
            
            // Insert: beforeDiv, newBlocks, afterDiv
            const parent = targetBlock.parentNode;
            if (parent) {
              // Insert beforeDiv first (only if it has content)
              if (hasBeforeContent) {
                parent.insertBefore(beforeDiv, targetBlock);
              }
              
              // Insert new blocks
              let lastInserted: HTMLElement | null = null;
              blockElements.forEach((block) => {
                const clonedBlock = block.cloneNode(true) as HTMLElement;
                clonedBlock.removeAttribute('style');
                parent.insertBefore(clonedBlock, targetBlock);
                lastInserted = clonedBlock;
              });
              
              // Insert afterDiv (only if it has content)
              if (hasAfterContent) {
                parent.insertBefore(afterDiv, targetBlock);
              }
              
              // Remove the original block (should be empty now)
              parent.removeChild(targetBlock);
              
              // Move cursor to end of last inserted block
              if (lastInserted) {
                const newRange = document.createRange();
                newRange.setStartAfter(lastInserted);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
            
            // Trigger input event to sync
            const inputEvent = new Event('input', { bubbles: true });
            wordEditorElement.dispatchEvent(inputEvent);
            return;
          } catch (e) {
            // Could not split block at cursor, falling back to insert after
            // Fallback: insert after the block
            insertBefore = targetBlock.nextSibling;
          }
        } else {
          // Cursor is at editor root level - find insertion point
          // Walk up to find the direct child of editor
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
          }
          
          while (node && node.parentNode !== wordEditorElement) {
            node = node.parentElement;
          }
          
          if (node) {
            insertBefore = node.nextSibling;
          }
        }
        
        // Insert all block elements (for non-split case)
        let lastInserted: HTMLElement | null = null;
        blockElements.forEach((block) => {
          const clonedBlock = block.cloneNode(true) as HTMLElement;
          
          // Remove style attribute from the block element itself (not from children)
          clonedBlock.removeAttribute('style');
          
          if (insertBefore && wordEditorElement) {
            wordEditorElement.insertBefore(clonedBlock, insertBefore);
          } else if (wordEditorElement) {
            wordEditorElement.appendChild(clonedBlock);
          }
          insertBefore = clonedBlock.nextSibling;
          lastInserted = clonedBlock;
        });
        
        // Move cursor to end of last inserted block
        if (lastInserted) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastInserted);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        // Trigger input event to sync
        const inputEvent = new Event('input', { bubbles: true });
        wordEditorElement.dispatchEvent(inputEvent);
        return;
      }
    }
    
    // For non-block content, use plain text
    if (plainText) {
      range.deleteContents();
      const textNode = document.createTextNode(plainText);
      range.insertNode(textNode);
      
      // Move cursor to end
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event to sync
      const inputEvent = new Event('input', { bubbles: true });
      wordEditorElement.dispatchEvent(inputEvent);
    }
  }
  
  async function handleInput(event: Event) {
    // Prevent input during processing (removing line and adding page) or if page is not active
    if (isProcessing || !isActive) {
      event.preventDefault();
      return;
    }
    
    isUserInput = true;
    // Don't update boundContent here - bind:innerHTML already keeps it in sync automatically
    // Updating it manually causes Svelte to reset innerHTML, which resets cursor position
    
    // CRITICAL: Check overflow and resolve it BEFORE syncing to other devices
    // Note: We don't await here to avoid blocking user input, but overflow detection will still work
    if (overflowQueueManager) {
      overflowQueueManager.updateWordflow().catch((_err) => {
        // Error checking overflow
      });
    }
    
    // Only sync after overflow check is complete and no overflow exists
    // This ensures other devices receive content without overflow
    if (!isOverflowing) {
      onInput(event);
    }
    
    isUserInput = false;
  }
  
  // Disable editor input
  function disableEditor() {
    if (wordEditorElement) {
      wordEditorElement.contentEditable = 'false';
      wordEditorElement.style.pointerEvents = 'none';
      wordEditorElement.style.opacity = '0.7';
    }
  }
  
  // Enable editor input (only if in word mode and page is active)
  // Note: isProcessing no longer prevents enabling - input is blocked via handleInput instead
  function enableEditor() {
    if (wordEditorElement && currentMode === 'word' && isActive) {
      wordEditorElement.contentEditable = 'true';
      wordEditorElement.style.pointerEvents = 'auto';
      wordEditorElement.style.opacity = '1';
    }
  }
  
</script>

<div class="editor-container" class:overflowing={isOverflowing}>
  <!-- Word Editor - Base layer -->
  <div 
    class="editor word-editor"
    class:active={currentMode === 'word'}
    contenteditable="true"
    on:beforeinput={handleBeforeInput}
    on:input={handleInput}
    on:paste={handlePaste}
    on:mousedown={handleMouseDown}
    on:keydown={handleKeyDown}
    bind:this={wordEditorElement}
    bind:innerHTML={boundContent}
    data-placeholder="Start typing or use / for commands..."
  ></div>
  
  
  <!-- Handwrite Canvas - Overlaid on top of word editor -->
  <div class="editor handwrite-editor" class:active={currentMode === 'handwrite'}>
    <canvas 
      class="drawing-canvas"
      bind:this={canvasElement}
    ></canvas>
  </div>
  
  <!-- PPT Canvas - Overlaid on top of word editor and handwrite -->
  <div class="editor ppt-editor" class:active={currentMode === 'ppt'}>
    <div class="ppt-canvas" bind:this={pptContainer}>
      {#if !pptContainer}
        <div class="ppt-placeholder">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4h12v12H4V4zm2 2v8h8V6H6z"/>
          </svg>
          <p>Click + to add frames</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .editor-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
  
  .editor {
    width: 100%;
    height: 100%;
  }
  
  .word-editor {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: calc(2rem * var(--page-scale, 1));
    color: #000;
    font-size: calc(var(--word-font-size, 1.5rem) * var(--page-scale, 1));
    line-height: 1.4; /* unitless so it scales with current element font-size */
    outline: none;
    transition: all 0.2s ease;
    height: 100%;
    box-sizing: border-box;
  }

  /* Headings: keep line spacing ample to avoid overlap and scale with font-size */
  .word-editor h1,
  .word-editor h2,
  .word-editor h3 {
    line-height: 1.3;
    margin: 0 0 0.6em;
  }
  
  /* Lists: ensure list markers (numbers/bullets) are visible inside the container */
  .word-editor ul,
  .word-editor ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
    list-style-position: outside;
    display: block;
  }
  
  .word-editor ul {
    list-style-type: disc;
  }
  
  .word-editor ol {
    list-style-type: decimal;
  }
  
  .word-editor li {
    margin: 0.25em 0;
    display: list-item;
  }
  
  .word-editor:empty:before {
    content: attr(data-placeholder);
    color: #555;
    pointer-events: none;
    line-height: inherit;
  }
  
  .word-editor:focus,
  .word-editor.active {
    border-color: rgba(110, 231, 183, 0.3);
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.1);
  }
  
  .word-editor:not(.active) {
    opacity: 0.7;
  }
  
  .ppt-editor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: all 0.2s ease;
    pointer-events: none; /* Allow clicks to pass through when not active */
  }
  
  .ppt-editor.active {
    pointer-events: auto; /* Enable interaction when active */
    z-index: 4; /* Above handwrite (z-index 3) */
  }
  
  .ppt-editor:not(.active) {
    pointer-events: none; /* Disable interaction when not active */
    opacity: 0.8;
    z-index: 1;
  }
  
  .ppt-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    border-radius: 0;
  }
  
  .ppt-frame {
    border-radius: 4px;
    font-family: inherit;
    font-size: calc(14px * var(--page-scale, 1));
    line-height: 1.5;
  }
  
  .ppt-frame[contenteditable="true"] {
    cursor: text;
  }
  
  .ppt-frame[contenteditable="true"]:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  .ppt-frame[contenteditable="true"]:empty:before {
    content: "Type here...";
    color: #9ca3af;
    pointer-events: none;
  }
  
  .ppt-drag-handle {
    user-select: none;
  }
  
  .ppt-drag-handle:hover {
    background-color: rgba(59, 130, 246, 0.3) !important;
  }
  
  .ppt-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .ppt-placeholder svg {
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }
  
  .handwrite-editor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: all 0.2s ease;
    pointer-events: none; /* Allow clicks to pass through to word editor when not active */
  }
  
  .handwrite-editor.active {
    pointer-events: auto; /* Capture events when handwrite mode is active */
    z-index: 2;
  }
  
  .handwrite-editor:not(.active) {
    opacity: 0.8;
    z-index: 1;
  }
  
  .drawing-canvas {
    width: 100%;
    height: 100%;
    background: transparent; /* Transparent so word editor shows through */
    border: none;
    border-radius: 12px;
    cursor: crosshair;
    transition: all 0.2s ease;
    pointer-events: auto; /* Always allow pointer events on canvas */
    touch-action: none; /* Prevent default touch behavior */
  }
  
  .handwrite-editor.active .drawing-canvas {
    /* Visual indicator when active */
    box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.3);
  }
  
  /* When word mode is active, ensure text is editable */
  .word-editor {
    position: relative;
    z-index: 1;
  }
  
  .word-editor.active {
    z-index: 1;
  }
  
  /* When handwrite mode is active, canvas should be on top and block word editor */
  .handwrite-editor.active {
    z-index: 3;
  }
  
  /* When handwrite is not active, allow word editor to receive events */
  .handwrite-editor:not(.active) {
    pointer-events: none;
  }
  
  .handwrite-editor:not(.active) .drawing-canvas {
    pointer-events: none; /* Disable canvas interaction when not in handwrite mode */
  }
</style>

