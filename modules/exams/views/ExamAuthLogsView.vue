<script setup>
import { onMounted, computed } from "vue";
import { useExamsStore } from "@/stores/examStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import api from "@/utils/api";

const examsStore = useExamsStore();
const acadStore = useAcademicSetupStore();

// 🔥 FIX 1: Point the column to our new computed 'unit_display' field
const columns = [
  { field: "verified_at", header: "Date/Time", slot: "cell-time" },
  { field: "student_id", header: "Reg Number" },
  { field: "unit_display", header: "Unit", slot: "cell-unit" }, 
  { field: "status", header: "Status", slot: "cell-status" },
  { field: "match_score", header: "Match Confidence", slot: "cell-match" }
];

onMounted(() => {
  examsStore.fetchLogs();
  acadStore.fetchUnits();
});

// 🔥 FIX 2: Create a reactive mapped array. When acadStore updates, this instantly updates!
const mappedLogs = computed(() => {
  if (!examsStore.logs) return [];
  
  return examsStore.logs.map(log => {
    // Using loose equality (==) just in case one is a string and the other is an integer
    const foundUnit = acadStore.units.find(u => u.id == log.unit_id);
    
    return {
      ...log,
      unit_display: foundUnit ? foundUnit.name : `Unit #${log.unit_id}`
    };
  });
});

// Admin Document Export (PDF from Backend)
async function exportGlobalExamPDF() {
  try {
    const response = await api.get("/reports/exams/global-logs", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Global_Exam_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch (e) {
    alert("Could not generate PDF report. Ensure backend endpoint exists.");
  }
}
</script>

<template>
  <BasePageHeading title="Exam Authentication Logs" subtitle="Global verification records">
    <template #extra>
      <button class="btn btn-sm btn-alt-danger" @click="exportGlobalExamPDF">
        <i class="fa fa-file-pdf me-1"></i> Export PDF Report
      </button>
    </template>
  </BasePageHeading>
  <div class="content">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="bg-danger" style="height: 4px;"></div>
      <DataTable
        title="Verification History"
        :columns="columns"
        :data="mappedLogs" 
        :loading="examsStore.loading"
        :show-create="false"
      >
        <template #cell-time="{ value }">
          <span style="font-size: 13px;" class="text-muted">{{ new Date(value).toLocaleString() }}</span>
        </template>
        
        <template #cell-unit="{ value }">
          <span class="fw-medium">{{ value }}</span>
        </template>
        
        <template #cell-status="{ value }">
          <span class="badge" :class="value === 'verified' ? 'bg-success' : (value === 'spoof' || value === 'rejected' ? 'bg-danger' : 'bg-warning')">
            {{ value.toUpperCase() }}
          </span>
        </template>
        <template #cell-match="{ value }">
          <span class="fw-bold">{{ (value * 100).toFixed(1) }}%</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>