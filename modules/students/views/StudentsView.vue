<script setup>
import { ref, computed, onMounted } from "vue";
import { useUsersStore } from "@/stores/usersStore";
import { useAcademicSetupStore } from "@/stores/academicStore";
import { useAuthStore } from "@/stores/authStore";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { confirmAction } = useAlert();
const usersStore = useUsersStore();
const acadStore = useAcademicSetupStore();
const authStore = useAuthStore();

const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const viewMode = ref(false);

const form = ref({
  full_name: "", username: "", email: "", registration_number: "", phone_number: "", password: "", cohort_id: null, assigned_role: "STUDENT"
});

const columns = [
  { field: "registration_number", header: "Reg No", width: "150px" },
  { field: "full_name", header: "Student Name" },
  { field: "cohort", header: "Class / Cohort", slot: "cell-cohort" },
  { field: "biometrics", header: "Biometrics", slot: "cell-biometrics" },
];

const tableActions = computed(() => {
  const actions = ['view'];
  if (authStore.hasRole('ADMIN')) {
    actions.push('edit', 'delete');
  }
  return actions;
});

onMounted(() => {
  usersStore.fetchUsers({ role: 'STUDENT' });
  acadStore.fetchClasses();
});

const getClassName = (id) => {
  if (!id) return "Unassigned";
  const cohort = acadStore.classes.find(c => c.id === id);
  return cohort ? cohort.name : `Class #${id}`;
};

function openCreate() {
  editing.value = null; viewMode.value = false;
  form.value = { full_name: "", username: "", email: "", registration_number: "", phone_number: "", password: "", cohort_id: null, assigned_role: "STUDENT" };
  showModal.value = true;
}

function openEdit(u) {
  editing.value = u; viewMode.value = false;
  form.value = {
    full_name: u.full_name || "", username: u.username || "", email: u.email || "", registration_number: u.registration_number || "", phone_number: u.phone_number || "", password: "", cohort_id: u.cohort_id || null, assigned_role: "STUDENT"
  };
  showModal.value = true;
}

function openView(u) {
  editing.value = u; viewMode.value = true;
  form.value = {
    full_name: u.full_name || "", username: u.username || "", email: u.email || "", registration_number: u.registration_number || "", phone_number: u.phone_number || "", password: "••••••••", cohort_id: u.cohort_id || null, assigned_role: "STUDENT"
  };
  showModal.value = true;
}

async function save() {
  if (viewMode.value) { showModal.value = false; return; }
  saving.value = true;
  const payload = { ...form.value };
  
  payload.cohort_id = payload.cohort_id ? parseInt(payload.cohort_id) : null;
  if (editing.value && !payload.password) delete payload.password;

  try {
    if (editing.value) await usersStore.updateUser(editing.value.id, payload);
    else await usersStore.createUser(payload);
    
    showModal.value = false;
    usersStore.fetchUsers({ role: 'STUDENT' }); // Refresh filtered list
  } finally {
    saving.value = false;
  }
}

async function handleDelete(u) {
  const result = await confirmAction("Suspend Student", `Are you sure you want to disable the account for "${u.full_name}"?`);
  if (result.isConfirmed) {
    await usersStore.deleteUser(u.id);
    usersStore.fetchUsers({ role: 'STUDENT' });
  }
}
</script>

<template>
  <BasePageHeading title="Students" subtitle="Manage the student body">
    <template #extra v-if="authStore.hasRole('ADMIN')">
      <button class="btn btn-primary btn-sm" @click="openCreate">
        <i class="fa fa-plus me-1"></i> New Student
      </button>
    </template>
  </BasePageHeading>
  
  <div class="content">
    <DataTable 
      title="Registered Students" 
      :columns="columns" 
      :data="usersStore.users" 
      :loading="usersStore.loading || acadStore.loading.classes"
      :total-count="usersStore.meta.total"
      :current-page="usersStore.meta.page"
      :total-pages="Math.ceil(usersStore.meta.total / usersStore.meta.limit) || 1"
      :actions="tableActions"
      @view="openView"
      @edit="openEdit"
      @delete="handleDelete"
      @change-page="(p) => usersStore.fetchUsers({ role: 'STUDENT', page: p })"
    >
      <template #cell-cohort="{ row }">
        <span class="badge bg-primary-light text-primary border border-primary border-opacity-25">
          {{ getClassName(row.cohort_id) }}
        </span>
      </template>
      <template #cell-biometrics="{ row }">
        <span class="badge" :class="row.is_biometrics_registered ? 'bg-success' : 'bg-warning text-dark'">
          <i :class="row.is_biometrics_registered ? 'fa fa-check-circle me-1' : 'fa fa-exclamation-triangle me-1'"></i>
          {{ row.is_biometrics_registered ? 'Registered' : 'Pending' }}
        </span>
      </template>
    </DataTable>
  </div>

  <BaseModal :show-modal="showModal" :title="viewMode ? 'Student Details' : editing ? 'Edit Student' : 'Add New Student'" @close="showModal = false">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Full Name</label>
        <input v-model="form.full_name" type="text" class="form-control" placeholder="John Doe" :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Registration Number</label>
        <input v-model="form.registration_number" type="text" class="form-control" placeholder="BSCS/..." :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input v-model="form.email" type="email" class="form-control" placeholder="student@example.com" :readonly="viewMode" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Phone Number</label>
        <input v-model="form.phone_number" type="text" class="form-control" placeholder="+254..." :readonly="viewMode" />
      </div>
      <div class="col-md-12">
        <label class="form-label">Class / Cohort</label>
        <select v-model="form.cohort_id" class="form-select text-uppercase" :disabled="viewMode">
          <option :value="null" disabled>Select Class...</option>
          <option v-for="cohort in acadStore.classes" :key="cohort.id" :value="cohort.id">{{ cohort.name }}</option>
        </select>
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
        <i v-if="saving" class="fa fa-spinner fa-spin me-1"></i> {{ editing ? 'Save Changes' : 'Create Student' }}
      </button>
    </template>
  </BaseModal>
</template>