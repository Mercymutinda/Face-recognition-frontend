<script setup>
defineProps({
  actions: {
    type: Array,
    default: () => ["view", "edit", "delete"],
  },
  actionIcons: {
    type: Object,
    default: () => ({}),
  },
  actionLabels: {
    type: Object,
    default: () => ({}),
  },
  row: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "manage",
  "view",
  "edit",
  "delete",
  "toggleStatus",
  "ban",
  "manageGroups",
]);

const defaultConfig = {
  view: { icon: "fa fa-eye", color: "text-primary", label: "View" },
  edit: { icon: "fa fa-pencil", color: "text-success", label: "Edit" },
  delete: { icon: "fa fa-trash", color: "text-danger", label: "Delete" },
  manage: { icon: "fa fa-wrench", color: "text-info", label: "Manage" },
  manageGroups: { icon: "fa fa-users", color: "text-info", label: "Groups" },
  toggleStatus: { icon: "fa fa-toggle-on", color: "text-warning", label: "Toggle Status" },
  ban: { icon: "fa fa-ban", color: "text-danger", label: "Ban" },
};

function getIcon(action, actionIcons) {
  return actionIcons[action] || defaultConfig[action]?.icon || "fa fa-cog";
}

function getColor(action) {
  return defaultConfig[action]?.color || "text-secondary";
}

function getLabel(action, actionLabels) {
  return actionLabels[action] || defaultConfig[action]?.label || action;
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-center gap-2">
    <template v-for="action in actions" :key="action">
      <i
        :class="[getIcon(action, actionIcons), 'action-icon', getColor(action)]"
        @click="emit(action, row)"
        :title="getLabel(action, actionLabels)"
      ></i>
    </template>
  </div>
</template>

<style scoped>
.action-icon {
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.action-icon:hover {
  transform: scale(1.2);
}
</style>
