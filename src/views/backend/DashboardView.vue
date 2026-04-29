<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useAuthStore } from "@/stores/authStore";
import api from "@/utils/api";
import Chart from "chart.js/auto";

const authStore = useAuthStore();
const data      = ref({ stats: [], active_sessions: [], schedule: [], unit_attendance: [], accuracy: null });
const loading   = ref(true);
const role      = computed(() => authStore.primaryRole);

// ── Greeting ─────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
});
const firstName = computed(() => {
  const n = authStore.user?.full_name || authStore.user?.username || "User";
  return n.split(" ")[0];
});
const todayLong = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

// ── Data fetch ────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data: d } = await api.get("/dashboard/stats");
    data.value = d;
    await nextTick();
    buildCharts();
  } catch {
    // Fail silently — show empty states
  } finally {
    loading.value = false;
  }
});

// ── Dynamic Charts (Admin only) ───────────────────────────────────
function buildCharts() {
  if (role.value !== "ADMIN") return;

  // 🔥 Get accuracy from backend or default to 0
  const verifiedRate = data.value.accuracy?.verified || 0;
  const failedRate = data.value.accuracy?.failed || 0;

  const donut = document.getElementById("accuracyChart");
  if (donut) {
    new Chart(donut, {
      type: "doughnut",
      data: {
        labels: ["Verified", "Failed"],
        datasets: [{
          data: [verifiedRate, failedRate],
          backgroundColor: ["#198754", "#dc3545"],
          borderWidth: 0,
        }],
      },
      options: {
        cutout: "72%",
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  const bar = document.getElementById("attendanceChart");
  if (bar && data.value.active_sessions?.length) {
    const labels = data.value.active_sessions.map(s => s.cohort || s.unit || "—");
    const vals   = data.value.active_sessions.map(s =>
      s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    );
    new Chart(bar, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Attendance %",
          data: vals,
          backgroundColor: "rgba(25,135,84,.25)",
          borderColor: "#198754",
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: "rgba(0,0,0,.05)" } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function initials() {
  return (authStore.user?.full_name || authStore.user?.username || "?")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const statIconBg = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  info:    "bg-info-subtle text-info",
  danger:  "bg-danger-subtle text-danger",
};

function attendancePct(s) {
  return s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
}
function attendanceBarClass(pct) {
  return pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
}
</script>

<template>
  <div v-if="!authStore.user" class="content">
    <div class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary" style="width:2.5rem;height:2.5rem;"></div>
    </div>
  </div>

  <template v-else>
    <!-- ══════════════════════════════════════════════════════════════
         SHARED PAGE HEADER
    ══════════════════════════════════════════════════════════════ -->
    <BasePageHeading :title="`${greeting}, ${firstName}`" :subtitle="todayLong">
      <template #extra>
        <div class="d-flex align-items-center gap-2">
          <span class="badge rounded-pill px-3 py-2 fw-semibold text-uppercase"
            :class="{
              'bg-danger-subtle text-danger border border-danger-subtle':   role === 'ADMIN',
              'bg-primary-subtle text-primary border border-primary-subtle': role === 'LECTURER',
              'bg-success-subtle text-success border border-success-subtle': role === 'STUDENT',
            }"
            style="font-size:11px;"
          >
            <i class="fa fa-shield-alt me-1"></i>{{ role }}
          </span>
        </div>
      </template>
    </BasePageHeading>

    <div class="content">
      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="row g-3 mb-4">
          <div class="col-sm-6 col-xl-3" v-for="i in 4" :key="i">
            <div class="card border-0 shadow-sm rounded-4 p-4">
              <div class="placeholder-glow">
                <div class="placeholder col-6 mb-2 rounded"></div>
                <div class="placeholder col-4 rounded" style="height:2rem;"></div>
                <div class="placeholder col-8 mt-2 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- ── STAT CARDS (shared across all roles) ──────────────── -->
        <div class="row g-3 mb-4">
          <div v-for="stat in data.stats" :key="stat.label" class="col-sm-6 col-xl-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <div class="h-100 d-flex flex-column">
                <div class="flex-shrink-0" :class="`bg-${stat.color}`" style="height:3px;"></div>
                <div class="card-body p-4 d-flex align-items-start gap-3">
                  <div
                    class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    :class="statIconBg[stat.color] || 'bg-primary-subtle text-primary'"
                    style="width:48px;height:48px;"
                  >
                    <i :class="['fa fa-fw', stat.icon]" style="font-size:18px;"></i>
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold lh-1 mb-1" style="font-size:1.6rem;">{{ stat.value }}</div>
                    <div class="text-muted text-uppercase fw-semibold" style="font-size:10px;letter-spacing:.08em;">
                      {{ stat.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════
             ADMIN DASHBOARD
        ════════════════════════════════════════════════════════ -->
        <template v-if="role === 'ADMIN'">
          <div class="row g-4">
            <!-- Active sessions table -->
            <div class="col-xl-8">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0 fw-bold"><i class="fa fa-video text-danger me-2"></i>Live Sessions</h6>
                  <span v-if="data.active_sessions?.length" class="badge bg-danger rounded-pill">
                    {{ data.active_sessions.length }} LIVE
                  </span>
                </div>

                <div class="card-body p-0">
                  <div v-if="!data.active_sessions?.length" class="text-center py-5 text-muted">
                    <i class="fa fa-video-slash mb-2" style="font-size:24px;opacity:0.5;"></i>
                    <div class="fw-medium">No active sessions right now</div>
                  </div>

                  <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0" style="font-size:13.5px;">
                      <thead class="bg-body-secondary text-muted" style="font-size:11px;">
                        <tr>
                          <th class="px-4 py-3 text-uppercase fw-semibold border-0">Time</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Hall</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Class</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Unit</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Lecturer</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in data.active_sessions" :key="s.unit + s.time">
                          <td class="px-4 py-3 fw-bold text-nowrap" style="font-family:'DM Mono',monospace;font-size:12px;">{{ s.time }}</td>
                          <td class="py-3"><span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill">{{ s.hall }}</span></td>
                          <td class="py-3"><span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">{{ s.cohort }}</span></td>
                          <td class="py-3 fw-medium text-truncate" style="max-width:160px;">{{ s.unit }}</td>
                          <td class="py-3 text-muted">{{ s.lecturer }}</td>
                          <td class="py-3 pe-4" style="min-width:140px;">
                            <div class="d-flex align-items-center gap-2">
                              <div class="progress flex-grow-1 rounded-pill" style="height:6px;">
                                <div class="progress-bar rounded-pill" :class="attendanceBarClass(attendancePct(s))" :style="{ width: attendancePct(s) + '%' }"></div>
                              </div>
                              <span class="text-muted fw-semibold text-nowrap" style="font-size:11px;">{{ s.present }}/{{ s.total }}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Charts Column -->
            <div class="col-xl-4 d-flex flex-column gap-4">
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold"><i class="fa fa-fingerprint text-info me-2"></i>Recognition Accuracy</h6>
                </div>
                <div class="card-body px-4 pb-4 text-center">
                  <div class="position-relative mx-auto mb-3" style="width:160px;height:160px;">
                    <canvas id="accuracyChart" width="160" height="160"></canvas>
                    <div class="position-absolute top-50 start-50 translate-middle">
                      <div class="fw-bold lh-1" style="font-size:1.5rem;">{{ data.accuracy?.verified || 0 }}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card border-0 shadow-sm rounded-4 flex-grow-1">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold"><i class="fa fa-chart-bar text-success me-2"></i>Session Attendance</h6>
                </div>
                <div class="card-body p-4">
                  <canvas id="attendanceChart" height="160"></canvas>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ════════════════════════════════════════════════════════
             LECTURER DASHBOARD (No Quick Links)
        ════════════════════════════════════════════════════════ -->
        <template v-else-if="role === 'LECTURER'">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold"><i class="fa fa-calendar-day text-primary me-2"></i>Today's Schedule</h6>
              <RouterLink :to="{ name: 'timetable' }" class="btn btn-sm btn-outline-primary rounded-pill px-3" style="font-size:12px;">
                Full Timetable <i class="fa fa-arrow-right ms-1"></i>
              </RouterLink>
            </div>
            
            <div class="card-body p-0">
              <div v-if="!data.schedule?.length" class="text-center py-5 text-muted">
                <i class="fa fa-calendar-check mb-2 d-block" style="font-size:24px;opacity:0.5;"></i>
                <div class="fw-medium">No sessions scheduled today</div>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size:13.5px;">
                  <thead class="bg-body-secondary text-muted" style="font-size:11px;">
                    <tr>
                      <th class="px-4 py-3 text-uppercase fw-semibold border-0">Time</th>
                      <th class="py-3 text-uppercase fw-semibold border-0">Unit</th>
                      <th class="py-3 text-uppercase fw-semibold border-0">Class</th>
                      <th class="py-3 text-uppercase fw-semibold border-0">Hall</th>
                      <th class="py-3 text-uppercase fw-semibold border-0">Enrolled</th>
                      <th class="py-3 text-uppercase fw-semibold border-0">Status</th>
                      <th class="py-3 text-uppercase fw-semibold border-0 pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(s, idx) in data.schedule" :key="idx">
                      <td class="px-4 py-3 fw-bold text-nowrap" style="font-family:'DM Mono',monospace;font-size:12px;">{{ s.time }}</td>
                      <td class="py-3 fw-bold">{{ s.unit }}</td>
                      <td class="py-3"><span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">{{ s.cohort }}</span></td>
                      <td class="py-3 text-muted"><i class="fa fa-map-marker-alt me-1 opacity-50"></i>{{ s.hall }}</td>
                      <td class="py-3 text-muted"><i class="fa fa-users me-1 opacity-50"></i>{{ s.enrolled }}</td>
                      <td class="py-3">
                        <span v-if="s.status === 'Live'" class="badge bg-success rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                          <span class="rounded-circle bg-white" style="width:6px;height:6px;animation:pulse 1.2s ease-in-out infinite;"></span> LIVE
                        </span>
                        <span v-else-if="s.status === 'Done'" class="badge bg-body-secondary text-muted rounded-pill px-3 py-2">
                          <i class="fa fa-check me-1"></i>Done
                        </span>
                        <span v-else class="badge bg-body-tertiary text-muted rounded-pill px-3 py-2 border">Upcoming</span>
                      </td>
                      <td class="py-3 pe-4 text-end">
                        <RouterLink v-if="s.status !== 'Done'" :to="{ name: 'attendance-scanner' }" class="btn btn-sm btn-primary rounded-pill px-3" style="font-size:11px;">
                          <i class="fa fa-camera me-1"></i>Scan
                        </RouterLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <!-- ════════════════════════════════════════════════════════
             STUDENT DASHBOARD (No Quick Links)
        ════════════════════════════════════════════════════════ -->
        <template v-else>
          <div class="row g-4">
            <!-- LEFT: Profile card -->
            <div class="col-lg-4">
              <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div class="bg-success d-flex align-items-center justify-content-center py-4" style="background:linear-gradient(135deg,#198754,#0a7a4a) !important;">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow border border-4 border-white" style="width:80px;height:80px;font-size:28px;background:rgba(255,255,255,.18);">
                    {{ initials() }}
                  </div>
                </div>
                <div class="card-body p-4 text-center">
                  <h5 class="fw-bold mb-1" style="font-size:1rem;">{{ authStore.user?.full_name }}</h5>
                  <p class="text-muted mb-3" style="font-size:12px;font-family:'DM Mono',monospace;">{{ authStore.user?.registration_number }}</p>

                  <div class="d-flex flex-column gap-2 mt-4">
                    <div class="d-flex align-items-center justify-content-between bg-body-secondary rounded-3 px-3 py-2">
                      <span class="text-muted fw-medium" style="font-size:12px;">Face Biometrics</span>
                      <span class="badge rounded-pill" :class="authStore.user?.is_biometrics_registered ? 'bg-success' : 'bg-warning'" style="font-size:10px;">
                        {{ authStore.user?.is_biometrics_registered ? '✓ Active' : '! Pending' }}
                      </span>
                    </div>
                    <div class="d-flex align-items-center justify-content-between bg-body-secondary rounded-3 px-3 py-2">
                      <span class="text-muted fw-medium" style="font-size:12px;">Account Status</span>
                      <span class="badge bg-success rounded-pill" style="font-size:10px;">Active</span>
                    </div>
                  </div>

                  <div v-if="!authStore.user?.is_biometrics_registered" class="alert alert-warning rounded-3 mt-4 mb-0 py-2 d-flex align-items-center gap-2 text-start" style="font-size:12px;">
                    <i class="fa fa-exclamation-triangle flex-shrink-0"></i>
                    <div>
                      Register your face to enable attendance &amp; exam auth.
                      <RouterLink :to="{ name: 'face-registration' }" class="fw-bold text-warning d-block mt-1">Register now →</RouterLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Attendance per unit & Schedule -->
            <div class="col-lg-8 d-flex flex-column gap-4">
              
              <!-- Attendance Table -->
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold"><i class="fa fa-chart-bar text-success me-2"></i>Unit Attendance Overview</h6>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0" style="font-size:13.5px;">
                      <thead class="bg-body-secondary text-muted" style="font-size:11px;">
                        <tr>
                          <th class="px-4 py-3 text-uppercase fw-semibold border-0">Unit Name</th>
                          <th class="py-3 text-uppercase fw-semibold border-0 w-50">Progress</th>
                          <th class="py-3 text-uppercase fw-semibold border-0 text-end pe-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="unit in data.unit_attendance" :key="unit.name">
                          <td class="px-4 py-3 fw-medium text-truncate" style="max-width:200px;">{{ unit.name }}</td>
                          <td class="py-3">
                            <div class="d-flex align-items-center gap-3">
                              <div class="progress flex-grow-1 rounded-pill" style="height:6px;">
                                <div class="progress-bar rounded-pill" :class="attendanceBarClass(unit.pct)" :style="{ width: unit.pct + '%' }"></div>
                              </div>
                              <span class="fw-bold text-muted" style="font-size:12px;">{{ unit.pct }}%</span>
                            </div>
                          </td>
                          <td class="py-3 text-end pe-4">
                            <span v-if="unit.pct < 75" class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">At Risk</span>
                            <span v-else class="badge bg-success-subtle text-success border border-success-subtle rounded-pill">On Track</span>
                          </td>
                        </tr>
                        <tr v-if="!data.unit_attendance?.length">
                          <td colspan="3" class="text-center py-4 text-muted">No attendance data recorded yet.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Today's Schedule Table -->
              <div class="card border-0 shadow-sm rounded-4 flex-grow-1">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold"><i class="fa fa-clock text-warning me-2"></i>Today's Classes</h6>
                </div>
                <div class="card-body p-0">
                  <div v-if="!data.schedule?.length" class="text-center py-5 text-muted">
                    <i class="fa fa-calendar-check mb-2 d-block" style="font-size:24px;opacity:0.3;"></i>
                    No classes today
                  </div>
                  <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0" style="font-size:13.5px;">
                      <thead class="bg-body-secondary text-muted" style="font-size:11px;">
                        <tr>
                          <th class="px-4 py-3 text-uppercase fw-semibold border-0">Time</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Unit</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Hall</th>
                          <th class="py-3 text-uppercase fw-semibold border-0 pe-4 text-end">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(s, idx) in data.schedule" :key="idx">
                          <td class="px-4 py-3 fw-bold text-nowrap" style="font-family:'DM Mono',monospace;font-size:12px;">{{ s.time }}</td>
                          <td class="py-3 fw-medium">{{ s.unit }}</td>
                          <td class="py-3 text-muted"><i class="fa fa-map-marker-alt me-1 opacity-50"></i>{{ s.hall }}</td>
                          <td class="py-3 pe-4 text-end">
                            <span class="badge rounded-pill"
                                  :class="s.status === 'Present' ? 'bg-success' : s.status === 'Upcoming' ? 'bg-primary' : 'bg-secondary'">
                              {{ s.status }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </template>
      </template>
    </div>
  </template>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .25; }
}
</style>