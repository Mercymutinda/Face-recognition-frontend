<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import api from "@/utils/api";

const router    = useRouter();
const route     = useRoute();
const authStore = useAuthStore();

const signupRole = computed(() => route.query.role || "student");
const isLecturer = computed(() => signupRole.value === "lecturer");

const programs = ref([]);

const form = reactive({
  username: "",
  email: "",
  registration_number: "",
  phone_number: "",
  password: "",
  confirmPassword: "",
  full_name: "",
  program: "", // Default to empty
  year_of_study: 1,
});

const error   = ref("");
const loading = ref(false);
const step    = ref(1);

// Fetch programs from backend on mount
onMounted(async () => {
  if (!isLecturer.value) {
    try {
      const { data } = await api.get("/academic/programs");
      programs.value = data.items || data;
    } catch (err) {
      console.error("Failed to load programs:", err);
    }
  }
});

function nextStep() {
  error.value = "";
  if (!form.full_name || !form.username || !form.registration_number || !form.phone_number || !form.email) {
    error.value = "Please fill in all required fields before continuing.";
    return;
  }
  // Require program selection for students
  if (!isLecturer.value && !form.program) {
    error.value = "Please select a program.";
    return;
  }
  step.value = 2;
}

async function onSubmit() {
  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match.";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    const { confirmPassword, ...payload } = form;
    payload.assigned_role = isLecturer.value ? "LECTURER" : "STUDENT";

    // The store should return true on success, or throw on error
    const ok = await authStore.signup(payload);

    if (ok) {
      router.push({ name: "auth-signin3" });
    }
  } catch (err) {
    error.value = err.response?.data?.detail || "A server error occurred. Please ensure roles are seeded.";
    console.error("Signup error:", err);
  } finally {
    loading.value = false;
  }
}

// Password strength calculation
const pwStrength = computed(() => {
  const p = form.password;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
});

const pwColorClass = computed(() => {
  const classes = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
  return classes[pwStrength.value];
});
</script>

<template>
  <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark p-0">
    <div class="row g-0 shadow-lg overflow-hidden rounded-4 m-3 w-100" style="max-width: 1100px; min-height: 650px;">
      
      <div class="col-lg-4 d-none d-lg-flex flex-column justify-content-between p-5 text-white" 
           :class="isLecturer ? 'bg-primary' : 'bg-success'"
           style="background-image: linear-gradient(160deg, rgba(0,0,0,0.3) 0%, transparent 100%);">
        
        <div>
          <div class="d-flex align-items-center gap-2 mb-4">
            <i class="fa fa-fingerprint fs-3"></i>
            <span class="fs-4 fw-bold">AcademiScan</span>
          </div>

          <span class="badge bg-white bg-opacity-25 text-white mb-3 text-uppercase small tracking-wider px-3 py-2">
            {{ isLecturer ? 'Lecturer Account' : 'Student Account' }}
          </span>
          
          <h2 class="display-6 fw-bold mb-4">
            {{ isLecturer ? 'Join the Faculty' : 'Begin Your Journey' }}
          </h2>
          <p class="opacity-75 mb-5">
            {{ isLecturer 
              ? 'Manage attendance sessions and generate examination reports securely.' 
              : 'Register to track attendance and authenticate for exams using face recognition.' 
            }}
          </p>

          <div class="d-flex flex-column gap-4">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center border border-2 shadow-sm" 
                   style="width: 32px; height: 32px;"
                   :class="step >= 1 ? 'bg-white text-dark border-white' : 'text-white border-white opacity-50'">
                <i v-if="step > 1" class="fa fa-check small"></i>
                <span v-else>1</span>
              </div>
              <span class="fw-bold" :class="step === 1 ? 'opacity-100' : 'opacity-50'">Personal Profile</span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center border border-2 shadow-sm" 
                   style="width: 32px; height: 32px;"
                   :class="step === 2 ? 'bg-white text-dark border-white' : 'text-white border-white opacity-50'">
                <span>2</span>
              </div>
              <span class="fw-bold" :class="step === 2 ? 'opacity-100' : 'opacity-50'">Account Security</span>
            </div>
          </div>
        </div>

        <div class="border-top border-white border-opacity-10 pt-4 mt-auto">
          <RouterLink :to="{ name: 'auth-signin3' }" class="text-white text-decoration-none small fw-bold">
            Already registered? Sign In <i class="fa fa-arrow-right ms-1"></i>
          </RouterLink>
        </div>
      </div>

      <div class="col-lg-8 bg-white d-flex flex-column p-4 p-md-5">
        <div class="w-100 mx-auto" style="max-width: 600px;">
          
          <div v-if="error" class="alert alert-danger py-2 mb-4 small rounded-3 border-0 shadow-sm">
            <i class="fa fa-exclamation-triangle me-2"></i> {{ error }}
          </div>

          <div v-if="step === 1">
            <div class="mb-4">
              <h3 class="fw-bold text-dark">Personal Information</h3>
              <p class="text-muted small">Required for academic record verification.</p>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Full Name</label>
                <input v-model="form.full_name" type="text" class="form-control bg-light border-0 py-2" placeholder="Jane Doe">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Username</label>
                <input v-model="form.username" type="text" class="form-control bg-light border-0 py-2" placeholder="janedoe">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">
                  {{ isLecturer ? 'Staff ID' : 'Reg. Number' }}
                </label>
                <input v-model="form.registration_number" type="text" class="form-control bg-light border-0 py-2" placeholder="STF/100 or BSCS/101">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Phone</label>
                <input v-model="form.phone_number" type="tel" class="form-control bg-light border-0 py-2" placeholder="+254...">
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Email Address</label>
                <input v-model="form.email" type="email" class="form-control bg-light border-0 py-2" placeholder="name@tum.ac.ke">
              </div>

              <template v-if="!isLecturer">
                <div class="col-md-8">
                  <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Program</label>
                  <select v-model="form.program" class="form-select bg-light border-0 py-2">
                    <option value="" disabled>Select your program</option>
                    <option v-for="p in programs" :key="p.id" :value="p.code">
                      {{ p.name }} ({{ p.code }})
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Year</label>
                  <div class="btn-group w-100">
                    <button v-for="y in 4" :key="y" type="button" 
                            class="btn btn-sm btn-outline-secondary" 
                            :class="{ 'active': form.year_of_study === y }"
                            @click="form.year_of_study = y">Y{{ y }}</button>
                  </div>
                </div>
              </template>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-5">
              <RouterLink :to="{ name: 'auth-signin3' }" class="text-muted text-decoration-none small">Back to Login</RouterLink>
              <button @click="nextStep" class="btn btn-primary px-4 py-2 fw-bold">
                Continue <i class="fa fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          <div v-if="step === 2">
            <div class="mb-4">
              <h3 class="fw-bold text-dark">Account Security</h3>
              <p class="text-muted small">Choose a password to secure your academic records.</p>
            </div>

            <div class="card bg-light border-0 rounded-3 mb-4 p-3 shadow-sm">
              <div class="d-flex align-items-center gap-3">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 40px; height: 40px;">
                  {{ form.full_name?.charAt(0) }}
                </div>
                <div>
                  <div class="fw-bold text-dark">{{ form.full_name }}</div>
                  <div class="text-muted extra-small">{{ form.email }}</div>
                </div>
                <button @click="step = 1" class="btn btn-sm btn-link ms-auto text-decoration-none p-0">Edit Details</button>
              </div>
            </div>

            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Password</label>
                <input v-model="form.password" type="password" class="form-control bg-light border-0 py-2 mb-2" placeholder="Min. 8 characters">
                
                <div v-if="form.password" class="progress" style="height: 4px;">
                  <div class="progress-bar" :class="pwColorClass" :style="{ width: (pwStrength * 25) + '%' }"></div>
                </div>
              </div>

              <div class="mb-5">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Confirm Password</label>
                <input v-model="form.confirmPassword" type="password" class="form-control bg-light border-0 py-2" placeholder="Repeat password">
              </div>

              <div class="d-flex justify-content-between align-items-center">
                <button type="button" @click="step = 1" class="btn btn-link text-muted text-decoration-none px-0">Go Back</button>
                <button type="submit" class="btn btn-primary px-5 py-2 fw-bold d-flex align-items-center gap-2" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                  Create Account <i class="fa fa-check"></i>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rounded-4 { border-radius: 1.5rem !important; }
.tracking-wider { letter-spacing: 0.1em; }
.extra-small { font-size: 0.75rem; }

.form-control:focus, .form-select:focus {
  background-color: #f8f9fa;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border: none;
}
</style>