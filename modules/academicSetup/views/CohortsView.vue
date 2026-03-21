<script setup>
import { onMounted } from "vue";
import { useAcademicSetupStore } from "../store/academicSetupStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const store = useAcademicSetupStore();

const headers = [
  { text: "Class Name", value: "name" },
  { text: "Program ID", value: "program_id" },
  { text: "Year", value: "year_of_study" },
  { text: "Actions", value: "actions" }
];

onMounted(() => store.fetchCohorts());
</script>

<template>
  <BasePageHeading title="Classes" subtitle="Manage student cohorts and years" />
  <div class="content">
    <BaseBlock title="All Cohorts">
      <DataTable :headers="headers" :items="store.cohorts" :loading="store.loading" />
    </BaseBlock>
  </div>
</template>