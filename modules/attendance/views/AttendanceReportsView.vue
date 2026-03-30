<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore }    from "~/academicSetup/store/academicSetupStore";
import api from "@/utils/api";

const acadStore  = useAcademicSetupStore();
const reports    = ref([]);
const loading    = ref(true);
const filterUnit = ref("");

onMounted(async () => {
  try {
    await acadStore.fetchUnits();
    const { data } = await api.get("/attendance/reports");
    reports.value = data ?? [];
  } finally { loading.value = false; }
});

const filtered = computed(() =>
  filterUnit.value ? reports.value.filter((r) => r.unit_id == filterUnit.value) : reports.value
);

const totalPresent = computed(() => filtered.value.reduce((a, r) => a + (r.present_count || 0), 0));
const totalRecords = computed(() => filtered.value.reduce((a, r) => a + (r.total || 0), 0));
const overallRate  = computed(() => totalRecords.value ? Math.round((totalPresent.value / totalRecords.value) * 100) : 0);

const unitName = (id) => acadStore.units.find((u) => u.id === id)?.name || `Unit #${id}`;
const rateOf   = (r)  => r.total ? Math.round((r.present_count / r.total) * 100) : 0;
const rateColor= (p)  => p >= 75 ? "#415A20" : p >= 50 ? "#E65F0E" : "#c0392b";
const fmt      = (dt) => dt ? new Date(dt).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";
</script>

<template>
  <BasePageHeading title="Attendance Reports" subtitle="Session summaries and attendance rates">
    <template #extra>
      <select v-model="filterUnit" class="form-select form-select-sm" style="width:180px;">
        <option value="">All Units</option>
        <option v-for="u in acadStore.units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </template>
  </BasePageHeading>

  <div class="content">
    <!-- Overview cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <BaseBlock class="mb-0 text-center py-3">
          <div style="font-size:38px;font-weight:700;" :style="{ color: rateColor(overallRate) }">
            {{ overallRate }}%
          </div>
          <div class="text-muted" style="font-size:12px;">Overall Attendance Rate</div>
          <div class="progress mt-2" style="height:6px;border-radius:3px;">
            <div class="progress-bar" :style="{ width: overallRate+'%', background: rateColor(overallRate) }"></div>
          </div>
        </BaseBlock>
      </div>
      <div class="col-md-4">
        <BaseBlock class="mb-0 text-center py-3">
          <div style="font-size:38px;font-weight:700;color:#415A20;">{{ totalPresent }}</div>
          <div class="text-muted" style="font-size:12px;">Total Present Records</div>
        </BaseBlock>
      </div>
      <div class="col-md-4">
        <BaseBlock class="mb-0 text-center py-3">
          <div style="font-size:38px;font-weight:700;color:#331B11;">{{ filtered.length }}</div>
          <div class="text-muted" style="font-size:12px;">Completed Sessions</div>
        </BaseBlock>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr>
              <th>Unit</th>
              <th>Class</th>
              <th>Started</th>
              <th>Ended</th>
              <th class="text-center">Present / Total</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.session_id">
              <td class="fw-semibold" style="font-size:13px;">{{ unitName(r.unit_id) }}</td>
              <td class="text-muted" style="font-size:12px;">{{ r.class_id }}</td>
              <td class="text-muted" style="font-size:11.5px;">{{ fmt(r.started_at) }}</td>
              <td class="text-muted" style="font-size:11.5px;">{{ fmt(r.ended_at) }}</td>
              <td class="text-center" style="font-size:13px;">
                <span style="font-weight:600;color:#415A20;">{{ r.present_count }}</span>
                <span class="text-muted"> / {{ r.total }}</span>
              </td>
              <td style="min-width:120px;">
                <div class="d-flex align-items-center gap-2">
                  <div style="flex:1;height:6px;border-radius:3px;background:rgba(0,0,0,.08);">
                    <div style="height:100%;border-radius:3px;transition:.3s;"
                      :style="{ width: rateOf(r)+'%', background: rateColor(rateOf(r)) }"></div>
                  </div>
                  <span style="font-size:12px;font-weight:600;min-width:36px;"
                    :style="{ color: rateColor(rateOf(r)) }">
                    {{ rateOf(r) }}%
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-center text-muted py-4">No completed sessions yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>
</template>