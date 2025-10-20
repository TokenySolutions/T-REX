<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-overlay" @click.self="close">
        <div ref="container" class="modal-container" role="dialog" aria-modal="true" :aria-labelledby="title ? titleId : undefined" tabindex="-1">
          <div class="modal-header">
            <h3 v-if="title" :id="titleId" class="modal-title">{{ title }}</h3>
            <button ref="closeBtn" class="modal-close" type="button" aria-label="Close" @click="close">×</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{ open: boolean; title?: string }>();
const emit = defineEmits<{ 'update:open': [boolean] }>();

const container = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);

const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

let prevFocused: Element | null = null;

watch(
  () => props.open,
  async (val) => {
    if (val) {
      prevFocused = document.activeElement;
      lockScroll();
      await nextTick();
      focusFirst();
      window.addEventListener('keydown', onKeydown, true);
    } else {
      window.removeEventListener('keydown', onKeydown, true);
      unlockScroll();
      restoreFocus();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true);
  unlockScroll();
});

function close() {
  emit('update:open', false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === 'Tab') {
    trapTab(e);
  }
}

function getFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        'a[href]',
        'area[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(','),
    ),
  ).filter((el) => !el.hasAttribute('inert') && el.offsetParent !== null);
}

function focusFirst() {
  const el = container.value;
  if (!el) return;
  const items = getFocusable(el);
  (items[0] || closeBtn.value || el).focus();
}

function trapTab(e: KeyboardEvent) {
  const el = container.value;
  if (!el) return;
  const items = getFocusable(el);
  if (!items.length) {
    e.preventDefault();
    el.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (e.shiftKey) {
    if (active === first || !el.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function restoreFocus() {
  if (prevFocused && (prevFocused as HTMLElement).focus) {
    (prevFocused as HTMLElement).focus();
  }
  prevFocused = null;
}

function lockScroll() {
  const html = document.documentElement;
  if (!html.classList.contains('modal-open')) {
    html.classList.add('modal-open');
  }
  html.style.overflow = 'hidden';
}

function unlockScroll() {
  const html = document.documentElement;
  html.classList.remove('modal-open');
  html.style.overflow = '';
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  -webkit-backdrop-filter: blur(1px);
  backdrop-filter: blur(1px);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow: auto;
  outline: none;
}

.modal-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1rem 0 1rem;
}

.modal-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  color: #475569;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}
.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.modal-close:focus-visible {
  outline: 2px solid #fb7185;
  outline-offset: 2px;
}

.modal-body {
  padding: 1rem;
  color: #111827;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
.modal-enter-from .modal-container {
  transform: translateY(6px) scale(0.98);
  opacity: 0.98;
}
.modal-leave-to .modal-container {
  transform: translateY(6px) scale(0.98);
  opacity: 0.98;
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: none !important;
  }
}
</style>
