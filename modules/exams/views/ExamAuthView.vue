<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore";
import api from "@/utils/api";

const acadStore = useAcademicSetupStore();
const selUnit   = ref("");
const selHall   = ref("");
const results   = ref([]);
const phase     = ref("idle"); // idle | scanning | done
let   scanTimer = null;

const MOCK_STUDENTS = [
  { id: 10, name: "Brian Otieno",   reg: "BSCS/101J/2025" },
  { id: 11, name: "Faith Ngetich",  reg: "BSCS/102J/2025" },
  { id: 12, name: "Kevin Njoroge",  reg: "BSCS/103J/2025" },
  { id: 13, name: "Mary Wanjiku",   reg: "BSCS/104J/2025" },
  { id: 14, name: "Ali Hassan",     reg: "BSCS/105J/2025" },
  { id: 15, name: "Grace Muthoni",  reg: "BSCS/106J/2025" },
];

onMounted(() => Promise.all([acadStore.fetchUnits(), acadStore.fetchHalls()]));
onUnmounted(() => { if (scanTimer) clearInterval(scanTimer); });

function startAuth() {
  if (!selUnit.value) { alert("Please select a unit first."); return; }
  phase.value   = "scanning";
  results.value = [];
  let i = 0;

  scanTimer = setInterval(async () => {
    if (i >= MOCK_STUDENTS.length) {
      clearInterval(scanTimer);
      phase.value = "done";
      return;
    }
    const st           = MOCK_STUDENTS[i++];
    const liveness     = +(0.72 + Math.random() * 0.27).toFixed(3);
    const match        = +(0.68 + Math.random() * 0.30).toFixed(3);
    const spoofed      = liveness < 0.78;
    const verified     = !spoofed && match > 0.80;
    const status       = spoofed ? "spoof" : verified ? "verified" : "rejected";

    // Post to backend
    await api.post("/exam-auth/verify", {
      student_id:     st.id,
      unit_id:        parseInt(selUnit.value),
      hall_id:        selHall.value ? parseInt(selHall.value) : null,
      liveness_score: liveness,
      match_score:    match,
      status,
    }).catch(() => {});

    results.value.unshift({ ...st, liveness, match, status, ts: new Date().toLocaleTimeString() });
  }, 2200);
}

function reset() {
  if (scanTimer) clearInterval(scanTimer);
  phase.value   = "idle";
  results.value = [];
}

const statusBadge = (s) => ({
  verified: "bg-success",
  rejected: "bg-danger",
  spoof:    "bg-warning text-dark",
}[s] || "bg-secondary");

const pct = (v) => (v * 100).toFixed(1) + "%";
</script>

<template>
  <BasePageHeading title="Exam Authentication" subtitle="Verify student identity before examinations"/>

  <div class="content">
    <div class="row g-4">

      <!-- Config + camera -->
      <div class="col-lg-5">
        <BaseBlock title="Session Configuration">
          <div class="mb-3">
            <label class="form-label fw-medium">Unit / Paper *</label>
            <select v-model="selUnit" class="form-select" :disabled="phase === 'scanning'">
              <option value="">— Select unit —</option>
              <option v-for="u in acadStore.units" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="form-label fw-medium">Exam Hall</label>
            <select v-model="selHall" class="form-select" :disabled="phase === 'scanning'">
              <option value="">— Optional —</option>
              <option v-for="h in acadStore.halls" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>

          <!-- Simulated camera viewport -->
          <div style="width:100%;height:200px;background:#060d04;border-radius:10px;
                      position:relative;overflow:hidden;margin-bottom:16px;">
            <!-- CRT scanlines overlay -->
            <div style="position:absolute;inset:0;pointer-events:none;
                        background:repeating-linear-gradient(
                          0deg,rgba(65,90,32,.06),rgba(65,90,32,.06) 1px,
                          transparent 1px,transparent 22px);"></div>

            <!-- Scan animation -->
            <div v-if="phase==='scanning'" class="scan-line"></div>

            <!-- Corner brackets -->
            <template v-for="(s,i) in [
              'top:10px;left:10px;border-top:2px solid #E65F0E;border-left:2px solid #E65F0E;',
              'top:10px;right:10px;border-top:2px solid #E65F0E;border-right:2px solid #E65F0E;',
              'bottom:10px;left:10px;border-bottom:2px solid #E65F0E;border-left:2px solid #E65F0E;',
              'bottom:10px;right:10px;border-bottom:2px solid #E65F0E;border-right:2px solid #E65F0E;',
            ]" :key="i">
              <div :style="`position:absolute;width:18px;height:18px;${s}`"></div>
            </template>

            <!-- Center face silhouette (idle) -->
            <div v-if="phase==='idle'" class="d-flex align-items-center justify-content-center h-100"
              style="color:#415A20;opacity:.3;">
              <div class="text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                <div style="font-size:11px;margin-top:6px;">Camera idle</div>
              </div>
            </div>

            <!-- Scanning indicator -->
            <div v-if="phase==='scanning'" style="position:absolute;bottom:10px;right:10px;
              display:flex;align-items:center;gap:6px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#E65F0E;
                          animation:pulse 1s ease-in-out infinite;"></div>
              <span style="color:#E65F0E;font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.08em;">
                AUTH SCAN
              </span>
            </div>

            <!-- Done state -->
            <div v-if="phase==='done'" class="d-flex align-items-center justify-content-center h-100">
              <div class="text-center" style="color:#415A20;">
                <div style="font-size:34px;">✅</div>
                <div style="font-size:12px;margin-top:4px;">Session complete</div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="d-grid gap-2">
            <button v-if="phase==='idle'" class="btn btn-primary" @click="startAuth">
              <i class="si si-shield me-2"></i> Start Authentication
            </button>
            <button v-else-if="phase==='scanning'" class="btn btn-danger" @click="reset">
              <i class="si si-close me-2"></i> Stop
            </button>
            <button v-else class="btn btn-alt-secondary" @click="reset">
              <i class="si si-reload me-2"></i> New Session
            </button>
          </div>
        </BaseBlock>

        <!-- Summary counts -->
        <div v-if="results.length" class="row g-2 mt-1">
          <div v-for="item in [
            { label:'Verified', count: results.filter(r=>r.status==='verified').length, color:'#415A20' },
            { label:'Rejected', count: results.filter(r=>r.status==='rejected').length, color:'#c0392b' },
            { label:'Spoof',    count: results.filter(r=>r.status==='spoof').length,    color:'#E65F0E' },
          ]" :key="item.label" class="col-4">
            <div class="text-center p-2 rounded-3"
              :style="{ background: item.color+'14', border: '1px solid '+item.color+'30' }">
              <div style="font-size:22px;font-weight:700;" :style="{ color: item.color }">{{ item.count }}</div>
              <div class="text-muted" style="font-size:11px;">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results log -->
      <div class="col-lg-7">
        <BaseBlock title="Authentication Log" content-full>
          <template #options>
            <span class="badge" style="background:#415A20;">{{ results.length }} processed</span>
          </template>

          <div v-if="!results.length" class="text-center py-5 text-muted">
            <i class="si si-shield" style="font-size:36px;opacity:.25;"></i>
            <p class="mt-2 mb-0" style="font-size:13px;">Results will appear here as students are scanned.</p>
          </div>

          <div v-else>
            <div v-for="r in results" :key="r.id + r.ts"
              class="d-flex align-items-center gap-3 py-2 px-1"
              style="border-bottom:1px solid rgba(0,0,0,.06);">

              <!-- Avatar -->
              <div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;
                          display:flex;align-items:center;justify-content:center;
                          font-size:12px;font-weight:700;color:#fff;"
                :style="{ background: r.status==='verified'?'#415A20': r.status==='spoof'?'#E65F0E':'#c0392b' }">
                {{ r.name.split(" ").map(w=>w[0]).join("") }}
              </div>

              <!-- Name + reg -->
              <div class="flex-grow-1 overflow-hidden">
                <div class="fw-semibold text-truncate" style="font-size:13px;">{{ r.name }}</div>
                <div class="text-muted text-truncate" style="font-size:11px;font-family:'DM Mono',monospace;">
                  {{ r.reg }}
                </div>
              </div>

              <!-- Scores -->
              <div class="text-end flex-shrink-0" style="min-width:130px;">
                <div class="d-flex gap-2 justify-content-end align-items-center mb-1">
                  <span :class="['badge', statusBadge(r.status)]" style="font-size:11px;">{{ r.status }}</span>
                </div>
                <div style="font-size:10.5px;font-family:'DM Mono',monospace;color:#7a5c42;">
                  live {{ pct(r.liveness) }} · match {{ pct(r.match) }}
                </div>
                <!-- Mini score bars -->
                <div class="d-flex gap-1 mt-1">
                  <div style="flex:1;height:3px;border-radius:2px;background:rgba(0,0,0,.08);">
                    <div style="height:100%;border-radius:2px;background:#415A20;transition:.4s;"
                      :style="{ width: pct(r.liveness) }"></div>
                  </div>
                  <div style="flex:1;height:3px;border-radius:2px;background:rgba(0,0,0,.08);">
                    <div style="height:100%;border-radius:2px;background:#E65F0E;transition:.4s;"
                      :style="{ width: pct(r.match) }"></div>
                  </div>
                </div>
              </div>

              <!-- Time -->
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
}
@keyframes scanDown {
  0%   { top:0 }
  50%  { top:calc(100% - 2px) }
  100% { top:0 }
}
</style>