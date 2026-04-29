<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useTemplateStore } from "@/stores/template";
import { useAuthStore } from "@/stores/authStore";

const store = useTemplateStore();
const router = useRouter();
const authStore = useAuthStore();
const baseSearchTerm = ref("");

// 🔥 DYNAMIC USER DATA FROM BACKEND
const userFirstName = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || "User";
  return name.split(" ")[0]; // Gets the first name
});

const userFullName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || "System User";
});

const userRole = computed(() => {
  return authStore.primaryRole || "GUEST";
});

function onSubmitSearch() {
  router.push("/backend/pages/generic/search?" + baseSearchTerm.value);
}

function eventHeaderSearch(event) {
  if (event.which === 27) {
    event.preventDefault();
    store.headerSearch({ mode: "off" });
  }
}

const onLockAccount = async () => {
  await authStore.lockAccount(); 
  router.push({ name: "auth-lock3" }); 
};

async function onLogout() {
  await authStore.logout(); 
  router.push({ name: 'auth-signin3' });
}

onMounted(() => document.addEventListener("keydown", eventHeaderSearch));
onUnmounted(() => document.removeEventListener("keydown", eventHeaderSearch));
</script>

<template>
  <header id="page-header">
    <slot>
      <div class="content-header">
        <slot name="content">
          <!-- Left Section -->
          <div class="d-flex align-items-center">
            <slot name="content-left">
              <button
                type="button"
                class="btn btn-sm btn-alt-secondary me-2 d-lg-none"
                @click="store.sidebar({ mode: 'toggle' })"
              >
                <i class="fa fa-fw fa-bars"></i>
              </button>

              <button
                type="button"
                class="btn btn-sm btn-alt-secondary d-md-none"
                @click="store.headerSearch({ mode: 'on' })"
              >
                <i class="fa fa-fw fa-search"></i>
              </button>

              <form class="d-none d-md-inline-block" @submit.prevent="onSubmitSearch">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    class="form-control form-control-alt"
                    placeholder="Search.."
                    id="page-header-search-input2"
                    v-model="baseSearchTerm"
                  />
                  <span class="input-group-text border-0">
                    <i class="fa fa-fw fa-search"></i>
                  </span>
                </div>
              </form>
            </slot>
          </div>
          <!-- END Left Section -->

          <!-- Right Section -->
          <div class="d-flex align-items-center">
            <slot name="content-right">
              <!-- User Dropdown -->
              <div class="dropdown d-inline-block ms-2">
                <button
                  type="button"
                  class="btn btn-sm btn-alt-secondary d-flex align-items-center"
                  id="page-header-user-dropdown"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <div 
                    class="rounded-circle d-flex align-items-center justify-content-center text-white bg-primary fw-bold" 
                    style="width: 21px; height: 21px; font-size: 10px;"
                  >
                    {{ userFirstName.charAt(0).toUpperCase() }}
                  </div>
                  <!-- 🔥 Dynamic First Name -->
                  <span class="d-none d-sm-inline-block ms-2 fw-semibold">{{ userFirstName }}</span>
                  <i class="fa fa-fw fa-angle-down d-none d-sm-inline-block opacity-50 ms-1 mt-1"></i>
                </button>
                <div
                  class="dropdown-menu dropdown-menu-md dropdown-menu-end p-0 border-0"
                  aria-labelledby="page-header-user-dropdown"
                >
                  <div class="p-3 text-center bg-body-light border-bottom rounded-top">
                    <div 
                      class="img-avatar img-avatar48 img-avatar-thumb d-flex align-items-center justify-content-center mx-auto text-white bg-primary fw-bold fs-3"
                    >
                      {{ userFirstName.charAt(0).toUpperCase() }}
                    </div>
                    <!-- 🔥 Dynamic Full Name & Role -->
                    <p class="mt-2 mb-0 fw-bold">{{ userFullName }}</p>
                    <p class="mb-0 text-muted fs-sm fw-medium text-uppercase">{{ userRole }}</p>
                  </div>
                  
                  <!-- 🔥 Removed Inbox & Settings, kept Profile -->
                  <div class="p-2">
                    <RouterLink
                      :to="{ name: 'my-profile' }"
                      class="dropdown-item d-flex align-items-center justify-content-between"
                    >
                      <span class="fs-sm fw-medium"><i class="fa fa-user me-2 opacity-50"></i> My Profile</span>
                    </RouterLink>
                  </div>
                  <div role="separator" class="dropdown-divider m-0"></div>
                  <div class="p-2">
                    <a
                      href="#"
                      @click.prevent="onLockAccount"
                      class="dropdown-item d-flex align-items-center justify-content-between"
                    >
                      <span class="fs-sm fw-medium"><i class="fa fa-lock me-2 opacity-50"></i> Lock Account</span>
                    </a>
                    <a
                      href="#"
                      @click.prevent="onLogout"
                      class="dropdown-item d-flex align-items-center justify-content-between text-danger"
                    >
                      <span class="fs-sm fw-medium"><i class="fa fa-sign-out-alt me-2 opacity-50"></i> Log Out</span>
                    </a>
                  </div>
                </div>
              </div>
              <!-- END User Dropdown -->
            </slot>
          </div>
          <!-- END Right Section -->
        </slot>
      </div>

      <!-- Header Search -->
      <div
        id="page-header-search"
        class="overlay-header bg-body-extra-light"
        :class="{ show: store.settings.headerSearch }"
      >
        <div class="content-header">
          <form class="w-100" @submit.prevent="onSubmitSearch">
            <div class="input-group">
              <button
                type="button"
                class="btn btn-alt-danger"
                @click="store.headerSearch({ mode: 'off' })"
              >
                <i class="fa fa-fw fa-times-circle"></i>
              </button>
              <input
                type="text"
                class="form-control"
                placeholder="Search or hit ESC.."
                v-model="baseSearchTerm"
              />
            </div>
          </form>
        </div>
      </div>
      <!-- END Header Search -->

      <!-- Header Loader -->
      <div
        id="page-header-loader"
        class="overlay-header bg-body-extra-light"
        :class="{ show: store.settings.headerLoader }"
      >
        <div class="content-header">
          <div class="w-100 text-center">
            <i class="fa fa-fw fa-circle-notch fa-spin"></i>
          </div>
        </div>
      </div>
    </slot>
  </header>
</template>