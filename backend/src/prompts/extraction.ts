import { CrmRecord, CrmStatus, DataSource } from '../types';

/** The AI prompt template for extracting CRM records from CSV rows */
export function buildExtractionPrompt(
  headers: string[],
  rows: Record<string, string>[]
): string {
  const ALLOWED_CRM_STATUS: CrmStatus[] = [
    'GOOD_LEAD_FOLLOW_UP',
    'DID_NOT_CONNECT',
    'BAD_LEAD',
    'SALE_DONE',
  ];

  const ALLOWED_DATA_SOURCE: DataSource[] = [
    'leads_on_demand',
    'meridian_tower',
    'eden_park',
    'varah_swamy',
    'sarjapur_plots',
  ];

  return `You are an expert CRM data extraction system for GrowEasy, a real estate CRM platform.

## Your Task
Extract structured CRM lead records from the provided CSV data. The CSV may have ANY column names — your job is to intelligently map them to the GrowEasy CRM fields regardless of naming conventions, language, or structure.

## CSV Column Headers Present
${JSON.stringify(headers)}

## CRM Fields to Extract

| Field | Type | Description |
|-------|------|-------------|
| created_at | string | Lead creation date. Must be parseable by JavaScript \`new Date()\`. Convert any date format you find. Leave blank if none found. |
| name | string | Full name of the lead. May be split across first_name/last_name columns. |
| email | string | Primary email address only. |
| country_code | string | Phone country code like +91, +1, etc. |
| mobile_without_country_code | string | Mobile number WITHOUT country code prefix. Digits only. |
| company | string | Company or organization name. |
| city | string | City of the lead. |
| state | string | State or province. |
| country | string | Country name. |
| lead_owner | string | The email or name of the person who owns this lead. |
| crm_status | enum | Lead status. MUST be one of: ${ALLOWED_CRM_STATUS.join(', ')}. Map intelligently: "interested" → GOOD_LEAD_FOLLOW_UP, "no answer" → DID_NOT_CONNECT, "not interested" → BAD_LEAD, "closed" → SALE_DONE. Leave blank if truly ambiguous. |
| crm_note | string | Use for: remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, any useful info that doesn't fit other fields. |
| data_source | enum | Source of the lead. MUST be one of: ${ALLOWED_DATA_SOURCE.join(', ')}. Only use if you can confidently identify the source. Leave blank otherwise. |
| possession_time | string | Property possession time (real estate specific). |
| description | string | Additional description or information about the lead. |

## Rules

1. **Skip a record entirely** if it has neither an email address nor a mobile number. Do not include it in the output at all.

2. **Multiple emails**: Use the first as \`email\`, append the rest to \`crm_note\` with label "Additional emails:".

3. **Multiple phone numbers**: Use the first as \`mobile_without_country_code\`, append the rest to \`crm_note\` with label "Additional phones:".

4. **Phone number handling**: Strip the country code from the mobile number. If you find "+91 9876543210", put "+91" in \`country_code\` and "9876543210" in \`mobile_without_country_code\`.

5. **Date format**: Convert all dates to ISO format like "2026-05-13 14:20:48" that JavaScript's \`new Date()\` can parse.

6. **Intelligent mapping**: Map columns like "phone", "cell", "contact_number", "tel" → mobile. "fname"+"lname" → name. "organisation" → company. "remarks" → crm_note. Use context clues.

7. **Return only valid JSON**: No markdown, no explanation, just the JSON array.

## Input CSV Rows (${rows.length} records)
${JSON.stringify(rows, null, 2)}

## Output Format
Return a JSON object with a "records" key containing an array of extracted CRM records.
Only include fields that have actual values — omit empty fields entirely.

Example:
{
  "records": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "mobile_without_country_code": "9876543210",
      "country_code": "+91",
      "city": "Mumbai",
      "crm_status": "GOOD_LEAD_FOLLOW_UP"
    }
  ]
}

Return ONLY the JSON object, no explanations, no markdown.`;
}
