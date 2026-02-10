<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let open: boolean = false;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let closeOnOverlay: boolean = true;
  export let closeOnEscape: boolean = true;
  export let showClose: boolean = true;
  
  const dispatch = createEventDispatcher();
  
  function close() {
    dispatch('close');
  }
  
  function handleOverlayClick(event: MouseEvent) {
    if (closeOnOverlay && event.target === event.currentTarget) {
      close();
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape' && open) {
      close();
    }
  }
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeydown);
    }
  });
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown);
    }
  });
  
  // Lock body scroll when modal is open
  $: {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : '';
    }
  }
</script>

{#if open}
  <div 
    class="modal-overlay"
    on:click={handleOverlayClick}
    on:keypress={() => {}}
    transition:fade={{ duration: 150 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <div 
      class="modal modal-{size}"
      transition:scale={{ duration: 200, start: 0.95 }}
      on:click|stopPropagation
      on:keypress|stopPropagation
    >
      {#if title || showClose}
        <div class="modal-header">
          {#if title}
            <h2 id="modal-title" class="modal-title">{title}</h2>
          {/if}
          
          {#if showClose}
            <button class="modal-close" on:click={close} aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      
      <div class="modal-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="modal-footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 1000;
  }
  
  .modal {
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    max-height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  
  /* Sizes */
  .modal-sm {
    width: 100%;
    max-width: 360px;
  }
  
  .modal-md {
    width: 100%;
    max-width: 480px;
  }
  
  .modal-lg {
    width: 100%;
    max-width: 640px;
  }
  
  .modal-xl {
    width: 100%;
    max-width: 900px;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }
  
  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
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
    margin-left: auto;
  }
  
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }
  
  @media (max-width: 640px) {
    .modal-overlay {
      padding: 1rem;
    }
    
    .modal {
      max-height: calc(100vh - 2rem);
    }
    
    .modal-header {
      padding: 1rem;
    }
    
    .modal-body {
      padding: 1rem;
    }
    
    .modal-footer {
      padding: 1rem;
    }
  }
</style>
