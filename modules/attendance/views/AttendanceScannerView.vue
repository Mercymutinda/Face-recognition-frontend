<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore"; // Fixed import path
import api from "@/utils/api";
import { useAcademicSetupStore } from "@/stores/academicStore"; // Fixed import path

const route = useRoute();
const authStore = useAuthStore();
const acadStore = useAcademicSetupStore();

const sessionId = ref(null);
const scanning = ref(false);
const recognized = ref([]);
const scannedCount = ref(0);

const selUnit = ref(route.query.unit || "");
const selClass = ref(route.query.class || "");
const selHall = ref(route.query.hall || "");

// Webcam References
const videoRef = ref(null);
const canvasRef = ref(null);
let stream = null;
let scanTimer = null;

onMounted(() => {
  acadStore.fetchUnits();
  acadStore.fetchClasses();
  acadStore.fetchHalls();
});

onUnmounted(() => {
  stopCamera();
});

// 1. Initialize Webcam
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access the camera. Please allow camera permissions.");
  }
}

// 2. Stop Webcam
function stopCamera() {
  if (scanTimer) clearInterval(scanTimer);
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

async function startSession() {
  if (!selUnit.value || !selClass.value) {
    alert("Please select a unit and a class.");
    return;
  }

  try {
    const { data } = await api.post("/academic/sessions", {
      unit_id: parseInt(selUnit.value),
      cohort_id: parseInt(selClass.value), 
      hall_id: selHall.value ? parseInt(selHall.value) : null,
      lecturer_id: authStore.user.id // <--- ADD THIS LINE
    });
    // Handle standard dict or SQLAlchemy object return
    sessionId.value = data.id || data.session_id; 
    
    scanning.value = true;
    recognized.value = [];
    scannedCount.value = 0;

    // Start the live video feed
    await startCamera();

    // 3. Take a snapshot every 3 seconds and send it to the backend AI
    scanTimer = setInterval(captureAndScan, 3000);

  } catch (error) {
    console.error("Failed to start session:", error);
    alert(error.response?.data?.detail || "Could not start session. Does the /academic/sessions POST route exist in Python?");
  }
}
async function captureAndScan() {
  if (!videoRef.value || !canvasRef.value || !sessionId.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const fd = new FormData();

  // 🔥 FIX: Capture 3 frames with a 300ms delay to detect micro-movements
  for (let i = 0; i < 3; i++) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.8));
    
    // Notice the key is "files" (plural) to match the backend!
    if (blob) fd.append("files", blob, `frame_${i}.jpg`); 
    
    if (i < 2) await new Promise(r => setTimeout(r, 300)); 
  }

  try {
    const { data } = await api.post(`/attendance/scan?session_id=${sessionId.value}`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (data.users_present && data.users_present.length > 0) {
      data.users_present.forEach(name => {
        const alreadyScanned = recognized.value.find(r => r.name === name);
        if (!alreadyScanned) {
          recognized.value.unshift({ 
            name: name, 
            status: "Present", 
            ts: new Date().toLocaleTimeString() 
          });
          scannedCount.value++;
        }
      });
    }
  } catch (e) {
    if (e.response?.status !== 400) console.warn("Scan processing error:", e);
  }
}

async function endSession() {
  stopCamera();
  if (sessionId.value) {
    // FIX: Hitting the correct Academic end session endpoint
    await api.patch(`/academic/sessions/${sessionId.value}/end`).catch(() => {});
  }
  scanning.value = false;
  sessionId.value = null;
}
</script>

<template>
  <BasePageHeading title="Attendance Scanner" subtitle="Live Biometric Feed"/>

  <div class="content">
    <div class="row g-4">
      <div class="col-lg-4">
        <BaseBlock title="Session Setup">
          <div class="mb-3">
            <label class="form-label fw-medium">Unit *</label>
            <select v-model="selUnit" class="form-select" :disabled="scanning">
              <option value="">— Select unit —</option>
              <option v-for="u in acadStore.units" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label fw-medium">Class / Cohort *</label>
            <select v-model="selClass" class="form-select" :disabled="scanning">
              <option value="">— Select class —</option>
              <option v-for="c in acadStore.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="form-label fw-medium">Hall</label>
            <select v-model="selHall" class="form-select" :disabled="scanning">
              <option value="">— Optional —</option>
              <option v-for="h in acadStore.halls" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div class="d-grid gap-2">
            <button v-if="!scanning" class="btn btn-primary" @click="startSession">
              <i class="si si-camera me-2"></i> Start Live Scanner
            </button>
            <button v-else class="btn btn-danger" @click="endSession">
              <i class="si si-close me-2"></i> End Session
            </button>
          </div>
          <div v-if="sessionId" class="mt-3 text-center">
            <span class="badge bg-success px-3 py-2">Session #{{ sessionId }} — Live</span>
          </div>
        </BaseBlock>
      </div>

      <div class="col-lg-8">
        <BaseBlock title="Live Camera Feed">
          <div style="width:100%;height:340px;background:#0d1008;border-radius:10px;
                      position:relative;overflow:hidden;margin-bottom:16px;display:flex;align-items:center;justify-content:center;">
            
            <video ref="videoRef" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;" v-show="scanning"></video>
            
            <canvas ref="canvasRef" style="display: none;"></canvas>

            <div v-if="scanning" style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(65,90,32,.06),rgba(65,90,32,.06) 1px,transparent 1px,transparent 28px);pointer-events:none;"></div>
            <div v-if="scanning" class="scan-line"></div>
            
            <div v-for="pos in ['top:8px;left:8px;border-top:2px solid #E65F0E;border-left:2px solid #E65F0E;', 'top:8px;right:8px;border-top:2px solid #E65F0E;border-right:2px solid #E65F0E;', 'bottom:8px;left:8px;border-bottom:2px solid #E65F0E;border-left:2px solid #E65F0E;', 'bottom:8px;right:8px;border-bottom:2px solid #E65F0E;border-right:2px solid #E65F0E;']"
              :key="pos" :style="`position:absolute;width:20px;height:20px;${pos}`"></div>

            <div v-if="!scanning" class="text-center" style="color:#415A20;opacity:.4;">
              <i class="si si-camera" style="font-size:40px;"></i>
              <div style="font-size:12px;margin-top:8px;">Camera offline — start a session</div>
            </div>
            
            <div v-else style="position:absolute;bottom:12px;right:12px;display:flex;gap:6px;align-items:center;">
              <div style="width:8px;height:8px;border-radius:50%;background:#E65F0E;animation:pulse 1s infinite;"></div>
              <span style="color:#E65F0E;font-size:11px;font-family:'DM Mono',monospace;">LIVE REC</span>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold" style="font-size:13px;">AI Recognition Log</span>
            <span class="badge" style="background:#415A20;">{{ scannedCount }} present</span>
          </div>
          
          <div style="max-height:240px;overflow-y:auto;">
            <div v-for="r in recognized" :key="r.name + r.ts" class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid rgba(0,0,0,.06);font-size:13px;">
              <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#415A20,#E65F0E);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">
                {{ r.name.split(" ").map(w => w[0]).join("").substring(0,2) }}
              </div>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ r.name }}</div>
              </div>
              <div class="text-end flex-shrink-0">
                <div><span class="badge bg-success">{{ r.status }}</span></div>
                <div class="text-muted" style="font-size:10px;">{{ r.ts }}</div>
              </div>
            </div>
            <div v-if="!recognized.length" class="text-center text-muted py-4" style="font-size:13px;">
              Face detection log will appear here in real-time.
            </div>
          </div>
        </BaseBlock>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
.scan-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #E65F0E, transparent);
  animation: scanDown 2.5s linear infinite;
  pointer-events: none;
}
@keyframes scanDown {
  0%   { top: 0; }
  50%  { top: calc(100% - 2px); }
  100% { top: 0; }
}
</style>