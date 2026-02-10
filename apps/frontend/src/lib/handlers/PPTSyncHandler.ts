import type { SyncCallbacks } from './types';
import { YDocManager } from '../managers/YDocManager';
import type { Frame } from '../../shared-types';
import * as Y from 'yjs';

/**
 * PPTSyncHandler
 * Handles Yjs synchronization for PPT mode (frame data)
 */
export class PPTSyncHandler {
  constructor(private yDocManager: YDocManager) {}

  /**
   * Sync frame data to Yjs yFrames
   */
  public syncToYjs(content: unknown, isApplyingRemoteUpdate: boolean): void {
    if (isApplyingRemoteUpdate) {
      return;
    }

    const frames = content as Frame[];
    const { ydoc, yFrames } = this.yDocManager.getYjsInstances();
    
    if (ydoc && yFrames) {
      // Use transaction with origin to mark as local change
      ydoc.transact(() => {
        // Clear existing frames
        yFrames.delete(0, yFrames.length);
        // Insert all frames
        frames.forEach(frame => {
          yFrames.push([frame]);
        });
      }, 'local-ppt-update');
    }
  }

  /**
   * Set up observer for remote Yjs changes and return unsubscribe function
   */
  public syncFromYjs(callbacks?: SyncCallbacks): { unsubscribe: () => void } {
    const { yFrames } = this.yDocManager.getYjsInstances();
    let observer: ((event: Y.YArrayEvent<Frame>) => void) | null = null;

    // Initialize editor from Yjs if it already has content
    if (yFrames && yFrames.length > 0) {
      const initialFrames = yFrames.toArray() as Frame[];
      callbacks?.onInitialContent?.(initialFrames);
    }

    // Observe remote changes and reflect them in the editor
    if (yFrames) {
      observer = (event: Y.YArrayEvent<Frame>) => {
        if (!yFrames) return;
        // Only process remote changes (not our own local updates)
        // Local updates have origin 'local-ppt-update', remote updates have different origins (or null from WebSocket)
        const origin = event.transaction.origin;
        if (origin !== 'local-ppt-update') {
          const frames = yFrames.toArray() as Frame[];
          callbacks?.onContentChange?.(frames);
        }
      };
      yFrames.observe(observer);
    }

    // Return unsubscribe function
    const unsubscribe = () => {
      if (yFrames && observer) {
        yFrames.unobserve(observer);
      }
    };

    return { unsubscribe };
  }
}
