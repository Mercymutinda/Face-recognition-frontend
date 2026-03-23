<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";

const authStore = useAuthStore();
const file = ref(null);
const preview = ref(null);
const uploading = ref(false);
const uploadMsg = ref("");
const scanning = ref(false);
const scanResult = ref(null);
let scanTimer = null;

function onFileChange(e) {
  file.value = e.target.files[0];
  preview.value = URL.createObjectURL(file.value);
  uploadMsg.value = "";
}

async function upload() {
  if (!file.value) {
    alert("Please choose a photo first.");
    return;
  }
  uploading.value = true;
  uploadMsg.value = "";
  try {
    const fd = new FormData();
    fd.append("file", file.value);
    await api.post("/face/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    uploadMsg.value = "✅ Photo uploaded successfully.";
  } catch (e) {
    uploadMsg.value =
      "❌ Upload failed: " + (e.response?.data?.detail || e.message);
  } finally {
    uploading.value = false;
  }
}

function startLiveScan() {
  if (!authStore.userCan("face:live_scan")) return;
  scanning.value = true;
  scanResult.value = null;
  let progress = 0;
  scanTimer = setInterval(async () => {
    progress += 10;
    if (progress >= 100) {
      clearInterval(scanTimer);
      scanning.value = false;
      // POST to backend
      try {
        const { data } = await api.post("/face/live-scan");
        scanResult.value = {
          success: true,
          message: data.message || "Scan complete.",
        };
      } catch {
        scanResult.value = {
          success: false,
          message: "Scan failed. Try again.",
        };
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
      <!-- Upload -->
      <div v-if="authStore.userCan('face:upload')" class="col-md-6">
        <BaseBlock title="📸 Upload Photo">
          <p class="text-muted mb-3" style="font-size: 13px">
            Upload a clear, well-lit photo of your face. No glasses or
            obstructions.
          </p>
          <div class="mb-3">
            <label class="form-label fw-medium">Choose Photo</label>
            <input
              type="file"
              class="form-control"
              accept="image/*"
              @change="onFileChange"
            />
          </div>
          <div v-if="preview" class="mb-3 text-center">
            <img
              :src="preview"
              alt="Preview"
              style="
                max-height: 180px;
                border-radius: 10px;
                object-fit: cover;
                border: 2px solid rgba(65, 90, 32, 0.2);
              "
            />
          </div>
          <div
            v-if="uploadMsg"
            class="alert py-2 mb-3"
            :class="
              uploadMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'
            "
            style="font-size: 13px"
          >
            {{ uploadMsg }}
          </div>
          <button
            class="btn btn-primary w-100"
            @click="upload"
            :disabled="uploading || !file"
          >
            <span
              v-if="uploading"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            <i v-else class="si si-cloud-upload me-1"></i>
            Upload Photo
          </button>
        </BaseBlock>
      </div>

      <!-- Live scan -->
      <div v-if="authStore.userCan('face:live_scan')" class="col-md-6">
        <BaseBlock title="🎥 Live Scan">
          <p class="text-muted mb-3" style="font-size: 13px">
            Stand in front of the camera. The system will capture multiple
            angles for better accuracy.
          </p>
          <!-- Simulated camera -->
          <div
            style="
              width: 100%;
              height: 180px;
              background: #0d1008;
              border-radius: 10px;
              position: relative;
              overflow: hidden;
              margin-bottom: 16px;
            "
          >
            <div
              v-if="scanning"
              style="
                position: absolute;
                inset: 0;
                background: repeating-linear-gradient(
                  0deg,
                  rgba(65, 90, 32, 0.07),
                  rgba(65, 90, 32, 0.07) 1px,
                  transparent 1px,
                  transparent 24px
                );
              "
            ></div>
            <div v-if="scanning" class="scan-line"></div>
            <div
              v-if="!scanning && !scanResult"
              class="d-flex align-items-center justify-content-center h-100"
              style="color: #415a20; opacity: 0.35"
            >
              <div class="text-center">
                <i class="si si-camera" style="font-size: 36px"></i>
                <div style="font-size: 12px; margin-top: 6px">Camera ready</div>
              </div>
            </div>
            <div
              v-if="scanResult"
              class="d-flex align-items-center justify-content-center h-100"
            >
              <div
                class="text-center"
                :style="{ color: scanResult.success ? '#415A20' : '#c0392b' }"
              >
                <div style="font-size: 36px">
                  {{ scanResult.success ? "✅" : "❌" }}
                </div>
                <div style="font-size: 13px; margin-top: 6px">
                  {{ scanResult.message }}
                </div>
              </div>
            </div>
          </div>

          <ul
            class="list-unstyled mb-3"
            style="font-size: 12.5px; color: #6b5042"
          >
            <li>✔ Face camera directly — no tilting</li>
            <li>✔ Ensure good lighting</li>
            <li>✔ Remove sunglasses or masks</li>
          </ul>

          <button
            class="btn btn-primary w-100"
            @click="startLiveScan"
            :disabled="scanning"
          >
            <span
              v-if="scanning"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            <i v-else class="si si-camera me-1"></i>
            {{ scanning ? "Scanning…" : "Start Live Scan" }}
          </button>
        </BaseBlock>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e65f0e, transparent);
  animation: scanDown 2s linear infinite;
}
@keyframes scanDown {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 2px);
  }
  100% {
    top: 0;
  }
}
</style>
