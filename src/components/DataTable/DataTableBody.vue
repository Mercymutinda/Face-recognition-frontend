<script setup>
import DataTableActionButtons from "@/components/DataTable/DataTableActionButtons.vue";

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  rowKey: {
    type: String,
    default: "id",
  },
  actions: {
    type: Array,
    default: () => [],
  },
  actionIcons: {
    type: Object,
    default: () => ({}),
  },
  emptyText: {
    type: String,
    default: "No data found",
  },
  sortBy: {
    type: String,
    default: "",
  },
  sortDir: {
    type: String,
    default: "asc",
  },
});

const emit = defineEmits(["view", "edit", "delete", "manage", "toggleStatus", "ban", "manageGroups", "change-sort"]);

function rowId(row, index) {
  return row?.[props.rowKey] ?? index;
}

function isSortable(column) {
  return column?.sortable !== false;
}

function onSort(column) {
  if (!isSortable(column) || !column?.field) return;
  emit("change-sort", column.field);
}

function sortIcon(column) {
  if (props.sortBy !== column.field) return "fa fa-sort text-muted";
  return props.sortDir === "desc" ? "fa fa-sort-down" : "fa fa-sort-up";
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-bordered table-striped table-vcenter">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.field"
            :class="column.headerClass || ''"
            :style="column.width ? { width: column.width } : {}"
            :role="isSortable(column) ? 'button' : undefined"
            @click="onSort(column)"
          >
            <span class="d-inline-flex align-items-center gap-2">
              {{ column.header }}
              <i v-if="isSortable(column)" :class="sortIcon(column)"></i>
            </span>
          </th>

          <th
            v-if="actions.length"
            class="text-center"
            style="width: 200px"
          >
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (actions.length ? 1 : 0)" class="text-center py-4">
            <slot name="loading">
              <div class="placeholder-glow">
                <div class="placeholder col-12 mb-2"></div>
                <div class="placeholder col-10 mb-2"></div>
                <div class="placeholder col-8"></div>
              </div>
            </slot>
          </td>
        </tr>

        <tr v-else-if="!data.length">
          <td :colspan="columns.length + (actions.length ? 1 : 0)" class="text-center text-muted py-4">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>

        <tr v-else v-for="(row, index) in data" :key="rowId(row, index)">
          <td
            v-for="column in columns"
            :key="column.field"
            :class="column.cellClass || ''"
          >
            <slot :name="`cell-${column.field}`" :row="row" :value="row[column.field]">
              <template v-if="row[column.field] && typeof row[column.field] === 'object' && row[column.field].label">
                <span :class="`badge bg-${row[column.field].theme || 'secondary'}`">{{ row[column.field].label }}</span>
              </template>
              <template v-else>{{ row[column.field] }}</template>
            </slot>
          </td>

          <td v-if="actions.length" class="text-center">
            <DataTableActionButtons
              :actions="actions"
              :action-icons="actionIcons"
              :row="row"
              @view="emit('view', $event)"
              @edit="emit('edit', $event)"
              @manage="emit('manage', $event)"
              @delete="emit('delete', $event)"
              @toggleStatus="emit('toggleStatus', $event)"
              @ban="emit('ban', $event)"
              @manageGroups="emit('manageGroups', $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
