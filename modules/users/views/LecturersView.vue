<script setup>
import { ref, computed, onMounted } from "vue";
import { useUsersStore } from "@/stores/usersStore";
import { useAuthStore } from "@/stores/authStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { confirmAction } = useAlert();
const usersStore = useUsersStore();
const authStore = useAuthStore();

const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const viewMode = ref(false);

// Note: Lecturers don't have a cohort_id
const form = ref({
  full_name: "", username: "", email: "", registration_number: "", phone_number: "", password: "", assigned_role: "LECTURER"
});

const columns = [
  { field: "registration_number", header: "Staff ID", width: "150px" },
  { field: "full_name", header: "Lecturer Name" },
  { field: "email", header: "Email Address" },
  { field: "phone_number", header: "Phone" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.hasRole('ADMIN')) {
    actions.push('edit', 'delete');
  }
  return actions;
});

onMounted(() => {
  usersStore.fetchUsers({ role: 'LECTURER' });
});

function openCreate() {
  editing.value = null; viewMode.value = false;
  form.value = { full_name: "", username: "", email: "", registration_number: "", phone_number: "", password: "", assigned_role: "LECTURER" };
  showModal.value = true;
}

function openEdit(u) {
  editing.value = u; viewMode.value = false;
  form.value = {
    full_name: u.full_name || "", username: u.username || "", email: u.email || "", registration_number: u.registration_number || "", phone_number: u.phone_number || "", password: "", assigned_role: "LECTURER"
  };
  showModal.value = true;
}

function openView(u) {
  editing.value = u; viewMode.value = true;
  form.value = {
    full_name: u.full_name || "", username: u.username || "", email: u.email || "", registration_number: u.registration_number || "", phone_number: u.phone_number || "", password: "••••••••", assigned_role: "LECTURER"
  };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { showModal.value = false; return; }
  saving.value = true;
  const payload = { ...form.value };
  
  if (editing.value && !payload.password) delete payload.password;

  try {
    if (editing.value) await usersStore.updateUser(editing.value.id, payload);
    else await usersStore.createUser(payload);
    
    showModal.value = false;
    usersStore.fetchUsers({ role: 'LECTURER' }); // Refresh filtered list
  } finally {
    saving.value = false;
  }
}

async function handleDelete(u) {
  const result = await confirmAction("Suspend Lecturer", `Are you sure you want to disable the account for "${u.full_name}"?`);
  if (result.isConfirmed) {
    await usersStore.deleteUser(u.id);
    usersStore.fetchUsers({ role: 'LECTURER' });
  }
}
</script>

<template>
  <BasePageHeading title="Lecturers" subtitle="Manage faculty members">
    <template #extra v-if="authStore.hasRole('ADMIN')">
      <button class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New Lecturer
      </button>
    </template>
  </BasePageHeading>
  
  <div class="content">
    <DataTable 
      title="Academic Faculty" 
      :columns="columns" 
      :data="usersStore.users" 
      :loading="usersStore.loading"
      :total-count="usersStore.meta.total"
      :current-page="usersStore.meta.page"
      :total-pages="Math.ceil(usersStore.meta.total / usersStore.meta.limit) || 1"
      :actions="tableActions"
      @view="openView"
      @edit="openEdit"
      @delete="handleDelete"
      @change-page="(p) => usersStore.fetchUsers({ role: 'LECTURER', page: p })"
    />
  </div>

  <BaseModal :show-modal="showModal" :title="viewMode ? 'Lecturer Details' : editing ? 'Edit Lecturer' : 'Add New Lecturer'" @close="showModal = false">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Full Name</label>
        <input v-model="form.full_name" type="text" class="form-control" placeholder="Jane Doe" :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Staff ID</label>
        <input v-model="form.registration_number" type="text" class="form-control" placeholder="STF/..." :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input v-model="form.email" type="email" class="form-control" placeholder="lecturer@example.com" :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Phone Number</label>
        <input v-model="form.phone_number" type="text" class="form-control" placeholder="+254..." :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Username</label>
        <input v-model="form.username" type="text" class="form-control" :readonly="viewMode || editing" />
      </div>
      <div class="col-md-6">
        <label class="form-label">{{ editing ? 'Reset Password' : 'Temporary Password' }}</label>
        <input v-model="form.password" type="password" class="form-control" :readonly="viewMode" :placeholder="editing ? 'Leave blank to keep current' : 'Min 8 characters'" />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">{{ viewMode ? 'Close' : 'Cancel' }}</button>
      <button v-if="!viewMode" class="btn btn-primary" @click="save" :disabled="saving || !form.full_name || !form.email">
        <i v-if="saving" class="fa fa-spinner fa-spin me-1"></i> {{ editing ? 'Save Changes' : 'Create Lecturer' }}
      </button>
    </template>
  </BaseModal>
</template>