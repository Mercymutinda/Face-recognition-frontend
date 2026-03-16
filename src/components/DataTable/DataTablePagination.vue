<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["change-page"]);

const pages = computed(() => {
  const range = [];
  const delta = 2;
  const left = props.currentPage - delta;
  const right = props.currentPage + delta + 1;

  for (let i = 1; i <= props.totalPages; i += 1) {
    if (i === 1 || i === props.totalPages || (i >= left && i < right)) {
      range.push(i);
    }
  }

  return range;
});

function changePage(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }

  emit("change-page", page);
}
</script>

<template>
  <nav aria-label="Page navigation">
    <ul class="pagination pagination-sm justify-content-end mb-0">
      <!-- First Page -->
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <a class="page-link" href="#" @click.prevent="changePage(1)" title="First">
          <i class="fa fa-angle-double-left"></i>
        </a>
      </li>

      <!-- Previous Page -->
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)" title="Previous">
          <i class="fa fa-angle-left"></i>
        </a>
      </li>

      <!-- Page Numbers -->
      <li
        class="page-item"
        v-for="page in pages"
        :key="page"
        :class="{ active: page === currentPage }"
      >
        <a class="page-link" href="#" @click.prevent="changePage(page)">
          {{ page }}
        </a>
      </li>

      <!-- Next Page -->
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)" title="Next">
          <i class="fa fa-angle-right"></i>
        </a>
      </li>

      <!-- Last Page -->
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <a class="page-link" href="#" @click.prevent="changePage(totalPages)" title="Last">
          <i class="fa fa-angle-double-right"></i>
        </a>
      </li>
    </ul>
  </nav>
</template>
