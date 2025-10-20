```vue
<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 class="text-lg font-medium text-neutral-900">Your tokens</h2>

      <input
        v-model.trim="q"
        type="search"
        placeholder="Search tokens"
        aria-label="Search tokens"
        class="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 md:w-64"
      />
    </div>

    <div role="list" class="mt-4 space-y-2" aria-live="polite">
      <div
        v-for="x in filtered"
        :key="x.id"
        role="listitem"
        class="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:bg-neutral-50"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-neutral-900">{{ x.name }}</div>
          <div class="mt-0.5 flex flex-col space-y-1 text-[13px] text-neutral-600">
            <span class="w-fit rounded bg-pink-100 px-1.5 py-0.5 text-[12px] font-medium text-pink-700">
              {{ x.symbol }}
            </span>
            <span>Supply {{ x.supply }}</span>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 outline-none transition hover:border-pink-400 hover:text-pink-600 focus-visible:ring-2 focus-visible:ring-pink-400/70"
          @click="view(x.id)"
        >
          View
        </button>
      </div>

      <div v-if="!filtered.length" class="rounded-xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-500">
        No tokens found
      </div>
    </div>

    <Modal v-model:open="open" :title="modal?.name || 'Asset'">
      <div v-if="modal" class="space-y-3">
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span class="text-sm font-medium text-neutral-600">Address</span>
          <span class="font-mono text-[12px] text-neutral-800">{{ modal.token }}</span>
        </div>
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span class="text-sm font-medium text-neutral-600">Name</span>
          <span class="text-sm text-neutral-900">{{ modal.name }}</span>
        </div>
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span class="text-sm font-medium text-neutral-600">Symbol</span>
          <span class="text-sm text-neutral-900">{{ modal.symbol }}</span>
        </div>
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span class="text-sm font-medium text-neutral-600">Supply</span>
          <span class="text-sm text-neutral-900">{{ modal.supply }}</span>
        </div>
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span class="text-sm font-medium text-neutral-600">Owner Balance</span>
          <span class="text-sm text-neutral-900">{{ modal.balance }} {{ modal.symbol }}</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAssets } from '../store/assets';
import { useSession } from '../store/session';
import Modal from './Modal.vue';

const assets = useAssets();
const session = useSession();

const q = ref('');
const open = ref(false);
const modal = ref<any>(null);

const filtered = computed(() => {
  const needle = q.value.toLowerCase();
  const list = assets.items ?? [];
  if (!needle) return list;
  return list.filter((x: any) => `${x.name} ${x.symbol}`.toLowerCase().includes(needle));
});

function view(id: string) {
  modal.value = assets.byId(id);
  open.value = true;
}

const refresh = () => {
  if (session.address) assets.loadForUser();
};

watch(
  () => session.address,
  () => refresh(),
  { immediate: true },
);

function onVisible() {
  if (document.visibilityState === 'visible') refresh();
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisible);
  refresh();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisible);
});
</script>
```
