<script setup>
// Código QR generado en el navegador (sin servicios externos)
import { ref, watch } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({ value: { type: String, required: true }, size: { type: Number, default: 180 }, label: String });
const src = ref('');
watch(() => [props.value, props.size], async () => {
  src.value = await QRCode.toDataURL(props.value, { width: props.size * 2, margin: 1, color: { dark: '#0A2F44', light: '#FFFFFF' }, errorCorrectionLevel: 'M' });
}, { immediate: true });
</script>

<template>
  <img v-if="src" class="qr" :src="src" :width="size" :height="size" :alt="label || 'QR code'" />
</template>

<style scoped>
.qr { display: block; border-radius: 12px; background: #fff; padding: 6px; image-rendering: pixelated; }
</style>
