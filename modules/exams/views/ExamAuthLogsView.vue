<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore }    from "~/academicSetup/store/academicSetupStore";
import api from "@/utils/api";

const acadStore  = useAcademicSetupStore();
const logs       = ref([]);
const loading    = ref(true);
const filterUnit = ref("");
const filterStatus = ref("");

onMounted(async () => {
  try {
    const params = {};
    if (filterUnit.value) params.unit_id = filterUnit.value;
    const [l] = await Promise.all([
      api.get("/exam-auth/logs", { params }),
      acadStore.fetchUnits(),
      acadStore.fetchHalls(),
    ]);
    logs.value = l.data ?? [];
  } finally { loading.value = false; }
});

const filtered = computed(() => {
  return logs.value.filter((l) =>
    (!filterUnit.value   || l.unit_id == filterUnit.value) &&
    (!filterStatus.value || l.status === filterStatus.value)
  );
});

const summary = computed(() => ({
  total:    filtered.value.length,
  verified: filtered.value.filter((l) => l.status === "verified").length,
  rejected: filtered.value.filter((l) => l.status === "rejected").length,
  spoof:    filtered.value.filter((l) => l.status === "spoof").length,
}));

const unitName = (id) => acadStore.units.find((u) => u.id === id)?.name || `Unit #${id}`;
const hallName = (id) => acadStore.halls.find((h) => h.id === id)?.name || (id ? `Hall #${id}` : "—");
const fmt      = (dt)  => dt ? new Date(dt).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";
const pct      = (v)   => v != null ? (v * 100).toFixed(1) + "%" : "—";

const statusBadge = (s) => ({
  verified: "bg-success",
  rejected: "bg-danger",
  spoof:    "bg-warning text-dark",
}[s] || "bg-secondary");
</script>

<template>
  <BasePageHeading title="Exam Auth Logs" subtitle="All biometric verification records">
    <template #extra>
      <div class="d-flex gap-2">
        <select v-model="filterUnit" class="form-select form-select-sm" style="width:170px;">
          <option value="">All Units</option>
          <option v-for="u in acadStore.units" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <select v-model="filterStatus" class="form-select form-select-sm" style="width:130px;">
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="spoof">Spoof</option>
        </select>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <!-- Summary row -->
    <div class="row g-3 mb-4">
      <div v-for="s in [
        { label:'Total',    val: summary.total,    color:'#331B11' },
        { label:'Verified', val: summary.verified, color:'#415A20' },
        { label:'Rejected', val: summary.rejected, color:'#c0392b' },
        { label:'Spoof',    val: summary.spoof,    color:'#E65F0E' },
      ]" :key="s.label" class="col-6 col-md-3">
        <BaseBlock class="mb-0 text-center py-3">
          <div style="font-size:28px;font-weight:700;" :style="{ color: s.color }">{{ s.val }}</div>
          <div class="text-muted" style="font-size:12px;">{{ s.label }}</div>
        </BaseBlock>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr>
              <th>Student</th>
              <th>Unit</th>
              <th>Hall</th>
              <th>Liveness</th>
              <th>Match</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in filtered" :key="l.id">
              <td>
                <div class="fw-semibold" style="font-size:13px;">{{ l.student_id }}</div>
              </td>
              <td class="text-muted" style="font-size:12.5px;">{{ unitName(l.unit_id) }}</td>
              <td class="text-muted" style="font-size:12.5px;">{{ hallName(l.hall_id) }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:48px;height:4px;border-radius:2px;background:rgba(0,0,0,.08);flex-shrink:0;">
                    <div style="height:100%;border-radius:2px;background:#415A20;"
                      :style="{ width: l.liveness_score ? (l.liveness_score*100)+'%' : '0%' }"></div>
                  </div>
                  <span style="font-size:11px;font-family:'DM Mono',monospace;">{{ pct(l.liveness_score) }}</span>
                </div>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:48px;height:4px;border-radius:2px;background:rgba(0,0,0,.08);flex-shrink:0;">
                    <div style="height:100%;border-radius:2px;background:#E65F0E;"
                      :style="{ width: l.match_score ? (l.match_score*100)+'%' : '0%' }"></div>
                  </div>
                  <span style="font-size:11px;font-family:'DM Mono',monospace;">{{ pct(l.match_score) }}</span>
                </div>
              </td>
              <td><span :class="['badge', statusBadge(l.status)]">{{ l.status }}</span></td>
              <td class="text-muted" style="font-size:11.5px;">{{ fmt(l.verified_at) }}</td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="7" class="text-center text-muted py-4">No records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>
</template>