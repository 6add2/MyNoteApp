import type { ModeCallbacks, ModeInputResult } from './types';
import type { Frame } from '../../shared-types';

/**
 * PPTHandler
 * Handles PPT mode editor operations including frame management, creation, and editing
 */
export class PPTHandler {
  // Frame management
  private frames: Frame[] = [];
  private selectedFrameId: string | null = null;
  private selectedTool: 'text' | 'image' | 'shape' | null = null;

  // Direct sync callback (called by PPTHandler to sync frames)
  private syncCallback?: (frames: Frame[]) => void;

  // Container reference
  private container: HTMLElement | null = null;
  private baseWidth: number | null = null;
  private baseHeight: number | null = null;

  // Callbacks for content change notifications
  private callbacks?: ModeCallbacks;

  /**
   * Set sync callback for direct syncing
   */
  public setSyncCallback(callback: (frames: Frame[]) => void): void {
    this.syncCallback = callback;
  }

  /**
   * Set selected tool (text, image, shape, or null)
   */
  public setSelectedTool(tool: 'text' | 'image' | 'shape' | null): void {
    this.selectedTool = tool;
  }

  /**
   * Setup PPT container and attach event listeners
   */
  public setupCanvas(
    container: HTMLElement,
    callbacks?: ModeCallbacks,
    syncCallback?: (frames: Frame[]) => void
  ): void {
    this.container = container;
    this.callbacks = callbacks;
    this.syncCallback = syncCallback;
    // Record base size once for relative scaling
    if (!this.baseWidth || !this.baseHeight) {
      this.baseWidth = container.offsetWidth || 1280;
      this.baseHeight = container.offsetHeight || 720;
    }
    this.attachEventListeners();
    this.redrawFrames(this.frames);
  }

  /**
   * Get scaling factors based on current container size and stored base size.
   */
  private getScale(frame?: Frame): { scaleX: number; scaleY: number; baseWidth: number; baseHeight: number } {
    const containerWidth = this.container?.offsetWidth || 1;
    const containerHeight = this.container?.offsetHeight || 1;
    const baseWidth = frame?.baseWidth || this.baseWidth || containerWidth;
    const baseHeight = frame?.baseHeight || this.baseHeight || containerHeight;
    return {
      scaleX: containerWidth / baseWidth,
      scaleY: containerHeight / baseHeight,
      baseWidth,
      baseHeight,
    };
  }

  /**
   * Attach event listeners to container
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Click on canvas to deselect frames when clicking outside, or create frame if tool is selected
    // Use capture phase to catch clicks before frame handlers stop propagation
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Check if click is directly on container or on something that's not inside a frame
      const clickedFrame = target.closest('[data-frame-id]');
      const isClickOnContainer = target === this.container || (this.container.contains(target) && !clickedFrame);
      
      // If a tool is selected and clicking on blank area, create frame at click position
      if (this.selectedTool && !clickedFrame && isClickOnContainer) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get click position relative to container
        const rect = this.container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Convert to base coordinates
        const { scaleX, scaleY } = this.getScale();
        const baseX = clickX / scaleX;
        const baseY = clickY / scaleY;
        
        // Create frame at click position
        this.createFrame(this.selectedTool, { x: baseX, y: baseY });
        
        // Clear tool selection after creating frame
        this.selectedTool = null;
        return;
      }
      
      // Only deselect if clicking directly on container (not on a frame or its children)
      if (isClickOnContainer && this.selectedFrameId) {
        // Clicked directly on container - deselect any selected frame
        this.selectFrame(null);
      } else if (!clickedFrame && this.selectedFrameId) {
        // Clicked on something that's not a frame (but might be inside container)
        // Check if it's actually outside by verifying it's not a child of container that contains frames
        const isInsideContainer = this.container.contains(target);
        if (isInsideContainer) {
          // It's inside container but not a frame - deselect
          this.selectFrame(null);
        }
      }
    }, true); // Capture phase - fires before frame handlers
    
    // Also add a document-level click handler as fallback for clicks outside container
    this.documentClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only handle if clicking outside the container
      if (this.container && !this.container.contains(target) && this.selectedFrameId) {
        this.selectFrame(null);
      }
    };
    document.addEventListener('click', this.documentClickHandler, true); // Capture phase

    // Delete key to delete selected frame
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedFrameId) {
        this.deleteFrame(this.selectedFrameId);
      }
    });
  }

  /**
   * Handle editor input events (frame interactions)
   * Note: For PPT mode, events are handled by setupCanvas listeners.
   * This method returns current frames for syncing.
   */
  public handleInput(_event: Event, _callbacks?: ModeCallbacks): ModeInputResult {
    // Frame interactions are handled by setupCanvas listeners
    // Sync happens via callbacks in frame operations
    return { content: this.frames, mode: 'ppt', isApplyingRemoteUpdate: false };
  }

  /**
   * Handle keyboard shortcuts for PPT mode
   */
  public handleKeyDown(event: KeyboardEvent, callbacks?: ModeCallbacks): void {
    const { onSave } = callbacks || {};

    // Save shortcut
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // Delete key (handled in attachEventListeners)
    // Arrow keys for frame navigation could be added here
  }

  /**
   * Undo last action
   */
  public undo(): void {
    // TODO: Implement undo for PPT mode (frame operations)
    // Would need to maintain undo/redo stack similar to HandwriteHandler
  }

  /**
   * Redo last undone action
   */
  public redo(): void {
    // TODO: Implement redo for PPT mode (frame operations)
  }

  /**
   * Get current PPT state
   */
  public getState(): { frames: Frame[]; selectedFrameId: string | null } {
    return {
      frames: [...this.frames],
      selectedFrameId: this.selectedFrameId,
    };
  }

  // ========== PPT-specific methods ==========

  /**
   * Create a new frame
   */
  public createFrame(type: Frame['type'], position: { x: number; y: number }): void {
    const containerWidth = this.container?.offsetWidth || this.baseWidth || 1280;
    const containerHeight = this.container?.offsetHeight || this.baseHeight || 720;
    this.baseWidth = this.baseWidth || containerWidth;
    this.baseHeight = this.baseHeight || containerHeight;

    const newFrame: Frame = {
      id: crypto.randomUUID(),
      type,
      x: position.x,
      y: position.y,
      width: 200,
      height: 150,
      zIndex: this.frames.length,
      baseWidth: this.baseWidth,
      baseHeight: this.baseHeight,
      locked: false,
      createdAt: new Date().toISOString(),
      ...(type === 'text' && { content: '' }),
      ...(type === 'image' && { url: '' }),
    };

    this.frames.push(newFrame);
    this.selectedFrameId = newFrame.id;

    // Sync to Yjs
    if (this.syncCallback) {
      this.syncCallback(this.frames);
    }

    this.callbacks?.onUnsavedChange?.();
    this.redrawFrames(this.frames);
    
    // If it's a text frame, focus the textArea after rendering
    if (type === 'text') {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const frameElement = this.container?.querySelector(`[data-frame-id="${newFrame.id}"]`) as HTMLElement;
        if (frameElement) {
          const textArea = frameElement.querySelector('textarea') as HTMLTextAreaElement;
          if (textArea) {
            textArea.focus();
            // Place cursor at the beginning using setSelectionRange for textarea
            textArea.setSelectionRange(0, 0);
          }
        }
      }, 0);
    }
  }

  /**
   * Update frame properties
   */
  public updateFrame(id: string, updates: Partial<Frame>, skipRedraw: boolean = false): void {
    const frameIndex = this.frames.findIndex(f => f.id === id);
    if (frameIndex === -1) return;

    this.frames[frameIndex] = { ...this.frames[frameIndex], ...updates };

    // Sync to Yjs
    if (this.syncCallback) {
      this.syncCallback(this.frames);
    }

    this.callbacks?.onUnsavedChange?.();
    
    if (!skipRedraw) {
      this.redrawFrames(this.frames);
    }
  }
  
  /**
   * Update frame element position directly (for smooth dragging)
   * Constrains the frame within container boundaries
   */
  private updateFrameElementPosition(frameElement: HTMLElement, x: number, y: number, frame?: Frame): void {
    const { scaleX, scaleY, baseWidth, baseHeight } = this.getScale(frame);

    // Calculate boundaries using base dimensions
    const frameWidth = frame?.width ?? (frameElement.offsetWidth / scaleX) ?? 200;
    const frameHeight = frame?.height ?? (frameElement.offsetHeight / scaleY) ?? 150;
    const minX = 0;
    const minY = 0;
    const maxX = Math.max(0, baseWidth - frameWidth);
    const maxY = Math.max(0, baseHeight - frameHeight);

    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));

    frameElement.style.left = `${clampedX * scaleX}px`;
    frameElement.style.top = `${clampedY * scaleY}px`;
  }

  /**
   * Delete a frame
   */
  public deleteFrame(id: string): void {
    this.frames = this.frames.filter(f => f.id !== id);
    if (this.selectedFrameId === id) {
      this.selectedFrameId = null;
    }

    // Sync to Yjs
    if (this.syncCallback) {
      this.syncCallback(this.frames);
    }

    this.callbacks?.onUnsavedChange?.();
    this.redrawFrames(this.frames);
  }

  /**
   * Select a frame
   */
  public selectFrame(id: string | null): void {
    // Only redraw if selection actually changed
    if (this.selectedFrameId === id) {
      return; // No change, skip redraw
    }
    
    const oldSelectedId = this.selectedFrameId;
    this.selectedFrameId = id;
    
    // Update border styles without full redraw to preserve focus
    if (oldSelectedId) {
      const oldFrameElement = this.container?.querySelector(`[data-frame-id="${oldSelectedId}"]`) as HTMLElement;
      if (oldFrameElement) {
        oldFrameElement.style.border = 'none'; // Remove border when not selected
        // Reset drag handle background
        const dragHandle = oldFrameElement.querySelector('.ppt-drag-handle') as HTMLElement;
        if (dragHandle) {
          dragHandle.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          dragHandle.style.opacity = '0';
        }
        const resizeHandle = oldFrameElement.querySelector('.ppt-resize-handle') as HTMLElement;
        if (resizeHandle) {
          resizeHandle.style.opacity = '0';
        }
        // For text frames, make background transparent when not active
        const frame = this.frames.find(f => f.id === oldSelectedId);
        if (frame && frame.type === 'text') {
          oldFrameElement.style.backgroundColor = 'transparent';
        }
      }
    }
    
    if (id) {
      const newFrameElement = this.container?.querySelector(`[data-frame-id="${id}"]`) as HTMLElement;
      if (newFrameElement) {
        newFrameElement.style.border = '2px solid #3b82f6'; // Blue border when selected
        // Update drag handle background if it exists
        const dragHandle = newFrameElement.querySelector('.ppt-drag-handle') as HTMLElement;
        if (dragHandle) {
          dragHandle.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          dragHandle.style.opacity = '1';
        }
        const resizeHandle = newFrameElement.querySelector('.ppt-resize-handle') as HTMLElement;
        if (resizeHandle) {
          resizeHandle.style.opacity = '1';
        }
        const frame = this.frames.find(f => f.id === id);
        if (frame && frame.type === 'text') {
          // 70% transparent dark background when active
          newFrameElement.style.backgroundColor = 'rgba(26, 26, 26, 0.3)';
        }
      } else {
        // Frame element doesn't exist yet, need to redraw
        this.redrawFrames(this.frames);
      }
    } else {
      // No frame selected, remove border from all frames
      const allFrames = this.container?.querySelectorAll('[data-frame-id]') as NodeListOf<HTMLElement>;
      allFrames?.forEach(frameEl => {
        frameEl.style.border = 'none';
        const dragHandle = frameEl.querySelector('.ppt-drag-handle') as HTMLElement;
        if (dragHandle) {
          dragHandle.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }
      });
    }
  }

  /**
   * Redraw all frames on container
   */
  public redrawFrames(frames: Frame[]): void {
    this.frames = frames;
    if (!this.container) return;
    if (!this.baseWidth || !this.baseHeight) {
      this.baseWidth = this.container.offsetWidth || 1280;
      this.baseHeight = this.container.offsetHeight || 720;
    }

    // Cleanup event listeners from old frames before clearing
    const oldFrames = this.container.querySelectorAll('.ppt-frame');
    oldFrames.forEach(frameEl => {
      const mousemoveHandler = (frameEl as any)._mousemoveHandler;
      const mouseupHandler = (frameEl as any)._mouseupHandler;
       const resizeMove = (frameEl as any)._resizeMouseMove;
       const resizeUp = (frameEl as any)._resizeMouseUp;
      if (mousemoveHandler) {
        document.removeEventListener('mousemove', mousemoveHandler);
      }
      if (mouseupHandler) {
        document.removeEventListener('mouseup', mouseupHandler);
      }
      if (resizeMove) {
        document.removeEventListener('mousemove', resizeMove);
      }
      if (resizeUp) {
        document.removeEventListener('mouseup', resizeUp);
      }
    });

    // Clear container
    this.container.innerHTML = '';

    // Render frames in zIndex order
    const sortedFrames = [...frames].sort((a, b) => a.zIndex - b.zIndex);
    sortedFrames.forEach(frame => {
      this.renderFrame(frame);
    });
  }

  /**
   * Render a single frame element
   */
  private renderFrame(frame: Frame): void {
    if (!this.container) return;

    // Backfill base dimensions on existing frames if missing
    if (!frame.baseWidth || !frame.baseHeight) {
      const containerWidth = this.container.offsetWidth || 1280;
      const containerHeight = this.container.offsetHeight || 720;
      frame.baseWidth = frame.baseWidth || this.baseWidth || containerWidth;
      frame.baseHeight = frame.baseHeight || this.baseHeight || containerHeight;
    }
    const { scaleX, scaleY, baseWidth, baseHeight } = this.getScale(frame);
    const scaledLeft = frame.x * scaleX;
    const scaledTop = frame.y * scaleY;
    const scaledWidth = frame.width * scaleX;
    const scaledHeight = frame.height * scaleY;
    const dragHandleHeight = 20 * scaleY;

    const frameElement = document.createElement('div');
    frameElement.className = 'ppt-frame';
    frameElement.dataset.frameId = frame.id;
    frameElement.style.position = 'absolute';
    frameElement.style.left = `${scaledLeft}px`;
    frameElement.style.top = `${scaledTop}px`;
    frameElement.style.width = `${scaledWidth}px`;
    frameElement.style.height = `${scaledHeight}px`;
    frameElement.style.fontSize = 'calc(14px * var(--page-scale, 1))';
    frameElement.style.zIndex = frame.zIndex.toString();
    // Only show border if frame is selected (focused)
    frameElement.style.border = frame.id === this.selectedFrameId ? '2px solid #3b82f6' : 'none';
    // Text frames: transparent when not focused/selected
    const isText = frame.type === 'text';
    const isActive = frame.id === this.selectedFrameId;
    frameElement.style.backgroundColor = isText
      ? (isActive ? 'rgba(26, 26, 26, 0.3)' : 'transparent') // 70% transparent dark background when active
      : '#f3f4f6';
    frameElement.style.padding = '8px';
    frameElement.style.boxSizing = 'border-box';
    frameElement.style.overflow = 'hidden';

    // Frame content based on type
    if (frame.type === 'text') {
      // Create a drag handle at the top of text frames
      const dragHandle = document.createElement('div');
      dragHandle.className = 'ppt-drag-handle';
      dragHandle.style.position = 'absolute';
      dragHandle.style.top = '0';
      dragHandle.style.left = '0';
      dragHandle.style.right = '0';
      dragHandle.style.height = `${dragHandleHeight}px`;
      dragHandle.style.backgroundColor = isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.05)';
      dragHandle.style.cursor = 'move';
      dragHandle.style.borderRadius = '4px 4px 0 0';
      dragHandle.style.display = 'flex';
      dragHandle.style.alignItems = 'center';
      dragHandle.style.justifyContent = 'center';
      dragHandle.style.zIndex = '10';
      dragHandle.style.opacity = isActive ? '1' : '0';
      dragHandle.style.transition = 'opacity 0.2s';
      
      // Text content area - using textarea for better cursor control
      const textArea = document.createElement('textarea');
      const initialContent = frame.content || '';
      textArea.value = initialContent; // Use value instead of innerText
      
      // Keep all layout styles unchanged (relative to page size)
      textArea.style.position = 'absolute';
      textArea.style.top = `${dragHandleHeight}px`; // dragHandleHeight already scaled by scaleY
      textArea.style.left = '0';
      textArea.style.right = '0';
      textArea.style.bottom = '0';
      textArea.style.cursor = 'text';
      textArea.style.userSelect = 'text';
      textArea.style.webkitUserSelect = 'text';
      textArea.style.mozUserSelect = 'text';
      textArea.style.msUserSelect = 'text';
      textArea.style.outline = 'none';
      textArea.style.padding = '8px'; // Keep same padding
      textArea.style.overflow = 'auto';
      textArea.style.whiteSpace = 'pre-wrap'; // Allow text wrapping
      textArea.style.wordWrap = 'break-word';
      textArea.style.color = '#000000'; // Default text color inside PPT text frame
      textArea.style.backgroundColor = 'transparent';
      
      // Font size inherits from frameElement, keeping relative to page size
      textArea.style.fontSize = 'inherit'; // frameElement has calc(14px * var(--page-scale, 1))
      
      // Line height: unitless value scales automatically with fontSize (same as word mode)
      textArea.style.lineHeight = '1.4'; // Unitless, scales with fontSize
      
      // Keep other styles
      textArea.style.pointerEvents = 'auto';
      textArea.style.zIndex = '90';
      textArea.style.border = '1px solid transparent';
      textArea.style.borderRadius = '2px';
      textArea.style.resize = 'none'; // Disable textarea's default resize handle
      textArea.style.fontFamily = 'inherit'; // Inherit font family
      
      // textarea is focusable by default, no need for tabindex
      textArea.setAttribute('role', 'textbox');
      textArea.setAttribute('aria-multiline', 'true');
      textArea.setAttribute('data-frame-id', frame.id);
      
      // Update content on input - use value for textarea
      textArea.addEventListener('input', (e) => {
        const content = (e.target as HTMLTextAreaElement).value || '';
        const frameIndex = this.frames.findIndex(f => f.id === frame.id);
        if (frameIndex !== -1) {
          this.frames[frameIndex] = { ...this.frames[frameIndex], content: content };
          // Sync to Yjs
          if (this.syncCallback) {
            this.syncCallback(this.frames);
          }
        }
      }, false);
      
      // Handle keyboard events - textarea natively supports all input, just stop propagation
      textArea.addEventListener('keydown', (e) => {
        e.stopPropagation();
      }, true); // Capture phase
      
      textArea.addEventListener('keydown', (e) => {
        e.stopPropagation();
      }, false); // Bubble phase
      
      // Focus text area on mousedown - textarea handles cursor positioning natively
      textArea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        textArea.focus();
      });
      
      // Handle mouseup to ensure focus is maintained
      textArea.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.selectFrame(frame.id);
        textArea.focus();
      });
      
      // Handle click to ensure focus
      textArea.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectFrame(frame.id);
        textArea.focus();
      });
      
      // Handle focus event to ensure frame is selected
      textArea.addEventListener('focus', () => {
        textArea.style.border = '1px solid #3b82f6';
        this.selectFrame(frame.id);
      });
      
      // Handle blur event - only blur if clicking outside the frame
      textArea.addEventListener('blur', (e) => {
        const relatedTarget = e.relatedTarget as Node;
        
        // Check if the blur is happening because of a click within the frame
        // If clicking on frame element or its children (except drag handle), prevent blur
        if (relatedTarget && frameElement.contains(relatedTarget) && relatedTarget !== dragHandle) {
          // Clicking within frame - prevent blur by refocusing
          setTimeout(() => {
            if (document.activeElement !== textArea) {
              textArea.focus();
            }
          }, 0);
          return; // Don't update border style
        }
        
        // Only update border if actually blurring (clicking outside)
        textArea.style.border = '1px solid transparent';
      });
      
      
      frameElement.appendChild(dragHandle);
      frameElement.appendChild(textArea);
      
      // Drag functionality for text frames (via drag handle)
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = frame.x;
      let initialY = frame.y;
      let currentX = frame.x;
      let currentY = frame.y;
      let scaleX = 1;
      let scaleY = 1;
      let baseWidth = this.baseWidth || this.container?.offsetWidth || 1280;
      let baseHeight = this.baseHeight || this.container?.offsetHeight || 720;
      
      dragHandle.addEventListener('mousedown', (e) => {
        if (frame.locked) return;
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const scale = this.getScale(frame);
        scaleX = scale.scaleX;
        scaleY = scale.scaleY;
        baseWidth = scale.baseWidth;
        baseHeight = scale.baseHeight;
        initialX = frame.x;
        initialY = frame.y;
        currentX = frame.x;
        currentY = frame.y;
        frameElement.style.cursor = 'grabbing';
        dragHandle.style.cursor = 'grabbing';
      });
      
      const mousemoveHandler = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = (e.clientX - startX) / scaleX;
        const deltaY = (e.clientY - startY) / scaleY;
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Constrain position within container boundaries
        const frameWidth = frame.width;
        const frameHeight = frame.height;
        
        const minX = 0;
        const minY = 0;
        const maxX = Math.max(0, baseWidth - frameWidth);
        const maxY = Math.max(0, baseHeight - frameHeight);
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        
        currentX = newX;
        currentY = newY;
        
        // Update position directly without redrawing (smooth dragging)
        this.updateFrameElementPosition(frameElement, currentX, currentY, frame);
      };
      
      const mouseupHandler = (e: MouseEvent) => {
        if (isDragging) {
          isDragging = false;
          frameElement.style.cursor = '';
          dragHandle.style.cursor = 'move';
          
          // Update frame data and sync (only once at end of drag)
          this.updateFrame(frame.id, {
            x: currentX,
            y: currentY,
          });
          
          // Prevent this event from affecting text area focus
          e.stopPropagation();
        }
      };
      
      document.addEventListener('mousemove', mousemoveHandler);
      document.addEventListener('mouseup', mouseupHandler);
      
      // Cleanup on frame removal
      (frameElement as any)._mousemoveHandler = mousemoveHandler;
      (frameElement as any)._mouseupHandler = mouseupHandler;

      // Resize handle (bottom-right) for text frames
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'ppt-resize-handle';
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.width = `${12 * scaleX}px`;
      resizeHandle.style.height = `${12 * scaleY}px`;
      resizeHandle.style.right = '2px';
      resizeHandle.style.bottom = '2px';
      resizeHandle.style.borderRadius = '3px';
      resizeHandle.style.background = 'rgba(148, 163, 184, 0.8)';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.zIndex = '200';
      resizeHandle.style.opacity = isActive ? '1' : '0';
      frameElement.appendChild(resizeHandle);

      let isResizing = false;
      let resizeStartX = 0;
      let resizeStartY = 0;
      let initialWidth = frame.width;
      let initialHeight = frame.height;

      const resizeMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        const deltaX = (e.clientX - resizeStartX) / scaleX;
        const deltaY = (e.clientY - resizeStartY) / scaleY;
        let newWidth = Math.max(80, initialWidth + deltaX);
        let newHeight = Math.max(60, initialHeight + deltaY);

        // Constrain within container
        const maxWidth = Math.max(40, baseWidth - frame.x);
        const maxHeight = Math.max(40, baseHeight - frame.y);
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        frameElement.style.width = `${newWidth * scaleX}px`;
        frameElement.style.height = `${newHeight * scaleY}px`;
      };

      const resizeMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        // Persist new size
        const { offsetWidth, offsetHeight } = frameElement;
        const newWidth = offsetWidth / scaleX;
        const newHeight = offsetHeight / scaleY;
        this.updateFrame(frame.id, { width: newWidth, height: newHeight });
      };

      resizeHandle.addEventListener('mousedown', (e) => {
        if (frame.locked) return;
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        initialWidth = frame.width;
        initialHeight = frame.height;
      });

      document.addEventListener('mousemove', resizeMouseMove);
      document.addEventListener('mouseup', resizeMouseUp);

      (frameElement as any)._resizeMouseMove = resizeMouseMove;
      (frameElement as any)._resizeMouseUp = resizeMouseUp;
      
      // Click to select (on frame, not text area or drag handle)
      frameElement.addEventListener('click', (e) => {
        if (e.target === dragHandle || e.target === textArea || textArea.contains(e.target as Node)) {
          return; // Let text area handle its own clicks
        }
        e.stopPropagation();
        this.selectFrame(frame.id);
      });
      
    } else {
      // Non-text frames: allow dragging from anywhere
      frameElement.style.cursor = 'move';
      frameElement.style.userSelect = 'none';
      
      if (frame.type === 'image' && frame.url) {
        const img = document.createElement('img');
        img.src = frame.url;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        frameElement.appendChild(img);
      } else {
        frameElement.textContent = frame.type;
      }
      
      // Click to select
      frameElement.addEventListener('click', (e) => {
        // Don't stop propagation - let container handler know a frame was clicked
        // But still select this frame
        this.selectFrame(frame.id);
      });
      
      // Drag functionality for non-text frames
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = frame.x;
      let initialY = frame.y;
      let currentX = frame.x;
      let currentY = frame.y;
      let scaleX = 1;
      let scaleY = 1;
      let baseWidth = this.baseWidth || this.container?.offsetWidth || 1280;
      let baseHeight = this.baseHeight || this.container?.offsetHeight || 720;

      frameElement.addEventListener('mousedown', (e) => {
        if (frame.locked) return;
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const scale = this.getScale(frame);
        scaleX = scale.scaleX;
        scaleY = scale.scaleY;
        baseWidth = scale.baseWidth;
        baseHeight = scale.baseHeight;
        initialX = frame.x;
        initialY = frame.y;
        currentX = frame.x;
        currentY = frame.y;
        frameElement.style.cursor = 'grabbing';
      });

      const mousemoveHandler = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = (e.clientX - startX) / scaleX;
        const deltaY = (e.clientY - startY) / scaleY;
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Constrain position within container boundaries
        const frameWidth = frame.width;
        const frameHeight = frame.height;
        
        const minX = 0;
        const minY = 0;
        const maxX = Math.max(0, baseWidth - frameWidth);
        const maxY = Math.max(0, baseHeight - frameHeight);
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        
        currentX = newX;
        currentY = newY;
        
        // Update position directly without redrawing (smooth dragging)
        this.updateFrameElementPosition(frameElement, currentX, currentY, frame);
      };

      const mouseupHandler = () => {
        if (isDragging) {
          isDragging = false;
          frameElement.style.cursor = 'move';
          
          // Update frame data and sync (only once at end of drag)
          this.updateFrame(frame.id, {
            x: currentX,
            y: currentY,
          });
        }
      };

      document.addEventListener('mousemove', mousemoveHandler);
      document.addEventListener('mouseup', mouseupHandler);
      
      // Cleanup on frame removal
      (frameElement as any)._mousemoveHandler = mousemoveHandler;
      (frameElement as any)._mouseupHandler = mouseupHandler;

      // Resize handle (bottom-right) for non-text frames
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'ppt-resize-handle';
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.width = `${12 * scaleX}px`;
      resizeHandle.style.height = `${12 * scaleY}px`;
      resizeHandle.style.right = '2px';
      resizeHandle.style.bottom = '2px';
      resizeHandle.style.borderRadius = '3px';
      resizeHandle.style.background = 'rgba(148, 163, 184, 0.8)';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.zIndex = '200';
      resizeHandle.style.opacity = isActive ? '1' : '0';
      frameElement.appendChild(resizeHandle);

      let isResizing = false;
      let resizeStartX = 0;
      let resizeStartY = 0;
      let initialWidth = frame.width;
      let initialHeight = frame.height;

      const resizeMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        const deltaX = (e.clientX - resizeStartX) / scaleX;
        const deltaY = (e.clientY - resizeStartY) / scaleY;
        let newWidth = Math.max(40, initialWidth + deltaX);
        let newHeight = Math.max(40, initialHeight + deltaY);

        // Constrain within container
        const maxWidth = Math.max(40, baseWidth - frame.x);
        const maxHeight = Math.max(40, baseHeight - frame.y);
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        frameElement.style.width = `${newWidth * scaleX}px`;
        frameElement.style.height = `${newHeight * scaleY}px`;
      };

      const resizeMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        const { offsetWidth, offsetHeight } = frameElement;
        const newWidth = offsetWidth / scaleX;
        const newHeight = offsetHeight / scaleY;
        this.updateFrame(frame.id, { width: newWidth, height: newHeight });
      };

      resizeHandle.addEventListener('mousedown', (e) => {
        if (frame.locked) return;
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        initialWidth = frame.width;
        initialHeight = frame.height;
      });

      document.addEventListener('mousemove', resizeMouseMove);
      document.addEventListener('mouseup', resizeMouseUp);

      (frameElement as any)._resizeMouseMove = resizeMouseMove;
      (frameElement as any)._resizeMouseUp = resizeMouseUp;
    }

    this.container.appendChild(frameElement);
  }

  /**
   * Reset handler state (called when switching notes)
   */
  public reset(): void {
    this.frames = [];
    this.selectedFrameId = null;
    this.callbacks = undefined;
    this.syncCallback = undefined;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Force re-render frames using current container size (e.g., after resize).
   */
  public refresh(): void {
    this.redrawFrames(this.frames);
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    // Remove event listeners if needed
    this.container = null;
  }
}
