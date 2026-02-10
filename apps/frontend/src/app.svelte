<script lang="ts">
  import Router from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  
  // Import route components
  import SignIn from './routes/signin/+page.svelte';
  import Workplace from './routes/workplace/+page.svelte';
  import Edit from './routes/edit/+page.svelte';
  
  // Import stores
  import { isAuthenticated } from './stores/authStore';
  import { push } from 'svelte-spa-router';
  
  // Define routes
  const routes = {
    '/': SignIn,
    '/signin': SignIn,
    '/workplace': wrap({
      component: Workplace,
      conditions: [
        () => {
          let authenticated = false;
          isAuthenticated.subscribe(v => authenticated = v)();
          if (!authenticated) {
            push('/signin');
            return false;
          }
          return true;
        }
      ]
    }),
    '/edit/:id': wrap({
      component: Edit,
      conditions: [
        () => {
          let authenticated = false;
          isAuthenticated.subscribe(v => authenticated = v)();
          if (!authenticated) {
            push('/signin');
            return false;
          }
          return true;
        }
      ]
    }),
    '*': SignIn, // Fallback route
  };
</script>

<div class="app-root">
  <Router {routes} />
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #0f0f0f;
    color: #e8e8e8;
    line-height: 1.5;
    min-height: 100vh;
  }
  
  :global(a) {
    color: #6ee7b7;
    text-decoration: none;
  }
  
  :global(a:hover) {
    text-decoration: underline;
  }
  
  .app-root {
    min-height: 100vh;
  }
</style>
