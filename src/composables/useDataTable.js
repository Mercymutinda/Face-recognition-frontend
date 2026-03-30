import { computed, ref } from "vue";

export function useDataTable(options = {}) {
  const {
    initialPage = 1,
    initialPerPage = null, // null = let the backend decide the default
    perPageOptions = [10, 25, 50, 100],
    initialSortBy = null,
    initialSortDir = "asc",
    searchDebounceMs = 300,
  } = options;

  const searchQuery = ref("");
  const currentPage = ref(initialPage);
  const perPage = ref(initialPerPage);
  const sortBy = ref(initialSortBy);
  const sortDir = ref(initialSortDir);
  const totalCount = ref(0);
  const totalPages = ref(1);
  const perPageDirty = ref(false); // true once the user explicitly changes per-page
  let searchTimer = null;

  // Ensure the backend-returned perPage value appears in the dropdown
  const normalizedPerPageOptions = computed(() => {
    const opts = perPageOptions.filter((value) => Number(value) > 0);
    if (perPage.value && !opts.includes(perPage.value)) {
      opts.push(perPage.value);
      opts.sort((a, b) => a - b);
    }
    return opts;
  });

  function setSearch(query) {
    searchQuery.value = query ?? "";
    currentPage.value = 1;
  }

  function setPage(page) {
    const numericPage = Number(page);
    currentPage.value = numericPage > 0 ? numericPage : 1;
  }

  function setPerPage(value) {
    const numericPerPage = Number(value);
    perPage.value = numericPerPage > 0 ? numericPerPage : initialPerPage;
    perPageDirty.value = true;
    currentPage.value = 1;
  }

  function setSort(field) {
    if (!field) return;

    if (sortBy.value === field) {
      sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
      sortBy.value = field;
      sortDir.value = "asc";
    }

    currentPage.value = 1;
  }

  function setSearchDebounced(query, callback) {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(async () => {
      setSearch(query);
      if (typeof callback === "function") {
        await callback();
      }
    }, searchDebounceMs);
  }

  /**
   * Sync pagination state from an API response payload.
   * Expects the shape: { totalCount, totalPages, currentPage, perPage }
   */
  function syncFromResponse(payload) {
    if (!payload) return;

    totalCount.value = payload.totalCount ?? totalCount.value;
    totalPages.value = payload.totalPages ?? totalPages.value;
    currentPage.value = payload.currentPage ?? currentPage.value;

    // Adopt the backend's perPage on the first load (or whenever the user
    // hasn't explicitly changed it) so the dropdown reflects the real value.
    if (!perPageDirty.value && payload.perPage) {
      perPage.value = payload.perPage;
    }
  }

  /**
   * Build query params for the API request.
   * `per-page` is only included when the user has explicitly changed it,
   * otherwise the backend's default is used.
   */
  function buildQueryParams(extra = {}) {
    const params = {
      page: currentPage.value,
    };

    if (perPageDirty.value && perPage.value != null) {
      params["per-page"] = perPage.value;
    }

    if (sortBy.value) {
      params.sort = sortDir.value === "desc" ? `-${sortBy.value}` : sortBy.value;
    }

    if (searchQuery.value) {
      params.q = searchQuery.value;
    }

    return { ...params, ...extra };
  }

  return {
    searchQuery,
    currentPage,
    perPage,
    sortBy,
    sortDir,
    totalCount,
    totalPages,
    perPageDirty,
    perPageOptions: normalizedPerPageOptions,
    setSearch,
    setSearchDebounced,
    setPage,
    setPerPage,
    setSort,
    syncFromResponse,
    buildQueryParams,
  };
}
