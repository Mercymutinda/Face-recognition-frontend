<script setup>
import { onMounted, computed } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const attendanceStore = useAttendanceStore();
const acadStore = useAcademicSetupStore();

onMounted(async () => {
  // Consolidate calls to matches your backend endpoints
  attendanceStore.fetchSessions(); 
  acadStore.fetchUnits();
  acadStore.fetchClasses();
});

const columns = [
  { field: "id", header: "Session ID" },
  { field: "date", header: "Date" },
  { field: "unit", header: "Unit" },
  { field: "cohort", header: "Class" },
  { field: "stats", header: "Attendance", slot: "cell-stats" },
];

const reportData = computed(() => {
  if (!attendanceStore.sessions) return [];
  return attendanceStore.sessions.map((s) => {
    const unitObj = acadStore.units.find((u) => u.id === s.unit_id);
    const classObj = acadStore.classes.find((c) => c.id === s.cohort_id);
    
    // 🔥 FIX: Safely check all possible time fields from the backend
    const timeVal = s.start_time || s.timestamp || s.created_at;
    const dateStr = timeVal 
      ? new Date(timeVal).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
      : "—";

    return {
      id: s.id,
      date: dateStr, // Now uses the safe date!
      unit: unitObj?.name || `Unit #${s.unit_id}`,
      cohort: classObj?.name || `Class #${s.cohort_id}`,
      present: s.present_count || 0, 
      total: classObj?.student_count || 30,
      percentage: s.attendance_percentage || 0
    };
  });
});

function exportReport() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "ID,Date,Unit,Class,Percentage\n"
    + reportData.value.map(r => `${r.id},${r.date},${r.unit},${r.cohort},${r.percentage}%`).join("\n");
  
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "attendance_report.csv");
  document.body.appendChild(link);
  link.click();
}
async function downloadPDF(sessionId) {
  try {
    const response = await api.get(`/reports/attendance/session/${sessionId}`, {
      responseType: 'blob' // CRITICAL: Tells axios to handle binary data
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_session_${sessionId}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch (e) {
    alert("Could not generate PDF report.");
  }
}
</script>

<template>
  <BasePageHeading title="Attendance Reports" subtitle="Detailed session logs">
    <template #extra>
      <button class="btn btn-sm btn-alt-primary" @click="exportReport">
        <i class="fa fa-download me-1"></i> Export CSV
      </button>
    </template>
  </BasePageHeading>
  <div class="content">
    <DataTable
      title="Attendance History"
      :columns="columns"
      :data="reportData"
      :loading="attendanceStore.loading"
      :show-create="false"
      :actions="[]"
    >
      <template #cell-stats="{ row }">
        <div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1" style="height: 6px; min-width: 80px;">
            <div class="progress-bar bg-success" :style="{ width: row.percentage + '%' }"></div>
          </div>
          <span class="small fw-bold">{{ row.percentage }}%</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>