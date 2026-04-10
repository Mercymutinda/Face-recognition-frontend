<script setup>
import { ref, onMounted, computed } from "vue";
import { useUsersStore } from "@/stores/usersStore";
import { useRolesStore } from "@/stores/rolesStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { confirmAction } = useAlert();
const usersStore = useUsersStore();
const rolesStore = useRolesStore();
const acadStore = useAcademicSetupStore();
const authStore = useAuthStore();

const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const viewMode = ref(false);

const form = ref({
  full_name: "",
  username: "",
  email: "",
  registration_number: "",
  phone_number: "",
  password: "",
  assigned_role: "",
  cohort_id: null,
});

const columns = [
  { field: "username", header: "Username" },
  { field: "full_name", header: "Full Name" },
  { field: "email", header: "Email" },
  { field: "roles", header: "Role", slot: "role_badge" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.hasRole('ADMIN')) {
    actions.push('edit', 'delete');
  }
  return actions;
});

onMounted(() => {
  usersStore.fetchUsers();
  rolesStore.fetchRoles();
  acadStore.fetchClasses(); // Fetches cohorts/classes
});

function openCreate() {
  editing.value = null; 
  viewMode.value = false;
  form.value = {
    full_name: "", username: "", email: "",
    registration_number: "", phone_number: "", password: "",
    assigned_role: "", cohort_id: null
  };
  showModal.value = true;
}

function openEdit(u) {
  editing.value = u; 
  viewMode.value = false;
  form.value = {
    full_name: u.full_name || "",
    username: u.username || "",
    email: u.email || "",
    registration_number: u.registration_number || "",
    phone_number: u.phone_number || "",
    password: "", // Keep blank so they don't overwrite it unless they type something new
    assigned_role: u.roles && u.roles.length > 0 ? u.roles[0].name : "",
    cohort_id: u.cohort_id || null
  };
  showModal.value = true;
}

function openView(u) {
  editing.value = u; 
  viewMode.value = true;
  form.value = {
    full_name: u.full_name || "",
    username: u.username || "",
    email: u.email || "",
    registration_number: u.registration_number || "",
    phone_number: u.phone_number || "",
    password: "••••••••", 
    assigned_role: u.roles && u.roles.length > 0 ? u.roles[0].name : "",
    cohort_id: u.cohort_id || null
  };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { 
    showModal.value = false; 
    return; 
  }
  
  saving.value = true;
  const payload = { ...form.value };
  
  // Ensure cohort_id is strictly an integer or null
  payload.cohort_id = payload.cohort_id ? parseInt(payload.cohort_id) : null;

  // Don't send empty passwords during an update
  if (editing.value && !payload.password) {
    delete payload.password;
  }

  try {
    if (editing.value) {
      await usersStore.updateUser(editing.value.id, payload);
    } else {
      await usersStore.createUser(payload);
    }
    showModal.value = false;
  } catch (err) {
    // Errors are handled by the store toasts, but we catch it so the modal stays open for correction
  } finally {
    saving.value = false;
  }
}

async function handleDelete(u) {
  const result = await confirmAction("Suspend User", `Are you sure you want to disable account for "${u.username}"?`);
  if (result.isConfirmed) {
    await usersStore.deleteUser(u.id);
  }
}
</script>

<template>
  <BasePageHeading title="System Users" subtitle="Manage all accounts and roles">
    <template #extra>
      <button class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New User
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <DataTable 
      title="All Users"
      :columns="columns" 
      :data="usersStore.users"
      :loading="usersStore.loading"
      :total-count="usersStore.meta.total"
      :current-page="usersStore.meta.page"
      :total-pages="Math.ceil(usersStore.meta.total / usersStore.meta.limit) || 1"
      :actions="tableActions"
      @create="openCreate" 
      @view="openView" 
      @edit="openEdit" 
      @delete="handleDelete"
    >
      <template #role_badge="{ row }">
        <span
          v-for="role in row.roles"
          :key="role.id"
          class="badge"
          :class="
            role.name === 'ADMIN'
              ? 'bg-danger'
              : role.name === 'LECTURER'
                ? 'bg-primary'
                : 'bg-success'
          "
        >
          {{ role.name }}
        </span>
      </template>
    </DataTable>
  </div>

  <BaseModal
    :show-modal="showModal"
    :title="viewMode ? 'User Details' : editing ? 'Edit User' : 'Add New User'"
    @close="showModal = false"
  >
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label fw-bold text-primary">System Role *</label>
        <select v-model="form.assigned_role" class="form-select border-primary" :disabled="viewMode || editing">
          <option value="" disabled>Select a role...</option>
          <option v-for="role in rolesStore.roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
      </div>

      <div class="col-md-6">
        <label class="form-label">Full Name</label>
        <input v-model="form.full_name" type="text" class="form-control" placeholder="John Doe" :readonly="viewMode" />
      </div>
      
      <div class="col-md-6">
        <label class="form-label">Reg Number / Staff ID</label>
        <input v-model="form.registration_number" type="text" class="form-control" :readonly="viewMode" />
      </div>

      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input v-model="form.email" type="email" class="form-control" placeholder="john@example.com" :readonly="viewMode" />
      </div>
      
      <div class="col-md-6">
        <label class="form-label">Phone Number</label>
        <input v-model="form.phone_number" type="text" class="form-control" placeholder="+254..." :readonly="viewMode" />
      </div>

      <template v-if="form.assigned_role === 'STUDENT'">
        <div class="col-md-12">
          <label class="form-label">Cohort (Program & Year)</label>
          <select v-model="form.cohort_id" class="form-select text-uppercase" :disabled="viewMode">
            <option :value="null" disabled>Select Cohort...</option>
            <option v-for="cohort in acadStore.classes" :key="cohort.id" :value="cohort.id">
              {{ cohort.name }}
            </option>
          </select>
        </div>
      </template>

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
      <button class="btn btn-alt-secondary" @click="showModal = false">
        {{ viewMode ? 'Close' : 'Cancel' }}
      </button>
      <button v-if="!viewMode" class="btn btn-primary" @click="save" :disabled="saving || !form.full_name || !form.email">
        <i v-if="saving" class="fa fa-spinner fa-spin me-1"></i> 
        {{ editing ? 'Save Changes' : 'Create User' }}
      </button>
    </template>
  </BaseModal>
</template>