import type { SyncCallbacks } from './types';
import { YDocManager } from '../managers/YDocManager';
import * as Y from 'yjs';

/**
 * WordSyncHandler
 * Handles Yjs synchronization for Word mode (HTML text content)
 */
export class WordSyncHandler {
  constructor(private yDocManager: YDocManager) {}

  /**
   * Sync HTML content to Yjs yRichText
   */
  public syncToYjs(content: unknown, isApplyingRemoteUpdate: boolean): void {
    if (isApplyingRemoteUpdate) {
      return;
    }

    const html = content as string;
    const { ydoc, yRichText, yWordState } = this.yDocManager.getYjsInstances();
    
    if (ydoc) {
      ydoc.transact(() => {
        if (yWordState) {
          yWordState.set('html', html);
        }
        if (yRichText) {
          yRichText.delete(0, yRichText.length);
          yRichText.insert(0, html);
        }
      });
    }
  }

  /**
   * Set up observer for remote Yjs changes and return unsubscribe function
   */
  public syncFromYjs(callbacks?: SyncCallbacks): { unsubscribe: () => void } {
    const { yRichText, yWordState, ydoc } = this.yDocManager.getYjsInstances();
    let observer: (() => void) | null = null;
    let mapObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
    let isUnsubscribed = false;

    // Store reference to the doc to validate in observer
    const docRef = ydoc;

    // Initialize editor from Yjs if it already has content
    const initialHtml =
      (yWordState && (yWordState.get('html') as string | undefined)) ||
      (yRichText && yRichText.toString()) ||
      '';
    if (initialHtml) {
      callbacks?.onInitialContent?.(initialHtml);
    }

    // Observe remote changes and reflect them in the editor
    if (yRichText) {
      observer = () => {
        // Validate that we're still observing the same doc
        // This prevents stale observers from firing after doc is destroyed/recreated
        const currentInstances = this.yDocManager.getYjsInstances();
        if (isUnsubscribed || !yRichText || !docRef || docRef !== currentInstances.ydoc) {
          return;
        }
        const content =
          (yWordState && (yWordState.get('html') as string | undefined)) ||
          yRichText.toString();
        callbacks?.onContentChange?.(content);
      };
      yRichText.observe(observer);
    }

    if (yWordState) {
      mapObserver = (event) => {
        const currentInstances = this.yDocManager.getYjsInstances();
        if (isUnsubscribed || !docRef || docRef !== currentInstances.ydoc) return;
        const content =
          (yWordState.get('html') as string | undefined) ||
          (yRichText ? yRichText.toString() : '');
        callbacks?.onContentChange?.(content);
      };
      yWordState.observe(mapObserver);
    }

    // Return unsubscribe function
    const unsubscribe = () => {
      isUnsubscribed = true;
      if (yRichText && observer) {
        yRichText.unobserve(observer);
        observer = null;
      }
      if (yWordState && mapObserver) {
        yWordState.unobserve(mapObserver);
        mapObserver = null;
      }
    };

    return { unsubscribe };
  }
}

