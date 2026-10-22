# AICTE SmartVerify — AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification

> **SIH Problem Statement 26261**  
> **All India Council for Technical Education (AICTE) — Ministry of Education, Government of India**

---

## 1. Executive Summary & Overview

**AICTE SmartVerify** is a production-grade, full-stack regulatory verification prototype designed to automate the scrutiny of higher technical educational institution approval applications (Extension of Approval, New Institutions, Increase in Intake).

### Key Architectural Highlights
- **10 Verification Factors**: Automated evaluation of completeness, format validity, DPI readability, entity consistency across deeds, expiry dates, SHA-256 duplicate detection, official seals/signatures, regulatory norms, and external authenticity status.
- **Strict Role-Based Access Control (RBAC)**: Institution User vs. Scrutiny Admin vs. Super Admin with PostgreSQL Row-Level Security (RLS).
- **Private Supabase Storage**: Documents stored privately in `application-documents` bucket; short-lived signed URLs generated on-demand for authorized previews.
- **Zero-Dependency Core Validation**: Client-side rule engine with instant recalculation on re-upload without requiring expensive external AI APIs.
- **Preloaded Synthetic Data**: 10 distinct demonstration cases representing every regulatory scenario, with watermarked SVG/PDF previews and deterministic error fixtures.
- **In-App Notifications Only**: Full system dispatch notifications with zero external email requirements.

---

## 2. Preloaded Synthetic Demo Applications (10 Cases)

All synthetic records, document previews, and seals are prominently watermarked:  
`SYNTHETIC DEMO DATA — NOT AN OFFICIAL DOCUMENT`

| Case # | Application Number | Scenario | Expected Automated Outcome | Status |
|:---:|:---|:---|:---:|:---|
| **1** | `AICTE/2026/APP-1001-PASS` | Complete Application with all 7 mandatory documents | **Passed** | Awaiting Official Review |
| **2** | `AICTE/2026/APP-1002-REVIEWED` | All checks pass with official review comments recorded | **Passed** | Review Completed |
| **3** | `AICTE/2026/APP-1003-MISSING-DOC` | Missing Fire Safety & Occupancy certificates | **Failed** | Action Required |
| **4** | `AICTE/2026/APP-1004-EXPIRED` | Fire Safety Certificate has past expiry date | **Failed** | Action Required |
| **5** | `AICTE/2026/APP-1005-NAME-MISMATCH` | Extracted name differs from institution profile | **Needs Review** | Needs Review |
| **6** | `AICTE/2026/APP-1006-CODE-MISMATCH` | Extracted code differs from permanent AICTE ID | **Needs Review** | Needs Review |
| **7** | `AICTE/2026/APP-1007-DUPLICATE` | Identical SHA-256 checksum across different slots | **Needs Review** | Needs Review |
| **8** | `AICTE/2026/APP-1008-LOW-QUALITY` | Blurred scan / low OCR confidence score (<60%) | **Needs Review** | Needs Review |
| **9** | `AICTE/2026/APP-1009-CORRUPT-FILE` | Corrupt PDF file byte stream with graceful error handling | **Failed** | Action Required |
| **10** | `AICTE/2026/APP-1010-AUTH-PENDING` | Consistency passes; external registry verification pending | **Needs Review** | Authenticity Confirmation Pending |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Standard CSS design system, React Router 6, Lucide React icons.
- **Backend**: Supabase Auth, PostgreSQL 15, Supabase Private Storage (`application-documents`), PostgreSQL Row Level Security (RLS).
- **Security**: PostgreSQL Security Definer RPCs, protected `user_roles` table, short-lived signed URLs (300s TTL).

---

## 4. Setup & Running Instructions

### Step 1: Environment Configuration
Copy `.env.example` to `.env` (already preconfigured with your Supabase credentials):

```bash
VITE_SUPABASE_URL=https://nyzhayxwntecvhpwiwwo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Security Note:** Never put the Supabase `service_role` key in frontend code, client requests, or `.env` files. Only the public anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) is used in the browser.

### Step 2: Database Setup & Migrations
In your Supabase project's **SQL Editor**, apply the migrations in sequence:

1. `supabase/migrations/20261022000001_initial_schema.sql` (Creates all 11 tables, constraints, indexes, and RLS policies).
2. `supabase/migrations/20261022000002_storage_setup.sql` (Configures the private `application-documents` bucket and storage policies).
3. `supabase/migrations/20261022000003_bootstrap_admin.sql` (Installs the secure Super Admin initialization procedure).
4. `supabase/migrations/20261022000004_seed_demo_data.sql` (Seeds the 10 synthetic applications and institutions idempotently).

### Step 3: Run the Application Locally
Run the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser.

To validate the build:
```bash
npm run build
```

---

## 5. Security & Role Management

### Role Hierarchy & Boundaries
1. **Institution User**:
   - Created automatically upon public registration.
   - Strictly restricted by PostgreSQL RLS to their own institution's applications.
   - Public registration **CANNOT** create an administrator account.
2. **Scrutiny Admin**:
   - Inspects applications across all institutions, views findings and evidence side-by-side, marks checks reviewed, requests corrections, and records decisions.
3. **Super Admin**:
   - Initial administrator authorized via `bootstrap_initial_super_admin` with secret token `AICTE_SUPER_ADMIN_INIT_SECURE_TOKEN_2026`.
   - Has exclusive privilege to authorize additional Scrutiny Admins.
   - All role modifications are recorded in `audit_logs`.

### Instant Role Switcher for Evaluators
A floating pill in the bottom-right corner of the interface allows evaluators to toggle instantaneously between:
- 🏫 **Institution User** (`registrar@niatr-demo.edu.in`)
- 🛡️ **Scrutiny Admin** (`scrutiny.officer@aicte-india.org`)
- 👑 **Super Admin** (`director.approval@aicte-india.org`)

---

## 6. Verification Factors Matrix

1. **Document Completeness**: Verifies all required certificates are uploaded for the selected application type.
2. **File Validity & Readability**: Checks mime-types, file sizes (max 15MB), readable PDF streams, and low-contrast scans.
3. **Required-Field Extraction**: Normalizes institution name, registration code, document numbers, and dates.
4. **Cross-Document Consistency**: Compares name and permanent institute ID across all deeds and certificates.
5. **Date & Validity Checks**: Validates active dates against academic year; detects expired fire safety certificates.
6. **Duplicate & Integrity Checks**: Computes SHA-256 hashes to detect identical files across distinct slots.
7. **Signatures & Seals**: Inspects presence of authority stamps; routes inconclusive items to human scrutiny.
8. **Regulatory Compliance**: Validates adherence to AICTE Approval Process Handbook (APH) 2026-2027 norms.
9. **Authenticity Confirmation**: Clearly tags unintegrated external registries as `Authenticity Confirmation Pending`.
10. **Human Review & Auditability**: Enables committee officers to review individual findings and record formal decisions.

---

## 7. External Configurations

No external paid APIs, AWS accounts, or email servers are required. Tesseract.js and browser rasterizers handle OCR and document rendering offline.
