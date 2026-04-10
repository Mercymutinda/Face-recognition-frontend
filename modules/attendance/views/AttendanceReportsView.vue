<script setup>
import { onMounted, computed } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const attendanceStore = useAttendanceStore();
const acadStore = useAcademicSetupStore();

onMounted(() => {
  attendanceStore.fetchSessions();
  acadStore.fetchUnits();
  acadStore.fetchClasses();
});

const columns = [
  { field: "date", header: "Date" },
  { field: "unit", header: "Unit" },
  { field: "cohort", header: "Class" },
  { field: "stats", header: "Attendance", slot: "cell-stats" }
];

const reportData = computed(() => {
  // Map raw session logs to include Unit Names and Class Names
  return attendanceStore.sessions.map(s => {
    const unitName = acadStore.units.find(u => u.id === s.unit_id)?.name || s.unit_id;
    const className = acadStore.classes.find(c => c.id === s.class_id)?.name || s.class_id;
    const date = new Date(s.started_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Simulate present vs total for now (Backend should ideally return this)
    const present = Math.floor(Math.random() * 10) + 15; 
    const total = present + Math.floor(Math.random() * 5);
    const percentage = Math.round((present / total) * 100);

    return { id: s.id, date, unit: unitName, cohort: className, present, total, percentage };
  });
});
</script>

<template>
  <BasePageHeading title="Attendance Reports" subtitle="Overview of class attendance metrics" />
  <div class="content">
    <DataTable title="Session Summaries" :columns="columns" :data="reportData" :loading="attendanceStore.loading">
      <template #cell-stats="{ row }">
        <div class="d-flex align-items-center gap-3">
          <div class="progress" style="width: 100px; height: 6px;">
            <div class="progress-bar" :class="row.percentage >= 75 ? 'bg-success' : 'bg-warning'" :style="{ width: row.percentage + '%' }"></div>
          </div>
          <span class="fs-sm fw-medium">{{ row.present }} / {{ row.total }} ({{ row.percentage }}%)</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>