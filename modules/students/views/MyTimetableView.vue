<script setup>
import { onMounted, computed, ref } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore";
import api from "@/utils/api";

const store = useAcademicSetupStore();
const authStore = useAuthStore();
const lecturers = ref([]);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOTS = ["07:00", "10:00", "13:00", "16:00"];
const SLOT_ENDS = { "07:00": "10:00", "10:00": "13:00", "13:00": "16:00", "16:00": "19:00" };

onMounted(async () => {
  await Promise.all([
    store.fetchTimetable(),
    store.fetchUnits(),
    store.fetchHalls(),
    store.fetchClasses(),
  ]);

  try {
    const { data } = await api.get("/users", { params: { role: 'LECTURER' } });
    lecturers.value = data.items ?? data;
  } catch (e) {
    console.error("Could not fetch lecturers");
  }
});

// IMPORTANT FIX: Filter the timetable to show ONLY the classes assigned to this student's cohort
const mySchedule = computed(() => {
  const userCohortId = authStore.user?.cohort_id;
  
  if (!userCohortId) {
    return []; // If the user has no assigned cohort, return an empty schedule
  }
  
  return store.timetable.filter((entry) => entry.cohort_id === userCohortId); 
});

const getCell = (day, time) => {
  return mySchedule.value.filter((e) => {
    const backendTime = e.start_time ? e.start_time.substring(0, 5) : "";
    return e.day_of_week === day && backendTime === time;
  });
};

const getUnitCode = (id) => store.units.find(u => u.id === id)?.code || `Unit #${id}`;
const getUnitName = (id) => store.units.find(u => u.id === id)?.name || `Unknown`;
const getHallName = (id) => store.halls.find(h => h.id === id)?.name || `TBA`;
const getLecName = (id) => {
  const name = lecturers.value.find(l => l.id === id)?.full_name;
  return name ? name.split(' ')[0] : 'TBA';
};
</script>

<template>
  <BasePageHeading 
    title="My Timetable" 
    subtitle="Your personalized weekly lecture schedule"
  />

  <div class="content">
    
    <div v-if="!store.loading.timetable && !authStore.user?.cohort_id" class="alert alert-warning d-flex align-items-center">
      <i class="fa fa-exclamation-triangle me-3 fa-2x"></i>
      <div>
        <h5 class="mb-1">No Class Assigned</h5>
        <p class="mb-0 text-muted">You are not currently assigned to a class/cohort. Please contact administration to update your profile.</p>
      </div>
    </div>

    <div v-if="store.loading.timetable" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <BaseBlock v-else-if="authStore.user?.cohort_id" content-full>
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
                
                <div v-for="entry in getCell(d, slot)" :key="entry.id"
                     class="rounded p-2 mb-2 bg-white shadow-sm"
                     style="border-top: 3px solid #E65F0E;">
                  
                  <div class="fw-bolder text-dark mb-1" style="font-size: 13px;">
                    {{ getUnitCode(entry.unit_id) }}
                  </div>
                  <div class="text-muted mb-2" style="font-size: 11px; line-height: 1.2;">
                    {{ getUnitName(entry.unit_id) }}
                  </div>
                  
                  <div class="d-flex justify-content-between align-items-end mt-2" style="font-size: 11px;">
                    <span class="badge bg-body-light text-dark border"><i class="fa fa-map-pin me-1 text-danger"></i>{{ getHallName(entry.hall_id) }}</span>
                    <span class="text-muted fw-medium"><i class="fa fa-user me-1"></i>{{ getLecName(entry.lecturer_id) }}</span>
                  </div>
                </div>

                <div v-if="getCell(d, slot).length === 0" class="text-center text-muted opacity-25 mt-3">
                  <i class="fa fa-coffee fa-2x mb-1"></i>
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