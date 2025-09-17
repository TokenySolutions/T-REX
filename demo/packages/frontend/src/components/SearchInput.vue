<template>
  <div class="search-wrapper">
    <input
      class="search-input"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; placeholder?: string }>();
defineEmits<{ 'update:modelValue': [string] }>();
</script>

<style scoped>
.search-wrapper {
  position: relative;
}

.search-input {
  padding: 0.5rem 0.875rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 0.875rem;
  width: 200px;
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .search-input {
    width: 120px;
  }
}
</style>
