<script setup>
import { computed } from "vue";
import DataTablePagination from "@/components/DataTable/DataTablePagination.vue";

const props = defineProps({
  paginated: {
    type: Boolean,
    default: true,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  perPage: {
    type: Number,
    default: 20,
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["change-page", "change-per-page"]);

const firstItem = computed(() => {
  if (props.totalCount === 0) return 0;
  return (props.currentPage - 1) * props.perPage + 1;
});

const lastItem = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.totalCount);
});

function onPerPageChange(event) {
  emit("change-per-page", Number(event.target.value));
}
</script>

<template>
  <div class="row mt-3" v-if="paginated">
    <div class="col-md-6 d-flex align-items-center">
      <div class="d-flex align-items-center gap-3">
        <div class="d-flex align-items-center">
          <label class="me-2 mb-0">Per page:</label>
          <select
            class="form-select form-select-sm"
            style="width: 80px"
            :value="perPage"
            @change="onPerPageChange"
          >
            <option v-for="option in perPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
        <span v-if="totalCount > 0" class="text-muted">
          Showing {{ firstItem }} to {{ lastItem }} of {{ totalCount }} entries
        </span>
      </div>
    </div>

    <div class="col-md-6" v-if="totalPages > 1">
      <DataTablePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @change-page="emit('change-page', $event)"
      />
    </div>
  </div>
</template>
