<script setup>
const props = defineProps({
  showModal: { type: Boolean, default: false },
  title: { type: String, default: "Modal Title" },
  size: { type: String, default: "modal-xl" },
  position: { type: String, default: "modal-dialog-centered" }
});
defineEmits(["close"]);
</script>

<template>
  <div v-if="showModal" class="modal d-block" style="background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(3px);" tabindex="-1">
    <div class="modal-dialog" :class="[size, position]">
      
      <div class="modal-content overflow-hidden">
        
        <BaseBlock :title="title" class="mb-0" transparent>
          <template #options>
            <button type="button" class="btn-block-option" @click="$emit('close')">
              <i class="fa fa-fw fa-times"></i>
            </button>
          </template>
          
          <div class="block-content fs-sm pb-3">
            <slot></slot>
          </div>
        </BaseBlock>
        
        <div class="modal-footer bg-body m-0">
          <slot name="footer">
            <button type="button" class="btn btn-sm btn-alt-secondary" @click="$emit('close')">
              Close
            </button>
          </slot>
        </div>
        
      </div>
    </div>
  </div>
</template>