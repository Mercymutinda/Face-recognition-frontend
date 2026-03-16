<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTemplateStore } from "@/stores/template";
import { useAuthStore } from "@/stores/auth"; // Ensure this is the correct path
import { useAlert } from "@/composables/alerts";

const { toastSuccess, toastError } = useAlert();
// Main stores and Router
const store = useTemplateStore();
const router = useRouter();
const authStore = useAuthStore(); // Changed variable name for clarity

// State variables
const username = ref("");
const password = ref("");
const errors = ref({});
const isLoading = ref(false); // Must be a ref to use in template

// On form submission
async function onSubmit() {
  errors.value = {}; // Reset errors
  isLoading.value = true; // Use .value for refs

  try {
    const response = await authStore.login({
      username: username.value,
      password: password.value,
    });

    const successMessage =
      response?.dataPayload?.alertify?.message || "Welcome back!";

    toastSuccess("Success", successMessage);
    router.push({ name: "dashboard" });
  } catch (error) {
    // Handle useApi error structure (errorPayload directly, not nested in response.data)
    if (error?.errorPayload?.errors) {
      errors.value = error.errorPayload.errors;
    } else {
      const backendMessage =
        error?.errorPayload?.message ||
        error?.message;
      const fallbackMessage =
        "Login failed. Please try again.";
      toastError("Login failed", backendMessage || fallbackMessage);
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <BaseBackground image="/assets/media/photos/photo28@2x.jpg">
    <div class="row g-0 bg-primary-dark-op">
      <div
        class="hero-static col-lg-4 d-none d-lg-flex flex-column justify-content-center"
      >
        <div class="p-4 p-xl-5 flex-grow-1 d-flex align-items-center">
          <div class="w-100">
            <RouterLink
              :to="{ name: 'dashboard' }"
              class="link-fx fw-semibold fs-2 text-white"
            >
              One<span class="fw-normal">UI</span>
            </RouterLink>
            <p class="text-white-75 me-xl-8 mt-2">
              Welcome to your amazing app. Feel free to login and start managing
              your projects and clients.
            </p>
          </div>
        </div>
        <div
          class="p-4 p-xl-5 d-xl-flex justify-content-between align-items-center fs-sm"
        >
          <p class="fw-medium text-white-50 mb-0">
            <strong>{{ store.app.name + " " + store.app.version }}</strong>
            &copy; {{ store.app.copyright }}
          </p>
        </div>
      </div>

      <div
        class="hero-static col-lg-8 d-flex flex-column align-items-center bg-body-extra-light"
      >
        <div class="p-3 w-100 d-lg-none text-center">
          <RouterLink
            :to="{ name: 'dashboard' }"
            class="link-fx fw-semibold fs-3 text-dark"
          >
            One<span class="fw-normal">UI</span>
          </RouterLink>
        </div>
        <div class="p-4 w-100 flex-grow-1 d-flex align-items-center">
          <div class="w-100">
            <div class="text-center mb-5">
              <p class="mb-3">
                <i class="fa fa-2x fa-circle-notch text-primary-light"></i>
              </p>
              <h1 class="fw-bold mb-2">Sign In</h1>
              <p class="fw-medium text-muted">Please login to your account.</p>
            </div>

            <div class="row g-0 justify-content-center">
              <div class="col-sm-8 col-xl-4">
                <form @submit.prevent="onSubmit">
                  <div class="mb-4">
                    <input
                      type="text"
                      class="form-control form-control-lg form-control-alt py-3"
                      placeholder="Username"
                      :class="{ 'is-invalid': errors.username }"
                      v-model="username"
                    />
                    <div
                      v-if="errors.username"
                      class="invalid-feedback animated fadeIn"
                    >
                      {{ errors.username }}
                    </div>
                  </div>
                  <div class="mb-4">
                    <input
                      type="password"
                      class="form-control form-control-lg form-control-alt py-3"
                      placeholder="Password"
                      :class="{ 'is-invalid': errors.password }"
                      v-model="password"
                    />
                    <div
                      v-if="errors.password"
                      class="invalid-feedback animated fadeIn"
                    >
                      {{ errors.password }}
                    </div>
                  </div>
                  <div
                    class="d-flex justify-content-between align-items-center mb-4"
                  >
                    <RouterLink
                      :to="{ name: 'reminder' }"
                      class="text-muted fs-sm fw-medium"
                    >
                      Forgot Password?
                    </RouterLink>
                    <button
                      type="submit"
                      class="btn btn-lg btn-alt-primary"
                      :disabled="isLoading"
                    >
                      <i
                        v-if="isLoading"
                        class="fa fa-spinner fa-spin me-1"
                      ></i>
                      <i
                        v-else
                        class="fa fa-fw fa-sign-in-alt me-1 opacity-50"
                      ></i>
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseBackground>
</template>
