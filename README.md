# GrowEasy AI-Powered CSV Importer

An intelligent CSV import tool that uses AI to extract CRM lead information from any CSV format and maps it to GrowEasy CRM fields.

**Live Demo:** [Add your hosted URL here]  
**GitHub:** [Add your GitHub repo URL here]

---

## Features

- **AI-Powered Field Mapping** — Upload any CSV (Facebook Leads, Google Ads, Excel, Real Estate CRM, custom spreadsheets) and our AI intelligently maps columns to CRM fields
- **4-Step Wizard Flow** — Upload → Preview → AI Processing → Results
- **Drag & Drop Upload** — Intuitive file upload with visual feedback
- **CSV Preview** — Virtualized table handles large files (1000+ rows) smoothly
- **Batch Processing** — Processes records in batches of 20 with retry logic
- **Progress Visualization** — Animated processing view with real-time progress
- **Results Export** — Download imported records as CSV
- **Skipped Records** — Shows which records were skipped and why
- **Dark Mode Design** — Premium dark UI with smooth animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + TypeScript |
| Backend | Node.js + Express + TypeScript |
| AI | Groq (Llama 3.3 70B) |
| CSV Parsing (client) | PapaParse |
| CSV Parsing (server) | csv-parse |
| Virtualization | @tanstack/react-virtual |

---

## Project Structure

```
csv-assignment/
├── frontend/          # Next.js application
│   ├── app/           # App router (layout, page, CSS)
│   ├── components/    # React components
│   ├── lib/           # API client
│   └── types/         # TypeScript types
├── backend/           # Express API server
│   └── src/
│       ├── routes/    # API routes
│       ├── services/  # CSV parser + AI extractor
│       ├── prompts/   # AI prompt engineering
│       └── types/     # TypeScript types
├── sample-test.csv    # Sample CSV for testing
└── requirements.md    # Original requirements
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A Groq API key ([Get one free at console.groq.com](https://console.groq.com))

> [!WARNING]
> **Free API Key Limitations (Rate Limiting)**:
> This application is configured to use the Groq API. Free-tier Groq API keys have strict rate limits (Requests Per Minute and Tokens Per Minute).
> - Uploading very large CSV files or making rapid successive requests may cause the API to trigger `429 Too Many Requests` (Rate Limit Exceeded) errors.
> - The backend includes built-in batching (default size: 20 rows) and exponential backoff retry logic (default: 3 retries) to mitigate this.
> - You can fine-tune these settings (`BATCH_SIZE` and `MAX_RETRIES`) in `backend/.env` or upgrade your Groq API plan if you need to process large datasets.

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd csv-assignment
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start development server
npm run dev
```

The backend will run at `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# The .env.local is pre-configured to point to localhost:3001
# No changes needed for local development

# Start development server
npm run dev
```

The frontend will run at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | **Required** |
| `GROQ_MODEL` | Groq model to use | `llama-3.3-70b-versatile` |
| `PORT` | Backend server port | `3001` |
| `BATCH_SIZE` | Records per AI batch | `20` |
| `MAX_RETRIES` | Max retries per failed batch | `3` |
| `NODE_ENV` | Environment | `development` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

---

## API Reference

### `POST /api/import`

Upload a CSV file for AI processing.

**Request:** `multipart/form-data` with field `file` (CSV file, max 50MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "mobile_without_country_code": "9876543210",
        "country_code": "+91",
        "city": "Mumbai",
        "crm_status": "GOOD_LEAD_FOLLOW_UP"
      }
    ],
    "skipped": [
      {
        "rowIndex": 6,
        "rawData": { "Name": "Anonymous User" },
        "reason": "No email or mobile number found"
      }
    ],
    "totalProcessed": 8,
    "totalImported": 7,
    "totalSkipped": 1
  }
}
```

### `GET /health`

Health check endpoint.

---

## CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Lead's full name |
| `email` | Primary email address |
| `country_code` | Phone country code (e.g., +91) |
| `mobile_without_country_code` | Mobile number without country code |
| `company` | Company name |
| `city` | City |
| `state` | State/Province |
| `country` | Country |
| `lead_owner` | Lead owner email/name |
| `crm_status` | One of: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | Notes, remarks, extra contacts |
| `data_source` | One of: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |
| `possession_time` | Property possession time |
| `description` | Additional description |

---

## Testing

A `sample-test.csv` is included at the project root. It contains:
- Rows with different column naming conventions
- Split first/last name columns
- Multiple phone number formats (+91-xxx, 91 xxx, +91xxx)
- Multiple emails in one row
- A row with neither email nor phone (will be skipped)
- A row with only email (no phone)

---

## AI Prompt Engineering

The extraction prompt (`backend/src/prompts/extraction.ts`):
- Provides the full CRM schema with descriptions
- Lists allowed enum values for `crm_status` and `data_source`
- Instructs intelligent column mapping regardless of naming
- Handles edge cases: split names, multiple emails/phones, various date formats
- Uses temperature `0.1` for deterministic, consistent extraction
- Returns `application/json` MIME type for clean parsing

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variable in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your backend URL

### Backend → Render / Railway

1. Connect your GitHub repo to Render/Railway
2. Set root directory to `backend/`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variable: `GROQ_API_KEY`

---

## Position Applied For

**Software Developer Intern**

---

*Built with Next.js, Express, and Groq (Llama 3.3 70B)*
