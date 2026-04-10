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

// Hold the classes fetched from the backend
const cohorts = ref([]);

const form = reactive({
  username: "",
  email: "",
  registration_number: "",
  phone_number: "",
  password: "",
  confirmPassword: "",
  full_name: "",
  cohort_id: "", // Changed from program/year to cohort_id
});

const error   = ref("");
const loading = ref(false);
const step    = ref(1);

// Fetch Classes (Cohorts) from backend on mount
onMounted(async () => {
  if (!isLecturer.value) {
    try {
      const { data } = await api.get("/academic/cohorts");
      cohorts.value = data.items || data;
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  }
});

function nextStep() {
  error.value = "";
  if (!form.full_name || !form.username || !form.registration_number || !form.phone_number || !form.email) {
    error.value = "Please fill in all required fields before continuing.";
    return;
  }
  // Require Class selection for students
  if (!isLecturer.value && !form.cohort_id) {
    error.value = "Please select your Class.";
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
    
    // FIX: Convert empty strings to null and strings to integers to prevent FastAPI 500 crashes
    payload.cohort_id = payload.cohort_id ? parseInt(payload.cohort_id) : null;

    const ok = await authStore.signup(payload);

    if (ok) {
      router.push({ name: "auth-signin3" });
    }
  } catch (err) {
    error.value = err.response?.data?.detail || "A server error occurred. Please check your inputs.";
  } finally {
    loading.value = false;
  }
}

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
              <div class="rounded-circle d-flex align-items-center justify-content-center border border-2 shadow-sm" style="width: 32px; height: 32px;" :class="step >= 1 ? 'bg-white text-dark border-white' : 'text-white border-white opacity-50'">
                <i v-if="step > 1" class="fa fa-check small"></i>
                <span v-else>1</span>
              </div>
              <span class="fw-bold" :class="step === 1 ? 'opacity-100' : 'opacity-50'">Personal Profile</span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center border border-2 shadow-sm" style="width: 32px; height: 32px;" :class="step === 2 ? 'bg-white text-dark border-white' : 'text-white border-white opacity-50'">
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
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Target Class (Cohort)</label>
                  <select v-model="form.cohort_id" class="form-select bg-light border-0 py-2">
                    <option value="" disabled>Select your registered class...</option>
                    <option v-for="c in cohorts" :key="c.id" :value="c.id">
                      {{ c.name }} (Year {{ c.year_of_study }})
                    </option>
                  </select>
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
            </div>
            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Password</label>
                <input v-model="form.password" type="password" class="form-control bg-light border-0 py-2 mb-2" placeholder="Min. 8 characters">
              </div>
              <div class="mb-5">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Confirm Password</label>
                <input v-model="form.confirmPassword" type="password" class="form-control bg-light border-0 py-2" placeholder="Repeat password">
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <button type="button" @click="step = 1" class="btn btn-link text-muted text-decoration-none px-0">Go Back</button>
                <button type="submit" class="btn btn-primary px-5 py-2 fw-bold" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>