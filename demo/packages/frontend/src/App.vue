<template>
  <div class="app-container">
    <NavBar />
    <main class="main-content">
      <section class="grid-section">
        <MintForm />
        <TransferForm />
        <IdentityForm />
      </section>
      <section class="grid-section">
        <TokensList />
        <TransactionsList />
      </section>
    </main>
    <Toasts />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import MintForm from './components/MintForm.vue';
import TransferForm from './components/TransferForm.vue';
import IdentityForm from './components/IdentityForm.vue';
import TokensList from './components/TokensList.vue';
import TransactionsList from './components/TransactionsList.vue';
import Toasts from './components/Toasts.vue';
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  --primary: #e6007a;
  --primary-hover: #c50066;
  --primary-light: rgba(230, 0, 122, 0.1);
  --bg-primary: #1b1b1b;
  --bg-secondary: #252525;
  --bg-card: #2a2a2a;
  --border: #3a3a3a;
  --text: #ffffff;
  --text-secondary: #b8b8b8;
  --text-muted: #808080;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --radius: 8px;
  --transition: all 0.2s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background: var(--bg-primary);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  min-height: 100vh;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.grid-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .grid-section {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text);
}

.btn {
  padding: 0.625rem 1.25rem;
  background: var(--primary);
  border: none;
  border-radius: var(--radius);
  color: white;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition:
    width 0.4s,
    height 0.4s;
}

.btn:active::after {
  width: 200%;
  height: 200%;
}

.btn:hover {
  background: var(--primary-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.loading {
  color: transparent;
  pointer-events: none;
}

.btn.loading::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  margin-left: -10px;
  margin-top: -10px;
  border: 2px solid white;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 0.9375rem;
  transition: var(--transition);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-secondary);
}

.input::placeholder {
  color: var(--text-muted);
}

.label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

select.input {
  cursor: pointer;
}
</style>
