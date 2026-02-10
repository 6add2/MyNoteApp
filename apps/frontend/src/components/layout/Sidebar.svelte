<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let collapsed: boolean = false;
  export let width: string = '280px';
  export let collapsedWidth: string = '72px';
  
  const dispatch = createEventDispatcher();
  
  function toggleCollapse() {
    collapsed = !collapsed;
    dispatch('toggle', collapsed);
  }
</script>

<aside 
  class="sidebar" 
  class:collapsed
  style="--sidebar-width: {width}; --sidebar-collapsed-width: {collapsedWidth}"
>
  <div class="sidebar-header">
    <slot name="header" />
    
    <button class="collapse-btn" on:click={toggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        {#if collapsed}
          <path d="M7 4l6 6-6 6"/>
        {:else}
          <path d="M13 4l-6 6 6 6"/>
        {/if}
      </svg>
    </button>
  </div>
  
  <nav class="sidebar-nav">
    <slot />
  </nav>
  
  <div class="sidebar-footer">
    <slot name="footer" />
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: #111;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    transition: width 0.2s ease;
    flex-shrink: 0;
    overflow: hidden;
  }
  
  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 64px;
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
    flex-shrink: 0;
  }
  
  .collapse-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 0.75rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.2s ease, width 0.2s ease;
    }
    
    .sidebar:not(.collapsed) {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
    }
  }
</style>
