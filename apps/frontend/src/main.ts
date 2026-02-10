import App from './app.svelte';

const app = new App({
  target: document.getElementById('app') ?? document.body,
  props: {},
});

export default app;

