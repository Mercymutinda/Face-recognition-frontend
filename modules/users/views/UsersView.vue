<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "@/utils/api";
import DataTable from "@/components/DataTable/DataTable.vue";
import { useAlert } from "@/composables/alerts";

const { toastSuccess, toastError, confirmAction } = useAlert();
const users = ref([]);
const roles = ref([]); // Store dynamic roles
const cohorts = ref([]); // Store dynamic cohorts

const loading = ref(false);
const showModal = ref(false);
const saving = ref(false);

// Aligned exactly with SignupSchema in backend
const form = reactive({
  full_name: "",
  username: "",
  email: "",
  registration_number: "",
  phone_number: "",
  password: "",
  assigned_role: "", // Will be selected from DB
  cohort_id: null, // Replaces static program/year
});

const columns = [
  { field: "username", header: "Username" },
  { field: "full_name", header: "Full Name" },
  { field: "email", header: "Email" },
  { field: "roles", header: "Role", slot: "role_badge" },
];

onMounted(() => {
  fetchUsers();
  fetchRoles();
  fetchCohorts();
});

async function fetchUsers() {
  loading.value = true;
  try {
    const { data } = await api.get("/users");
    users.value = data.items || data;
  } finally {
    loading.value = false;
  }
}

async function fetchRoles() {
  try {
    const { data } = await api.get("/roles"); // Adjust endpoint if needed
    roles.value = data.items || data;
  } catch (err) {
    console.error("Failed to fetch roles", err);
  }
}

async function fetchCohorts() {
  try {
    const { data } = await api.get("/academic/cohorts"); // Adjust endpoint to match your academic router
    cohorts.value = data.items || data;
  } catch (err) {
    console.error("Failed to fetch cohorts", err);
  }
}

async function handleCreate() {
  saving.value = true;
  try {
    // Clone the form payload so we can format it before sending
    const payload = { ...form };

    // Ensure cohort_id is strictly an integer or null
    payload.cohort_id = payload.cohort_id ? parseInt(payload.cohort_id) : null;

    await api.post("/auth/signup", payload);
    toastSuccess("User Created", `${form.full_name} added successfully.`);
    showModal.value = false;

    // Reset form
    Object.assign(form, {
      full_name: "",
      username: "",
      email: "",
      registration_number: "",
      phone_number: "",
      password: "",
      assigned_role: "",
      cohort_id: null,
    });

    fetchUsers();
  } catch (err) {
    // Note: If you get a 500, err.response.data might be undefined, so we add a fallback
    toastError(
      "Error",
      err.response?.data?.detail ||
        "Backend crash. Check FastAPI terminal logs!"
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BasePageHeading
    title="System Users"
    subtitle="Manage all accounts and roles"
  >
    <template #extra>
      <button class="btn btn-primary btn-sm" @click="showModal = true">
        <i class="fa fa-plus me-1"></i> New User
      </button>
    </template>
  </BasePageHeading>

  <div class="content">
    <DataTable :columns="columns" :data="users" :loading="loading">
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
    title="Add New User"
    @close="showModal = false"
  >
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label fw-bold text-primary">System Role *</label>
        <select v-model="form.assigned_role" class="form-select border-primary">
          <option value="" disabled>Select a role...</option>
          <option v-for="role in roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
      </div>

      <div class="col-md-6">
        <label class="form-label">Full Name</label>
        <input
          v-model="form.full_name"
          type="text"
          class="form-control"
          placeholder="John Doe"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Reg Number / Staff ID</label>
        <input
          v-model="form.registration_number"
          type="text"
          class="form-control"
        />
      </div>

      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="form-control"
          placeholder="john@example.com"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Phone Number</label>
        <input
          v-model="form.phone_number"
          type="text"
          class="form-control"
          placeholder="+254..."
        />
      </div>

      <template v-if="form.assigned_role === 'STUDENT'">
        <div class="col-md-12">
          <label class="form-label">Cohort (Program & Year)</label>
          <select v-model="form.cohort_id" class="form-select text-uppercase">
            <option :value="null" disabled>Select Cohort...</option>
            <option
              v-for="cohort in cohorts"
              :key="cohort.id"
              :value="cohort.id"
            >
              {{ cohort.name }}
            </option>
          </select>
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
      <button class="btn btn-alt-secondary" @click="showModal = false">
        Cancel
      </button>
      <button class="btn btn-primary" @click="handleCreate" :disabled="saving">
        <i v-if="saving" class="fa fa-spinner fa-spin me-1"></i> Create User
      </button>
    </template>
  </BaseModal>
</template>
