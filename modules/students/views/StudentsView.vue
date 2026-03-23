<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";

const authStore = useAuthStore();
const students  = ref([]);
const loading   = ref(false);
const search    = ref("");
const filterCls = ref("");
const classes   = ref([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [s, c] = await Promise.all([api.get("/students"), api.get("/academic/classes").catch(() => ({ data: [] }))]);
    students.value = s.data?.items ?? s.data;
    classes.value  = c.data?.items ?? c.data;
  } finally { loading.value = false; }
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return students.value.filter((s) =>
    (!filterCls.value || s.class_id == filterCls.value) &&
    (!q || s.username.toLowerCase().includes(q) ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.registration_number || "").toLowerCase().includes(q))
  );
});

function initials(s) {
  const n = s.full_name || s.username || "";
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
</script>

<template>
  <BasePageHeading title="Students" subtitle="Registered student accounts">
    <template #extra>
      <div class="d-flex gap-2">
        <select v-if="classes.length" v-model="filterCls" class="form-select form-select-sm" style="width:160px;">
          <option value="">All Classes</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Search…" style="width:180px;"/>
      </div>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr><th>Student</th><th>Reg Number</th><th>Programme</th><th>Phone</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in filtered" :key="s.id">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:34px;height:34px;border-radius:50%;flex-shrink:0;
                              background:linear-gradient(135deg,#415A20,#E65F0E);
                              display:flex;align-items:center;justify-content:center;
                              color:#fff;font-size:12px;font-weight:700;">
                    {{ initials(s) }}
                  </div>
                  <div>
                    <div class="fw-semibold" style="font-size:13px;">{{ s.full_name || s.username }}</div>
                    <div class="text-muted" style="font-size:11px;">{{ s.email }}</div>
                  </div>
                </div>
              </td>
              <td style="font-family:'DM Mono',monospace;font-size:12px;" class="text-muted">
                {{ s.registration_number || "—" }}
              </td>
              <td class="text-muted" style="font-size:12px;">{{ s.program || "—" }}</td>
              <td class="text-muted" style="font-size:12px;">{{ s.phone_number || "—" }}</td>
              <td>
                <span class="badge" :class="s.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ s.is_active ? "Active" : "Inactive" }}
                </span>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="text-center text-muted py-4">No students found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>
</template>