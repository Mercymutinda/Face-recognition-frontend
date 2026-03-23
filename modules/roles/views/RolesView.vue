<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore }   from "@/stores/auth";
import api from "@/utils/api";

const authStore = useAuthStore();
const roles     = ref([]);
const loading   = ref(false);
const showModal = ref(false);
const saving    = ref(false);
const form      = ref({ name: "", description: "" });

onMounted(async () => {
  loading.value = true;
  try { const { data } = await api.get("/roles"); roles.value = data?.items ?? data; }
  finally { loading.value = false; }
});

async function create() {
  saving.value = true;
  try {
    const { data } = await api.post("/roles", form.value);
    roles.value.push(data);
    showModal.value = false;
    form.value = { name: "", description: "" };
  } finally { saving.value = false; }
}

const ROLE_ICONS = { ADMIN: "🛡️", LECTURER: "🎓", STUDENT: "📖" };
const ROLE_COLORS = { ADMIN: "#415A20", LECTURER: "#E65F0E", STUDENT: "#331B11" };
</script>

<template>
  <BasePageHeading title="Roles" subtitle="System roles and their assignments">
    <template #extra>
      <button v-if="authStore.userCan('roles:write')" class="btn btn-primary btn-sm" @click="showModal=true">
        <i class="fa fa-plus me-1"></i> New Role
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <div v-else class="row g-3">
      <div v-for="r in roles" :key="r.id" class="col-sm-6 col-lg-4">
        <BaseBlock class="mb-0 h-100">
          <div class="d-flex align-items-center gap-3">
            <div style="width:48px;height:48px;border-radius:12px;font-size:22px;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;"
              :style="{ background: (ROLE_COLORS[r.name] || '#555') + '18' }">
              {{ ROLE_ICONS[r.name] || "⚙️" }}
            </div>
            <div>
              <div class="fw-semibold">{{ r.name }}</div>
              <div class="text-muted" style="font-size:12.5px;">{{ r.description || "No description." }}</div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-top d-flex gap-2">
            <span class="badge px-2 py-1 fw-normal"
              :style="{ background: (ROLE_COLORS[r.name]||'#555') + '18', color: ROLE_COLORS[r.name]||'#555', border: '1px solid '+(ROLE_COLORS[r.name]||'#555')+'33', fontSize:'11px' }">
              System Role
            </span>
          </div>
        </BaseBlock>
      </div>
      <div v-if="!roles.length" class="col-12 text-center py-5 text-muted">No roles defined.</div>
    </div>
  </div>

  <BaseModal v-if="authStore.userCan('roles:write')"
    :show-modal="showModal" title="New Role" @close="showModal=false">
    <div class="mb-3">
      <label class="form-label fw-medium">Role Name *</label>
      <input v-model="form.name" type="text" class="form-control" placeholder="e.g. HOD"/>
    </div>
    <div>
      <label class="form-label fw-medium">Description</label>
      <input v-model="form.description" type="text" class="form-control"/>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal=false">Cancel</button>
      <button class="btn btn-primary" @click="create" :disabled="saving || !form.name">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        Create Role
      </button>
    </template>
  </BaseModal>
</template>