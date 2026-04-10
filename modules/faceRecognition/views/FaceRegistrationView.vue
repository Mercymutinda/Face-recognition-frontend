<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useAlert } from "@/composables/alerts";
import api from "@/utils/api";

const authStore = useAuthStore();
const { toastSuccess, toastError } = useAlert();

// Upload State
const file = ref(null);
const preview = ref(null);
const uploading = ref(false);

// Live Scan State
const scanning = ref(false);
const scanResult = ref(null);
let scanTimer = null;

function onFileChange(e) {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    preview.value = URL.createObjectURL(selectedFile);
  }
}

async function uploadPhoto() {
  if (!file.value) {
    toastError("Missing File", "Please choose a photo first.");
    return;
  }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file.value);
    
    // Calls your backend: POST /face/upload
    await api.post("/face/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    toastSuccess("Success", "Photo uploaded and biometric data extracted successfully.");
    file.value = null;
    preview.value = null;
  } catch (e) {
    toastError("Upload Failed", e.response?.data?.detail || e.message);
  } finally {
    uploading.value = false;
  }
}

function startLiveScan() {
  scanning.value = true;
  scanResult.value = null;
  let progress = 0;
  
  // Simulating the live scan process before sending to backend
  scanTimer = setInterval(async () => {
    progress += 10;
    if (progress >= 100) {
      clearInterval(scanTimer);
      scanning.value = false;
      
      try {
        // Calls your backend: POST /face/live-scan
        const { data } = await api.post("/face/live-scan");
        scanResult.value = { success: true, message: data.message || "Biometrics registered successfully." };
        toastSuccess("Scan Complete", "Your face has been securely registered.");
      } catch (e) {
        scanResult.value = { success: false, message: "Scan failed. Try again in a brighter environment." };
        toastError("Scan Failed", e.response?.data?.detail || "Could not detect face.");
      }
    }
  }, 200);
}
</script>

<template>
  <BasePageHeading 
    title="Face Registration" 
    subtitle="Register your biometric data for attendance and exam authentication"
  />

  <div class="content">
    <div class="row g-4">
      
      <div class="col-md-6">
        <BaseCard>
          <template #header>
            <h5 class="mb-0 text-dark"><i class="fa fa-image me-2 text-primary"></i>Upload Photo</h5>
          </template>

          <p class="text-muted small">
            Upload a clear, well-lit photo of your face. Ensure there are no obstructions like sunglasses or heavy masks.
          </p>

          <div class="mb-4">
            <label class="form-label fw-medium">Select Image</label>
            <input
              type="file"
              class="form-control"
              accept="image/jpeg, image/png"
              @change="onFileChange"
              :disabled="uploading"
            />
          </div>

          <div v-if="preview" class="mb-4 text-center p-3 bg-light rounded-3 border">
            <img
              :src="preview"
              alt="Face Preview"
              style="max-height: 180px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
            />
          </div>

          <template #footer>
            <button
              class="btn btn-primary w-100 fw-medium"
              @click="uploadPhoto"
              :disabled="uploading || !file"
            >
              <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fa fa-cloud-upload-alt me-2"></i>
              {{ uploading ? 'Processing Biometrics...' : 'Extract & Save Biometrics' }}
            </button>
          </template>
        </BaseCard>
      </div>

      <div class="col-md-6">
        <BaseCard>
          <template #header>
            <h5 class="mb-0 text-dark"><i class="fa fa-camera me-2 text-success"></i>Live Camera Scan</h5>
          </template>

          <p class="text-muted small">
            Stand directly in front of the camera. The system will capture multiple angles to build a highly accurate 3D embedding of your face.
          </p>

          <div class="camera-viewport d-flex align-items-center justify-content-center mb-4">
            
            <div v-if="scanning" class="scan-overlay"></div>
            <div v-if="scanning" class="scan-line"></div>
            
            <div v-if="!scanning && !scanResult" class="text-center text-muted opacity-50">
              <i class="fa fa-camera" style="font-size: 40px;"></i>
              <div class="small mt-2 fw-medium">Camera Ready</div>
            </div>
            
            <div v-if="scanResult" class="text-center" :class="scanResult.success ? 'text-success' : 'text-danger'">
              <div style="font-size: 40px;">
                <i :class="scanResult.success ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
              </div>
              <div class="small mt-2 fw-medium">{{ scanResult.message }}</div>
            </div>

            <div class="bracket top-left"></div>
            <div class="bracket top-right"></div>
            <div class="bracket bottom-left"></div>
            <div class="bracket bottom-right"></div>
          </div>

          <ul class="list-unstyled small text-muted mb-0">
            <li class="mb-1"><i class="fa fa-check text-success me-2"></i>Face camera directly (do not tilt head)</li>
            <li class="mb-1"><i class="fa fa-check text-success me-2"></i>Ensure you are in a well-lit room</li>
            <li><i class="fa fa-check text-success me-2"></i>Remove any hats or sunglasses</li>
          </ul>

          <template #footer>
            <button
              class="btn btn-success w-100 fw-medium"
              @click="startLiveScan"
              :disabled="scanning"
            >
              <span v-if="scanning" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fa fa-video me-2"></i>
              {{ scanning ? "Scanning Face..." : "Start Live Scan" }}
            </button>
          </template>
        </BaseCard>
      </div>

    </div>
  </div>
</template>

<style scoped>
.camera-viewport {
  width: 100%;
  height: 220px;
  background-color: #f1f5f9;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.scan-overlay {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(35, 86, 215, 0.05),
    rgba(35, 86, 215, 0.05) 1px,
    transparent 1px,
    transparent 24px
  );
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2356d7, transparent);
  animation: scanDown 2s ease-in-out infinite;
}

@keyframes scanDown {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: calc(100% - 2px); opacity: 0; }
}

/* Corner focus brackets */
.bracket {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #2356d7;
  border-style: solid;
  opacity: 0.5;
}
.top-left { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-top-left-radius: 6px; }
.top-right { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-top-right-radius: 6px; }
.bottom-left { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-bottom-left-radius: 6px; }
.bottom-right { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-bottom-right-radius: 6px; }
</style>