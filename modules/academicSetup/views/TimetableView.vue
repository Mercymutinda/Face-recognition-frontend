<script setup>
import { ref, computed, onMounted } from "vue";
import { useAcademicSetupStore } from "../store/academicSetupStore";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";

const store     = useAcademicSetupStore();
const authStore = useAuthStore();
const filterCls = ref("");
const showModal = ref(false);
const saving    = ref(false);
const form      = ref({ unit_id: "", class_id: "", hall_id: "", day_of_week: 0, start_time: "07:00" });

const DAYS      = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const SLOTS     = ["07:00","10:00","13:00","16:00"];
const SLOT_ENDS = {"07:00":"10:00","10:00":"13:00","13:00":"16:00","16:00":"19:00"};
const COLORS    = [
  "border-warning bg-warning-light text-warning",
  "border-success bg-success-light text-success",
  "border-primary bg-primary-light text-primary",
  "border-info bg-info-light text-info",
  "border-danger bg-danger-light text-danger",
];

onMounted(async () => {
  const p = {};
  // Lecturers see only their own timetable — but this is also enforced on the backend
  if (authStore.userCan("dashboard:lecturer") && !authStore.userCan("dashboard:admin") && authStore.user?.id)
    p.lecturer_id = authStore.user.id;
  await Promise.all([store.fetchTimetable(p), store.fetchClasses(), store.fetchUnits(), store.fetchHalls()]);
});

const filtered = computed(() =>
  filterCls.value ? store.timetable.filter((e) => e.class_id == filterCls.value) : store.timetable
);

const colorFor = (id)  => COLORS[id % COLORS.length];
const getCell  = (d, s) => filtered.value.filter((e) => e.day_of_week === d && e.start_time === s);
const unitName = (id)  => store.units.find((u) => u.id === id)?.name   || `Unit #${id}`;
const clsName  = (id)  => store.classes.find((c) => c.id === id)?.name || `Class #${id}`;
const hallName = (id)  => store.halls.find((h) => h.id === id)?.name   || `Hall #${id}`;

async function saveEntry() {
  if (!form.value.unit_id || !form.value.class_id) { alert("Unit and Class required."); return; }
  saving.value = true;
  try {
    await store.createTimetableEntry({
      unit_id:     parseInt(form.value.unit_id),
      class_id:    parseInt(form.value.class_id),
      hall_id:     form.value.hall_id ? parseInt(form.value.hall_id) : null,
      day_of_week: parseInt(form.value.day_of_week),
      start_time:  form.value.start_time,
      end_time:    SLOT_ENDS[form.value.start_time],
    });
    showModal.value = false;
  } finally { saving.value = false; }
}

async function remove(id) {
  if (!confirm("Remove this entry?")) return;
  await api.delete(`/academic/timetable/${id}`);
  const p = {};
  if (authStore.userCan("dashboard:lecturer") && !authStore.userCan("dashboard:admin") && authStore.user?.id)
    p.lecturer_id = authStore.user.id;
  await store.fetchTimetable(p);
}
</script>

<template>
  <BasePageHeading title="Timetable" subtitle="Weekly lecture schedule">
    <template #extra>
      <div class="d-flex gap-2">
        <select v-model="filterCls" class="form-select form-select-sm" style="width:180px;">
          <option value="">All Classes</option>
          <option v-for="c in store.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <!-- Add button only if user has timetable:write -->
        <button v-if="authStore.userCan('timetable:write')" class="btn btn-primary btn-sm" @click="showModal=true">
          <i class="fa fa-plus me-1"></i> Add Entry
        </button>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-bordered mb-0" style="min-width:720px;">
          <thead class="bg-body-light">
            <tr>
              <th style="width:88px;font-family:'DM Mono',monospace;font-size:11px;">TIME</th>
              <th v-for="d in DAYS" :key="d" class="text-center fw-semibold" style="font-size:12px;">{{ d }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in SLOTS" :key="slot">
              <td class="text-muted align-middle" style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;">
                {{ slot }}<br><span style="opacity:.55;">— {{ SLOT_ENDS[slot] }}</span>
              </td>
              <td v-for="(_, di) in DAYS" :key="di" class="p-1 align-top" style="height:84px;min-width:130px;">
                <div v-for="entry in getCell(di, slot)" :key="entry.id"
                  :class="['rounded','p-2','mb-1','border-start','border-3',colorFor(entry.unit_id)]"
                  style="font-size:11px;position:relative;">
                  <div class="fw-semibold">{{ unitName(entry.unit_id) }}</div>
                  <div style="font-size:10.5px;opacity:.8;">{{ clsName(entry.class_id) }}</div>
                  <div style="font-size:10px;opacity:.65;">{{ hallName(entry.hall_id) }}</div>
                  <!-- Remove button: only with write permission -->
                  <button v-if="authStore.userCan('timetable:write')" @click="remove(entry.id)"
                    class="btn p-0 position-absolute" style="top:3px;right:4px;opacity:.4;font-size:10px;">
                    <i class="fa fa-times"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>

  <BaseModal v-if="authStore.userCan('timetable:write')"
    :show-modal="showModal" title="Add Timetable Entry" @close="showModal=false">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label fw-medium">Unit *</label>
        <select v-model="form.unit_id" class="form-select">
          <option value="">— Select —</option>
          <option v-for="u in store.units" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium">Class *</label>
        <select v-model="form.class_id" class="form-select">
          <option value="">— Select —</option>
          <option v-for="c in store.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium">Hall</label>
        <select v-model="form.hall_id" class="form-select">
          <option value="">— Optional —</option>
          <option v-for="h in store.halls" :key="h.id" :value="h.id">{{ h.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium">Day</label>
        <select v-model.number="form.day_of_week" class="form-select">
          <option v-for="(d,i) in DAYS" :key="i" :value="i">{{ d }}</option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-label fw-medium">Start Time</label>
        <select v-model="form.start_time" class="form-select">
          <option v-for="s in SLOTS" :key="s" :value="s">{{ s }} – {{ SLOT_ENDS[s] }}</option>
        </select>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal=false">Cancel</button>
      <button class="btn btn-primary" @click="saveEntry" :disabled="saving">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        Add Entry
      </button>
    </template>
  </BaseModal>
</template>