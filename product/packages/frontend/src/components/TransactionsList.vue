<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 class="text-lg font-medium text-neutral-900">Transactions</h2>

      <input
        v-model.trim="q"
        type="search"
        placeholder="Filter"
        aria-label="Filter transactions"
        class="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 md:w-64"
      />
    </div>

    <div role="list" class="mt-4 space-y-2" aria-live="polite">
      <div
        v-for="t in filtered"
        :key="t.at + t.txHash"
        role="listitem"
        class="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:bg-neutral-50"
      >
        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold" :class="badgeClass(t.kind)" :title="t.kind">
          {{ t.kind?.charAt(0) ?? '?' }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-neutral-900">
            {{ t.kind }}
          </div>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-600">
            <span v-if="t.meta?.amount" class="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">
              {{ t.meta.amount }}
            </span>
            <span v-if="t.meta?.to" class="font-mono text-[12px] text-neutral-700">
              {{ short(t.meta.to) }}
            </span>
            <span class="text-neutral-500">
              {{ timeago(t.at) }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="rounded-md bg-neutral-50 px-2 py-1 font-mono text-[12px] text-neutral-600 outline-none transition hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-pink-400/70"
          :title="'Copy ' + t.txHash"
          @click="copy(t.txHash)"
          @keydown.enter.prevent="copy(t.txHash)"
        >
          {{ short(t.txHash) }}
        </button>
      </div>

      <div v-if="!filtered.length" class="rounded-xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-500">
        No transactions
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAssets } from '../store/assets';
import { useToasts } from '../utils/useToasts';

const assets = useAssets();
const toasts = useToasts();

const q = ref('');

const filtered = computed(() => {
  const needle = q.value.toLowerCase();
  const items = assets.txs ?? [];
  const out = !needle
    ? items
    : items.filter((t: any) => {
        const hay = [t.kind, t.txHash, t.meta?.to, t.meta?.amount?.toString?.()].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(needle);
      });
  return out.slice().sort((a: any, b: any) => b.at - a.at);
});

function short(s: string) {
  if (!s) return '';
  return s.slice(0, 8) + '…' + s.slice(-6);
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' });
function timeago(ts: number) {
  const secs = Math.round((Date.now() - ts) / 1000);
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, div] of ranges) {
    const amt = Math.floor(secs / div);
    if (Math.abs(amt) >= 1) return rtf.format(-amt, unit);
  }
  return rtf.format(0, 'second');
}

function badgeClass(kind: string) {
  switch ((kind || '').toLowerCase()) {
    case 'deploy':
      return 'bg-pink-100 text-pink-700';
    case 'transfer':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toasts.push({ kind: 'success', text: 'Copied hash' });
  } catch {
    toasts.push({ kind: 'error', text: 'Copy failed' });
  }
}
</script>
