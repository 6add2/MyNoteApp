/**
 * Shared types for mode handlers and sync handlers
 */

/**
 * Callbacks for mode handler operations
 */
export interface ModeCallbacks {
  onContentChange?: (content: unknown) => void;
  onUnsavedChange?: () => void;
  onSave?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetHeading?: (level: 'p' | 'h1' | 'h2' | 'h3') => void;
  onInsertList?: (type: 'ul' | 'ol') => void;
  onCommandPalette?: () => void;
  onTriggerOCR?: () => void;
}

/**
 * Result from handling editor input
 */
export interface ModeInputResult {
  content: unknown; // Mode-specific content format (string for Word, Frame[] for PPT, Stroke[] for Handwrite)
  mode: 'word' | 'ppt' | 'handwrite';
  isApplyingRemoteUpdate: boolean;
}

/**
 * Callbacks for sync handler operations
 */
export interface SyncCallbacks {
  onContentChange?: (content: unknown) => void;
  onInitialContent?: (content: unknown) => void;
}

