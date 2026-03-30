<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";

const authStore  = useAuthStore();
const users      = ref([]);
const roles      = ref([]);
const loading    = ref(false);
const search     = ref("");
const showModal  = ref(false);
const selUser    = ref(null);
const selRoleId  = ref("");
const assigning  = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const [u, r] = await Promise.all([api.get("/users"), api.get("/roles")]);
    users.value  = u.data?.items ?? u.data;
    roles.value  = r.data?.items ?? r.data;
  } finally { loading.value = false; }
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return users.value.filter((u) =>
    !q || u.username.toLowerCase().includes(q) ||
    (u.full_name || "").toLowerCase().includes(q) ||
    u.registration_number?.toLowerCase().includes(q)
  );
});

function initials(u) {
  const n = u.full_name || u.username || "";
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function openAssign(u) {
  selUser.value  = u;
  selRoleId.value = u.roles?.[0]?.id || "";
  showModal.value = true;
}

async function assignRole() {
  if (!selRoleId.value) return;
  assigning.value = true;
  try {
    await api.post(`/users/${selUser.value.id}/assign-role`, { role_id: parseInt(selRoleId.value) });
    const idx = users.value.findIndex((u) => u.id === selUser.value.id);
    if (idx > -1) {
      const role = roles.value.find((r) => r.id == selRoleId.value);
      users.value[idx].roles = role ? [role] : [];
    }
    showModal.value = false;
  } finally { assigning.value = false; }
}

async function softDelete(u) {
  if (!confirm(`Delete user "${u.username}"?`)) return;
  await api.delete(`/users/${u.id}`);
  users.value = users.value.filter((x) => x.id !== u.id);
}

async function restore(u) {
  await api.patch(`/users/${u.id}/restore`);
  u.is_deleted = false;
}
</script>

<template>
  <BasePageHeading title="Users" subtitle="Manage all system accounts">
    <template #extra>
      <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Search…" style="width:200px;"/>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <BaseBlock v-else content-full>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="bg-body-light">
            <tr>
              <th>User</th>
              <th>Reg Number</th>
              <th>Role</th>
              <th>Status</th>
              <!-- Action column only if user can write or delete users -->
              <th v-if="authStore.userCan('users:write') || authStore.userCan('roles:assign') || authStore.userCan('users:delete')"
                class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;
                              background:linear-gradient(135deg,#415A20,#E65F0E);
                              display:flex;align-items:center;justify-content:center;
                              color:#fff;font-size:11px;font-weight:700;">
                    {{ initials(u) }}
                  </div>
                  <div>
                    <div class="fw-semibold" style="font-size:13px;">{{ u.full_name || u.username }}</div>
                    <div class="text-muted" style="font-size:11px;">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td class="text-muted" style="font-size:12px;font-family:'DM Mono',monospace;">
                {{ u.registration_number || "—" }}
              </td>
              <td>
                <span v-for="r in (u.roles || [])" :key="r.id" class="badge me-1"
                  :style="{ background: r.name==='ADMIN' ? '#415A20' : r.name==='LECTURER' ? '#E65F0E' : '#331B11' }">
                  {{ r.name }}
                </span>
                <span v-if="!u.roles?.length" class="text-muted" style="font-size:12px;">No role</span>
              </td>
              <td>
                <span class="badge" :class="u.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ u.is_active ? "Active" : "Inactive" }}
                </span>
              </td>
              <td v-if="authStore.userCan('users:write') || authStore.userCan('roles:assign') || authStore.userCan('users:delete')"
                class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <!-- Assign role: only with roles:assign permission -->
                  <button v-if="authStore.userCan('roles:assign')"
                    class="btn btn-sm btn-alt-secondary" @click="openAssign(u)" title="Assign Role">
                    <i class="si si-lock"></i>
                  </button>
                  <!-- Delete: only with users:delete -->
                  <button v-if="authStore.userCan('users:delete') && !u.is_deleted"
                    class="btn btn-sm btn-alt-danger" @click="softDelete(u)" title="Delete">
                    <i class="si si-trash"></i>
                  </button>
                  <!-- Restore: only with users:restore -->
                  <button v-if="authStore.userCan('users:restore') && u.is_deleted"
                    class="btn btn-sm btn-alt-success" @click="restore(u)" title="Restore">
                    <i class="si si-reload"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="text-center text-muted py-4">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseBlock>
  </div>

  <!-- Assign Role Modal -->
  <BaseModal :show-modal="showModal" title="Assign Role" @close="showModal=false">
    <p class="text-muted mb-3">
      Assigning role to: <strong>{{ selUser?.full_name || selUser?.username }}</strong>
    </p>
    <label class="form-label fw-medium">Role</label>
    <select v-model="selRoleId" class="form-select">
      <option value="">— Select role —</option>
      <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
    </select>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal=false">Cancel</button>
      <button class="btn btn-primary" @click="assignRole" :disabled="assigning || !selRoleId">
        <span v-if="assigning" class="spinner-border spinner-border-sm me-1"></span>
        Assign
      </button>
    </template>
  </BaseModal>
</template>