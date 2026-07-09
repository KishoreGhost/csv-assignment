import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCsv } from '../services/csvParser';
import { extractCrmRecords } from '../services/aiExtractor';
import { ImportResponse } from '../types';

const router = Router();

// Configure multer for in-memory CSV file uploads (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  },
});

/**
 * POST /api/import
 * Accepts a CSV file, parses it, runs AI extraction, and returns structured CRM records.
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded. Please send a CSV file in the "file" field.' });
      return;
    }

    // Step 1: Parse CSV
    console.log(`Parsing CSV file: ${req.file.originalname} (${req.file.size} bytes)`);
    const { headers, rows } = parseCsv(req.file.buffer);

    if (rows.length === 0) {
      res.status(400).json({ success: false, error: 'The CSV file is empty or has no data rows.' });
      return;
    }

    console.log(`Parsed ${rows.length} rows with ${headers.length} columns`);

    // Step 2: AI Extraction with batching
    const { records, skipped } = await extractCrmRecords(headers, rows, (processed, total, batch, totalBatches) => {
      console.log(`Progress: ${processed}/${total} records (batch ${batch}/${totalBatches})`);
    });

    // Step 3: Return response
    const response: ImportResponse = {
      success: true,
      data: {
        records,
        skipped,
        totalProcessed: rows.length,
        totalImported: records.length,
        totalSkipped: skipped.length,
      },
    };

    console.log(`Import complete: ${records.length} imported, ${skipped.length} skipped`);
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Import error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
