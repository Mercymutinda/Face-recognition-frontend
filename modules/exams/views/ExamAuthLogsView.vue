<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useExamsStore } from "@/stores/examStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const acadStore = useAcademicSetupStore();
const examsStore = useExamsStore();

const filterUnit = ref("");
const filterStatus = ref("");

const columns = [
  { field: "student_id", header: "Student ID" },
  { field: "unit_id", header: "Unit", slot: "cell-unit_id" },
  { field: "hall_id", header: "Hall", slot: "cell-hall_id" },
  { field: "liveness_score", header: "Liveness", slot: "cell-liveness_score" },
  { field: "match_score", header: "Match", slot: "cell-match_score" },
  { field: "status", header: "Status", slot: "cell-status" },
  { field: "verified_at", header: "Time", slot: "cell-verified_at" }
];

onMounted(() => {
  examsStore.fetchLogs();
  acadStore.fetchUnits();
  acadStore.fetchHalls();
});

const filtered = computed(() => {
  return examsStore.logs.filter((l) =>
    (!filterUnit.value || l.unit_id == filterUnit.value) &&
    (!filterStatus.value || l.status === filterStatus.value)
  );
});

const summary = computed(() => ({
  total: filtered.value.length,
  verified: filtered.value.filter((l) => l.status === "verified").length,
  rejected: filtered.value.filter((l) => l.status === "rejected").length,
  spoof: filtered.value.filter((l) => l.status === "spoof").length,
}));

const unitName = (id) => acadStore.units.find((u) => u.id === id)?.name || `Unit #${id}`;
const hallName = (id) => acadStore.halls.find((h) => h.id === id)?.name || (id ? `Hall #${id}` : "—");
const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const pct = (v) => v != null ? (v * 100).toFixed(1) + "%" : "—";

const statusBadge = (s) => ({
  verified: "bg-success",
  rejected: "bg-danger",
  spoof: "bg-warning text-dark",
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

    <DataTable
      title="Authentication Records"
      :columns="columns"
      :data="filtered"
      :loading="examsStore.loading"
      :show-create="false"
    >
      <template #cell-unit_id="{ value }">
        <span class="text-muted" style="font-size:12.5px;">{{ unitName(value) }}</span>
      </template>

      <template #cell-hall_id="{ value }">
        <span class="text-muted" style="font-size:12.5px;">{{ hallName(value) }}</span>
      </template>

      <template #cell-liveness_score="{ value }">
        <div class="d-flex align-items-center gap-2">
          <div style="width:48px;height:4px;border-radius:2px;background:rgba(0,0,0,.08);flex-shrink:0;">
            <div style="height:100%;border-radius:2px;background:#415A20;" :style="{ width: value ? (value*100)+'%' : '0%' }"></div>
          </div>
          <span style="font-size:11px;font-family:'DM Mono',monospace;">{{ pct(value) }}</span>
        </div>
      </template>

      <template #cell-match_score="{ value }">
        <div class="d-flex align-items-center gap-2">
          <div style="width:48px;height:4px;border-radius:2px;background:rgba(0,0,0,.08);flex-shrink:0;">
            <div style="height:100%;border-radius:2px;background:#E65F0E;" :style="{ width: value ? (value*100)+'%' : '0%' }"></div>
          </div>
          <span style="font-size:11px;font-family:'DM Mono',monospace;">{{ pct(value) }}</span>
        </div>
      </template>

      <template #cell-status="{ value }">
        <span :class="['badge', statusBadge(value)]">{{ value }}</span>
      </template>

      <template #cell-verified_at="{ value }">
        <span class="text-muted" style="font-size:11.5px;">{{ fmt(value) }}</span>
      </template>
    </DataTable>
  </div>
</template>