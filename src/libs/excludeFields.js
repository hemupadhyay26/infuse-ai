/**
 * Removes specified fields from an object or array of objects.
 * @param {Object|Array} data - The object or array to process.
 * @param {string[]} fields - The fields to exclude.
 * @returns {Object|Array} - The processed object or array.
 */
export function excludeFields(data, fields = []) {
  if (Array.isArray(data)) {
    return data.map(item => excludeFields(item, fields));
  }
  if (data && typeof data === 'object') {
    const result = { ...data };
    for (const field of fields) {
      delete result[field];
    }
    return result;
  }
  return data;
}