import { ref, onMounted, onBeforeUnmount } from 'vue';

/** Instalar Talapo como app (PWA). main.js guarda el evento del navegador en window.__talapoInstall. */
export function useInstall() {
  const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const canPrompt = ref(!!window.__talapoInstall);
  const installed = ref(standalone());
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const sync = () => { canPrompt.value = !!window.__talapoInstall; };
  const done = () => { installed.value = true; canPrompt.value = false; };
  onMounted(() => { window.addEventListener('talapo-installable', sync); window.addEventListener('appinstalled', done); sync(); });
  onBeforeUnmount(() => { window.removeEventListener('talapo-installable', sync); window.removeEventListener('appinstalled', done); });

  async function install() {
    const ev = window.__talapoInstall;
    if (!ev) return false;
    ev.prompt();
    const choice = await ev.userChoice.catch(() => null);
    window.__talapoInstall = null; canPrompt.value = false;
    return choice?.outcome === 'accepted';
  }
  return { canPrompt, installed, isIOS, install };
}
