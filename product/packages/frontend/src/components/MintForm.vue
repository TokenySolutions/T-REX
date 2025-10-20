<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
    <h2 class="text-lg font-medium text-neutral-900">Mint</h2>

    <div class="mt-4 space-y-4">
      <label class="block">
        <span class="block text-sm text-neutral-600">Asset name</span>
        <input
          ref="nameEl"
          v-model.trim="name"
          placeholder="Commercial Property London"
          spellcheck="false"
          autocomplete="off"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :aria-invalid="name && !isNameValid ? 'true' : 'false'"
          @keydown.enter.prevent="canDeploy && deploy()"
        />
      </label>
      <p v-if="name && !isNameValid" class="text-xs text-red-600">Name must be at least 3 characters.</p>

      <label class="block">
        <span class="block text-sm text-neutral-600">Symbol</span>
        <input
          ref="symbolEl"
          v-model="symbol"
          maxlength="4"
          placeholder="CPL"
          autocapitalize="characters"
          autocomplete="off"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :aria-invalid="symbol && !isSymbolValid ? 'true' : 'false'"
          @input="onSymbolInput"
          @keydown.enter.prevent="canDeploy && deploy()"
        />
      </label>
      <p v-if="symbol && !isSymbolValid" class="text-xs text-red-600">Use 3–4 letters/numbers.</p>

      <label class="block">
        <span class="block text-sm text-neutral-600">Token supply</span>
        <input
          ref="supplyEl"
          v-model.number="supply"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          enterkeyhint="go"
          placeholder="500"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :aria-invalid="supply !== null && !isSupplyValid ? 'true' : 'false'"
          @keydown.enter.prevent="canDeploy && deploy()"
        />
      </label>
      <p v-if="supply !== null && !isSupplyValid" class="text-xs text-red-600">Supply must be an integer ≥ 1.</p>

      <button
        class="w-full rounded-xl bg-pink-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'animate-pulse': busy }"
        :disabled="!canDeploy || busy"
        @click="deploy"
      >
        {{ busy ? 'Working…' : 'Deploy token' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSession } from '../store/session';
import { useAssets } from '../store/assets';
import { api } from '../lib/api';
import { useToasts } from '../utils/useToasts';

const name = ref('');
const symbol = ref('');
const supply = ref<number | null>(null);
const busy = ref(false);

const s = useSession();
const a = useAssets();
const toasts = useToasts();

const nameEl = ref<HTMLInputElement | null>(null);
const symbolEl = ref<HTMLInputElement | null>(null);
const supplyEl = ref<HTMLInputElement | null>(null);

const isNameValid = computed(() => name.value.trim().length >= 3);
const isSymbolValid = computed(() => /^[A-Z0-9]{3,4}$/.test(symbol.value));
const isSupplyValid = computed(() => supply.value !== null && Number.isInteger(Number(supply.value)) && Number(supply.value) >= 1);
const canDeploy = computed(() => !!s.address && isNameValid.value && isSymbolValid.value && isSupplyValid.value);

onMounted(() => {
  if (!isNameValid.value) nameEl.value?.focus();
  else if (!isSymbolValid.value) symbolEl.value?.focus();
  else supplyEl.value?.focus();
});

function onSymbolInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  const cleaned = v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  if (cleaned !== symbol.value) symbol.value = cleaned;
}

async function deploy() {
  if (!canDeploy.value || !s.address || supply.value === null) return;
  busy.value = true;
  try {
    const res = await api.createAsset({
      ownerAddress: s.address,
      name: name.value.trim(),
      symbol: symbol.value,
      supply: Math.trunc(Number(supply.value)),
    });
    if (res.asset.status) {
      toasts.push({ kind: 'success', text: `Deployed ${symbol.value} – txs included` });
      await s.fetchUser();
      await a.loadForUser();
      a.pushTx({ kind: 'Deploy', assetId: res.asset.id, txHash: 'n/a', meta: { symbol: symbol.value } });
      name.value = '';
      symbol.value = '';
      supply.value = null;
      nameEl.value?.focus();
    } else {
      toasts.push({ kind: 'error', text: res.asset.error ?? 'deploy failed' });
    }
  } catch (e: any) {
    toasts.push({ kind: 'error', text: e?.message ?? 'deploy failed' });
  } finally {
    busy.value = false;
  }
}
</script>
