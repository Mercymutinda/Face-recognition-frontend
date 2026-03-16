<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import { useModalStore } from '@/stores/modal';

const modalStore = useModalStore();
const slots = useSlots();

const modalRef = ref(null);
const dialogRef = ref(null);
const lastActiveElement = ref(null);

const sizeClass = computed(() => {
  if (!modalStore.modalSize || modalStore.modalSize === 'md') {
    return '';
  }

  return `modal-${modalStore.modalSize}`;
});

const isCloseDisabled = computed(
  () => modalStore.isSubmitting && modalStore.disableCloseWhileSubmitting
);

const hasConfirmHandler = computed(() => typeof modalStore.onConfirm === 'function');
const hasCancelHandler = computed(() => typeof modalStore.onCancel === 'function');

const shouldShowFooter = computed(() => {
  if (slots.footer) {
    return true;
  }

  if (hasConfirmHandler.value || hasCancelHandler.value) {
    return true;
  }

  if (!modalStore.showFooter) {
    return false;
  }

  // If the footer would only contain a redundant Close/Cancel button,
  // keep the header close icon as the only close control.
  if (modalStore.showConfirm) {
    return true;
  }

  return modalStore.showCancel && hasCancelHandler.value;
});

const shouldShowCancelButton = computed(
  () => modalStore.showCancel && (modalStore.showConfirm || hasConfirmHandler.value || hasCancelHandler.value)
);

const getFocusableElements = (rootEl) => {
  if (!rootEl) {
    return [];
  }

  return Array.from(
    rootEl.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('aria-hidden'));
};

const focusInitial = () => {
  const rootEl = modalRef.value;
  if (!rootEl) {
    return;
  }

  let target = null;
  if (typeof modalStore.initialFocus === 'string' && modalStore.initialFocus !== 'first') {
    target = rootEl.querySelector(modalStore.initialFocus);
  }

  if (!target && modalStore.initialFocus !== 'container') {
    const focusable = getFocusableElements(rootEl);
    target = focusable[0] || null;
  }

  if (!target) {
    target = dialogRef.value;
  }

  if (target && typeof target.focus === 'function') {
    target.focus();
  }
};

const trapFocus = (event) => {
  if (event.key !== 'Tab') {
    return;
  }

  const rootEl = modalRef.value;
  const focusable = getFocusableElements(rootEl);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  if (event.shiftKey && current === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
};

const handleKeydown = (event) => {
  if (!modalStore.isOpen) {
    return;
  }

  if (event.key === 'Escape' && modalStore.closeOnEsc && !isCloseDisabled.value) {
    event.preventDefault();
    modalStore.closeModal();
    return;
  }

  trapFocus(event);
};

const backdropClick = () => {
  if (modalStore.closeOnBackdrop && !isCloseDisabled.value) {
    modalStore.closeModal();
  }
};

const handleCancel = async () => {
  if (isCloseDisabled.value) {
    return;
  }

  if (typeof modalStore.onCancel === 'function') {
    const result = await modalStore.onCancel();
    if (result === false) {
      return;
    }
  }

  if (modalStore.closeOnCancel) {
    modalStore.closeModal();
  }
};

const handleConfirm = async () => {
  if (isCloseDisabled.value) {
    return;
  }

  if (typeof modalStore.onConfirm !== 'function') {
    modalStore.closeModal();
    return;
  }

  modalStore.setSubmitting(true);
  let shouldClose = modalStore.closeOnConfirm;

  try {
    const result = await modalStore.onConfirm();
    if (result === false) {
      shouldClose = false;
    }
  } finally {
    modalStore.setSubmitting(false);
  }

  if (shouldClose) {
    modalStore.closeModal();
  }
};

watch(
  () => modalStore.isOpen,
  async (isOpen) => {
    if (isOpen) {
      lastActiveElement.value = document.activeElement;
      await nextTick();
      focusInitial();
      document.addEventListener('keydown', handleKeydown);
      return;
    }

    document.removeEventListener('keydown', handleKeydown);
    if (modalStore.restoreFocus && lastActiveElement.value && lastActiveElement.value.focus) {
      lastActiveElement.value.focus();
    }
  }
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalStore.isOpen"
        ref="modalRef"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="modalStore.title ? modalStore.titleId : null"
        :aria-describedby="modalStore.bodyId"
        :aria-hidden="false"
        @click.self="backdropClick"
      >
        <div
          :class="[
            'modal-dialog',
            sizeClass,
            modalStore.position === 'center' ? 'modal-dialog-centered' : '',
            modalStore.scrollable ? 'modal-dialog-scrollable' : '',
            modalStore.fullscreen ? 'modal-fullscreen' : '',
          ]"
          role="document"
          ref="dialogRef"
          tabindex="-1"
        >
          <div class="modal-content">
            <!-- Header -->
            <div class="block-header block-header-default bg-body-light border-bottom">
              <h3 :id="modalStore.titleId" class="block-title text-body-color">{{ modalStore.title }}</h3>
              <div class="block-options">
                <button
                  type="button"
                  class="btn-block-option text-body-color"
                  aria-label="Close"
                  :disabled="isCloseDisabled"
                  :aria-disabled="isCloseDisabled"
                  @click="modalStore.closeModal"
                >
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Body with dynamic component -->
            <div :id="modalStore.bodyId" :class="['modal-body', modalStore.bodyClass]">
              <component
                v-if="modalStore.component"
                :is="modalStore.component"
                v-bind="modalStore.props"
              />
              <slot v-else name="component">
                <p class="text-muted">No component loaded</p>
              </slot>
            </div>

            <!-- Footer (optional) -->
            <div v-if="shouldShowFooter" class="modal-footer border-top">
              <slot name="footer">
                <button
                  v-if="shouldShowCancelButton"
                  type="button"
                  class="btn btn-secondary"
                  :disabled="isCloseDisabled"
                  @click="handleCancel"
                >
                  {{ modalStore.cancelText }}
                </button>
                <button
                  v-if="modalStore.showConfirm"
                  type="button"
                  class="btn btn-primary"
                  :disabled="isCloseDisabled"
                  @click="handleConfirm"
                >
                  <span v-if="modalStore.isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ modalStore.confirmText }}
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="backdrop">
      <div v-if="modalStore.isOpen" class="modal-backdrop fade show"></div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.15s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Make the header follow the modal's rounded corners */
.modal-content {
  overflow: hidden;
}

.modal-content > .block-header {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}

:global(html.dark) .modal-content > .block-header.block-header-default {
  background-color: #2a384b !important;
  border-bottom: 1px solid #2e3c51;
}

:global(html.dark) .modal-content > .block-header .block-title,
:global(html.dark) .modal-content > .block-header .btn-block-option {
  color: #bec8d5;
}

:global(html.dark) .modal-content .modal-body,
:global(html.dark) .modal-content .modal-body label,
:global(html.dark) .modal-content .modal-body .form-label,
:global(html.dark) .modal-content .modal-body .form-check-label {
  color: #bec8d5;
}

:global(html.dark) .modal-content .modal-body .text-muted,
:global(html.dark) .modal-content .modal-footer .text-muted {
  color: #8ea0b8 !important;
}
</style>
