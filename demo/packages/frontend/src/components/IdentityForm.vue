<template>
  <div class="h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6 flex flex-col">
    <h2 class="text-lg font-medium text-neutral-900">Register identity</h2>

    <div class="mt-4 flex flex-1 flex-col gap-3">
      <label class="block">
        <span class="block text-sm text-neutral-600">Address</span>
        <input
          ref="addrEl"
          v-model.trim="address"
          inputmode="text"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          placeholder="0x..."
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :aria-invalid="address && !isAddressValid ? 'true' : 'false'"
          @keydown.enter.prevent="canRegister && register()"
        />
      </label>

      <label class="block">
        <span class="block text-sm text-neutral-600">Country</span>
        <select
          v-model="country"
          class="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus-visible:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-400/70 disabled:opacity-60"
          :disabled="loadingCountries"
          :aria-busy="loadingCountries ? 'true' : 'false'"
          :aria-invalid="country === '' ? 'true' : 'false'"
        >
          <option disabled value="">{{ loadingCountries ? 'Loading…' : 'Select country' }}</option>
          <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
        </select>
      </label>

      <p v-if="address && !isAddressValid" class="text-xs text-red-600">Enter a valid EVM address.</p>
      <p v-if="!loadingCountries && country === ''" class="text-xs text-red-600">Select a country.</p>

      <button
        class="mt-auto w-full rounded-xl bg-pink-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'animate-pulse': busy }"
        :disabled="!canRegister || busy"
        @click="register"
      >
        {{ busy ? 'Working…' : 'Register identity' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { isAddress, type Address } from 'viem';
import { api } from '../lib/api';
import { useSession } from '../store/session';
import { useToasts } from '../utils/useToasts';

const session = useSession();
const toasts = useToasts();

const address = ref('');
const country = ref<string>('');
const countries = ref<Array<{ name: string; code: string }>>([]);
const loadingCountries = ref(false);

const addrEl = ref<HTMLInputElement | null>(null);
const busy = ref(false);

const isAddressValid = computed(() => isAddress(address.value));
const canRegister = computed(() => !!session.address && isAddressValid.value && country.value !== '');

onMounted(async () => {
  addrEl.value?.focus();
  loadingCountries.value = true;
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,ccn3');
    const data = (await res.json()) as Array<{ name?: { common?: string }; ccn3?: string }>;
    countries.value = data
      .filter((x) => x.name?.common && x.ccn3)
      .map((x) => ({ name: x.name!.common!, code: x.ccn3! }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    countries.value = [
      { name: 'South Africa', code: '710' },
      { name: 'United States of America', code: '840' },
      { name: 'United Kingdom', code: '826' },
    ];
  } finally {
    loadingCountries.value = false;
    await nextTick();
  }
});

async function register() {
  if (!canRegister.value) return;
  busy.value = true;
  try {
    const res = await api.registerIdentity({ owner: address.value as Address, country: country.value });
    if (res.status) {
      toasts.push({ kind: 'success', text: `Identity registered for ${address.value}` });
      address.value = '';
      country.value = '';
      addrEl.value?.focus();
    } else {
      toasts.push({ kind: 'error', text: 'Registration failed' });
    }
  } catch (e: any) {
    toasts.push({ kind: 'error', text: e?.message ?? 'Registration failed' });
  } finally {
    busy.value = false;
  }
}
</script>
