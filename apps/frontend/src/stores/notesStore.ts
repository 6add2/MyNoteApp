import { writable, derived } from 'svelte/store';
import type { NoteMetadata } from '../shared-types';

const PAGE_SUFFIX_REGEX = / - Page (\d+)$/;

export function getBaseTitle(title: string): string {
  return title.replace(PAGE_SUFFIX_REGEX, '');
}

export function getPageNumber(title: string): number | null {
  const match = title.match(PAGE_SUFFIX_REGEX);
  return match ? Number(match[1]) : null;
}

export interface NotesState {
  notes: NoteMetadata[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'date' | 'name' | 'recent';
}

const initialState: NotesState = {
  notes: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'recent',
};

function createNotesStore() {
  const { subscribe, set, update } = writable<NotesState>(initialState);

  return {
    subscribe,
    
    // Set all notes
    set: (notes: NoteMetadata[]) => {
      update((state) => ({ ...state, notes, isLoading: false, error: null }));
    },
    
    // Update notes
    update: (updater: (notes: NoteMetadata[]) => NoteMetadata[]) => {
      update((state) => ({ ...state, notes: updater(state.notes) }));
    },
    
    // Add a note
    addNote: (note: NoteMetadata) => {
      update((state) => ({ ...state, notes: [note, ...state.notes] }));
    },
    
    // Remove a note (and all its pages)
    removeNote: (id: string) => {
      update((state) => {
        const target = state.notes.find((n) => n.id === id);
        if (!target) return state;

        const baseTitle = getBaseTitle(target.title);
        return {
          ...state,
          notes: state.notes.filter((n) => getBaseTitle(n.title) !== baseTitle),
        };
      });
    },
    
    // Update a single note
    updateNote: (id: string, updates: Partial<NoteMetadata>) => {
      update((state) => ({
        ...state,
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }));
    },
    
    // Set loading state
    setLoading: (isLoading: boolean) => {
      update((state) => ({ ...state, isLoading }));
    },
    
    // Set error
    setError: (error: string | null) => {
      update((state) => ({ ...state, error, isLoading: false }));
    },
    
    // Set search query
    setSearchQuery: (searchQuery: string) => {
      update((state) => ({ ...state, searchQuery }));
    },
    
    // Set sort order
    setSortBy: (sortBy: 'date' | 'name' | 'recent') => {
      update((state) => ({ ...state, sortBy }));
    },
    
    // Reset store
    reset: () => set(initialState),
  };
}

export const notesStore = createNotesStore();

// Derived stores for convenience
export const allNotes = derived(notesStore, ($store) => $store.notes);

export const filteredNotes = derived(notesStore, ($store) => {
  let notes = [...$store.notes];
  
  // Only show the first page of each note
  notes = notes.filter((n) => {
    const pageNumber = getPageNumber(n.title);
    return pageNumber === null || pageNumber === 1;
  });
  
  // Apply search filter
  if ($store.searchQuery) {
    const query = $store.searchQuery.toLowerCase();
    notes = notes.filter((n) => n.title.toLowerCase().includes(query));
  }
  
  // Apply sorting
  notes.sort((a, b) => {
    switch ($store.sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
  
  return notes;
});

export const ownedNotes = derived(filteredNotes, ($notes) =>
  $notes.filter((n) => !n.isPublic)
);

export const sharedNotes = derived(filteredNotes, ($notes) =>
  $notes.filter((n) => n.isPublic)
);

export const notesLoading = derived(notesStore, ($store) => $store.isLoading);
export const notesError = derived(notesStore, ($store) => $store.error);
