import { parse } from 'csv-parse/sync';
import { RawCsvRow } from '../types';

export interface ParsedCsv {
  headers: string[];
  rows: RawCsvRow[];
}

/**
 * Parses a CSV buffer into headers and row objects.
 * Handles common CSV quirks: BOM, varying delimiters, quoted fields.
 */
export function parseCsv(buffer: Buffer): ParsedCsv {
  // Remove BOM if present
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as RawCsvRow[];

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(records[0]);
  return { headers, rows: records };
}
