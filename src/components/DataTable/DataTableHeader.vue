<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  searchQuery: {
    type: String,
    default: "",
  },
  searchPlaceholder: {
    type: String,
    default: "Search...",
  },
  showCreate: {
    type: Boolean,
    default: true,
  },
  createLabel: {
    type: String,
    default: "New",
  },
  totalCount: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["search", "create"]);

function onInput(event) {
  emit("search", event.target.value);
}
</script>

<template>
  <div class="row mb-4">
    <div class="col-md-4" v-if="searchable">
      <input
        type="text"
        class="form-control"
        :placeholder="searchPlaceholder"
        :value="searchQuery"
        @input="onInput"
      />
    </div>

    <div class="col-md-8 d-flex justify-content-end align-items-center gap-3">
      <slot name="toolbar" />
      <span v-if="totalCount !== null" class="text-muted">Total: {{ totalCount }}</span>

      <button
        v-if="showCreate"
        type="button"
        class="btn btn-primary"
        @click="emit('create')"
      >
        <i class="fa fa-plus me-1"></i> {{ createLabel }}
      </button>
    </div>
  </div>
</template>
