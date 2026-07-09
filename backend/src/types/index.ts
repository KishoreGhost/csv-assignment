// Shared types for the GrowEasy CSV Importer

/** Allowed CRM status values */
export type CrmStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

/** Allowed data source values */
export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

/** A GrowEasy CRM record */
export interface CrmRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus;
  crm_note?: string;
  data_source?: DataSource;
  possession_time?: string;
  description?: string;
}

/** A skipped record with reason */
export interface SkippedRecord {
  rowIndex: number;
  rawData: Record<string, string>;
  reason: string;
}

/** API response from POST /api/import */
export interface ImportResponse {
  success: boolean;
  data: {
    records: CrmRecord[];
    skipped: SkippedRecord[];
    totalProcessed: number;
    totalImported: number;
    totalSkipped: number;
  };
  error?: string;
}

/** Raw parsed CSV row */
export type RawCsvRow = Record<string, string>;
