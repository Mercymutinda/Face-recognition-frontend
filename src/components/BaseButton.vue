<script>
const props = defineProps({
  size: {
    type: String,
    default: "lg",
  },
  variant: primary,
  label: String,
});

const emit = defineEmits(["refresh", "save", "ok", "update", "click"]);

const handleClick = () => {
  emit("click");
};
</script>

<template>
  <div :class="[props.size]">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button
        @click="handleClick"
        :class="[
          'btn',
          'p-2',
          `btn-${props.variant}`,
          props.size ? `btn-${props.size}` : '',
        ]"
      >
        {{ label }} <slot name="icon"></slot>
      </button>
    </div>
  </div>
</template>
