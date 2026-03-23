<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore }   from "@/stores/auth";
import api from "@/utils/api";

const authStore = useAuthStore();
const profile   = ref(null);
const loading   = ref(true);
const saving    = ref(false);
const editing   = ref(false);
const form      = ref({});

onMounted(async () => {
  try {
    const { data } = await api.get(`/users/${authStore.user.id}`);
    profile.value = data;
    form.value    = { full_name: data.full_name || "", phone_number: data.phone_number || "", program: data.program || "", year_of_study: data.year_of_study || "" };
  } finally { loading.value = false; }
});

async function save() {
  saving.value = true;
  try {
    const { data } = await api.patch(`/users/${authStore.user.id}`, form.value);
    profile.value = { ...profile.value, ...data };
    await authStore.fetchMe();
    editing.value = false;
  } finally { saving.value = false; }
}

function initials() {
  const n = profile.value?.full_name || profile.value?.username || "";
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
</script>

<template>
  <BasePageHeading title="My Profile" subtitle="Your account information"/>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <div v-else-if="profile" class="row g-4">
      <!-- Avatar + summary -->
      <div class="col-md-4">
        <BaseBlock>
          <div class="text-center py-3">
            <div style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px;
                        background:linear-gradient(135deg,#415A20,#E65F0E);
                        display:flex;align-items:center;justify-content:center;
                        color:#fff;font-size:26px;font-weight:700;">
              {{ initials() }}
            </div>
            <div class="fw-semibold fs-5">{{ profile.full_name || profile.username }}</div>
            <div class="text-muted" style="font-size:12px;font-family:'DM Mono',monospace;">
              {{ profile.registration_number }}
            </div>
            <div class="mt-2">
              <span v-for="r in (profile.roles || [])" :key="r.id"
                class="badge mx-1"
                :style="{ background: r.name==='ADMIN'?'#415A20':r.name==='LECTURER'?'#E65F0E':'#331B11' }">
                {{ r.name }}
              </span>
            </div>
            <div class="mt-3">
              <span class="badge" :class="profile.is_active ? 'bg-success' : 'bg-secondary'">
                {{ profile.is_active ? "Active" : "Inactive" }}
              </span>
            </div>
          </div>
        </BaseBlock>
      </div>

      <!-- Details -->
      <div class="col-md-8">
        <BaseBlock :title="editing ? 'Edit Profile' : 'Profile Details'">
          <template #options>
            <button v-if="!editing" class="btn btn-sm btn-alt-secondary" @click="editing=true">
              <i class="si si-pencil me-1"></i> Edit
            </button>
          </template>

          <div v-if="!editing" class="row g-3">
            <div v-for="field in [
              { label:'Full Name',        value: profile.full_name },
              { label:'Username',         value: profile.username },
              { label:'Email',            value: profile.email },
              { label:'Phone',            value: profile.phone_number },
              { label:'Programme',        value: profile.program },
              { label:'Year of Study',    value: profile.year_of_study },
              { label:'Registration No.', value: profile.registration_number },
            ]" :key="field.label" class="col-sm-6">
              <div class="text-muted" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">
                {{ field.label }}
              </div>
              <div class="fw-medium mt-1" style="font-size:14px;">{{ field.value || "—" }}</div>
            </div>
          </div>

          <div v-else>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-medium">Full Name</label>
                <input v-model="form.full_name" type="text" class="form-control"/>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">Phone Number</label>
                <input v-model="form.phone_number" type="text" class="form-control"/>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">Programme</label>
                <input v-model="form.program" type="text" class="form-control"/>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">Year of Study</label>
                <input v-model.number="form.year_of_study" type="number" class="form-control" min="1" max="6"/>
              </div>
            </div>
            <div class="d-flex gap-2 mt-4">
              <button class="btn btn-alt-secondary" @click="editing=false">Cancel</button>
              <button class="btn btn-primary" @click="save" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                Save Changes
              </button>
            </div>
          </div>
        </BaseBlock>
      </div>
    </div>
  </div>
</template>