import Fuse from 'fuse.js';

/**
 * Data loading utilities
 */

// Base path for assets (matches Vite config)
const BASE_PATH = import.meta.env.BASE_URL || '/';

let cachedData = null;

/**
 * Loads methods data from the JSON file
 * @returns {Promise<Object>} The methods data
 */
export async function loadMethodsData() {
  if (cachedData) return cachedData;

  try {
    const response = await fetch(`${BASE_PATH}data/methods.json`);
    if (!response.ok) {
      throw new Error(`Failed to load methods data: ${response.status}`);
    }
    const data = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error('Error loading methods data:', error);
    throw error;
  }
}

/**
 * Validates methods data against basic schema requirements
 * @param {Object} data - The data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateMethodsData(data) {
  const errors = [];

  if (!data.metadata) {
    errors.push('Missing metadata object');
  }

  if (!data.pipeline_steps || !Array.isArray(data.pipeline_steps)) {
    errors.push('Missing or invalid pipeline_steps array');
  }

  if (!data.methods || !Array.isArray(data.methods)) {
    errors.push('Missing or invalid methods array');
  }

  // Validate each method
  const requiredFields = [
    'id',
    'name',
    'pipeline_step',
    'short_description',
    'algorithm_summary',
    'inputs',
    'outputs',
    'modalities',
    'tasks',
    'assumptions',
    'limitations',
    'references',
    'tags',
    'created_at',
    'updated_at',
  ];

  const validPipelineSteps = [
    'collect',
    'preprocess',
    'abstract_aggregate',
    'correlate_cases',
    'enhance_visualization',
    'apply_mining',
  ];

  const validModalities = ['text', 'image', 'video', 'audio', 'sensor', 'mixed'];

  const validTasks = [
    'cleaning',
    'chunking',
    'fusion',
    'abstraction',
    'correlation',
    'uncertainty',
    'visualization',
    'discovery',
    'conformance',
    'prediction',
  ];

  data.methods?.forEach((method, index) => {
    requiredFields.forEach((field) => {
      if (method[field] === undefined) {
        errors.push(`Method ${index} (${method.id || 'unknown'}): missing required field "${field}"`);
      }
    });

    if (method.pipeline_step && !validPipelineSteps.includes(method.pipeline_step)) {
      errors.push(`Method ${method.id}: invalid pipeline_step "${method.pipeline_step}"`);
    }

    method.modalities?.forEach((mod) => {
      if (!validModalities.includes(mod)) {
        errors.push(`Method ${method.id}: invalid modality "${mod}"`);
      }
    });

    method.tasks?.forEach((task) => {
      if (!validTasks.includes(task)) {
        errors.push(`Method ${method.id}: invalid task "${task}"`);
      }
    });

    // Check for duplicate IDs
    const duplicates = data.methods.filter((m) => m.id === method.id);
    if (duplicates.length > 1) {
      errors.push(`Duplicate method ID: ${method.id}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets method by ID
 * @param {Object} data - The methods data
 * @param {string} id - Method ID
 * @returns {Object|null} The method or null
 */
export function getMethodById(data, id) {
  return data.methods?.find((m) => m.id === id) || null;
}

/**
 * Gets pipeline step by ID
 * @param {Object} data - The methods data
 * @param {string} id - Step ID
 * @returns {Object|null} The step or null
 */
export function getPipelineStepById(data, id) {
  return data.pipeline_steps?.find((s) => s.id === id) || null;
}

/**
 * Gets related methods for a given method
 * @param {Object} data - The methods data
 * @param {string} methodId - The method ID
 * @returns {Array} Related methods
 */
export function getRelatedMethods(data, methodId) {
  const method = getMethodById(data, methodId);
  if (!method) return [];

  const related = [];

  // Add explicitly linked methods
  if (method.related_method_ids) {
    method.related_method_ids.forEach((id) => {
      const relatedMethod = getMethodById(data, id);
      if (relatedMethod) {
        related.push({ ...relatedMethod, relationship: 'linked' });
      }
    });
  }

  // Add methods in same pipeline step
  data.methods
    .filter((m) => m.id !== methodId && m.pipeline_step === method.pipeline_step)
    .slice(0, 3)
    .forEach((m) => {
      if (!related.find((r) => r.id === m.id)) {
        related.push({ ...m, relationship: 'same-step' });
      }
    });

  // Add methods with shared tags
  const methodTags = new Set(method.tags || []);
  data.methods
    .filter((m) => m.id !== methodId)
    .map((m) => ({
      ...m,
      sharedTags: (m.tags || []).filter((t) => methodTags.has(t)).length,
    }))
    .filter((m) => m.sharedTags > 0)
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, 3)
    .forEach((m) => {
      if (!related.find((r) => r.id === m.id)) {
        related.push({ ...m, relationship: 'shared-tags' });
      }
    });

  return related.slice(0, 6);
}

/**
 * Creates aggregated statistics from data
 * @param {Object} data - The methods data
 * @returns {Object} Statistics object
 */
export function getStatistics(data) {
  const methods = data.methods || [];

  const stepCounts = {};
  const modalityCounts = {};
  const taskCounts = {};
  const maturityCounts = {};
  const yearCounts = {};

  methods.forEach((method) => {
    // Steps
    stepCounts[method.pipeline_step] = (stepCounts[method.pipeline_step] || 0) + 1;

    // Modalities
    method.modalities?.forEach((mod) => {
      modalityCounts[mod] = (modalityCounts[mod] || 0) + 1;
    });

    // Tasks
    method.tasks?.forEach((task) => {
      taskCounts[task] = (taskCounts[task] || 0) + 1;
    });

    // Maturity
    if (method.maturity) {
      maturityCounts[method.maturity] = (maturityCounts[method.maturity] || 0) + 1;
    }

    // Years
    const year = method.references?.year;
    if (year) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });

  return {
    totalMethods: methods.length,
    stepCounts,
    modalityCounts,
    taskCounts,
    maturityCounts,
    yearCounts,
  };
}
