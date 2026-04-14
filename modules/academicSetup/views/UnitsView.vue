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

// 🔥 FIX: Form aligned with new independent Unit model
const form = ref({ code: "", name: "" });

// 🔥 FIX: Removed program and year from table columns
const columns = [
  { field: "code", header: "Unit Code", width: "150px" },
  { field: "name", header: "Unit Name" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.hasRole('ADMIN')) actions.push('edit', 'delete');
  return actions;
});

onMounted(() => {
  store.fetchUnits();
});

function openCreate() {
  editing.value = null; viewMode.value = false;
  form.value = { code: "", name: "" };
  showModal.value = true;
}

function openEdit(u) {
  editing.value = u; viewMode.value = false;
  form.value = { code: u.code, name: u.name };
  showModal.value = true;
}

function openView(u) {
  editing.value = u; viewMode.value = true;
  form.value = { code: u.code, name: u.name };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { showModal.value = false; return; }
  saving.value = true;
  try {
    if (editing.value) await store.updateUnit(editing.value.id, form.value);
    else await store.createUnit(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}

async function handleDelete(u) {
  const result = await confirmAction("Delete Unit", `Delete "${u.name}"?`);
  if (result.isConfirmed) await store.deleteUnit(u.id);
}
</script>

<template>
  <BasePageHeading title="Units" subtitle="Manage course modules" />
  <div class="content">
    <DataTable
      title="Academic Units"
      :columns="columns"
      :data="store.units"
      :loading="store.loading.units"
      :total-count="store.meta.units.total"
      :current-page="store.meta.units.page"
      :total-pages="Math.ceil(store.meta.units.total / store.meta.units.limit)"
      :actions="tableActions"
      @create="openCreate" @view="openView" @edit="openEdit" @delete="handleDelete"
      @change-page="(p) => store.changePage('units', p)"
    />
  </div>

  <BaseModal :show-modal="showModal" :title="viewMode ? 'Unit Details' : editing ? 'Edit Unit' : 'New Unit'" @close="showModal = false">
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Code *</label>
        <input v-model="form.code" type="text" class="form-control" :readonly="viewMode" required />
      </div>
      
      <div class="col-md-8">
        <label class="form-label">Name *</label>
        <input v-model="form.name" type="text" class="form-control" :readonly="viewMode" required />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">{{ viewMode ? 'Close' : 'Cancel' }}</button>
      <button v-if="!viewMode" class="btn btn-primary" @click="save" :disabled="saving || !form.code || !form.name">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save" : "Create" }}
      </button>
    </template>
  </BaseModal>
</template>