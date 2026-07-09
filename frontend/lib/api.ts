import { ImportResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Uploads a CSV file to the backend for AI processing.
 */
export async function importCsv(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Server error: ${response.status}`;
    try {
      const err = await response.json();
      errorMsg = err.error || errorMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  const data: ImportResponse = await response.json();
  return data;
}
