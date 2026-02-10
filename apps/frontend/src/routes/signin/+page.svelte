<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { AuthController } from '$lib/controllers/AuthController';
  import { authStore, isAuthenticated, isLoading, authError } from '../../stores/authStore';
  import { onMount } from 'svelte';
  
  let mode: 'login' | 'register' = 'login';
  let email = '';
  let password = '';
  let name = '';
  let confirmPassword = '';
  let localError = '';
  
  // Redirect if already authenticated
  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe(value => {
      if (value) {
        push('/workplace');
      }
    });
    return unsubscribe;
  });
  
  async function handleSubmit() {
    localError = '';
    
    // Validation
    if (!email || !password) {
      localError = 'Please fill in all required fields';
      return;
    }
    
    if (!email.includes('@')) {
      localError = 'Please enter a valid email address';
      return;
    }
    
    if (password.length < 6) {
      localError = 'Password must be at least 6 characters';
      return;
    }
    
    if (mode === 'register') {
      if (!name) {
        localError = 'Please enter your name';
        return;
      }
      if (password !== confirmPassword) {
        localError = 'Passwords do not match';
        return;
      }
    }
    
    try {
      if (mode === 'login') {
        await AuthController.login(email, password);
      } else {
        await AuthController.register(email, password, name);
      }
      push('/workplace');
    } catch (error) {
      // Error is already set in authStore
    }
  }
  
  function handleGoogleLogin() {
    // TODO: Implement Google OAuth
    localError = 'Google login coming soon';
  }
  
  function toggleMode() {
    mode = mode === 'login' ? 'register' : 'login';
    localError = '';
    authStore.setError(null);
  }
  
  $: displayError = localError || $authError;
</script>

<div class="signin-container">
  <div class="signin-card">
    <!-- Logo/Brand -->
    <div class="brand">
      <div class="logo">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#6ee7b7"/>
          <path d="M14 16h20v3H14v-3zm0 6h16v3H14v-3zm0 6h20v3H14v-3z" fill="#0f0f0f"/>
        </svg>
      </div>
      <h1>CollabNotes</h1>
      <p class="tagline">Real-time collaborative note-taking</p>
    </div>
    
    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="form">
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      
      {#if displayError}
        <div class="error-message" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 11a1 1 0 110-2 1 1 0 010 2zm1-3H7V4h2v5z"/>
          </svg>
          {displayError}
        </div>
      {/if}
      
      {#if mode === 'register'}
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="Enter your full name"
            autocomplete="name"
            disabled={$isLoading}
          />
        </div>
      {/if}
      
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="Enter your email"
          autocomplete="email"
          disabled={$isLoading}
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Enter your password"
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          disabled={$isLoading}
        />
      </div>
      
      {#if mode === 'register'}
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            placeholder="Confirm your password"
            autocomplete="new-password"
            disabled={$isLoading}
          />
        </div>
      {/if}
      
      {#if mode === 'login'}
        <div class="forgot-password">
          <a href="#/forgot-password">Forgot password?</a>
        </div>
      {/if}
      
      <button type="submit" class="btn-primary" disabled={$isLoading}>
        {#if $isLoading}
          <span class="spinner"></span>
          {mode === 'login' ? 'Signing in...' : 'Creating account...'}
        {:else}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        {/if}
      </button>
      
      <!-- Divider -->
      <div class="divider">
        <span>or continue with</span>
      </div>
      
      <!-- Social Login -->
      <button type="button" class="btn-social" on:click={handleGoogleLogin} disabled={$isLoading}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path fill="#4285F4" d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.9-4.2 2.9-7.1z"/>
          <path fill="#34A853" d="M10 20c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.5-4H1.3v2.5C2.9 17.9 6.2 20 10 20z"/>
          <path fill="#FBBC05" d="M4.5 12.1c-.2-.6-.3-1.3-.3-2.1s.1-1.5.3-2.1V5.4H1.3C.5 7 0 8.4 0 10s.5 3 1.3 4.6l3.2-2.5z"/>
          <path fill="#EA4335" d="M10 3.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C14.7 1 12.6 0 10 0 6.2 0 2.9 2.1 1.3 5.4l3.2 2.5c.8-2.3 3-4 5.5-4z"/>
        </svg>
        Continue with Google
      </button>
    </form>
    
    <!-- Toggle Mode -->
    <div class="toggle-mode">
      {#if mode === 'login'}
        Don't have an account?
        <button type="button" on:click={toggleMode}>Sign up</button>
      {:else}
        Already have an account?
        <button type="button" on:click={toggleMode}>Sign in</button>
      {/if}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <a href="#/terms">Terms of Service</a>
      <span>•</span>
      <a href="#/privacy">Privacy Policy</a>
    </div>
  </div>
</div>

<style>
  .signin-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
  }
  
  .signin-card {
    width: 100%;
    max-width: 420px;
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(110, 231, 183, 0.1);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  
  .brand {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo {
    margin-bottom: 1rem;
  }
  
  .brand h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.25rem;
  }
  
  .tagline {
    color: #888;
    font-size: 0.9rem;
  }
  
  .form h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #e8e8e8;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #f87171;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #a8a8a8;
    margin-bottom: 0.5rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .form-group input::placeholder {
    color: #666;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #6ee7b7;
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.1);
  }
  
  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .forgot-password {
    text-align: right;
    margin-bottom: 1.5rem;
  }
  
  .forgot-password a {
    font-size: 0.875rem;
    color: #6ee7b7;
  }
  
  .btn-primary {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%);
    border: none;
    border-radius: 8px;
    color: #0f0f0f;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(110, 231, 183, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
  
  .divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    gap: 1rem;
  }
  
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .divider span {
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .btn-social {
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e8e8e8;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .btn-social:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .btn-social:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .toggle-mode {
    text-align: center;
    margin-top: 1.5rem;
    color: #888;
    font-size: 0.9rem;
  }
  
  .toggle-mode button {
    background: none;
    border: none;
    color: #6ee7b7;
    font-weight: 600;
    cursor: pointer;
    font-size: inherit;
    margin-left: 0.25rem;
  }
  
  .toggle-mode button:hover {
    text-decoration: underline;
  }
  
  .footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.8rem;
    color: #666;
  }
  
  .footer a {
    color: #888;
  }
  
  .footer a:hover {
    color: #6ee7b7;
  }
</style>
