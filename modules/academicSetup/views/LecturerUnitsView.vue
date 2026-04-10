<script setup>
import { onMounted, computed } from "vue";
import { useAcademicSetupStore } from "@/stores/academicStore.js";
import { useAuthStore } from "@/stores/authStore";

const store = useAcademicSetupStore();
const authStore = useAuthStore();

onMounted(() => {
  store.fetchUnits();
  store.fetchClasses();
});

// Filter units to ONLY show the ones assigned to the logged-in lecturer
// (Assuming your backend unit table/schema links units to lecturers. If it links via timetable, we filter that way).
const myUnits = computed(() => {
  return store.units; // For now, assuming API already filters by lecturer, or you can do: store.units.filter(u => u.lecturer_id === authStore.user.id)
});

const getProgramName = (id) => store.classes.find(c => c.id === id)?.name || "General";
</script>

<template>
  <BasePageHeading title="My Units" subtitle="Course modules you are currently teaching" />

  <div class="content">
    <div v-if="store.loading.units" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="row g-4">
      <div v-for="u in myUnits" :key="u.id" class="col-md-6 col-xl-4">
        <BaseCard class="h-100 border-top border-4 border-primary shadow-sm">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary-light text-primary fw-bold px-2 py-1">{{ u.code }}</span>
            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Active</span>
          </div>
          
          <h4 class="h5 fw-bold mb-1 mt-3">{{ u.name }}</h4>
          <p class="text-muted fs-sm mb-4">
            <i class="fa fa-graduation-cap me-1"></i> Year {{ u.year_of_study }}
          </p>

          <div class="d-flex justify-content-between border-top pt-3 text-muted fs-sm">
            <span><i class="fa fa-users me-1"></i> Students Enrolled</span>
            <RouterLink :to="{ name: 'attendance-scanner', query: { unit: u.id } }" class="fw-medium text-primary">
              Scan Class <i class="fa fa-arrow-right ms-1"></i>
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <div v-if="!myUnits.length" class="col-12 text-center py-5 text-muted">
        <i class="fa fa-book-open fa-3x mb-3 opacity-25"></i>
        <p>You have not been assigned any units yet.</p>
      </div>
    </div>
  </div>
</template>