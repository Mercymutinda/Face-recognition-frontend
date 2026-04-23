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

const form = ref({ code: "", name: "", description: "" });

const columns = [
  { field: "code", header: "Code", width: "120px" },
  { field: "name", header: "Program Name" },
  { field: "description", header: "Description" },
];

onMounted(() => store.fetchPrograms());

// 🔥 FIX: Admin gets 3 actions, everyone else gets [] (no actions)
const tableActions = computed(() => {
  return authStore.hasRole('ADMIN') ? ['view', 'edit', 'delete'] : [];
});

function openCreate() {
  editing.value = null;
  viewMode.value = false;
  form.value = { code: "", name: "", description: "" };
  showModal.value = true;
}

function openEdit(p) {
  editing.value = p;
  viewMode.value = false;
  form.value = { code: p.code, name: p.name, description: p.description || "" };
  showModal.value = true;
}

function openView(p) {
  editing.value = p;
  viewMode.value = true;
  form.value = { code: p.code, name: p.name, description: p.description || "" };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) {
    showModal.value = false;
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await store.updateProgram(editing.value.id, form.value);
    } else {
      await store.createProgram(form.value);
    }
    showModal.value = false;
  } catch (error) {
    console.error("Save error:", error);
  } finally {
    saving.value = false;
  }
}

async function deactivate(p) {
  const result = await confirmAction(
    "Delete Program",
    `Are you sure you want to Delete "${p.name}"?`
  );
  if (!result.isConfirmed) return;
  try {
    await store.deleteProgram(p.id);
  } catch (error) {
    console.error("Deletion error:", error);
  }
}
</script>

<template>
  <BasePageHeading title="Programs" subtitle="Degree and diploma programmes offered">
    <template #extra>
      <button
        v-if="authStore.hasRole('ADMIN')"
        class="btn btn-primary btn-sm"
        @click="openCreate"
      >
        <i class="fa fa-plus me-1"></i> New Program
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <DataTable
      title="Academic Programs"
      :columns="columns"
      :data="store.programs"
      :loading="store.loading.programs"
      :total-count="store.meta.programs.total"
      :current-page="store.meta.programs.page"
      :total-pages="Math.ceil(store.meta.programs.total / store.meta.programs.limit)"
      :actions="tableActions"
      :show-create="false" 
      @create="openCreate" 
      @view="openView"
      @edit="openEdit"
      @delete="deactivate"
      @change-page="(p) => store.changePage('programs', p)"
    />
  </div>

  <BaseModal
    :show-modal="showModal"
    :title="viewMode ? 'Program Details' : editing ? 'Edit Program' : 'New Program'"
    @close="showModal = false"
  >
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label fw-medium">Code *</label>
        <input v-model="form.code" type="text" class="form-control" :readonly="viewMode" required />
      </div>
      <div class="col-12">
        <label class="form-label fw-medium">Name *</label>
        <input v-model="form.name" type="text" class="form-control" :readonly="viewMode" required />
      </div>
      <div class="col-12">
        <label class="form-label fw-medium">Description</label>
        <textarea v-model="form.description" class="form-control" rows="3" :readonly="viewMode"></textarea>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">
        {{ viewMode ? "Close" : "Cancel" }}
      </button>
      <button
        v-if="!viewMode"
        class="btn btn-primary"
        @click="save"
        :disabled="saving || !form.code || !form.name"
      >
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save Changes" : "Create Program" }}
      </button>
    </template>
  </BaseModal>
</template>