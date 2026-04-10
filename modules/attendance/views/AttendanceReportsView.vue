<script setup>
import { ref, onMounted, computed } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import api from "@/utils/api";

const attendanceStore = useAttendanceStore();
const acadStore = useAcademicSetupStore();
const rawHistory = ref([]);

onMounted(async () => {
  attendanceStore.fetchSessions();
  acadStore.fetchUnits();
  acadStore.fetchClasses();
  
  // Fetch the raw attendance logs to count actual presents
  try {
    const { data } = await api.get("/attendance/history");
    rawHistory.value = data || [];
  } catch (e) {
    console.error("Could not fetch attendance history", e);
  }
});

const columns = [
  { field: "date", header: "Date" },
  { field: "unit", header: "Unit" },
  { field: "cohort", header: "Class" },
  { field: "stats", header: "Attendance", slot: "cell-stats" }
];

const reportData = computed(() => {
  if (!attendanceStore.sessions) return [];

  return attendanceStore.sessions.map(s => {
    // Look up human-readable names
    const unitName = acadStore.units.find(u => u.id === s.unit_id)?.name || `Unit #${s.unit_id}`;
    const className = acadStore.classes.find(c => c.id === s.cohort_id)?.name || `Cohort #${s.cohort_id}`;
    
    // Format Date
    const date = s.start_time 
      ? new Date(s.start_time).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) 
      : 'Unknown';
    
    // Count REAL presents by matching the session_id to the attendance logs
    const presents = rawHistory.value.filter(log => log.session_id === s.id).length;
    
    // For the total, we ideally want the cohort size. We will default to 30 if unknown.
    // If your backend adds student_count to the cohort object, replace 30 with that value.
    const total = 30; 
    const percentage = total > 0 ? Math.round((presents / total) * 100) : 0;

    return { 
      id: s.id, 
      date, 
      unit: unitName, 
      cohort: className, 
      present: presents, 
      total, 
      percentage 
    };
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