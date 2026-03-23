<script setup>
import { ref, onMounted } from "vue";
import api from "@/utils/api";

const sessions = ref([]);
const loading  = ref(true);

onMounted(async () => {
  try { const { data } = await api.get("/attendance/sessions"); sessions.value = data ?? []; }
  finally { loading.value = false; }
});

async function endSession(s) {
  await api.post(`/attendance/sessions/${s.id}/end`);
  s.is_active = false;
}

const fmt = (dt) => dt ? new Date(dt).toLocaleString() : "—";
</script>

<template>
  <BasePageHeading title="Attendance Sessions" subtitle="All recorded attendance sessions"/>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr><th>#</th><th>Unit</th><th>Class</th><th>Hall</th><th>Started</th><th>Ended</th><th>Status</th><th class="text-end">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id">
              <td class="text-muted" style="font-size:12px;">{{ s.id }}</td>
              <td>{{ s.unit_id }}</td>
              <td>{{ s.class_id }}</td>
              <td>{{ s.hall_id || "—" }}</td>
              <td style="font-size:12px;">{{ fmt(s.started_at) }}</td>
              <td style="font-size:12px;">{{ fmt(s.ended_at) }}</td>
              <td>
                <span class="badge" :class="s.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ s.is_active ? "Live" : "Ended" }}
                </span>
              </td>
              <td class="text-end">
                <button v-if="s.is_active" class="btn btn-sm btn-alt-danger" @click="endSession(s)">
                  End
                </button>
              </td>
            </tr>
            <tr v-if="!sessions.length">
              <td colspan="8" class="text-center text-muted py-4">No sessions recorded.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>
</template>