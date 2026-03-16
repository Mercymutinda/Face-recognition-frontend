export function useDataTableActions(handlers = {}) {
  const {
    onCreate,
    onView,
    onEdit,
    onDelete,
  } = handlers;

  function handleCreate() {
    if (typeof onCreate === "function") {
      onCreate();
    }
  }

  function handleView(row) {
    if (typeof onView === "function") {
      onView(row);
    }
  }

  function handleEdit(row) {
    if (typeof onEdit === "function") {
      onEdit(row);
    }
  }

  function handleDelete(row) {
    if (typeof onDelete === "function") {
      onDelete(row);
    }
  }

  return {
    handleCreate,
    handleView,
    handleEdit,
    handleDelete,
  };
}
