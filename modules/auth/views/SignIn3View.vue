<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router    = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const errors   = ref({});
const loading  = ref(false);
const showPass = ref(false);

watch(username, () => delete errors.value.username);
watch(password, () => delete errors.value.password);

async function onSubmit() {
  errors.value = {};
  if (!username.value) errors.value.username = "Username is required";
  if (!password.value) errors.value.password = "Password is required";
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e) {
    const res = e?.response?.data;
    if (Array.isArray(res)) {
      const fieldErrors = {};
      res.forEach((err) => { if (err.loc?.[1]) fieldErrors[err.loc[1]] = err.msg; });
      errors.value = fieldErrors;
    } else {
      errors.value.general = res?.detail || "Invalid credentials. Please try again.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark p-0">
    
    <div class="row g-0 shadow-lg overflow-hidden rounded-4 m-3 w-100" style="max-width: 1000px; min-height: 600px;">
      
      <div class="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative" 
           style="background: linear-gradient(150deg, #0d1630 0%, #122166 100%);">
        
        <div class="d-flex align-items-center gap-2">
          <i class="fa fa-fingerprint fs-3 text-primary"></i>
          <span class="fs-4 fw-bold">Academi<span class="text-warning">Scan</span></span>
        </div>

        <div>
          <p class="text-uppercase small tracking-widest opacity-50 mb-2">Technical University of Mombasa</p>
          <h2 class="display-6 fw-bold mb-3">Intelligent Identity System</h2>
          <p class="opacity-75 lead fs-6 mb-4">Biometric-powered attendance tracking and examination authentication.</p>
          
          <div class="d-flex flex-wrap gap-2">
            <span class="badge rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 px-3 py-2">Face Recognition</span>
            <span class="badge rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 px-3 py-2">Exam Auth</span>
          </div>
        </div>

        <div class="row border-top border-white border-opacity-10 pt-4">
          <div class="col-4">
            <div class="fw-bold fs-5">99.2%</div>
            <div class="small opacity-50 text-uppercase" style="font-size: 0.7rem;">Accuracy</div>
          </div>
          <div class="col-4">
            <div class="fw-bold fs-5">3s</div>
            <div class="small opacity-50 text-uppercase" style="font-size: 0.7rem;">Avg Scan</div>
          </div>
          <div class="col-4">
            <div class="fw-bold fs-5">SSL</div>
            <div class="small opacity-50 text-uppercase" style="font-size: 0.7rem;">Secure</div>
          </div>
        </div>
      </div>

      <div class="col-lg-7 bg-white d-flex align-items-center justify-content-center p-4 p-md-5">
        <div class="w-100" style="max-width: 400px;">
          
          <div class="d-lg-none d-flex align-items-center gap-2 mb-4">
            <i class="fa fa-fingerprint fs-4 text-primary"></i>
            <span class="fs-5 fw-bold text-dark">Academi<span class="text-warning">Scan</span></span>
          </div>

          <div class="mb-4 text-center text-md-start">
            <h1 class="h2 fw-bold text-dark">Welcome back</h1>
            <p class="text-muted">Sign in to your account to continue</p>
          </div>

          <div v-if="errors.general" class="alert alert-danger d-flex align-items-center p-3 mb-4 rounded-3 border-0 shadow-sm" role="alert">
            <i class="fa fa-exclamation-circle me-2"></i>
            <small>{{ errors.general }}</small>
          </div>

          <form @submit.prevent="onSubmit" novalidate>
            <div class="mb-3">
              <label class="form-label text-uppercase small fw-bold text-muted" style="letter-spacing: 0.05rem;">Username / Reg Number</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 text-muted"><i class="fa fa-user"></i></span>
                <input
                  v-model="username"
                  type="text"
                  class="form-control bg-light border-start-0 ps-0 py-2"
                  :class="{ 'is-invalid': errors.username }"
                  placeholder="admin or BSCS/183J/2022"
                />
                <div v-if="errors.username" class="invalid-feedback">{{ errors.username }}</div>
              </div>
            </div>

            <div class="mb-4">
              <div class="d-flex justify-content-between">
                <label class="form-label text-uppercase small fw-bold text-muted" style="letter-spacing: 0.05rem;">Password</label>
                <RouterLink :to="{ name: 'reminder' }" class="small text-decoration-none fw-semibold">Forgot?</RouterLink>
              </div>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 text-muted"><i class="fa fa-lock"></i></span>
                <input
                  v-model="password"
                  :type="showPass ? 'text' : 'password'"
                  class="form-control bg-light border-start-0 border-end-0 ps-0 py-2"
                  :class="{ 'is-invalid': errors.password }"
                  placeholder="••••••••"
                />
                <button type="button" class="input-group-text bg-light border-start-0 text-muted" @click="showPass = !showPass">
                  <i class="fa" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
                <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center" :disabled="loading">
              <span v-if="!loading">
                Sign In <i class="fa fa-arrow-right ms-2"></i>
              </span>
              <span v-else class="spinner-border spinner-border-sm" role="status"></span>
            </button>
          </form>

          <div class="my-4 d-flex align-items-center text-muted">
            <hr class="flex-grow-1 m-0">
            <span class="px-3 small text-uppercase fw-bold">Register Account</span>
            <hr class="flex-grow-1 m-0">
          </div>

          <div class="row g-2">
            <div class="col-sm-6">
              <RouterLink :to="{ name: 'auth-signup3', query: { role: 'student' } }" class="btn btn-outline-success w-100 py-2 small fw-bold">
                <i class="fa fa-user-graduate me-1"></i> Student
              </RouterLink>
            </div>
            <div class="col-sm-6">
              <RouterLink :to="{ name: 'auth-signup3', query: { role: 'lecturer' } }" class="btn btn-outline-primary w-100 py-2 small fw-bold">
                <i class="fa fa-chalkboard-teacher me-1"></i> Lecturer
              </RouterLink>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Only necessary styles that Bootstrap doesn't provide or requires tweaking */
.tracking-widest { letter-spacing: 0.15em; }
.rounded-4 { border-radius: 1.5rem !important; }

/* Custom Focus Ring for consistent aesthetics */
.form-control:focus {
  background-color: #f8f9fa !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
  border-color: #0d6efd;
}

.input-group-text {
  border-color: #dee2e6;
}

/* Specific button override for the high-end feel */
.btn-primary {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border: none;
}
</style>