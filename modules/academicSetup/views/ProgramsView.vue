<script setup>
import { ref, onMounted } from "vue";
import { useAcademicSetupStore } from "../store/academicSetupStore";
import { useAuthStore } from "@/stores/auth";

const store     = useAcademicSetupStore();
const authStore = useAuthStore();
const showModal = ref(false);
const editing   = ref(null);
const saving    = ref(false);
const form      = ref({ code: "", name: "", description: "" });

onMounted(() => store.fetchPrograms());

function openCreate() {
  editing.value = null;
  form.value    = { code: "", name: "", description: "" };
  showModal.value = true;
}
function openEdit(p) {
  editing.value = p;
  form.value    = { code: p.code, name: p.name, description: p.description || "" };
  showModal.value = true;
}
async function save() {
  saving.value = true;
  try {
    if (editing.value) await store.updateProgram(editing.value.id, form.value);
    else               await store.createProgram(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}
async function deactivate(p) {
  if (!confirm(`Deactivate "${p.name}"?`)) return;
  await store.deleteProgram(p.id);
}
</script>

<template>
  <BasePageHeading title="Programs" subtitle="Degree and diploma programmes offered">
    <template #extra>
      <!-- Only show if backend granted programs:write -->
      <button v-if="authStore.userCan('programs:write')"
        class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New Program
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <div v-else class="row g-3">
      <div v-for="p in store.programs" :key="p.id" class="col-sm-6 col-lg-4">
        <BaseBlock class="mb-0 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="badge mb-2 px-2 py-1" style="background:#415A20;font-size:11px;">{{ p.code }}</span>
              <div class="fw-semibold">{{ p.name }}</div>
              <div class="text-muted mt-1" style="font-size:12.5px;">{{ p.description || "No description." }}</div>
            </div>
            <!-- Edit/Deactivate only for users with write permission -->
            <div v-if="authStore.userCan('programs:write')" class="dropdown ms-2 flex-shrink-0">
              <button class="btn btn-sm btn-alt-secondary px-2" data-bs-toggle="dropdown">
                <i class="fa fa-ellipsis-v"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end border-0">
                <button class="dropdown-item fs-sm" @click="openEdit(p)">
                  <i class="si si-pencil me-2"></i> Edit
                </button>
                <button v-if="authStore.userCan('programs:delete')"
                  class="dropdown-item fs-sm text-danger" @click="deactivate(p)">
                  <i class="si si-trash me-2"></i> Deactivate
                </button>
              </div>
            </div>
          </div>
        </BaseBlock>
      </div>

      <div v-if="!store.programs.length" class="col-12 text-center py-5 text-muted">
        No programs found. <span v-if="authStore.userCan('programs:write')">Create the first one!</span>
      </div>
    </div>
  </div>

  <BaseModal :show-modal="showModal" :title="editing ? 'Edit Program' : 'New Program'" @close="showModal=false">
    <div class="mb-3">
      <label class="form-label fw-medium">Code *</label>
      <input v-model="form.code" type="text" class="form-control" placeholder="e.g. BSCS"/>
    </div>
    <div class="mb-3">
      <label class="form-label fw-medium">Name *</label>
      <input v-model="form.name" type="text" class="form-control" placeholder="Bachelor of Science in Computer Science"/>
    </div>
    <div>
      <label class="form-label fw-medium">Description</label>
      <textarea v-model="form.description" class="form-control" rows="3"></textarea>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal=false">Cancel</button>
      <button class="btn btn-primary" @click="save" :disabled="saving || !form.code || !form.name">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ editing ? "Save Changes" : "Create Program" }}
      </button>
    </template>
  </BaseModal>
</template>