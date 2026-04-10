<script setup>
import { ref, onMounted } from "vue";
import api from "@/utils/api";
import DataTable from "@/components/DataTable/DataTable.vue";

const loading = ref(true);
const enrichedHistory = ref([]);

const columns = [
  { field: "date", header: "Date", width: "120px" },
  { field: "time", header: "Time Recorded", width: "130px" },
  { field: "unit", header: "Course Unit" },
  { field: "hall", header: "Lecture Hall" },
  { field: "status", header: "Status", slot: "cell-status" }
];

onMounted(async () => {
  try {
    // Hit the new optimized endpoint
    const { data } = await api.get("/attendance/my-history");
    
    // Format the timestamp into separate Date and Time strings for the table
    enrichedHistory.value = data.map(record => {
      const dateObj = new Date(record.timestamp);
      return {
        ...record,
        date: dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        time: dateObj.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })
      };
    });
  } catch (err) {
    console.error("Failed to fetch history", err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <BasePageHeading 
    title="My Attendance History" 
    subtitle="A complete record of your biometric class check-ins"
  />

  <div class="content">
    <DataTable
      title="Recorded Sessions"
      :columns="columns"
      :data="enrichedHistory"
      :loading="loading"
      :show-create="false"
    >
      <template #cell-status="{ value }">
        <span class="badge" :class="value === 'Present' ? 'bg-success' : 'bg-danger'">
          <i :class="value === 'Present' ? 'fa fa-check-circle me-1' : 'fa fa-times-circle me-1'"></i>
          {{ value }}
        </span>
      </template>
    </DataTable>
  </div>
</template>