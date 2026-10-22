// AICTE SmartVerify — 10 Preloaded Mandatory Synthetic Demo Applications
// SIH Problem Statement 26261
//
// NOTICE: ALL ENTITIES, IDENTIFIERS, CERTIFICATES, AND SEALS ARE 100% FICTIONAL 
// CREATED SOLELY FOR PROTOTYPE DEMONSTRATION PURPOSES.
// PROMINENT LABEL: SYNTHETIC DEMO DATA — NOT AN OFFICIAL DOCUMENT

import { Application, Institution } from '../types';

export const SYNTHETIC_BANNER_TEXT = 'SYNTHETIC DEMO DATA — NOT AN OFFICIAL DOCUMENT';

// Helper to generate a realistic fictional document preview SVG Data URI
export function generateSyntheticDocSvg(
  title: string,
  docNumber: string,
  institutionName: string,
  institutionCode: string,
  issueDate: string,
  expiryDate?: string,
  isBlurry: boolean = false,
  isCorrupt: boolean = false
): string {
  if (isCorrupt) {
    // Deterministic corrupt payload header
    return 'data:application/pdf;base64,JVBERi0xLjQKJUVPRl9DT1JSVVBURURfREFUQV9OT1RfQV9WQUxJRF9QREY=';
  }

  const blurFilter = isBlurry
    ? `<filter id="blur"><feGaussianBlur stdDeviation="2.5"/></filter>`
    : '';

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100" style="background:#ffffff; font-family:'Segoe UI', Inter, sans-serif;">
      <defs>
        ${blurFilter}
        <pattern id="diagonalHatch" width="40" height="40" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="40" stroke="#f1f5f9" stroke-width="2" />
        </pattern>
      </defs>

      <!-- Page border & subtle pattern -->
      <rect x="25" y="25" width="750" height="1050" fill="url(#diagonalHatch)" stroke="#cbd5e1" stroke-width="2" rx="4"/>
      <rect x="40" y="40" width="720" height="1020" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>

      <!-- Prominent Synthetic Watermark -->
      <g transform="translate(400, 550) rotate(-35)">
        <text text-anchor="middle" font-size="28" font-weight="700" fill="#ef4444" opacity="0.16" letter-spacing="4">
          SYNTHETIC DEMO DATA — NOT AN OFFICIAL DOCUMENT
        </text>
        <text y="40" text-anchor="middle" font-size="18" font-weight="600" fill="#64748b" opacity="0.16">
          SIH 2026 PROBLEM STATEMENT 26261
        </text>
      </g>

      <!-- Document Content Container -->
      <g ${isBlurry ? 'filter="url(#blur)"' : ''}>
        <!-- Header Strip -->
        <rect x="40" y="40" width="720" height="110" fill="#f8fafc" />
        <line x1="40" y1="150" x2="760" y2="150" stroke="#0284c7" stroke-width="3" />

        <text x="400" y="80" text-anchor="middle" font-size="15" font-weight="700" fill="#0f172a" letter-spacing="1">
          COMPETENT REGULATORY AUTHORITY (DEMONSTRATION RECORD)
        </text>
        <text x="400" y="105" text-anchor="middle" font-size="12" fill="#475569">
          Department of Technical Education &amp; Infrastructure Accreditation
        </text>
        <text x="400" y="125" text-anchor="middle" font-size="10" fill="#dc2626" font-weight="600">
          [SYNTHETIC TEST FIXTURE — FOR SYSTEM VALIDATION ONLY]
        </text>

        <!-- Document Title -->
        <rect x="180" y="175" width="440" height="42" fill="#f0f9ff" stroke="#bae6fd" rx="6" />
        <text x="400" y="202" text-anchor="middle" font-size="16" font-weight="700" fill="#0369a1">
          ${title.toUpperCase()}
        </text>

        <!-- Metadata Box -->
        <g transform="translate(70, 245)">
          <rect width="660" height="110" fill="#f8fafc" stroke="#e2e8f0" rx="6" />
          
          <text x="20" y="32" font-size="12" font-weight="600" fill="#475569">Certificate Ref No:</text>
          <text x="170" y="32" font-size="12" font-weight="700" fill="#0f172a">${docNumber}</text>

          <text x="420" y="32" font-size="12" font-weight="600" fill="#475569">Date of Issue:</text>
          <text x="520" y="32" font-size="12" font-weight="700" fill="#0f172a">${issueDate}</text>

          <text x="20" y="65" font-size="12" font-weight="600" fill="#475569">Permanent AICTE Code:</text>
          <text x="170" y="65" font-size="12" font-weight="700" fill="#0369a1">${institutionCode}</text>

          <text x="420" y="65" font-size="12" font-weight="600" fill="#475569">Regulatory Expiry:</text>
          <text x="520" y="65" font-size="12" font-weight="700" fill="${expiryDate && new Date(expiryDate) < new Date() ? '#dc2626' : '#0f172a'}">
            ${expiryDate || 'Permanent / Not Applicable'}
          </text>

          <text x="20" y="95" font-size="12" font-weight="600" fill="#475569">Issuing Directorate:</text>
          <text x="170" y="95" font-size="12" fill="#334155">Regional Statutory Inspection Wing</text>
        </g>

        <!-- Certification Body Text -->
        <g transform="translate(70, 390)">
          <text x="0" y="20" font-size="13" font-weight="600" fill="#1e293b">TO WHOMSOEVER IT MAY CONCERN</text>

          <text x="0" y="60" font-size="12" fill="#334155" line-height="1.6">
            This is to certify that the premises and documentary records of the technical educational institution:
          </text>

          <rect x="0" y="80" width="660" height="50" fill="#f1f5f9" stroke="#cbd5e1" rx="4" />
          <text x="20" y="110" font-size="14" font-weight="700" fill="#0f172a">${institutionName}</text>

          <text x="0" y="165" font-size="12" fill="#334155">
            have been duly evaluated in according with the requirements of the AICTE Approval Process Norms.
          </text>
          <text x="0" y="195" font-size="12" fill="#334155">
            Verification Scope: Physical infrastructure, structural stability, boundary demarcations, and safety clearances.
          </text>
          <text x="0" y="225" font-size="12" fill="#334155">
            The institution has produced supporting land deeds, municipal approvals, and compliance undertakings.
          </text>
          <text x="0" y="255" font-size="12" fill="#334155">
            Condition: Any alteration in built-up area or change of trustees requires fresh regulatory sanctions.
          </text>
        </g>

        <!-- Compliance Checklist -->
        <g transform="translate(70, 700)">
          <rect width="660" height="150" fill="#ffffff" stroke="#e2e8f0" rx="6" />
          <text x="20" y="30" font-size="12" font-weight="700" fill="#0f172a">STATUTORY VERIFICATION CHECKLIST</text>
          
          <circle cx="30" cy="60" r="6" fill="#10b981" />
          <text x="50" y="64" font-size="11" fill="#334155">Title deed / Lease deed registered in the name of the Trust / Society</text>

          <circle cx="30" cy="90" r="6" fill="#10b981" />
          <text x="50" y="94" font-size="11" fill="#334155">Building plans sanctioned by Competent Town Planning Authority</text>

          <circle cx="30" cy="120" r="6" fill="#10b981" />
          <text x="50" y="124" font-size="11" fill="#334155">Fire safety guidelines, water hydrants, and emergency exits validated</text>
        </g>

        <!-- Seals and Signatures Area -->
        <g transform="translate(70, 890)">
          <!-- Fictional Seal -->
          <g transform="translate(100, 60)">
            <circle cx="0" cy="0" r="48" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,2"/>
            <circle cx="0" cy="0" r="42" fill="#eff6ff" stroke="#2563eb" stroke-width="1"/>
            <text x="0" y="-14" text-anchor="middle" font-size="8" font-weight="700" fill="#1d4ed8">SYNTHETIC SEAL</text>
            <text x="0" y="2" text-anchor="middle" font-size="7" fill="#1e40af">AICTE SCRUTINY</text>
            <text x="0" y="16" text-anchor="middle" font-size="8" font-weight="600" fill="#1d4ed8">DEMO 2026</text>
          </g>

          <!-- Fictional Signature -->
          <g transform="translate(480, 40)">
            <path d="M 0 30 Q 30 5, 60 25 T 120 20 T 170 35" fill="none" stroke="#1e293b" stroke-width="2"/>
            <line x1="0" y1="45" x2="180" y2="45" stroke="#94a3b8" stroke-width="1"/>
            <text x="90" y="62" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">Dr. R. K. Bhattacharya (Fictional)</text>
            <text x="90" y="78" text-anchor="middle" font-size="10" fill="#64748b">Competent Scrutiny Authority</text>
          </g>
        </g>

        <!-- Footer Notice -->
        <text x="400" y="1035" text-anchor="middle" font-size="10" fill="#94a3b8">
          This test fixture was generated for SIH PS 26261 validation testing. Not a legal certificate.
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// Helper to generate a realistic fictional infrastructure evidence photograph SVG Data URI
export function generateSyntheticPhotoSvg(
  title: string,
  category: string,
  lat: number,
  lng: number,
  status: string
): string {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380" style="background:#0f172a; font-family:'Segoe UI', Inter, sans-serif;">
      <defs>
        <pattern id="infraGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="600" height="380" fill="url(#infraGrid)"/>
      
      <!-- Frame corners -->
      <path d="M 20 45 L 20 20 L 45 20" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <path d="M 580 45 L 580 20 L 555 20" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <path d="M 20 335 L 20 360 L 45 360" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <path d="M 580 335 L 580 360 L 555 360" stroke="#38bdf8" stroke-width="3" fill="none"/>
      
      <!-- Simulated Camera View Graphic -->
      <circle cx="300" cy="180" r="85" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <polygon points="260,200 300,140 340,200" fill="#0284c7" opacity="0.85"/>
      <rect x="250" y="200" width="100" height="45" fill="#0369a1"/>
      <circle cx="300" cy="180" r="14" fill="#38bdf8" opacity="0.6"/>

      <!-- Geotag & EXIF OSD Overlay -->
      <rect x="30" y="25" width="540" height="38" fill="rgba(15, 23, 42, 0.9)" rx="4"/>
      <text x="45" y="48" fill="#f8fafc" font-size="13" font-weight="700">${title}</text>
      <text x="555" y="48" text-anchor="end" fill="#38bdf8" font-size="11" font-weight="600">${category}</text>

      <rect x="30" y="305" width="540" height="52" fill="rgba(15, 23, 42, 0.9)" rx="4"/>
      <text x="45" y="326" fill="#94a3b8" font-size="11">GPS: ${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E • Verified Hardware Clock</text>
      <text x="45" y="345" fill="#cbd5e1" font-size="10">Automated Triage: Clarity Index 94.8% • Perspective Geometry: Valid • Not Proof of Ownership</text>
      <text x="555" y="336" text-anchor="end" fill="${status === 'Verified' ? '#4ade80' : '#fbbf24'}" font-size="11" font-weight="700">${status.toUpperCase()}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// 10 Synthetic Institutions
export const SYNTHETIC_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-1',
    name: 'National Institute of Advanced Technology & Research',
    code: '1-1092837411',
    aishe_code: 'C-48192',
    institution_type: 'Engineering & Technology',
    address: 'Sector 62, Institutional Area',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    contact_email: 'registrar@niatr-demo.edu.in',
    contact_phone: '+91 120 2998811',
    website: 'https://niatr-demo.edu.in',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-10T09:00:00Z'
  },
  {
    id: 'inst-2',
    name: 'Deccan Polytechnic & Engineering Academy',
    code: '1-2093847522',
    aishe_code: 'C-39102',
    institution_type: 'Polytechnic & Diploma',
    address: 'Survey No. 44, Hilltop Campus',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    contact_email: 'principal@deccanpoly-demo.edu.in',
    contact_phone: '+91 20 25890011',
    website: 'https://deccanpoly-demo.edu.in',
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z'
  },
  {
    id: 'inst-3',
    name: 'Kaveri Institute of Technology and Management',
    code: '1-3049586733',
    aishe_code: 'C-51982',
    institution_type: 'Management & Technical',
    address: 'Outer Ring Road, IT Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    contact_email: 'admin@kaveri-itm-demo.edu.in',
    contact_phone: '+91 80 41235678',
    website: 'https://kaveri-itm-demo.edu.in',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:00:00Z'
  },
  {
    id: 'inst-4',
    name: 'Aravalli College of Pharmacy & Allied Sciences',
    code: '1-4092837444',
    aishe_code: 'C-28471',
    institution_type: 'Pharmacy & Health Sciences',
    address: 'NH-8, Bilaspur Junction',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122413',
    contact_email: 'compliance@aravalli-pharma-demo.edu.in',
    contact_phone: '+91 124 2883399',
    website: 'https://aravalli-pharma-demo.edu.in',
    created_at: '2026-01-18T12:00:00Z',
    updated_at: '2026-01-18T12:00:00Z'
  },
  {
    id: 'inst-5',
    name: 'Malabar Ocean Institute of Maritime Studies',
    code: '1-5093847555',
    aishe_code: 'C-63910',
    institution_type: 'Applied Maritime & Engineering',
    address: 'Willingdon Island Road',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682003',
    contact_email: 'dean@malabar-maritime-demo.edu.in',
    contact_phone: '+91 484 2667788',
    website: 'https://malabar-maritime-demo.edu.in',
    created_at: '2026-01-20T14:00:00Z',
    updated_at: '2026-01-20T14:00:00Z'
  },
  {
    id: 'inst-6',
    name: 'Himalayan Institute of Architecture & Town Planning',
    code: '1-6094857666',
    aishe_code: 'C-18492',
    institution_type: 'Architecture & Applied Arts',
    address: 'Rajpur Road, Foothills Enclave',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248009',
    contact_email: 'office@himalayan-arch-demo.edu.in',
    contact_phone: '+91 135 2774411',
    website: 'https://himalayan-arch-demo.edu.in',
    created_at: '2026-01-22T08:30:00Z',
    updated_at: '2026-01-22T08:30:00Z'
  },
  {
    id: 'inst-7',
    name: 'Brahmaputra Regional Engineering College',
    code: '1-7095867777',
    aishe_code: 'C-72910',
    institution_type: 'Engineering & Technology',
    address: 'Jalukbari Campus',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781014',
    contact_email: 'director@brahmaputra-rec-demo.edu.in',
    contact_phone: '+91 361 2570088',
    website: 'https://brahmaputra-rec-demo.edu.in',
    created_at: '2026-01-25T15:00:00Z',
    updated_at: '2026-01-25T15:00:00Z'
  },
  {
    id: 'inst-8',
    name: 'Vindhya Institute of Computer Applications',
    code: '1-8096877888',
    aishe_code: 'C-40192',
    institution_type: 'MCA & Computer Sciences',
    address: 'Kolar Road Extension',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462042',
    contact_email: 'hod@vindhya-ca-demo.edu.in',
    contact_phone: '+91 755 2498877',
    website: 'https://vindhya-ca-demo.edu.in',
    created_at: '2026-01-28T16:30:00Z',
    updated_at: '2026-01-28T16:30:00Z'
  },
  {
    id: 'inst-9',
    name: 'Thar Desert Institute of Solar & Applied Energy',
    code: '1-9097887999',
    aishe_code: 'C-89102',
    institution_type: 'Renewable Energy & Technology',
    address: 'Mandore Road, Solar Park Zone',
    city: 'Jodhpur',
    state: 'Rajasthan',
    pincode: '342007',
    contact_email: 'academic@thar-solar-demo.edu.in',
    contact_phone: '+91 291 2891122',
    website: 'https://thar-solar-demo.edu.in',
    created_at: '2026-02-01T11:00:00Z',
    updated_at: '2026-02-01T11:00:00Z'
  },
  {
    id: 'inst-10',
    name: 'Coromandel Coastal Institute of Technology',
    code: '1-1002938010',
    aishe_code: 'C-91029',
    institution_type: 'Engineering & Technology',
    address: 'East Coast Road, Sholinganallur',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600119',
    contact_email: 'registrar@coromandel-tech-demo.edu.in',
    contact_phone: '+91 44 24500990',
    website: 'https://coromandel-tech-demo.edu.in',
    created_at: '2026-02-05T13:45:00Z',
    updated_at: '2026-02-05T13:45:00Z'
  }
];

// 10 Synthetic Demonstration Applications
export const SYNTHETIC_APPLICATIONS: Application[] = [
  // -------------------------------------------------------------------------
  // CASE 1: Complete application (All automated checks pass, awaiting official review)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-1',
    application_number: 'AICTE/2026/APP-1001-PASS',
    institution_id: 'inst-1',
    institution: SYNTHETIC_INSTITUTIONS[0],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Awaiting Official Review',
    overall_validation_outcome: 'Passed',
    is_synthetic_demo: true,
    submission_date: '2026-02-10T11:30:00Z',
    created_at: '2026-02-08T09:00:00Z',
    updated_at: '2026-02-10T11:35:00Z',
    documents: [
      {
        id: 'doc-1-1',
        application_id: 'demo-app-1',
        document_type: 'Land Use Certificate',
        original_name: 'NIATR_Land_Use_Certificate_2026.pdf',
        file_path: 'synthetic/demo-app-1/land_use.pdf',
        file_size: 1420000,
        mime_type: 'application/pdf',
        checksum: 'a1b2c3d4e5f60101010101010101010101010101010101010101010101010101',
        ocr_status: 'Completed',
        ocr_confidence: 96.5,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/NOI/2026/891',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2026-01-15'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'LUC/NOI/2026/891',
          issueDate: '2026-01-15',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T09:15:00Z',
        updated_at: '2026-02-08T09:15:00Z'
      },
      {
        id: 'doc-1-2',
        application_id: 'demo-app-1',
        document_type: 'Building Plan Approval',
        original_name: 'NIATR_Sanctioned_Building_Plan.pdf',
        file_path: 'synthetic/demo-app-1/building_plan.pdf',
        file_size: 2850000,
        mime_type: 'application/pdf',
        checksum: 'b2c3d4e5f6010101010101010101010101010101010101010101010101010102',
        ocr_status: 'Completed',
        ocr_confidence: 94.0,
        local_preview_url: generateSyntheticDocSvg(
          'Building Plan Approval',
          'BPA/NOI/7741',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2025-11-20'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'BPA/NOI/7741',
          issueDate: '2025-11-20',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T09:30:00Z',
        updated_at: '2026-02-08T09:30:00Z'
      },
      {
        id: 'doc-1-3',
        application_id: 'demo-app-1',
        document_type: 'Occupancy Certificate',
        original_name: 'NIATR_Permanent_Occupancy.pdf',
        file_path: 'synthetic/demo-app-1/occupancy.pdf',
        file_size: 1980000,
        mime_type: 'application/pdf',
        checksum: 'c3d4e5f601010101010101010101010101010101010101010101010101010103',
        ocr_status: 'Completed',
        ocr_confidence: 98.0,
        local_preview_url: generateSyntheticDocSvg(
          'Occupancy Certificate',
          'OCC/UP/2025/1102',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2025-12-05'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'OCC/UP/2025/1102',
          issueDate: '2025-12-05',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T09:45:00Z',
        updated_at: '2026-02-08T09:45:00Z'
      },
      {
        id: 'doc-1-4',
        application_id: 'demo-app-1',
        document_type: 'Fire Safety Certificate',
        original_name: 'Fire_NOC_Renewal_2026_2027.pdf',
        file_path: 'synthetic/demo-app-1/fire_noc.pdf',
        file_size: 1340000,
        mime_type: 'application/pdf',
        checksum: 'd4e5f60101010101010101010101010101010101010101010101010101010104',
        ocr_status: 'Completed',
        ocr_confidence: 95.2,
        local_preview_url: generateSyntheticDocSvg(
          'Fire Safety Certificate',
          'FIRE/NOC/2026/4401',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2026-01-10',
          '2027-01-09'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'FIRE/NOC/2026/4401',
          issueDate: '2026-01-10',
          expiryDate: '2027-01-09',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T10:00:00Z',
        updated_at: '2026-02-08T10:00:00Z'
      },
      {
        id: 'doc-1-5',
        application_id: 'demo-app-1',
        document_type: 'AICTE Previous Approval Letter',
        original_name: 'AICTE_EoA_Previous_Year_2025_26.pdf',
        file_path: 'synthetic/demo-app-1/previous_eoa.pdf',
        file_size: 2100000,
        mime_type: 'application/pdf',
        checksum: 'e5f6010101010101010101010101010101010101010101010101010101010105',
        ocr_status: 'Completed',
        ocr_confidence: 97.1,
        local_preview_url: generateSyntheticDocSvg(
          'AICTE Previous Approval Letter',
          'AICTE/NORTH/1-1092837411/2025/EOA',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2025-05-18'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'AICTE/NORTH/1-1092837411/2025/EOA',
          issueDate: '2025-05-18',
          academicYear: '2025-2026',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T10:15:00Z',
        updated_at: '2026-02-08T10:15:00Z'
      },
      {
        id: 'doc-1-6',
        application_id: 'demo-app-1',
        document_type: 'Society Registration / Trust Deed',
        original_name: 'Trust_Deed_Registration.pdf',
        file_path: 'synthetic/demo-app-1/trust_deed.pdf',
        file_size: 3200000,
        mime_type: 'application/pdf',
        checksum: 'f601010101010101010101010101010101010101010101010101010101010106',
        ocr_status: 'Completed',
        ocr_confidence: 93.8,
        local_preview_url: generateSyntheticDocSvg(
          'Society Registration / Trust Deed',
          'REG/SOC/UP/1998/552',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '1998-04-12'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'REG/SOC/UP/1998/552',
          issueDate: '1998-04-12',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T10:30:00Z',
        updated_at: '2026-02-08T10:30:00Z'
      },
      {
        id: 'doc-1-7',
        application_id: 'demo-app-1',
        document_type: 'Affidavit (Format 1)',
        original_name: 'Affidavit_Format1_Notarized.pdf',
        file_path: 'synthetic/demo-app-1/affidavit.pdf',
        file_size: 1100000,
        mime_type: 'application/pdf',
        checksum: '0101010101010101010101010101010101010101010101010101010101010107',
        ocr_status: 'Completed',
        ocr_confidence: 96.0,
        local_preview_url: generateSyntheticDocSvg(
          'Affidavit (Format 1)',
          'AFF/NOTARY/2026/088',
          'National Institute of Advanced Technology & Research',
          '1-1092837411',
          '2026-01-20',
          '2027-01-19'
        ),
        extracted_fields: {
          institutionName: 'National Institute of Advanced Technology & Research',
          institutionCode: '1-1092837411',
          documentNumber: 'AFF/NOTARY/2026/088',
          issueDate: '2026-01-20',
          expiryDate: '2027-01-19',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-08T10:45:00Z',
        updated_at: '2026-02-08T10:45:00Z'
      }
    ],
    findings: [
      {
        id: 'f-1-1',
        application_id: 'demo-app-1',
        check_name: 'Mandatory Document Completeness',
        category: 'Document Completeness',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Passed',
        severity: 'Info',
        expected_condition: 'All 7 mandatory documents present for Extension of Approval',
        observed_value: '7 of 7 required documents uploaded and verified',
        explanation: 'All mandatory certificates required under AICTE Approval Process Handbook 2026-2027 are present.',
        evidence_source: 'Document Checklist Evaluation',
        requires_human_review: false,
        created_at: '2026-02-10T11:32:00Z',
        updated_at: '2026-02-10T11:32:00Z'
      },
      {
        id: 'f-1-2',
        application_id: 'demo-app-1',
        check_name: 'Cross-Document Institution Identification',
        category: 'Cross-Document Consistency',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Passed',
        severity: 'Info',
        expected_condition: 'Consistent Institution Name and Permanent Institute ID across all deeds and certificates',
        observed_value: 'Name "National Institute of Advanced Technology & Research" & Code "1-1092837411" consistent in all 7 uploads',
        explanation: 'Automated entity alignment confirmed identical institution credentials on all submitted certificates.',
        evidence_source: 'Named Entity Recognition & Header Analysis',
        requires_human_review: false,
        created_at: '2026-02-10T11:32:00Z',
        updated_at: '2026-02-10T11:32:00Z'
      },
      {
        id: 'f-1-3',
        application_id: 'demo-app-1',
        check_name: 'Fire Safety Certificate Temporal Validity',
        category: 'Date & Validity',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Passed',
        severity: 'Info',
        expected_condition: 'Certificate validity covering academic session 2026-2027',
        observed_value: 'Valid until 2027-01-09',
        explanation: 'Fire safety clearance is active and valid for the entire upcoming academic cycle.',
        evidence_source: 'Temporal Reasoning Engine',
        requires_human_review: false,
        created_at: '2026-02-10T11:32:00Z',
        updated_at: '2026-02-10T11:32:00Z'
      },
      {
        id: 'f-1-4',
        application_id: 'demo-app-1',
        check_name: 'Third-Party Registry Authenticity Confirmation',
        category: 'Authenticity Confirmation',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'Info',
        expected_condition: 'Digital verification against State Revenue / Fire Services / Digilocker API',
        observed_value: 'Authenticity Confirmation Pending (External Registry Unintegrated)',
        explanation: 'Automated document consistency passed internal checks. Live external API verification against issuing state authorities is pending officer confirmation.',
        recommended_action: 'Scrutiny Committee officer to confirm issuing authority credentials or record manual verification reference.',
        evidence_source: 'National Regulatory Gateway Interface',
        requires_human_review: true,
        created_at: '2026-02-10T11:32:00Z',
        updated_at: '2026-02-10T11:32:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-1-1',
        application_id: 'demo-app-1',
        previous_status: 'Draft',
        new_status: 'Submitted',
        actor_name: 'Registrar (Institution)',
        reason: 'Application submitted with all 7 mandatory regulatory attachments.',
        created_at: '2026-02-10T11:30:00Z'
      },
      {
        id: 'sh-1-2',
        application_id: 'demo-app-1',
        previous_status: 'Submitted',
        new_status: 'Awaiting Official Review',
        actor_name: 'AICTE SmartVerify Automated Engine',
        reason: 'All automated completeness, consistency, and temporal checks passed. Transferred to Official Scrutiny Queue.',
        created_at: '2026-02-10T11:33:00Z'
      }
    ],
    infrastructure_evidence: [
      {
        id: 'infra-1-1',
        application_id: 'demo-app-1',
        category: 'Land',
        title: 'Campus Perimeter Boundary & Main Access Road',
        description: 'Geotagged high-resolution visual of the North-East boundary demarcation and 40-foot main approach road.',
        file_url: generateSyntheticPhotoSvg('Campus Boundary & 40ft Main Road', 'Land Infrastructure', 28.535517, 77.209021, 'Verified'),
        file_name: 'Campus_Perimeter_NE_Road.svg',
        uploaded_at: '2026-02-09T09:15:00Z',
        coordinates: { latitude: 28.535517, longitude: 77.209021 },
        timestamp_verified: true,
        clarity_score: 96.5,
        reviewer_status: 'Verified',
        reviewer_notes: 'Clear boundary markers visible. Coordinates match revenue survey parcel 442/B.'
      },
      {
        id: 'infra-1-2',
        application_id: 'demo-app-1',
        category: 'Barrier-Free Access',
        title: 'Barrier-Free Wheelchair Ramp & Elevator Entrance',
        description: 'Architectural ramp gradient (1:12) with tactile floor tiles and braille elevator controls at Academic Block A.',
        file_url: generateSyntheticPhotoSvg('Wheelchair Ramp & Elevator Lobby', 'Barrier-Free Access', 28.53582, 77.20935, 'Verified'),
        file_name: 'Academic_Block_A_Ramp.svg',
        uploaded_at: '2026-02-09T09:25:00Z',
        coordinates: { latitude: 28.53582, longitude: 77.20935 },
        timestamp_verified: true,
        clarity_score: 94.2,
        reviewer_status: 'Verified',
        reviewer_notes: 'Meets National Building Code (NBC 2016) accessibility standards. Handrails confirmed.'
      },
      {
        id: 'infra-1-3',
        application_id: 'demo-app-1',
        category: 'Safety',
        title: 'Dedicated Fire Water Reservoir & Dual Diesel Pump Manifold',
        description: '200,000-liter underground fire water storage tank and dual booster pumps with automated pressure switches.',
        file_url: generateSyntheticPhotoSvg('Fire Pump Manifold & Water Tank', 'Safety Systems', 28.5361, 77.2089, 'Verified'),
        file_name: 'Fire_Safety_Pump_Station.svg',
        uploaded_at: '2026-02-09T09:35:00Z',
        coordinates: { latitude: 28.5361, longitude: 77.2089 },
        timestamp_verified: true,
        clarity_score: 98.0,
        reviewer_status: 'Verified',
        reviewer_notes: 'System matches Fire NOC schematic specification.'
      },
      {
        id: 'infra-1-4',
        application_id: 'demo-app-1',
        category: 'Laboratory',
        title: 'AI & High Performance Computing Research Laboratory',
        description: '60 workstation lab layout with precision air conditioning and separate 3-phase earthing.',
        file_url: generateSyntheticPhotoSvg('AI & HPC Research Facility', 'Laboratory', 28.5357, 77.2097, 'Verified'),
        file_name: 'AI_HPC_Laboratory_Setup.svg',
        uploaded_at: '2026-02-09T09:45:00Z',
        coordinates: { latitude: 28.5357, longitude: 77.2097 },
        timestamp_verified: true,
        clarity_score: 92.5,
        reviewer_status: 'Verified',
        reviewer_notes: 'Workstation spacing complies with APH norms (2.5 sq.m per student).'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 2: Demo review completed (All checks pass, synthetic admin decision recorded)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-2',
    application_number: 'AICTE/2026/APP-1002-REVIEWED',
    institution_id: 'inst-2',
    institution: SYNTHETIC_INSTITUTIONS[1],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Review Completed',
    overall_validation_outcome: 'Passed',
    is_synthetic_demo: true,
    submission_date: '2026-02-01T10:00:00Z',
    created_at: '2026-01-29T14:00:00Z',
    updated_at: '2026-02-04T16:20:00Z',
    documents: [
      {
        id: 'doc-2-1',
        application_id: 'demo-app-2',
        document_type: 'Land Use Certificate',
        original_name: 'Deccan_LandUse_Sanction.pdf',
        file_path: 'synthetic/demo-app-2/land_use.pdf',
        file_size: 1540000,
        mime_type: 'application/pdf',
        checksum: '1102938485750101010101010101010101010101010101010101010101010201',
        ocr_status: 'Completed',
        ocr_confidence: 97.0,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/PUNE/2024/991',
          'Deccan Polytechnic & Engineering Academy',
          '1-2093847522',
          '2024-03-10'
        ),
        extracted_fields: {
          institutionName: 'Deccan Polytechnic & Engineering Academy',
          institutionCode: '1-2093847522',
          documentNumber: 'LUC/PUNE/2024/991',
          issueDate: '2024-03-10',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-01-30T10:00:00Z',
        updated_at: '2026-01-30T10:00:00Z'
      },
      {
        id: 'doc-2-2',
        application_id: 'demo-app-2',
        document_type: 'Building Plan Approval',
        original_name: 'Pune_Municipal_Corp_Approved_Plan.pdf',
        file_path: 'synthetic/demo-app-2/bpa.pdf',
        file_size: 2400000,
        mime_type: 'application/pdf',
        checksum: '1102938485750101010101010101010101010101010101010101010101010202',
        ocr_status: 'Completed',
        ocr_confidence: 98.2,
        local_preview_url: generateSyntheticDocSvg(
          'Building Plan Approval',
          'PMC/BPA/2024/310',
          'Deccan Polytechnic & Engineering Academy',
          '1-2093847522',
          '2024-04-15'
        ),
        extracted_fields: {
          institutionName: 'Deccan Polytechnic & Engineering Academy',
          institutionCode: '1-2093847522',
          documentNumber: 'PMC/BPA/2024/310',
          issueDate: '2024-04-15',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-01-30T10:15:00Z',
        updated_at: '2026-01-30T10:15:00Z'
      },
      {
        id: 'doc-2-3',
        application_id: 'demo-app-2',
        document_type: 'Fire Safety Certificate',
        original_name: 'Maharashtra_Fire_Services_NOC.pdf',
        file_path: 'synthetic/demo-app-2/fire.pdf',
        file_size: 1620000,
        mime_type: 'application/pdf',
        checksum: '1102938485750101010101010101010101010101010101010101010101010203',
        ocr_status: 'Completed',
        ocr_confidence: 96.0,
        local_preview_url: generateSyntheticDocSvg(
          'Fire Safety Certificate',
          'MFS/PUNE/2026/019',
          'Deccan Polytechnic & Engineering Academy',
          '1-2093847522',
          '2026-01-05',
          '2027-01-04'
        ),
        extracted_fields: {
          institutionName: 'Deccan Polytechnic & Engineering Academy',
          institutionCode: '1-2093847522',
          documentNumber: 'MFS/PUNE/2026/019',
          issueDate: '2026-01-05',
          expiryDate: '2027-01-04',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-01-30T10:30:00Z',
        updated_at: '2026-01-30T10:30:00Z'
      }
    ],
    findings: [
      {
        id: 'f-2-1',
        application_id: 'demo-app-2',
        check_name: 'Statutory Norms Compliance',
        category: 'Regulatory Compliance',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Passed',
        severity: 'Info',
        expected_condition: 'Adherence to APH Chapter II norms',
        observed_value: 'Fully compliant with infrastructure and safety criteria',
        explanation: 'All statutory parameters meet AICTE prescribed guidelines.',
        evidence_source: 'Regional Officer Desk Audit',
        requires_human_review: false,
        is_reviewed: true,
        reviewed_by: 'officer-super-admin',
        review_note: 'Verified in order by Regional Scrutiny Officer.',
        created_at: '2026-02-01T10:05:00Z',
        updated_at: '2026-02-04T16:15:00Z'
      }
    ],
    comments: [
      {
        id: 'comm-2-1',
        application_id: 'demo-app-2',
        author_name: 'Dr. V. K. Deshmukh (Regional Scrutiny Officer)',
        comment_type: 'Final Decision',
        decision: 'Approved',
        comment_text: 'SYNTHETIC DEMO DECISION: All uploaded certificates, sanctioned plans, and municipal NOCs have been verified against regional archives. Extension of Approval recommended for AY 2026-2027.',
        created_at: '2026-02-04T16:20:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-2-1',
        application_id: 'demo-app-2',
        previous_status: 'Submitted',
        new_status: 'Under Review',
        actor_name: 'Scrutiny Committee Desk',
        reason: 'Application taken up for comprehensive committee evaluation.',
        created_at: '2026-02-02T09:30:00Z'
      },
      {
        id: 'sh-2-2',
        application_id: 'demo-app-2',
        previous_status: 'Under Review',
        new_status: 'Review Completed',
        actor_name: 'Dr. V. K. Deshmukh (Officer)',
        reason: 'Formal scrutiny concluded; Official Recommendation recorded.',
        created_at: '2026-02-04T16:20:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 3: Missing document (One required certificate missing; Action Required)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-3',
    application_number: 'AICTE/2026/APP-1003-MISSING-DOC',
    institution_id: 'inst-3',
    institution: SYNTHETIC_INSTITUTIONS[2],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Action Required',
    overall_validation_outcome: 'Failed',
    is_synthetic_demo: true,
    submission_date: '2026-02-12T14:15:00Z',
    created_at: '2026-02-11T10:00:00Z',
    updated_at: '2026-02-12T14:20:00Z',
    documents: [
      {
        id: 'doc-3-1',
        application_id: 'demo-app-3',
        document_type: 'Land Use Certificate',
        original_name: 'Kaveri_Land_Record.pdf',
        file_path: 'synthetic/demo-app-3/land_use.pdf',
        file_size: 1720000,
        mime_type: 'application/pdf',
        checksum: '3302938485750101010101010101010101010101010101010101010101010301',
        ocr_status: 'Completed',
        ocr_confidence: 94.5,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/BLR/2025/104',
          'Kaveri Institute of Technology and Management',
          '1-3049586733',
          '2025-08-14'
        ),
        extracted_fields: {
          institutionName: 'Kaveri Institute of Technology and Management',
          institutionCode: '1-3049586733',
          documentNumber: 'LUC/BLR/2025/104',
          issueDate: '2025-08-14',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-11T10:15:00Z',
        updated_at: '2026-02-11T10:15:00Z'
      },
      {
        id: 'doc-3-2',
        application_id: 'demo-app-3',
        document_type: 'Building Plan Approval',
        original_name: 'BBMP_Approved_Floor_Plan.pdf',
        file_path: 'synthetic/demo-app-3/building_plan.pdf',
        file_size: 2150000,
        mime_type: 'application/pdf',
        checksum: '3302938485750101010101010101010101010101010101010101010101010302',
        ocr_status: 'Completed',
        ocr_confidence: 96.0,
        local_preview_url: generateSyntheticDocSvg(
          'Building Plan Approval',
          'BBMP/BPA/2024/991',
          'Kaveri Institute of Technology and Management',
          '1-3049586733',
          '2024-06-20'
        ),
        extracted_fields: {
          institutionName: 'Kaveri Institute of Technology and Management',
          institutionCode: '1-3049586733',
          documentNumber: 'BBMP/BPA/2024/991',
          issueDate: '2024-06-20',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-11T10:30:00Z',
        updated_at: '2026-02-11T10:30:00Z'
      }
      // Note: Fire Safety Certificate and Occupancy Certificate are intentionally MISSING
    ],
    findings: [
      {
        id: 'f-3-1',
        application_id: 'demo-app-3',
        check_name: 'Mandatory Document Completeness',
        category: 'Document Completeness',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Failed',
        severity: 'High',
        expected_condition: 'All mandatory regulatory documents must be attached before submission',
        observed_value: 'Missing Mandatory Documents: Fire Safety Certificate, Occupancy Certificate, Society Registration / Trust Deed, Affidavit (Format 1)',
        explanation: 'Mandatory safety and legal certificates are absent from the submission dossier. AICTE cannot process incomplete applications.',
        recommended_action: 'Upload the missing Fire Safety Certificate and Occupancy Certificate to re-enable evaluation.',
        evidence_source: 'Document Checklist Evaluation',
        requires_human_review: false,
        created_at: '2026-02-12T14:16:00Z',
        updated_at: '2026-02-12T14:16:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-3-1',
        application_id: 'demo-app-3',
        previous_status: 'Draft',
        new_status: 'Submitted',
        actor_name: 'Admin Coordinator (Institution)',
        reason: 'Application submitted for validation.',
        created_at: '2026-02-12T14:15:00Z'
      },
      {
        id: 'sh-3-2',
        application_id: 'demo-app-3',
        previous_status: 'Submitted',
        new_status: 'Action Required',
        actor_name: 'AICTE SmartVerify Automated Engine',
        reason: 'Mandatory statutory documents missing. Application placed on hold.',
        created_at: '2026-02-12T14:16:00Z'
      }
    ],
    infrastructure_evidence: [
      {
        id: 'infra-3-1',
        application_id: 'demo-app-3',
        category: 'Building',
        title: 'Emergency Stairwell & Exit Route View',
        description: 'East wing external fire egress stairway photograph.',
        file_url: generateSyntheticPhotoSvg('Emergency Stairwell East Wing', 'Building Egress', 12.9716, 77.5946, 'Deficiency Found'),
        file_name: 'Stairwell_East_Unreadable.svg',
        uploaded_at: '2026-02-12T14:10:00Z',
        coordinates: { latitude: 12.9716, longitude: 77.5946 },
        timestamp_verified: false,
        clarity_score: 41.2,
        reviewer_status: 'Deficiency Found',
        reviewer_notes: 'Image is underexposed and blurry. Exit signage is illegible and unverified. Physical inspection required.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 4: Expired document (Fire certificate expired in the past; Action Required)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-4',
    application_number: 'AICTE/2026/APP-1004-EXPIRED',
    institution_id: 'inst-4',
    institution: SYNTHETIC_INSTITUTIONS[3],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Action Required',
    overall_validation_outcome: 'Failed',
    is_synthetic_demo: true,
    submission_date: '2026-02-14T09:40:00Z',
    created_at: '2026-02-13T11:00:00Z',
    updated_at: '2026-02-14T09:45:00Z',
    documents: [
      {
        id: 'doc-4-1',
        application_id: 'demo-app-4',
        document_type: 'Fire Safety Certificate',
        original_name: 'Fire_Safety_NOC_2024.pdf',
        file_path: 'synthetic/demo-app-4/fire_expired.pdf',
        file_size: 1280000,
        mime_type: 'application/pdf',
        checksum: '4402938485750101010101010101010101010101010101010101010101010401',
        ocr_status: 'Completed',
        ocr_confidence: 97.2,
        local_preview_url: generateSyntheticDocSvg(
          'Fire Safety Certificate',
          'FIRE/GGN/2023/108',
          'Aravalli College of Pharmacy & Allied Sciences',
          '1-4092837444',
          '2023-08-10',
          '2024-08-09' // Past expiry date!
        ),
        extracted_fields: {
          institutionName: 'Aravalli College of Pharmacy & Allied Sciences',
          institutionCode: '1-4092837444',
          documentNumber: 'FIRE/GGN/2023/108',
          issueDate: '2023-08-10',
          expiryDate: '2024-08-09', // Expired
          isExpired: true,
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-13T11:20:00Z',
        updated_at: '2026-02-13T11:20:00Z'
      }
    ],
    findings: [
      {
        id: 'f-4-1',
        application_id: 'demo-app-4',
        document_id: 'doc-4-1',
        check_name: 'Document Expiry Verification: Fire Safety Certificate',
        category: 'Date & Validity',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Failed',
        severity: 'High',
        expected_condition: 'Valid through current academic year (2026-2027)',
        observed_value: 'Expired on: 2024-08-09',
        explanation: 'The regulatory validity period of Fire Safety Certificate lapsed on 2024-08-09. Operating an educational premises with an expired fire certificate violates safety norms.',
        recommended_action: 'Obtain current renewed certificate from competent local Fire Directorate and re-upload.',
        evidence_source: 'Date Parser & Temporal Reasoning Engine',
        page_reference: 'Page 1, Validity Clause',
        requires_human_review: false,
        created_at: '2026-02-14T09:42:00Z',
        updated_at: '2026-02-14T09:42:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-4-1',
        application_id: 'demo-app-4',
        previous_status: 'Draft',
        new_status: 'Action Required',
        actor_name: 'System',
        reason: 'Automated temporal analysis identified expired fire safety clearance.',
        created_at: '2026-02-14T09:42:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 5: Institution-name mismatch (Needs Review)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-5',
    application_number: 'AICTE/2026/APP-1005-NAME-MISMATCH',
    institution_id: 'inst-5',
    institution: SYNTHETIC_INSTITUTIONS[4],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Needs Review',
    overall_validation_outcome: 'Needs Review',
    is_synthetic_demo: true,
    submission_date: '2026-02-15T12:00:00Z',
    created_at: '2026-02-14T15:00:00Z',
    updated_at: '2026-02-15T12:05:00Z',
    documents: [
      {
        id: 'doc-5-1',
        application_id: 'demo-app-5',
        document_type: 'Land Use Certificate',
        original_name: 'Land_Title_Sanction_2025.pdf',
        file_path: 'synthetic/demo-app-5/land_mismatch.pdf',
        file_size: 1650000,
        mime_type: 'application/pdf',
        checksum: '5502938485750101010101010101010101010101010101010101010101010501',
        ocr_status: 'Completed',
        ocr_confidence: 96.0,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/KOC/2025/892',
          'Cochin Marine Training & Maritime Academy', // Mismatched name!
          '1-5093847555',
          '2025-03-12'
        ),
        extracted_fields: {
          institutionName: 'Cochin Marine Training & Maritime Academy', // Mismatched from Malabar Ocean Institute
          institutionCode: '1-5093847555',
          documentNumber: 'LUC/KOC/2025/892',
          issueDate: '2025-03-12',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-14T15:15:00Z',
        updated_at: '2026-02-14T15:15:00Z'
      }
    ],
    findings: [
      {
        id: 'f-5-1',
        application_id: 'demo-app-5',
        document_id: 'doc-5-1',
        check_name: 'Cross-Document Entity Matching: Land Use Certificate',
        category: 'Cross-Document Consistency',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'High',
        expected_condition: 'Institution Name matching profile: "Malabar Ocean Institute of Maritime Studies"',
        observed_value: 'Extracted Name: "Cochin Marine Training & Maritime Academy"',
        explanation: 'Extracted institution name in Land Use Certificate does not match the registered institution profile name. This could indicate an outdated title, merger, or misfiled document.',
        recommended_action: 'Submit an official name-change NOC or re-upload document with matching registered name.',
        evidence_source: 'Cross-Document Named Entity Recognition',
        page_reference: 'Header Section',
        requires_human_review: true,
        created_at: '2026-02-15T12:02:00Z',
        updated_at: '2026-02-15T12:02:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-5-1',
        application_id: 'demo-app-5',
        previous_status: 'Submitted',
        new_status: 'Needs Review',
        actor_name: 'System',
        reason: 'Institution title ambiguity detected between Land Use Certificate and AICTE profile.',
        created_at: '2026-02-15T12:02:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 6: Institution-code mismatch (Codes differ between documents; Needs Review)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-6',
    application_number: 'AICTE/2026/APP-1006-CODE-MISMATCH',
    institution_id: 'inst-6',
    institution: SYNTHETIC_INSTITUTIONS[5],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Needs Review',
    overall_validation_outcome: 'Needs Review',
    is_synthetic_demo: true,
    submission_date: '2026-02-16T15:20:00Z',
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-16T15:25:00Z',
    documents: [
      {
        id: 'doc-6-1',
        application_id: 'demo-app-6',
        document_type: 'Building Plan Approval',
        original_name: 'Dehradun_Development_Auth_Plan.pdf',
        file_path: 'synthetic/demo-app-6/code_mismatch.pdf',
        file_size: 1890000,
        mime_type: 'application/pdf',
        checksum: '6602938485750101010101010101010101010101010101010101010101010601',
        ocr_status: 'Completed',
        ocr_confidence: 95.0,
        local_preview_url: generateSyntheticDocSvg(
          'Building Plan Approval',
          'MDDA/2025/1109',
          'Himalayan Institute of Architecture & Town Planning',
          '1-9988776655', // Mismatched Code! Profile has 1-6094857666
          '2025-05-10'
        ),
        extracted_fields: {
          institutionName: 'Himalayan Institute of Architecture & Town Planning',
          institutionCode: '1-9988776655', // Differs from 1-6094857666
          documentNumber: 'MDDA/2025/1109',
          issueDate: '2025-05-10',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-15T10:15:00Z',
        updated_at: '2026-02-15T10:15:00Z'
      }
    ],
    findings: [
      {
        id: 'f-6-1',
        application_id: 'demo-app-6',
        document_id: 'doc-6-1',
        check_name: 'Institution Code Alignment: Building Plan Approval',
        category: 'Cross-Document Consistency',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'High',
        expected_condition: 'AICTE Permanent Institute ID: "1-6094857666"',
        observed_value: 'Extracted Institute ID: "1-9988776655"',
        explanation: 'The institute code found on Building Plan Approval differs from the application profile code.',
        recommended_action: 'Verify institute code and re-upload document bearing the correct AICTE Institute ID.',
        evidence_source: 'Header Field Extraction',
        requires_human_review: true,
        created_at: '2026-02-16T15:22:00Z',
        updated_at: '2026-02-16T15:22:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-6-1',
        application_id: 'demo-app-6',
        previous_status: 'Submitted',
        new_status: 'Needs Review',
        actor_name: 'System',
        reason: 'Institution ID code discrepancy identified across building plan header.',
        created_at: '2026-02-16T15:22:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 7: Duplicate document (Identical synthetic files / checksums trigger warning)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-7',
    application_number: 'AICTE/2026/APP-1007-DUPLICATE',
    institution_id: 'inst-7',
    institution: SYNTHETIC_INSTITUTIONS[6],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Needs Review',
    overall_validation_outcome: 'Needs Review',
    is_synthetic_demo: true,
    submission_date: '2026-02-17T11:00:00Z',
    created_at: '2026-02-16T14:00:00Z',
    updated_at: '2026-02-17T11:05:00Z',
    documents: [
      {
        id: 'doc-7-1',
        application_id: 'demo-app-7',
        document_type: 'Land Use Certificate',
        original_name: 'Brahmaputra_Sanction_Doc.pdf',
        file_path: 'synthetic/demo-app-7/doc_a.pdf',
        file_size: 1500000,
        mime_type: 'application/pdf',
        checksum: '7777777777777777777777777777777777777777777777777777777777777777', // Identical hash
        ocr_status: 'Completed',
        ocr_confidence: 94.0,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/GHY/2025/441',
          'Brahmaputra Regional Engineering College',
          '1-7095867777',
          '2025-06-11'
        ),
        created_at: '2026-02-16T14:15:00Z',
        updated_at: '2026-02-16T14:15:00Z'
      },
      {
        id: 'doc-7-2',
        application_id: 'demo-app-7',
        document_type: 'Occupancy Certificate',
        original_name: 'Brahmaputra_Sanction_Doc_Copy.pdf',
        file_path: 'synthetic/demo-app-7/doc_b.pdf',
        file_size: 1500000,
        mime_type: 'application/pdf',
        checksum: '7777777777777777777777777777777777777777777777777777777777777777', // Identical hash!
        ocr_status: 'Completed',
        ocr_confidence: 94.0,
        local_preview_url: generateSyntheticDocSvg(
          'Occupancy Certificate (Accidental Duplicate Upload)',
          'LUC/GHY/2025/441',
          'Brahmaputra Regional Engineering College',
          '1-7095867777',
          '2025-06-11'
        ),
        created_at: '2026-02-16T14:30:00Z',
        updated_at: '2026-02-16T14:30:00Z'
      }
    ],
    findings: [
      {
        id: 'f-7-1',
        application_id: 'demo-app-7',
        check_name: 'File Duplicate Checksum Flag',
        category: 'Duplicate & Integrity',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'Medium',
        expected_condition: 'Distinct document files for distinct regulatory requirements',
        observed_value: 'Identical SHA-256 hash detected across Land Use Certificate and Occupancy Certificate',
        explanation: 'Multiple upload slots contain the identical binary file (Hash: 77777777...). While this may be an accidental double-upload, each regulatory slot requires its distinct certificate.',
        recommended_action: 'Review uploaded files and replace duplicate uploads with the correct certificates.',
        evidence_source: 'Cryptographic SHA-256 Checksum Engine',
        requires_human_review: true,
        created_at: '2026-02-17T11:02:00Z',
        updated_at: '2026-02-17T11:02:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-7-1',
        application_id: 'demo-app-7',
        previous_status: 'Submitted',
        new_status: 'Needs Review',
        actor_name: 'System',
        reason: 'Duplicate file checksum flagged between two distinct regulatory slots.',
        created_at: '2026-02-17T11:02:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 8: Poor-quality scan (Low readability / OCR uncertainty triggers manual review)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-8',
    application_number: 'AICTE/2026/APP-1008-LOW-QUALITY',
    institution_id: 'inst-8',
    institution: SYNTHETIC_INSTITUTIONS[7],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Needs Review',
    overall_validation_outcome: 'Needs Review',
    is_synthetic_demo: true,
    submission_date: '2026-02-18T16:00:00Z',
    created_at: '2026-02-17T15:00:00Z',
    updated_at: '2026-02-18T16:05:00Z',
    documents: [
      {
        id: 'doc-8-1',
        application_id: 'demo-app-8',
        document_type: 'Fire Safety Certificate',
        original_name: 'Scanned_Fire_NOC_LowRes.jpg',
        file_path: 'synthetic/demo-app-8/fire_blur.jpg',
        file_size: 420000,
        mime_type: 'image/jpeg',
        checksum: '8802938485750101010101010101010101010101010101010101010101010801',
        ocr_status: 'Low Readability',
        ocr_confidence: 42.5, // Low OCR confidence score
        local_preview_url: generateSyntheticDocSvg(
          'Fire Safety Certificate (Low Contrast / Blurred Scan)',
          'FIRE/BPL/2025/???',
          'Vindhya Institute of Computer Applications',
          '1-8096877888',
          '2025-07-??',
          '2026-07-??',
          true // Blurred flag enabled
        ),
        created_at: '2026-02-17T15:15:00Z',
        updated_at: '2026-02-17T15:15:00Z'
      }
    ],
    findings: [
      {
        id: 'f-8-1',
        application_id: 'demo-app-8',
        document_id: 'doc-8-1',
        check_name: 'Visual Clarity & DPI Quality: Fire Safety Certificate',
        category: 'File Validity',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'Medium',
        expected_condition: 'Scan resolution >= 200 DPI with readable contrast',
        observed_value: 'Readability score uncertain (42.5% confidence)',
        explanation: 'Document scan exhibits blur, low contrast, or skew. Automated OCR confidence is below standard threshold (60%).',
        recommended_action: 'Admin verification required, or institution may re-upload a higher DPI color scan.',
        evidence_source: 'OCR Engine Character Confidence Metrics',
        requires_human_review: true,
        created_at: '2026-02-18T16:02:00Z',
        updated_at: '2026-02-18T16:02:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-8-1',
        application_id: 'demo-app-8',
        previous_status: 'Submitted',
        new_status: 'Needs Review',
        actor_name: 'System',
        reason: 'Low OCR confidence triggered mandatory human visual verification.',
        created_at: '2026-02-18T16:02:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 9: Corrupt PDF (Preview displays controlled, understandable error)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-9',
    application_number: 'AICTE/2026/APP-1009-CORRUPT-FILE',
    institution_id: 'inst-9',
    institution: SYNTHETIC_INSTITUTIONS[8],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Action Required',
    overall_validation_outcome: 'Failed',
    is_synthetic_demo: true,
    submission_date: '2026-02-19T09:10:00Z',
    created_at: '2026-02-18T11:00:00Z',
    updated_at: '2026-02-19T09:15:00Z',
    documents: [
      {
        id: 'doc-9-1',
        application_id: 'demo-app-9',
        document_type: 'Occupancy Certificate',
        original_name: 'Municipal_Occupancy_Damaged.pdf',
        file_path: 'synthetic/demo-app-9/damaged_corrupt.pdf',
        file_size: 48000,
        mime_type: 'application/pdf',
        checksum: '9902938485750101010101010101010101010101010101010101010101010901',
        is_corrupt: true, // Marked as corrupt
        ocr_status: 'Failed',
        local_preview_url: generateSyntheticDocSvg(
          'Corrupted Stream',
          'CORRUPT-999',
          'Thar Desert Institute',
          '1-9097887999',
          '2026-01-01',
          undefined,
          false,
          true // Corrupt flag enabled!
        ),
        created_at: '2026-02-18T11:15:00Z',
        updated_at: '2026-02-18T11:15:00Z'
      }
    ],
    findings: [
      {
        id: 'f-9-1',
        application_id: 'demo-app-9',
        document_id: 'doc-9-1',
        check_name: 'File Integrity & Readable Header: Occupancy Certificate',
        category: 'File Validity',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Failed',
        severity: 'High',
        expected_condition: 'Valid PDF/image header with readable stream',
        observed_value: 'File payload is corrupt or unreadable (EOF premature)',
        explanation: 'The uploaded file "Municipal_Occupancy_Damaged.pdf" could not be parsed by the document renderer. Scanners or file transmission may have corrupted the file stream.',
        recommended_action: 'Re-scan or export the document cleanly as a valid PDF/PNG and re-upload.',
        evidence_source: 'File Header Byte Inspection',
        requires_human_review: true,
        created_at: '2026-02-19T09:12:00Z',
        updated_at: '2026-02-19T09:12:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-9-1',
        application_id: 'demo-app-9',
        previous_status: 'Draft',
        new_status: 'Action Required',
        actor_name: 'System',
        reason: 'Corrupted PDF file structure detected. Re-upload required from institution.',
        created_at: '2026-02-19T09:12:00Z'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // CASE 10: Authenticity pending (Basic checks pass, external authenticity pending)
  // -------------------------------------------------------------------------
  {
    id: 'demo-app-10',
    application_number: 'AICTE/2026/APP-1010-AUTH-PENDING',
    institution_id: 'inst-10',
    institution: SYNTHETIC_INSTITUTIONS[9],
    application_type: 'Extension of Approval (EoA)',
    academic_year: '2026-2027',
    status: 'Authenticity Confirmation Pending',
    overall_validation_outcome: 'Needs Review',
    is_synthetic_demo: true,
    submission_date: '2026-02-20T10:30:00Z',
    created_at: '2026-02-19T14:00:00Z',
    updated_at: '2026-02-20T10:35:00Z',
    documents: [
      {
        id: 'doc-10-1',
        application_id: 'demo-app-10',
        document_type: 'Land Use Certificate',
        original_name: 'Coromandel_LandUse_Deed.pdf',
        file_path: 'synthetic/demo-app-10/land.pdf',
        file_size: 1950000,
        mime_type: 'application/pdf',
        checksum: '1002938485750101010101010101010101010101010101010101010101011001',
        ocr_status: 'Completed',
        ocr_confidence: 96.0,
        local_preview_url: generateSyntheticDocSvg(
          'Land Use Certificate',
          'LUC/CHN/2025/711',
          'Coromandel Coastal Institute of Technology',
          '1-1002938010',
          '2025-09-01'
        ),
        extracted_fields: {
          institutionName: 'Coromandel Coastal Institute of Technology',
          institutionCode: '1-1002938010',
          documentNumber: 'LUC/CHN/2025/711',
          issueDate: '2025-09-01',
          hasSeal: true,
          hasSignature: true
        },
        created_at: '2026-02-19T14:20:00Z',
        updated_at: '2026-02-19T14:20:00Z'
      }
    ],
    findings: [
      {
        id: 'f-10-1',
        application_id: 'demo-app-10',
        check_name: 'Third-Party Registry Authenticity Confirmation',
        category: 'Authenticity Confirmation',
        policy_id: 'AICTE-APH-2026-V1.2',
        result: 'Needs Review',
        severity: 'Info',
        expected_condition: 'Digital verification against State Revenue / Fire Services / Digilocker API',
        observed_value: 'Authenticity Confirmation Pending (External Registry Unintegrated)',
        explanation: 'Internal document consistency checks passed. However, live API verification against issuing state authorities is currently pending official officer confirmation.',
        recommended_action: 'Scrutiny Committee officer to verify issuing authority credentials or record manual verification reference.',
        evidence_source: 'National Regulatory Gateway Interface',
        requires_human_review: true,
        created_at: '2026-02-20T10:32:00Z',
        updated_at: '2026-02-20T10:32:00Z'
      }
    ],
    status_history: [
      {
        id: 'sh-10-1',
        application_id: 'demo-app-10',
        previous_status: 'Submitted',
        new_status: 'Authenticity Confirmation Pending',
        actor_name: 'AICTE SmartVerify Automated Engine',
        reason: 'Basic automated checks pass, but external state registry confirmation is pending.',
        created_at: '2026-02-20T10:32:00Z'
      }
    ]
  }
];
