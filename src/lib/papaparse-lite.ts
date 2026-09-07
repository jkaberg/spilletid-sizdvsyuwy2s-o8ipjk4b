/**
 * Lightweight CSV unparse utility to replace PapaParse's unparse for preview builds.
 *
 * - Exports a default object with `unparse(data, opts?)` where:
 *   - data: array of objects (preferred) or array of arrays (fallback)
 *   - opts: { header?: boolean } (default header: true for object-array)
 *
 * Behavior:
 * - For array of objects: header row is built from the first object's keys (preserving order),
 *   then any additional keys encountered in subsequent objects are appended in encounter order.
 * - Values are escaped according to CSV rules: double quotes are doubled and fields containing
 *   commas, quotes, newlines or leading/trailing spaces are wrapped in quotes.
 * - Returns a string with '\n' line endings.
 *
 * Note: This implementation intentionally keeps dependencies to a minimum and is safe for
 * browser/worker environments.
 */
export type UnparseOpts = { header?: boolean };
export interface PapaLite {
  unparse: (data: any[], opts?: UnparseOpts) => string;
}
function isArrayOfArrays(data: any[]): data is any[][] {
  return Array.isArray(data) && data.every((r) => Array.isArray(r));
}
function needsQuoting(s: string): boolean {
  if (s.length === 0) return false;
  // If contains comma, quote, newline, carriage return, or leading/trailing spaces -> quote
  return /[,"\n\r]/.test(s) || /^\s|\s$/.test(s);
}
function quoteField(fieldStr: string): string {
  // Escape double quotes by doubling them
  const escaped = fieldStr.replace(/"/g, '""');
  return `"${escaped}"`;
}
/**
 * Serialize a single value into a CSV-safe cell string.
 */
function serializeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  // For objects/arrays, JSON.stringify gives a reasonable representation
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);
      return needsQuoting(json) ? quoteField(json) : json;
    } catch {
      const fallback = String(value);
      return needsQuoting(fallback) ? quoteField(fallback) : fallback;
    }
  }
  const s = String(value);
  return needsQuoting(s) ? quoteField(s) : s;
}
/**
 * Build header row preserving key order of first object, and appending new keys encountered later.
 */
function buildHeadersFromObjects(rows: Record<string, any>[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      for (const k of Object.keys(row)) {
        if (!seen.has(k)) {
          seen.add(k);
          keys.push(k);
        }
      }
    }
  }
  return keys;
}
const PapaLiteImpl: PapaLite = {
  /**
   * Convert an array of objects (preferred) or array of arrays to CSV string.
   *
   * @param data - array of objects or array of arrays
   * @param opts - options { header?: boolean } - for object arrays defaults to true
   * @returns CSV string
   */
  unparse(data: any[], opts: UnparseOpts = { header: true }): string {
    if (!Array.isArray(data)) {
      throw new TypeError('unparse expects an array as the first argument');
    }
    // Empty dataset
    if (data.length === 0) return '';
    // If array of arrays -> simple serialization
    if (isArrayOfArrays(data)) {
      const lines = data.map((row) => {
        return row.map((cell) => serializeCell(cell)).join(',');
      });
      return lines.join('\n');
    }
    // If array of primitives (numbers/strings), treat each as single-column row
    if (data.every((r) => typeof r !== 'object' || r === null)) {
      return data.map((r) => serializeCell(r)).join('\n');
    }
    // Otherwise treat as array of objects
    const rows = data as Record<string, any>[];
    const includeHeader = opts.header !== false;
    const headers = buildHeadersFromObjects(rows);
    const lines: string[] = [];
    if (includeHeader && headers.length > 0) {
      lines.push(headers.map((h) => serializeCell(h)).join(','));
    }
    for (const row of rows) {
      // For rows that are not objects (defensive), convert to empty-object
      const r = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
      const cells = headers.map((key) => serializeCell((r as Record<string, any>)[key]));
      lines.push(cells.join(','));
    }
    return lines.join('\n');
  },
};
export default PapaLiteImpl;