import { SyncController } from '$lib/controllers/SyncController';
import { yDocManagerFactory } from '$lib/managers/YDocManager';
import type { PageState } from '../../stores/pagesStore';

/**
 * Upload PDF as page backgrounds, ensure pages exist, sync Yjs, persist backgrounds, and set aspect ratios.
 * getPages is used to access the latest page elements (for aspect-ratio adjustment) without coupling to component state.
 */
export async function applyPdfBackgrounds(
  rootNoteId: string,
  file: File,
  pagesStore: {
    addPage: (rootNoteId: string) => Promise<void>;
    setPages: (updater: (pages: PageState[]) => PageState[]) => void;
  },
  getPages: () => PageState[]
): Promise<void> {
  if (!rootNoteId) return;

  const result = await SyncController.uploadPdfBackgrounds(rootNoteId, file);
  if (!result || result.length === 0) return;

  const maxIndex = result.reduce((max, item) => Math.max(max, item.pageIndex), 0);
  const requiredPages = maxIndex + 1;

  // Ensure enough pages exist
  while (getPages().length < requiredPages) {
    await pagesStore.addPage(rootNoteId);
  }

  // Write backgroundUrl into corresponding PageState entries and save to backend
  const pageStructureManager = yDocManagerFactory.getPageStructureManager();
  pagesStore.setPages((currentPages: PageState[]) => {
    const copy = [...currentPages];
    for (const { pageIndex, url } of result) {
      if (!copy[pageIndex]) continue;
      copy[pageIndex] = { ...copy[pageIndex], backgroundUrl: url };

      // Sync background URL via Yjs for real-time collaboration
      pageStructureManager.setPageBackground(pageIndex, url);

      // Save backgroundUrl to each page's Note in the backend (fire and forget)
      const noteId = copy[pageIndex].note?.id || (pageIndex === 0 ? rootNoteId : null);
      if (noteId) {
        SyncController.saveNote(noteId, { backgroundUrl: url }).catch(() => {
          // Failed to save backgroundUrl
        });
      }
    }
    return copy;
  });

  // Adjust aspect ratio for each page container based on generated image size
  for (const { pageIndex, url } of result) {
    const img = new Image();
    img.onload = () => {
      const pageState = getPages()[pageIndex];
      const el = pageState?.pageElement;
      if (!el) return;

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (width > 0 && height > 0) {
        el.style.aspectRatio = `${width} / ${height}`;
      }
    };
    img.src = url;
  }
}
