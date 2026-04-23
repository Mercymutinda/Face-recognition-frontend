<script setup>
import { onMounted } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import api from "@/utils/api";

const attendanceStore = useAttendanceStore();

const columns = [
  { field: "timestamp", header: "Date & Time", slot: "cell-time" },
  { field: "unit", header: "Unit" },
  { field: "hall", header: "Hall", slot: "cell-hall" },
  { field: "status", header: "Status", slot: "cell-status" }
];

onMounted(() => {
  // Hits the updated /attendance/my-history endpoint
  attendanceStore.fetchHistory(); 
});

async function exportMyAttendancePDF() {
  try {
    const response = await api.get("/reports/attendance/my-report", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `My_Attendance_Record_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch (e) {
    alert("Could not generate PDF report. Ensure the backend endpoint is running.");
  }
}
</script>

<template>
  <BasePageHeading title="My Attendance History" subtitle="Your official academic attendance record">
    <template #extra>
      <button class="btn btn-sm btn-alt-success" @click="exportMyAttendancePDF">
        <i class="fa fa-file-pdf me-1"></i> Download Official Record
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="bg-success" style="height: 4px;"></div>
      <DataTable
        title="Class Sessions Attended"
        :columns="columns"
        :data="attendanceStore.history"
        :loading="attendanceStore.loading"
        :show-create="false"
        :actions="[]"
      >
        <template #cell-time="{ value }">
          <span class="text-muted fw-medium" style="font-size: 13px;">
            {{ new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }}
          </span>
        </template>
        <template #cell-hall="{ value }">
          <span class="badge bg-body-secondary text-dark">{{ value || "N/A" }}</span>
        </template>
        <template #cell-status="{ value }">
          <span class="badge rounded-pill" :class="value === 'Present' ? 'bg-success' : 'bg-danger'">
            <i :class="value === 'Present' ? 'fa fa-check' : 'fa fa-times'" class="me-1"></i> {{ value }}
          </span>
        </template>
      </DataTable>
    </div>
  </div>
</template>