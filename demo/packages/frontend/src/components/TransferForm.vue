<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
    <h2 class="text-lg font-medium text-neutral-900">Transfer</h2>

    <div class="mt-4 space-y-4">
      <label class="block">
        <span class="block text-sm text-neutral-600">Token</span>
        <select
          ref="assetEl"
          v-model="token"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
        >
          <option disabled value="">Select token</option>
          <option v-for="x in assets.items" :key="x.id" :value="x.id">
            {{ x.symbol }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="block text-sm text-neutral-600">Recipient</span>
        <input
          ref="toEl"
          v-model.trim="to"
          inputmode="text"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          placeholder="0x..."
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :aria-invalid="to && !isRecipientValid ? 'true' : 'false'"
          @keydown.enter.prevent="canSend && send()"
        />
      </label>
      <p v-if="to && !isRecipientValid" class="text-xs text-red-600">Enter a valid EVM address.</p>

      <label class="block">
        <span class="block text-sm text-neutral-600">Amount</span>
        <input
          ref="amtEl"
          v-model.number="amount"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          placeholder="50"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          @keydown.enter.prevent="canSend && send()"
        />
      </label>
      <p v-if="amount !== null && !isAmountValid" class="text-xs text-red-600">Amount must be at least 1.</p>

      <button
        class="w-full rounded-xl bg-pink-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'animate-pulse': busy }"
        :disabled="!canSend || busy"
        @click="send"
      >
        {{ busy ? 'Working…' : 'Send transfer' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAddress, getAddress } from 'viem';
import { useAssets } from '../store/assets';
import { useSession } from '../store/session';
import { api, type Address } from '../lib/api';
import { useToasts } from '../utils/useToasts';

const assets = useAssets();
const s = useSession();
const toasts = useToasts();

const token = ref<Address | ''>('');
const to = ref('');
const amount = ref<number | null>(null);
const busy = ref(false);

const assetEl = ref<HTMLSelectElement | null>(null);
const toEl = ref<HTMLInputElement | null>(null);
const amtEl = ref<HTMLInputElement | null>(null);

const isRecipientValid = computed(() => isAddress(to.value, { strict: false }));
const isAmountValid = computed(() => amount.value !== null && Number(amount.value) >= 1);
const isTokenChosen = computed(() => !!token.value);
const canSend = computed(() => !!s.address && isTokenChosen.value && isRecipientValid.value && isAmountValid.value);

onMounted(() => {
  if (!isTokenChosen.value) assetEl.value?.focus();
  else if (!to.value) toEl.value?.focus();
  else amtEl.value?.focus();
});

async function send() {
  if (!canSend.value || !s.address || !amount.value || !token.value) return;
  busy.value = true;
  try {
    const res = await api.transfer({
      from: s.address,
      to: getAddress(to.value) as Address,
      amount: String(Math.trunc(amount.value)),
      token: token.value as Address,
    });
    toasts.push({ kind: 'success', text: `Transfer sent. ${res.txHash.slice(0, 10)}…` });
    amount.value = null;
    to.value = '';
    toEl.value?.focus();
  } catch (e: any) {
    const msg = e?.data?.preflight ? JSON.stringify(e.data.preflight) : e.message;
    toasts.push({ kind: 'error', text: msg || 'transfer failed' });
  } finally {
    busy.value = false;
  }
}
</script>
