<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import { AuthController } from '$lib/controllers/AuthController';
  import { SyncController } from '$lib/controllers/SyncController';
  import { authStore, currentUser } from '../../stores/authStore';
  import { notesStore, ownedNotes, sharedNotes, filteredNotes } from '../../stores/notesStore';
  import type { NoteMetadata } from '../../shared-types';
  
  // Helper to get note ID (handles both _id from backend and id from frontend)
  function getNoteId(note: NoteMetadata & { _id?: string }): string {
    return note._id || note.id;
  }
  
  // State
  let sidebarCollapsed = false;
  let searchQuery = '';
  let sortBy: 'date' | 'name' | 'recent' = 'recent';
  let activeDropdown: 'workspace' | 'shared' | 'help' | null = null;
  let showNewNoteModal = false;
  let newNoteTitle = '';
  let isCreating = false;
  
  // Sync local state with store
  $: notesStore.setSearchQuery(searchQuery);
  $: notesStore.setSortBy(sortBy);
  
  onMount(async () => {
    const valid = await AuthController.validateSession();
    if (!valid) {
      // Important: clear persisted auth state so SignIn won't auto-redirect
      authStore.logout();
      push('/signin');
      return;
    }
    await SyncController.fetchNotes();
  });
  
  async function createNote() {
    if (!newNoteTitle.trim()) return;
    
    isCreating = true;
    try {
      const note = await SyncController.createNote(newNoteTitle.trim());
      if (note) {
        showNewNoteModal = false;
        newNoteTitle = '';
        push(`/edit/${note.id}`);
      }
    } catch (error) {
      // Failed to create note
    } finally {
      isCreating = false;
    }
  }
  
  async function deleteNote(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    await SyncController.deleteNote(id);
  }
  
  function openNote(id: string) {
    push(`/edit/${id}`);
  }
  
  async function handleLogout() {
    await AuthController.logout();
    push('/signin');
  }
  
  function toggleDropdown(dropdown: 'workspace' | 'shared' | 'help') {
    activeDropdown = activeDropdown === dropdown ? null : dropdown;
  }
  
  function formatDate(date: string | Date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  }
  
  // Use store's derived stores - they already handle filtering and sorting
  // ownedNotes and sharedNotes are imported from notesStore
</script>

<div class="workplace-container" class:sidebar-collapsed={sidebarCollapsed}>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#6ee7b7"/>
          <path d="M14 16h20v3H14v-3zm0 6h16v3H14v-3zm0 6h20v3H14v-3z" fill="#0f0f0f"/>
        </svg>
        {#if !sidebarCollapsed}
          <span class="logo-text">CollabNotes</span>
        {/if}
      </div>
      <button class="collapse-btn" on:click={() => sidebarCollapsed = !sidebarCollapsed}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          {#if sidebarCollapsed}
            <path d="M7 4l6 6-6 6"/>
          {:else}
            <path d="M13 4l-6 6 6 6"/>
          {/if}
        </svg>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <!-- Workspace Dropdown -->
      <div class="nav-section">
        <button 
          class="nav-dropdown-btn" 
          class:active={activeDropdown === 'workspace'}
          on:click={() => toggleDropdown('workspace')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4h12v2H4V4zm0 5h12v2H4V9zm0 5h12v2H4v-2z"/>
          </svg>
          {#if !sidebarCollapsed}
            <span>My Notes</span>
            <span class="badge">{$ownedNotes.length}</span>
          {/if}
        </button>
        {#if activeDropdown === 'workspace' && !sidebarCollapsed}
          <div class="dropdown-content">
            {#each $ownedNotes.slice(0, 5) as note}
              <button class="dropdown-item" on:click={() => openNote(getNoteId(note))}>
                {note.title || 'Untitled'}
              </button>
            {/each}
            {#if $ownedNotes.length === 0}
              <span class="dropdown-empty">No notes yet</span>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Shared Notes Dropdown -->
      <div class="nav-section">
        <button 
          class="nav-dropdown-btn"
          class:active={activeDropdown === 'shared'}
          on:click={() => toggleDropdown('shared')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a3 3 0 100 6 3 3 0 000-6zM4 8a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4zM10 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          {#if !sidebarCollapsed}
            <span>Shared</span>
            <span class="badge">{$sharedNotes.length}</span>
          {/if}
        </button>
        {#if activeDropdown === 'shared' && !sidebarCollapsed}
          <div class="dropdown-content">
            {#each $sharedNotes.slice(0, 5) as note}
              <button class="dropdown-item" on:click={() => openNote(getNoteId(note))}>
                {note.title || 'Untitled'}
              </button>
            {/each}
            {#if $sharedNotes.length === 0}
              <span class="dropdown-empty">No shared notes</span>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Help Dropdown -->
      <div class="nav-section">
        <button 
          class="nav-dropdown-btn"
          class:active={activeDropdown === 'help'}
          on:click={() => toggleDropdown('help')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5h2v2H9v-2zm0-1V7.5a2.5 2.5 0 013.5 2.29c0 1.06-.8 1.93-1.86 2.08L10.5 12H9v-.5z"/>
          </svg>
          {#if !sidebarCollapsed}
            <span>Help & Tutorial</span>
          {/if}
        </button>
        {#if activeDropdown === 'help' && !sidebarCollapsed}
          <div class="dropdown-content">
            <button class="dropdown-item">Getting Started</button>
            <button class="dropdown-item">Keyboard Shortcuts</button>
            <button class="dropdown-item">Documentation</button>
          </div>
        {/if}
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <!-- Create New Workspace Button -->
      <button class="new-workspace-btn" on:click={() => showNewNoteModal = true}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 4v12m-6-6h12"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>New Note</span>
        {/if}
      </button>
      
      <!-- Profile -->
      <div class="profile">
        <div class="avatar">
          {#if $currentUser?.avatarUrl}
            <img src={$currentUser.avatarUrl} alt="Avatar" />
          {:else}
            <span>{$currentUser?.name?.charAt(0) || '?'}</span>
          {/if}
        </div>
        {#if !sidebarCollapsed}
          <div class="profile-info">
            <span class="profile-name">{$currentUser?.name || 'User'}</span>
            <span class="profile-email">{$currentUser?.email || ''}</span>
          </div>
          <button class="logout-btn" on:click={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h8v2H5v10h6v2H3V3zm10 4l4 3-4 3V7zm-2 2v2h6V9h-6z"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </aside>
  
  <!-- Main Content -->
  <main class="main-content">
    <!-- Header -->
    <header class="content-header">
      <div class="header-left">
        <h1>My Workspace</h1>
        <p class="subtitle">{$filteredNotes.length} notes</p>
      </div>
      
      <div class="header-actions">
        <!-- Search -->
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a5 5 0 104.45 7.32l4.26 4.27 1.42-1.42-4.27-4.26A5 5 0 008 3zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search notes..." 
            bind:value={searchQuery}
          />
        </div>
        
        <!-- Sort -->
        <div class="sort-select">
          <select bind:value={sortBy}>
            <option value="recent">Recently Edited</option>
            <option value="date">Date Created</option>
            <option value="name">Name</option>
          </select>
        </div>
        
        <!-- New Note Button -->
        <button class="new-note-btn" on:click={() => showNewNoteModal = true}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 4v12m-6-6h12" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          New Note
        </button>
      </div>
    </header>
    
    <!-- Notes Grid -->
    <section class="notes-grid">
      {#if $filteredNotes.length === 0}
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="8" width="48" height="48" rx="8" stroke="#6ee7b7" stroke-width="2"/>
            <path d="M20 20h24M20 32h16M20 44h24" stroke="#6ee7b7" stroke-width="2"/>
          </svg>
          <h3>No notes yet</h3>
          <p>Create your first note to get started</p>
          <button class="new-note-btn" on:click={() => showNewNoteModal = true}>
            Create Note
          </button>
        </div>
      {:else}
        {#each $filteredNotes as note (getNoteId(note))}
          <article 
            class="note-card" 
            on:click={() => openNote(getNoteId(note))}
            on:keypress={(e) => e.key === 'Enter' && openNote(getNoteId(note))}
            tabindex="0"
            role="button"
          >
            <div class="note-card-header">
              <h3 class="note-title">{note.title || 'Untitled'}</h3>
              <button 
                class="note-menu-btn" 
                on:click={(e) => deleteNote(getNoteId(note), e)}
                title="Delete note"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4V3a1 1 0 011-1h6a1 1 0 011 1v1h4v2H2V4h4zm2-1v1h4V3H8zm-5 4h14l-1 12a1 1 0 01-1 1H5a1 1 0 01-1-1L3 7z"/>
                </svg>
              </button>
            </div>
            
            <div class="note-preview">
              <p>Click to edit this note...</p>
            </div>
            
            <div class="note-footer">
              <div class="note-meta">
                <span class="note-date">{formatDate(note.updatedAt)}</span>
                {#if note.tags && note.tags.length > 0}
                  <div class="note-tags">
                    {#each note.tags.slice(0, 2) as tag}
                      <span class="tag">{tag}</span>
                    {/each}
                  </div>
                {/if}
              </div>
              
              {#if note.isPublic}
                <div class="note-shared" title="Shared publicly">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a3 3 0 100 6 3 3 0 000-6zM4 8a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/>
                  </svg>
                </div>
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </section>
  </main>
</div>

<!-- New Note Modal -->
{#if showNewNoteModal}
  <div class="modal-overlay" on:click={() => showNewNoteModal = false} on:keypress={() => {}}>
    <div class="modal" on:click|stopPropagation on:keypress|stopPropagation>
      <div class="modal-header">
        <h2>Create New Note</h2>
        <button class="modal-close" on:click={() => showNewNoteModal = false}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </div>
      
      <form on:submit|preventDefault={createNote} class="modal-body">
        <div class="form-group">
          <label for="noteTitle">Note Title</label>
          <input 
            id="noteTitle"
            type="text" 
            bind:value={newNoteTitle}
            placeholder="Enter note title..."
            autofocus
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={() => showNewNoteModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={isCreating || !newNoteTitle.trim()}>
            {isCreating ? 'Creating...' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .workplace-container {
    display: flex;
    min-height: 100vh;
    background: #0a0a0a;
  }
  
  /* Sidebar */
  .sidebar {
    width: 280px;
    background: #111;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    transition: width 0.2s ease;
  }
  
  .sidebar-collapsed .sidebar {
    width: 72px;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo-text {
    font-size: 1.125rem;
    font-weight: 700;
    color: #fff;
  }
  
  .collapse-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .collapse-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .nav-section {
    margin-bottom: 0.5rem;
  }
  
  .nav-dropdown-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #a8a8a8;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .nav-dropdown-btn:hover,
  .nav-dropdown-btn.active {
    background: rgba(110, 231, 183, 0.1);
    color: #6ee7b7;
  }
  
  .badge {
    margin-left: auto;
    background: rgba(110, 231, 183, 0.2);
    color: #6ee7b7;
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .dropdown-content {
    padding: 0.5rem 0 0.5rem 2.5rem;
  }
  
  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #888;
    font-size: 0.85rem;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .dropdown-empty {
    display: block;
    padding: 0.5rem 0.75rem;
    color: #555;
    font-size: 0.85rem;
    font-style: italic;
  }
  
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .new-workspace-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
  }
  
  .new-workspace-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(110, 231, 183, 0.3);
  }
  
  .profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background 0.2s ease;
  }
  
  .profile:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #0f0f0f;
    flex-shrink: 0;
  }
  
  .avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .profile-info {
    flex: 1;
    min-width: 0;
  }
  
  .profile-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: #e8e8e8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .profile-email {
    display: block;
    font-size: 0.75rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .logout-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: #0f0f0f;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.25rem;
  }
  
  .subtitle {
    font-size: 0.875rem;
    color: #666;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    min-width: 240px;
  }
  
  .search-box svg {
    color: #666;
    flex-shrink: 0;
  }
  
  .search-box input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.9rem;
  }
  
  .search-box input::placeholder {
    color: #666;
  }
  
  .search-box input:focus {
    outline: none;
  }
  
  .sort-select select {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e8e8e8;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .sort-select select:focus {
    outline: none;
    border-color: #6ee7b7;
  }
  
  .new-note-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .new-note-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(110, 231, 183, 0.3);
  }
  
  /* Notes Grid */
  .notes-grid {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    align-content: start;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
  }
  
  .empty-state svg {
    margin-bottom: 1.5rem;
    opacity: 0.5;
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
    color: #e8e8e8;
    margin-bottom: 0.5rem;
  }
  
  .empty-state p {
    color: #666;
    margin-bottom: 1.5rem;
  }
  
  .note-card {
    background: #161616;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .note-card:hover {
    border-color: rgba(110, 231, 183, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
  
  .note-card:focus {
    outline: none;
    border-color: #6ee7b7;
  }
  
  .note-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  
  .note-title {
    font-size: 1rem;
    font-weight: 600;
    color: #e8e8e8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  
  .note-menu-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    opacity: 0;
    transition: all 0.2s ease;
  }
  
  .note-card:hover .note-menu-btn {
    opacity: 1;
  }
  
  .note-menu-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
  
  .note-preview {
    margin-bottom: 1rem;
  }
  
  .note-preview p {
    font-size: 0.85rem;
    color: #666;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .note-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .note-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .note-date {
    font-size: 0.75rem;
    color: #555;
  }
  
  .note-tags {
    display: flex;
    gap: 0.5rem;
  }
  
  .tag {
    padding: 0.125rem 0.5rem;
    background: rgba(110, 231, 183, 0.1);
    color: #6ee7b7;
    border-radius: 4px;
    font-size: 0.7rem;
  }
  
  .note-shared {
    color: #6ee7b7;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 100;
  }
  
  .modal {
    width: 100%;
    max-width: 440px;
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .modal-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
  }
  
  .modal-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-body .form-group {
    margin-bottom: 1.5rem;
  }
  
  .modal-body .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #a8a8a8;
    margin-bottom: 0.5rem;
  }
  
  .modal-body .form-group input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
  }
  
  .modal-body .form-group input:focus {
    outline: none;
    border-color: #6ee7b7;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  .btn-secondary {
    padding: 0.625rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e8e8e8;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .btn-primary {
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
    }
    
    .sidebar-collapsed .sidebar {
      transform: translateX(0);
      width: 280px;
    }
    
    .content-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
    
    .search-box {
      flex: 1;
      min-width: 200px;
    }
  }
</style>
