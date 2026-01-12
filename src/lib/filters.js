import Fuse from 'fuse.js';

/**
 * Filter and search utilities
 */

/**
 * Filter configuration
 */
export const FILTER_DEFAULTS = {
  pipelineStep: null,
  modalities: [],
  tasks: [],
  evidenceTypes: [],
  maturityLevels: [],
  yearRange: { min: null, max: null },
  searchQuery: '',
};

/**
 * Creates a Fuse.js search instance
 * @param {Array} methods - The methods array
 * @returns {Fuse} Fuse instance
 */
export function createSearchIndex(methods) {
  return new Fuse(methods, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'short_description', weight: 0.2 },
      { name: 'tags', weight: 0.2 },
      { name: 'algorithm_summary', weight: 0.1 },
      { name: 'references.paper_title', weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
}

/**
 * Performs fuzzy search on methods
 * @param {Fuse} searchIndex - The Fuse search index
 * @param {string} query - Search query
 * @returns {Array} Matching methods with scores
 */
export function searchMethods(searchIndex, query) {
  if (!query || query.trim().length < 2) {
    return null; // Return null to indicate no search filter applied
  }

  const results = searchIndex.search(query.trim());
  return results.map((result) => ({
    ...result.item,
    searchScore: result.score,
    searchMatches: result.matches,
  }));
}

/**
 * Filters methods based on filter criteria
 * @param {Array} methods - All methods
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered methods
 */
export function filterMethods(methods, filters) {
  const {
    pipelineStep,
    modalities,
    tasks,
    evidenceTypes,
    maturityLevels,
    yearRange,
  } = filters;

  return methods.filter((method) => {
    // Pipeline step filter
    if (pipelineStep && method.pipeline_step !== pipelineStep) {
      return false;
    }

    // Modalities filter (OR logic - method must have at least one selected modality)
    if (modalities && modalities.length > 0) {
      const hasModality = method.modalities?.some((m) => modalities.includes(m));
      if (!hasModality) return false;
    }

    // Tasks filter (OR logic)
    if (tasks && tasks.length > 0) {
      const hasTask = method.tasks?.some((t) => tasks.includes(t));
      if (!hasTask) return false;
    }

    // Evidence type filter
    if (evidenceTypes && evidenceTypes.length > 0) {
      if (!evidenceTypes.includes(method.evidence_type)) {
        return false;
      }
    }

    // Maturity level filter
    if (maturityLevels && maturityLevels.length > 0) {
      if (!maturityLevels.includes(method.maturity)) {
        return false;
      }
    }

    // Year range filter
    if (yearRange) {
      const year = method.references?.year;
      if (yearRange.min && year < yearRange.min) return false;
      if (yearRange.max && year > yearRange.max) return false;
    }

    return true;
  });
}

/**
 * Combines search and filter operations
 * @param {Array} methods - All methods
 * @param {Fuse} searchIndex - Search index
 * @param {Object} filters - Filter criteria including searchQuery
 * @returns {Array} Filtered and searched methods
 */
export function applyFiltersAndSearch(methods, searchIndex, filters) {
  let result = methods;

  // Apply search first if query exists
  if (filters.searchQuery && filters.searchQuery.trim().length >= 2) {
    const searchResults = searchMethods(searchIndex, filters.searchQuery);
    if (searchResults) {
      result = searchResults;
    }
  }

  // Apply other filters
  result = filterMethods(result, filters);

  return result;
}

/**
 * Gets unique filter values from methods
 * @param {Array} methods - All methods
 * @returns {Object} Available filter values
 */
export function getFilterOptions(methods) {
  const modalities = new Set();
  const tasks = new Set();
  const evidenceTypes = new Set();
  const maturityLevels = new Set();
  const years = new Set();

  methods.forEach((method) => {
    method.modalities?.forEach((m) => modalities.add(m));
    method.tasks?.forEach((t) => tasks.add(t));
    if (method.evidence_type) evidenceTypes.add(method.evidence_type);
    if (method.maturity) maturityLevels.add(method.maturity);
    if (method.references?.year) years.add(method.references.year);
  });

  const yearsArray = Array.from(years).sort((a, b) => a - b);

  return {
    modalities: Array.from(modalities).sort(),
    tasks: Array.from(tasks).sort(),
    evidenceTypes: Array.from(evidenceTypes).sort(),
    maturityLevels: ['research', 'emerging', 'established', 'mature'].filter((m) =>
      maturityLevels.has(m)
    ),
    yearRange: {
      min: yearsArray[0] || 2010,
      max: yearsArray[yearsArray.length - 1] || 2026,
    },
  };
}

/**
 * Sorts methods by various criteria
 * @param {Array} methods - Methods to sort
 * @param {string} sortBy - Sort criterion
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted methods
 */
export function sortMethods(methods, sortBy = 'name', order = 'asc') {
  const sorted = [...methods];

  const maturityOrder = { research: 0, emerging: 1, established: 2, mature: 3 };

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'year':
        comparison = (a.references?.year || 0) - (b.references?.year || 0);
        break;
      case 'maturity':
        comparison =
          (maturityOrder[a.maturity] || 0) - (maturityOrder[b.maturity] || 0);
        break;
      case 'pipeline_step':
        comparison = a.pipeline_step.localeCompare(b.pipeline_step);
        break;
      case 'searchScore':
        comparison = (a.searchScore || 1) - (b.searchScore || 1);
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Gets counts per pipeline step
 * @param {Array} methods - Methods array
 * @returns {Object} Counts by step
 */
export function getStepCounts(methods) {
  const counts = {};
  methods.forEach((method) => {
    counts[method.pipeline_step] = (counts[method.pipeline_step] || 0) + 1;
  });
  return counts;
}
