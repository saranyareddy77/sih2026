-- AICTE SmartVerify — Synthetic Demonstration Data Seed Script
-- SIH Problem Statement 26261
-- Repeatable seed script: uses ON CONFLICT DO NOTHING to preserve real data

-- 1. SEED 10 SYNTHETIC INSTITUTIONS
insert into public.institutions (id, name, code, aishe_code, institution_type, address, city, state, pincode, contact_email, contact_phone, website)
values 
  ('a0000000-0000-0000-0000-000000000001', 'National Institute of Advanced Technology & Research', '1-1092837411', 'C-48192', 'Engineering & Technology', 'Sector 62, Institutional Area', 'Noida', 'Uttar Pradesh', '201309', 'registrar@niatr-demo.edu.in', '+91 120 2998811', 'https://niatr-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000002', 'Deccan Polytechnic & Engineering Academy', '1-2093847522', 'C-39102', 'Polytechnic & Diploma', 'Survey No. 44, Hilltop Campus', 'Pune', 'Maharashtra', '411038', 'principal@deccanpoly-demo.edu.in', '+91 20 25890011', 'https://deccanpoly-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000003', 'Kaveri Institute of Technology and Management', '1-3049586733', 'C-51982', 'Management & Technical', 'Outer Ring Road, IT Corridor', 'Bengaluru', 'Karnataka', '560103', 'admin@kaveri-itm-demo.edu.in', '+91 80 41235678', 'https://kaveri-itm-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000004', 'Aravalli College of Pharmacy & Allied Sciences', '1-4092837444', 'C-28471', 'Pharmacy & Health Sciences', 'NH-8, Bilaspur Junction', 'Gurugram', 'Haryana', '122413', 'compliance@aravalli-pharma-demo.edu.in', '+91 124 2883399', 'https://aravalli-pharma-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000005', 'Malabar Ocean Institute of Maritime Studies', '1-5093847555', 'C-63910', 'Applied Maritime & Engineering', 'Willingdon Island Road', 'Kochi', 'Kerala', '682003', 'dean@malabar-maritime-demo.edu.in', '+91 484 2667788', 'https://malabar-maritime-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000006', 'Himalayan Institute of Architecture & Town Planning', '1-6094857666', 'C-18492', 'Architecture & Applied Arts', 'Rajpur Road, Foothills Enclave', 'Dehradun', 'Uttarakhand', '248009', 'office@himalayan-arch-demo.edu.in', '+91 135 2774411', 'https://himalayan-arch-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000007', 'Brahmaputra Regional Engineering College', '1-7095867777', 'C-72910', 'Engineering & Technology', 'Jalukbari Campus', 'Guwahati', 'Assam', '781014', 'director@brahmaputra-rec-demo.edu.in', '+91 361 2570088', 'https://brahmaputra-rec-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000008', 'Vindhya Institute of Computer Applications', '1-8096877888', 'C-40192', 'MCA & Computer Sciences', 'Kolar Road Extension', 'Bhopal', 'Madhya Pradesh', '462042', 'hod@vindhya-ca-demo.edu.in', '+91 755 2498877', 'https://vindhya-ca-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000009', 'Thar Desert Institute of Solar & Applied Energy', '1-9097887999', 'C-89102', 'Renewable Energy & Technology', 'Mandore Road, Solar Park Zone', 'Jodhpur', 'Rajasthan', '342007', 'academic@thar-solar-demo.edu.in', '+91 291 2891122', 'https://thar-solar-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000010', 'Coromandel Coastal Institute of Technology', '1-1002938010', 'C-91029', 'Engineering & Technology', 'East Coast Road, Sholinganallur', 'Chennai', 'Tamil Nadu', '600119', 'registrar@coromandel-tech-demo.edu.in', '+91 44 24500990', 'https://coromandel-tech-demo.edu.in')
on conflict (id) do nothing;

-- 2. SEED 10 MANDATORY SYNTHETIC DEMONSTRATION APPLICATIONS
insert into public.applications (id, application_number, institution_id, application_type, academic_year, status, overall_validation_outcome, is_synthetic_demo, submission_date)
values
  -- Case 1: Complete application
  ('b0000000-0000-0000-0000-000000000001', 'AICTE/2026/APP-1001-PASS', 'a0000000-0000-0000-0000-000000000001', 'Extension of Approval (EoA)', '2026-2027', 'Awaiting Official Review', 'Passed', true, '2026-02-10 11:30:00+00'),
  -- Case 2: Demo review completed
  ('b0000000-0000-0000-0000-000000000002', 'AICTE/2026/APP-1002-REVIEWED', 'a0000000-0000-0000-0000-000000000002', 'Extension of Approval (EoA)', '2026-2027', 'Review Completed', 'Passed', true, '2026-02-01 10:00:00+00'),
  -- Case 3: Missing document
  ('b0000000-0000-0000-0000-000000000003', 'AICTE/2026/APP-1003-MISSING-DOC', 'a0000000-0000-0000-0000-000000000003', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-12 14:15:00+00'),
  -- Case 4: Expired document
  ('b0000000-0000-0000-0000-000000000004', 'AICTE/2026/APP-1004-EXPIRED', 'a0000000-0000-0000-0000-000000000004', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-14 09:40:00+00'),
  -- Case 5: Institution-name mismatch
  ('b0000000-0000-0000-0000-000000000005', 'AICTE/2026/APP-1005-NAME-MISMATCH', 'a0000000-0000-0000-0000-000000000005', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-15 12:00:00+00'),
  -- Case 6: Institution-code mismatch
  ('b0000000-0000-0000-0000-000000000006', 'AICTE/2026/APP-1006-CODE-MISMATCH', 'a0000000-0000-0000-0000-000000000006', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-16 15:20:00+00'),
  -- Case 7: Duplicate document
  ('b0000000-0000-0000-0000-000000000007', 'AICTE/2026/APP-1007-DUPLICATE', 'a0000000-0000-0000-0000-000000000007', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-17 11:00:00+00'),
  -- Case 8: Poor-quality scan
  ('b0000000-0000-0000-0000-000000000008', 'AICTE/2026/APP-1008-LOW-QUALITY', 'a0000000-0000-0000-0000-000000000008', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-18 16:00:00+00'),
  -- Case 9: Corrupt PDF
  ('b0000000-0000-0000-0000-000000000009', 'AICTE/2026/APP-1009-CORRUPT-FILE', 'a0000000-0000-0000-0000-000000000009', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-19 09:10:00+00'),
  -- Case 10: Authenticity pending
  ('b0000000-0000-0000-0000-000000000010', 'AICTE/2026/APP-1010-AUTH-PENDING', 'a0000000-0000-0000-0000-000000000010', 'Extension of Approval (EoA)', '2026-2027', 'Authenticity Confirmation Pending', 'Needs Review', true, '2026-02-20 10:30:00+00')
on conflict (id) do nothing;

-- 3. SEED ILLUSTRATIVE FINDINGS FOR THE CASES
insert into public.validation_findings (id, application_id, check_name, category, policy_id, result, severity, explanation, requires_human_review)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mandatory Document Completeness', 'Document Completeness', 'AICTE-APH-2026-V1.2', 'Passed', 'Info', 'All mandatory certificates required under APH 2026-2027 are present.', false),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Mandatory Document Completeness', 'Document Completeness', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'Mandatory safety and legal certificates are absent from the submission dossier.', false),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Fire Safety Certificate Temporal Validity', 'Date & Validity', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'The regulatory validity period of Fire Safety Certificate lapsed on 2024-08-09.', false),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Cross-Document Entity Matching', 'Cross-Document Consistency', 'AICTE-APH-2026-V1.2', 'Needs Review', 'High', 'Extracted name does not match the registered institution profile name.', true),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'Institution Code Alignment', 'Cross-Document Consistency', 'AICTE-APH-2026-V1.2', 'Needs Review', 'High', 'The institute code found on Building Plan Approval differs from application profile.', true),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'File Duplicate Checksum Flag', 'Duplicate & Integrity', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Medium', 'Identical SHA-256 hash detected across distinct regulatory document slots.', true),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'Visual Clarity & DPI Quality', 'File Validity', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Medium', 'Document scan exhibits blur or low contrast below confidence threshold.', true),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'File Integrity & Readable Header', 'File Validity', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'The uploaded file payload is corrupt or unreadable.', true),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'Third-Party Registry Authenticity', 'Authenticity Confirmation', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Info', 'Internal consistency passed; external live state registry verification is pending.', true)
on conflict (id) do nothing;
