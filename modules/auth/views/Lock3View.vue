<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useTemplateStore } from "@/stores/template";
import { useAuthStore } from "@/stores/authStore";
import { useBackendValidation } from "@/composables/useBackendValidation";

const store = useTemplateStore();
const router = useRouter();
const authStore = useAuthStore();

// Bring in our backend error handler
const { fieldErrors, clearErrors, handleApiError } = useBackendValidation();

const isLoading = ref(false);

// Grab the username from local storage so they don't have to re-type it
const savedUsername = localStorage.getItem("user.username") || "User";

const state = reactive({
  password: "",
});

async function onSubmit() {
  isLoading.value = true;
  clearErrors();

  try {
    // Send the saved username and the typed password to FastAPI
    const response = await authStore.login({
      username: savedUsername,
      password: state.password,
    });

    if (response.success) {
      router.push({ name: "dashboard" }); // Make sure this matches your route name!
    }
  } catch (error) {
    // This will pop a red toast and attach any input errors to fieldErrors
    handleApiError(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <BaseBackground image="/assets/media/photos/photo34@2x.jpg">
    <div class="row g-0 bg-primary-dark-op">
      <div class="hero-static col-lg-4 flex-column mx-auto">
        <div class="p-4 p-sm-5 flex-grow-1 d-flex align-items-center">
          <div class="w-100">
            <div class="text-center mb-5">
              <p class="mb-3">
                <i class="fa fa-2x fa-circle-notch text-primary-light"></i>
              </p>
              <h1 class="fw-bold mb-2 text-white">Account Locked</h1>
              <p class="fw-medium text-white-75">
                Please enter your password to unlock your account.
              </p>
            </div>

            <form @submit.prevent="onSubmit">
              <div class="block block-rounded block-transparent mb-0">
                <div class="block-content block-content-full bg-body-extra-light px-lg-5 py-lg-4 text-center">
                  
                  <img
                    class="img-avatar img-avatar96 img-avatar-thumb"
                    src="/assets/media/avatars/avatar10.jpg"
                    alt="User Avatar"
                  />
                  <p class="fw-semibold mt-3 mb-0">{{ savedUsername }}</p>
                  <p class="text-muted fs-sm fw-medium mb-4">
                    user@example.com </p>

                  <div class="mb-4">
                    <div class="input-group input-group-lg">
                      <input
                        type="password"
                        class="form-control"
                        placeholder="Password.."
                        :class="{ 'is-invalid': fieldErrors.password }"
                        v-model="state.password"
                      />
                      <span class="input-group-text">
                        <i class="fa fa-asterisk"></i>
                      </span>
                    </div>
                    <div v-if="fieldErrors.password" class="invalid-feedback text-start animated fadeIn d-block">
                      {{ fieldErrors.password }}
                    </div>
                  </div>

                  <div class="text-center mb-4">
                    <button type="submit" class="btn btn-hero btn-primary" :disabled="isLoading">
                      <i class="fa fa-fw fa-unlock-alt opacity-50 me-1"></i>
                      {{ isLoading ? 'Unlocking...' : 'Unlock' }}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </BaseBackground>
</template>