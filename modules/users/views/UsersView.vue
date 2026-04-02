<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "@/utils/api";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { toastSuccess, toastError, confirmAction } = useAlert();
const users = ref([]);
const loading = ref(false);
const showModal = ref(false);
const saving = ref(false);

const form = reactive({
  full_name: "", username: "", email: "", 
  registration_number: "", phone_number: "",
  password: "", assigned_role: "STUDENT", 
  program: "BSCS", year_of_study: 1
});

const columns = [
  { field: "username", header: "Username" },
  { field: "full_name", header: "Full Name" },
  { field: "email", header: "Email" },
  { field: "roles", header: "Role", slot: "role_badge" }, // Custom slot for badges
];

onMounted(fetchUsers);

async function fetchUsers() {
  loading.value = true;
  try {
    const { data } = await api.get("/users");
    users.value = data.items || data;
  } finally { loading.value = false; }
}

async function handleCreate() {
  saving.value = true;
  try {
    await api.post("/auth/signup", form);
    toastSuccess("User Created", `${form.full_name} added as ${form.assigned_role}`);
    showModal.value = false;
    fetchUsers();
  } catch (err) {
    toastError("Error", err.response?.data?.detail || "Failed to create user");
  } finally { saving.value = false; }
}
</script>

<template>
  <BasePageHeading title="System Users" subtitle="Manage all accounts and roles">
    <template #extra>
      <button class="btn btn-primary btn-sm" @click="showModal = true">
        <i class="fa fa-plus me-1"></i> New User
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <DataTable :columns="columns" :data="users" :loading="loading">
      <template #role_badge="{ row }">
        <span v-for="role in row.roles" :key="role" 
              class="badge" 
              :class="role === 'ADMIN' ? 'bg-danger' : (role === 'LECTURER' ? 'bg-primary' : 'bg-success')">
          {{ role }}
        </span>
      </template>
    </DataTable>
  </div>

  <BaseModal :show-modal="showModal" title="Add New User" @close="showModal = false">
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label fw-bold text-primary">System Role *</label>
        <select v-model="form.assigned_role" class="form-select border-primary">
          <option value="STUDENT">Student</option>
          <option value="LECTURER">Lecturer</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>
      
      <div class="col-md-6">
        <label class="form-label">Full Name</label>
        <input v-model="form.full_name" type="text" class="form-control" placeholder="John Doe" />
      </div>
      <div class="col-md-6">
        <label class="form-label">{{ form.assigned_role === 'LECTURER' ? 'Staff ID' : 'Reg Number' }}</label>
        <input v-model="form.registration_number" type="text" class="form-control" />
      </div>

      <template v-if="form.assigned_role === 'STUDENT'">
        <div class="col-md-6">
          <label class="form-label">Program</label>
          <select v-model="form.program" class="form-select text-uppercase">
            <option value="BSCS">BSCS</option>
            <option value="BBIT">BBIT</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Year of Study</label>
          <input v-model.number="form.year_of_study" type="number" class="form-control" />
        </div>
      </template>

      <div class="col-md-6">
        <label class="form-label">Username</label>
        <input v-model="form.username" type="text" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Temporary Password</label>
        <input v-model="form.password" type="password" class="form-control" />
      </div>
    </div>
    <template #footer>
      <button class="btn btn-alt-secondary" @click="showModal = false">Cancel</button>
      <button class="btn btn-primary" @click="handleCreate" :disabled="saving">
        <i v-if="saving" class="fa fa-spinner fa-spin me-1"></i> Create User
      </button>
    </template>
  </BaseModal>
</template>