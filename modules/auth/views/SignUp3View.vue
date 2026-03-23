<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router    = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: "", email: "", registration_number: "",
  phone_number: "", password: "", confirmPassword: "",
  full_name: "", program: "BSCS", year_of_study: 1,
});
const error   = ref("");
const success = ref("");
const loading = ref(false);

async function onSubmit() {
  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match."; return;
  }
  error.value = ""; loading.value = true;
  const { confirmPassword, ...payload } = form;
  const ok = await authStore.signup(payload);
  loading.value = false;
  if (ok) {
    success.value = "Account created! Redirecting to login…";
    setTimeout(() => router.push({ name: "auth-signin3" }), 2000);
  } else {
    error.value = authStore.error || "Registration failed.";
  }
}
</script>

<template>
  <div class="academi-auth-bg">
    <div class="row g-0" style="min-height:100vh;">
      <!-- Left panel -->
      <div class="d-none d-lg-flex col-lg-4 flex-column justify-content-center"
        style="background:linear-gradient(180deg,rgba(51,27,17,0.98) 0%,rgba(45,62,22,0.98) 100%);
               border-right:1px solid rgba(245,237,224,0.1);padding:40px;">
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#E65F0E,#c44a00);
                      display:flex;align-items:center;justify-content:center;font-size:20px;">🔍</div>
          <div style="font-family:'Playfair Display',serif;font-size:21px;font-weight:700;color:#f5ede0;">
            Academi<span style="color:#E65F0E;">Scan</span>
          </div>
        </div>
        <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:#f5ede0;margin-bottom:12px;">
          Student Registration
        </h2>
        <p style="color:#b89a7a;font-size:13px;line-height:1.7;">
          Create your academic account to access timetables,
          attendance records and exam authentication.
        </p>
        <div style="margin-top:30px;border-top:1px solid rgba(245,237,224,0.1);padding-top:20px;">
          <p style="color:#7a5c42;font-size:12px;">
            Already have an account?
            <RouterLink :to="{ name: 'auth-signin3' }" style="color:#E65F0E;font-weight:600;">
              Sign In →
            </RouterLink>
          </p>
        </div>
      </div>

      <!-- Right panel: form -->
      <div class="col-lg-8 d-flex align-items-center justify-content-center"
        style="background:rgba(51,27,17,0.5);backdrop-filter:blur(10px);padding:40px 20px;">
        <div style="width:100%;max-width:560px;">
          <h1 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:800;color:#f5ede0;margin-bottom:22px;">
            Create Account
          </h1>

          <div v-if="error"   class="alert alert-danger  py-2 mb-3" style="font-size:13px;">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2 mb-3" style="font-size:13px;">{{ success }}</div>

          <form @submit.prevent="onSubmit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="academi-label">FULL NAME</label>
                <input v-model="form.full_name" type="text" class="academi-input" placeholder="Mercy Mbeke Mutinda"/>
              </div>
              <div class="col-md-6">
                <label class="academi-label">USERNAME</label>
                <input v-model="form.username" type="text" class="academi-input" placeholder="mercy_mutinda" required/>
              </div>
              <div class="col-md-6">
                <label class="academi-label">REGISTRATION NUMBER</label>
                <input v-model="form.registration_number" type="text" class="academi-input"
                  placeholder="BSCS/183J/2022" required/>
              </div>
              <div class="col-md-6">
                <label class="academi-label">PHONE NUMBER</label>
                <input v-model="form.phone_number" type="tel" class="academi-input"
                  placeholder="+254712345678" required/>
              </div>
              <div class="col-md-8">
                <label class="academi-label">EMAIL ADDRESS</label>
                <input v-model="form.email" type="email" class="academi-input"
                  placeholder="student@tum.ac.ke" required/>
              </div>
              <div class="col-md-4">
                <label class="academi-label">PROGRAM</label>
                <select v-model="form.program" class="academi-input">
                  <option>BSCS</option><option>BBIT</option><option>BIT</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="academi-label">YEAR OF STUDY</label>
                <select v-model="form.year_of_study" class="academi-input">
                  <option :value="1">Year 1</option><option :value="2">Year 2</option>
                  <option :value="3">Year 3</option><option :value="4">Year 4</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="academi-label">PASSWORD</label>
                <input v-model="form.password" type="password" class="academi-input"
                  placeholder="Min. 8 chars" required/>
              </div>
              <div class="col-md-4">
                <label class="academi-label">CONFIRM PASSWORD</label>
                <input v-model="form.confirmPassword" type="password" class="academi-input"
                  placeholder="Repeat password" required/>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4">
              <RouterLink :to="{ name: 'auth-signin3' }"
                style="font-size:12.5px;color:#b89a7a;">← Back to Sign In</RouterLink>
              <button type="submit" class="academi-btn-orange" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Create Account →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.academi-auth-bg { min-height:100vh; background:#331B11; }
.academi-label   { display:block;font-size:11px;font-weight:600;color:#b89a7a;letter-spacing:.1em;font-family:'DM Mono',monospace;margin-bottom:5px; }
.academi-input   { width:100%;background:rgba(245,237,224,.06);border:1px solid rgba(245,237,224,.12);border-radius:9px;padding:10px 13px;color:#f0e6d3;font-family:'DM Sans',sans-serif;font-size:13.5px;outline:none;transition:border-color .15s; }
.academi-input:focus { border-color:rgba(230,95,14,.5); }
.academi-input::placeholder { color:#7a5c42; }
select.academi-input option { background:#331B11; }
.academi-btn-orange { background:linear-gradient(135deg,#E65F0E,#c44a00);border:none;color:#fff;border-radius:9px;padding:10px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 4px 18px rgba(230,95,14,.3);transition:all .15s; }
.academi-btn-orange:hover { transform:translateY(-1px);box-shadow:0 6px 24px rgba(230,95,14,.45); }
.academi-btn-orange:disabled { opacity:.7;transform:none; }
</style>