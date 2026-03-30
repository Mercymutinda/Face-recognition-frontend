import { computed, ref } from "vue";

export function useDataTableSelection(rowKey = "id") {
  const selectedRows = ref([]);

  function getRowKeyValue(row) {
    return row?.[rowKey];
  }

  function toggleSelect(row) {
    const key = getRowKeyValue(row);
    if (key === undefined || key === null) return;

    const index = selectedRows.value.findIndex((selected) => selected === key);

    if (index >= 0) {
      selectedRows.value.splice(index, 1);
    } else {
      selectedRows.value.push(key);
    }
  }

  function clearSelection() {
    selectedRows.value = [];
  }

  function selectAll(rows = []) {
    selectedRows.value = rows
      .map((row) => getRowKeyValue(row))
      .filter((key) => key !== undefined && key !== null);
  }

  function isSelected(row) {
    const key = getRowKeyValue(row);
    return selectedRows.value.includes(key);
  }

  const selectedCount = computed(() => selectedRows.value.length);

  return {
    selectedRows,
    selectedCount,
    toggleSelect,
    clearSelection,
    selectAll,
    isSelected,
  };
}
