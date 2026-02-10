<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let currentMode: 'word' | 'ppt' | 'handwrite' = 'word';
  
  const dispatch = createEventDispatcher();
  
  const modes = [
    {
      id: 'word',
      label: 'Document',
      icon: `<path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h10v2H4v-2z"/>`,
    },
    {
      id: 'ppt',
      label: 'Presentation',
      icon: `<path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm1 10h10v2H7v-2z"/>`,
    },
    {
      id: 'handwrite',
      label: 'Handwrite',
      icon: `<path d="M16.586 4.586a2 2 0 112.828 2.828l-10 10-4 1 1-4 10.172-9.828z"/>`,
    },
  ] as const;
  
  function selectMode(mode: 'word' | 'ppt' | 'handwrite') {
    currentMode = mode;
    dispatch('change', mode);
  }
</script>

<div class="mode-selector">
  {#each modes as mode}
    <button 
      class="mode-btn"
      class:active={currentMode === mode.id}
      on:click={() => selectMode(mode.id)}
      title={mode.label}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        {@html mode.icon}
      </svg>
    </button>
  {/each}
</div>

<style>
  .mode-selector {
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    display: flex;
    gap: 0.5rem;
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 40;
  }
  
  .mode-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .mode-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .mode-btn.active {
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    color: #0f0f0f;
  }
  
  @media (max-width: 768px) {
    .mode-selector {
      right: 1rem;
      bottom: 1rem;
      padding: 0.375rem;
    }
    
    .mode-btn {
      width: 40px;
      height: 40px;
    }
    
    .mode-btn svg {
      width: 20px;
      height: 20px;
    }
  }
</style>
