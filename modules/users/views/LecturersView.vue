<script setup>
import { ref, onMounted } from "vue";
import api from "@/utils/api";
import DataTable from "@/components/DataTable/DataTable.vue";

const lecturers = ref([]);
const loading = ref(false);

const columns = [
  { field: "registration_number", header: "Staff ID", width: "180px" },
  { field: "full_name", header: "Lecturer Name" },
  { field: "email", header: "Email Address" },
  { field: "phone_number", header: "Phone" },
];

onMounted(async () => {
  loading.value = true;
  try {
    // Backend filter: /users?role=LECTURER
    const { data } = await api.get("/users", { params: { role: 'LECTURER' } });
    lecturers.value = data.items || data;
  } finally { loading.value = false; }
});
</script>

<template>
  <BasePageHeading title="Lecturers" subtitle="Manage faculty members" />
  <div class="content">
    <DataTable title="Academic Faculty" :columns="columns" :data="lecturers" :loading="loading" />
  </div>
</template>