<script setup>
import { ref, onUnmounted } from "vue";
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
const videoRef = ref(null);
const canvasRef = ref(null);
let stream = null;

onUnmounted(() => {
  stopCamera();
});

// --- 1. FILE UPLOAD LOGIC ---
function onFileChange(e) {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    preview.value = URL.createObjectURL(selectedFile);
  }
}

async function uploadPhoto() {
  if (!file.value) return toastError("Missing File", "Please choose a photo first.");
  
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file.value);
    
    // Hit the student face upload route which actually extracts the AI embedding
    await api.post(`/students/${authStore.user.id}/face/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    toastSuccess("Success", "Photo uploaded and biometric data extracted successfully.");
    file.value = null;
    preview.value = null;
  } catch (e) {
    toastError("Upload Failed", e.response?.data?.detail || "Could not process face.");
  } finally {
    uploading.value = false;
  }
}

// --- 2. LIVE WEBCAM LOGIC ---
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

async function startLiveScan() {
  scanning.value = true;
  scanResult.value = null;
  
  try {
    // 1. Request Webcam Access
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) videoRef.value.srcObject = stream;
    
    // 2. Wait 3 seconds for the user to pose, then capture
    setTimeout(captureAndSend, 3000);
  } catch (e) {
    scanning.value = false;
    toastError("Camera Error", "Please allow webcam access in your browser.");
  }
}

async function captureAndSend() {
  if (!videoRef.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  canvas.getContext("2d").drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const fd = new FormData();
    fd.append("file", blob, "live_scan.jpg");

    try {
      await api.post(`/students/${authStore.user.id}/face/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      scanResult.value = { success: true, message: "Biometrics registered successfully." };
      toastSuccess("Scan Complete", "Your face has been securely registered.");
    } catch (e) {
      scanResult.value = { success: false, message: e.response?.data?.detail || "Could not detect face." };
      toastError("Scan Failed", e.response?.data?.detail || "Ensure you are well lit.");
    } finally {
      stopCamera();
      scanning.value = false;
    }
  }, "image/jpeg", 0.9);
}
</script>

<template>
  <BasePageHeading title="Face Registration" subtitle="Register your biometric data for attendance and exams"/>

  <div class="content">
    <div class="row g-4">
      
      <div class="col-md-6">
        <BaseCard>
          <template #header>
            <h5 class="mb-0 text-dark"><i class="fa fa-image me-2 text-primary"></i>Upload Photo</h5>
          </template>

          <p class="text-muted small">Upload a clear, well-lit photo of your face.</p>

          <div class="mb-4">
            <input type="file" class="form-control" accept="image/jpeg, image/png" @change="onFileChange" :disabled="uploading" />
          </div>

          <div v-if="preview" class="mb-4 text-center p-3 bg-light rounded-3 border">
            <img :src="preview" style="max-height: 180px; border-radius: 8px; object-fit: cover;" />
          </div>

          <template #footer>
            <button class="btn btn-primary w-100 fw-medium" @click="uploadPhoto" :disabled="uploading || !file">
              <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fa fa-cloud-upload-alt me-2"></i>
              {{ uploading ? 'Processing...' : 'Extract & Save Biometrics' }}
            </button>
          </template>
        </BaseCard>
      </div>

      <div class="col-md-6">
        <BaseCard>
          <template #header>
            <h5 class="mb-0 text-dark"><i class="fa fa-camera me-2 text-success"></i>Live Camera Scan</h5>
          </template>

          <p class="text-muted small">Stand directly in front of the camera.</p>

          <div class="camera-viewport d-flex align-items-center justify-content-center mb-4 bg-dark">
            
            <video ref="videoRef" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;" v-show="scanning"></video>
            <canvas ref="canvasRef" style="display: none;"></canvas>
            
            <div v-if="scanning" class="scan-overlay"></div>
            <div v-if="scanning" class="scan-line"></div>
            
            <div v-if="!scanning && !scanResult" class="text-center text-white opacity-50">
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

          <template #footer>
            <button class="btn btn-success w-100 fw-medium" @click="startLiveScan" :disabled="scanning">
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
  width: 100%; height: 220px; border-radius: 12px; position: relative; overflow: hidden;
}
.scan-overlay {
  position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(35, 86, 215, 0.05), rgba(35, 86, 215, 0.05) 1px, transparent 1px, transparent 24px);
}
.scan-line {
  position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #2356d7, transparent); animation: scanDown 2s ease-in-out infinite;
}
@keyframes scanDown { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: calc(100% - 2px); opacity: 0; } }
.bracket { position: absolute; width: 24px; height: 24px; border-color: #2356d7; border-style: solid; opacity: 0.5; }
.top-left { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-top-left-radius: 6px; }
.top-right { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-top-right-radius: 6px; }
.bottom-left { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-bottom-left-radius: 6px; }
.bottom-right { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-bottom-right-radius: 6px; }
</style>