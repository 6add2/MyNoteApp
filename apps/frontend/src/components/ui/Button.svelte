<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let icon: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button
  {type}
  class="btn btn-{variant} btn-{size}"
  class:btn-full={fullWidth}
  class:btn-icon={icon}
  class:btn-loading={loading}
  {disabled}
  on:click={handleClick}
>
  {#if loading}
    <span class="spinner"></span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    outline: none;
    white-space: nowrap;
  }
  
  .btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.3);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Sizes */
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .btn-md {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
  
  .btn-lg {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
  }
  
  /* Variants */
  .btn-primary {
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    color: #0f0f0f;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(110, 231, 183, 0.3);
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #e8e8e8;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .btn-ghost {
    background: transparent;
    color: #888;
  }
  
  .btn-ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .btn-danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  /* Modifiers */
  .btn-full {
    width: 100%;
  }
  
  .btn-icon {
    padding: 0.5rem;
  }
  
  .btn-icon.btn-sm {
    padding: 0.375rem;
  }
  
  .btn-icon.btn-lg {
    padding: 0.75rem;
  }
  
  /* Loading */
  .btn-loading {
    pointer-events: none;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
