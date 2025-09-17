<template>
  <header class="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div class="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 md:px-6">
      <div class="text-base font-semibold text-neutral-900 md:text-lg">TokenyDemoDApp</div>

      <div class="flex items-center gap-2 md:gap-3">
        <!-- Identity status -->
        <div
          v-if="s.address"
          class="hidden h-10 items-center whitespace-nowrap rounded-xl border border-neutral-300 bg-white px-3 text-sm shadow-sm md:flex"
          :class="isVerified ? 'text-emerald-700' : 'text-amber-700'"
          :title="identityTitle"
          aria-live="polite"
        >
          <span class="mr-2 inline-block h-2.5 w-2.5 rounded-full" :class="isVerified ? 'bg-emerald-500' : 'bg-amber-500'"></span>
          {{ identityText }}
        </div>

        <!-- Balance pill -->
        <div
          v-if="balanceText"
          class="hidden h-10 items-center whitespace-nowrap rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 shadow-sm md:flex"
          aria-live="polite"
          :title="balanceText"
        >
          <span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          {{ balanceText }}
        </div>

        <ConnectButton />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSession } from '../store/session';
import ConnectButton from './ConnectButton.vue';

const s = useSession();

const balanceText = computed(() => {
  const n = Number(s.balanceEth);
  if (!Number.isFinite(n)) return '';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`;
});

const isVerified = computed(() => !!s.user?.identity?.verified);
const identityText = computed(() => (isVerified.value ? 'Verified' : 'Unverified'));
const identityTitle = computed(() => {
  const addr = s.user?.identity?.identityAddress;
  return isVerified.value ? (addr ? `Verified • ${addr}` : 'Verified') : 'Identity not verified';
});
</script>
