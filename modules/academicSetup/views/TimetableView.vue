<script setup>
import { ref, onMounted, computed } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore.js";
import { useAuthStore } from "@/stores/authStore";
import { useAlert } from "@/composables/alerts";
import api from "@/utils/api";

const { confirmAction } = useAlert();
const store = useAcademicSetupStore();
const authStore = useAuthStore();

const showModal = ref(false);
const saving = ref(false);
const filterCls = ref("");
const lecturers = ref([]);

const form = ref({
  unit_id: "", cohort_id: "", hall_id: "",
  lecturer_id: "", day_of_week: "Monday",
  start_time: "07:00", end_time: "10:00",
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOTS = ["07:00", "10:00", "14:00", "17:00"];
const SLOT_ENDS = { "07:00": "10:00", "10:00": "13:00", "14:00": "17:00", "17:00": "19:00" };

onMounted(async () => {
  await Promise.all([
    store.fetchTimetable(), store.fetchClasses(),
    store.fetchUnits(), store.fetchHalls(),
  ]);

  try {
    const { data } = await api.get("/users", { params: { role: 'LECTURER' } });
    lecturers.value = data.items ?? data;
  } catch (e) {
    lecturers.value = [];
  }
});

const filtered = computed(() =>
  filterCls.value ? store.timetable.filter((e) => e.cohort_id == filterCls.value) : store.timetable
);

const getCell = (d, s) =>
  filtered.value.filter((e) => {
    const backendTime = e.start_time ? e.start_time.substring(0, 5) : "";
    return e.day_of_week === d && backendTime === s;
  });

// Compact Helpers for UI
const getUnitCode = (id) => store.units.find(u => u.id === id)?.code || `Unit #${id}`;
const getClassName = (id) => store.classes.find(c => c.id === id)?.name || `Class #${id}`;
const hallNameShort = (id) => {
  const name = store.halls.find(h => h.id === id)?.name;
  return name ? name.split(' ')[0] : 'TBA'; // E.g., "Lab A" -> "Lab"
};
const lecNameShort = (id) => {
  const name = lecturers.value.find(l => l.id === id)?.full_name;
  if(!name) return 'TBA';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[0] : name; // Just first name for space
};

function updateEndTime() {
  form.value.end_time = SLOT_ENDS[form.value.start_time];
}

async function saveEntry() {
  saving.value = true;
  try {
    const payload = {
      unit_id: parseInt(form.value.unit_id),
      cohort_id: parseInt(form.value.cohort_id),
      hall_id: form.value.hall_id ? parseInt(form.value.hall_id) : null,
      lecturer_id: form.value.lecturer_id ? parseInt(form.value.lecturer_id) : null,
      day_of_week: form.value.day_of_week,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
    };

    await store.createTimetableEntry(payload);
    showModal.value = false; // Only closes if no conflict error is thrown
  } catch (e) {
    // Error caught and displayed by store toast
  } finally {
    saving.value = false;
  }
}

async function remove(entry) {
  const result = await confirmAction("Remove Entry", `Remove ${getUnitCode(entry.unit_id)}?`);
  if (result.isConfirmed) await store.deleteTimetableEntry(entry.id);
}
</script>

<template>
  <BasePageHeading title="Timetable Management" subtitle="System-wide lecture schedule">
    <template #extra>
      <div class="d-flex gap-2">
        <select v-model="filterCls" class="form-select form-select-sm" style="width: 200px">
          <option value="">All Classes (Admin View)</option>
          <option v-for="c in store.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button v-if="authStore.hasRole('ADMIN')" class="btn btn-primary btn-sm" @click="showModal = true">
          <i class="fa fa-plus me-1"></i> Add Entry
        </button>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading.timetable" class="text-center py-5">
      <div class="spinner-border" style="color: #2356d7"></div>
    </div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-bordered mb-0" style="table-layout: fixed; min-width: 1000px;">
          <thead class="bg-body-light text-center">
            <tr>
              <th style="width: 110px; font-size: 12px;">TIME</th>
              <th v-for="d in DAYS" :key="d" class="fw-bold" style="font-size: 12px; width: 17%;">{{ d }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in SLOTS" :key="slot">
              <td class="text-muted align-middle text-center small fw-bold bg-body-light">
                {{ slot }}<br><span style="font-size: 10px; opacity: 0.7;">to {{ SLOT_ENDS[slot] }}</span>
              </td>
              <td v-for="d in DAYS" :key="d" class="p-1 align-top" style="background-color: #f8f9fa;">
                
                <div v-for="entry in getCell(d, slot)" :key="entry.id"
                     class="rounded-1 p-2 mb-1 bg-white shadow-sm position-relative"
                     style="border-left: 3px solid #2356d7; line-height: 1.35; font-size: 11px;">
                  
                  <div class="d-flex justify-content-between align-items-start">
                    <span class="fw-bolder text-dark">{{ getUnitCode(entry.unit_id) }}</span>
                    <span class="fw-bold text-primary" style="font-size: 10.5px;">{{ getClassName(entry.cohort_id) }}</span>
                  </div>
                  
                  <div class="text-muted mt-1 d-flex justify-content-between">
                    <span>{{ hallNameShort(entry.hall_id) }}</span>
                    <span>{{ lecNameShort(entry.lecturer_id) }}</span>
                  </div>

                  <button v-if="authStore.hasRole('ADMIN')" @click="remove(entry)"
                          class="btn p-0 position-absolute"
                          style="top: -6px; right: -6px; opacity: 0.8;">
                    <i class="fa fa-times-circle text-danger bg-white rounded-circle" style="font-size: 14px;"></i>
                  </button>
                </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>

  <BaseModal :show-modal="showModal" title="Create Timetable Entry" @close="showModal = false">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Course Unit *</label>
        <select v-model="form.unit_id" class="form-select" required>
          <option value="" disabled>Select Unit</option>
          <option v-for="u in store.units" :key="u.id" :value="u.id">{{ u.code }} - {{ u.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Target Class (Cohort) *</label>
        <select v-model="form.cohort_id" class="form-select" required>
          <option value="" disabled>Select Class</option>
          <option v-for="c in store.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Lecturer</label>
        <select v-model="form.lecturer_id" class="form-select">
          <option value="">Unassigned</option>
          <option v-for="l in lecturers" :key="l.id" :value="l.id">{{ l.full_name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Lecture Hall</label>
        <select v-model="form.hall_id" class="form-select">
          <option value="">TBA</option>
          <option v-for="h in store.halls" :key="h.id" :value="h.id">{{ h.name }} ({{ h.capacity }} seats)</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Day of Week *</label>
        <select v-model="form.day_of_week" class="form-select">
          <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Start Time *</label>
        <select v-model="form.start_time" class="form-select" @change="updateEndTime">
          <option v-for="s in SLOTS" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">End Time</label>
        <input :value="form.end_time" type="text" class="form-control" readonly />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">Cancel</button>
      <button class="btn btn-primary" @click="saveEntry" :disabled="saving || !form.unit_id || !form.cohort_id">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        Save Schedule
      </button>
    </template>
  </BaseModal>
</template>