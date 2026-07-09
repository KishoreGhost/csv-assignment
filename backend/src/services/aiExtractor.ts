import Groq from 'groq-sdk';
import { buildExtractionPrompt } from '../prompts/extraction';
import { CrmRecord, RawCsvRow, SkippedRecord } from '../types';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);

// Best Groq model for structured JSON extraction — fast and highly capable
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Extracts CRM records from raw CSV rows using Groq AI (Llama 3.3 70B).
 * Processes records in batches with retry logic and exponential backoff.
 */
export async function extractCrmRecords(
  headers: string[],
  rows: RawCsvRow[],
  onProgress?: (processed: number, total: number, batch: number, totalBatches: number) => void
): Promise<{ records: CrmRecord[]; skipped: SkippedRecord[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please set it in your .env file.');
  }

  const groq = new Groq({ apiKey });

  const allRecords: CrmRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  // Split rows into batches
  const batches: RawCsvRow[][] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${rows.length} rows in ${batches.length} batches of ${BATCH_SIZE} using ${GROQ_MODEL}`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchStartRow = batchIndex * BATCH_SIZE;

    console.log(`Batch ${batchIndex + 1}/${batches.length} — rows ${batchStartRow + 1}-${batchStartRow + batch.length}`);

    let extracted: CrmRecord[] = [];
    let lastError: Error | null = null;

    // Retry with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Retry ${attempt}/${MAX_RETRIES - 1} for batch ${batchIndex + 1}, waiting ${delay}ms...`);
          await sleep(delay);
        }

        const prompt = buildExtractionPrompt(headers, batch);

        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert CRM data extraction engine. You ONLY output valid JSON arrays. Never add explanations, markdown, or code fences. Output raw JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,       // deterministic extraction
          max_tokens: 4096,
          response_format: { type: 'json_object' }, // enforce JSON output
        });

        const responseText = completion.choices[0]?.message?.content || '[]';
        extracted = parseAiResponse(responseText);
        lastError = null;
        break; // success
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Batch ${batchIndex + 1} attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    if (lastError) {
      console.error(`Batch ${batchIndex + 1} failed after ${MAX_RETRIES} attempts. Aborting.`);
      
      let friendlyMessage = `Batch ${batchIndex + 1} failed: ${lastError.message}`;
      
      // Parse Groq API Error Status/Message
      const status = (lastError as any).status || (lastError as any).statusCode;
      const errorMsg = lastError.message.toLowerCase();
      
      const isRateLimit = 
        status === 429 || 
        errorMsg.includes('rate limit') || 
        errorMsg.includes('429') || 
        errorMsg.includes('too many requests') ||
        errorMsg.includes('rate_limit');
        
      const isAuthError =
        status === 401 ||
        status === 403 ||
        errorMsg.includes('api key') ||
        errorMsg.includes('unauthorized') ||
        errorMsg.includes('401') ||
        errorMsg.includes('auth');

      if (isRateLimit) {
        friendlyMessage = `Groq API Rate Limit Exceeded (429). The server is receiving too many requests. Please wait a few moments before trying again, or reduce your CSV batch size.`;
      } else if (isAuthError) {
        friendlyMessage = `Invalid or missing Groq API Key (401/403). Please verify the GROQ_API_KEY value in the backend configuration (.env).`;
      } else if (status === 400 || errorMsg.includes('context') || errorMsg.includes('limit')) {
        friendlyMessage = `API request failed (400 Bad Request): ${lastError.message}. The data size may exceed context limits.`;
      }
      
      throw new Error(friendlyMessage);
    } else {
      // Validate each extracted record
      for (let i = 0; i < extracted.length; i++) {
        const record = extracted[i];
        const hasEmail = !!(record.email?.trim());
        const hasPhone = !!(record.mobile_without_country_code?.trim());

        if (!hasEmail && !hasPhone) {
          allSkipped.push({
            rowIndex: batchStartRow + i + 2,
            rawData: batch[i] || {},
            reason: 'No email or mobile number found',
          });
        } else {
          allRecords.push(record);
        }
      }
    }

    const processed = Math.min((batchIndex + 1) * BATCH_SIZE, rows.length);
    onProgress?.(processed, rows.length, batchIndex + 1, batches.length);
  }

  return { records: allRecords, skipped: allSkipped };
}

/** Parse the AI's JSON response into CRM records */
function parseAiResponse(responseText: string): CrmRecord[] {
  // Strip markdown fences if present (defensive)
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  // Groq with json_object mode may wrap in { records: [...] } or return array directly
  if (Array.isArray(parsed)) {
    return parsed as CrmRecord[];
  }
  if (parsed && Array.isArray(parsed.records)) {
    return parsed.records as CrmRecord[];
  }

  throw new Error(`Unexpected AI response shape: ${JSON.stringify(parsed).slice(0, 200)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
