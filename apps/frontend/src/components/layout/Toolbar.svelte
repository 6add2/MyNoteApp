<script lang="ts">
  export let sticky: boolean = false;
  export let bordered: boolean = true;
</script>

<header 
  class="toolbar"
  class:sticky
  class:bordered
>
  <div class="toolbar-left">
    <slot name="left" />
  </div>
  
  <div class="toolbar-center">
    <slot />
  </div>
  
  <div class="toolbar-right">
    <slot name="right" />
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    background: #0f0f0f;
    z-index: 10;
  }
  
  .toolbar.sticky {
    position: sticky;
    top: 0;
  }
  
  .toolbar.bordered {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }
  
  .toolbar-center {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
    flex: 1;
    min-width: 0;
  }
  
  @media (max-width: 768px) {
    .toolbar {
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
    }
    
    .toolbar-center {
      order: 3;
      flex-basis: 100%;
      justify-content: flex-start;
      padding-top: 0.5rem;
    }
  }
</style>
