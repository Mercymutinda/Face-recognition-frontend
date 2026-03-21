<script setup>
import { onMounted } from "vue";
import { useAcademicSetupStore } from "../store/academicSetupStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const store = useAcademicSetupStore();

const headers = [
  { text: "Code", value: "code" },
  { text: "Program Name", value: "name" },
  { text: "Actions", value: "actions" }
];

onMounted(() => store.fetchPrograms());
</script>

<template>
  <BasePageHeading title="Programs" subtitle="Manage university academic degrees" />
  <div class="content">
    <BaseBlock title="All Programs">
      <template #options>
        <button class="btn-block-option" @click="store.fetchPrograms">
          <i class="si si-refresh"></i>
        </button>
      </template>
      <DataTable :headers="headers" :items="store.programs" :loading="store.loading" />
    </BaseBlock>
  </div>
</template>