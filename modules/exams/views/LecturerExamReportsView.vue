<script setup>
import { onMounted } from "vue";
import { useExamsStore } from "@/stores/examStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import api from "@/utils/api";

const examsStore = useExamsStore();
const acadStore = useAcademicSetupStore();

const columns = [
  { field: "verified_at", header: "Date/Time", slot: "cell-time" },
  { field: "student_name", header: "Student Name" },
  { field: "student_id", header: "Reg Number" },
  { field: "unit_id", header: "Unit", slot: "cell-unit" },
  { field: "status", header: "Status", slot: "cell-status" }
];

onMounted(() => {
  examsStore.fetchLecturerLogs(); // 🔥 Hits the new Lecturer-only endpoint
  acadStore.fetchUnits();
});

const getUnitName = (id) => acadStore.units.find(u => u.id === id)?.name || `Unit #${id}`;

// Fetch PDF from the new Lecturer Report Endpoint
async function exportLecturerExamPDF() {
  try {
    const response = await api.get("/reports/exams/lecturer-report", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `My_Exam_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch (e) {
    alert("Could not generate PDF report.");
  }
}
</script>

<template>
  <BasePageHeading title="My Exam Reports" subtitle="Authentication logs for exams you proctored">
    <template #extra>
      <button class="btn btn-sm btn-alt-danger" @click="exportLecturerExamPDF">
        <i class="fa fa-file-pdf me-1"></i> Download PDF Report
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="bg-primary" style="height: 4px;"></div>
      <DataTable
        title="Student Verification Logs"
        :columns="columns"
        :data="examsStore.logs"
        :loading="examsStore.loading"
        :show-create="false"
        :actions="[]"
      >
        <template #cell-time="{ value }">
          <span style="font-size: 13px;" class="text-muted fw-medium">{{ new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short'}) }}</span>
        </template>
        <template #cell-unit="{ value }">
          <span class="fw-medium">{{ getUnitName(value) }}</span>
        </template>
        <template #cell-status="{ value }">
          <span class="badge rounded-pill" :class="value === 'verified' ? 'bg-success' : (value === 'spoof' || value === 'rejected' ? 'bg-danger' : 'bg-warning')">
            <i :class="value === 'verified' ? 'fa fa-check' : 'fa fa-times'" class="me-1"></i> {{ value.toUpperCase() }}
          </span>
        </template>
      </DataTable>
    </div>
  </div>
</template>