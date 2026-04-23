<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useAuthStore } from "@/stores/authStore";
import api from "@/utils/api";
import Chart from "chart.js/auto";

const authStore = useAuthStore();
const data      = ref({ stats: [], active_sessions: [], schedule: [], unit_attendance: [] });
const loading   = ref(true);
const role      = computed(() => authStore.primaryRole); // "ADMIN" | "LECTURER" | "STUDENT"

// ── Greeting ─────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
});
const firstName = computed(() => {
  const n = authStore.user?.full_name || authStore.user?.username || "";
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
    // fail silently — show empty states
  } finally {
    loading.value = false;
  }
});

// ── Charts (Admin only) ───────────────────────────────────────────
function buildCharts() {
  if (role.value !== "ADMIN") return;

  const donut = document.getElementById("accuracyChart");
  if (donut) {
    new Chart(donut, {
      type: "doughnut",
      data: {
        labels: ["Verified", "Failed"],
        datasets: [{
          data: [94.2, 5.8],
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
    <BasePageHeading
      :title="`${greeting}, ${firstName}`"
      :subtitle="todayLong"
    >
      <template #extra>
        <div class="d-flex align-items-center gap-2">
          <span class="badge rounded-pill px-3 py-2 fw-semibold"
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
          <div
            v-for="stat in data.stats"
            :key="stat.label"
            class="col-sm-6 col-xl-3"
          >
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <!-- Top accent line -->
              <div class="h-100 d-flex flex-column">
                <div
                  class="flex-shrink-0"
                  :class="`bg-${stat.color}`"
                  style="height:3px;"
                ></div>
                <div class="card-body p-4 d-flex align-items-start gap-3">
                  <!-- Icon -->
                  <div
                    class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    :class="statIconBg[stat.color] || 'bg-primary-subtle text-primary'"
                    style="width:48px;height:48px;"
                  >
                    <i :class="['fa fa-fw', stat.icon]" style="font-size:18px;"></i>
                  </div>
                  <!-- Text -->
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold lh-1 mb-1" style="font-size:1.6rem;">
                      {{ stat.value }}
                    </div>
                    <div
                      class="text-muted text-uppercase fw-semibold"
                      style="font-size:10px;letter-spacing:.08em;"
                    >
                      {{ stat.label }}
                    </div>
                    <div
                      v-if="stat.sub"
                      class="mt-1 fw-medium"
                      :class="stat.sub?.startsWith('↑') ? 'text-success' : stat.sub?.startsWith('↓') ? 'text-danger' : 'text-muted'"
                      style="font-size:12px;"
                    >
                      {{ stat.sub }}
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
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="bg-danger-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                        <i class="fa fa-video text-danger" style="font-size:15px;"></i>
                      </div>
                      <div>
                        <h6 class="mb-0 fw-bold">Live Sessions</h6>
                        <p class="mb-0 text-muted" style="font-size:12px;">Currently active attendance scans</p>
                      </div>
                    </div>
                    <span v-if="data.active_sessions?.length"
                      class="badge bg-danger rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                      style="font-size:11px;"
                    >
                      <span
                        class="rounded-circle bg-white"
                        style="width:7px;height:7px;animation:pulse 1.2s ease-in-out infinite;"
                      ></span>
                      {{ data.active_sessions.length }} LIVE
                    </span>
                  </div>
                </div>

                <div class="card-body p-0">
                  <div v-if="!data.active_sessions?.length" class="text-center py-5 text-muted">
                    <div class="bg-body-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width:56px;height:56px;">
                      <i class="fa fa-video-slash" style="font-size:20px;"></i>
                    </div>
                    <div class="fw-medium" style="font-size:14px;">No active sessions right now</div>
                    <div style="font-size:12px;">Sessions will appear here when lecturers start scanning</div>
                  </div>

                  <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0" style="font-size:13.5px;">
                      <thead>
                        <tr class="bg-body-secondary text-muted" style="font-size:11px;">
                          <th class="px-4 py-3 text-uppercase fw-semibold border-0" style="letter-spacing:.06em;">Time</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Hall</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Class</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Unit</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Lecturer</th>
                          <th class="py-3 text-uppercase fw-semibold border-0">Attendance</th>
                          <th class="py-3 text-uppercase fw-semibold border-0 pe-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in data.active_sessions" :key="s.unit + s.time">
                          <td class="px-4 py-3 fw-bold text-nowrap" style="font-family:'DM Mono',monospace;font-size:12px;">
                            {{ s.time }}
                          </td>
                          <td class="py-3">
                            <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2" style="font-size:11px;">
                              {{ s.hall }}
                            </span>
                          </td>
                          <td class="py-3">
                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2" style="font-size:11px;">
                              {{ s.cohort }}
                            </span>
                          </td>
                          <td class="py-3 fw-medium text-truncate" style="max-width:160px;">
                            {{ s.unit }}
                          </td>
                          <td class="py-3 text-muted">{{ s.lecturer }}</td>
                          <td class="py-3" style="min-width:140px;">
                            <div class="d-flex align-items-center gap-2">
                              <div class="progress flex-grow-1 rounded-pill" style="height:6px;">
                                <div
                                  class="progress-bar rounded-pill"
                                  :class="attendanceBarClass(attendancePct(s))"
                                  :style="{ width: attendancePct(s) + '%' }"
                                ></div>
                              </div>
                              <span class="text-muted fw-semibold text-nowrap" style="font-size:11px;min-width:44px;">
                                {{ s.present }}/{{ s.total }}
                              </span>
                            </div>
                          </td>
                          <td class="py-3 pe-4">
                            <span
                              class="badge rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                              :class="s.status === 'Active'
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-body-secondary text-muted'"
                              style="font-size:11px;"
                            >
                              <span
                                v-if="s.status === 'Active'"
                                class="rounded-circle bg-success"
                                style="width:6px;height:6px;animation:pulse 1.2s ease-in-out infinite;"
                              ></span>
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

            <!-- Right column: donut + bar -->
            <div class="col-xl-4 d-flex flex-column gap-4">

              <!-- Accuracy donut -->
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-info-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                      <i class="fa fa-fingerprint text-info" style="font-size:15px;"></i>
                    </div>
                    <div>
                      <h6 class="mb-0 fw-bold">Recognition Accuracy</h6>
                      <p class="mb-0 text-muted" style="font-size:12px;">Based on recent exam logs</p>
                    </div>
                  </div>
                </div>
                <div class="card-body px-4 pb-4">
                  <div class="position-relative mx-auto mb-3" style="width:160px;height:160px;">
                    <canvas id="accuracyChart" width="160" height="160"></canvas>
                    <div class="position-absolute top-50 start-50 translate-middle text-center">
                      <div class="fw-bold lh-1" style="font-size:1.7rem;">94.2%</div>
                      <div class="text-muted" style="font-size:11px;">Accuracy</div>
                    </div>
                  </div>
                  <div class="d-flex flex-column gap-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <span class="rounded-circle bg-success d-inline-block" style="width:10px;height:10px;"></span>
                        <span class="text-muted" style="font-size:13px;">Verified</span>
                      </div>
                      <span class="fw-bold text-success" style="font-size:13px;">94.2%</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <span class="rounded-circle bg-danger d-inline-block" style="width:10px;height:10px;"></span>
                        <span class="text-muted" style="font-size:13px;">Failed / Flagged</span>
                      </div>
                      <span class="fw-bold text-danger" style="font-size:13px;">5.8%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Attendance bar chart -->
              <div class="card border-0 shadow-sm rounded-4 flex-grow-1">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-success-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                      <i class="fa fa-chart-bar text-success" style="font-size:15px;"></i>
                    </div>
                    <div>
                      <h6 class="mb-0 fw-bold">Session Attendance</h6>
                      <p class="mb-0 text-muted" style="font-size:12px;">Per cohort today</p>
                    </div>
                  </div>
                </div>
                <div class="card-body p-4">
                  <canvas id="attendanceChart" height="160"></canvas>
                </div>
              </div>
            </div>

          </div>
        </template>

        <!-- ════════════════════════════════════════════════════════
             LECTURER DASHBOARD
        ════════════════════════════════════════════════════════ -->
        <template v-else-if="role === 'LECTURER'">
          <div class="row g-4">

            <!-- Today's schedule -->
            <div class="col-xl-8">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                        <i class="fa fa-calendar-day text-primary" style="font-size:15px;"></i>
                      </div>
                      <div>
                        <h6 class="mb-0 fw-bold">Today's Schedule</h6>
                        <p class="mb-0 text-muted" style="font-size:12px;">{{ data.schedule?.length || 0 }} sessions today</p>
                      </div>
                    </div>
                    <RouterLink :to="{ name: 'timetable' }" class="btn btn-sm btn-outline-primary rounded-pill px-3" style="font-size:12px;">
                      Full Timetable <i class="fa fa-arrow-right ms-1" style="font-size:10px;"></i>
                    </RouterLink>
                  </div>
                </div>
                <div class="card-body p-0">
                  <div v-if="!data.schedule?.length" class="text-center py-5 text-muted">
                    <div class="bg-body-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width:56px;height:56px;">
                      <i class="fa fa-calendar-check" style="font-size:20px;"></i>
                    </div>
                    <div class="fw-medium" style="font-size:14px;">No sessions scheduled today</div>
                    <div style="font-size:12px;">Enjoy your free day!</div>
                  </div>

                  <div v-else class="p-4 d-flex flex-column gap-3">
                    <div
                      v-for="(s, idx) in data.schedule"
                      :key="idx"
                      class="rounded-4 p-3 border d-flex align-items-center gap-3"
                      :class="s.status === 'Live'
                        ? 'border-success bg-success-subtle'
                        : s.status === 'Done'
                          ? 'border-0 bg-body-secondary'
                          : 'border-0 bg-body-tertiary'"
                    >
                      <!-- Time column -->
                      <div class="text-center flex-shrink-0 rounded-3 py-2 px-3"
                        :class="s.status === 'Live' ? 'bg-success text-white' : 'bg-body-tertiary text-muted'"
                        style="min-width:72px;"
                      >
                        <div class="fw-bold lh-1" style="font-size:13px;font-family:'DM Mono',monospace;">{{ s.time }}</div>
                        <div class="mt-1" style="font-size:10px;opacity:.75;">TIME</div>
                      </div>

                      <!-- Details -->
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-bold text-truncate" style="font-size:14px;">{{ s.unit }}</div>
                        <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
                          <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2" style="font-size:10px;">
                            {{ s.cohort }}
                          </span>
                          <span class="text-muted" style="font-size:12px;">
                            <i class="fa fa-map-marker-alt me-1 opacity-50"></i>{{ s.hall }}
                          </span>
                          <span class="text-muted" style="font-size:12px;">
                            <i class="fa fa-users me-1 opacity-50"></i>{{ s.enrolled }} enrolled
                          </span>
                        </div>
                      </div>

                      <!-- Status / action -->
                      <div class="flex-shrink-0">
                        <span
                          v-if="s.status === 'Live'"
                          class="badge bg-success rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                          style="font-size:11px;"
                        >
                          <span class="rounded-circle bg-white" style="width:6px;height:6px;animation:pulse 1.2s ease-in-out infinite;"></span>
                          LIVE
                        </span>
                        <span
                          v-else-if="s.status === 'Done'"
                          class="badge bg-body-secondary text-muted rounded-pill px-3 py-2"
                          style="font-size:11px;"
                        >
                          <i class="fa fa-check me-1"></i>Done
                        </span>
                        <RouterLink
                          v-else
                          :to="{ name: 'attendance-scanner' }"
                          class="btn btn-sm btn-primary rounded-pill px-3"
                          style="font-size:11px;"
                        >
                          <i class="fa fa-camera me-1"></i>Scan
                        </RouterLink>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: quick actions + summary -->
            <div class="col-xl-4 d-flex flex-column gap-4">

              <!-- Quick actions -->
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold">Quick Actions</h6>
                </div>
                <div class="card-body p-3 d-flex flex-column gap-2">
                  <RouterLink
                    v-for="action in [
                      { label: 'Start Attendance Scan', icon: 'fa-camera',     to: 'attendance-scanner', cls: 'btn-primary' },
                      { label: 'Launch Exam Auth',      icon: 'fa-shield-alt', to: 'exam-auth',          cls: 'btn-success' },
                      { label: 'View Attendance Logs',  icon: 'fa-list-alt',   to: 'attendance-logs',    cls: 'btn-outline-secondary' },
                      { label: 'Attendance Reports',    icon: 'fa-chart-bar',  to: 'attendance-reports', cls: 'btn-outline-secondary' },
                    ]"
                    :key="action.label"
                    :to="{ name: action.to }"
                    :class="['btn rounded-3 text-start d-flex align-items-center gap-3 px-3 py-2 fw-semibold', action.cls]"
                    style="font-size:13.5px;"
                  >
                    <i :class="['fa fa-fw', action.icon]"></i>
                    {{ action.label }}
                    <i class="fa fa-arrow-right ms-auto opacity-50" style="font-size:11px;"></i>
                  </RouterLink>
                </div>
              </div>

              <!-- Today summary -->
              <div class="card border-0 shadow-sm rounded-4 flex-grow-1">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <h6 class="mb-0 fw-bold">Today at a Glance</h6>
                </div>
                <div class="card-body p-4">
                  <div class="row g-3">
                    <div
                      v-for="stat in data.stats"
                      :key="stat.label"
                      class="col-6"
                    >
                      <div class="bg-body-secondary rounded-4 p-3 text-center">
                        <div
                          class="rounded-3 d-inline-flex align-items-center justify-content-center mb-2"
                          :class="statIconBg[stat.color] || 'bg-primary-subtle text-primary'"
                          style="width:36px;height:36px;"
                        >
                          <i :class="['fa fa-fw', stat.icon]" style="font-size:14px;"></i>
                        </div>
                        <div class="fw-bold" style="font-size:1.3rem;">{{ stat.value }}</div>
                        <div class="text-muted" style="font-size:11px;">{{ stat.label }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </template>

        <!-- ════════════════════════════════════════════════════════
             STUDENT DASHBOARD
        ════════════════════════════════════════════════════════ -->
        <template v-else>
          <div class="row g-4">

            <!-- LEFT: Profile card -->
            <div class="col-lg-4 col-xl-3">
              <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <!-- Card accent banner -->
                <div class="bg-success d-flex align-items-center justify-content-center py-4"
                  style="background:linear-gradient(135deg,#198754,#0a7a4a) !important;">
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow border border-4 border-white"
                    style="width:80px;height:80px;font-size:28px;background:rgba(255,255,255,.18);"
                  >{{ initials() }}</div>
                </div>
                <div class="card-body p-4 text-center">
                  <h5 class="fw-bold mb-1" style="font-size:1rem;">{{ authStore.user?.full_name }}</h5>
                  <p class="text-muted mb-3" style="font-size:12px;font-family:'DM Mono',monospace;">
                    {{ authStore.user?.registration_number }}
                  </p>

                  <!-- Status badges -->
                  <div class="d-flex flex-column gap-2">
                    <div class="d-flex align-items-center justify-content-between bg-body-secondary rounded-3 px-3 py-2">
                      <span class="text-muted fw-medium" style="font-size:12px;">Face Biometrics</span>
                      <span
                        class="badge rounded-pill"
                        :class="authStore.user?.is_biometrics_registered ? 'bg-success' : 'bg-warning'"
                        style="font-size:10px;"
                      >
                        {{ authStore.user?.is_biometrics_registered ? '✓ Active' : '! Pending' }}
                      </span>
                    </div>
                    <div class="d-flex align-items-center justify-content-between bg-body-secondary rounded-3 px-3 py-2">
                      <span class="text-muted fw-medium" style="font-size:12px;">Account Status</span>
                      <span class="badge bg-success rounded-pill" style="font-size:10px;">Active</span>
                    </div>
                    <div class="d-flex align-items-center justify-content-between bg-body-secondary rounded-3 px-3 py-2">
                      <span class="text-muted fw-medium" style="font-size:12px;">Exam Status</span>
                      <span class="badge bg-primary rounded-pill" style="font-size:10px;">Cleared</span>
                    </div>
                  </div>

                  <!-- CTA if biometrics missing -->
                  <div v-if="!authStore.user?.is_biometrics_registered"
                    class="alert alert-warning rounded-3 mt-3 mb-0 py-2 d-flex align-items-center gap-2 text-start"
                    style="font-size:12px;"
                  >
                    <i class="fa fa-exclamation-triangle flex-shrink-0"></i>
                    <div>
                      Register your face to enable attendance &amp; exam auth.
                      <RouterLink :to="{ name: 'face-registration' }" class="fw-bold text-warning d-block mt-1">
                        Register now →
                      </RouterLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MIDDLE: Attendance per unit -->
            <div class="col-lg-8 col-xl-5">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-success-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                      <i class="fa fa-chart-bar text-success" style="font-size:15px;"></i>
                    </div>
                    <div>
                      <h6 class="mb-0 fw-bold">Attendance per Unit</h6>
                      <p class="mb-0 text-muted" style="font-size:12px;">Current semester progress</p>
                    </div>
                  </div>
                </div>
                <div class="card-body p-4 d-flex flex-column gap-4">
                  <!-- Overall rate hero -->
                  <div class="bg-success-subtle rounded-4 p-3 d-flex align-items-center gap-3">
                    <div class="bg-success rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                      style="width:52px;height:52px;font-size:1.1rem;"
                    >
                      {{ data.stats.find(s => s.label === 'Attendance Rate')?.value || '—' }}
                    </div>
                    <div>
                      <div class="fw-bold" style="font-size:14px;">Overall Attendance Rate</div>
                      <div class="text-success fw-semibold" style="font-size:12px;">
                        <i class="fa fa-arrow-up me-1"></i>Above the 75% threshold — keep it up!
                      </div>
                    </div>
                  </div>

                  <!-- Per-unit bars -->
                  <div
                    v-for="unit in data.unit_attendance"
                    :key="unit.name"
                    class="d-flex flex-column gap-1"
                  >
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="fw-medium text-truncate me-2" style="font-size:13px;max-width:70%;">{{ unit.name }}</span>
                      <span
                        class="fw-bold flex-shrink-0"
                        :class="unit.pct >= 75 ? 'text-success' : unit.pct >= 50 ? 'text-warning' : 'text-danger'"
                        style="font-size:13px;"
                      >{{ unit.pct }}%</span>
                    </div>
                    <div class="progress rounded-pill" style="height:8px;">
                      <div
                        class="progress-bar rounded-pill"
                        :class="attendanceBarClass(unit.pct)"
                        :style="{ width: unit.pct + '%' }"
                      ></div>
                    </div>
                    <div v-if="unit.pct < 75"
                      class="text-danger d-flex align-items-center gap-1"
                      style="font-size:11px;"
                    >
                      <i class="fa fa-exclamation-circle"></i>
                      Below 75% — at risk of exam barring
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Today's schedule + quick links -->
            <div class="col-xl-4 d-flex flex-column gap-4">

              <!-- Today's timetable -->
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-warning-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                      <i class="fa fa-clock text-warning" style="font-size:15px;"></i>
                    </div>
                    <div>
                      <h6 class="mb-0 fw-bold">Today's Classes</h6>
                      <p class="mb-0 text-muted" style="font-size:12px;">{{ data.schedule?.length || 0 }} sessions</p>
                    </div>
                  </div>
                </div>
                <div class="card-body p-3 d-flex flex-column gap-2">
                  <div
                    v-if="!data.schedule?.length"
                    class="text-center py-4 text-muted"
                    style="font-size:13px;"
                  >
                    <i class="fa fa-calendar-check mb-2 d-block" style="font-size:24px;opacity:.3;"></i>
                    No classes today
                  </div>
                  <div
                    v-for="(s, idx) in data.schedule"
                    :key="idx"
                    class="rounded-3 p-3 d-flex align-items-center gap-3 border"
                    :class="s.status === 'Present'
                      ? 'bg-success-subtle border-success-subtle'
                      : s.status === 'Upcoming'
                        ? 'bg-primary-subtle border-primary-subtle'
                        : 'bg-body-secondary border-0'"
                  >
                    <div
                      class="flex-shrink-0 rounded-3 text-center py-1 px-2"
                      :class="s.status === 'Present' ? 'bg-success text-white' : 'bg-body-tertiary text-muted'"
                      style="min-width:54px;"
                    >
                      <div class="fw-bold lh-1" style="font-size:11px;font-family:'DM Mono',monospace;">{{ s.time }}</div>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-semibold text-truncate" style="font-size:13px;">{{ s.unit }}</div>
                      <div class="text-muted" style="font-size:11px;">
                        <i class="fa fa-map-marker-alt me-1 opacity-50"></i>{{ s.hall }}
                      </div>
                    </div>
                    <span
                      class="badge rounded-pill flex-shrink-0"
                      :class="s.status === 'Present'
                        ? 'bg-success'
                        : s.status === 'Upcoming'
                          ? 'bg-primary'
                          : 'bg-secondary'"
                      style="font-size:10px;"
                    >{{ s.status }}</span>
                  </div>
                </div>
              </div>

              <!-- Quick links -->
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-transparent border-bottom px-4 pt-3 pb-3">
                  <h6 class="mb-0 fw-bold">Quick Links</h6>
                </div>
                <div class="card-body p-3 d-flex flex-column gap-2">
                  <RouterLink
                    v-for="link in [
                      { label: 'My Timetable',     icon: 'fa-calendar-alt', to: 'timetable',        cls: 'text-primary' },
                      { label: 'Attendance History', icon: 'fa-clipboard-list', to: 'my-attendance', cls: 'text-success' },
                      { label: 'Exam History',     icon: 'fa-shield-alt',   to: 'exam-history',     cls: 'text-warning' },
                      { label: 'Face Registration', icon: 'fa-fingerprint', to: 'face-registration', cls: 'text-info'   },
                    ]"
                    :key="link.label"
                    :to="{ name: link.to }"
                    class="d-flex align-items-center gap-3 px-3 py-2 rounded-3 bg-body-secondary text-decoration-none text-body fw-medium"
                    style="font-size:13.5px;"
                  >
                    <i :class="['fa fa-fw', link.icon, link.cls]"></i>
                    {{ link.label }}
                    <i class="fa fa-chevron-right ms-auto text-muted opacity-50" style="font-size:10px;"></i>
                  </RouterLink>
                </div>
              </div>

            </div>
          </div>
        </template>

      </template>
      <!-- end v-else (not loading) -->

    </div>
  </template>
</template>

<style scoped>
/* Absolute minimum — only keyframes, which Bootstrap cannot provide */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .25; }
}
</style>