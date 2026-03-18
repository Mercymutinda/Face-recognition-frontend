<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// --- 30 MINUTE IDLE LOCK LOGIC ---
let idleTimer;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const resetIdleTimer = () => {
  clearTimeout(idleTimer);

  if (authStore.isAuthenticated) {
    idleTimer = setTimeout(() => {
      console.log("User inactive for 30 minutes. Locking account.");
      // Destroy the access token for security
      authStore.removeToken();
      // Route to the lock screen (which will use the saved username)
      router.push({ name: "auth-lock3" });
    }, IDLE_TIMEOUT_MS);
  }
};

onMounted(() => {
  // Start tracking user activity
  window.addEventListener("mousemove", resetIdleTimer);
  window.addEventListener("keydown", resetIdleTimer);
  window.addEventListener("click", resetIdleTimer);
  window.addEventListener("scroll", resetIdleTimer);
  resetIdleTimer();
});

onUnmounted(() => {
  // Clean up listeners
  window.removeEventListener("mousemove", resetIdleTimer);
  window.removeEventListener("keydown", resetIdleTimer);
  window.removeEventListener("click", resetIdleTimer);
  window.removeEventListener("scroll", resetIdleTimer);
  clearTimeout(idleTimer);
});
// ---------------------------------
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
// Main Stylesheet
@import "@/assets/scss/main";

// All color themes are included and available by default
// Feel free to comment out any of them if you won't use them in your project
@import "@/assets/scss/oneui/themes/amethyst";
@import "@/assets/scss/oneui/themes/city";
@import "@/assets/scss/oneui/themes/flat";
@import "@/assets/scss/oneui/themes/modern";
@import "@/assets/scss/oneui/themes/smooth";
</style>
