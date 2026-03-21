<script setup>
import { ref, onMounted } from 'vue';
import { useAcademicSetupStore } from "../store/academicSetupStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const academicStore = useAcademicSetupStore();

// Define table headers to match your Backend Schema
const headers = [
  { text: "Hall Name", value: "name", sortable: true },
  { text: "Building", value: "building", sortable: true },
  { text: "Capacity", value: "capacity", sortable: true },
  { text: "Camera Ready", value: "has_camera", sortable: true },
  { text: "Actions", value: "actions" }
];

// Fetch data on mount using your existing store action
onMounted(async () => {
  await academicStore.fetchHalls();
});

// Modal state for Creating/Editing
const showModal = ref(false);
const editMode = ref(false);
const form = ref({ name: "", building: "", capacity: 50, has_camera: true });

function openCreateModal() {
  editMode.value = false;
  form.value = { name: "", building: "", capacity: 50, has_camera: true };
  showModal.value = true;
}

async function saveHall() {
  if (editMode.value) {
    // Call update_hall
  } else {
    // Call create_hall
    await academicStore.createHall(form.value);
  }
  showModal.value = false;
}
</script>

<template>
  <BasePageHeading title="Lecture Halls" subtitle="Manage physical locations and hardware status">
    <template #extra>
      <button type="button" class="btn btn-primary" @click="openCreateModal">
        <i class="fa fa-plus me-1"></i> Add Hall
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <BaseBlock title="All Halls" block-option-full-screen>
      <DataTable
        :headers="headers"
        :items="academicStore.halls"
        :loading="academicStore.loading"
      >
        <template #item-has_camera="{ item }">
          <span :class="item.has_camera ? 'badge bg-success' : 'badge bg-danger'">
            {{ item.has_camera ? 'Ready' : 'No Camera' }}
          </span>
        </template>
      </DataTable>
    </BaseBlock>
  </div>
  
  </template>