<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' = 'text';
  export let label: string = '';
  export let value: string | number = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let error: string = '';
  export let hint: string = '';
  export let id: string = '';
  export let name: string = '';
  export let autocomplete: string = '';
  export let required: boolean = false;
  export let autofocus: boolean = false;
  export let fullWidth: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('input', event);
  }
  
  function handleChange(event: Event) {
    dispatch('change', event);
  }
  
  function handleFocus(event: FocusEvent) {
    dispatch('focus', event);
  }
  
  function handleBlur(event: FocusEvent) {
    dispatch('blur', event);
  }
</script>

<div class="input-wrapper" class:full-width={fullWidth}>
  {#if label}
    <label for={id} class="input-label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  <div class="input-container" class:has-error={!!error}>
    <slot name="prefix" />
    
    <input
      {id}
      {name}
      {type}
      {value}
      {placeholder}
      {disabled}
      {readonly}
      {autocomplete}
      {required}
      {autofocus}
      class="input"
      on:input={handleInput}
      on:change={handleChange}
      on:focus={handleFocus}
      on:blur={handleBlur}
    />
    
    <slot name="suffix" />
  </div>
  
  {#if error}
    <span class="input-error">{error}</span>
  {:else if hint}
    <span class="input-hint">{hint}</span>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .full-width {
    width: 100%;
  }
  
  .input-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #a8a8a8;
  }
  
  .required {
    color: #f87171;
    margin-left: 0.125rem;
  }
  
  .input-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .input-container:focus-within {
    border-color: #6ee7b7;
    box-shadow: 0 0 0 3px rgba(110, 231, 183, 0.1);
  }
  
  .input-container.has-error {
    border-color: #f87171;
  }
  
  .input-container.has-error:focus-within {
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
  }
  
  .input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.9375rem;
    font-family: inherit;
    min-width: 0;
  }
  
  .input::placeholder {
    color: #555;
  }
  
  .input:focus {
    outline: none;
  }
  
  .input:disabled {
    color: #666;
    cursor: not-allowed;
  }
  
  .input-error {
    font-size: 0.8125rem;
    color: #f87171;
  }
  
  .input-hint {
    font-size: 0.8125rem;
    color: #666;
  }
</style>
