import type { ModeCallbacks, ModeInputResult } from './types';
import type { Stroke } from '../../shared-types';
import { AIFacade } from '../services/AIFacade';

/**
 * HandwriteHandler
 * Handles Handwrite mode editor operations including canvas drawing, stroke capture, and OCR
 */
export class HandwriteHandler {
  // Canvas references
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private baseWidth: number | null = null;
  private baseHeight: number | null = null;

  // Stroke management
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing: boolean = false;

  // Pen settings
  private penColor: string = '#6ee7b7';
  private penSize: number = 3;
  private isEraser: boolean = false;
  private eraserChanged: boolean = false;

  // Undo/Redo stacks
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];

  // Event handlers (stored for cleanup)
  private eventHandlers: {
    mousedown?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
    mouseup?: (e: MouseEvent) => void;
    mouseleave?: (e: MouseEvent) => void;
    touchstart?: (e: TouchEvent) => void;
    touchmove?: (e: TouchEvent) => void;
    touchend?: (e: TouchEvent) => void;
    resize?: () => void;
    fullscreen?: () => void;
  } = {};
  private resizeObserver: ResizeObserver | null = null;

  // Callbacks for content change notifications
  private callbacks?: ModeCallbacks;
  
  // Direct sync callback (called by HandwriteHandler to sync strokes)
  private syncCallback?: (strokes: Stroke[]) => void;

  /**
   * Setup canvas and attach event listeners
   */
  public setupCanvas(
    canvas: HTMLCanvasElement, 
    callbacks?: ModeCallbacks,
    syncCallback?: (strokes: Stroke[]) => void
  ): void {
    // Cleanup previous setup if any
    this.cleanup();
    
    this.callbacks = callbacks;
    this.syncCallback = syncCallback;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: false });
    
    if (!this.ctx) {
      return;
    }

    // Set canvas size (with retry if dimensions not ready)
    this.resizeCanvas();
    
    // Retry resize if canvas has no dimensions
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    }

    // Attach event listeners
    this.attachEventListeners();

    // Handle window resize
    this.eventHandlers.resize = () => this.resizeCanvas();
    window.addEventListener('resize', this.eventHandlers.resize);
    // Handle fullscreen toggle (browser fullscreenchange doesn't always fire resize immediately)
    this.eventHandlers.fullscreen = () => {
      // Try immediate resize to minimize perceived delay
      this.refresh();
      // Also schedule after layout tick and shortly after to catch late size changes
      requestAnimationFrame(() => {
        this.refresh();
        setTimeout(() => this.refresh(), 16);
      });
    };
    document.addEventListener('fullscreenchange', this.eventHandlers.fullscreen);
    // Observe container size changes (covers fullscreen transitions/layout changes)
    if (this.canvas?.parentElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
      this.resizeObserver.observe(this.canvas.parentElement);
      // Also observe canvas itself to catch immediate DOM size changes
      this.resizeObserver.observe(this.canvas);
    }

    // Clear canvas initially (but don't clear existing strokes if loading from Yjs)
    if (this.strokes.length === 0) {
      this.clearCanvas();
    } else {
      // Redraw existing strokes
      this.redrawCanvas(this.strokes);
    }
  }

  /**
   * Resize canvas to match container
   */
  private resizeCanvas(): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let width: number;
    let height: number;

    const container = this.canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width || container.offsetWidth || this.canvas.offsetWidth || 800;
      height = rect.height || container.offsetHeight || this.canvas.offsetHeight || 600;
    } else {
      // Fallback: use canvas's own dimensions
      width = this.canvas.offsetWidth || 800;
      height = this.canvas.offsetHeight || 600;
    }

    // Ensure minimum dimensions
    if (width <= 0) width = 800;
    if (height <= 0) height = 600;

    // Record base size only once (used for relative scaling)
    if (!this.baseWidth || !this.baseHeight) {
      this.baseWidth = width;
      this.baseHeight = height;
    }

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any previous scaling
      this.ctx.scale(dpr, dpr);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    // Redraw existing strokes after resize
    if (this.strokes.length > 0) {
      this.redrawCanvas(this.strokes);
    }
  }

  /**
   * Attach event listeners to canvas
   */
  private attachEventListeners(): void {
    if (!this.canvas) return;

    // Mouse events
    this.eventHandlers.mousedown = (e: MouseEvent) => this.handleMouseDown(e);
    this.eventHandlers.mousemove = (e: MouseEvent) => this.handleMouseMove(e);
    this.eventHandlers.mouseup = (e: MouseEvent) => this.handleMouseUp(e);
    this.eventHandlers.mouseleave = (e: MouseEvent) => this.handleMouseLeave(e);

    // Touch events
    this.eventHandlers.touchstart = (e: TouchEvent) => this.handleTouchStart(e);
    this.eventHandlers.touchmove = (e: TouchEvent) => this.handleTouchMove(e);
    this.eventHandlers.touchend = (e: TouchEvent) => this.handleTouchEnd(e);

    this.canvas.addEventListener('mousedown', this.eventHandlers.mousedown);
    this.canvas.addEventListener('mousemove', this.eventHandlers.mousemove);
    this.canvas.addEventListener('mouseup', this.eventHandlers.mouseup);
    this.canvas.addEventListener('mouseleave', this.eventHandlers.mouseleave);
    this.canvas.addEventListener('touchstart', this.eventHandlers.touchstart, { passive: false });
    this.canvas.addEventListener('touchmove', this.eventHandlers.touchmove, { passive: false });
    this.canvas.addEventListener('touchend', this.eventHandlers.touchend);
  }

  /**
   * Remove event listeners (cleanup)
   */
  public cleanup(): void {
    if (this.canvas) {
      if (this.eventHandlers.mousedown) this.canvas.removeEventListener('mousedown', this.eventHandlers.mousedown);
      if (this.eventHandlers.mousemove) this.canvas.removeEventListener('mousemove', this.eventHandlers.mousemove);
      if (this.eventHandlers.mouseup) this.canvas.removeEventListener('mouseup', this.eventHandlers.mouseup);
      if (this.eventHandlers.mouseleave) this.canvas.removeEventListener('mouseleave', this.eventHandlers.mouseleave);
      if (this.eventHandlers.touchstart) this.canvas.removeEventListener('touchstart', this.eventHandlers.touchstart);
      if (this.eventHandlers.touchmove) this.canvas.removeEventListener('touchmove', this.eventHandlers.touchmove);
      if (this.eventHandlers.touchend) this.canvas.removeEventListener('touchend', this.eventHandlers.touchend);
    }

    if (this.eventHandlers.resize) {
      window.removeEventListener('resize', this.eventHandlers.resize);
    }
    if (this.eventHandlers.fullscreen) {
      document.removeEventListener('fullscreenchange', this.eventHandlers.fullscreen);
    }
    if (this.resizeObserver && this.canvas?.parentElement) {
      this.resizeObserver.unobserve(this.canvas.parentElement);
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = null;
  }

  /**
   * Refresh canvas sizing and redraw strokes (e.g., when outer layout scale changes).
   */
  public refresh(): void {
    this.resizeCanvas();
    if (this.strokes.length > 0) {
      this.redrawCanvas(this.strokes);
    }
  }

  /**
   * Get event coordinates relative to canvas
   */
  private getEventCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    const canvasWidth = rect.width || this.canvas.clientWidth || this.canvas.width;
    const canvasHeight = rect.height || this.canvas.clientHeight || this.canvas.height;
    const baseWidth = this.baseWidth || canvasWidth || 1;
    const baseHeight = this.baseHeight || canvasHeight || 1;
    const scaleX = canvasWidth / baseWidth;
    const scaleY = canvasHeight / baseHeight;
    
    if (event instanceof MouseEvent) {
      return {
        x: (event.clientX - rect.left) / scaleX,
        y: (event.clientY - rect.top) / scaleY,
      };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) / scaleX,
        y: (touch.clientY - rect.top) / scaleY,
      };
    }
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    const coords = this.getEventCoordinates(e);
    this.startStroke(coords.x, coords.y);
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    const coords = this.getEventCoordinates(e);
    this.addPointToStroke(coords.x, coords.y);
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(e: MouseEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    this.endStroke();
  }

  /**
   * Handle mouse leave (end stroke if drawing)
   */
  private handleMouseLeave(e: MouseEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    this.endStroke();
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const coords = this.getEventCoordinates(e);
    this.startStroke(coords.x, coords.y);
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    const coords = this.getEventCoordinates(e);
    const touch = e.touches[0];
    const pressure = (touch as any).force || 1.0;
    this.addPointToStroke(coords.x, coords.y, pressure);
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    this.endStroke();
  }

  /**
   * Start a new stroke
   */
  private startStroke(x: number, y: number): void {
    if (!this.ctx) return;

    if (this.isEraser) {
      // Eraser removes existing strokes instead of drawing
      this.isDrawing = true;
      this.currentStroke = null;
      this.eraserChanged = false;
      this.eraseAt(x, y);
      return;
    }

    const color = this.penColor;
    const width = this.penSize; // store as base (page-relative) units
    const canvasWidth = this.canvas?.getBoundingClientRect().width || this.canvas?.width || 1;
    const canvasHeight = this.canvas?.getBoundingClientRect().height || this.canvas?.height || 1;
    const baseWidth = this.baseWidth || canvasWidth;
    const baseHeight = this.baseHeight || canvasHeight;
    const scaleX = canvasWidth / baseWidth;
    const scaleY = canvasHeight / baseHeight;

    this.currentStroke = {
      id: crypto.randomUUID(),
      points: [{
        x,
        y,
        pressure: 1.0,
        color,
        width, // base unit width
        timestamp: Date.now(),
      }],
      color,
      width,
      baseWidth,
      baseHeight,
    };

    this.isDrawing = true;

    // Begin drawing path
    this.ctx.beginPath();
    this.ctx.moveTo(x * scaleX, y * scaleY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width * scaleX;
  }

  /**
   * Add point to current stroke
   */
  private addPointToStroke(x: number, y: number, pressure: number = 1.0): void {
    if (!this.ctx) return;

    if (this.isEraser) {
      this.eraseAt(x, y);
      return;
    }

    if (!this.currentStroke) return;

    const color = this.penColor;
    const width = this.penSize; // base units

    const canvasWidth = this.canvas?.getBoundingClientRect().width || this.canvas?.width || 1;
    const canvasHeight = this.canvas?.getBoundingClientRect().height || this.canvas?.height || 1;
    const strokeBaseWidth = this.currentStroke.baseWidth || this.baseWidth || canvasWidth;
    const strokeBaseHeight = this.currentStroke.baseHeight || this.baseHeight || canvasHeight;
    const scaleX = canvasWidth / strokeBaseWidth;
    const scaleY = canvasHeight / strokeBaseHeight;

    // Add point to stroke
    this.currentStroke.points.push({
      x,
      y,
      pressure,
      color,
      width,
      timestamp: Date.now(),
    });

    // Draw line segment from previous point to new point
    // The path is already started in startStroke, so we just continue it
    this.ctx.lineTo(x * scaleX, y * scaleY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width * scaleX;
    this.ctx.stroke();
  }

  /**
   * End current stroke
   */
  private endStroke(): void {
    if (this.isEraser) {
      this.currentStroke = null;
      this.isDrawing = false;

      if (this.eraserChanged) {
        this.undoStack.push([...this.strokes]);
        this.redoStack = [];
        this.syncCallback?.(this.strokes);
        this.callbacks?.onUnsavedChange?.();
      }
      return;
    }

    if (!this.currentStroke) return;

    // Finalize stroke
    this.strokes.push(this.currentStroke);

    // Push to undo stack
    this.undoStack.push([...this.strokes]);
    this.redoStack = []; // Clear redo stack

    this.currentStroke = null;
    this.isDrawing = false;

    // Direct sync call - no need for callbacks chain
    if (this.syncCallback) {
      this.syncCallback(this.strokes);
    }
    
    // Still notify for UI updates (unsaved changes indicator)
    this.callbacks?.onUnsavedChange?.();
  }

  /**
   * Handle editor input events (canvas strokes)
   * Note: For handwrite mode, events are handled by setupCanvas listeners.
   * This method returns current strokes for syncing.
   */
  public handleInput(_event: Event, _callbacks?: ModeCallbacks): ModeInputResult {
    // Return current strokes (sync happens via callbacks in endStroke)
    return { content: this.strokes, mode: 'handwrite', isApplyingRemoteUpdate: false };
  }

  /**
   * Handle keyboard shortcuts for Handwrite mode
   */
  public handleKeyDown(event: KeyboardEvent, callbacks?: ModeCallbacks): void {
    const { onSave, onTriggerOCR } = callbacks || {};

    // Save shortcut
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // Undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Redo
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      this.redo();
      return;
    }

    // OCR trigger shortcut
    if (event.key === 'o' || event.key === 'O') {
      onTriggerOCR?.();
      return;
    }
  }

  /**
   * Undo last action
   */
  public undo(): void {
    if (this.undoStack.length === 0) return;

    // Push current state to redo stack
    this.redoStack.push([...this.strokes]);

    // Pop from undo stack
    this.strokes = this.undoStack.pop() || [];
    this.redrawCanvas(this.strokes);
  }

  /**
   * Redo last undone action
   */
  public redo(): void {
    if (this.redoStack.length === 0) return;

    // Push current state to undo stack
    this.undoStack.push([...this.strokes]);

    // Pop from redo stack
    this.strokes = this.redoStack.pop() || [];
    this.redrawCanvas(this.strokes);
  }

  /**
   * Get current Handwrite state
   */
  public getState(): { strokes: Stroke[]; penColor: string; penSize: number; isEraser: boolean } {
    return {
      strokes: [...this.strokes],
      penColor: this.penColor,
      penSize: this.penSize,
      isEraser: this.isEraser,
    };
  }

  // ========== Handwrite-specific methods ==========

  /**
   * Set pen color
   */
  public setPenColor(color: string): void {
    this.penColor = color;
  }

  /**
   * Set pen size
   */
  public setPenSize(size: number): void {
    this.penSize = size;
  }

  /**
   * Set eraser mode
   */
  public setEraserMode(isEraser: boolean): void {
    this.isEraser = isEraser;
  }

  /**
   * Erase strokes intersecting with the given coordinate.
   */
  private eraseAt(x: number, y: number): void {
    const canvasWidth = this.canvas?.getBoundingClientRect().width || this.canvas?.width || 1;
    const canvasHeight = this.canvas?.getBoundingClientRect().height || this.canvas?.height || 1;
    const baseWidth = this.baseWidth || canvasWidth;
    const baseHeight = this.baseHeight || canvasHeight;
    const scaleX = canvasWidth / baseWidth;
    const scaleY = canvasHeight / baseHeight;
    const normalizedX = x / scaleX;
    const normalizedY = y / scaleY;
    // Radius should scale with page shrink -> multiply by scale
    const radius = (this.penSize * 2) * Math.max(scaleX, scaleY);
    const radiusSq = radius * radius;
    const before = this.strokes.length;

    this.strokes = this.strokes.filter((stroke) =>
      !stroke.points.some((p) => {
        const dx = p.x - normalizedX;
        const dy = p.y - normalizedY;
        return dx * dx + dy * dy <= radiusSq;
      })
    );

    if (before !== this.strokes.length) {
      this.eraserChanged = true;
      this.redrawCanvas(this.strokes);
    }
  }

  /**
   * Clear the canvas
   */
  public clearCanvas(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.undoStack = [];
    this.redoStack = [];

    if (this.ctx && this.canvas) {
      const dpr = window.devicePixelRatio || 1;
      this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    }
  }

  /**
   * Reset handler state (called when switching notes)
   */
  public reset(): void {
    this.clearCanvas();
    this.callbacks = undefined;
    this.syncCallback = undefined;
  }

  /**
   * Draw a stroke on canvas
   */
  private drawStroke(stroke: Stroke, ctx: CanvasRenderingContext2D): void {
    if (stroke.points.length === 0) return;

    const canvasWidth = this.canvas?.getBoundingClientRect().width || this.canvas?.width || 1;
    const canvasHeight = this.canvas?.getBoundingClientRect().height || this.canvas?.height || 1;
    const baseWidth = stroke.baseWidth || this.baseWidth || canvasWidth;
    const baseHeight = stroke.baseHeight || this.baseHeight || canvasHeight;
    const scaleX = canvasWidth / baseWidth;
    const scaleY = canvasHeight / baseHeight;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const firstPoint = stroke.points[0];
    ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x * scaleX, point.y * scaleY);
    }

    ctx.stroke();
  }

  /**
   * Redraw canvas with strokes
   */
  public redrawCanvas(strokes: Stroke[]): void {
    if (!this.ctx || !this.canvas) return;

    // Update local strokes
    this.strokes = strokes;
    const canvasWidth = this.canvas.getBoundingClientRect().width || this.canvas.width;
    const canvasHeight = this.canvas.getBoundingClientRect().height || this.canvas.height;
    const defaultBaseWidth = this.baseWidth || canvasWidth;
    const defaultBaseHeight = this.baseHeight || canvasHeight;

    // Clear canvas
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    // Redraw all strokes
    strokes.forEach(stroke => {
      // Backfill base dimensions if missing so future resizes scale properly
      if (!stroke.baseWidth) stroke.baseWidth = defaultBaseWidth;
      if (!stroke.baseHeight) stroke.baseHeight = defaultBaseHeight;
      this.drawStroke(stroke, this.ctx!);
    });
  }

  /**
   * Add a stroke to the canvas (for remote updates)
   */
  public addStroke(stroke: Stroke): void {
    const canvasWidth = this.canvas?.getBoundingClientRect().width || this.canvas?.width || 1;
    const canvasHeight = this.canvas?.getBoundingClientRect().height || this.canvas?.height || 1;
    const defaultBaseWidth = this.baseWidth || canvasWidth;
    const defaultBaseHeight = this.baseHeight || canvasHeight;
    if (!stroke.baseWidth) stroke.baseWidth = defaultBaseWidth;
    if (!stroke.baseHeight) stroke.baseHeight = defaultBaseHeight;
    this.strokes.push(stroke);
    if (this.ctx) {
      this.drawStroke(stroke, this.ctx);
    }
  }

  /**
   * Trigger OCR conversion
   */
  public async triggerOCR(): Promise<string> {
    const aiFacade = new AIFacade();
    return await aiFacade.processOCR(this.strokes);
  }
}
