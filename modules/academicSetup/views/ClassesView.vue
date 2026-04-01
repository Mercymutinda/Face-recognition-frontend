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

// Form State aligned with Backend: name, program_id, year_of_study
const form = ref({ name: "", program_id: null, year_of_study: 1 });

const columns = [
  { field: "name", header: "Class Name" },
  { field: "program_name", header: "Programme" }, 
  { field: "year_of_study", header: "Year", width: "100px" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.userCan('classes:write')) actions.push('edit');
  if (authStore.userCan('classes:delete')) actions.push('delete');
  return actions;
});

onMounted(() => {
  store.fetchClasses();
  store.fetchPrograms();
});

function openCreate() {
  editing.value = null; viewMode.value = false;
  form.value = { name: "", program_id: null, year_of_study: 1 };
  showModal.value = true;
}

function openEdit(c) {
  editing.value = c; viewMode.value = false;
  form.value = { name: c.name, program_id: c.program_id, year_of_study: c.year_of_study };
  showModal.value = true;
}

function openView(c) {
  editing.value = c; viewMode.value = true;
  form.value = { name: c.name, program_id: c.program_id, year_of_study: c.year_of_study };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { showModal.value = false; return; }
  saving.value = true;
  try {
    if (editing.value) await store.updateClass(editing.value.id, form.value);
    else await store.createClass(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}

async function handleDelete(c) {
  const result = await confirmAction("Delete Class", `Delete "${c.name}"?`);
  if (result.isConfirmed) await store.deleteClass(c.id);
}
</script>

<template>
  <BasePageHeading title="Classes" subtitle="Manage student cohorts and study years" />
  <div class="content">
    <DataTable
      title="Academic Classes"
      :columns="columns"
      :data="store.classes"
      :loading="store.loading.cohorts"
      :total-count="store.meta.cohorts.total"
      :current-page="store.meta.cohorts.page"
      :total-pages="Math.ceil(store.meta.cohorts.total / store.meta.cohorts.limit)"
      :actions="tableActions"
      @create="openCreate" @view="openView" @edit="openEdit" @delete="handleDelete"
      @change-page="(p) => store.changePage('cohorts', p)"
    />
  </div>

  <BaseModal :show-modal="showModal" :title="viewMode ? 'Class Details' : editing ? 'Edit Class' : 'New Class'" @close="showModal = false">
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">Class Name *</label>
        <input v-model="form.name" type="text" class="form-control" :readonly="viewMode" required />
      </div>
      <div class="col-md-8">
        <label class="form-label">Programme *</label>
        <select v-model="form.program_id" class="form-select" :disabled="viewMode">
          <option :value="null">-- Select Programme --</option>
          <option v-for="p in store.programs" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Year of Study *</label>
        <input v-model.number="form.year_of_study" type="number" class="form-control" :readonly="viewMode" required />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">{{ viewMode ? 'Close' : 'Cancel' }}</button>
      <button v-if="!viewMode" class="btn btn-primary" @click="save" :disabled="saving || !form.name || !form.program_id">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save Changes" : "Create Class" }}
      </button>
    </template>
  </BaseModal>
</template>