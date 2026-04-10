<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore"; 
import api from "@/utils/api";

const acadStore = useAcademicSetupStore();
const authStore = useAuthStore(); 

const selUnit = ref("");
const selClass = ref(""); 
const selHall = ref("");
const results = ref([]);
const phase = ref("idle");

let examId = ref(null);
let scanTimer = null;
let stream = null;

// Webcam refs
const videoRef = ref(null);
const canvasRef = ref(null);

onMounted(() =>
  Promise.all([
    acadStore.fetchUnits(),
    acadStore.fetchHalls(),
    acadStore.fetchClasses(),
  ])
);

onUnmounted(() => {
  stopCamera();
});

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) videoRef.value.srcObject = stream;
  } catch (err) {
    alert("Camera access denied.");
  }
}

function stopCamera() {
  if (scanTimer) clearInterval(scanTimer);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

async function startAuth() {
  if (!selUnit.value || !selClass.value) {
    alert("Please select an exam unit and class first.");
    return;
  }

  try {
    const { data } = await api.post("/exams", {
      unit_id: parseInt(selUnit.value),
      cohort_id: parseInt(selClass.value),
      hall_id: selHall.value ? parseInt(selHall.value) : null,
      lecturer_id: authStore.user.id,
      title: "Live Exam Session",
    });

    examId.value = data.id;
    phase.value = "scanning";
    results.value = [];

    await startCamera();
    scanTimer = setInterval(captureAndAuth, 3000);
  } catch (e) {
    console.error(e);
    alert("Failed to start exam session. Ensure POST /exams exists in backend.");
  }
}

async function captureAndAuth() {
  if (!videoRef.value || !canvasRef.value || !examId.value) return;

  const canvas = canvasRef.value;
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  canvas
    .getContext("2d")
    .drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    async (blob) => {
      if (!blob) return;

      const fd = new FormData();
      fd.append("file", blob, "exam_frame.jpg");

      try {
        const { data } = await api.post(`/exams/${examId.value}/auth`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (data && data.student_name) {
          const existing = results.value.find((r) => r.reg_no === data.reg_no);
          if (!existing) {
            results.value.unshift({
              name: data.student_name,
              reg: data.reg_no,
              liveness: data.liveness,
              match: data.match,
              status: data.status,
              ts: new Date().toLocaleTimeString(),
            });
          }
        }
      } catch (e) {
        if (e.response?.status !== 400) console.warn(e);
      }
    },
    "image/jpeg",
    0.8
  );
}

async function stopAuth() {
  stopCamera();
  if (examId.value) {
    await api.patch(`/exams/${examId.value}/end`).catch(() => {});
  }
  phase.value = "done";
  examId.value = null;
}

function reset() {
  stopCamera();
  phase.value = "idle";
  results.value = [];
}

const statusBadge = (s) =>
  ({
    Verified: "bg-success",
    Rejected: "bg-danger",
    Flagged: "bg-warning text-dark",
  })[s] || "bg-secondary";

const pct = (v) => (v ? (v * 100).toFixed(1) + "%" : "0%");
</script>
<template>
  <BasePageHeading title="Exam Authentication" subtitle="Live Biometric Exam Verification"/>

  <div class="content">
    <div class="row g-4">

      <div class="col-lg-5">
        <BaseBlock title="Session Configuration">
          <div class="mb-3">
            <label class="form-label fw-medium">Unit / Paper *</label>
            <select v-model="selUnit" class="form-select" :disabled="phase === 'scanning'">
              <option value="">— Select unit —</option>
              <option v-for="u in acadStore.units" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-medium">Class / Cohort *</label>
            <select v-model="selClass" class="form-select" :disabled="phase === 'scanning'">
              <option value="">— Select class —</option>
              <option v-for="c in acadStore.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="form-label fw-medium">Exam Hall</label>
            <select v-model="selHall" class="form-select" :disabled="phase === 'scanning'">
              <option value="">— Optional —</option>
              <option v-for="h in acadStore.halls" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>
        

          <div style="width:100%;height:300px;background:#060d04;border-radius:10px;position:relative;overflow:hidden;margin-bottom:16px;">
            <video ref="videoRef" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;" v-show="phase === 'scanning'"></video>
            
            <canvas ref="canvasRef" style="display: none;"></canvas>

            <div v-if="phase==='scanning'" style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(65,90,32,.06),rgba(65,90,32,.06) 1px,transparent 1px,transparent 22px);"></div>
            <div v-if="phase==='scanning'" class="scan-line"></div>

            <template v-for="(s,i) in ['top:10px;left:10px;border-top:2px solid #E65F0E;border-left:2px solid #E65F0E;', 'top:10px;right:10px;border-top:2px solid #E65F0E;border-right:2px solid #E65F0E;', 'bottom:10px;left:10px;border-bottom:2px solid #E65F0E;border-left:2px solid #E65F0E;', 'bottom:10px;right:10px;border-bottom:2px solid #E65F0E;border-right:2px solid #E65F0E;']" :key="i">
              <div :style="`position:absolute;width:18px;height:18px;${s}`"></div>
            </template>

            <div v-if="phase==='idle'" class="d-flex align-items-center justify-content-center h-100" style="color:#415A20;opacity:.3;">
              <div class="text-center">
                <i class="si si-camera" style="font-size:40px;"></i>
                <div style="font-size:11px;margin-top:6px;">Camera idle</div>
              </div>
            </div>

            <div v-if="phase==='scanning'" style="position:absolute;bottom:10px;right:10px;display:flex;align-items:center;gap:6px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#E65F0E;animation:pulse 1s ease-in-out infinite;"></div>
              <span style="color:#E65F0E;font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.08em;">LIVE AUTH</span>
            </div>
            
            <div v-if="phase==='done'" class="d-flex align-items-center justify-content-center h-100">
              <div class="text-center" style="color:#415A20;">
                <div style="font-size:34px;">✅</div>
                <div style="font-size:12px;margin-top:4px;">Session complete</div>
              </div>
            </div>
          </div>

          <div class="d-grid gap-2">
            <button v-if="phase==='idle'" class="btn btn-primary" @click="startAuth">
              <i class="si si-shield me-2"></i> Start Authentication
            </button>
            <button v-else-if="phase==='scanning'" class="btn btn-danger" @click="stopAuth">
              <i class="si si-close me-2"></i> Stop Scanning
            </button>
            <button v-else class="btn btn-alt-secondary" @click="reset">
              <i class="si si-reload me-2"></i> New Session
            </button>
          </div>
        </BaseBlock>
      </div>

      <div class="col-lg-7">
        <BaseBlock title="Authentication Log" content-full>
          <template #options>
            <span class="badge" style="background:#415A20;">{{ results.length }} processed</span>
          </template>

          <div v-if="!results.length" class="text-center py-5 text-muted">
            <i class="si si-shield" style="font-size:36px;opacity:.25;"></i>
            <p class="mt-2 mb-0" style="font-size:13px;">Live AI verification results will stream here.</p>
          </div>

          <div v-else>
            <div v-for="r in results" :key="r.reg" class="d-flex align-items-center gap-3 py-2 px-1" style="border-bottom:1px solid rgba(0,0,0,.06);">
              <div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;"
                :style="{ background: r.status==='Verified'?'#415A20': r.status==='Flagged'?'#E65F0E':'#c0392b' }">
                {{ r.name.substring(0,2).toUpperCase() }}
              </div>

              <div class="flex-grow-1 overflow-hidden">
                <div class="fw-semibold text-truncate" style="font-size:13px;">{{ r.name }}</div>
                <div class="text-muted text-truncate" style="font-size:11px;font-family:'DM Mono',monospace;">{{ r.reg }}</div>
              </div>

              <div class="text-end flex-shrink-0" style="min-width:130px;">
                <div class="d-flex gap-2 justify-content-end align-items-center mb-1">
                  <span :class="['badge', statusBadge(r.status)]" style="font-size:11px;">{{ r.status }}</span>
                </div>
                <div style="font-size:10.5px;font-family:'DM Mono',monospace;color:#7a5c42;">
                  Liveness: {{ pct(r.liveness) }}<br/>Match: {{ pct(r.match) }}
                </div>
              </div>

              <div class="flex-shrink-0 text-muted" style="font-size:10px;font-family:'DM Mono',monospace;min-width:55px;text-align:right;">
                {{ r.ts }}
              </div>
            </div>
          </div>
        </BaseBlock>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
.scan-line {
  position:absolute; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,#E65F0E,transparent);
  animation:scanDown 2.4s linear infinite;
  pointer-events:none;
}
@keyframes scanDown {
  0%   { top:0 }
  50%  { top:calc(100% - 2px) }
  100% { top:0 }
}
</style>