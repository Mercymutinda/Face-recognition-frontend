<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/utils/api";

const records = ref([]);
const loading = ref(true);

onMounted(async () => {
  try { const { data } = await api.get("/attendance/my-history"); records.value = data ?? []; }
  finally { loading.value = false; }
});

const summary = computed(() => {
  const total   = records.value.length;
  const present = records.value.filter((r) => r.status === "present").length;
  const rate    = total ? Math.round((present / total) * 100) : 0;
  return { total, present, absent: total - present, rate };
});

const rateColor = (r) => r >= 75 ? "#415A20" : r >= 50 ? "#E65F0E" : "#c0392b";
const fmt       = (dt) => dt ? new Date(dt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—";
</script>

<template>
  <BasePageHeading title="My Attendance" subtitle="Your personal attendance record"/>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <template v-else>
      <!-- Summary cards -->
      <div class="row g-3 mb-4">
        <div v-for="card in [
          { label:'Attendance Rate', value: summary.rate + '%',  color: rateColor(summary.rate) },
          { label:'Present',         value: summary.present,     color: '#415A20' },
          { label:'Absent',          value: summary.absent,      color: '#E65F0E' },
          { label:'Total Sessions',  value: summary.total,       color: '#331B11' },
        ]" :key="card.label" class="col-6 col-md-3">
          <BaseBlock class="mb-0 text-center">
            <div style="font-size:28px;font-weight:700;" :style="{ color: card.color }">{{ card.value }}</div>
            <div class="text-muted" style="font-size:12px;">{{ card.label }}</div>
          </BaseBlock>
        </div>
      </div>

      <!-- Progress bar -->
      <BaseBlock class="mb-4">
        <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
          <span class="fw-semibold">Overall Attendance</span>
          <span :style="{ color: rateColor(summary.rate) }">{{ summary.rate }}%</span>
        </div>
        <div class="progress" style="height:10px;border-radius:5px;">
          <div class="progress-bar" :style="{ width: summary.rate + '%', background: rateColor(summary.rate) }"></div>
        </div>
        <div v-if="summary.rate < 75" class="alert alert-warning mt-3 mb-0 py-2" style="font-size:12.5px;">
          ⚠️ Your attendance is below 75%. You may be barred from sitting exams.
        </div>
      </BaseBlock>

      <!-- Records table -->
      <BaseBlock content-full title="Attendance Records">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="bg-body-light">
              <tr><th>Date</th><th>Unit</th><th>Status</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id">
                <td style="font-size:12px;">{{ fmt(r.marked_at) }}</td>
                <td>{{ r.session_id }}</td>
                <td>
                  <span class="badge" :class="r.status === 'present' ? 'bg-success' : 'bg-danger'">{{ r.status }}</span>
                </td>
                <td style="font-size:12px;font-family:'DM Mono',monospace;">
                  {{ r.confidence ? (r.confidence * 100).toFixed(1) + '%' : '—' }}
                </td>
              </tr>
              <tr v-if="!records.length">
                <td colspan="4" class="text-center text-muted py-4">No attendance records yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseBlock>
    </template>
  </div>
</template>