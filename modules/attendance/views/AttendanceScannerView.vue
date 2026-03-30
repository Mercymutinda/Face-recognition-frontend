<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute }     from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api              from "@/utils/api";
import { useAcademicSetupStore } from "~/academicSetup/store/academicSetupStore";

const route     = useRoute();
const authStore = useAuthStore();
const acadStore = useAcademicSetupStore();

const sessionId    = ref(null);
const scanning     = ref(false);
const recognized   = ref([]);
const scannedCount = ref(0);
const selUnit      = ref(route.query.unit  || "");
const selClass     = ref(route.query.class || "");
const selHall      = ref(route.query.hall  || "");

const MOCK_STUDENTS = [
  { id: 10, name: "Brian Otieno",  reg: "BSCS/101J/2025" },
  { id: 11, name: "Faith Ngetich", reg: "BSCS/102J/2025" },
  { id: 12, name: "Kevin Njoroge", reg: "BSCS/103J/2025" },
  { id: 13, name: "Mary Wanjiku",  reg: "BSCS/104J/2025" },
  { id: 14, name: "Ali Hassan",    reg: "BSCS/105J/2025" },
];

let scanTimer = null;

onMounted(() => Promise.all([acadStore.fetchUnits(), acadStore.fetchClasses(), acadStore.fetchHalls()]));
onUnmounted(() => { if (scanTimer) clearInterval(scanTimer); });

async function startSession() {
  if (!selUnit.value || !selClass.value) { alert("Select a unit and class."); return; }
  const { data } = await api.post("/attendance/start-session", {
    unit_id:  parseInt(selUnit.value),
    class_id: parseInt(selClass.value),
    hall_id:  selHall.value ? parseInt(selHall.value) : null,
  });
  sessionId.value = data.session_id;
  scanning.value  = true;
  recognized.value = [];
  scannedCount.value = 0;
  let i = 0;
  scanTimer = setInterval(async () => {
    if (i >= MOCK_STUDENTS.length) { clearInterval(scanTimer); return; }
    const st = MOCK_STUDENTS[i++];
    const confidence = 0.78 + Math.random() * 0.19;
    const status     = confidence > 0.80 ? "present" : "absent";
    await api.post("/attendance/mark", { session_id: sessionId.value, student_id: st.id, confidence, status }).catch(() => {});
    recognized.value.unshift({ ...st, confidence: +(confidence * 100).toFixed(1), status, ts: new Date().toLocaleTimeString() });
    scannedCount.value++;
  }, 1800);
}

async function endSession() {
  if (scanTimer) clearInterval(scanTimer);
  if (sessionId.value) await api.post(`/attendance/sessions/${sessionId.value}/end`).catch(() => {});
  scanning.value  = false;
  sessionId.value = null;
}
</script>

<template>
  <BasePageHeading title="Attendance Scanner" subtitle="Start a session and scan students"/>

  <div class="content">
    <div class="row g-4">
      <!-- Setup panel -->
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
            <label class="form-label fw-medium">Class *</label>
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
              <i class="si si-camera me-2"></i> Start Scanning
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

      <!-- Camera simulation panel -->
      <div class="col-lg-8">
        <BaseBlock title="Camera Feed">
          <!-- Viewfinder -->
          <div style="width:100%;height:240px;background:#0d1008;border-radius:10px;
                      position:relative;overflow:hidden;margin-bottom:16px;">
            <div v-if="scanning" style="position:absolute;inset:0;
                                        background:repeating-linear-gradient(0deg,rgba(65,90,32,.06),rgba(65,90,32,.06) 1px,transparent 1px,transparent 28px);"></div>
            <div v-if="scanning" class="scan-line"></div>
            <!-- Corner markers -->
            <div v-for="pos in ['top:8px;left:8px;border-top:2px solid #E65F0E;border-left:2px solid #E65F0E;',
                                'top:8px;right:8px;border-top:2px solid #E65F0E;border-right:2px solid #E65F0E;',
                                'bottom:8px;left:8px;border-bottom:2px solid #E65F0E;border-left:2px solid #E65F0E;',
                                'bottom:8px;right:8px;border-bottom:2px solid #E65F0E;border-right:2px solid #E65F0E;']"
              :key="pos"
              :style="`position:absolute;width:20px;height:20px;${pos}`"></div>
            <div v-if="!scanning" class="d-flex align-items-center justify-content-center h-100" style="color:#415A20;opacity:.4;">
              <div class="text-center">
                <i class="si si-camera" style="font-size:40px;"></i>
                <div style="font-size:12px;margin-top:8px;">Camera idle — start a session</div>
              </div>
            </div>
            <div v-else style="position:absolute;bottom:12px;right:12px;display:flex;gap:6px;align-items:center;">
              <div style="width:8px;height:8px;border-radius:50%;background:#E65F0E;animation:pulse 1s infinite;"></div>
              <span style="color:#E65F0E;font-size:11px;font-family:'DM Mono',monospace;">REC</span>
            </div>
          </div>

          <!-- Live log -->
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold" style="font-size:13px;">Scan Log</span>
            <span class="badge" style="background:#415A20;">{{ scannedCount }} scanned</span>
          </div>
          <div style="max-height:240px;overflow-y:auto;">
            <div v-for="r in recognized" :key="r.id + r.ts"
              class="d-flex align-items-center gap-3 py-2"
              style="border-bottom:1px solid rgba(0,0,0,.06);font-size:13px;">
              <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;
                          background:linear-gradient(135deg,#415A20,#E65F0E);
                          display:flex;align-items:center;justify-content:center;
                          color:#fff;font-size:11px;font-weight:700;">
                {{ r.name.split(" ").map((w) => w[0]).join("") }}
              </div>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ r.name }}</div>
                <div class="text-muted" style="font-size:11px;font-family:'DM Mono',monospace;">{{ r.reg }}</div>
              </div>
              <div class="text-end flex-shrink-0">
                <div>
                  <span class="badge" :class="r.status === 'present' ? 'bg-success' : 'bg-danger'">{{ r.status }}</span>
                </div>
                <div class="text-muted" style="font-size:10px;">{{ r.confidence }}% • {{ r.ts }}</div>
              </div>
            </div>
            <div v-if="!recognized.length" class="text-center text-muted py-4" style="font-size:13px;">
              Scan log will appear here.
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
}
@keyframes scanDown {
  0%   { top: 0; }
  50%  { top: calc(100% - 2px); }
  100% { top: 0; }
}
</style>