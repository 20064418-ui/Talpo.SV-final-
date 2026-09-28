<script setup>
import { toasts } from '@/composables/useToast';
const icon = { ok: 'fa-circle-check', error: 'fa-triangle-exclamation', info: 'fa-circle-info' };
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <i class="fas" :class="icon[t.type]" aria-hidden="true"></i>{{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; left: 50%; bottom: 1.5rem; transform: translateX(-50%); z-index: 3000; display: grid; gap: .5rem; width: min(92vw, 420px); }
.toast { background: var(--ink-900); color: #fff; padding: .8rem 1rem; border-radius: var(--radius-m); box-shadow: var(--shadow-2); display: flex; gap: .6rem; align-items: center; font-weight: 600; }
.toast.ok i { color: var(--turq-300); }
.toast.error { background: var(--coral-600); }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>
