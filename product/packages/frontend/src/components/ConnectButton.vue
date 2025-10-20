<template>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70 enabled:hover:bg-pink-600 enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    :title="s.address ? s.address : 'Connect wallet'"
    :disabled="busy"
    @click="onClick"
  >
    <svg v-if="busy" class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    </svg>
    <span>{{ label }}</span>
  </button>

  <span class="sr-only" aria-live="polite">{{ srMessage }}</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSession } from '../store/session';

const s = useSession();
const busy = ref(false);

const label = computed(() => (s.address ? short(s.address) : busy.value ? 'Connecting…' : 'Connect wallet'));
const srMessage = computed(() => (s.address ? `Connected ${short(s.address)}` : 'Wallet not connected'));

function short(a: string) {
  return a.slice(0, 6) + '…' + a.slice(-4);
}

async function onClick() {
  if (s.address || busy.value) return;
  busy.value = true;
  try {
    await s.connect();
  } finally {
    busy.value = false;
  }
}
</script>
