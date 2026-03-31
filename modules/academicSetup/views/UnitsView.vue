<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore.js";
import { useAuthStore } from "@/stores/authStore";
import api from "@/utils/api";

const store = useAcademicSetupStore();
const authStore = useAuthStore();
const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const search = ref("");
const lecturers = ref([]);
const form = ref({
  code: "",
  name: "",
  program_id: "",
  year_level: 1,
  lecturer_id: "",
});

onMounted(async () => {
  await Promise.all([store.fetchUnits(), store.fetchPrograms()]);
  if (authStore.userCan("users:read")) {
    const { data } = await api.get("/users").catch(() => ({ data: [] }));
    lecturers.value = data.items ?? data;
  }
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return store.units.filter(
    (u) =>
      !q || u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q)
  );
});

const progName = (id) => store.programs.find((p) => p.id === id)?.code || "—";
const lecName = (id) => {
  const l = lecturers.value.find((l) => l.id === id);
  return l ? l.full_name || l.username : "Unassigned";
};

function openCreate() {
  editing.value = null;
  form.value = {
    code: "",
    name: "",
    program_id: "",
    year_level: 1,
    lecturer_id: "",
  };
  showModal.value = true;
}
function openEdit(u) {
  editing.value = u;
  form.value = {
    code: u.code,
    name: u.name,
    program_id: u.program_id,
    year_level: u.year_level,
    lecturer_id: u.lecturer_id || "",
  };
  showModal.value = true;
}
async function save() {
  saving.value = true;
  try {
    if (editing.value) await store.updateUnit(editing.value.id, form.value);
    else await store.createUnit(form.value);
    showModal.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BasePageHeading
    title="Units"
    subtitle="Course units and their assigned lecturers"
  >
    <template #extra>
      <div class="d-flex gap-2">
        <input
          v-model="search"
          type="search"
          class="form-control form-control-sm"
          placeholder="Search…"
          style="width: 180px"
        />
        <button
          v-if="authStore.userCan('units:write')"
          class="btn btn-primary btn-sm"
          @click="openCreate"
        >
          <i class="fa fa-plus me-1"></i> New Unit
        </button>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading" class="text-center py-5">
      <div class="spinner-border" style="color: #e65f0e"></div>
    </div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Programme</th>
              <th>Yr</th>
              <th v-if="authStore.userCan('units:read')">Lecturer</th>
              <th v-if="authStore.userCan('units:write')" class="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td>
                <span
                  class="badge"
                  style="background: #331b11; font-size: 11px"
                  >{{ u.code }}</span
                >
              </td>
              <td class="fw-semibold">{{ u.name }}</td>
              <td class="text-muted">{{ progName(u.program_id) }}</td>
              <td>{{ u.year_level || "—" }}</td>
              <td v-if="authStore.userCan('units:read')">
                {{ lecName(u.lecturer_id) }}
              </td>
              <td v-if="authStore.userCan('units:write')" class="text-end">
                <button
                  class="btn btn-sm btn-alt-secondary"
                  @click="openEdit(u)"
                >
                  <i class="si si-pencil"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-center text-muted py-4">
                No units found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>

  <BaseModal
    :show-modal="showModal"
    :title="editing ? 'Edit Unit' : 'New Unit'"
    @close="showModal = false"
  >
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label fw-medium">Code *</label>
        <input
          v-model="form.code"
          type="text"
          class="form-control"
          placeholder="CS301"
        />
      </div>
      <div class="col-md-8">
        <label class="form-label fw-medium">Name *</label>
        <input v-model="form.name" type="text" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium">Programme</label>
        <select v-model="form.program_id" class="form-select">
          <option value="">— None —</option>
          <option v-for="p in store.programs" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium">Year Level</label>
        <input
          v-model.number="form.year_level"
          type="number"
          class="form-control"
          min="1"
          max="6"
        />
      </div>
      <div v-if="authStore.userCan('users:read')" class="col-12">
        <label class="form-label fw-medium">Assign Lecturer</label>
        <select v-model="form.lecturer_id" class="form-select">
          <option value="">— Unassigned —</option>
          <option v-for="l in lecturers" :key="l.id" :value="l.id">
            {{ l.full_name || l.username }}
          </option>
        </select>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">
        Cancel
      </button>
      <button class="btn btn-primary" @click="save" :disabled="saving">
        <span
          v-if="saving"
          class="spinner-border spinner-border-sm me-1"
        ></span>
        {{ editing ? "Save" : "Create" }}
      </button>
    </template>
  </BaseModal>
</template>
