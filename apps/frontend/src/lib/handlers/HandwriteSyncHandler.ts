import type { SyncCallbacks } from './types';
import { YDocManager } from '../managers/YDocManager';
import type { Stroke } from '../../shared-types';
import * as Y from 'yjs';

/**
 * HandwriteSyncHandler
 * Handles Yjs synchronization for Handwrite mode (stroke data)
 */
export class HandwriteSyncHandler {
  constructor(private yDocManager: YDocManager) {}

  /**
   * Sync stroke data to Yjs yStrokes
   */
  public syncToYjs(content: unknown, isApplyingRemoteUpdate: boolean): void {
    if (isApplyingRemoteUpdate) {
      return;
    }

    const strokes = content as Stroke[];
    const { ydoc, yStrokes } = this.yDocManager.getYjsInstances();
    
    if (ydoc && yStrokes) {
      // Use transaction with origin to mark as local change
      ydoc.transact(() => {
        // Clear existing strokes
        yStrokes.delete(0, yStrokes.length);
        // Insert all strokes
        strokes.forEach(stroke => {
          yStrokes.push([stroke]);
        });
      }, 'local-handwrite-update');
    }
  }

  /**
   * Set up observer for remote Yjs changes and return unsubscribe function
   */
  public syncFromYjs(callbacks?: SyncCallbacks): { unsubscribe: () => void } {
    const { yStrokes } = this.yDocManager.getYjsInstances();
    let observer: (() => void) | null = null;

    // Initialize editor from Yjs if it already has content
    if (yStrokes && yStrokes.length > 0) {
      const initialStrokes = yStrokes.toArray() as Stroke[];
      callbacks?.onInitialContent?.(initialStrokes);
    }

    // Observe remote changes and reflect them in the editor
    if (yStrokes) {
      observer = (event: Y.YArrayEvent<Stroke>) => {
        if (!yStrokes) return;
        // Only process remote changes (not our own local updates)
        // Local updates have origin 'local-handwrite-update', remote updates have different origins (or null from WebSocket)
        const origin = event.transaction.origin;
        if (origin !== 'local-handwrite-update') {
          const strokes = yStrokes.toArray() as Stroke[];
          callbacks?.onContentChange?.(strokes);
        }
      };
      yStrokes.observe(observer);
    }

    // Return unsubscribe function
    const unsubscribe = () => {
      if (yStrokes && observer) {
        yStrokes.unobserve(observer);
      }
    };

    return { unsubscribe };
  }
}
