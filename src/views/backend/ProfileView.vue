<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/authStore"
import { useAlert } from "@/composables/alerts";
import api from "@/utils/api";

const authStore = useAuthStore();
const { toastSuccess, toastError } = useAlert();

// ── Tab state ─────────────────────────────────────────────────────
const activeTab = ref("details");

// ── Personal Details ──────────────────────────────────────────────
const detailsForm = ref({
  title: authStore.user?.title || "",
  first_name: authStore.user?.first_name || "",
  middle_name: authStore.user?.middle_name || "",
  last_name: authStore.user?.last_name || "",
  gender: authStore.user?.gender || "",
  marital_status: authStore.user?.marital_status || "",
  date_of_birth: authStore.user?.date_of_birth || "",
  identification_type: authStore.user?.identification_type || "",
  identification_number: authStore.user?.identification_number || "",
  has_disability: authStore.user?.has_disability || false,
  email: authStore.user?.email || "",
  phone_number: authStore.user?.phone_number || "",
  loading: false
});

async function updatePersonalDetails() {
  detailsForm.value.loading = true;
  try {
    const payload = { ...detailsForm.value };
    delete payload.loading; 
    
    const { data } = await api.patch(`/users/${authStore.user.id}`, payload);
    
    // 🔥 THE FIX: Convert role objects back to simple strings for the authStore!
    if (data.roles && data.roles.length > 0 && typeof data.roles[0] === 'object') {
      data.roles = data.roles.map(r => r.name);
    }
    
    // Update local store so the UI updates instantly
    Object.assign(authStore.user, data);
    toastSuccess("Success", "Personal details updated successfully.");
  } catch (e) {
    toastError("Update Failed", "Could not save details.");
  } finally {
    detailsForm.value.loading = false;
  }
}
// ── Password change ───────────────────────────────────────────────
const passForm = ref({ current: "", new: "", confirm: "", loading: false });
const pwVisible = ref({ current: false, new: false, confirm: false });

const pwStrength = computed(() => {
  const p = passForm.value.new;
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8)        s++;
  if (/[A-Z]/.test(p))      s++;
  if (/[0-9]/.test(p))      s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
});
const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const pwStrengthClass = ["", "bg-danger", "bg-warning", "bg-success", "bg-primary"];

async function updatePassword() {
  if (passForm.value.new !== passForm.value.confirm)
    return toastError("Mismatch", "Passwords do not match.");
  if (passForm.value.new.length < 8)
    return toastError("Too Short", "Password must be at least 8 characters.");

  passForm.value.loading = true;
  try {
    await api.patch(`/users/${authStore.user.id}`, { password: passForm.value.new });
    toastSuccess("Updated", "Password changed successfully.");
    passForm.value.current = passForm.value.new = passForm.value.confirm = "";
  } catch {
    toastError("Failed", "Could not update password.");
  } finally {
    passForm.value.loading = false;
  }
}

// ── Biometrics ────────────────────────────────────────────────────
const file      = ref(null);
const preview   = ref(null);
const uploading = ref(false);
const imageKey  = ref(Date.now());

const activeFaceUrl = computed(() =>
  authStore.user
    ? `/api/students/${authStore.user.id}/face/image?t=${imageKey.value}`
    : ""
);

const scanning   = ref(false);
const scanResult = ref(null);
const videoRef   = ref(null);
const canvasRef  = ref(null);
let stream = null;

onUnmounted(() => stopCamera());

function onFileChange(e) {
  const f = e.target.files[0];
  if (f) { file.value = f; preview.value = URL.createObjectURL(f); }
}

function handleSuccess() {
  authStore.user.is_biometrics_registered = true;
  imageKey.value = Date.now();
  file.value = null;
  preview.value = null;
}

async function uploadPhoto() {
  if (!file.value) return toastError("Missing File", "Please choose a photo first.");
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file.value);
    await api.post(`/students/${authStore.user.id}/face/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    handleSuccess();
    toastSuccess("Success", "Biometrics updated successfully.");
  } catch (e) {
    toastError("Upload Failed", e.response?.data?.detail || "Could not process face.");
  } finally {
    uploading.value = false;
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

async function startLiveScan() {
  scanning.value  = true;
  scanResult.value = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) videoRef.value.srcObject = stream;
    setTimeout(captureAndSend, 3000);
  } catch {
    scanning.value = false;
    toastError("Camera Error", "Please allow webcam access.");
  }
}

async function captureAndSend() {
  if (!videoRef.value || !canvasRef.value) return;
  const canvas = canvasRef.value;
  canvas.width  = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  canvas.getContext("2d").drawImage(videoRef.value, 0, 0);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const fd = new FormData();
    fd.append("file", blob, "live_scan.jpg");
    try {
      await api.post(`/students/${authStore.user.id}/face/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleSuccess();
      scanResult.value = { success: true, message: "Biometrics registered securely." };
      toastSuccess("Done", "Your face has been securely registered.");
    } catch (e) {
      scanResult.value = { success: false, message: "Could not process face." };
      toastError("Failed", e.response?.data?.detail || "Ensure you are well lit.");
    } finally {
      stopCamera();
      scanning.value = false;
    }
  }, "image/jpeg", 0.9);
}

// ── Helpers ───────────────────────────────────────────────────────
function initials() {
  return (authStore.user?.full_name || authStore.user?.username || "?")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const roleBadgeClass = computed(() => {
  const r = authStore.primaryRole;
  if (r === "ADMIN")    return "bg-danger-subtle text-danger border border-danger-subtle";
  if (r === "LECTURER") return "bg-primary-subtle text-primary border border-primary-subtle";
  return "bg-success-subtle text-success border border-success-subtle";
});
</script>

<template>
  <BasePageHeading title="My Profile" subtitle="Manage your account settings and biometric data" />

  <div class="content" v-if="authStore.user">

    <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
      <div class="bg-primary" style="height: 6px;"></div>
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">

          <div class="position-relative flex-shrink-0">
            <div
              class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow"
              style="width:88px;height:88px;font-size:30px;background:linear-gradient(135deg,#2356d7,#E65F0E);"
            >{{ initials() }}</div>
            <span
              class="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center border border-2 border-white"
              :class="authStore.user.is_biometrics_registered ? 'bg-success' : 'bg-warning'"
              style="width:24px;height:24px;"
              :title="authStore.user.is_biometrics_registered ? 'Biometrics active' : 'Biometrics not set'"
            >
              <i :class="authStore.user.is_biometrics_registered ? 'fa fa-check' : 'fa fa-exclamation'" class="text-white" style="font-size:10px;"></i>
            </span>
          </div>

          <div class="text-center text-sm-start flex-grow-1">
            <h4 class="fw-bold mb-1" style="font-size:1.25rem;">
              {{ authStore.user.full_name || authStore.user.username }}
            </h4>
            <p class="text-muted mb-2" style="font-size:13px;">
              {{ authStore.user.email }}
            </p>
            <div class="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2">
              <span :class="['badge rounded-pill px-3 py-2 fw-semibold', roleBadgeClass]" style="font-size:11px;">
                <i class="fa fa-shield-alt me-1"></i>{{ authStore.primaryRole }}
              </span>
              <span class="badge rounded-pill px-3 py-2 fw-semibold bg-body-secondary text-body" style="font-size:11px;">
                <i class="fa fa-id-card me-1 opacity-50"></i>{{ authStore.user.registration_number }}
              </span>
              <span v-if="authStore.user.is_biometrics_registered" class="badge rounded-pill px-3 py-2 fw-semibold bg-success-subtle text-success border border-success-subtle" style="font-size:11px;">
                <i class="fa fa-fingerprint me-1"></i>Biometrics Active
              </span>
              <span v-else class="badge rounded-pill px-3 py-2 fw-semibold bg-warning-subtle text-warning border border-warning-subtle" style="font-size:11px;">
                <i class="fa fa-exclamation-triangle me-1"></i>Biometrics Pending
              </span>
            </div>
          </div>

          <div class="ms-sm-auto flex-shrink-0">
            <button v-if="!authStore.user.is_biometrics_registered" class="btn btn-warning btn-sm px-3 fw-semibold" @click="activeTab = 'biometrics'">
              <i class="fa fa-fingerprint me-1"></i> Set Up Biometrics
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">

      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style="top:80px;">
          <div class="card-body p-2">
            <p class="text-uppercase text-muted px-3 pt-2 pb-1 mb-0" style="font-size:10px;letter-spacing:.1em;font-weight:600;">
              Account
            </p>
            <div class="nav flex-column">
              <button
                v-for="tab in [
                  { key: 'details',    icon: 'fa-user',        label: 'Personal Details' },
                  { key: 'security',   icon: 'fa-lock',        label: 'Security' },
                  { key: 'biometrics', icon: 'fa-fingerprint', label: 'Biometrics' },
                ]"
                :key="tab.key"
                class="btn btn-link text-start text-decoration-none d-flex align-items-center gap-3 px-3 py-2 rounded-3 mb-1 fw-medium"
                :class="activeTab === tab.key ? 'bg-primary-subtle text-primary' : 'text-body-secondary'"
                style="font-size:14px;"
                @click="activeTab = tab.key"
              >
                <i :class="['fa fa-fw', tab.icon, activeTab === tab.key ? 'text-primary' : 'opacity-50']"></i>
                {{ tab.label }}
                <span v-if="tab.key === 'biometrics'" class="ms-auto">
                  <span class="badge rounded-pill" :class="authStore.user.is_biometrics_registered ? 'bg-success' : 'bg-warning'" style="font-size:9px;padding:3px 7px;">
                    {{ authStore.user.is_biometrics_registered ? 'Active' : 'Pending' }}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-9">

        <div v-if="activeTab === 'details'" class="card border-0 shadow-sm rounded-4">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center" style="width:36px;height:36px;">
                <i class="fa fa-user text-primary" style="font-size:15px;"></i>
              </div>
              <div>
                <h5 class="mb-0 fw-bold">Personal Information</h5>
                <p class="mb-0 text-muted" style="font-size:12px;">Update your registered account details</p>
              </div>
            </div>
          </div>
          <div class="card-body p-4">

            <h6 class="fw-bold text-uppercase text-muted mb-3" style="font-size: 11px; letter-spacing: .08em;">Basic Details</h6>
            <div class="row g-3 mb-4">
              <div class="col-md-2">
                <label class="form-label" style="font-size:13px;font-weight:600;">Title</label>
                <select v-model="detailsForm.title" class="form-select bg-body-secondary border-0" style="font-size:14px;">
                  <option value="">...</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss.">Miss.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label" style="font-size:13px;font-weight:600;">First Name *</label>
                <input v-model="detailsForm.first_name" type="text" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
              <div class="col-md-3">
                <label class="form-label" style="font-size:13px;font-weight:600;">Middle Name</label>
                <input v-model="detailsForm.middle_name" type="text" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">Surname *</label>
                <input v-model="detailsForm.last_name" type="text" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>

              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">Gender</label>
                <select v-model="detailsForm.gender" class="form-select bg-body-secondary border-0" style="font-size:14px;">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">Date of Birth</label>
                <input v-model="detailsForm.date_of_birth" type="date" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">Marital Status</label>
                <select v-model="detailsForm.marital_status" class="form-select bg-body-secondary border-0" style="font-size:14px;">
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>

            <h6 class="fw-bold text-uppercase text-muted mb-3" style="font-size: 11px; letter-spacing: .08em;">Identification & Disability</h6>
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">System ID (Read Only)</label>
                <div class="form-control bg-light text-muted border-0 fw-medium" style="font-size:14px;">
                  <i class="fa fa-lock me-2 opacity-50"></i>{{ authStore.user.registration_number }}
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">ID Type</label>
                <select v-model="detailsForm.identification_type" class="form-select bg-body-secondary border-0" style="font-size:14px;">
                  <option value="">Select...</option>
                  <option value="National ID">National ID</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Passport">Passport</option>
                  <option value="Alien ID">Alien ID</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">ID Number</label>
                <input v-model="detailsForm.identification_number" type="text" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
              <div class="col-md-4">
                <label class="form-label" style="font-size:13px;font-weight:600;">Any Disability?</label>
                <select v-model="detailsForm.has_disability" class="form-select bg-body-secondary border-0" style="font-size:14px;">
                  <option :value="false">No</option>
                  <option :value="true">Yes</option>
                </select>
              </div>
            </div>

            <h6 class="fw-bold text-uppercase text-muted mb-3" style="font-size: 11px; letter-spacing: .08em;">Contact Info</h6>
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label" style="font-size:13px;font-weight:600;">Email Address *</label>
                <input v-model="detailsForm.email" type="email" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
              <div class="col-md-6">
                <label class="form-label" style="font-size:13px;font-weight:600;">Phone Number *</label>
                <input v-model="detailsForm.phone_number" type="text" class="form-control bg-body-secondary border-0" style="font-size:14px;" />
              </div>
            </div>

            <div class="d-flex justify-content-end border-top pt-4">
              <button 
                class="btn btn-primary px-4 fw-semibold" 
                @click="updatePersonalDetails" 
                :disabled="detailsForm.loading || !detailsForm.first_name || !detailsForm.last_name || !detailsForm.email"
              >
                <span v-if="detailsForm.loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="fa fa-save me-2"></i> Save Changes
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'security'" class="card border-0 shadow-sm rounded-4">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-warning-subtle rounded-3 d-flex align-items-center justify-content-center" style="width:36px;height:36px;">
                <i class="fa fa-lock text-warning" style="font-size:15px;"></i>
              </div>
              <div>
                <h5 class="mb-0 fw-bold">Change Password</h5>
                <p class="mb-0 text-muted" style="font-size:12px;">Update your account password</p>
              </div>
            </div>
          </div>
          <div class="card-body p-4">

            <div class="row g-2 mb-4">
              <div class="col-6 col-sm-3" v-for="tip in [
                { icon: 'fa-text-height', text: '8+ characters' },
                { icon: 'fa-font',        text: 'Uppercase letter' },
                { icon: 'fa-hashtag',     text: 'One number' },
                { icon: 'fa-star',        text: 'Special character' },
              ]" :key="tip.text">
                <div class="bg-body-secondary rounded-3 p-2 text-center">
                  <i :class="['fa fa-fw text-muted mb-1', tip.icon]"></i>
                  <div class="text-muted" style="font-size:11px;">{{ tip.text }}</div>
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold" style="font-size:13px;">New Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-body-secondary border-0"><i class="fa fa-lock text-muted" style="font-size:13px;"></i></span>
                  <input v-model="passForm.new" :type="pwVisible.new ? 'text' : 'password'" class="form-control border-0 bg-body-secondary" placeholder="New password" style="font-size:14px;" />
                  <button class="btn btn-outline-secondary border-0 bg-body-secondary" type="button" @click="pwVisible.new = !pwVisible.new"><i :class="['fa', pwVisible.new ? 'fa-eye-slash' : 'fa-eye']" style="font-size:13px;"></i></button>
                </div>
                <div v-if="passForm.new" class="mt-2">
                  <div class="d-flex gap-1 mb-1">
                    <div v-for="i in 4" :key="i" class="rounded-pill flex-fill" :class="i <= pwStrength ? pwStrengthClass[pwStrength] : 'bg-body-tertiary'" style="height:4px;transition:background .3s;"></div>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted" style="font-size:11px;">Strength</span>
                    <span :class="['fw-semibold', pwStrength <= 1 ? 'text-danger' : pwStrength === 2 ? 'text-warning' : pwStrength === 3 ? 'text-success' : 'text-primary']" style="font-size:11px;">{{ pwStrengthLabel[pwStrength] }}</span>
                  </div>
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold" style="font-size:13px;">Confirm Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-body-secondary border-0"><i class="fa fa-lock text-muted" style="font-size:13px;"></i></span>
                  <input v-model="passForm.confirm" :type="pwVisible.confirm ? 'text' : 'password'" class="form-control border-0 bg-body-secondary" :class="passForm.confirm && passForm.new !== passForm.confirm ? 'is-invalid' : passForm.confirm && passForm.new === passForm.confirm ? 'is-valid' : ''" placeholder="Confirm new password" style="font-size:14px;" />
                  <button class="btn btn-outline-secondary border-0 bg-body-secondary" type="button" @click="pwVisible.confirm = !pwVisible.confirm"><i :class="['fa', pwVisible.confirm ? 'fa-eye-slash' : 'fa-eye']" style="font-size:13px;"></i></button>
                  <div class="invalid-feedback">Passwords do not match.</div>
                  <div class="valid-feedback">Passwords match!</div>
                </div>
              </div>

              <div class="col-12 pt-2">
                <div class="d-flex align-items-center gap-3">
                  <button class="btn btn-primary px-4 fw-semibold" @click="updatePassword" :disabled="passForm.loading || !passForm.new || !passForm.confirm">
                    <span v-if="passForm.loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="fa fa-save me-2"></i> {{ passForm.loading ? 'Saving…' : 'Update Password' }}
                  </button>
                  <button class="btn btn-link text-muted text-decoration-none p-0 fw-medium" style="font-size:13px;" @click="passForm.new = passForm.confirm = passForm.current = ''">Clear</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'biometrics'">
          <div v-if="authStore.user.is_biometrics_registered" class="card border-0 rounded-4 mb-4 overflow-hidden" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-left:4px solid #22c55e !important;">
            <div class="card-body p-4">
              <div class="d-flex align-items-center gap-4 flex-wrap">
                <div class="position-relative flex-shrink-0">
                  <img :src="activeFaceUrl" alt="Current face" class="rounded-circle shadow border border-4 border-white object-fit-cover" style="width:80px;height:80px;" @error="$event.target.style.display='none'" />
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-1"><i class="fa fa-check-circle text-success"></i><h6 class="mb-0 fw-bold text-success">Biometric Profile Active</h6></div>
                  <p class="text-muted mb-0" style="font-size:13px;">Your face is registered and will be used for attendance and exam authentication.</p>
                </div>
                <span class="badge bg-success px-3 py-2 rounded-pill fw-semibold flex-shrink-0"><i class="fa fa-fingerprint me-1"></i>Enrolled</span>
              </div>
            </div>
          </div>

          <div v-else class="alert alert-warning d-flex align-items-start gap-3 rounded-4 border-0 mb-4" style="background:#fffbeb;border-left:4px solid #f59e0b !important;">
            <i class="fa fa-exclamation-triangle text-warning mt-1 flex-shrink-0" style="font-size:18px;"></i>
            <div>
              <div class="fw-bold mb-1">Biometrics Not Registered</div>
              <div style="font-size:13px;">You need to register your face to use attendance scanning and exam authentication.</div>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;"><i class="fa fa-image text-primary" style="font-size:15px;"></i></div>
                    <div><h6 class="mb-0 fw-bold">Upload Photo</h6><p class="mb-0 text-muted" style="font-size:12px;">Use a clear, well-lit face photo</p></div>
                  </div>
                </div>
                <div class="card-body p-4 d-flex flex-column gap-3">
                  <div class="row g-2">
                    <div class="col-4" v-for="tip in ['Face forward', 'Good lighting', 'No glasses']" :key="tip"><div class="bg-body-secondary rounded-3 p-2 text-center"><div class="text-muted" style="font-size:11px;">{{ tip }}</div></div></div>
                  </div>
                  <div>
                    <label class="form-label fw-semibold" style="font-size:13px;">Select Image</label>
                    <input type="file" class="form-control bg-body-secondary border-0" accept="image/jpeg, image/png" @change="onFileChange" :disabled="uploading" style="font-size:13px;" />
                    <div class="form-text">JPG or PNG · Max 5MB · Clear front-facing photo</div>
                  </div>
                  <div v-if="preview" class="text-center bg-body-secondary rounded-4 p-3">
                    <img :src="preview" class="rounded-circle shadow-sm object-fit-cover border border-4 border-white" style="width:100px;height:100px;" />
                    <div class="text-muted mt-2" style="font-size:12px;">Preview</div>
                  </div>
                  <div class="mt-auto pt-1">
                    <button class="btn btn-primary w-100 fw-semibold" @click="uploadPhoto" :disabled="uploading || !file">
                      <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="fa fa-cloud-upload-alt me-2"></i> {{ uploading ? 'Processing…' : 'Save Biometrics' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-6">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-success-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;"><i class="fa fa-camera text-success" style="font-size:15px;"></i></div>
                    <div><h6 class="mb-0 fw-bold">Live Scan</h6><p class="mb-0 text-muted" style="font-size:12px;">Capture directly from your webcam</p></div>
                  </div>
                </div>
                <div class="card-body p-4 d-flex flex-column gap-3">
                  <div class="rounded-4 overflow-hidden position-relative bg-dark d-flex align-items-center justify-content-center" style="height:180px;">
                    <video ref="videoRef" autoplay playsinline muted class="w-100 h-100 object-fit-cover" v-show="scanning"></video>
                    <canvas ref="canvasRef" class="d-none"></canvas>
                    <div v-if="scanning" class="position-absolute top-0 start-0 w-100 h-100 opacity-25" style="background:repeating-linear-gradient(0deg,rgba(35,86,215,.3) 1px,transparent 1px,transparent 24px);"></div>
                    <div v-if="scanning" class="scanline position-absolute start-0 end-0" style="height:2px;background:linear-gradient(90deg,transparent,#2356d7,transparent);animation:scanDown 2s ease-in-out infinite;"></div>
                    <template v-if="scanning">
                      <div class="position-absolute top-0 start-0 border-top border-start border-primary border-3 rounded-0" style="width:20px;height:20px;margin:10px;"></div>
                      <div class="position-absolute top-0 end-0 border-top border-end border-primary border-3 rounded-0" style="width:20px;height:20px;margin:10px;"></div>
                      <div class="position-absolute bottom-0 start-0 border-bottom border-start border-primary border-3 rounded-0" style="width:20px;height:20px;margin:10px;"></div>
                      <div class="position-absolute bottom-0 end-0 border-bottom border-end border-primary border-3 rounded-0" style="width:20px;height:20px;margin:10px;"></div>
                    </template>
                    <div v-if="!scanning && !scanResult" class="text-center text-white opacity-25"><i class="fa fa-camera mb-2" style="font-size:32px;display:block;"></i><div style="font-size:12px;">Camera idle</div></div>
                    <div v-if="scanResult" class="text-center p-3">
                      <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow" :class="scanResult.success ? 'bg-success' : 'bg-danger'" style="width:52px;height:52px;"><i :class="['fa text-white', scanResult.success ? 'fa-check' : 'fa-times']" style="font-size:22px;"></i></div>
                      <div :class="['fw-semibold', scanResult.success ? 'text-success' : 'text-danger']" style="font-size:13px;">{{ scanResult.message }}</div>
                    </div>
                    <div v-if="scanning" class="position-absolute bottom-0 end-0 d-flex align-items-center gap-2 p-2"><span class="badge bg-danger d-flex align-items-center gap-1 px-2 py-1" style="font-size:10px;"><span class="rounded-circle bg-white" style="width:6px;height:6px;animation:pulse 1s infinite;"></span>REC</span></div>
                  </div>
                  <div class="bg-body-secondary rounded-3 p-3">
                    <div class="row g-1 text-center"><div class="col-4" v-for="tip in ['Look straight', 'Stay still', '3 sec capture']" :key="tip"><div class="text-muted" style="font-size:11px;">{{ tip }}</div></div></div>
                  </div>
                  <div class="mt-auto">
                    <button class="btn btn-success w-100 fw-semibold" @click="startLiveScan" :disabled="scanning">
                      <span v-if="scanning" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="fa fa-video me-2"></i> {{ scanning ? 'Scanning in 3s…' : 'Start Live Scan' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <div v-else class="content">
    <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
      <div class="spinner-border text-primary mx-auto" style="width:2.5rem;height:2.5rem;"></div>
      <p class="text-muted mt-3 mb-0">Loading profile…</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes scanDown {
  0%   { top: 0; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: calc(100% - 2px); opacity: 0; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .3; }
}
</style>