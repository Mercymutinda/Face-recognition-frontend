<script setup>
import { onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

let idleTimer;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  if (authStore.isAuthenticated) {
    idleTimer = setTimeout(async () => {
      await authStore.lockAccount?.();
      router.push({ name: "auth-lock3" });
    }, IDLE_TIMEOUT_MS);
  }
};

onMounted(() => {
  ["mousemove", "keydown", "click", "scroll"].forEach((e) =>
    window.addEventListener(e, resetIdleTimer)
  );
  resetIdleTimer();
});
onUnmounted(() => {
  ["mousemove", "keydown", "click", "scroll"].forEach((e) =>
    window.removeEventListener(e, resetIdleTimer)
  );
  clearTimeout(idleTimer);
});
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
@import "@/assets/scss/main";
@import "@/assets/scss/oneui/themes/amethyst";
@import "@/assets/scss/oneui/themes/city";
@import "@/assets/scss/oneui/themes/flat";
@import "@/assets/scss/oneui/themes/modern";
@import "@/assets/scss/oneui/themes/smooth";
</style>
