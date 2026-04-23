<script setup>
import { onMounted, computed } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const attendanceStore = useAttendanceStore();
const acadStore = useAcademicSetupStore();
const { confirmAction } = useAlert();

const columns = [
  { field: "id", header: "Session ID", width: "100px" },
  { field: "unit_display", header: "Unit" },
  { field: "class_display", header: "Class" },
  { field: "started_at", header: "Started", slot: "cell-started_at" },
  { field: "is_active", header: "Status", slot: "cell-is_active" }
];

onMounted(() => {
  attendanceStore.fetchSessions();
  acadStore.fetchUnits();
  acadStore.fetchClasses();
});

// Map IDs to actual names for the table
const mappedSessions = computed(() => {
  if (!attendanceStore.sessions) return [];
  return attendanceStore.sessions.map(s => ({
    ...s,
    unit_display: acadStore.units.find(u => u.id === s.unit_id)?.name || `Unit #${s.unit_id}`,
    class_display: acadStore.classes.find(c => c.id === s.cohort_id)?.name || `Cohort #${s.cohort_id}`,
    started_at: s.start_time
  }));
});

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-KE', { hour12: true }) : "—";

async function handleManage(row) {
  if (!row.is_active) {
    useAlert().toastError("Notice", "Session already ended.");
    return;
  }
  const result = await confirmAction("End Session", `End Session #${row.id}?`);
  if (result.isConfirmed) {
    await attendanceStore.endSession(row.id);
  }
}

// Admin Document Export (CSV for logs)
function exportLogsCSV() {
  const headers = ["Session ID", "Unit", "Class", "Started At", "Status"];
  const rows = mappedSessions.value.map(s => [
    s.id, `"${s.unit_display}"`, `"${s.class_display}"`, `"${fmt(s.started_at)}"`, s.is_active ? "Live" : "Ended"
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `Admin_Session_Logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
}
</script>

<template>
  <BasePageHeading title="Global Attendance Sessions" subtitle="Monitor all recorded attendance sessions">
    <template #extra>
      <button class="btn btn-sm btn-alt-success" @click="exportLogsCSV">
        <i class="fa fa-file-csv me-1"></i> Export CSV
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="bg-primary" style="height: 4px;"></div>
      <DataTable
        title="Session Logs"
        :columns="columns"
        :data="mappedSessions"
        :loading="attendanceStore.loading"
        :show-create="false"
        :actions="['manage']" 
        :action-icons="{ manage: 'fa fa-stop-circle text-danger' }"
        :action-labels="{ manage: 'End Session' }"
        @manage="handleManage"
      >
        <template #cell-started_at="{ value }">
          <span class="text-muted fw-medium" style="font-size:12px;">{{ fmt(value) }}</span>
        </template>
        <template #cell-is_active="{ value }">
          <span class="badge rounded-pill" :class="value ? 'bg-success pulse' : 'bg-secondary'">
            {{ value ? "LIVE" : "ENDED" }}
          </span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.pulse { animation: pulse-anim 2s infinite; }
@keyframes pulse-anim { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
</style>