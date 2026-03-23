<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router    = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const errors   = ref({});
const loading  = ref(false);
const showPass = ref(false);

async function onSubmit() {
  errors.value  = {};
  loading.value = true;
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e) {
    const detail = e?.errorPayload?.message || e?.response?.data?.detail;
    errors.value.general = detail || "Invalid credentials. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;background:#f4f6fb;">

    <!-- Left panel — blue brand -->
    <div class="d-none d-lg-flex flex-column justify-content-between p-5"
      style="width:42%;background:linear-gradient(160deg,#1a2540 0%,#2356d7 100%);position:relative;overflow:hidden;">

      <!-- Noise texture -->
      <div style="position:absolute;inset:0;opacity:.04;
        background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=60 height=60%3E%3Ccircle cx=30 cy=30 r=0.8 fill=%22%23fff%22/%3E%3C/svg%3E');
        pointer-events:none;"></div>
      <!-- Radial glow -->
      <div style="position:absolute;top:-100px;left:-80px;width:400px;height:400px;border-radius:50%;
        background:radial-gradient(circle,rgba(74,122,245,.25) 0%,transparent 70%);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-120px;right:-60px;width:350px;height:350px;border-radius:50%;
        background:radial-gradient(circle,rgba(35,86,215,.2) 0%,transparent 70%);pointer-events:none;"></div>

      <!-- Brand -->
      <div style="position:relative;z-index:1;">
        <div class="d-flex align-items-center gap-3 mb-4">
          <div style="width:48px;height:48px;border-radius:13px;background:rgba(255,255,255,.15);
              display:flex;align-items:center;justify-content:center;font-size:22px;
              box-shadow:0 4px 18px rgba(0,0,0,.2);">🔍</div>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:-.02em;">
              Academi<span style="color:#7aa3fa;">Scan</span>
            </div>
            <div class="text-1" style="font-family:'DM Mono',monospace;letter-spacing:.12em;color:rgba(255,255,255,.5);text-transform:uppercase;">
              TUM · Facial Recognition System
            </div>
          </div>
        </div>

        <h2 class="mb-4" style="font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:16px;">
          Intelligent Academic<br>Identity System
        </h2>
        <p  style="font-size:14px;color:rgba(255,255,255,.6);line-height:1.7;max-width:340px;">
          Biometric-powered attendance and exam authentication for the Technical University of Mombasa.
        </p>
      </div>

      <!-- Features -->
      <!-- <div style="position:relative;z-index:1;">
        <div v-for="feat in [
          { icon:'', text:'AI-powered facial recognition' },
          { icon:'', text:'Role-based access control' },
          { icon:'', text:'Real-time attendance analytics' },
        ]" :key="feat.text" class="d-flex align-items-center gap-3 mb-3">
          <div style="width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.1);
              display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
            {{ feat.icon }}
          </div>
          <span style="font-size:13.5px;color:rgba(255,255,255,.75);">{{ feat.text }}</span>
        </div>
      </div> -->
    </div>

    <!-- Right panel — login form -->
    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-4">
      <div style="width:100%;max-width:420px;">

        <!-- Mobile brand -->
        <div class="d-lg-none text-center mb-5">
          <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#1a2540;">
            Academi<span style="color:#2356d7;">Scan</span>
          </div>
        </div>

        <h1 class="mb-5" style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#1a2540;margin-bottom:6px;">
          Sign In
        </h1>
        <!-- <p style="font-size:13.5px;color:#8494b0;margin-bottom:32px;">
          Access your role-based dashboard
        </p> -->

        <!-- Error -->
        <div v-if="errors.general" class="alert alert-danger py-2 mb-3" style="font-size:13px;border-radius:9px;">
          {{ errors.general }}
        </div>

        <form @submit.prevent="onSubmit">
          <div class="mb-3">
            <label style="font-size:11.5px;font-weight:600;color:#8494b0;letter-spacing:.05em;display:block;margin-bottom:5px;">
              USERNAME / REG NUMBER
            </label>
            <input v-model="username" type="text" class="as-input"
              placeholder="admin or BSCS/183J/2022"
              :class="{ 'is-invalid': errors.username }"
              style="background:#f8fafb;border:1.5px solid #dce4f5;border-radius:9px;padding:11px 14px;
                     font-family:'DM Sans',sans-serif;font-size:14px;color:#1a2540;width:100%;outline:none;"/>
          </div>

          <div class="mb-4">
            <label style="font-size:11.5px;font-weight:600;color:#8494b0;letter-spacing:.05em;display:block;margin-bottom:5px;">
              PASSWORD
            </label>
            <div style="position:relative;">
              <input v-model="password" :type="showPass ? 'text' : 'password'" class="as-input"
                placeholder="••••••••"
                style="background:#f8fafb;border:1.5px solid #dce4f5;border-radius:9px;padding:11px 42px 11px 14px;
                       font-family:'DM Sans',sans-serif;font-size:14px;color:#1a2540;width:100%;outline:none;"/>
              <button type="button" @click="showPass=!showPass"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
                       background:none;border:none;cursor:pointer;color:#8494b0;font-size:14px;">
                <i :class="showPass ? 'si si-eye' : 'fa fa-eye-slash fa-sm'"></i>
              </button>
            </div>
            <div class="d-flex justify-content-end mt-1">
              <RouterLink :to="{ name:'reminder' }" style="font-size:12px;color:#2356d7;">Forgot password?</RouterLink>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-3" style="border-radius:10px;font-size:14px;font-weight:600;" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Sign In →
          </button>
        </form>

        <div class="text-center mt-4" style="font-size:13px;color:#8494b0;">
          Don't have an account?
          <RouterLink :to="{ name:'auth-signup3' }" style="color:#2356d7;font-weight:600;"> Register here</RouterLink>
        </div>

       
      </div>
    </div>
  </div>
</template>