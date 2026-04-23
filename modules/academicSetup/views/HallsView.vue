<script setup>
import { ref, onMounted, computed } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore.js";
import { useAuthStore } from "@/stores/authStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { confirmAction } = useAlert();
const store = useAcademicSetupStore();
const authStore = useAuthStore();

const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const viewMode = ref(false);

const form = ref({ name: "", building: "", capacity: 40, has_camera: true, camera_count: 1 });

const columns = [
  { field: "name", header: "Hall Name", width: "150px" },
  { field: "building", header: "Building/Block" },
  { field: "capacity", header: "Capacity" },
  { field: "camera_count", header: "Cameras" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.hasRole('ADMIN')) actions.push('edit', 'delete');
  return actions;
});

onMounted(() => store.fetchHalls());

function openCreate() {
  editing.value = null;
  viewMode.value = false;
  form.value = { name: "", building: "", capacity: 40, has_camera: true, camera_count: 1 };
  showModal.value = true;
}

function openEdit(h) {
  editing.value = h;
  viewMode.value = false;
  form.value = { ...h };
  showModal.value = true;
}

function openView(h) {
  editing.value = h;
  viewMode.value = true;
  form.value = { ...h };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { showModal.value = false; return; }
  saving.value = true;
  try {
    if (editing.value) await store.updateHall(editing.value.id, form.value);
    else await store.createHall(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}

async function handleDelete(h) {
  const result = await confirmAction("Delete Hall", `Delete "${h.name}"?`);
  if (result.isConfirmed) await store.deleteHall(h.id);
}
</script>

<template>
  <BasePageHeading title="Lecture Halls" subtitle="Manage venues and camera setups">
    <template #extra>
      <button v-if="authStore.hasRole('ADMIN')" class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New Hall
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <DataTable
      title="Available Halls"
      :columns="columns"
      :data="store.halls"
      :loading="store.loading.halls"
      :total-count="store.meta.halls.total"
      :current-page="store.meta.halls.page"
      :total-pages="Math.ceil(store.meta.halls.total / store.meta.halls.limit)"
      :actions="tableActions"
      @create="openCreate" @view="openView" @edit="openEdit" @delete="handleDelete"
      @change-page="(p) => store.changePage('halls', p)"
    />
  </div>

  <BaseModal :show-modal="showModal" :title="viewMode ? 'Hall Details' : editing ? 'Edit Hall' : 'New Hall'" @close="showModal = false">
    <div class="row g-3">
      <div class="col-md-8">
        <label class="form-label fw-medium">Name *</label>
        <input v-model="form.name" type="text" class="form-control" :readonly="viewMode" required />
      </div>
      <div class="col-md-4">
        <label class="form-label fw-medium">Capacity</label>
        <input v-model.number="form.capacity" type="number" class="form-control" :readonly="viewMode" />
      </div>
      <div class="col-12">
        <label class="form-label fw-medium">Building / Block</label>
        <input v-model="form.building" type="text" class="form-control" :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <div class="form-check form-switch mt-2">
          <input v-model="form.has_camera" class="form-check-input" type="checkbox" id="hasCam" :disabled="viewMode" />
          <label class="form-check-label" for="hasCam">Has Camera</label>
        </div>
      </div>
      <div class="col-md-6" v-if="form.has_camera">
        <label class="form-label fw-medium">Camera Count</label>
        <input v-model.number="form.camera_count" type="number" class="form-control" min="1" :readonly="viewMode" />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">{{ viewMode ? 'Close' : 'Cancel' }}</button>
      <button v-if="!viewMode" class="btn btn-primary" @click="save" :disabled="saving || !form.name">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save Changes" : "Create Hall" }}
      </button>
    </template>
  </BaseModal>
</template>