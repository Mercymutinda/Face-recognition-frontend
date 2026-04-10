<!-- for the admin -->
<script setup>
import { onMounted } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const attendanceStore = useAttendanceStore();
const { confirmAction } = useAlert();

// Define columns for the DataTable
const columns = [
  { field: "id", header: "ID", width: "80px" },
  { field: "unit_id", header: "Unit" },
  { field: "class_id", header: "Class" },
  { field: "hall_id", header: "Hall", slot: "cell-hall_id" },
  { field: "started_at", header: "Started", slot: "cell-started_at" },
  { field: "ended_at", header: "Ended", slot: "cell-ended_at" },
  { field: "is_active", header: "Status", slot: "cell-is_active" }
];

onMounted(() => {
  attendanceStore.fetchSessions();
});

const fmt = (dt) => dt ? new Date(dt).toLocaleString() : "—";

// Handle the custom action click from the DataTable
async function handleManage(row) {
  if (!row.is_active) {
    alert("This session has already ended.");
    return;
  }
  
  const result = await confirmAction(
    "End Session", 
    `Are you sure you want to end Session #${row.id}?`
  );
  
  if (result.isConfirmed) {
    await attendanceStore.endSession(row.id);
  }
}
</script>

<template>
  <BasePageHeading title="Attendance Sessions" subtitle="All recorded attendance sessions"/>

  <div class="content">
    <DataTable
      title="Session Logs"
      :columns="columns"
      :data="attendanceStore.sessions"
      :loading="attendanceStore.loading"
      :show-create="false"
      :actions="['manage']" 
      :action-icons="{ manage: 'fa fa-stop-circle text-danger' }"
      :action-labels="{ manage: 'End Session' }"
      @manage="handleManage"
    >
      <template #cell-hall_id="{ value }">
        <span class="text-muted">{{ value || "—" }}</span>
      </template>

      <template #cell-started_at="{ value }">
        <span class="text-muted" style="font-size:12px;">{{ fmt(value) }}</span>
      </template>

      <template #cell-ended_at="{ value }">
        <span class="text-muted" style="font-size:12px;">{{ fmt(value) }}</span>
      </template>

      <template #cell-is_active="{ value }">
        <span class="badge" :class="value ? 'bg-success' : 'bg-secondary'">
          {{ value ? "Live" : "Ended" }}
        </span>
      </template>
    </DataTable>
  </div>
</template>