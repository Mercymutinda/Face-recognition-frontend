<script setup>
import { ref, onMounted } from "vue";
import { useAcademicSetupStore } from "../store/academicSetupStore";
import { useAuthStore } from "@/stores/auth";

const store     = useAcademicSetupStore();
const authStore = useAuthStore();
const showModal = ref(false);
const editing   = ref(null);
const saving    = ref(false);
const form      = ref({ name: "", building: "", capacity: 40, has_camera: true, camera_count: 1 });

onMounted(() => store.fetchHalls());

function openCreate() {
  editing.value   = null;
  form.value      = { name: "", building: "", capacity: 40, has_camera: true, camera_count: 1 };
  showModal.value = true;
}
function openEdit(h) {
  editing.value   = h;
  form.value      = { name: h.name, building: h.building || "", capacity: h.capacity, has_camera: h.has_camera, camera_count: h.camera_count };
  showModal.value = true;
}
async function save() {
  saving.value = true;
  try {
    if (editing.value) await store.updateHall(editing.value.id, form.value);
    else               await store.createHall(form.value);
    showModal.value = false;
  } finally { saving.value = false; }
}
</script>

<template>
  <BasePageHeading title="Lecture Halls" subtitle="Classrooms and examination venues">
    <template #extra>
      <button v-if="authStore.userCan('halls:write')" class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New Hall
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <div v-else class="row g-3">
      <div v-for="h in store.halls" :key="h.id" class="col-sm-6 col-lg-4">
        <BaseBlock class="mb-0 h-100">
          <div class="d-flex justify-content-between">
            <div>
              <div class="fw-semibold">{{ h.name }}</div>
              <div class="text-muted" style="font-size:12px;">{{ h.building || "Main Campus" }}</div>
              <div class="mt-2 d-flex flex-wrap gap-2">
                <span class="badge bg-secondary">{{ h.capacity || "—" }} seats</span>
                <span class="badge" :class="h.has_camera ? 'bg-success' : 'bg-secondary'">
                  <i class="si si-camera me-1"></i>
                  {{ h.has_camera ? `${h.camera_count} cam${h.camera_count > 1 ? 's' : ''}` : 'No camera' }}
                </span>
              </div>
            </div>
            <button v-if="authStore.userCan('halls:write')"
              class="btn btn-sm btn-alt-secondary flex-shrink-0 ms-2 align-self-start"
              @click="openEdit(h)">
              <i class="si si-pencil"></i>
            </button>
          </div>
        </BaseBlock>
      </div>
      <div v-if="!store.halls.length" class="col-12 text-center py-5 text-muted">
        No lecture halls configured.
      </div>
    </div>
  </div>

  <BaseModal :show-modal="showModal" :title="editing ? 'Edit Hall' : 'New Hall'" @close="showModal=false">
    <div class="row g-3">
      <div class="col-md-8">
        <label class="form-label fw-medium">Name *</label>
        <input v-model="form.name" type="text" class="form-control" placeholder="e.g. LH1"/>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-medium">Capacity</label>
        <input v-model.number="form.capacity" type="number" class="form-control"/>
      </div>
      <div class="col-12">
        <label class="form-label fw-medium">Building / Block</label>
        <input v-model="form.building" type="text" class="form-control" placeholder="Block A"/>
      </div>
      <div class="col-md-6">
        <div class="form-check form-switch mt-2">
          <input v-model="form.has_camera" class="form-check-input" type="checkbox" id="hasCam"/>
          <label class="form-check-label" for="hasCam">Has Camera</label>
        </div>
      </div>
      <div class="col-md-6" v-if="form.has_camera">
        <label class="form-label fw-medium">Camera Count</label>
        <input v-model.number="form.camera_count" type="number" class="form-control" min="1"/>
      </div>
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