<script setup>
import { onMounted } from "vue";
import { useUsersStore } from "@/stores/usersStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const usersStore = useUsersStore();

const columns = [
  { field: "registration_number", header: "Reg No", width: "180px" },
  { field: "full_name", header: "Student Name" },
  { field: "program", header: "Program" },
  { field: "year_of_study", header: "Year", width: "100px" },
];

onMounted(() => {
  // Pass the role as a parameter to your store action
  usersStore.fetchUsers({ role: 'STUDENT' });
});
</script>

<template>
  <BasePageHeading title="Students" subtitle="Manage the student body" />
  <div class="content">
    <DataTable 
      title="Registered Students" 
      :columns="columns" 
      :data="usersStore.users" 
      :loading="usersStore.loading" 
    />
  </div>
</template>