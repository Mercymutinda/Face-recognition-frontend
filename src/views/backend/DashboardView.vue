<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter }    from "vue-router";
import api from "@/utils/api";

const authStore = useAuthStore();
const router    = useRouter();

const stats   = ref({ programs:0, classes:0, units:0, halls:0, users:0 });
const sessions = ref([]);
const todaySlots = ref([]);
const myRate  = ref({ present:0, total:0 });
const loading = ref(true);

const today = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

onMounted(async () => {
  const can = authStore.userCan.bind(authStore);
  const jobs = [];

  if (can("dashboard:admin")) {
    jobs.push(
      api.get("/academic/programs").then(r => stats.value.programs = r.data.length).catch(()=>{}),
      api.get("/academic/classes").then(r  => stats.value.classes  = r.data.length).catch(()=>{}),
      api.get("/academic/units").then(r    => stats.value.units    = r.data.length).catch(()=>{}),
      api.get("/academic/halls").then(r    => stats.value.halls    = r.data.length).catch(()=>{}),
      api.get("/users").then(r             => stats.value.users    = (r.data.items??r.data).length).catch(()=>{}),
      api.get("/attendance/sessions").then(r => sessions.value = (r.data??[]).filter(s=>s.is_active)).catch(()=>{}),
    );
  }

  if (can("dashboard:lecturer") && !can("dashboard:admin") && authStore.user?.id) {
    jobs.push(
      api.get("/academic/timetable/today", { params: { lecturer_id: authStore.user.id } })
        .then(r => todaySlots.value = r.data).catch(()=>{}),
    );
  }

  if (can("dashboard:student")) {
    jobs.push(
      api.get("/attendance/my-history").then(r => {
        const records = r.data ?? [];
        myRate.value = {
          total:   records.length,
          present: records.filter(x => x.status === "present").length,
        };
      }).catch(()=>{}),
    );
  }

  await Promise.all(jobs);
  loading.value = false;
});

const attendanceRate = () => myRate.value.total
  ? Math.round((myRate.value.present / myRate.value.total) * 100) : 0;

const rateColor = p => p >= 75 ? "#2356d7" : p >= 50 ? "#e68900" : "#dc3545";

const STAT_CONFIG = [
  { key:"programs", label:"Programs",     icon:"🎓", color:"#2356d7", to:"programs" },
  { key:"classes",  label:"Classes",      icon:"👥", color:"#16a05e", to:"classes" },
  { key:"units",    label:"Units",        icon:"📖", color:"#7c3aed", to:"units" },
  { key:"halls",    label:"Halls",        icon:"🏛️", color:"#e68900", to:"halls" },
  { key:"users",    label:"Users",        icon:"👤", color:"#dc3545", to:"users" },
];
</script>

<template>
  <BasePageHeading :title="`Welcome${authStore.user?.full_name ? ', ' + authStore.user.full_name.split(' ')[0] : ''}`"
    :subtitle="today">
    <template #extra>
      <span class="as-badge blue as-mono" style="font-size:11px;padding:5px 12px;">
        {{ authStore.primaryRole }}
      </span>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" style="color:#2356d7;"></div>
    </div>

    <template v-else>

      <!-- ═══════════════════  ADMIN  ═══════════════════ -->
      <template v-if="authStore.userCan('dashboard:admin')">
        <!-- Stats row -->
        <div class="row g-3 mb-4">
          <div v-for="s in STAT_CONFIG" :key="s.key" class="col-6 col-sm-4 col-lg">
            <RouterLink :to="{ name: s.to }" class="text-decoration-none">
              <div class="as-stat">
                <div class="stat-ico" :style="{ background: s.color+'18', color: s.color }">
                  <span style="font-size:19px;">{{ s.icon }}</span>
                </div>
                <div class="stat-val">{{ stats[s.key] }}</div>
                <div class="stat-lbl">{{ s.label }}</div>
                <div class="stat-stripe" :style="{ background: s.color }"></div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Active sessions -->
        <div class="row g-4">
          <div class="col-lg-8">
            <BaseBlock title="Live Attendance Sessions">
              <template #options>
                <RouterLink :to="{ name:'attendance-logs' }" class="btn btn-sm btn-alt-secondary">View All</RouterLink>
              </template>
              <div v-if="!sessions.length" class="text-center py-4 text-muted" style="font-size:13px;">
                No active sessions right now.
              </div>
              <table v-else class="as-table w-100">
                <thead>
                  <tr>
                    <th>Unit</th><th>Class</th><th>Hall</th><th>Started</th>
                    <th><span class="cam-rec-dot"></span> Live</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in sessions" :key="s.id">
                    <td class="fw-semibold">{{ s.unit_id }}</td>
                    <td>{{ s.class_id }}</td>
                    <td>{{ s.hall_id || "—" }}</td>
                    <td class="as-mono" style="font-size:12px;">{{ new Date(s.started_at).toLocaleTimeString() }}</td>
                    <td><span class="as-badge green">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </BaseBlock>
          </div>

          <!-- Quick actions -->
          <div class="col-lg-4">
            <BaseBlock title="Quick Actions">
              <div class="d-flex flex-column gap-2">
                <RouterLink v-for="qa in [
                  { label:'Manage Programs',  to:'programs',           icon:'🎓' },
                  { label:'Edit Timetable',   to:'timetable',          icon:'📅' },
                  { label:'Manage Users',     to:'users',              icon:'👤' },
                  { label:'View Reports',     to:'attendance-reports', icon:'📊' },
                ]" :key="qa.label" :to="{ name: qa.to }" class="text-decoration-none">
                  <div class="d-flex align-items-center gap-3 p-3 rounded-3"
                    style="border:1.5px solid #e8edf7;transition:.15s;cursor:pointer;"
                    @mouseenter="$event.currentTarget.style.borderColor='#2356d7';$event.currentTarget.style.background='#f0f5ff'"
                    @mouseleave="$event.currentTarget.style.borderColor='#e8edf7';$event.currentTarget.style.background='transparent'">
                    <span style="font-size:20px;">{{ qa.icon }}</span>
                    <span style="font-size:13px;font-weight:500;color:#1a2540;">{{ qa.label }}</span>
                    <i class="si si-arrow-right ms-auto" style="font-size:12px;color:#8494b0;"></i>
                  </div>
                </RouterLink>
              </div>
            </BaseBlock>
          </div>
        </div>
      </template>

      <!-- ═══════════════════  LECTURER  ═══════════════════ -->
      <template v-if="authStore.userCan('dashboard:lecturer') && !authStore.userCan('dashboard:admin')">
        <BaseBlock title="Today's Schedule">
          <template #options>
            <RouterLink :to="{ name:'timetable' }" class="btn btn-sm btn-alt-secondary">Full Timetable</RouterLink>
          </template>

          <div v-if="!todaySlots.length" class="text-center py-5 text-muted">
            <div style="font-size:36px;opacity:.3;margin-bottom:8px;">📅</div>
            <p class="mb-0" style="font-size:13px;">No lectures scheduled for today.</p>
          </div>

          <div v-else class="row g-3">
            <div v-for="slot in todaySlots" :key="slot.id" class="col-md-6 col-lg-4">
              <div style="border:1.5px solid #e8edf7;border-radius:12px;padding:16px;background:#fff;height:100%;">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div class="fw-semibold" style="color:#1a2540;">{{ slot.unit_name || `Unit #${slot.unit_id}` }}</div>
                    <div style="font-size:12px;color:#8494b0;margin-top:2px;">{{ slot.class_name || `Class #${slot.class_id}` }}</div>
                  </div>
                  <span class="as-badge blue as-mono" style="font-size:10.5px;padding:3px 8px;">
                    {{ slot.start_time }}
                  </span>
                </div>
                <div style="font-size:12px;color:#8494b0;margin-bottom:12px;">
                  <i class="si si-location-pin me-1"></i>{{ slot.hall_name || "TBA" }}
                </div>
                <RouterLink
                  v-if="authStore.userCan('attendance:start_session')"
                  :to="{ name:'attendance-scanner', query:{ unit: slot.unit_id, class: slot.class_id, hall: slot.hall_id } }"
                  class="btn btn-primary btn-sm w-100">
                  <i class="si si-camera me-1"></i> Start Attendance
                </RouterLink>
              </div>
            </div>
          </div>
        </BaseBlock>
      </template>

      <!-- ═══════════════════  STUDENT  ═══════════════════ -->
      <template v-if="authStore.userCan('dashboard:student') && !authStore.userCan('dashboard:lecturer') && !authStore.userCan('dashboard:admin')">
        <div class="row g-4">
          <!-- Rate card -->
          <div class="col-md-4">
            <BaseBlock class="h-100 mb-0">
              <div class="text-center py-2">
                <div style="font-size:11px;font-family:'DM Mono',monospace;letter-spacing:.1em;color:#8494b0;margin-bottom:8px;">
                  ATTENDANCE RATE
                </div>
                <div style="font-size:52px;font-weight:900;font-family:'Playfair Display',serif;line-height:1;"
                  :style="{ color: rateColor(attendanceRate()) }">
                  {{ attendanceRate() }}%
                </div>
                <div style="font-size:12px;color:#8494b0;margin:6px 0 12px;">
                  {{ myRate.present }} present / {{ myRate.total }} sessions
                </div>
                <div class="as-prog-track">
                  <div class="as-prog-fill" :style="{ width: attendanceRate()+'%', background: rateColor(attendanceRate()) }"></div>
                </div>
                <div v-if="attendanceRate() < 75 && myRate.total" class="mt-3 p-2 rounded-3"
                  style="background:#fff3cd;border:1px solid #ffc107;font-size:12px;color:#856404;">
                  ⚠️ Below 75% — risk of exam barring
                </div>
              </div>
            </BaseBlock>
          </div>

          <!-- Quick links -->
          <div class="col-md-8">
            <div class="row g-3">
              <div v-for="qa in [
                { label:'My Timetable',   to:'timetable',        icon:'📅', sub:'View your schedule' },
                { label:'My Attendance',  to:'my-attendance',    icon:'📋', sub:'Track your records' },
                { label:'Exam History',   to:'exam-history',     icon:'🎖️', sub:'Auth logs' },
                { label:'Face Register',  to:'face-registration',icon:'🤳', sub:'Biometric setup' },
              ]" :key="qa.label" class="col-6">
                <RouterLink :to="{ name: qa.to }" class="text-decoration-none">
                  <div class="as-stat" style="cursor:pointer;">
                    <div class="stat-ico" style="background:#f0f5ff;color:#2356d7;">
                      <span style="font-size:19px;">{{ qa.icon }}</span>
                    </div>
                    <div class="fw-semibold" style="font-size:13.5px;color:#1a2540;margin-bottom:2px;">{{ qa.label }}</div>
                    <div class="stat-lbl">{{ qa.sub }}</div>
                    <div class="stat-stripe" style="background:#2356d7;"></div>
                  </div>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </template>

    </template>
  </div>
</template>