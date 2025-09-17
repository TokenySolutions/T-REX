<template>
  <teleport to="body">
    <transition-group name="toast" tag="div" class="toast-container">
      <div v-for="toast in list" :key="toast.id" :class="['toast', `toast-${toast.kind}`]" @click="remove(toast.id)">
        <div class="toast-message">{{ toast.text }}</div>
      </div>
    </transition-group>
  </teleport>
</template>

<script setup lang="ts">
import { useToasts } from '../utils/useToasts';
const { list, remove } = useToasts();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 2000;
}

.toast {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  min-width: 300px;
  max-width: 450px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.toast-success::before {
  background: var(--success);
}

.toast-error::before {
  background: var(--error);
}

.toast-message {
  color: var(--text);
  font-size: 0.9375rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  transform: translateX(110%);
}

.toast-leave-to {
  transform: translateX(110%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.2s ease;
}

@media (max-width: 768px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .toast {
    max-width: 100%;
  }
}
</style>
