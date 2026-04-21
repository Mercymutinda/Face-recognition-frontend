<script setup>
import { onMounted, computed, ref } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore";

const store = useAcademicSetupStore();
const authStore = useAuthStore();
const filterClass = ref(""); // For the dropdown

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SLOTS = ["07:00", "10:00", "14:00", "17:00"];
const SLOT_ENDS = { "07:00": "10:00", "10:00": "13:00", "14:00": "17:00", "17:00": "19:00" };
onMounted(() => {
  store.fetchTimetable();
  store.fetchUnits();
  store.fetchHalls();
  store.fetchClasses();
});

// 1. Filter schedule to ONLY show classes this lecturer teaches
const mySchedule = computed(() => {
  const userId = authStore.user?.id;
  let schedule = store.timetable.filter((entry) => entry.lecturer_id === userId);
  
  // 2. Apply dropdown filter if selected
  if (filterClass.value) {
    schedule = schedule.filter(entry => entry.cohort_id === filterClass.value);
  }
  return schedule;
});

const getCell = (day, time) => {
  return mySchedule.value.filter((e) => {
    const backendTime = e.start_time ? e.start_time.substring(0, 5) : "";
    return e.day_of_week === day && backendTime === time;
  });
};

const getUnitName = (id) => store.units.find(u => u.id === id)?.name || `Unit #${id}`;
const getHallName = (id) => store.halls.find(h => h.id === id)?.name || `TBA`;
const getClassName = (id) => store.classes.find(c => c.id === id)?.name || `Class #${id}`;
</script>

<template>
  <BasePageHeading title="My Schedule" subtitle="Your weekly lecture assignments">
    <template #extra>
      <select v-model="filterClass" class="form-select form-select-sm border-primary" style="width: 220px;">
        <option value="">Show All My Classes</option>
        <option v-for="c in store.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="store.loading.timetable" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-bordered mb-0" style="table-layout: fixed; min-width: 900px;">
          <thead class="bg-body-light text-center">
            <tr>
              <th style="width: 120px; font-size: 13px;">TIME</th>
              <th v-for="d in DAYS" :key="d" class="fw-bold text-uppercase" style="font-size: 13px;">{{ d }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in SLOTS" :key="slot">
              <td class="text-muted align-middle text-center small fw-bold bg-body-light">
                {{ slot }}<br><span style="font-size: 11px; opacity: 0.7;">to {{ SLOT_ENDS[slot] }}</span>
              </td>
              
              <td v-for="d in DAYS" :key="d" class="p-2 align-top" style="background-color: #f8f9fa;">
                <div v-for="entry in getCell(d, slot)" :key="entry.id" class="rounded p-2 mb-2 bg-white shadow-sm" style="border-left: 3px solid #E65F0E;">
                  <div class="fw-bolder text-dark mb-1" style="font-size: 13px;">
                    {{ getUnitName(entry.unit_id) }}
                  </div>
                  <div class="d-flex justify-content-between align-items-end mt-2" style="font-size: 11px;">
                    <span class="text-primary fw-bold">{{ getClassName(entry.cohort_id) }}</span>
                    <span class="text-muted"><i class="fa fa-map-pin me-1 text-danger"></i>{{ getHallName(entry.hall_id) }}</span>
                  </div>
                </div>

                <div v-if="getCell(d, slot).length === 0" class="text-center text-muted opacity-25 mt-3">
                  <div style="font-size: 10px;">Free</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>
</template>