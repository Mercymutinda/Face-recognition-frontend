<script setup>
import { onMounted, computed } from "vue";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore";
import DataTable from "@/components/DataTable/DataTable.vue";

const attendanceStore = useAttendanceStore();
const acadStore = useAcademicSetupStore();
const authStore = useAuthStore();

const columns = [
  { field: "date", header: "Date", width: "120px" },
  { field: "time", header: "Time Recorded", width: "130px" },
  { field: "unit", header: "Course Unit" },
  { field: "hall", header: "Lecture Hall" },
  { field: "status", header: "Status", slot: "cell-status" }
];

onMounted(async () => {
  // Fetch everything needed to build a human-readable table
  if (authStore.user?.id) {
    await Promise.all([
      attendanceStore.fetchUserAttendance(authStore.user.id),
      attendanceStore.fetchSessions(), // To match session_id to actual class details
      acadStore.fetchUnits(),
      acadStore.fetchHalls()
    ]);
  }
});

// Map raw database IDs to human-readable names
const enrichedHistory = computed(() => {
  if (!attendanceStore.userAttendance.length) return [];

  return attendanceStore.userAttendance.map(record => {
    // Find the session this attendance record belongs to
    const session = attendanceStore.sessions.find(s => s.id === record.session_id);
    
    // Find the names of the unit and hall
    const unitName = session 
      ? (acadStore.units.find(u => u.id === session.unit_id)?.name || `Unit #${session.unit_id}`) 
      : "Unknown Unit";
      
    const hallName = session && session.hall_id
      ? (acadStore.halls.find(h => h.id === session.hall_id)?.name || `Hall #${session.hall_id}`)
      : "TBA";

    const dateObj = new Date(record.timestamp);

    return {
      id: record.id,
      date: dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }),
      unit: unitName,
      hall: hallName,
      status: record.status
    };
  });
});
</script>

<template>
  <BasePageHeading 
    title="My Attendance History" 
    subtitle="A complete record of your biometric class check-ins"
  />

  <div class="content">
    <DataTable
      title="Recorded Sessions"
      :columns="columns"
      :data="enrichedHistory"
      :loading="attendanceStore.loading || acadStore.loading.units"
      :show-create="false"
    >
      <template #cell-status="{ value }">
        <span class="badge" :class="value === 'Present' ? 'bg-success' : 'bg-danger'">
          <i :class="value === 'Present' ? 'fa fa-check-circle me-1' : 'fa fa-times-circle me-1'"></i>
          {{ value }}
        </span>
      </template>
    </DataTable>
  </div>
</template>