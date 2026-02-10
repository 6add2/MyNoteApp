import type { ModeCallbacks, ModeInputResult } from './types';
import type { Writable } from 'svelte/store';

/**
 * Formatting state for Word mode
 */
export interface FormattingState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  heading: 'p' | 'h1' | 'h2' | 'h3';
}

/**
 * WordHandler
 * Handles all Word mode editor operations including formatting, input, and keyboard shortcuts
 */
export class WordHandler {
  private syncCallback?: (content: string) => void;
  private readonly OVERRIDABLE_KEYS: Record<'color' | 'background' | 'fontSize', (keyof CSSStyleDeclaration)[]> = {
    color: ['color'],
    background: ['backgroundColor'],
    fontSize: ['fontSize'],
  };
  
  constructor(private formattingState: Writable<FormattingState>) {}
  
  /**
   * Set sync callback for direct syncing
   */
  public setSyncCallback(callback: (content: string) => void): void {
    this.syncCallback = callback;
  }

  /**
   * Apply font size to current selection (per-word/selection).
   * Keeps sizing relative to page scale via CSS calc().
   */
  public applyFontSize(sizeRem: number): void {
    this.wrapSelectionWithStyle(
      { fontSize: `calc(${sizeRem}rem * var(--page-scale, 1))` },
      this.OVERRIDABLE_KEYS.fontSize
    );
    // After DOM mutation, trigger a normal editor input event so EditorContainer
    // can run its overflow logic (updateWordflow) and sync safely.
    this.dispatchEditorInputEvent();
  }

  /**
   * Apply font color to current selection.
   */
  public applyFontColor(color: string): void {
    this.wrapSelectionWithStyle({ color }, this.OVERRIDABLE_KEYS.color);
  }

  /**
   * Apply background (highlight) color to current selection.
   */
  public applyFontBackground(color: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;

    // Prefer native command for multi-line selections
    try {
      const cmd = document.queryCommandSupported('hiliteColor') ? 'hiliteColor' : 'backColor';
      document.execCommand(cmd, false, color);
      this.syncAfterMutation();
      return;
    } catch {
      // fallback to manual wrap
    }

    this.wrapSelectionWithStyle({ backgroundColor: color }, this.OVERRIDABLE_KEYS.background);
  }

  /**
   * Check if an element is a block-level element
   */
  private isBlockElement(element: Node): boolean {
    if (element.nodeType !== Node.ELEMENT_NODE) return false;
    const tagName = (element as HTMLElement).tagName;
    return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(tagName);
  }

  /**
   * Get the block element containing a node
   */
  private getContainingBlockElement(node: Node | null): HTMLElement | null {
    if (!node) return null;
    let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    while (current) {
      if (this.isBlockElement(current)) {
        return current as HTMLElement;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Get all block elements that intersect with the selection range
   */
  private getBlockElementsInRange(range: Range): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    
    // Get the word editor root to exclude it from block detection
    const editorRoot = this.getWordEditorRoot();
    
    const startBlock = this.getContainingBlockElement(range.startContainer);
    const endBlock = this.getContainingBlockElement(range.endContainer);

    // If no blocks found, try to find blocks directly in the common ancestor
    if (!startBlock || !endBlock) {
      const commonAncestor = range.commonAncestorContainer;
      const walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            // Exclude the editor container itself
            if (node === editorRoot) {
              return NodeFilter.FILTER_SKIP;
            }
            if (this.isBlockElement(node)) {
              // Check if this block intersects with the range
              try {
                return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              } catch {
                return NodeFilter.FILTER_REJECT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let block = walker.nextNode() as HTMLElement | null;
      while (block) {
        if (block !== editorRoot && !blocks.includes(block)) {
          blocks.push(block);
        }
        block = walker.nextNode() as HTMLElement | null;
      }
      return blocks;
    }

    // Exclude editor root if it was found as a block
    if (startBlock === editorRoot || endBlock === editorRoot) {
      // If editor root is the block, find all child blocks
      const commonAncestor = range.commonAncestorContainer;
      const walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            // Exclude the editor container itself
            if (node === editorRoot) {
              return NodeFilter.FILTER_SKIP;
            }
            if (this.isBlockElement(node)) {
              // Check if this block intersects with the range
              try {
                return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              } catch {
                return NodeFilter.FILTER_REJECT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let block = walker.nextNode() as HTMLElement | null;
      while (block) {
        if (block !== editorRoot && !blocks.includes(block)) {
          blocks.push(block);
        }
        block = walker.nextNode() as HTMLElement | null;
      }
      return blocks;
    }

    // If start and end are in the same block
    if (startBlock === endBlock) {
      blocks.push(startBlock);
      return blocks;
    }

    // Find all blocks between start and end
    let current: Node | null = startBlock;
    while (current) {
      if (this.isBlockElement(current) && current !== editorRoot) {
        blocks.push(current as HTMLElement);
      }
      if (current === endBlock) break;
      current = current.nextSibling;
    }

    // If blocks aren't siblings, walk up the tree
    if (blocks.length === 0 || blocks[blocks.length - 1] !== endBlock) {
      // Fallback: collect all blocks in the common ancestor
      const commonAncestor = range.commonAncestorContainer;
      const walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            // Exclude the editor container itself
            if (node === editorRoot) {
              return NodeFilter.FILTER_SKIP;
            }
            if (this.isBlockElement(node)) {
              // Check if this block intersects with the range
              const blockRange = document.createRange();
              try {
                blockRange.selectNodeContents(node);
                return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              } catch {
                return NodeFilter.FILTER_REJECT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let block = walker.nextNode() as HTMLElement | null;
      while (block) {
        if (block !== editorRoot && !blocks.includes(block)) {
          blocks.push(block);
        }
        block = walker.nextNode() as HTMLElement | null;
      }
    }

    return blocks;
  }

  /**
   * Create a styled span element
   */
  private createStyledSpan(style: Partial<CSSStyleDeclaration>): HTMLSpanElement {
    const span = document.createElement('span');
    Object.entries(style).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // @ts-expect-error allow indexed access
        span.style[key] = value;
      }
    });
    return span;
  }

  /**
   * Wrap contents of a block element with a styled span
   */
  private wrapBlockContents(block: HTMLElement, style: Partial<CSSStyleDeclaration>, cleanKeys: (keyof CSSStyleDeclaration)[]): void {
    const span = this.createStyledSpan(style);
    
    // Move all children into the span
    while (block.firstChild) {
      span.appendChild(block.firstChild);
    }
    
    // Clean styles from the span's contents
    if (cleanKeys.length > 0) {
      this.cleanInlineStyles(span, cleanKeys);
    }
    this.removeEmptyStyleSpans(span);
    
    // Append span to block
    block.appendChild(span);
  }

  /**
   * Wrap a partial selection within a block element
   */
  private wrapPartialBlockSelection(
    block: HTMLElement,
    range: Range,
    style: Partial<CSSStyleDeclaration>,
    cleanKeys: (keyof CSSStyleDeclaration)[]
  ): void {
    try {
      // Create a range for the intersection of the original range and this block
      const blockRange = document.createRange();
      
      // Check if range starts before/within/after this block
      let startNode: Node;
      let startOffset: number;
      
      try {
        const startComparison = range.comparePoint(block, 0);
        if (startComparison < 0) {
          // Range starts before this block - start at beginning of block
          startNode = block;
          startOffset = 0;
        } else {
          // Range starts within or after this block
          // Find the actual start node within this block
          startNode = range.startContainer;
          startOffset = range.startOffset;
          
          // If startContainer is not within this block, find the first node in block
          if (!block.contains(startNode)) {
            startNode = block;
            startOffset = 0;
          } else {
            // Ensure we're starting at the right position
            // If startContainer is a text node, use it directly
            // Otherwise, find the appropriate child
            if (startNode.nodeType === Node.TEXT_NODE) {
              // Use the text node as-is
            } else if (startNode === block) {
              // Range starts at block level, use first child or 0
              startOffset = 0;
            } else {
              // Find the position within block
              const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
              let found = false;
              let node = walker.nextNode();
              while (node) {
                if (node === startNode || (startNode.nodeType === Node.TEXT_NODE && node.contains(startNode))) {
                  found = true;
                  break;
                }
                node = walker.nextNode();
              }
              if (!found) {
                startNode = block;
                startOffset = 0;
              }
            }
          }
        }
      } catch {
        // Fallback: start at beginning of block
        startNode = block;
        startOffset = 0;
      }
      
      // Check if range ends before/within/after this block
      let endNode: Node;
      let endOffset: number;
      
      try {
        const endComparison = range.comparePoint(block, block.childNodes.length);
        if (endComparison > 0) {
          // Range ends after this block - end at end of block
          endNode = block;
          endOffset = block.childNodes.length;
        } else {
          // Range ends within this block
          endNode = range.endContainer;
          endOffset = range.endOffset;
          
          // If endContainer is not within this block, find the last node in block
          if (!block.contains(endNode)) {
            endNode = block;
            endOffset = block.childNodes.length;
          } else {
            // Similar logic as start
            if (endNode.nodeType === Node.TEXT_NODE) {
              // Use the text node as-is
            } else if (endNode === block) {
              endOffset = block.childNodes.length;
            }
          }
        }
      } catch {
        // Fallback: end at end of block
        endNode = block;
        endOffset = block.childNodes.length;
      }
      
      // Set the block range
      blockRange.setStart(startNode, startOffset);
      blockRange.setEnd(endNode, endOffset);
      
      // Check if the entire block is selected
      if (startOffset === 0 && endOffset === block.childNodes.length && startNode === block && endNode === block) {
        this.wrapBlockContents(block, style, cleanKeys);
        return;
      }
      
      // Extract and wrap the partial content
      const contents = blockRange.extractContents();
      if (cleanKeys.length > 0) {
        this.cleanInlineStyles(contents, cleanKeys);
      }
      this.removeEmptyStyleSpans(contents);
      
      const span = this.createStyledSpan(style);
      span.appendChild(contents);
      blockRange.insertNode(span);
      
    } catch (e) {
      // Fallback: wrap entire block if range operations fail
      this.wrapBlockContents(block, style, cleanKeys);
    }
  }

  /**
   * Split a parent span at the given collapsed range position if it has conflicting styles.
   * Returns the range where the new span should be inserted (may be modified if split occurred).
   * After extractContents(), the range is collapsed at the insertion point.
   */
  private splitParentSpanIfNeeded(
    range: Range,
    cleanKeys: (keyof CSSStyleDeclaration)[]
  ): Range {
    if (cleanKeys.length === 0 || range.collapsed === false) return range;

    // Find the parent span that might have conflicting styles
    let node: Node | null = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    // Walk up to find a span with conflicting styles
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'SPAN') {
        // Check if this span has any of the conflicting style keys
        const hasConflictingStyle = cleanKeys.some((key) => {
          const styleValue = (el.style as any)[key];
          return typeof styleValue === 'string' && styleValue.trim() !== '';
        });

        if (hasConflictingStyle) {
          // We need to split this span at the collapsed range position
          const parent = el.parentNode;
          if (!parent) return range;

          try {
            // Create a range for the entire span
            const spanRange = document.createRange();
            spanRange.selectNodeContents(el);
            
            // Check where the collapsed range is relative to the span
            const startComparison = range.compareBoundaryPoints(Range.START_TO_START, spanRange);
            const endComparison = range.compareBoundaryPoints(Range.START_TO_END, spanRange);
            
            // If range is at the very start or end of span, no split needed
            if (startComparison === 0 || endComparison === 0) {
              return range;
            }
            
            // Split the span at the range position
            // Part 1: Content before the split point
            const beforeRange = document.createRange();
            beforeRange.setStart(spanRange.startContainer, spanRange.startOffset);
            beforeRange.setEnd(range.startContainer, range.startOffset);
            
            // Part 2: Content after the split point
            const afterRange = document.createRange();
            afterRange.setStart(range.startContainer, range.startOffset);
            afterRange.setEnd(spanRange.endContainer, spanRange.endOffset);
            
            // Extract content before and after
            const beforeContent = beforeRange.extractContents();
            const afterContent = afterRange.extractContents();
            
            // Create spans for before and after parts with same styles
            const beforeSpan = el.cloneNode(false) as HTMLElement;
            if (beforeContent.childNodes.length > 0) {
              beforeSpan.appendChild(beforeContent);
              parent.insertBefore(beforeSpan, el);
            }
            
            const afterSpan = el.cloneNode(false) as HTMLElement;
            if (afterContent.childNodes.length > 0) {
              afterSpan.appendChild(afterContent);
              // Insert after the original span (which will be empty/removed)
              if (el.nextSibling) {
                parent.insertBefore(afterSpan, el.nextSibling);
              } else {
                parent.appendChild(afterSpan);
              }
            }
            
            // Remove the original span (it's now empty)
            parent.removeChild(el);
            
            // Create a new range at the position between beforeSpan and afterSpan
            // (or where the original span was if one part is empty)
            const newRange = document.createRange();
            if (beforeContent.childNodes.length > 0 && afterContent.childNodes.length > 0) {
              // Between the two spans
              newRange.setStartAfter(beforeSpan);
              newRange.setEndBefore(afterSpan);
            } else if (beforeContent.childNodes.length > 0) {
              // After beforeSpan
              newRange.setStartAfter(beforeSpan);
              newRange.setEndAfter(beforeSpan);
            } else if (afterContent.childNodes.length > 0) {
              // Before afterSpan
              newRange.setStartBefore(afterSpan);
              newRange.setEndBefore(afterSpan);
            } else {
              // Both empty, use original position
              return range;
            }
            
            newRange.collapse(true); // Collapse to start
            return newRange;
            
          } catch (e) {
            // If splitting fails, return original range
            return range;
          }
        }
      }
      
      // Stop at block elements
      if (this.isBlockElement(node)) {
        break;
      }
      
      node = node.parentElement;
    }

    return range;
  }

  /**
   * Check if there's unwrapped content at the start (indicated by <br> tag)
   * and wrap it in a div, removing the <br> tag
   */
  private wrapUnwrappedFirstLine(range: Range, blocks: HTMLElement[]): HTMLElement[] {
    if (blocks.length === 0) return blocks;
    
    const editorRoot = this.getWordEditorRoot();
    if (!editorRoot) return blocks;
    
    const firstBlock = blocks[0];
    
    // Check if selection starts before the first block (unwrapped content)
    try {
      const firstBlockRange = document.createRange();
      firstBlockRange.selectNodeContents(firstBlock);
      const comparison = range.compareBoundaryPoints(Range.START_TO_START, firstBlockRange);
      
      // If selection starts before first block, there's unwrapped content
      if (comparison < 0) {
        // Find the unwrapped content range
        const unwrappedRange = document.createRange();
        unwrappedRange.setStart(range.startContainer, range.startOffset);
        unwrappedRange.setEndBefore(firstBlock);
        
        // Extract the unwrapped content
        const unwrappedContent = unwrappedRange.extractContents();
        
        // Check if there's a <br> tag in the unwrapped content or right after it
        let brToRemove: HTMLBRElement | null = null;
        
        // Check inside unwrapped content
        const brInContent = unwrappedContent.querySelector('br');
        if (brInContent) {
          brToRemove = brInContent;
          brToRemove.remove();
        } else {
          // Check if there's a <br> right before the first block
          const nodeBeforeBlock = firstBlock.previousSibling;
          if (nodeBeforeBlock && nodeBeforeBlock.nodeType === Node.ELEMENT_NODE && 
              (nodeBeforeBlock as HTMLElement).tagName === 'BR') {
            brToRemove = nodeBeforeBlock as HTMLBRElement;
          }
        }
        
        // Remove the <br> if found
        if (brToRemove && brToRemove.parentNode) {
          brToRemove.parentNode.removeChild(brToRemove);
        }
        
        // Check if there's any meaningful content left
        const textContent = unwrappedContent.textContent?.trim();
        if (textContent || unwrappedContent.childNodes.length > 0) {
          // Create a div to wrap the unwrapped content
          const wrapperDiv = document.createElement('div');
          wrapperDiv.appendChild(unwrappedContent);
          
          // Insert the div before the first block
          if (firstBlock.parentNode) {
            firstBlock.parentNode.insertBefore(wrapperDiv, firstBlock);
            // Add the new div to the beginning of blocks array
            blocks.unshift(wrapperDiv);
          }
        }
      }
    } catch (e) {
      // Could not wrap unwrapped first line
    }
    
    return blocks;
  }

  /**
   * Helper: wrap selection with a span carrying provided styles, and clean conflicting inline styles.
   * Method 2: Wraps each affected block element separately to avoid invalid HTML.
   */
  private wrapSelectionWithStyle(
    style: Partial<CSSStyleDeclaration>,
    cleanKeys: (keyof CSSStyleDeclaration)[] = []
  ): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    if (range.collapsed) return;

    // Get all block elements that intersect with the selection
    const blocks = this.getBlockElementsInRange(range);
    
    // Check and wrap unwrapped first line if needed (indicated by <br> tag)
    const updatedBlocks = this.wrapUnwrappedFirstLine(range, blocks);
    
    // If selection spans multiple blocks, wrap each block separately
    if (updatedBlocks.length > 1) {
      const selection = window.getSelection();
      if (!selection) return;
      
      // Store original selection for restoration
      const originalRange = selection.getRangeAt(0).cloneRange();
      
      // Process each block
      updatedBlocks.forEach((block) => {
        // Check if this block is fully or partially selected
        try {
          // Check if the entire block is selected by comparing range boundaries
          let isFullySelected = false;
          
          try {
            // Check if range starts before or at the start of the block
            const startComparison = originalRange.comparePoint(block, 0);
            // Check if range ends after or at the end of the block
            const endComparison = originalRange.comparePoint(block, block.childNodes.length);
            
            // Block is fully selected if range starts before/at start and ends after/at end
            isFullySelected = startComparison <= 0 && endComparison >= 0;
          } catch {
            // If comparePoint fails, check by creating a range for the block
            // and seeing if it's contained within the original range
            try {
              const blockRange = document.createRange();
              blockRange.selectNodeContents(block);
              
              // Check if block's start is at or after range start
              const startPos = originalRange.compareBoundaryPoints(Range.START_TO_START, blockRange);
              // Check if block's end is at or before range end
              const endPos = originalRange.compareBoundaryPoints(Range.END_TO_END, blockRange);
              
              isFullySelected = startPos <= 0 && endPos >= 0;
            } catch {
              // If all checks fail, assume partial selection
              isFullySelected = false;
            }
          }
          
          if (isFullySelected) {
            // Entire block is selected
            this.wrapBlockContents(block, style, cleanKeys);
          } else {
            // Partial selection - wrap only the selected portion
            this.wrapPartialBlockSelection(block, originalRange, style, cleanKeys);
          }
        } catch (e) {
          // Fallback: wrap entire block
          this.wrapBlockContents(block, style, cleanKeys);
        }
      });
      
      // Restore selection to cover all wrapped content
      try {
        selection.removeAllRanges();
        const newRange = document.createRange();
        if (updatedBlocks.length > 0) {
          const firstSpan = updatedBlocks[0].querySelector('span[style]');
          const lastSpan = updatedBlocks[updatedBlocks.length - 1].querySelector('span[style]');
          if (firstSpan && lastSpan) {
            newRange.setStartBefore(firstSpan);
            newRange.setEndAfter(lastSpan);
          } else {
            newRange.setStartBefore(updatedBlocks[0]);
            newRange.setEndAfter(updatedBlocks[updatedBlocks.length - 1]);
          }
          selection.addRange(newRange);
        }
      } catch (e) {
        // Failed to restore selection
      }
    } else if (updatedBlocks.length === 0) {
      // No blocks found - check if there's unwrapped content with <br>
      const editorRoot = this.getWordEditorRoot();
      if (editorRoot) {
        // Check if selection contains a <br> tag (indicates unwrapped content)
        const contents = range.extractContents();
        const brTag = contents.querySelector('br');
        
        if (brTag) {
          // Remove the <br> tag
          brTag.remove();
        }
        
        const textContent = contents.textContent?.trim();
        if (textContent || contents.childNodes.length > 0) {
          // Create a div to wrap the unwrapped content
          const wrapperDiv = document.createElement('div');
          wrapperDiv.appendChild(contents);
          range.insertNode(wrapperDiv);
          
          // Now wrap the div's contents with the style
          this.wrapBlockContents(wrapperDiv, style, cleanKeys);
          
          // Restore selection
          selection.removeAllRanges();
          const newRange = document.createRange();
          const span = wrapperDiv.querySelector('span[style]') || wrapperDiv;
          newRange.selectNodeContents(span);
          selection.addRange(newRange);
          return;
      }
      }
    } else {
      // Single block or no blocks - check if extracted contents contain block elements
    const contents = range.extractContents();
      
      // Check if contents contain any block elements
      const blockElementsInContents: HTMLElement[] = [];
      const walker = document.createTreeWalker(
        contents,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (this.isBlockElement(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      
      let blockNode = walker.nextNode() as HTMLElement | null;
      while (blockNode) {
        blockElementsInContents.push(blockNode);
        blockNode = walker.nextNode() as HTMLElement | null;
      }
      
      // If contents contain block elements, wrap each block separately
      if (blockElementsInContents.length > 0) {
        // Process each block element found in contents
        blockElementsInContents.forEach((block) => {
          this.wrapBlockContents(block, style, cleanKeys);
        });
        
        // Insert the contents (which now have wrapped blocks) at the range position
        range.insertNode(contents);
        
        // Restore selection
        selection.removeAllRanges();
        try {
          const newRange = document.createRange();
          if (blockElementsInContents.length > 0) {
            const firstBlock = blockElementsInContents[0];
            const lastBlock = blockElementsInContents[blockElementsInContents.length - 1];
            const firstSpan = firstBlock.querySelector('span[style]') || firstBlock;
            const lastSpan = lastBlock.querySelector('span[style]') || lastBlock;
            newRange.setStartBefore(firstSpan);
            newRange.setEndAfter(lastSpan);
            selection.addRange(newRange);
          }
        } catch (e) {
          // Failed to restore selection after multi-block wrap
        }
      } else {
        // No block elements - use original single-span approach
        const span = this.createStyledSpan(style);
        
        // After extraction, check if we need to split a parent span with conflicting styles
        // This prevents nested spans when applying styles to text inside an already-styled span
        const updatedRange = this.splitParentSpanIfNeeded(range, cleanKeys);
        
    if (cleanKeys.length > 0) {
      this.cleanInlineStyles(contents, cleanKeys);
    }
    this.cleanInlineStyles(contents, cleanKeys);
    this.removeEmptyStyleSpans(contents);
        
    span.appendChild(contents);
        updatedRange.insertNode(span);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
      }
    }

    this.updateFormattingState();
    this.syncAfterMutation();
  }

  /**
   * Locate the current word editor element from selection.
   */
  private getWordEditorRoot(): HTMLDivElement | null {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    if (!anchor) return null;
    const el = anchor instanceof HTMLElement ? anchor : anchor.parentElement;
    return el?.closest('.word-editor') as HTMLDivElement | null;
  }

  /**
   * Dispatch a synthetic input event on the current word editor.
   * This lets EditorContainer.handleInput run (including updateWordflow)
   * for formatting actions that change layout, just like normal typing.
   */
  private dispatchEditorInputEvent(): void {
    const root = this.getWordEditorRoot();
    if (!root) return;
    const event = new Event('input', { bubbles: true });
    root.dispatchEvent(event);
  }

  /**
   * After a local formatting mutation, sync HTML to Yjs if callback exists.
   */
  private syncAfterMutation(): void {
    const root = this.getWordEditorRoot();
    if (root && this.syncCallback) {
      this.syncCallback(root.innerHTML);
    }
  }

  /**
   * Remove conflicting inline styles inside a fragment or element for given keys so new wrapper can override.
   */
  private cleanInlineStyles(fragment: DocumentFragment | HTMLElement, keys: (keyof CSSStyleDeclaration)[]): void {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const el = node as HTMLElement;
      keys.forEach((key) => {
        // @ts-expect-error indexed style access
        el.style[key] = '';
      });
      // Remove empty style attribute
      if (el.getAttribute('style') !== null && el.getAttribute('style')?.trim() === '') {
        el.removeAttribute('style');
      }
      node = walker.nextNode();
    }
  }

  /**
   * Remove spans that become style-empty to reduce nesting conflicts.
   */
  private removeEmptyStyleSpans(fragment: DocumentFragment | HTMLElement): void {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
    const toRemove: HTMLElement[] = [];
    let node = walker.nextNode();
    while (node) {
      const el = node as HTMLElement;
      const isSpan = el.tagName === 'SPAN';
      const noStyle = !el.getAttribute('style');
      const noAttrs = el.attributes.length === 0;
      if (isSpan && noStyle && noAttrs) {
        toRemove.push(el);
      }
      node = walker.nextNode();
    }

    toRemove.forEach((el) => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      parent?.removeChild(el);
    });
  }

  /**
   * Handle editor input and return HTML content
   */
  public handleInput(event: Event, callbacks?: ModeCallbacks): ModeInputResult {
    const { onContentChange, onUnsavedChange } = callbacks || {};
    const html = (event.target as HTMLDivElement).innerHTML;
    
    // Direct sync
    if (this.syncCallback) {
      this.syncCallback(html);
    }
    
    onContentChange?.(html);
    onUnsavedChange?.();

    return { content: html, mode: 'word', isApplyingRemoteUpdate: false };
  }

  /**
   * Check whether there is any non-whitespace content after the cursor on the same block/line.
   */
  private hasContentAfterCursorInLine(range: Range): boolean {
    const block = this.getContainingBlockElement(range.startContainer);
    if (!block) {
      return false;
    }

    const cursorNode = range.endContainer;
    const cursorOffset = range.endOffset;

    const getNextNode = (node: Node | null): Node | null => {
      if (!node) return null;
      if (node.firstChild) return node.firstChild;
      let current: Node | null = node;
      while (current && current !== block && !current.nextSibling) {
        current = current.parentNode;
      }
      if (!current || current === block) {
        return current && current !== block ? current.nextSibling : null;
      }
      return current.nextSibling;
    };

    const hasTextAfterOffset = (textNode: Text, offset: number): boolean => {
      const remaining = textNode.textContent?.slice(offset) ?? '';
      return remaining.trim().length > 0;
    };

    let node: Node | null = cursorNode;
    while (node && node !== block) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const offset = node === cursorNode ? cursorOffset : 0;
        if (hasTextAfterOffset(textNode, offset)) {
          return true;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.textContent && el.textContent.trim().length > 0) {
          // If this is the cursor node itself, ensure we're considering siblings/children after it
          if (node !== cursorNode || cursorOffset < (el.childNodes?.length ?? 0)) {
            return true;
          }
        }
      }
      node = getNextNode(node);
    }

    // Walk siblings of the block as well (cursor might be on the block itself)
    if (node === block) {
      let sibling: Node | null = block.nextSibling;
      while (sibling && this.getContainingBlockElement(sibling) === block) {
        if (sibling.textContent && sibling.textContent.trim().length > 0) {
          return true;
        }
        sibling = sibling.nextSibling;
      }
    }

    return false;
  }

  /**
   * Handle keyboard shortcuts for Word mode
   */
  public handleKeyDown(event: KeyboardEvent, callbacks?: ModeCallbacks): void {
    const { onSave, onToggleBold, onToggleItalic, onToggleUnderline, onCommandPalette } = callbacks || {};

    // Cross-page navigation with arrow keys
    if (
      (event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight') &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const selection = window.getSelection();
      const editorRoot = this.getWordEditorRoot();

      if (selection && selection.rangeCount > 0 && editorRoot) {
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
          const atStart = this.isAtEditorStart(editorRoot, range);
          const atEnd = this.isAtEditorEnd(editorRoot, range);

          // 上一页：在页首时，ArrowUp 或 ArrowLeft 都触发
          if ((event.key === 'ArrowUp' || event.key === 'ArrowLeft') && atStart) {
            event.preventDefault();
            window.dispatchEvent(
              new CustomEvent('page-arrow-nav', { detail: { direction: 'prev' as 'prev' } })
            );
            return;
          }

          // 下一页：在页尾时，ArrowDown 或 ArrowRight 都触发
          if ((event.key === 'ArrowDown' || event.key === 'ArrowRight') && atEnd) {
            event.preventDefault();
            window.dispatchEvent(
              new CustomEvent('page-arrow-nav', { detail: { direction: 'next' as 'next' } })
            );
            return;
          }
        }
      }
    }

    // Handle Enter key - insert page break symbol at cursor position
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const hasTrailingContent = this.hasContentAfterCursorInLine(range);
        
        // Insert page break symbol at cursor position
        const pageBreakText = document.createTextNode('⏎');
        range.insertNode(pageBreakText);
        
        if (!hasTrailingContent) {
          // No trailing content: make a double symbol in the same text node and place caret between.
          pageBreakText.textContent = '⏎⏎';
          const betweenRange = document.createRange();
          betweenRange.setStart(pageBreakText, 1); // Caret between the two symbols
          betweenRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(betweenRange);
        } else {
          // Default: caret after the single symbol
          const newRange = document.createRange();
          newRange.setStartAfter(pageBreakText);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        // Let default Enter behavior create new line
        return;
      }
    }

    // Handle slash commands
    if (event.key === '/') {
      onCommandPalette?.();
      return;
    }

    // Save shortcut
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // Bold
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      onToggleBold?.();
      return;
    }

    // Italic
    if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
      event.preventDefault();
      onToggleItalic?.();
      return;
    }

    // Underline
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
      event.preventDefault();
      onToggleUnderline?.();
      return;
    }
  }

  /**
   * Undo last action
   */
  public undo(): void {
    document.execCommand('undo');
  }

  /**
   * Redo last undone action
   */
  public redo(): void {
    document.execCommand('redo');
  }

  /**
   * Get current formatting state
   */
  public getState(): FormattingState {
    let state: FormattingState = {
      isBold: false,
      isItalic: false,
      isUnderline: false,
      heading: 'p',
    };
    
    this.formattingState.subscribe((s) => {
      state = s;
    })();
    
    return state;
  }

  // ========== Word-specific formatting methods ==========

  /**
   * Toggle bold formatting
   */
  public toggleBold(): void {
    document.execCommand('bold');
    this.updateFormattingState();
  }

  /**
   * Toggle italic formatting
   */
  public toggleItalic(): void {
    document.execCommand('italic');
    this.updateFormattingState();
  }

  /**
   * Toggle underline formatting
   */
  public toggleUnderline(): void {
    document.execCommand('underline');
    this.updateFormattingState();
  }

  /**
   * Set heading level
   */
  public setHeading(level: 'p' | 'h1' | 'h2' | 'h3'): void {
    document.execCommand('formatBlock', false, level);
    this.updateFormattingState();
    // Heading changes can affect layout/overflow, so trigger editor input flow
    this.dispatchEditorInputEvent();
  }

  /**
   * Insert list (ordered or unordered)
   */
  public insertList(type: 'ul' | 'ol'): void {
    document.execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    // Lists change block structure and can affect overflow
    this.dispatchEditorInputEvent();
  }

  /**
   * Update formatting state from current selection and update store
   */
  public updateFormattingState(): void {
    try {
      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isUnderline = document.queryCommandState('underline');
      const block = document.queryCommandValue('formatBlock') || 'p';
      const normalized = String(block).toLowerCase();
      const heading: 'p' | 'h1' | 'h2' | 'h3' = 
        ['p', 'h1', 'h2', 'h3'].includes(normalized) 
          ? (normalized as 'p' | 'h1' | 'h2' | 'h3')
          : 'p';

      this.formattingState.set({ isBold, isItalic, isUnderline, heading });
    } catch {
      // queryCommandState may throw in some environments; fail silently
      this.formattingState.set({ isBold: false, isItalic: false, isUnderline: false, heading: 'p' });
    }
  }

  /**
   * Focus the word editor element
   * This method finds the word editor in the active page and focuses it
   */
  public focusEditor(): void {
    // Find the active word editor element in the active page container
    // First try to find it in the active page container
    const activePageContainer = document.querySelector('.page-container.active');
    const wordEditor = activePageContainer
      ? (activePageContainer.querySelector('.word-editor') as HTMLDivElement | null)
      : (document.querySelector('.word-editor.active') as HTMLDivElement | null);
    
    if (wordEditor) {
      wordEditor.focus();
      // Move cursor to the end of the content
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection && wordEditor.childNodes.length > 0) {
        range.selectNodeContents(wordEditor);
        range.collapse(false); // Collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // If editor is empty, just focus it
        wordEditor.focus();
      }
    }
  }

  /**
   * Check if caret is at the visual start of the first content line in this editor/page.
   * - 光标必须在当前行（block）的「行首」（忽略空白/ZWSP）
   * - 且当前行上方没有任何非空内容行
   */
  private isAtEditorStart(editor: HTMLElement, range: Range): boolean {
    if (!editor.contains(range.startContainer)) return false;

    const block = this.getContainingBlockElement(range.startContainer) || editor;

    // 1) 光标是否在当前行(block)的视觉起点（忽略空白和零宽字符）
    try {
      const probeLine = document.createRange();
      probeLine.setStart(block, 0);
      probeLine.setEnd(range.startContainer, range.startOffset);
      const beforeText = probeLine.toString().replace(/[\u200B\s]/g, '');
      if (beforeText.length > 0) {
        // 当前行内光标前还有实际内容，不算页首
        return false;
      }
    } catch {
      // 如果 range 操作失败，保守处理为不是页首
      return false;
    }

    // 2) 检查当前 block 之前是否存在有内容的兄弟 block
    let prev: Element | null = (block as HTMLElement).previousElementSibling;
    while (prev) {
      if (this.isBlockElement(prev)) {
        const text = (prev.textContent || '').replace(/[\u200B\s⏎]/g, '');
        if (text.length > 0) {
          // 前面还有非空内容行
          return false;
        }
      }
      prev = prev.previousElementSibling;
    }

    // 行首且上方没有非空内容，视为页首
    return true;
  }

  /**
   * Check if caret is at the visual end of the last content line in this editor/page.
   * - 光标必须在当前行的行尾（忽略空白/ZWSP/⏎）
   * - 且当前行下方没有任何非空内容行
   */
  private isAtEditorEnd(editor: HTMLElement, range: Range): boolean {
    if (!editor.contains(range.startContainer)) return false;

    const block = this.getContainingBlockElement(range.startContainer) || editor;

    // 1) 光标是否在当前行(block)的视觉末尾（忽略空白、ZWSP、分页符 ⏎）
    try {
      const probeLine = document.createRange();
      probeLine.setStart(range.endContainer, range.endOffset);
      probeLine.setEnd(block, block.childNodes.length);
      const afterText = probeLine.toString().replace(/[\u200B\s⏎]/g, '');
      if (afterText.length > 0) {
        // 当前行内光标后还有实际内容，不算页尾
        return false;
      }
    } catch {
      return false;
    }

    // 2) 检查当前 block 之后是否存在有内容的兄弟 block
    let next: Element | null = (block as HTMLElement).nextElementSibling;
    while (next) {
      if (this.isBlockElement(next)) {
        const text = (next.textContent || '').replace(/[\u200B\s⏎]/g, '');
        if (text.length > 0) {
          // 下面还有非空内容行
          return false;
        }
      }
      next = next.nextElementSibling;
    }

    return true;
  }

  /**
   * Get the previous/next page's word editor, if it exists.
   */
  // （已不再需要直接跨页聚焦 editor，改由 pagesStore 统一切换激活页）

  // 以前用于直接在相邻页 editor 中定位光标的工具函数，现已不再使用。

  /**
   * Ensure cursor is positioned before page break symbol (⏎) if it's after it
   * This should be called after click/mousedown events to prevent editing after the symbol
   */
  public adjustCursorPosition(): void {
    const root = this.getWordEditorRoot();
    if (!root) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return; // Only adjust collapsed (cursor) selections

    const pageBreakSymbol = '⏎';
    const container = range.startContainer;
    const offset = range.startOffset;

    // Check if cursor is in a text node
    if (container.nodeType === Node.TEXT_NODE) {
      const textNode = container as Text;
      const text = textNode.textContent || '';

      // Check if cursor is positioned right after the page break symbol
      if (offset > 0 && text[offset - 1] === pageBreakSymbol) {
        // Cursor is right after the symbol, move it before
        const newRange = document.createRange();
        newRange.setStart(textNode, offset - 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        return;
      }

      // Check if cursor is at the end of text node and next sibling starts with symbol
      if (offset >= text.length) {
        let nextNode = textNode.nextSibling;
        while (nextNode) {
          if (nextNode.nodeType === Node.TEXT_NODE) {
            const nextText = (nextNode as Text).textContent || '';
            if (nextText.startsWith(pageBreakSymbol)) {
              // Move cursor to before the symbol in next node
              const newRange = document.createRange();
              newRange.setStart(nextNode, 0);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              return;
            }
            break;
          }
          nextNode = nextNode.nextSibling;
        }
      }
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      // Cursor is in an element, check if next child is a text node starting with symbol
      const element = container as HTMLElement;
      if (offset < element.childNodes.length) {
        const nextChild = element.childNodes[offset];
        if (nextChild.nodeType === Node.TEXT_NODE) {
          const text = (nextChild as Text).textContent || '';
          if (text.startsWith(pageBreakSymbol)) {
            // Move cursor to before this text node
            const newRange = document.createRange();
            newRange.setStartBefore(nextChild);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            return;
          }
        }
      }
      
      // Also check if cursor is at the end and next sibling starts with symbol
      if (offset >= element.childNodes.length) {
        let nextNode = element.nextSibling;
        while (nextNode) {
          if (nextNode.nodeType === Node.TEXT_NODE) {
            const text = (nextNode as Text).textContent || '';
            if (text.startsWith(pageBreakSymbol)) {
              const newRange = document.createRange();
              newRange.setStart(nextNode, 0);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              return;
            }
            break;
          }
          // Check first text node in element
          if (nextNode.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(
              nextNode,
              NodeFilter.SHOW_TEXT,
              null
            );
            const firstTextNode = walker.nextNode() as Text | null;
            if (firstTextNode) {
              const text = firstTextNode.textContent || '';
              if (text.startsWith(pageBreakSymbol)) {
                const newRange = document.createRange();
                newRange.setStart(firstTextNode, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                return;
              }
            }
          }
          nextNode = nextNode.nextSibling;
        }
      }
    }
  }

  /**
   * When the cursor is immediately before the page break symbol (⏎), move it to the
   * beginning of the next block so ArrowRight jumps to the next line instead of
   * landing behind the symbol.
   */
  public moveCursorRightAcrossPageBreak(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    const pageBreakSymbol = '⏎';
    const container = range.startContainer;
    const offset = range.startOffset;

    const isBeforeSymbol =
      (container.nodeType === Node.TEXT_NODE &&
        (((container as Text).textContent ?? '')[offset] === pageBreakSymbol)) ||
      (container.nodeType === Node.ELEMENT_NODE &&
        offset < container.childNodes.length &&
        container.childNodes[offset].nodeType === Node.TEXT_NODE &&
        (((container.childNodes[offset] as Text).textContent ?? '').startsWith(pageBreakSymbol)));

    const isAfterSymbol =
      container.nodeType === Node.TEXT_NODE &&
      offset > 0 &&
      (((container as Text).textContent ?? '')[offset - 1] === pageBreakSymbol);

    // If neither before nor after the symbol, nothing to do
    if (!isBeforeSymbol && !isAfterSymbol) return;

    const currentBlock = this.getContainingBlockElement(container);
    const nextBlock = currentBlock?.nextElementSibling as HTMLElement | null;

    if (nextBlock) {
      // Place caret at start of next block
      const walker = document.createTreeWalker(nextBlock, NodeFilter.SHOW_TEXT);
      const firstText = walker.nextNode() as Text | null;

      const newRange = document.createRange();
      if (firstText) {
        newRange.setStart(firstText, 0);
      } else {
        newRange.setStart(nextBlock, 0);
      }
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }

    // No next block: keep cursor before the symbol instead of moving behind it
    if (container.nodeType === Node.TEXT_NODE) {
      const textNode = container as Text;
      const newRange = document.createRange();
      const newOffset = isAfterSymbol ? Math.max(0, offset - 1) : offset;
      newRange.setStart(textNode, newOffset);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Clone attributes and styles from source element to target element
   */
  private cloneDivAttributes(source: HTMLElement, target: HTMLElement): void {
    // Copy all attributes
    Array.from(source.attributes).forEach(attr => {
      target.setAttribute(attr.name, attr.value);
    });
    // Copy inline styles
    target.style.cssText = source.style.cssText;
  }

  /**
   * Split a div element into multiple divs if it spans more than one visual line.
   * Each resulting div will contain exactly one line of text.
   * 
   * @param div - The div element to potentially split
   * @returns An array of divs (original div if single line, or multiple divs if split)
   */
  public splitDivByLines(div: HTMLElement): HTMLElement[] {
    if (!div || div.tagName !== 'DIV') {
      return [div];
    }

    const textContent = div.textContent?.trim();
    if (!textContent || textContent.length === 0) {
      return [div];
    }

    // Force a reflow to ensure accurate measurements
    void div.offsetHeight;

    // Check if div has multiple lines using getClientRects
    const fullRange = document.createRange();
    fullRange.selectNodeContents(div);
    const rects = fullRange.getClientRects();
    
    // If only one rect, the div is single-line
    if (rects.length <= 1) {
      return [div];
    }

    // Multiple lines detected - split the div
    const splitDivs: HTMLElement[] = [];
    const parent = div.parentNode;
    if (!parent) {
      return [div];
    }

    // Use a simpler approach: iterate through content character by character
    // to find line boundaries based on Y position changes
    const findLineBoundaries = (): Array<{ startNode: Node; startOffset: number; endNode: Node; endOffset: number }> => {
      const boundaries: Array<{ startNode: Node; startOffset: number; endNode: Node; endOffset: number }> = [];
      
      // Get all text nodes
      const walker = document.createTreeWalker(
        div,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let textNode: Text | null;
      while (textNode = walker.nextNode() as Text | null) {
        if (textNode.textContent && textNode.textContent.length > 0) {
          textNodes.push(textNode);
        }
      }

      if (textNodes.length === 0) {
        return boundaries;
      }

      // Find the Y position of the first character
      const firstRange = document.createRange();
      firstRange.setStart(textNodes[0], 0);
      firstRange.collapse(true);
      let lastTop = firstRange.getBoundingClientRect().top;
      let lineStartNode: Node = textNodes[0];
      let lineStartOffset = 0;

      // Iterate through all text nodes and characters
      let textNodeIndex = 0;
      for (const textNode of textNodes) {
        const text = textNode.textContent || '';
        
        // Check first character of this text node (if not the first text node)
        if (textNodeIndex > 0 && text.length > 0) {
          const firstCharRange = document.createRange();
          firstCharRange.setStart(textNode, 0);
          firstCharRange.collapse(true);
          const firstCharTop = firstCharRange.getBoundingClientRect().top;
          
          // If Y position changed, previous line ended at end of previous text node
          if (Math.abs(firstCharTop - lastTop) > 2) {
            const prevTextNode = textNodes[textNodeIndex - 1];
            boundaries.push({
              startNode: lineStartNode,
              startOffset: lineStartOffset,
              endNode: prevTextNode,
              endOffset: prevTextNode.textContent?.length || 0
            });
            
            lineStartNode = textNode;
            lineStartOffset = 0;
            lastTop = firstCharTop;
          }
        }
        
        // Check each character in this text node
        for (let i = 0; i < text.length; i++) {
          const testRange = document.createRange();
          testRange.setStart(textNode, i);
          testRange.collapse(true);
          
          const testRect = testRange.getBoundingClientRect();
          const currentTop = testRect.top;
          
          // If Y position changed significantly (more than 2px), we hit a line break
          if (i > 0 && Math.abs(currentTop - lastTop) > 2) {
            // Save the previous line boundary
            boundaries.push({
              startNode: lineStartNode,
              startOffset: lineStartOffset,
              endNode: textNode,
              endOffset: i
            });

            // Start new line
            lineStartNode = textNode;
            lineStartOffset = i;
            lastTop = currentTop;
          } else if (i === 0 && textNodeIndex === 0) {
            // First character of first text node - initialize lastTop
            lastTop = currentTop;
          }
        }
        
        textNodeIndex++;
      }

      // Add the last line
      if (textNodes.length > 0) {
        const lastTextNode = textNodes[textNodes.length - 1];
        boundaries.push({
          startNode: lineStartNode,
          startOffset: lineStartOffset,
          endNode: lastTextNode,
          endOffset: lastTextNode.textContent?.length || 0
        });
      }

      return boundaries;
    };

    try {
      const boundaries = findLineBoundaries();
      
      if (boundaries.length <= 1) {
        return [div];
      }

      // Create ranges for all lines first (before any DOM modification)
      const lineRanges: Range[] = [];
      for (const boundary of boundaries) {
        const lineRange = document.createRange();
        lineRange.setStart(boundary.startNode, boundary.startOffset);
        lineRange.setEnd(boundary.endNode, boundary.endOffset);
        lineRanges.push(lineRange);
      }

      // Extract content for each line from end to start to avoid DOM invalidation
      const lineContents: DocumentFragment[] = [];
      
      for (let i = lineRanges.length - 1; i >= 0; i--) {
        const lineRange = lineRanges[i];
        try {
          const lineContent = lineRange.extractContents();
          if (lineContent.textContent?.trim() || lineContent.childNodes.length > 0) {
            lineContents.unshift(lineContent); // Add to beginning to maintain order
          }
        } catch (error) {
          // Range might be invalid after previous extractions, skip this line
          console.warn('Failed to extract line content:', error);
        }
      }

      // Create new divs from extracted content
      for (const lineContent of lineContents) {
        const newDiv = document.createElement('div');
        this.cloneDivAttributes(div, newDiv);
        newDiv.appendChild(lineContent);
        splitDivs.push(newDiv);
      }

      // If we successfully split, replace the original div
      if (splitDivs.length > 1) {
        splitDivs.forEach((newDiv, index) => {
          if (index === 0) {
            parent.replaceChild(newDiv, div);
          } else {
            parent.insertBefore(newDiv, splitDivs[index - 1].nextSibling);
          }
        });
        return splitDivs;
      }
    } catch (error) {
      console.error('Error splitting div by lines:', error);
    }

    return [div];
  }

  /**
   * Wrap any unwrapped content (text nodes) at the editor root level into a div.
   * This ensures all content is properly wrapped in block elements.
   * 
   * @param editorRoot - Optional editor root element. If not provided, uses getWordEditorRoot()
   * @returns The number of divs created (0 if no unwrapped content)
   */
  public wrapUnwrappedContentAtRoot(editorRoot?: HTMLElement): number {
    const root = editorRoot || this.getWordEditorRoot();
    if (!root) {
      return 0;
    }

    let wrappedCount = 0;

    // Get all block elements (divs, paragraphs, etc.)
    const blockElements = Array.from(root.children).filter(
      (el) => this.isBlockElement(el)
    ) as HTMLElement[];

    // Find the first block element
    const firstBlock = blockElements.length > 0 ? blockElements[0] : null;

    // Check for unwrapped content before the first block
    if (firstBlock) {
      // Check if there are any text nodes or <br> tags before the first block
      let hasUnwrappedContent = false;
      let unwrappedStart: Node | null = null;
      let brToRemove: HTMLElement | null = null;

      // Walk through nodes before the first block
      let currentNode: Node | null = root.firstChild;
      while (currentNode && currentNode !== firstBlock) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const text = currentNode.textContent?.trim();
          if (text && text.length > 0) {
            hasUnwrappedContent = true;
            if (!unwrappedStart) {
              unwrappedStart = currentNode;
            }
          }
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode as HTMLElement;
          if (element.tagName === 'BR') {
            brToRemove = element;
            hasUnwrappedContent = true;
            if (!unwrappedStart) {
              unwrappedStart = currentNode;
            }
          } else if (!this.isBlockElement(currentNode)) {
            // Other inline elements count as unwrapped content
            hasUnwrappedContent = true;
            if (!unwrappedStart) {
              unwrappedStart = currentNode;
            }
          }
        }
        currentNode = currentNode.nextSibling;
      }

      // Also check for <br> right before the first block
      if (!brToRemove) {
        const nodeBeforeBlock = firstBlock.previousSibling;
        if (nodeBeforeBlock && nodeBeforeBlock.nodeType === Node.ELEMENT_NODE && 
            (nodeBeforeBlock as HTMLElement).tagName === 'BR') {
          brToRemove = nodeBeforeBlock as HTMLBRElement;
          hasUnwrappedContent = true;
        }
      }

      if (hasUnwrappedContent && unwrappedStart) {
        try {
          // Create a range for the unwrapped content
          const unwrappedRange = document.createRange();
          
          // Set start to the first unwrapped node
          if (unwrappedStart.nodeType === Node.TEXT_NODE) {
            unwrappedRange.setStart(unwrappedStart, 0);
          } else {
            unwrappedRange.setStartBefore(unwrappedStart);
          }
          
          // Set end before the first block (or before <br> if it's separate)
          if (brToRemove && brToRemove !== unwrappedStart && brToRemove.previousSibling !== unwrappedStart) {
            unwrappedRange.setEndBefore(brToRemove);
          } else {
            unwrappedRange.setEndBefore(firstBlock);
          }

          // Extract the unwrapped content
          const unwrappedContent = unwrappedRange.extractContents();

          // Remove <br> from extracted content if it's inside
          const brInContent = unwrappedContent.querySelector('br');
          if (brInContent) {
            brInContent.remove();
          }

          // Remove the separate <br> if it exists
          if (brToRemove && brToRemove.parentNode && 
              (!unwrappedContent.contains(brToRemove) || brInContent !== brToRemove)) {
            brToRemove.parentNode.removeChild(brToRemove);
          }

          // Check if there's meaningful content
          const textContent = unwrappedContent.textContent?.trim();
          if (textContent || unwrappedContent.childNodes.length > 0) {
            // Create a div to wrap the unwrapped content
            const wrapperDiv = document.createElement('div');
            wrapperDiv.appendChild(unwrappedContent);

            // Insert before the first block
            if (firstBlock.parentNode) {
              firstBlock.parentNode.insertBefore(wrapperDiv, firstBlock);
              wrappedCount = 1;
            }
          }
        } catch (e) {
          // Could not wrap unwrapped content
          console.warn('Failed to wrap unwrapped content:', e);
        }
      }
    } else {
      // No block elements - check if there's any unwrapped content at all
      // This handles the case where the editor only has text nodes or <br> tags
      let hasUnwrappedContent = false;
      let unwrappedNodes: Node[] = [];
      let brToRemove: HTMLElement | null = null;

      let currentNode: Node | null = root.firstChild;
      while (currentNode) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const text = currentNode.textContent?.trim();
          if (text && text.length > 0) {
            hasUnwrappedContent = true;
            unwrappedNodes.push(currentNode);
          }
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode as HTMLElement;
          if (element.tagName === 'BR') {
            brToRemove = element;
            hasUnwrappedContent = true;
          } else if (!this.isBlockElement(currentNode)) {
            hasUnwrappedContent = true;
            unwrappedNodes.push(currentNode);
          }
        }
        currentNode = currentNode.nextSibling;
      }

      if (hasUnwrappedContent && unwrappedNodes.length > 0) {
        try {
          // Create a range from first unwrapped node to last (or before <br>)
          const unwrappedRange = document.createRange();
          const firstNode = unwrappedNodes[0];
          const lastNode = brToRemove ? brToRemove.previousSibling : unwrappedNodes[unwrappedNodes.length - 1];

          if (firstNode.nodeType === Node.TEXT_NODE) {
            unwrappedRange.setStart(firstNode, 0);
          } else {
            unwrappedRange.setStartBefore(firstNode);
          }

          if (brToRemove) {
            unwrappedRange.setEndBefore(brToRemove);
          } else if (lastNode) {
            if (lastNode.nodeType === Node.TEXT_NODE) {
              unwrappedRange.setEnd(lastNode, (lastNode.textContent?.length || 0));
            } else {
              unwrappedRange.setEndAfter(lastNode);
            }
          }

          // Extract the unwrapped content
          const unwrappedContent = unwrappedRange.extractContents();

          // Remove <br> if it exists
          if (brToRemove && brToRemove.parentNode) {
            brToRemove.parentNode.removeChild(brToRemove);
          }

          // Check if there's meaningful content
          const textContent = unwrappedContent.textContent?.trim();
          if (textContent || unwrappedContent.childNodes.length > 0) {
            // Create a div to wrap the unwrapped content
            const wrapperDiv = document.createElement('div');
            wrapperDiv.appendChild(unwrappedContent);

            // Insert at the beginning
            if (root.firstChild) {
              root.insertBefore(wrapperDiv, root.firstChild);
            } else {
              root.appendChild(wrapperDiv);
            }
            wrappedCount = 1;
          }
        } catch (e) {
          // Could not wrap unwrapped content
          console.warn('Failed to wrap unwrapped content:', e);
        }
      }
    }

    return wrappedCount;
  }

  /**
   * Split all multi-line divs in the editor into single-line divs.
   * This should be called before updateWordflow to ensure accurate overflow detection.
   * 
   * Process: 1) Get all HTML content, 2) Remove all div tags, 3) Split by page break symbols
   * into paragraphs, 4) Wrap each paragraph with div, 5) Split each div by lines (1 line = 1 div).
   * 
   * @param editorRoot - Optional editor root element. If not provided, uses getWordEditorRoot()
   * @returns The number of divs that were split
   */
  public splitAllMultiLineDivs(editorRoot?: HTMLElement): number {
    const root = editorRoot || this.getWordEditorRoot();
    if (!root) {
      return 0;
    }

    // Step 1: Remove all div tags and merge content into one
    // Unwrap all divs by moving their children to the parent
    const unwrapDivs = (container: Node): void => {
      const divs: HTMLElement[] = [];
      
      // Collect all divs first (to avoid modifying while iterating)
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT,
        null
      );
      
      let node = walker.nextNode();
      while (node) {
        if ((node as HTMLElement).tagName === 'DIV') {
          divs.push(node as HTMLElement);
        }
        node = walker.nextNode();
      }
      
      // Unwrap each div (from deepest to shallowest to avoid issues)
      divs.reverse().forEach(div => {
        const parent = div.parentNode;
        if (parent) {
          // Move all children of the div to before the div
          while (div.firstChild) {
            parent.insertBefore(div.firstChild, div);
          }
          // Remove the empty div
          parent.removeChild(div);
        }
      });
    };

    unwrapDivs(root);

    // Step 1.5: Remove all <br> tags
    const brTags: HTMLElement[] = [];
    const brWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    
    let brNode = brWalker.nextNode();
    while (brNode) {
      if ((brNode as HTMLElement).tagName === 'BR') {
        brTags.push(brNode as HTMLElement);
      }
      brNode = brWalker.nextNode();
    }
    
    // Remove all <br> tags
    brTags.forEach(br => {
      if (br.parentNode) {
        br.parentNode.removeChild(br);
      }
    });

    // Step 2: Split by page break symbol (⏎) and wrap each paragraph in a div
    const pageBreakSymbol = '⏎';
    const paragraphs: DocumentFragment[] = [];
    let currentParagraph = document.createDocumentFragment();
    
    // Function to split nodes by page break symbol
    const splitByPageBreak = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const text = textNode.textContent || '';
        
        if (text.includes(pageBreakSymbol)) {
          const parts = text.split(pageBreakSymbol);
          
          // Add all parts except the last one as separate paragraphs
          for (let i = 0; i < parts.length - 1; i++) {
            // Add current part to current paragraph
            if (parts[i]) {
              currentParagraph.appendChild(document.createTextNode(parts[i]));
            }
            // Add the page break symbol at the end of the paragraph
            currentParagraph.appendChild(document.createTextNode(pageBreakSymbol));
            // Save current paragraph and start a new one
            if (currentParagraph.childNodes.length > 0) {
              paragraphs.push(currentParagraph);
            }
            currentParagraph = document.createDocumentFragment();
          }
          
          // Add the last part to the current paragraph (without symbol)
          if (parts[parts.length - 1]) {
            currentParagraph.appendChild(document.createTextNode(parts[parts.length - 1]));
          }
        } else {
          // No page break symbol, add text to current paragraph
          currentParagraph.appendChild(textNode.cloneNode(true));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        // Skip <br> tags - they should have been removed already, but skip just in case
        if (element.tagName === 'BR') {
          return;
        }
        
        // Check if element's text content contains the page break symbol
        const textContent = element.textContent || '';
        if (textContent.includes(pageBreakSymbol)) {
          // Need to split this element - process its children
          Array.from(element.childNodes).forEach(child => splitByPageBreak(child));
        } else {
          // No page break, add element to current paragraph
          currentParagraph.appendChild(element.cloneNode(true));
        }
      } else {
        // Other node types, just clone and add
        currentParagraph.appendChild(node.cloneNode(true));
      }
    };

    // Process all direct children of root
    Array.from(root.childNodes).forEach(child => splitByPageBreak(child));
    
    // Add the last paragraph if it has content
    if (currentParagraph.childNodes.length > 0) {
      paragraphs.push(currentParagraph);
    }

    // If no paragraphs were created (no page breaks and no content), return
    if (paragraphs.length === 0) {
      return 0;
    }

    // Step 3: Clear root and wrap each paragraph in a div
    root.innerHTML = '';
    
    paragraphs.forEach(paragraph => {
      // Skip empty paragraphs
      if (paragraph.childNodes.length === 0) {
        return;
      }
      
      const wrapperDiv = document.createElement('div');
      wrapperDiv.appendChild(paragraph);
      root.appendChild(wrapperDiv);
    });

    // Step 4: Check each div and split if it exceeds 1 line
    // Collect all divs and process them
    let divsToProcess = Array.from(root.children).filter(el => el.tagName === 'DIV') as HTMLElement[];
    let totalSplits = 0;
    
    // Process each div - if it splits, the new divs will be added to root
    divsToProcess.forEach(div => {
      const splitResult = this.splitDivByLines(div);
      if (splitResult.length > 1) {
        totalSplits += splitResult.length - 1;
      }
    });

    return paragraphs.length + totalSplits;
  }

  /**
   * Static method to split all multi-line divs in an editor element.
   * This can be called without a WordHandler instance.
   * 
   * @param editorRoot - The editor root element
   * @returns The number of divs that were split
   */
  public static splitAllMultiLineDivsStatic(editorRoot: HTMLElement): number {
    // Create a temporary handler instance just to use the methods
    // We'll use a dummy formatting state
    const dummyState = { set: () => {}, subscribe: () => () => {} } as any;
    const handler = new WordHandler(dummyState);
    return handler.splitAllMultiLineDivs(editorRoot);
  }
}

