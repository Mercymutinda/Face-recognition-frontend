<script setup>
import { ref, onMounted } from "vue";
import DataTable from "@/components/DataTable/DataTable.vue";
import api from "@/utils/api";

const myExams = ref([]);
const loading = ref(true);

const columns = [
  { field: "verified_at", header: "Date & Time", slot: "cell-time" },
  { field: "unit_id", header: "Unit Code" },
  { field: "liveness_score", header: "Liveness Check", slot: "cell-liveness" },
  { field: "status", header: "Status", slot: "cell-status" }
];

onMounted(async () => {
  try {
    const { data } = await api.get("/exams/my-history");
    myExams.value = data.items || data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

async function exportMyExamPDF() {
  try {
    const response = await api.get("/reports/exams/my-report", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `My_Exam_Clearance_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch (e) {
    alert("Could not generate PDF report.");
  }
}
</script>

<template>
  <BasePageHeading title="My Exam Clearances" subtitle="Your biometric exam authentication history">
    <template #extra>
      <button class="btn btn-sm btn-alt-danger" @click="exportMyExamPDF">
        <i class="fa fa-file-pdf me-1"></i> Download Clearance PDF
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="bg-danger" style="height: 4px;"></div>
      <DataTable
        title="Verified Exams"
        :columns="columns"
        :data="myExams"
        :loading="loading"
        :show-create="false"
        :actions="[]"
      >
        <template #cell-time="{ value }">
          <span class="text-muted fw-medium" style="font-size: 13px;">
            {{ new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }}
          </span>
        </template>
        <template #cell-liveness="{ value }">
          <span class="fw-bold">{{ (value * 100).toFixed(1) }}%</span>
        </template>
        <template #cell-status="{ value }">
          <span class="badge rounded-pill" :class="value === 'Verified' ? 'bg-success' : 'bg-warning'">
            {{ value.toUpperCase() }}
          </span>
        </template>
      </DataTable>
    </div>
  </div>
</template>