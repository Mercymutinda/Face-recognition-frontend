<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const errors = ref({});
const loading = ref(false);
const showPass = ref(false);

// 🔥 Auto clear field errors when typing
watch(username, () => delete errors.value.username);
watch(password, () => delete errors.value.password);

async function onSubmit() {
  errors.value = {};

  // ✅ FRONTEND VALIDATION
  if (!username.value) {
    errors.value.username = "Username is required";
  }

  if (!password.value) {
    errors.value.password = "Password is required";
  }

  if (Object.keys(errors.value).length) return;

  loading.value = true;

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });

    router.push({ name: "dashboard" });

  } catch (e) {
    const res = e?.response?.data;

    // ✅ FASTAPI VALIDATION ERRORS (422)
    if (Array.isArray(res)) {
      const fieldErrors = {};

      res.forEach((err) => {
        const field = err.loc?.[1];
        if (field) {
          fieldErrors[field] = err.msg;
        }
      });

      errors.value = fieldErrors;
    } 
    
    // ✅ NORMAL ERROR (401, etc)
    else {
      errors.value.general =
        res?.detail || "Invalid credentials. Please try again.";
    }

  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;background:#f4f6fb;">
    
    <!-- LEFT PANEL -->
    <div class="d-none d-lg-flex flex-column justify-content-between p-5"
      style="width:42%;background:linear-gradient(160deg,#1a2540 0%,#2356d7 100%);position:relative;overflow:hidden;">

      <div style="position:absolute;inset:0;opacity:.04;
        background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=60 height=60%3E%3Ccircle cx=30 cy=30 r=0.8 fill=%22%23fff%22/%3E%3C/svg%3E');">
      </div>

      <div style="position:relative;z-index:1;">
        <h2 style="color:#fff;">AcademiScan</h2>
        <p style="color:rgba(255,255,255,.6);">
          Biometric-powered attendance & exam authentication.
        </p>
      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-4">
      <div style="width:100%;max-width:420px;">

        <h1 style="font-size:28px;font-weight:900;color:#1a2540;">
          Sign In
        </h1>

        <!-- GENERAL ERROR -->
        <div v-if="errors.general" class="alert alert-danger py-2 mb-3">
          {{ errors.general }}
        </div>

        <form @submit.prevent="onSubmit">
          
          <!-- USERNAME -->
          <div class="mb-3">
            <label>USERNAME / REG NUMBER</label>
            <input
              v-model="username"
              type="text"
              placeholder="admin or BSCS/183J/2022"
              :class="{ 'is-invalid': errors.username }"
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;"
            />
            <div v-if="errors.username" class="text-danger mt-1">
              {{ errors.username }}
            </div>
          </div>

          <!-- PASSWORD -->
          <div class="mb-4">
            <label>PASSWORD</label>

            <div style="position:relative;">
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                :class="{ 'is-invalid': errors.password }"
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;"
              />

              <button
                type="button"
                @click="showPass = !showPass"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:none;"
              >
                👁️
              </button>
            </div>

            <div v-if="errors.password" class="text-danger mt-1">
              {{ errors.password }}
            </div>
          </div>

          <!-- SUBMIT -->
          <button
            type="submit"
            :disabled="loading"
            style="width:100%;padding:12px;background:#2356d7;color:#fff;border:none;border-radius:8px;"
          >
            <span v-if="loading">Loading...</span>
            <span v-else>Sign In →</span>
          </button>
        </form>

      </div>
    </div>
  </div>
</template>