<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore } from "@/stores/academicSetupStore";
import { useAuthStore } from "@/stores/authStore";

const store     = useAcademicSetupStore();
const authStore = useAuthStore();
const showModal = ref(false);
const editing   = ref(null);
const saving    = ref(false);
const search    = ref("");
const form      = ref({ name: "", program_id: "", year: new Date().getFullYear() });

onMounted(() => Promise.all([store.fetchClasses(), store.fetchPrograms()]));

const filtered = computed(() => {
  if (!search.value) return store.classes;
  const q = search.value.toLowerCase();
  return store.classes.filter((c) => c.name.toLowerCase().includes(q));
});

function progName(id) { return store.programs.find((p) => p.id === id)?.name || "—"; }

function openCreate() {
  editing.value   = null;
  form.value      = { name: "", program_id: "", year: new Date().getFullYear() };
  showModal.value = true;
}
function openEdit(c) {
  editing.value   = c;
  form.value      = { name: c.name, program_id: c.program_id, year: c.year };
  showModal.value = true;
}
async function save() {
  saving.value = true;
  try {
    if (editing.value) await store.updateClass(editing.value.id, form.value);
    else               await store.createClass(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}
</script>

<template>
  <BasePageHeading title="Classes" subtitle="Student groups per programme year">
    <template #extra>
      <div class="d-flex gap-2">
        <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Search…" style="width:180px;"/>
        <button v-if="authStore.userCan('classes:write')"
          class="btn btn-primary btn-sm" @click="openCreate">
          <i class="fa fa-plus me-1"></i> New Class
        </button>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr>
              <th>Class Name</th>
              <th>Programme</th>
              <th>Year</th>
              <th v-if="authStore.userCan('classes:write')" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id">
              <td class="fw-semibold">{{ c.name }}</td>
              <td class="text-muted">{{ progName(c.program_id) }}</td>
              <td>{{ c.year }}</td>
              <td v-if="authStore.userCan('classes:write')" class="text-end">
                <button class="btn btn-sm btn-alt-secondary" @click="openEdit(c)">
                  <i class="si si-pencil"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="4" class="text-center text-muted py-4">No classes found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>

  <BaseModal :show-modal="showModal" :title="editing ? 'Edit Class' : 'New Class'" @close="showModal=false">
    <div class="mb-3">
      <label class="form-label fw-medium">Class Name *</label>
      <input v-model="form.name" type="text" class="form-control" placeholder="e.g. BSCS 2025"/>
    </div>
    <div class="mb-3">
      <label class="form-label fw-medium">Programme *</label>
      <select v-model="form.program_id" class="form-select">
        <option value="">— Select —</option>
        <option v-for="p in store.programs" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>
    <div>
      <label class="form-label fw-medium">Year</label>
      <input v-model.number="form.year" type="number" class="form-control"/>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal=false">Cancel</button>
      <button class="btn btn-primary" @click="save" :disabled="saving">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save" : "Create" }}
      </button>
    </template>
  </BaseModal>
</template>